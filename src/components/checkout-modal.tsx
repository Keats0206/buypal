'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Product {
  name: string;
  price: string;
  image_url: string;
  rating: string;
  url: string;
}

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
  product: Product;
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

function CheckoutForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState<'buyer-info' | 'payment'>('buyer-info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutIntentId, setCheckoutIntentId] = useState<string | null>(null);

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
      setCheckoutIntentId(checkoutIntent.id);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !checkoutIntentId) {
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
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${buyerInfo.firstName} ${buyerInfo.lastName}`,
          email: buyerInfo.email,
          phone: buyerInfo.phone,
          address: {
            line1: buyerInfo.address1,
            line2: buyerInfo.address2,
            city: buyerInfo.city,
            state: buyerInfo.province,
            postal_code: buyerInfo.postalCode,
            country: buyerInfo.country,
          },
        },
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
          checkoutIntentId,
          paymentMethodId: paymentMethod.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      const result = await response.json();

      // Success! Close modal and show success message
      alert('Order placed successfully! You will receive a confirmation email shortly.');
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-md mx-auto">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Order Summary</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{product.name}</span>
              <span className="font-medium">{product.price}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Final price with taxes and shipping will be calculated
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information *
            </label>
            <div className="border border-gray-300 rounded-md p-3">
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
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !stripe}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Complete Purchase'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function CheckoutModal({ isOpen, onClose, product }: CheckoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-4">
              {product.image_url && product.image_url !== 'Image not found' && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-20 h-20 object-contain rounded"
                />
              )}
              <div>
                <h3 className="font-medium text-gray-800">{product.name}</h3>
                <p className="text-lg font-bold text-green-600">{product.price}</p>
                {product.rating && product.rating !== 'Rating not available' && (
                  <p className="text-sm text-yellow-600">⭐ {product.rating}</p>
                )}
              </div>
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm product={product} onClose={onClose} />
          </Elements>
        </div>
      </div>
    </div>
  );
}
