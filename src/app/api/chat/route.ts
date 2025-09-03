import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  InferUITools,
  stepCountIs,
  streamText,
  UIDataTypes,
  UIMessage,
} from 'ai';
import { searchAmazonProductsTool, compareItemsTool, suggestFollowupsTool } from '@/tools/amazon';

const tools = {
  searchProducts: searchAmazonProductsTool,
  compareItems: compareItemsTool,
  suggestFollowups: suggestFollowupsTool
}

export type UseChatToolsMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `
    You are a helpful shopping assistant. 

    RULES:
    1. For new product searches - call searchProducts tool, then provide brief analysis
    2. For ANY follow-up questions about existing products - provide direct text responses without calling any tools

    When providing analysis after searchProducts:
    - Provide 2-3 helpful paragraphs analyzing the options
    - You can mention product names for context, but NO images, NO detailed descriptions, NO price lists
    - Focus on helping users choose: key differences, what to consider, recommendations
    - Give practical shopping advice beyond what's visible in the cards
    - Be conversational and informative, not repetitive
    `,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(2), // multi-steps for server-side tools
    tools,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
  });
}