import { NextResponse } from 'next/server';
import { Client } from 'pg';
import Stripe from 'stripe';

// Initialize Stripe only if secret key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

export async function POST(request) {
  // Check if Stripe is initialized
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured - set STRIPE_SECRET_KEY environment variable' },
      { status: 503 }
    );
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    await client.connect();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Update payment status in database
        await client.query(
          'UPDATE payments SET status = $1, "updatedAt" = NOW(), "paidAt" = NOW() WHERE id = $2',
          ['COMPLETED', session.metadata.paymentId]
        );
        
        console.log('Payment completed:', session.metadata.paymentId);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        
        // Update payment status to failed
        await client.query(
          'UPDATE payments SET status = $1, "updatedAt" = NOW() WHERE id = $2',
          ['FAILED', session.metadata.paymentId]
        );
        
        console.log('Payment expired:', session.metadata.paymentId);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    await client.end();
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}