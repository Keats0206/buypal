import { UseChatToolsMessage } from '@/app/api/chat/route';
import TextMessage from './TextMessage';
import ProductGalleryMessage from './ProductGalleryMessage';

interface MessagePartProps {
  part: any;
  index: number;
  onBuyProduct: (product: any) => void;
}

function MessagePart({ part, index, onBuyProduct }: MessagePartProps) {
  switch (part.type) {
    case 'text':
      return <TextMessage text={part.text} />;

    case 'step-start':
      return (
      <div className="text-gray-500">
        <hr className="my-2 border-gray-300" />
      </div>
      );

    case 'tool-searchProducts':
      return <ProductGalleryMessage part={part} onBuyProduct={onBuyProduct} />;

    default:
      return null;
  }
}


interface MessageProps {
  message: UseChatToolsMessage;
  onBuyProduct: (product: any) => void;
}

export default function Message({ message, onBuyProduct }: MessageProps) {
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

    return message.parts.map((part, index) => (
      <MessagePart
        key={index}
        part={part}
        index={index}
        onBuyProduct={onBuyProduct}
      />
    ));
  };

  return (
    <div className="mb-4">
      <div className="font-semibold text-sm text-gray-600 mb-2">
        {message.role === 'user' ? 'You' : 'Rye Powered Assistant'}
      </div>
      <div className={`rounded-lg p-4 ${
        message.role === 'assistant' ? 'bg-[#e6ffb7]' : 'bg-gray-50'
      }`}>
        {renderMessageContent()}
      </div>
    </div>
  );
}
