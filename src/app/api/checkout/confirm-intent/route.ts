import { NextRequest, NextResponse } from 'next/server';
import { createRyeClient } from '@/lib/rye';

interface ConfirmIntentRequest {
  checkoutIntentId: string;
  paymentMethodId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmIntentRequest = await request.json();

    // Validate required fields
    if (!body.checkoutIntentId || !body.paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields: checkoutIntentId and paymentMethodId are required' },
        { status: 400 }
      );
    }

    // Get client IP for Rye API
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    '127.0.0.1';

    // Initialize Rye client
    const ryeClient = createRyeClient({
      apiKey: process.env.RYE_API_KEY!,
      shopperIp: clientIp,
      environment: process.env.RYE_ENVIRONMENT as 'staging' | 'production' || 'staging',
    });

    // Confirm checkout intent with payment method
    const confirmedIntent = await ryeClient.confirmCheckoutIntent(
      body.checkoutIntentId,
      {
        paymentMethod: {
          type: 'stripe_token',
          stripeToken: body.paymentMethodId, // 'tok_visa', // You can use tok_visa for testing if tokenization isn't setup, yet.
        },
      }
    );

    return NextResponse.json({
      success: true,
      checkoutIntent: confirmedIntent,
      message: 'Payment confirmed successfully',
    });

  } catch (error) {
    console.error('Error confirming checkout intent:', error);

    return NextResponse.json(
      {
        error: 'Failed to confirm payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
