import { NextRequest, NextResponse } from 'next/server';
import { createRyeClient } from '@/lib/rye';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutIntentId = searchParams.get('checkoutIntentId');

    // Validate required fields
    if (!checkoutIntentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: checkoutIntentId' },
        { status: 400 }
      );
    }

    // Initialize Rye client
    const ryeClient = createRyeClient({
      apiKey: process.env.RYE_API_KEY!,
      baseUrl: process.env.RYE_API_BASE!,
    });

    // Get checkout intent
    const checkoutIntent = await ryeClient.getCheckoutIntent(checkoutIntentId);

    return NextResponse.json({
      success: true,
      checkoutIntent,
    });

  } catch (error) {
    console.error('Error fetching checkout intent:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch checkout intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
