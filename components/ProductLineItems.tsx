'use client';

import { useState } from 'react';
import { ProductLineItem, PricingOption } from '@/lib/types/quote';
import { Trash2, Minus, Plus } from 'lucide-react';

interface ProductLineItemsProps {
  items: ProductLineItem[];
  currency: string;
  pricingOptions: PricingOption[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDiscount: (id: string, paymentOption: PricingOption, discount: number) => void;
  onRemove: (id: string) => void;
}

export default function ProductLineItems({ 
  items, 
  currency, 
  pricingOptions,
  onUpdateQuantity, 
  onUpdateDiscount,
  onRemove 
}: ProductLineItemsProps) {
  const [editingDiscount, setEditingDiscount] = useState<{ itemId: string; option: PricingOption } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      onUpdateQuantity(id, newQuantity);
    }
  };

  const handleDiscountChange = (itemId: string, option: PricingOption, value: string) => {
    if (value === '' || value === '.') {
      onUpdateDiscount(itemId, option, 0);
      return;
    }
    const discount = parseFloat(value);
    if (!isNaN(discount) && discount >= 0 && discount <= 100) {
      onUpdateDiscount(itemId, option, discount);
    }
  };

  const getItemDiscount = (item: ProductLineItem, option: PricingOption): number => {
    return item.discounts?.[option] || 0;
  };

  const calculateDiscountedAnnualPrice = (item: ProductLineItem, option: PricingOption): number => {
    const discount = getItemDiscount(item, option);
    return item.annualTotal * (1 - discount / 100);
  };

  const calculateDiscountedMonthlyPrice = (item: ProductLineItem, option: PricingOption): number => {
    const annualPrice = calculateDiscountedAnnualPrice(item, option);
    return annualPrice / 12;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No products added yet. Use the search above to add products.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">PRODUCT</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">QTY</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">HARDWARE</th>
            {pricingOptions.map(option => (
              <th key={option} className="px-3 py-3 text-center text-sm font-semibold text-slate-700 bg-slate-50 min-w-[180px]">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium mb-1">{option}</span>
                  <div className="text-xs font-normal text-slate-500 space-y-0.5">
                    <div>Discount %</div>
                    <div>Monthly Price</div>
                    <div>Annual Price</div>
                  </div>
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium text-navy">{item.productName}</div>
                  <div className="text-sm text-slate-500">SKU: {item.sku}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="p-1 rounded hover:bg-slate-200 transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="p-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(item.hardware)}
              </td>
              {pricingOptions.map(option => {
                const discount = getItemDiscount(item, option);
                const discountedAnnual = calculateDiscountedAnnualPrice(item, option);
                const discountedMonthly = calculateDiscountedMonthlyPrice(item, option);
                
                return (
                  <td key={option} className="px-3 py-3 bg-slate-50">
                    <div className="flex flex-col items-center gap-2">
                      {/* Discount Input */}
                      <input
                        type="text"
                        value={discount === 0 ? '' : discount.toString()}
                        onChange={(e) => handleDiscountChange(item.id, option, e.target.value)}
                        onFocus={() => setEditingDiscount({ itemId: item.id, option })}
                        onBlur={() => setEditingDiscount(null)}
                        placeholder="0"
                        className="w-20 px-2 py-1.5 text-sm bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-pulse-500 text-center"
                      />
                      {/* Monthly Price (post discount) */}
                      <div className="text-xs text-slate-600 font-medium">
                        {formatCurrency(discountedMonthly)}/mo
                      </div>
                      {/* Annual Price (post discount) */}
                      <div className="text-xs text-slate-700 font-semibold">
                        {formatCurrency(discountedAnnual)}/yr
                      </div>
                    </div>
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
