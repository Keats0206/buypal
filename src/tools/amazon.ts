import { tool } from 'ai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { ShoppingProduct } from './types';

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