'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Quote, PricingOption } from '@/lib/types/quote';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  calculatePaymentOptionPricing,
  calculateRebateDiscount,
  calculateSubsidyDiscount,
  isHardwareOnlyItem,
} from '@/lib/utils/calculations';
/** Option-period frequency (months): 12 Annual, 3 Quarterly, 1 Monthly, termLength Upfront. */
function getOptionFrequency(option: PricingOption, termLength: number): number {
  switch (option) {
    case 'Annual': return 12;
    case 'Quarterly': return 3;
    case 'Financed Monthly':
    case 'Direct Monthly': return 1;
    case 'Upfront': return termLength;
    default: return 12;
  }
}

/** Per-option pricing with corrected formulas (matches Customer Quote view). All amounts in option-period terms except where noted. */
function getOptionPricing(quote: Quote, option: PricingOption) {
  const termLength = quote.termLength ?? 0;
  const nonHardware = quote.productLineItems.filter((i) => !isHardwareOnlyItem(i));
  const frequency = getOptionFrequency(option, termLength);
  const isUpfront = option === 'Upfront';

  const optionListPrice = nonHardware.reduce(
    (sum, item) => sum + (item.perLicensePerMonth ?? 0) * item.quantity * frequency,
    0
  );
  const optionLicenseDiscount = nonHardware.reduce(
    (sum, item) => {
      const discountPct = item.discounts?.[option] ?? 0;
      const licenseDiscountPerUnitPerMonth = (item.perLicensePerMonth ?? 0) * (discountPct / 100);
      return sum + licenseDiscountPerUnitPerMonth * item.quantity * frequency;
    },
    0
  );
  const sumOfOptionPrices = nonHardware.reduce((sum, item) => {
    const discount = item.discounts?.[option] ?? 0;
    const annualPrice = item.annualTotal * (1 - discount / 100);
    let optionPrice = annualPrice;
    if (option === 'Quarterly') optionPrice = annualPrice / 4;
    else if (option === 'Financed Monthly' || option === 'Direct Monthly') optionPrice = annualPrice / 12;
    else if (option === 'Upfront') optionPrice = annualPrice * (termLength / 12);
    return sum + optionPrice;
  }, 0);
  const discountedHardware = quote.productLineItems.reduce(
    (sum, item) =>
      sum + (item.hardware ?? 0) * item.quantity * (1 - (item.discounts?.[option] ?? 0) / 100),
    0
  );
  const postDiscountMonthlyPrice = frequency > 0 ? sumOfOptionPrices / frequency : 0;
  const freeMonthsCount = quote.rebatesAndSubsidies?.freeMonths?.[option] ?? 0;
  const freeMonthsValue = postDiscountMonthlyPrice * freeMonthsCount;
  const pricingForCredit = quote.paymentOptionPricing?.find((p) => p.paymentOption === option);
  const acvForSubsidy = pricingForCredit?.breakdown?.acvWithoutUpfrontDiscounts ?? 0;
  const creditAmount =
    calculateRebateDiscount(quote.rebatesAndSubsidies, option) +
    calculateSubsidyDiscount(quote.rebatesAndSubsidies, option, acvForSubsidy);
  const firstPayment =
    !isUpfront
      ? Math.max(0, sumOfOptionPrices + discountedHardware - creditAmount - freeMonthsValue)
      : null;
  const totalLicenseCost = Math.max(
    0,
    postDiscountMonthlyPrice * termLength + discountedHardware - creditAmount - freeMonthsValue
  );
  const annualLicenseDiscount = frequency > 0 && !isUpfront ? optionLicenseDiscount * (12 / frequency) : optionLicenseDiscount;
  const acv = !isUpfront && frequency > 0 ? postDiscountMonthlyPrice * 12 : totalLicenseCost;

  return {
    optionListPrice,
    optionLicenseDiscount,
    sumOfOptionPrices,
    discountedHardware,
    postDiscountMonthlyPrice,
    freeMonthsCount,
    freeMonthsValue,
    creditAmount,
    firstPayment,
    totalLicenseCost,
    annualLicenseDiscount,
    acv,
  };
}

