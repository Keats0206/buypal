import { searchAmazonProductsTool } from './amazon';

export const tools = {
  searchAmazonProducts: searchAmazonProductsTool,

  // Other tools or other product search engines like Tavily, Serper, Bing, etc
} as const;

export { searchAmazonProductsTool } from './amazon';
export type { AmazonProduct } from './amazon';
