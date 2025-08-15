import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  InferUITools,
  stepCountIs,
  streamText,
  tool,
  UIDataTypes,
  UIMessage,
} from 'ai';
import { z } from 'zod';
import * as cheerio from 'cheerio';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const getWeatherInformationTool = tool({
  description: 'show the weather in a given city to the user',
  inputSchema: z.object({ city: z.string() }),
  async *execute({ city }: { city: string }, { messages }) {
    yield { state: 'loading' as const };

    // count the number of assistant messages. throw error if 2 or less
    const assistantMessageCount = messages.filter(
      message => message.role === 'assistant',
    ).length;

    // if (assistantMessageCount <= 2) {
    //   throw new Error('could not get weather information');
    // }

    // Add artificial delay of 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
    const weather =
      weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

    yield {
      state: 'ready' as const,
      temperature: 72,
      weather,
    };
  },

  onInputStart: () => {
    console.log('onInputStart');
  },
  onInputDelta: ({ inputTextDelta }) => {
    console.log('onInputDelta', inputTextDelta);
  },
  onInputAvailable: ({ input }) => {
    console.log('onInputAvailable', input);
  },
});

const askForConfirmationTool = tool({
  description: 'Ask the user for confirmation.',
  inputSchema: z.object({
    message: z.string().describe('The message to ask for confirmation.'),
  }),
  outputSchema: z.string(),
});

const getLocationTool = tool({
  description:
    'Get the user location. Always ask for confirmation before using this tool.',
  inputSchema: z.object({}),
  outputSchema: z.string(),
});

// Amazon Product Search Tool
interface AmazonProduct {
  name: string;
  price: string;
  image_url: string;
  rating: string;
  url: string;
}

async function fetchAmazonPage(url: string): Promise<string> {
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

function cleanPrice(priceText: string): string {
  if (!priceText) return 'Price not available';

  const cleaned = priceText.replace(/[^\d.,]/g, '').trim();
  if (cleaned) {
    return `$${cleaned}`;
  }
  return 'Price not available';
}

function extractSearchResults(htmlContent: string, maxResults: number): AmazonProduct[] {
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

const searchAmazonProductsTool = tool({
  description: 'Search for products on Amazon and return structured product information including images, titles, prices, and URLs for display in a product catalog',
  inputSchema: z.object({
    query: z.string().describe('The search query for Amazon products (e.g., "wireless headphones", "laptop", "coffee maker")'),
    maxResults: z.number().min(1).max(10).default(5).describe('Maximum number of products to return (1-10, default: 5)')
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

const tools = {
  // server-side tool with execute function:
  getWeatherInformation: getWeatherInformationTool,

  // client-side tool that starts user interaction:
  askForConfirmation: askForConfirmationTool,
  // client-side tool that is automatically executed on the client:
  getLocation: getLocationTool,

  // Amazon product search tool:
  searchAmazonProducts: searchAmazonProductsTool,

  web_search_preview: openai.tools.webSearchPreview({
    searchContextSize: 'high',
    userLocation: {
      type: 'approximate',
      city: 'New York',
      region: 'New York',
      country: 'US',
    },
  }),
} as const;

export type UseChatToolsMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-5'),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5), // multi-steps for server-side tools
    tools,
  });

  return result.toUIMessageStreamResponse({
    //  originalMessages: messages, //add if you want to have correct ids
    onFinish: options => {
      console.log('onFinish', options);
    },
  });
}