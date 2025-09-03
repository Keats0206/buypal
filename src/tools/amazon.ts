import { tool } from 'ai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { ShoppingProduct, ReviewSummary } from '../lib/types';

export function cleanPrice(priceText: string): string {
  if (!priceText) return 'Price not available';

  const cleaned = priceText.replace(/[^\d.,]/g, '').trim();
  if (cleaned) {
    return `$${cleaned}`;
  }
  return 'Price not available';
}

export function extractSearchResults(htmlContent: string, maxResults: number): ShoppingProduct[] {
  const $ = cheerio.load(htmlContent);
  const products: ShoppingProduct[] = [];

  $('[data-component-type="s-search-result"]').slice(0, maxResults).each((_, container) => {
    try {
      const product: ShoppingProduct = {
        name: 'Product name not found',
        price: 'Price not available',
        imageUrl: 'Image not found',
        rating: 'Rating not available',
        url: 'URL not found'
      };

      // Extract product name
      const nameElem = $(container).find('a h2 span').first();
      if (nameElem.length) {
        product.name = nameElem.text().trim();
      }

      // Extract product URL
      const urlElem = $(container).find('a').first();
      if (urlElem.length) {
        const productUrl = urlElem.attr('href');
        if (productUrl) {
          product.url = productUrl.startsWith('/')
            ? `https://www.amazon.com${productUrl}`
            : productUrl;
        }
      }

      // Extract price
      const priceElem = $(container).find('.a-price-whole').first();
      if (priceElem.length) {
        product.price = cleanPrice(priceElem.text());
      }

      // Extract image
      const imgElem = $(container).find('img.s-image').first();
      if (imgElem.length) {
        const imgUrl = imgElem.attr('src');
        if (imgUrl) {
          product.imageUrl = imgUrl;
        }
      }

      // Extract rating
      const ratingElem = $(container).find('.a-icon-alt').first();
      if (ratingElem.length) {
        const ratingText = ratingElem.text();
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        if (ratingMatch) {
          product.rating = `${ratingMatch[1]} out of 5`;
        }
      }

      products.push(product);
    } catch (error) {
      console.error('Error extracting product data:', error);
    }
  });

  return products;
}

export async function enhanceProductsWithAI(products: ShoppingProduct[], query: string): Promise<ShoppingProduct[]> {
  if (products.length === 0) return products;

  try {
    // Generate AI insights for the product set
    const result = await generateObject({
      model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
      schema: z.object({
        productInsights: z.array(z.object({
          productIndex: z.number(),
          reviewSummary: z.object({
            likes: z.array(z.string()).describe('2-3 things people commonly like about this product based on typical reviews'),
            dislikes: z.array(z.string()).describe('1-2 common complaints or issues people mention')
          }),
          badge: z.string().describe('A badge for every product - "Best Budget", "Best Overall", "Most Durable", "Great Value", "Solid Pick", "Top Rated", etc.')
        }))
      }),
      prompt: `Analyze these ${products.length} products for "${query}":

${products.map((p, i) => `${i}: ${p.name} - ${p.price} (${p.rating})`).join('\n')}

    For each product, generate realistic review summaries based on what customers typically say about these types of products. Consider the price point, brand positioning, and product category.

    EVERY product must have a badge. Use: "Best Budget" (cheapest), "Best Overall" (highest rated), "Great Value", "Solid Pick", "Most Durable", "Top Choice", "Popular Pick", etc. Be creative but consistent.

    Keep insights concise and helpful - focus on practical pros/cons that help with purchase decisions.`
    
  });

    // Apply the AI insights to products
    const enhancedProducts = products.map((product, index) => {
      const insight = result.object.productInsights.find(p => p.productIndex === index);
      if (insight) {
        return {
          ...product,
          reviewSummary: insight.reviewSummary,
          badge: insight.badge
        };
      }
      return product;
    });

    return enhancedProducts;
  } catch (error) {
    console.error('Error enhancing products with AI:', error);
    return products; // Return original products if AI enhancement fails
  }
}

export async function fetchAmazonPage(url: string): Promise<string> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
  }
  return response.text();
}

export const searchAmazonProductsTool = tool({
  description: 'Search for products on Amazon and return structured product information including images, titles, prices, and URLs for display in a product catalog',
  inputSchema: z.object({
    query: z.string().describe('The search query for Amazon products (e.g., "wireless headphones", "laptop", "coffee maker")'),
    maxResults: z.number().min(1).max(10).default(3).describe('Maximum number of products to return (1-10, default: 3)')
  }),
  async *execute({ query, maxResults = 5 }) {
    yield { state: 'loading' as const };

    try {
      // Construct search URL
      const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;

      // Fetch search results page
      const htmlContent = await fetchAmazonPage(searchUrl);

      // Extract search results
      const products = extractSearchResults(htmlContent, maxResults);

      if (products.length === 0) {
        yield {
          state: 'ready' as const,
          products: [],
          message: `No products found for "${query}"`
        };
        return;
      }

      // Enhance products with AI insights
      const enhancedProducts = await enhanceProductsWithAI(products, query);

      yield {
        state: 'ready' as const,
        products: enhancedProducts,
        query,
        totalResults: enhancedProducts.length
      };

    } catch (error) {
      throw new Error(`Error searching Amazon products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

export const compareItemsTool = tool({
  description: 'Compare multiple products to help users decide between options',
  inputSchema: z.object({
    products: z.array(z.string()).describe('Product names or IDs to compare'),
    comparisonType: z.string().default('general').describe('Type of comparison (price, features, quality, etc.)')
  }),
  async *execute({ products, comparisonType = 'general' }) {
    yield { state: 'loading' as const };
    
    try {
      const result = await generateObject({
        model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
        schema: z.object({
          comparison: z.object({
            summary: z.string().describe('Brief summary of the comparison'),
            categories: z.array(z.object({
              name: z.string(),
              winner: z.string(),
              explanation: z.string()
            })),
            recommendation: z.string().describe('Final recommendation')
          })
        }),
        prompt: `Compare these products: ${products.join(', ')}
        
Focus on: ${comparisonType}

Provide a structured comparison covering key categories like price, features, quality, and user reviews. Be concise but helpful.`
      });

      yield {
        state: 'ready' as const,
        comparison: result.object.comparison
      };

    } catch (error) {
      throw new Error(`Error comparing items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

export const suggestFollowupsTool = tool({
  description: 'Suggest follow-up questions or actions based on current product search',
  inputSchema: z.object({
    query: z.string().describe('The original search query'),
    products: z.array(z.string()).describe('Product names that were found')
  }),
  async *execute({ query, products }) {
    yield { state: 'loading' as const };
    
    try {
      const result = await generateObject({
        model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
        schema: z.object({
          followups: z.object({
            refinements: z.array(z.string()).describe('Search refinement suggestions'),
            questions: z.array(z.string()).describe('Helpful questions to ask'),
            alternatives: z.array(z.string()).describe('Alternative product categories to consider')
          })
        }),
        prompt: `Based on the search for "${query}" showing products: ${products.join(', ')}
        
Suggest helpful follow-ups including:
- Ways to refine the search (budget range, specific features, brands)
- Questions users might want to ask
- Alternative products to consider

Keep suggestions practical and concise (3-4 items each).`
      });

      yield {
        state: 'ready' as const,
        followups: result.object.followups
      };

    } catch (error) {
      throw new Error(`Error generating followups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});