'use client';

import { useState } from 'react';
import { PricingOption } from '@/lib/types/quote';
import { PRICING_OPTIONS } from '@/lib/constants';
import { DollarSign, Percent } from 'lucide-react';

interface DiscountManagerProps {
  paymentOptions: PricingOption[];
  discounts: Record<PricingOption, number>;
  onDiscountChange: (paymentOption: PricingOption, discount: number) => void;
  onTargetPriceChange: (paymentOption: PricingOption, targetPrice: number, listPrice: number) => void;
  listPrice: number;
  currency: string;
}

export default function DiscountManager({
  paymentOptions,
  discounts,
  onDiscountChange,
  onTargetPriceChange,
  listPrice,
  currency,
}: DiscountManagerProps) {
  const [inputMode, setInputMode] = useState<Record<PricingOption, 'discount' | 'target'>>(
    () =>
      Object.fromEntries(
        PRICING_OPTIONS.map((opt) => [opt, paymentOptions.includes(opt) ? 'discount' : 'discount'])
      ) as Record<PricingOption, 'discount' | 'target'>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTargetPrice = (discount: number) => {
    return listPrice * (1 - discount / 100);
  };

  const calculateDiscount = (targetPrice: number) => {
    if (listPrice === 0) return 0;
    return ((listPrice - targetPrice) / listPrice) * 100;
  };

  const handleTargetPriceInput = (option: PricingOption, value: string) => {
    // Allow empty string, then parse
    if (value === '' || value === '.') {
      onDiscountChange(option, 0);
      return;
    }
    const targetPrice = parseFloat(value);
    if (!isNaN(targetPrice) && targetPrice >= 0 && targetPrice <= listPrice) {
      const discount = calculateDiscount(targetPrice);
      onDiscountChange(option, discount);
    }
  };

  const handleDiscountInput = (option: PricingOption, value: string) => {
    // Allow empty string, then parse
    if (value === '' || value === '.') {
      onDiscountChange(option, 0);
      return;
    }
    const discount = parseFloat(value);
    if (!isNaN(discount) && discount >= 0 && discount <= 100) {
      onDiscountChange(option, discount);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-navy mb-4">Discount Management</h3>
      <div className="space-y-3">
        {paymentOptions.map((option) => {
          const discount = discounts[option] || 0;
          const targetPrice = calculateTargetPrice(discount);
          const mode = inputMode[option] || 'discount';

          return (
            <div key={option} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-slate-700">{option}</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInputMode({ ...inputMode, [option]: 'discount' })}
                    className={`px-3 py-1 text-sm rounded ${
                      mode === 'discount'
                        ? 'bg-pulse-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Percent className="w-4 h-4 inline mr-1" />
                    Discount
                  </button>
                  <button
                    onClick={() => setInputMode({ ...inputMode, [option]: 'target' })}
                    className={`px-3 py-1 text-sm rounded ${
                      mode === 'target'
                        ? 'bg-pulse-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Target Price
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {mode === 'discount' ? (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Discount %</label>
                    <input
                      type="text"
                      value={discount === 0 ? '' : discount.toString()}
                      onChange={(e) => handleDiscountInput(option, e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      Target Price: {formatCurrency(targetPrice)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Target Price</label>
                    <input
                      type="text"
                      value={targetPrice === 0 ? '' : targetPrice.toString()}
                      onChange={(e) => handleTargetPriceInput(option, e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      Discount: {discount.toFixed(2)}%
                    </div>
                  </div>
                )}

                <div className="flex flex-col justify-end">
                  <div className="text-sm text-slate-600">List Price</div>
                  <div className="text-lg font-semibold text-navy">{formatCurrency(listPrice)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
