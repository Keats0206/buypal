'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { ShoppingProduct } from '@/tools/types';
import { CheckoutIntent } from '@/lib/rye';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BuyerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: (product: ShoppingProduct, checkoutIntent: CheckoutIntent) => void;
  product: ShoppingProduct;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

function CheckoutForm({ product, onClose, onOrderComplete }: { product: ShoppingProduct; onClose: () => void; onOrderComplete: (product: ShoppingProduct, checkoutIntent: CheckoutIntent) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState<'buyer-info' | 'loading-offer' | 'payment'>('buyer-info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutIntent, setCheckoutIntent] = useState<any | null>(null);

  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    country: 'US',
    postalCode: '',
  });

  const handleBuyerInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create checkout intent with buyer info
      const response = await fetch('/api/checkout/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer: buyerInfo,
          quantity: 1,
          productUrl: product.url,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout intent');
      }

      const { checkoutIntent } = await response.json();
      setCheckoutIntent(checkoutIntent);

      // Poll until we have the full offer data (awaiting_confirmation state)
      if (checkoutIntent.state !== 'awaiting_confirmation') {
        setStep('loading-offer');
        pollForOfferData(checkoutIntent.id);
      } else {
        setStep('payment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !checkoutIntent) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: stripeError, token } = await stripe.createToken(cardElement, {
        name: `${buyerInfo.firstName} ${buyerInfo.lastName}`,
        address_line1: buyerInfo.address1,
        address_line2: buyerInfo.address2,
        address_city: buyerInfo.city,
        address_state: buyerInfo.province,
        address_zip: buyerInfo.postalCode,
        address_country: buyerInfo.country,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Confirm checkout intent with payment method
      const response = await fetch('/api/checkout/confirm-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutIntentId: checkoutIntent.id,
          paymentMethodId: token.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      const result = await response.json();

      // Success! Close modal and show success message
      console.log('result', result);

      // add message that says "placing order..." then poll the GET checkout-intent endpoint every second until it's either successful or failed.
      const pollCheckoutIntent = async () => {
        const response = await fetch(`/api/checkout/get-intent?checkoutIntentId=${checkoutIntent.id}`);
        const { checkoutIntent: updatedIntent } = await response.json();
        if (updatedIntent.state == 'completed') {
          alert('Order placed successfully! You will receive a confirmation email shortly.');
          onOrderComplete(product, updatedIntent);
          onClose();
          setLoading(false);
        } else if (updatedIntent.state == 'failed') {
          alert('Order failed. Please try again.');
          onClose();
          setLoading(false);
        } else if (updatedIntent.state == 'placing_order') {
          console.log("Still placing order...");
          setTimeout(pollCheckoutIntent, 1000);
        }
      };
      pollCheckoutIntent();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const pollForOfferData = async (checkoutIntentId: string) => {
    try {
      const response = await fetch(`/api/checkout/get-intent?checkoutIntentId=${checkoutIntentId}`);
      const { checkoutIntent: updatedIntent } = await response.json();

      if (updatedIntent.state === 'awaiting_confirmation' && updatedIntent.offer) {
        setCheckoutIntent(updatedIntent);
        setStep('payment');
      } else {
        // Continue polling every 2 seconds
        setTimeout(() => pollForOfferData(checkoutIntentId), 2000);
      }
    } catch (err) {
      setError('Failed to get pricing information. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Information - Left Side */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Product Details</h3>

        <div className="bg-gray-50 p-6">
          {product.imageUrl && product.imageUrl !== 'Image not found' && (
            <div className="mb-4">
              <img
                src={product.imageUrl}
                alt={product.name}
                className={`object-contain mx-auto ${
                  step === 'buyer-info'
                    ? 'w-full max-w-xs'
                    : 'w-full max-w-[100px]'
                }`}
              />
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-gray-800 text-lg">{product.name}</h4>
            {step === 'buyer-info' && (
              <>
                <p className="text-2xl font-bold text-green-600">{product.price}</p>
                {product.rating && product.rating !== 'Rating not available' && (
                  <p className="text-sm text-yellow-600 flex items-center gap-1">
                    <span>⭐</span>
                    <span>{product.rating}</span>
                  </p>
                )}
              </>
            )}
            {(step === 'loading-offer' || step === 'payment') && checkoutIntent && (
              <p className="text-sm text-gray-600">Quantity: {checkoutIntent.quantity}</p>
            )}
          </div>
        </div>

        {(step === 'loading-offer' || step === 'payment') && checkoutIntent && (
          <div className="space-y-4">

                        {/* Cost Breakdown */}
            {step === 'payment' && checkoutIntent.offer ? (
              <div className="bg-white border border-gray-200 p-4">
                <h4 className="font-medium text-gray-800 mb-3">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">
                      ${(checkoutIntent.offer.cost.subtotal.amountSubunits / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-800">
                      ${(checkoutIntent.offer.shipping.availableOptions.find((opt: any) =>
                        opt.id === checkoutIntent.offer.shipping.selectedOptionId
                      )?.cost.amountSubunits / 100 || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-800">
                      ${(checkoutIntent.offer.cost.tax.amountSubunits / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-base">
                      <span className="text-gray-800">Total</span>
                      <span className="text-green-600">
                        ${(checkoutIntent.offer.cost.total.amountSubunits / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 p-4">
                <h4 className="font-medium text-gray-800 mb-3">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-400">Calculating...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-400">Calculating...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-400">Calculating...</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-base">
                      <span className="text-gray-800">Total</span>
                      <span className="text-gray-400">Calculating...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form - Right Side */}
      <div className="space-y-4">
        {step === 'buyer-info' ? (
          <form onSubmit={handleBuyerInfoSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Buyer Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={buyerInfo.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={buyerInfo.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={buyerInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={buyerInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              required
              value={buyerInfo.address1}
              onChange={(e) => handleInputChange('address1', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={buyerInfo.address2}
              onChange={(e) => handleInputChange('address2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={buyerInfo.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province *
              </label>
              <input
                type="text"
                required
                value={buyerInfo.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                required
                value={buyerInfo.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                required
                value={buyerInfo.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </form>
        ) : step === 'loading-offer' ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Getting Pricing Information</h3>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-gray-600 text-center">
                We're calculating shipping, taxes, and total cost...
              </p>
              <p className="text-sm text-gray-500 text-center">
                This usually takes a few seconds
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Payment Information</h3>

            {/* Buyer Information Summary */}
            <div className="bg-gray-50 p-4">
              <h4 className="font-medium text-gray-800 mb-3">Shipping Information</h4>
              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-900">
                  {buyerInfo.firstName} {buyerInfo.lastName}
                </p>
                <p className="text-gray-700">{buyerInfo.email}</p>
                <p className="text-gray-700">{buyerInfo.phone}</p>
                <div className="mt-2 text-gray-700">
                  <p>{buyerInfo.address1}</p>
                  {buyerInfo.address2 && <p>{buyerInfo.address2}</p>}
                  <p>
                    {buyerInfo.city}, {buyerInfo.province} {buyerInfo.postalCode}
                  </p>
                  <p>{buyerInfo.country}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Information *
                </label>
                <div className="border border-gray-300 p-3">
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('buyer-info')}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !stripe}
                  className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Processing...' : 'Complete Purchase'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutModal({ isOpen, onClose, product, onOrderComplete }: CheckoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Purchase Product</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm product={product} onClose={onClose} onOrderComplete={onOrderComplete} />
          </Elements>
        </div>
      </div>
    </div>
  );
}
