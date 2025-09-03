export interface ReviewSummary {
  likes: string[];
  dislikes: string[];
}

export interface ShoppingProduct {
  name: string;
  price: string;
  imageUrl: string;
  rating: string;
  url: string;
  reviewSummary?: ReviewSummary;
  badge?: string; // e.g. "Best Budget", "Best Overall", "Most Durable"
  id?: string; // Unique identifier for shortlist functionality
}

export interface Buyer {
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

export interface CheckoutIntent {
  id: string;
  buyer: Buyer;
  quantity: number;
  productUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortlistItem {
  product: ShoppingProduct;
  addedAt: string;
  notes?: string;
}

export interface ShoppingMission {
  id: string;
  name: string;
  items: ShortlistItem[];
  createdAt: string;
  updatedAt: string;
}