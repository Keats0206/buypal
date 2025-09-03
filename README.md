# Demo AI chat storefront with Rye + Stripe in Next.js

This is a [Next.js](https://nextjs.org/) project that combines AI-powered chat with e-commerce functionality. Users can search for Amazon products through natural language and purchase them directly through an integrated checkout flow powered by Rye and Stripe.

[![Demo AI chat storefront with Rye + Stripe in Next.js](https://img.youtube.com/vi/c15CmI-kn54/0.jpg)](https://www.youtube.com/watch?v=c15CmI-kn54)

## Features

- **AI-Powered Chat**: Natural language interface for product discovery
- **Amazon Product Search**: Real-time product search with images, prices, and ratings
- **Integrated Checkout**: Complete purchase flow with buyer information collection
- **Stripe Payment Processing**: Secure card payment handling with Stripe Elements
- **Rye Integration**: Backend order processing and fulfillment through Amazon

## Environment Variables

Copy the `.env.example` file to create a new `.env` file and set your environment variables.

```bash
cp .env.example .env
```

Be sure to set these variables. Note the Stripe Publishable key must be Rye's publishable key:

```yaml
OPENAI_API_KEY=
RYE_API_KEY=
RYE_API_BASE=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51LgDhrHGDlstla3fdqlULAne0rAf4Ho6aBV2cobkYQ4m863Sy0W8DNu2HOnUeYTQzQnE4DZGyzvCB8Yzl1r38isl00H9sVKEMu
```

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

1. **Product Discovery**: Users can ask the AI to search for products using natural language (e.g., "Find me wireless headphones under $100")
2. **Product Display**: The AI searches Amazon and displays products with images, prices, ratings, and a "Buy Now" button
3. **Checkout Flow**: Clicking "Buy Now" opens a modal with:
   - Buyer information form (name, address, contact details)
   - Stripe payment form with card input
4. **Order Processing**: The system creates a Rye checkout intent and processes payment through Stripe
5. **Fulfillment**: Orders are sent to Amazon for fulfillment on behalf of the user

## Architecture

- **Frontend**: Next.js with React, Tailwind CSS, and Stripe Elements
- **Backend**: Next.js API routes for checkout processing
- **AI**: OpenAI GPT for natural language processing
- **E-commerce**: Rye API for Amazon product access and order fulfillment
- **Payments**: Stripe for secure payment processing

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
# buypal
