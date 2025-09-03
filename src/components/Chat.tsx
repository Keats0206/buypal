'use client';

import ChatInput from '@/components/ChatInput';
import CheckoutModal from '@/components/CheckoutModal';
import { Message } from '@/components/messages';
import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { UseChatToolsMessage } from '@/app/api/chat/route';
import { useEffect, useRef, useState } from 'react';
import { ShoppingProduct } from '@/lib/types';
import { CheckoutIntent } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    product: any | null;
  }>({
    isOpen: false,
    product: null,
  });

  const [useMockData, setUseMockData] = useState(false); // Toggle this for dev mode

  const { messages, sendMessage, addToolResult, status } =
    useChat<UseChatToolsMessage>({
      transport: new DefaultChatTransport({ api: '/api/chat' }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  // Mock messages for development
  const mockMessages: UseChatToolsMessage[] = [
    {
      id: '1',
      role: 'user' as const,
      content: 'coffee maker single serve',
      parts: [
        {
          type: 'text',
          text: 'coffee maker single serve'
        }
      ]
    },
    {
      id: '2', 
      role: 'assistant' as const,
      content: 'I found some great single serve coffee makers for you!',
      parts: [
        {
          type: 'tool-searchProducts',
          state: 'output-available',
          input: { query: 'coffee maker single serve' },
          output: {
            state: 'ready',
            products: [
              {
                name: 'Amazon Basics 5 Cup Drip Coffee Maker, Coffee Machine with Glass Coffee Pot (0.8 Qt), Auto Shut-off, Black',
                price: '$22.99',
                rating: '4.2 out of 5',
                imageUrl: 'https://m.media-amazon.com/images/I/71h3jZGKjfL._AC_SX466_.jpg',
                badge: 'Best Budget',
                reviewSummary: {
                  likes: ['Simple to use', 'Good value for money', 'Compact size'],
                  dislikes: ['Plastic taste initially', 'No programmable timer']
                }
              },
              {
                name: 'Hot & Iced Coffee Maker with Bold Setting, Single Serve Coffee Maker for K Cup and Grounds, 6-14 Oz Brew Sizes',
                price: '$53.99',
                rating: '4.2 out of 5',
                imageUrl: 'https://m.media-amazon.com/images/I/81vQGvKj8tL._AC_SX466_.jpg',
                badge: 'Top Choice',
                reviewSummary: {
                  likes: ['Versatile brewing options', 'Makes both hot and iced coffee', 'K-cup and ground coffee compatible'],
                  dislikes: ['Louder than expected', 'Iced coffee could be stronger']
                }
              },
              {
                name: 'CHULUX Slim Single Serve Coffee Maker for K Pods, One Cup Coffee Maker Fits 7.3" Travel Mugs, Coffee Machine',
                price: '$39.99',
                rating: '4.2 out of 5', 
                imageUrl: 'https://m.media-amazon.com/images/I/71tQqQBQvdL._AC_SX466_.jpg',
                badge: 'Great Value',
                reviewSummary: {
                  likes: ['Slim design saves space', 'Quick brewing', 'Fits tall mugs'],
                  dislikes: ['K-pods only', 'No water level indicator']
                }
              }
            ]
          }
        },
        {
          type: 'text',
          text: `I found some excellent single serve coffee makers that would be perfect for your needs! Here are 3 top-rated options I've selected based on customer reviews, features, and value.

The **Amazon Basics** model is a fantastic budget choice at just $22.99 - it's simple, reliable, and perfect if you want basic drip coffee functionality without breaking the bank. For something more versatile, the **Hot & Iced Coffee Maker** at $53.99 stands out because it can brew both hot and iced coffee and works with both K-cups and ground coffee, giving you maximum flexibility.

The **CHULUX Slim** model offers great value at $39.99 with its space-saving design that fits under most cabinets while still accommodating tall travel mugs. All three have solid 4.2-star ratings from hundreds of reviews.`
        }
      ]
    }
  ] as any;

  const displayMessages = useMockData ? mockMessages : messages;
  const showWelcome = displayMessages.length === 0 || !displayMessages.some(m => m.role === 'user');

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const handleBuyProduct = (product: any) => {
    setCheckoutModal({
      isOpen: true,
      product,
    });
  };

  const handleCloseCheckout = () => {
    setCheckoutModal({
      isOpen: false,
      product: null,
    });
  };

  const handleOrderComplete = async (product: ShoppingProduct, checkoutIntent: CheckoutIntent) => {
    await sendMessage({
      text: `Order placed for ${product.name}! Checkout Intent ID: ${checkoutIntent.id}`,
    });
  };

  const suggestedSearches = [
    "wireless bluetooth headphones under $50",
    "women's winter coats",
    "laptop backpack for work",
    "kitchen knife set",
    "running shoes for men",
    "skincare routine for dry skin",
    "coffee maker single serve",
    "yoga mat non-slip"
  ];

  return (
    <div className="flex flex-col h-full w-full mx-auto">
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          {showWelcome ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="max-w-2xl">
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Your AI shopping assistant for smart product discovery
                </p>
                
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Popular searches:</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedSearches.map((search, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: index * 0.05,
                          ease: "easeOut"
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => sendMessage({ text: search })}
                        className="p-3 text-left bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 text-sm text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md"
                      >
                        {search}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {displayMessages?.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  data-message-index={index}
                >
                  <Message
                    message={message}
                    onBuyProduct={handleBuyProduct}
                    onSendMessage={(text: string) => sendMessage({ text })}
                    isStreaming={status !== 'ready' && index === displayMessages.length - 1}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed chat input - always present */}
      <div className="bg-white/95 backdrop-blur-sm border-t p-4 fixed bottom-0 left-0 right-0 z-10">
        <div className="max-w-5xl mx-auto">
          <ChatInput status={status} onSubmit={text => sendMessage({ text })} />
        </div>
      </div>

      <CheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={handleCloseCheckout}
        onOrderComplete={handleOrderComplete}
        product={checkoutModal.product}
      />
      
    </div>
  );
}