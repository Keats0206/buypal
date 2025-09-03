# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture Overview

This is a Next.js AI-powered e-commerce application that combines ChatGPT with Amazon product search and Stripe payments through Rye's fulfillment platform.

### Key Components

- **Frontend**: Next.js 14 with React, TypeScript, and Tailwind CSS
- **AI Integration**: OpenAI GPT models via Vercel AI SDK for natural language product search
- **E-commerce**: Rye API for Amazon product access and order fulfillment
- **Payments**: Stripe Elements with Rye's publishable key for checkout processing
- **Styling**: Tailwind CSS with custom design system and shadcn/ui components

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # AI chat endpoint with Amazon search tool
│   │   └── checkout/              # Stripe payment and Rye order processing
│   ├── actions.tsx                # Server actions
│   ├── layout.tsx                 # Root layout with styling
│   └── page.tsx                   # Main chat interface
├── components/                    # React components
├── tools/
│   └── amazon.ts                  # Amazon product search scraping logic
└── lib/
    └── types.ts                   # TypeScript type definitions
```

### Key Integration Points

1. **AI Chat Flow**: `src/app/api/chat/route.ts` handles OpenAI streaming with the Amazon search tool
2. **Product Search**: `src/tools/amazon.ts` scrapes Amazon search results using Cheerio
3. **Checkout System**: API routes under `src/app/api/checkout/` handle Rye intent creation and Stripe payment processing
4. **Type System**: Custom types in `src/lib/types.ts` define product data structures

### Environment Variables

Required environment variables (see README.md for details):
- `OPENAI_API_KEY`: OpenAI API key for chat functionality
- `RYE_API_KEY` and `RYE_API_BASE`: Rye platform credentials
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Rye's Stripe publishable key

### Development Notes

- Uses `@ai-sdk/openai` and `@ai-sdk/react` for AI integration with server-side tools
- Amazon product scraping requires specific user-agent headers and DOM parsing
- Payment flow integrates Rye checkout intents with Stripe Elements
- Images are configured for Amazon CDN domains in `next.config.mjs`
- TypeScript strict mode enabled with path aliases (`@/*` → `./src/*`)