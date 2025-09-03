import Image from 'next/image';
import { ShoppingProduct } from '@/lib/types';
import { useState } from 'react';

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
  onSendMessage?: (message: string) => void;
}

export default function ProductGalleryMessage({ part, onBuyProduct, onSendMessage }: ProductGalleryMessageProps) {
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
          <ProductGallery products={part.output.products} onBuyProduct={onBuyProduct} onSendMessage={onSendMessage} />
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

// Badge color mapping based on type
const getBadgeStyle = (badge: string) => {
  const lowerBadge = badge.toLowerCase();
  if (lowerBadge.includes('best value') || lowerBadge.includes('budget')) {
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  }
  if (lowerBadge.includes('premium') || lowerBadge.includes('best overall')) {
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  }
  if (lowerBadge.includes('trending') || lowerBadge.includes('popular')) {
    return 'bg-orange-100 text-orange-800 border border-orange-200';
  }
  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

interface ProductGalleryProps {
  products: ShoppingProduct[];
  onBuyProduct: (product: ShoppingProduct) => void;
  onSendMessage?: (message: string) => void;
}

export interface SmartNudgeButtonsProps {
  onSendMessage: (message: string) => void;
  products: ShoppingProduct[];
}

export function SmartNudgeButtons({ onSendMessage, products }: SmartNudgeButtonsProps) {
  // Generate contextual nudges based on the actual products shown
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

function ProductGallery({ products, onBuyProduct, onSendMessage }: ProductGalleryProps) {
  const [selectedProduct, setSelectedProduct] = useState<ShoppingProduct | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [shortlistedProducts, setShortlistedProducts] = useState<Set<number>>(new Set());

  const toggleProductSelection = (index: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else if (newSelected.size < 3) {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const handleCompare = () => {
    setShowComparison(true);
  };

  const toggleShortlist = (index: number) => {
    const newShortlisted = new Set(shortlistedProducts);
    if (newShortlisted.has(index)) {
      newShortlisted.delete(index);
    } else {
      newShortlisted.add(index);
    }
    setShortlistedProducts(newShortlisted);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {products.length} Products Found
          </h3>
          <div className="flex gap-2">
            {shortlistedProducts.size > 0 && (
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1 rounded-md border border-blue-200 hover:border-blue-300 transition-colors">
                Shortlist ({shortlistedProducts.size})
              </button>
            )}
            {selectedProducts.size > 1 && (
              <button 
                onClick={handleCompare}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1 rounded-md border border-emerald-200 hover:border-emerald-300 transition-colors"
              >
                Compare {selectedProducts.size}
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product: ShoppingProduct, index: number) => (
            <ProductCard
              key={index}
              product={product}
              index={index}
              isSelected={selectedProducts.has(index)}
              isShortlisted={shortlistedProducts.has(index)}
              onSelect={() => toggleProductSelection(index)}
              onToggleShortlist={() => toggleShortlist(index)}
              onShowInsights={() => setSelectedProduct(product)}
              onBuyProduct={onBuyProduct}
            />
          ))}
        </div>

        
      </div>

      {/* Insights Modal */}
      {selectedProduct && (
        <InsightsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuyProduct={onBuyProduct}
        />
      )}

      {/* Comparison Modal */}
      {showComparison && selectedProducts.size > 1 && (
        <ComparisonModal
          products={Array.from(selectedProducts).map(index => products[index])}
          onClose={() => setShowComparison(false)}
          onBuyProduct={onBuyProduct}
          onSendMessage={onSendMessage}
        />
      )}
    </>
  );
}

interface ProductCardProps {
  product: ShoppingProduct;
  index: number;
  isSelected: boolean;
  isShortlisted: boolean;
  onSelect: () => void;
  onToggleShortlist: () => void;
  onShowInsights: () => void;
  onBuyProduct: (product: ShoppingProduct) => void;
}

function ProductCard({ product, index, isSelected, isShortlisted, onSelect, onToggleShortlist, onShowInsights, onBuyProduct }: ProductCardProps) {
  const selectedStyle = isSelected ? 'border-emerald-300 shadow-sm' : 'border-gray-200 hover:border-gray-300';
  const checkboxStyle = isSelected 
    ? 'bg-emerald-600 border-emerald-600' 
    : 'border-gray-300 hover:border-gray-400 bg-white';

  return (
    <div className={`group relative bg-white rounded-lg border transition-all duration-200 hover:shadow-sm ${selectedStyle}`}>
      {/* Selection checkbox */}
      <button
        onClick={onSelect}
        className={`absolute top-3 right-3 w-5 h-5 rounded border-2 transition-colors z-10 ${checkboxStyle}`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="p-4">
        {/* Badge - only show if badge exists and is meaningful */}
        {product.badge && product.badge !== 'Good Pick' && (
          <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mb-3 ${getBadgeStyle(product.badge)}`}>
            {product.badge}
          </div>
        )}

        {/* Shortlist heart - moved below badge */}
        <button
          onClick={onToggleShortlist}
          className={`absolute top-12 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            isShortlisted 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'
          }`}
        >
          {isShortlisted ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>

        <div className="flex gap-4">
          {/* Image */}
          {product.imageUrl && product.imageUrl !== 'Image not found' && (
            <div className="flex-shrink-0 w-24 h-24 bg-gray-50 rounded-md overflow-hidden">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={96}
                height={96}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Price - Hero metric */}
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {product.price}
            </div>

            {/* Rating */}
            {product.rating && product.rating !== 'Rating not available' && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex text-yellow-400">
                  {'★'.repeat(Math.floor(parseFloat(product.rating.replace(' out of 5', ''))))}
                  {'☆'.repeat(5 - Math.floor(parseFloat(product.rating.replace(' out of 5', ''))))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating.replace(' out of 5', '')}
                </span>
              </div>
            )}

            {/* Product name */}
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
              {product.name}
            </h4>

            {/* Store indicator */}
            <div className="text-xs text-gray-500 mb-3">
              Amazon
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onBuyProduct(product)}
                className="flex-1 bg-[#D7FC51] hover:bg-[#D7FC51]/80 text-black text-sm font-medium py-2 px-3 rounded-md transition-colors"
              >
                Buy
              </button>
              <button
                onClick={onShowInsights}
                className="flex-shrink-0 text-gray-600 hover:text-gray-900 text-sm font-medium py-2 px-3 border border-gray-300 hover:border-gray-400 rounded-md transition-colors"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InsightsModalProps {
  product: ShoppingProduct;
  onClose: () => void;
  onBuyProduct: (product: ShoppingProduct) => void;
}

function InsightsModal({ product, onClose, onBuyProduct }: InsightsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {product.price}
            </div>
            <h2 className="font-medium text-gray-900 line-clamp-2">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Product Image */}
            {product.imageUrl && product.imageUrl !== 'Image not found' && (
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={192}
                    height={192}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* AI Insights Sections */}
            {product.reviewSummary && (
              <>
                {/* What People Like */}
                {product.reviewSummary.likes.length > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <h3 className="font-semibold text-emerald-900 mb-3">What People Like</h3>
                    <ul className="space-y-2">
                      {product.reviewSummary.likes.map((like, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="w-4 h-4 text-emerald-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-emerald-800 text-sm">{like}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Potential Concerns */}
                {product.reviewSummary.dislikes.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <h3 className="font-semibold text-amber-900 mb-3">Potential Concerns</h3>
                    <ul className="space-y-2">
                      {product.reviewSummary.dislikes.map((dislike, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-amber-800 text-sm">{dislike}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* AI Verdict */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">AI Verdict</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${getBadgeStyle(product.badge || 'Good Pick')}`}>
                {product.badge || 'Good Pick'}
              </div>
              <p className="text-blue-800 text-sm">
                Based on customer reviews and product features, this item offers good value in its category.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white text-gray-700 border border-gray-300 hover:border-gray-400 py-3 px-4 rounded-md font-medium text-sm transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onBuyProduct(product);
                onClose();
              }}
              className="flex-1 bg-[#D7FC51] hover:bg-[#D7FC51]/80 text-black py-3 px-4 rounded-md font-medium text-sm transition-colors"
            >
              Buy Now - {product.price}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComparisonModalProps {
  products: ShoppingProduct[];
  onClose: () => void;
  onBuyProduct: (product: ShoppingProduct) => void;
  onSendMessage?: (message: string) => void;
}

function ComparisonModal({ products, onClose, onBuyProduct, onSendMessage }: ComparisonModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Compare Products ({products.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
            {products.map((product, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {/* Product Image */}
                {product.imageUrl && product.imageUrl !== 'Image not found' && (
                  <div className="w-full h-40 bg-gray-50 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={160}
                      height={160}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Product Details */}
                <div className="space-y-3">
                  {/* Badge */}
                  <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getBadgeStyle(product.badge || 'Good Pick')}`}>
                    {product.badge || 'Good Pick'}
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold text-gray-900">
                    {product.price}
                  </div>

                  {/* Rating */}
                  {product.rating && product.rating !== 'Rating not available' && (
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {'★'.repeat(Math.floor(parseFloat(product.rating.replace(' out of 5', ''))))}
                        {'☆'.repeat(5 - Math.floor(parseFloat(product.rating.replace(' out of 5', ''))))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating.replace(' out of 5', '')}
                      </span>
                    </div>
                  )}

                  {/* Product Name */}
                  <h3 className="font-medium text-gray-900 line-clamp-3 text-sm leading-tight">
                    {product.name}
                  </h3>

                  {/* Pros/Cons */}
                  {product.reviewSummary && (
                    <div className="space-y-2">
                      {product.reviewSummary.likes.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-emerald-700 mb-1">Pros:</div>
                          <ul className="text-xs text-emerald-600 space-y-0.5">
                            {product.reviewSummary.likes.slice(0, 2).map((like, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-emerald-400 mr-1">+</span>
                                {like}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {product.reviewSummary.dislikes.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-amber-700 mb-1">Cons:</div>
                          <ul className="text-xs text-amber-600 space-y-0.5">
                            {product.reviewSummary.dislikes.slice(0, 2).map((dislike, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-amber-400 mr-1">-</span>
                                {dislike}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Buy Button */}
                  <button
                    onClick={() => {
                      onBuyProduct(product);
                      onClose();
                    }}
                    className="w-full bg-[#D7FC51] hover:bg-[#D7FC51]/80 text-black py-2 px-3 rounded-md text-sm font-medium transition-colors"
                  >
                    Buy - {product.price}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-4">
            {/* Comparison Smart Nudges */}
            {onSendMessage && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onSendMessage("Which one has better reviews overall?");
                    onClose();
                  }}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-md text-sm text-blue-700 hover:text-blue-800 transition-colors"
                >
                  Which has better reviews?
                </button>
                <button
                  onClick={() => {
                    onSendMessage("Help me decide based on value for money");
                    onClose();
                  }}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-md text-sm text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Best value for money?
                </button>
                <button
                  onClick={() => {
                    onSendMessage("Show me similar alternatives to these products");
                    onClose();
                  }}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-md text-sm text-purple-700 hover:text-purple-800 transition-colors"
                >
                  Similar alternatives
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="self-start bg-white text-gray-700 border border-gray-300 hover:border-gray-400 py-2 px-4 rounded-md font-medium text-sm transition-colors"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}