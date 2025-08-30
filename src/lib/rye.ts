import { Buyer, CheckoutIntent } from "./types";

export interface RyeClientConfig {
  apiKey: string;
  baseUrl: string;
}

export interface CreateCheckoutIntentRequest {
  buyer: Buyer;
  quantity: number;
  productUrl: string;
}

export interface ConfirmCheckoutIntentRequest {
  paymentMethod?: {
    type: string;
    stripeToken: string;
  };
}

export class RyeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: RyeClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Rye API Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error: ${error}`);
    }
  }

  /**
   * Create a new checkout intent
   */
  async createCheckoutIntent(request: CreateCheckoutIntentRequest): Promise<CheckoutIntent> {
    return this.makeRequest<CheckoutIntent>('/api/v1/checkout-intents', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get a checkout intent by ID
   */
  async getCheckoutIntent(id: string): Promise<CheckoutIntent> {
    return this.makeRequest<CheckoutIntent>(`/api/v1/checkout-intents/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Confirm a checkout intent
   */
  async confirmCheckoutIntent(
    id: string,
    request: ConfirmCheckoutIntentRequest
  ): Promise<CheckoutIntent> {
    return this.makeRequest<CheckoutIntent>(`/api/v1/checkout-intents/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Export a default instance factory function for convenience
export function createRyeClient(config: RyeClientConfig): RyeClient {
  return new RyeClient(config);
}