export default function QuoteComparisonPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/quotes/${quoteId}`);
        const result = await response.json();
        if (result.success && result.data) setQuote(result.data);
        else setQuote(null);
      } catch {
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };
    if (quoteId) fetchQuote();
  }, [quoteId]);

  const formatCurrency = (amount: number) => {
    if (!quote) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quote.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const pricingOptions = useMemo(() => {
    if (!quote) return [];
    const opts = (quote as any).pricingOptions;
    if (Array.isArray(opts) && opts.length > 0) return opts as PricingOption[];
    const single = (quote as any).pricingOption;
    if (single) return [single] as PricingOption[];
    return ['Annual'] as PricingOption[];
  }, [quote]);

  const displayPricing = useMemo(() => {
    if (!quote || quote.productLineItems.length === 0 || pricingOptions.length === 0) return [];
    return calculatePaymentOptionPricing(
      quote.productLineItems,
      pricingOptions,
      quote.termLength,
      quote.rebatesAndSubsidies
    );
  }, [quote, pricingOptions]);

  /** Annual List Price (license only, non-hardware) — same for all options. */
  const annualListPrice = useMemo(() => {
    if (!quote) return 0;
    const nonHardware = quote.productLineItems.filter((i) => !isHardwareOnlyItem(i));
    return nonHardware.reduce(
      (sum, item) => sum + (item.perLicensePerMonth ?? 0) * item.quantity * 12,
      0
    );
  }, [quote]);

  /** Per-option computed pricing (corrected formulas). */
  const optionPricingMap = useMemo(() => {
    if (!quote) return new Map<PricingOption, ReturnType<typeof getOptionPricing>>();
    const m = new Map<PricingOption, ReturnType<typeof getOptionPricing>>();
    pricingOptions.forEach((opt) => m.set(opt, getOptionPricing(quote, opt)));
    return m;
  }, [quote, pricingOptions]);

  /** Blended discount % per option: (annual list + hardware list - discounted total) / (annual list + hardware list). */
  const blendedDiscountPercent = useMemo(() => {
    if (!quote) return new Map<PricingOption, number>();
    const hardwareList = quote.productLineItems.reduce(
      (s, i) => s + (i.hardware ?? 0) * i.quantity,
      0
    );
    const totalList = annualListPrice + hardwareList;
    const m = new Map<PricingOption, number>();
    pricingOptions.forEach((opt) => {
      const op = optionPricingMap.get(opt);
      if (!op || totalList === 0) return;
      const totalDiscounted = op.acv + op.discountedHardware;
      m.set(opt, ((totalList - totalDiscounted) / totalList) * 100);
    });
    return m;
  }, [quote, annualListPrice, optionPricingMap, pricingOptions]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-pulse-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="font-display text-lg font-semibold text-slate-800">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen gradient-mesh p-8">
        <div className="max-w-4xl mx-auto card p-8 text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Quote Not Found</h1>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Quotes
          </Link>
        </div>
      </div>
    );
  }

  if (quote.productLineItems.length === 0 || pricingOptions.length === 0) {
    return (
      <div className="min-h-screen gradient-mesh p-8">
        <div className="max-w-4xl mx-auto card p-8 text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">No products or payment options</h1>
          <Link href={`/quotes/${quoteId}`} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Quote
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link
            href={`/quotes/${quoteId}`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-navy"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Quote Editor
          </Link>
          <h1 className="text-xl font-bold text-navy uppercase tracking-wide">
            Quote Comparison
          </h1>
          <div className="w-32" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Header - Samsara branding */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-navy mb-2">Samsara</h1>
              <p className="text-slate-600">Fleet Management Solutions</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-navy mb-2">QUOTE COMPARISON</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">BILL TO:</h3>
              <p className="text-lg font-medium text-navy">{quote.accountName}</p>
              {quote.opportunityId && (
                <p className="text-sm text-slate-600 mt-1">Opportunity ID: {quote.opportunityId}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">QUOTE DETAILS:</h3>
              <p className="text-slate-700">Deal: {quote.dealName}</p>
              <p className="text-slate-700">
                Payment Options: <span className="font-semibold">{pricingOptions.join(', ')}</span>
              </p>
              <p className="text-slate-700">Term Length: {quote.termLength} months</p>
              <p className="text-slate-700">Pricebook: {quote.pricebook}</p>
            </div>
          </div>
        </div>

        {/* Pricing Overview by Payment Option */}
        <h3 className="text-xl font-semibold text-navy mb-4">Pricing Overview by Payment Option</h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full min-w-[600px] border-collapse">
            <colgroup>
              <col className="w-52" />
              {pricingOptions.map((opt) => (
                <col key={opt} className="min-w-[120px]" />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="bg-white px-4 py-3 text-left text-sm font-bold text-navy uppercase border-b border-r border-slate-300">
                  Annual Price by Product
                </th>
                {pricingOptions.map((opt) => (
                  <th
                    key={opt}
                    className="bg-slate-600 px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wide border-b border-r border-slate-500 last:border-r-0"
                  >
                    {opt}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quote.productLineItems.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr key={item.id} className={isEven ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-slate-800 font-medium border-b border-r border-slate-200">
                      {item.productName}
                    </td>
                    {pricingOptions.map((option) => {
                      const discount = item.discounts?.[option] ?? 0;
                      const annualPrice = item.annualTotal * (1 - discount / 100);
                      return (
                        <td
                          key={option}
                          className="px-4 py-3 text-right text-slate-800 border-b border-r border-slate-200 last:border-r-0"
                        >
                          {formatCurrency(annualPrice)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tbody>
              <tr>
                <td
                  colSpan={pricingOptions.length + 1}
                  className="bg-slate-100 px-4 py-3 text-sm font-bold text-navy uppercase tracking-wide border-t-2 border-b border-slate-300"
                >
                  Pricing Summary
                </td>
              </tr>
              {[
                {
                  label: 'Annual List Price',
                  getValue: (_option: PricingOption) => formatCurrency(annualListPrice),
                },
                {
                  label: 'Annual License Discount',
                  getValue: (option: PricingOption) => {
                    const op = optionPricingMap.get(option);
                    return op ? formatCurrency(op.annualLicenseDiscount) : '—';
                  },
                },
                {
                  label: 'Blended Discount %',
                  getValue: (option: PricingOption) => {
                    const pct = blendedDiscountPercent.get(option);
                    return pct !== undefined ? `${pct.toFixed(2)}%` : '—';
                  },
                },
                {
                  label: 'Credit (subsidies/rebates)',
                  getValue: (option: PricingOption) => {
                    const op = optionPricingMap.get(option);
                    return op ? formatCurrency(op.creditAmount) : '—';
                  },
                },
                {
                  label: 'Free Months Value',
                  getValue: (option: PricingOption) => {
                    const op = optionPricingMap.get(option);
                    return op ? formatCurrency(op.freeMonthsValue) : '—';
                  },
                },
                {
                  label: 'Annual Contract Value',
                  getValue: (option: PricingOption) => {
                    const op = optionPricingMap.get(option);
                    return op ? formatCurrency(op.acv) : '—';
                  },
                },
                {
                  label: 'Total License Cost',
                  getValue: (option: PricingOption) => {
                    const op = optionPricingMap.get(option);
                    return op ? formatCurrency(op.totalLicenseCost) : '—';
                  },
                },
                {
                  label: 'Recurring Payment',
                  getValue: (option: PricingOption) => {
                    if (option === 'Upfront') return '—';
                    const op = optionPricingMap.get(option);
                    return op ? formatCurrency(op.sumOfOptionPrices) : '—';
                  },
                },
                {
                  label: 'First Period Payment',
                  getValue: (option: PricingOption) => {
                    const op = optionPricingMap.get(option);
                    if (!op) return '—';
                    if (option === 'Upfront') return formatCurrency(op.totalLicenseCost);
                    return op.firstPayment != null ? formatCurrency(op.firstPayment) : '—';
                  },
                },
              ].map((row, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr key={row.label} className={isEven ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-2 font-semibold text-slate-700 border-b border-r border-slate-200">
                      {row.label}
                    </td>
                    {pricingOptions.map((option) => (
                      <td
                        key={option}
                        className="px-4 py-2 text-right font-medium text-slate-800 border-b border-r border-slate-200 last:border-r-0"
                      >
                        {row.getValue(option)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
