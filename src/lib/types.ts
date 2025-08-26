export interface ShoppingProduct {
  name: string;
  price: string;
  imageUrl: string;
  rating: string;
  url: string;
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