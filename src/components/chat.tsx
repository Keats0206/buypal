'use client';

import ChatInput from '@/components/chat-input';
import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { UseChatToolsMessage } from '@/app/api/chat/route';
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, addToolResult, status } =
    useChat<UseChatToolsMessage>({
      transport: new DefaultChatTransport({ api: '/api/chat' }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

      // run client-side tools that are automatically executed:
      async onToolCall({ toolCall }) {
        // artificial 2 second delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (toolCall.toolName === 'getLocation') {
          const cities = [
            'New York',
            'Los Angeles',
            'Chicago',
            'San Francisco',
          ];

          addToolResult({
            tool: 'getLocation',
            toolCallId: toolCall.toolCallId,
            output: cities[Math.floor(Math.random() * cities.length)],
          });
        }
      },
    });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map(message => (
          <div key={message.id} className="mb-4">
            <div className="font-semibold text-sm text-gray-600 mb-2">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
          {message.parts.map((part, index) => {
            switch (part.type) {
              case 'text':
                return (
                  <div key={index} className="prose prose-sm max-w-none">
                    <ReactMarkdown>{part.text}</ReactMarkdown>
                  </div>
                );

              case 'step-start':
                return index > 0 ? (
                  <div key={index} className="text-gray-500">
                    <hr className="my-2 border-gray-300" />
                  </div>
                ) : null;

              case 'tool-askForConfirmation': {
                switch (part.state) {
                  case 'input-available':
                    return (
                      <div key={index} className="text-gray-500">
                        {part.input.message}
                        <div className="flex gap-2 mt-2">
                          <button
                            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                            onClick={async () => {
                              addToolResult({
                                tool: 'askForConfirmation',
                                toolCallId: part.toolCallId,
                                output: 'Yes, confirmed.',
                              });
                            }}
                          >
                            Yes
                          </button>
                          <button
                            className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
                            onClick={async () => {
                              addToolResult({
                                tool: 'askForConfirmation',
                                toolCallId: part.toolCallId,
                                output: 'No, denied',
                              });
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    );
                  case 'output-available':
                    return (
                      <div key={index} className="text-gray-500">
                        Location access allowed: {part.output}
                      </div>
                    );
                }
                break;
              }

              case 'tool-getLocation': {
                switch (part.state) {
                  case 'input-available':
                    return (
                      <div key={index} className="text-gray-500">
                        Getting location...
                      </div>
                    );
                  case 'output-available':
                    return (
                      <div key={index} className="text-gray-500">
                        Location: {part.output}
                      </div>
                    );
                }
                break;
              }

              case 'tool-getWeatherInformation': {
                switch (part.state) {
                  // example of pre-rendering streaming tool calls:
                  case 'input-streaming':
                    return (
                      <pre key={index} className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(part.input, null, 2)}
                      </pre>
                    );
                  case 'input-available':
                    return (
                      <div key={index} className="text-gray-500">
                        Getting weather information for {part.input.city}...
                      </div>
                    );
                  case 'output-available':
                    return (
                      <div key={index} className="text-gray-500">
                        {part.output.state === 'loading'
                          ? 'Fetching weather information...'
                          : `Weather in ${part.input.city}: ${part.output.weather}`}
                      </div>
                    );
                  case 'output-error':
                    return (
                      <div key={index} className="text-red-500">
                        Error: {part.errorText}
                      </div>
                    );
                }
                break;
              }

              case 'tool-web_search_preview': {
                if (part.state === 'input-available') {
                  return (
                    <pre
                      key={index}
                      className="overflow-auto p-2 text-sm bg-gray-100 rounded"
                    >
                      {JSON.stringify(part.input, null, 2)}
                    </pre>
                  );
                }
                if (part.state === 'output-available') {
                  return (
                    <pre
                      key={index}
                      className="overflow-auto p-2 text-sm bg-gray-100 rounded"
                    >
                      {JSON.stringify(part.input, null, 2)}
                      {`\n\nDONE - Web search completed`}
                    </pre>
                  );
                }
              }

              case 'tool-searchAmazonProducts': {
                switch (part.state) {
                  case 'input-available':
                    return (
                      <div key={index} className="text-gray-500">
                        Searching Amazon for &quot;{part.input.query}&quot;...
                      </div>
                    );
                  case 'output-available':
                    if (part.output.state === 'loading') {
                      return (
                        <div key={index} className="text-gray-500">
                          Loading Amazon products...
                        </div>
                      );
                    }

                    if (part.output.state === 'ready') {
                      if (!part.output.products || part.output.products.length === 0) {
                        return (
                          <div key={index} className="text-gray-500">
                            {part.output.message || 'No products found'}
                          </div>
                        );
                      }

                      return (
                        <div key={index} className="mt-4">
                          <h3 className="text-lg font-semibold mb-4 text-gray-800">
                            Amazon Products for &quot;{part.input.query}&quot;
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {part.output.products.map((product: any, productIndex: number) => (
                              <div
                                key={productIndex}
                                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white"
                              >
                                {product.image_url && product.image_url !== 'Image not found' && (
                                  <div className="mb-3 relative h-48">
                                    <Image
                                      src={product.image_url}
                                      alt={product.name}
                                      fill
                                      className="object-contain rounded"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm line-clamp-2 text-gray-800">
                                    {product.name}
                                  </h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-green-600">
                                      {product.price}
                                    </span>
                                    {product.rating && product.rating !== 'Rating not available' && (
                                      <span className="text-sm text-yellow-600">
                                        ⭐ {product.rating}
                                      </span>
                                    )}
                                  </div>
                                  {product.url && product.url !== 'URL not found' && (
                                    <a
                                      href={product.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors text-sm font-medium"
                                    >
                                      View on Amazon
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    break;
                  case 'output-error':
                    return (
                      <div key={index} className="text-red-500">
                        Error searching Amazon: {part.errorText}
                      </div>
                    );
                }
                break;
              }
            }
          })}
            </div>
          </div>
        ))}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t bg-white p-4">
        <ChatInput status={status} onSubmit={text => sendMessage({ text })} />
      </div>
    </div>
  );
}