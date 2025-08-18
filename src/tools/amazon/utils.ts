import * as cheerio from 'cheerio';
import { AmazonProduct } from './types';

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

export function cleanPrice(priceText: string): string {
  if (!priceText) return 'Price not available';

  const cleaned = priceText.replace(/[^\d.,]/g, '').trim();
  if (cleaned) {
    return `$${cleaned}`;
  }
  return 'Price not available';
}

export function extractSearchResults(htmlContent: string, maxResults: number): AmazonProduct[] {
  const $ = cheerio.load(htmlContent);
  const products: AmazonProduct[] = [];

  $('[data-component-type="s-search-result"]').slice(0, maxResults).each((_, container) => {
    try {
      const product: AmazonProduct = {
        name: 'Product name not found',
        price: 'Price not available',
        image_url: 'Image not found',
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
          product.image_url = imgUrl;
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
