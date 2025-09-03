import { UseChatToolsMessage } from '@/app/api/chat/route';
import ProductGalleryMessage from './ProductGalleryMessage';
import ReactMarkdown from 'react-markdown';

// Smart nudge component extracted from ProductGalleryMessage
interface SmartNudgeButtonsProps {
  onSendMessage: (message: string) => void;
  products: any[];
}

function SmartNudgeButtons({ onSendMessage, products }: SmartNudgeButtonsProps) {
  const nudges = [];
  
  if (products.length > 0) {
    // Analyze product prices for budget suggestions
    const prices = products.map(p => {
      const priceStr = p.price.replace(/[$,]/g, '');
      return parseFloat(priceStr) || 0;
    }).filter(p => p > 0);
    
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Budget-focused nudges
      if (maxPrice > minPrice * 2) {
        nudges.push(`Show me only options under $${Math.ceil(minPrice * 1.5)}`);
      }
      
      if (maxPrice > 50) {
        nudges.push("What's the most budget-friendly option?");
      }
    }
    
    // Product type specific nudges - detect from first product name
    const firstProductName = products[0].name.toLowerCase();
    
    if (firstProductName.includes('coffee')) {
      nudges.push("Which has the best brewing features?");
      nudges.push("Show me single serve options only");
      nudges.push("Compare K-cup vs ground coffee compatibility");
    } else if (firstProductName.includes('headphone') || firstProductName.includes('earbuds')) {
      nudges.push("Which has the best battery life?");
      nudges.push("Show me wireless options only");
      nudges.push("Compare noise cancellation features");
    } else if (firstProductName.includes('laptop') || firstProductName.includes('computer')) {
      nudges.push("Which has the best performance for the price?");
      nudges.push("Show me gaming vs productivity options");
      nudges.push("Compare storage and RAM specs");
    } else {
      // Generic product nudges
      nudges.push("Which has the highest customer ratings?");
      nudges.push("Show me the most popular choice");
      nudges.push("What's the best value for money?");
    }
    
    // Feature comparison nudges
    if (products.length > 2) {
      nudges.push("Help me compare the top 2 options");
    }
  }

  if (nudges.length === 0) return null;

  return (
    <>
      {nudges.slice(0, 4).map((nudge, i) => (
        <button
          key={i}
          onClick={() => onSendMessage(nudge)}
          className="px-3 py-2 bg-lime-50 hover:bg-lime-100 border border-lime-200 hover:border-lime-300 rounded-md text-sm text-lime-700 hover:text-lime-800 transition-colors"
        >
          {nudge}
        </button>
      ))}
    </>
  );
}

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
}

export default function Message({ message, onBuyProduct, onSendMessage }: MessageProps) {
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
      part.type === 'tool-searchProducts' && part.output?.products
    );

    return parts;
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
