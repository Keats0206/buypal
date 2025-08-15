export interface RyeClientConfig {
  apiKey: string;
  shopperIp: string;
  environment?: 'staging' | 'production';
}

export interface Buyer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

export interface CreateCheckoutIntentRequest {
  buyer: Buyer;
  quantity: number;
  productUrl: string;
}

export interface CheckoutIntent {
  id: string;
  buyer: Buyer;
  quantity: number;
  productUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Add other fields as needed based on Rye API response
}

export interface ConfirmCheckoutIntentRequest {
  paymentMethod?: {
    type: string;
    stripeToken: string;
  };
  // Add other confirmation fields as needed
}

export class RyeClient {
  private apiKey: string;
  private shopperIp: string;
  private baseUrl: string;

  constructor(config: RyeClientConfig) {
    this.apiKey = config.apiKey;
    this.shopperIp = config.shopperIp;

    // Set base URL based on environment
    const environment = config.environment || 'staging';
    this.baseUrl = environment === 'staging'
      ? 'https://staging.api.rye.com'
      : 'https://api.rye.com';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Shopper-IP': this.shopperIp,
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
