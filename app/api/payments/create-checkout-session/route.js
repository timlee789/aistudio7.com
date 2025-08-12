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
    const { serviceType, serviceName, amount, serviceDetails } = body;

    if (!serviceType || !serviceName || !amount) {
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
    console.error('Payment Creation Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to create payment session', details: error.message },
      { status: 500 }
    );
  }
}