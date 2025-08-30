import { NextRequest, NextResponse } from 'next/server';
import { createRyeClient, type CreateCheckoutIntentRequest } from '@/lib/rye';

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutIntentRequest = await request.json();

    // Validate required fields
    if (!body.buyer || !body.productUrl || !body.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: buyer, productUrl, and quantity are required' },
        { status: 400 }
      );
    }

    // Validate buyer information
    const { buyer } = body;
    const requiredBuyerFields = [
      'firstName', 'lastName', 'email', 'phone',
      'address1', 'city', 'province', 'country', 'postalCode'
    ];

    for (const field of requiredBuyerFields) {
      if (!buyer[field as keyof typeof buyer]) {
        return NextResponse.json(
          { error: `Missing required buyer field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Get client IP for Rye API
    const clientIp = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Initialize Rye client
    const ryeClient = createRyeClient({
      apiKey: process.env.RYE_API_KEY!,
      baseUrl: process.env.RYE_API_BASE!,
    });

    // Create checkout intent
    const checkoutIntent = await ryeClient.createCheckoutIntent(body);

    return NextResponse.json({
      success: true,
      checkoutIntent,
    });

  } catch (error) {
    console.error('Error creating checkout intent:', error);

    return NextResponse.json(
      {
        error: 'Failed to create checkout intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
