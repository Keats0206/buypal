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

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    product: any | null;
  }>({
    isOpen: false,
    product: null,
  });

  const { messages, sendMessage, addToolResult, status } =
    useChat<UseChatToolsMessage>({
      transport: new DefaultChatTransport({ api: '/api/chat' }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="flex flex-col h-full w-screen">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-32">
        {messages?.map(message => (
          <Message
            key={message.id}
            message={message}
            onBuyProduct={handleBuyProduct}
          />
        ))}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white fixed z-10 w-screen bottom-0 left-0 border-t p-6">
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