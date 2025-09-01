import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import { createId } from '@paralleldrive/cuid2';
import Stripe from 'stripe';

// Initialize Stripe only if secret key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

// Mock Stripe fallback for development when keys are not set
const mockStripe = {
  checkout: {
    sessions: {
      create: async (options) => {
        console.warn('🚨 Using Mock Stripe - Set STRIPE_SECRET_KEY for real payments');
        const sessionId = `cs_test_${Math.random().toString(36).substr(2, 9)}`;
        
        const mockSession = {
          id: sessionId,
          url: `https://www.aistudio7.com/payment/checkout?session_id=${sessionId}&amount=${options.line_items[0].price_data.unit_amount / 100}&service=${encodeURIComponent(options.metadata.serviceName)}&type=${options.metadata.serviceType}`
        };

        // Don't provide client_secret for mock - this will trigger fallback to regular checkout
        return mockSession;
      }
    }
  }
};

// Use real Stripe if initialized, otherwise mock
const stripeClient = stripe ? stripe : mockStripe;

export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { serviceType, serviceName, amount, serviceDetails, embedded } = body;

    if (!serviceType || !serviceName || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await client.connect();

    // Create payment record in database
    const paymentId = createId();
    const insertResult = await client.query(`
      INSERT INTO payments (
        id, amount, "serviceType", "serviceName", "serviceDetails", 
        "userId", status, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [
      paymentId,
      parseFloat(amount),
      serviceType,
      serviceName,
      serviceDetails ? JSON.stringify(serviceDetails) : null,
      decoded.userId,
      'PENDING'
    ]);

    const payment = insertResult.rows[0];

    
    // Create Stripe checkout session
    let sessionConfig;
    
    if (embedded && stripeClient !== mockStripe) {
      // Embedded checkout configuration - use different approach
      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: serviceName,
                description: serviceDetails?.description || `Payment for ${serviceName}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        ui_mode: 'embedded',
        redirect_on_completion: 'never',
        metadata: {
          paymentId: payment.id,
          serviceName: serviceName,
          serviceType: serviceType,
        },
      };
    } else {
      // Regular hosted checkout configuration
      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: serviceName,
                description: serviceDetails?.description || `Payment for ${serviceName}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `https://www.aistudio7.com/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://www.aistudio7.com/portfolio`,
        metadata: {
          paymentId: payment.id,
          serviceName: serviceName,
          serviceType: serviceType,
        },
      };
    }

    const session = await stripeClient.checkout.sessions.create(sessionConfig);

    // Debug logging for embedded checkout
    if (embedded && stripeClient !== mockStripe) {
      console.log('Embedded checkout session created:', {
        id: session.id,
        ui_mode: session.ui_mode,
        client_secret: session.client_secret ? 'Present' : 'Missing',
        client_secret_length: session.client_secret ? session.client_secret.length : 0
      });
    }

    // Update payment with Stripe session ID
    await client.query(
      'UPDATE payments SET "stripeSessionId" = $1, "updatedAt" = NOW() WHERE id = $2',
      [session.id, payment.id]
    );

    await client.end();

    const response = {
      success: true,
      sessionId: session.id,
    };

    // Add client_secret for embedded checkout only
    if (embedded && stripeClient !== mockStripe && session.client_secret) {
      // Log the raw client_secret to debug
      console.log('Raw client_secret from Stripe:', session.client_secret.substring(0, 50) + '...');
      console.log('Client_secret length:', session.client_secret.length);
      console.log('Client_secret contains %:', session.client_secret.includes('%'));
      
      // Important: Do NOT encode the client_secret, pass it as-is
      response.clientSecret = session.client_secret;
      
      console.log('Response client_secret preview:', response.clientSecret.substring(0, 50) + '...');
    } else {
      // For regular checkout, provide the URL
      response.url = session.url;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Payment Creation Error:', error.message);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json(
      { error: 'Failed to create payment session', details: error.message },
      { status: 500 }
    );
  }
}