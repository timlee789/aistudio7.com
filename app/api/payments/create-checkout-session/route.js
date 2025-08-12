import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma-new';

// Mock Stripe integration - In production, you would use actual Stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: async (options) => {
        // Generate a mock session ID
        const sessionId = `cs_test_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          id: sessionId,
          url: `${process.env.NEXTAUTH_URL}/payment/checkout?session_id=${sessionId}&amount=${options.line_items[0].price_data.unit_amount / 100}&service=${encodeURIComponent(options.metadata.serviceName)}&type=${options.metadata.serviceType}`
        };
      }
    }
  }
};

export async function POST(request) {
  console.log('💰 === Payment Session API Called ===');
  try {
    // Debug: Check all cookies
    const allCookies = request.cookies.getAll();
    console.log('🍪 Payment API: All cookies received:', allCookies);
    
    // Check authentication
    const token = request.cookies.get('token')?.value;
    console.log('🍪 Payment API: Token found:', !!token);
    if (token) {
      console.log('🍪 Payment API: Token length:', token.length);
      console.log('🍪 Payment API: Token start:', token.substring(0, 20) + '...');
    }
    
    if (!token) {
      console.log('❌ Payment API: No token provided');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Payment API: Token decoded successfully for user:', decoded.email, '| User ID:', decoded.userId);
    } catch (error) {
      console.log('❌ Payment API: Token verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    console.log('Request body:', body);
    const { serviceType, serviceName, amount, serviceDetails } = body;

    if (!serviceType || !serviceName || !amount) {
      console.log('Missing required fields:', { serviceType, serviceName, amount });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        serviceType: serviceType,
        serviceName: serviceName,
        serviceDetails: serviceDetails ? JSON.stringify(serviceDetails) : null,
        userId: decoded.userId,
        status: 'PENDING'
      }
    });

    // Create Stripe checkout session (using mock for now)
    const session = await mockStripe.checkout.sessions.create({
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
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/services`,
      metadata: {
        paymentId: payment.id,
        serviceName: serviceName,
        serviceType: serviceType,
      },
    });

    // Update payment with Stripe session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id }
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('=== Payment Creation Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=======================');
    return NextResponse.json(
      { error: 'Failed to create payment session', details: error.message },
      { status: 500 }
    );
  }
}