'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types/product';
import { Search, Plus, X } from 'lucide-react';

interface ProductSelectorProps {
  pricebook: 'FY26' | 'FY25' | 'Legacy';
  onProductSelect: (product: Product) => void;
  selectedProductIds?: string[];
}

export default function ProductSelector({ pricebook, onProductSelect, selectedProductIds = [] }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetchProducts();
    } else {
      setProducts([]);
      setShowResults(false);
    }
  }, [searchQuery, pricebook]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      params.set('pricebook', pricebook);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        // Filter out already selected products
        const available = result.data.filter((p: Product) => !selectedProductIds.includes(p.id));
        setProducts(available);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          placeholder="Search products by name or SKU..."
          className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-500">Searching...</div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              {searchQuery.length < 2 
                ? 'Type at least 2 characters to search'
                : 'No products found'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-navy">{product.name}</div>
                      <div className="text-sm text-slate-500 mt-1">SKU: {product.sku}</div>
                      {product.description && (
                        <div className="text-xs text-slate-400 mt-1">{product.description}</div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-navy">
                        ${product.perLicensePerMonth.toFixed(2)}/mo
                      </div>
                      {product.hardware > 0 && (
                        <div className="text-xs text-slate-500">
                          + ${product.hardware.toFixed(2)} hardware
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
