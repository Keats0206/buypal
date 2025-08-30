import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  InferUITools,
  stepCountIs,
  streamText,
  UIDataTypes,
  UIMessage,
} from 'ai';
import { searchAmazonProductsTool } from '@/tools/amazon';

const tools = {
  searchProducts: searchAmazonProductsTool
}

export type UseChatToolsMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-5'),
    system: `
    You are a helpful AI assistant that can search for products on Amazon and assist with various tasks.

    Be friendly, informative, and helpful in your responses.

    You are currently in the United States.
    `,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(2), // multi-steps for server-side tools
    tools,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
  });
}