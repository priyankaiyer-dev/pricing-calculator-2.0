'use client';

import { useState } from 'react';
import { PricingOption } from '@/lib/types/quote';
import { PRICING_OPTIONS } from '@/lib/constants';
import { DollarSign, Percent } from 'lucide-react';

function fullRecordFromPartial(
  partial: Record<PricingOption, number> | undefined,
  override: Partial<Record<PricingOption, number>>
): Record<PricingOption, number> {
  const base = Object.fromEntries(PRICING_OPTIONS.map((opt) => [opt, partial?.[opt] ?? 0])) as Record<PricingOption, number>;
  return { ...base, ...override };
}

interface RebatesAndSubsidiesProps {
  pricingOptions: PricingOption[];
  rebatesAndSubsidies: {
    rebate?: Record<PricingOption, number>;
    subsidyAmount?: number;
    subsidyPercentage?: number;
    freeMonths?: Record<PricingOption, number>;
  };
  annualListPrice: number; // Annual list price (before discounts)
  discountedAnnualPrices: Record<PricingOption, number>; // Discounted annual price per payment option (after product discounts)
  currency: string;
  onUpdate: (updates: {
    rebate?: Record<PricingOption, number>;
    subsidyAmount?: number;
    subsidyPercentage?: number;
    freeMonths?: Record<PricingOption, number>;
  }) => void;
}

export default function RebatesAndSubsidiesComponent({
  pricingOptions,
  rebatesAndSubsidies,
  annualListPrice,
  discountedAnnualPrices,
  currency,
  onUpdate,
}: RebatesAndSubsidiesProps) {
  const [subsidyType, setSubsidyType] = useState<'amount' | 'percentage'>(
    rebatesAndSubsidies.subsidyAmount !== undefined ? 'amount' : 'percentage'
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Rebate is NOT available for: Quarterly, Financed Monthly, Semi-Annual
  const rebateEligibleOptions = pricingOptions.filter(
    option => !['Quarterly', 'Financed Monthly', 'Semi-Annual'].includes(option)
  );

  // Subsidy is ONLY available for Financed Monthly
  const hasFinancedMonthly = pricingOptions.includes('Financed Monthly');

  const handleRebateChange = (option: PricingOption, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate({
        ...rebatesAndSubsidies,
        rebate: fullRecordFromPartial(rebatesAndSubsidies.rebate, { [option]: numValue }),
      });
    } else if (value === '') {
      onUpdate({
        ...rebatesAndSubsidies,
        rebate: fullRecordFromPartial(rebatesAndSubsidies.rebate, { [option]: 0 }),
      });
    }
  };

  const handleSubsidyChange = (value: string) => {
    if (subsidyType === 'amount') {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        onUpdate({
          ...rebatesAndSubsidies,
          subsidyAmount: numValue,
          subsidyPercentage: undefined,
        });
      } else if (value === '') {
        onUpdate({
          ...rebatesAndSubsidies,
          subsidyAmount: 0,
          subsidyPercentage: undefined,
        });
      }
    } else {
      const numValue = value === '' ? 0 : parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        onUpdate({
          ...rebatesAndSubsidies,
          subsidyPercentage: numValue,
          subsidyAmount: undefined,
        });
      } else if (value === '') {
        onUpdate({
          ...rebatesAndSubsidies,
          subsidyPercentage: 0,
          subsidyAmount: undefined,
        });
      }
    }
  };

  const handleFreeMonthsChange = (option: PricingOption, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate({
        ...rebatesAndSubsidies,
        freeMonths: fullRecordFromPartial(rebatesAndSubsidies.freeMonths, { [option]: numValue }),
      });
    } else if (value === '') {
      onUpdate({
        ...rebatesAndSubsidies,
        freeMonths: fullRecordFromPartial(rebatesAndSubsidies.freeMonths, { [option]: 0 }),
      });
    }
  };

  // Calculate free months discount value
  const calculateFreeMonthsDiscount = (option: PricingOption): number => {
    const freeMonths = rebatesAndSubsidies.freeMonths?.[option] || 0;
    if (freeMonths === 0) return 0;
    // Free months discount = (discounted annual price / 12) * free months
    const discountedAnnual = discountedAnnualPrices[option] || 0;
    const monthlyPrice = discountedAnnual / 12;
    return monthlyPrice * freeMonths;
  };

  return (
    <div className="space-y-6">
      {/* Rebate Section */}
      {rebateEligibleOptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-navy mb-3">
            Rebate (Buyout / Installation)
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Fixed dollar amount applied as an upfront discount. Available for: {rebateEligibleOptions.join(', ')}.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rebateEligibleOptions.map(option => {
              const rebate = rebatesAndSubsidies.rebate?.[option] || 0;
              return (
                <div key={option}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {option}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={rebate === 0 ? '' : rebate.toString()}
                      onChange={(e) => handleRebateChange(option, e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subsidy Section */}
      {hasFinancedMonthly && (
        <div>
          <h3 className="text-lg font-semibold text-navy mb-3">
            Subsidy for Financed Monthly
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Upfront discount for Financed Monthly deals only.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subsidy Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subsidyType"
                    value="amount"
                    checked={subsidyType === 'amount'}
                    onChange={() => {
                      setSubsidyType('amount');
                      onUpdate({
                        ...rebatesAndSubsidies,
                        subsidyAmount: 0,
                        subsidyPercentage: undefined,
                      });
                    }}
                    className="w-4 h-4 text-pulse-600"
                  />
                  <span className="text-slate-700">Dollar Amount</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subsidyType"
                    value="percentage"
                    checked={subsidyType === 'percentage'}
                    onChange={() => {
                      setSubsidyType('percentage');
                      onUpdate({
                        ...rebatesAndSubsidies,
                        subsidyPercentage: 0,
                        subsidyAmount: undefined,
                      });
                    }}
                    className="w-4 h-4 text-pulse-600"
                  />
                  <span className="text-slate-700">Percentage</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {subsidyType === 'amount' ? 'Subsidy Amount' : 'Subsidy Percentage'}
              </label>
              <div className="relative">
                {subsidyType === 'amount' ? (
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                ) : (
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                )}
                <input
                  type="text"
                  value={
                    subsidyType === 'amount'
                      ? (rebatesAndSubsidies.subsidyAmount || 0) === 0
                        ? ''
                        : (rebatesAndSubsidies.subsidyAmount || 0).toString()
                      : (rebatesAndSubsidies.subsidyPercentage || 0) === 0
                      ? ''
                      : (rebatesAndSubsidies.subsidyPercentage || 0).toString()
                  }
                  onChange={(e) => handleSubsidyChange(e.target.value)}
                  placeholder={subsidyType === 'amount' ? '0.00' : '0'}
                  max={subsidyType === 'percentage' ? '100' : undefined}
                  className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free Months Section */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-3">
          Free Months
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Number of free months applied upfront as an additional discount for any payment option.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pricingOptions.map(option => {
            const freeMonths = rebatesAndSubsidies.freeMonths?.[option] || 0;
            const discountValue = calculateFreeMonthsDiscount(option);
            return (
              <div key={option}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {option}
                </label>
                <input
                  type="text"
                  value={freeMonths === 0 ? '' : freeMonths.toString()}
                  onChange={(e) => handleFreeMonthsChange(option, e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500 mb-2"
                />
                {freeMonths > 0 && (
                  <div className="text-xs text-slate-600">
                    <div>{freeMonths} free month{freeMonths !== 1 ? 's' : ''}</div>
                    <div className="font-medium text-slate-700">
                      Discount Value: {formatCurrency(discountValue)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
