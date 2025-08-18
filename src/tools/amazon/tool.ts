import { tool } from 'ai';
import { z } from 'zod';
import { fetchAmazonPage, extractSearchResults } from './utils';

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

      yield {
        state: 'ready' as const,
        products,
        query,
        totalResults: products.length
      };

    } catch (error) {
      throw new Error(`Error searching Amazon products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});
