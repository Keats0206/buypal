import { UseChatToolsMessage } from '@/app/api/chat/route';
import ProductGalleryMessage, { SmartNudgeButtons } from './ProductGalleryMessage';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';


function CompareItemsMessage({ part }: { part: any }) {
  if (part.state === 'input-available') {
    return <div className="text-gray-500">Comparing products...</div>;
  }

  if (part.state === 'output-available' && part.output?.comparison) {
    const { comparison } = part.output;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Product Comparison</h3>
        <p className="text-gray-700 mb-4">{comparison.summary}</p>
        
        <div className="space-y-3">
          {comparison.categories.map((category: any, i: number) => (
            <div key={i} className="border-l-4 border-emerald-500 bg-emerald-50 p-3 rounded-r-md">
              <div className="font-medium text-gray-900">{category.name}</div>
              <div className="text-emerald-700 font-semibold">Winner: {category.winner}</div>
              <p className="text-sm text-gray-600 mt-1">{category.explanation}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="font-semibold text-gray-900 mb-1">Final Recommendation</div>
          <p className="text-gray-700">{comparison.recommendation}</p>
        </div>
      </div>
    );
  }

  return null;
}


interface TextMessageProps {
  text: string;
}

function TextMessage({ text }: TextMessageProps) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

interface MessagePartProps {
  part: any;
  index: number;
  onBuyProduct: (product: any) => void;
  onSendMessage?: (message: string) => void;
}

function MessagePart({ part, index, onBuyProduct, onSendMessage }: MessagePartProps) {
  switch (part.type) {
    case 'text':
      return <TextMessage text={part.text} />;

    case 'step-start':
      return (
        <div className="text-gray-500"></div>
      );

    case 'tool-searchProducts':
      return <ProductGalleryMessage part={part} onBuyProduct={onBuyProduct} onSendMessage={onSendMessage} />;

    case 'tool-compareItems':
      return <CompareItemsMessage part={part} />;


    default:
      return null;
  }
}


interface MessageProps {
  message: UseChatToolsMessage;
  onBuyProduct: (product: any) => void;
  onSendMessage?: (message: string) => void;
  isStreaming?: boolean;
}

export default function Message({ message, onBuyProduct, onSendMessage, isStreaming = false }: MessageProps) {
  const renderMessageContent = () => {
    // Check if assistant message is empty or has no meaningful content
    if (message.role === 'assistant') {
      const hasTextContent = message.parts.some(part =>
        part.type === 'text' && part.text && part.text.trim().length > 0
      );
      const hasToolContent = message.parts.some(part =>
        part.type !== 'text' && part.type !== 'step-start'
      );

      if (!hasTextContent && !hasToolContent) {
        return (
          <div className="text-gray-500 italic">
            thinking...
          </div>
        );
      }
    }

    const parts = message.parts.map((part, index) => (
      <MessagePart
        key={index}
        part={part}
        index={index}
        onBuyProduct={onBuyProduct}
        onSendMessage={onSendMessage}
      />
    ));

    // Find products for nudges
    const productPart = message.parts.find(part => 
      part.type === 'tool-searchProducts' && 'output' in part && part.output?.products
    ) as any;

    return (
      <>
        {parts}
        {/* Smart Nudges after all message content - only show when not streaming */}
        {onSendMessage && productPart?.output?.products && message.role === 'assistant' && !isStreaming && (
          <motion.div 
            className="mt-6 flex flex-wrap gap-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <SmartNudgeButtons 
              onSendMessage={onSendMessage} 
              products={productPart.output.products} 
            />
          </motion.div>
        )}
      </>
    );
  };

  return (
    <div className="mb-4">
      <div className="font-semibold text-sm text-gray-600 mb-2">
        {message.role === 'user' ? 'You' : 'BuyPal'}
      </div>
      <div className={`py-4 ${
        message.role === 'assistant' ? 'bg-transparent' : 'px-4 bg-[#e6ffb7]'
      }`}>
        {renderMessageContent()}
      </div>
    </div>
  );
}
