import Image from 'next/image';
import { ShoppingProduct } from '@/tools/types';

interface ProductGalleryMessageProps {
  part: {
    state: 'input-available' | 'output-available' | 'output-error';
    input: {
      query: string;
    };
    output?: {
      state: 'loading' | 'ready';
      products?: ShoppingProduct[];
      message?: string;
    };
    errorText?: string;
  };
  onBuyProduct: (product: ShoppingProduct) => void;
}

export default function ProductGalleryMessage({ part, onBuyProduct }: ProductGalleryMessageProps) {
  switch (part.state) {
    case 'input-available':
      return (
        <div className="text-gray-500">
          Searching Amazon for &quot;{part.input.query}&quot;...
        </div>
      );

    case 'output-available':
      if (part.output?.state === 'loading') {
        return (
          <div className="text-gray-500">
            Loading Amazon products...
          </div>
        );
      }

      if (part.output?.state === 'ready') {
        if (!part.output.products || part.output.products.length === 0) {
          return (
            <div className="text-gray-500">
              {part.output.message || 'No products found'}
            </div>
          );
        }

        return (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Products for &quot;{part.input.query}&quot;
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {part.output.products.map((product: ShoppingProduct, productIndex: number) => (
                <div
                  key={productIndex}
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  {product.imageUrl && product.imageUrl !== 'Image not found' && (
                    <div className="mb-3 relative h-48">
                      <Image
                        src={product.imageUrl}
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
                    <button
                      onClick={() => onBuyProduct(product)}
                      className="inline-block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors text-sm font-medium"
                    >
                      Buy Now
                    </button>
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
        <div className="text-red-500">
          Error searching Amazon: {part.errorText}
        </div>
      );

    default:
      return null;
  }
}
