'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Quote, PricingOption } from '@/lib/types/quote';
import { ArrowLeft, Download, Copy, Printer } from 'lucide-react';
import Link from 'next/link';

export default function CustomerQuotePage() {
  const params = useParams();
  const quoteId = params.id as string;
  const paymentOption = decodeURIComponent(params.option as string) as PricingOption;
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quotes/${quoteId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setQuote(result.data);
      } else {
        alert('Quote not found');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      alert('Error loading quote');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!quote) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quote.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCopyQuote = () => {
    // Copy quote text to clipboard
    const quoteText = generateQuoteText();
    navigator.clipboard.writeText(quoteText).then(() => {
      alert('Quote copied to clipboard!');
    });
  };

  const generateQuoteText = (): string => {
    if (!quote) return '';
    
    const pricing = quote.paymentOptionPricing.find(p => p.paymentOption === paymentOption);
    if (!pricing) return '';

    let text = `QUOTE FOR ${quote.accountName.toUpperCase()}\n`;
    text += `Deal: ${quote.dealName}\n`;
    text += `Date: ${formatDate(quote.updatedAt)}\n`;
    text += `Payment Option: ${paymentOption}\n`;
    text += `Term: ${quote.termLength} months\n\n`;
    
    text += `PRODUCTS:\n`;
    quote.productLineItems.forEach(item => {
      const discount = item.discounts?.[paymentOption] || 0;
      const annualPrice = item.annualTotal * (1 - discount / 100);
      const monthlyPrice = annualPrice / 12;
      text += `- ${item.productName} (SKU: ${item.sku})\n`;
      text += `  Quantity: ${item.quantity}\n`;
      text += `  Monthly Price: ${formatCurrency(monthlyPrice)}\n`;
      text += `  Annual Price: ${formatCurrency(annualPrice)}\n\n`;
    });
    
    text += `SUMMARY:\n`;
    text += `Blended Discount: ${pricing.blendedDiscount.toFixed(2)}%\n`;
    text += `ACV: ${formatCurrency(pricing.breakdown.acv)}\n`;
    text += `License TCV: ${formatCurrency(pricing.breakdown.licenseTcv)}\n`;
    text += `Recurring Annual Payment: ${formatCurrency(pricing.recurringAnnualPayment)}\n`;
    
    return text;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pulse-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="font-display text-lg font-semibold text-slate-800">Loading quote...</p>
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

  const pricing = quote.paymentOptionPricing.find(p => p.paymentOption === paymentOption);
  if (!pricing) {
    return (
      <div className="min-h-screen gradient-mesh p-8">
        <div className="max-w-4xl mx-auto card p-8 text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Payment Option Not Found</h1>
          <Link href={`/quotes/${quoteId}`} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Quote
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Header Actions - Hidden when printing */}
      <div className="bg-slate-50 border-b border-slate-200 print:hidden">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link
            href={`/quotes/${quoteId}`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-navy"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Quote Editor
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyQuote}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Quote Content */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-navy mb-2">Samsara</h1>
              <p className="text-slate-600">Fleet Management Solutions</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-navy mb-2">QUOTE</h2>
              <p className="text-sm text-slate-600">Date: {formatDate(quote.updatedAt)}</p>
              {quote.pricingExpiresOn && (
                <p className="text-sm text-slate-600">Valid Until: {formatDate(quote.pricingExpiresOn)}</p>
              )}
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
              <p className="text-slate-700">Payment Option: <span className="font-semibold">{paymentOption}</span></p>
              <p className="text-slate-700">Term Length: {quote.termLength} months</p>
              <p className="text-slate-700">Pricebook: {quote.pricebook}</p>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-navy mb-4">Products & Pricing</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Product</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">SKU</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Quantity</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Hardware</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Monthly Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Annual Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quote.productLineItems.map((item) => {
                  const discount = item.discounts?.[paymentOption] || 0;
                  const annualPrice = item.annualTotal * (1 - discount / 100);
                  const monthlyPrice = annualPrice / 12;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-navy">{item.productName}</div>
                        {discount > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            Discount: {discount.toFixed(2)}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">{item.sku}</td>
                      <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.hardware)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(monthlyPrice)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-navy">{formatCurrency(annualPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Pricing Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Annual List Price:</span>
                <span className="font-medium">{formatCurrency(pricing.annualListPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Blended Discount:</span>
                <span className="font-medium">{pricing.blendedDiscount.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount Value:</span>
                <span className="font-medium">{formatCurrency(pricing.breakdown.discountValue)}</span>
              </div>
              <div className="border-t border-slate-300 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-slate-700">ACV:</span>
                  <span className="text-lg font-bold text-navy">{formatCurrency(pricing.breakdown.acv)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-pulse-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Contract Value</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-pulse-100">Recurring Annual Payment:</span>
                <span className="font-semibold">{formatCurrency(pricing.recurringAnnualPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pulse-100">License TCV ({quote.termLength} months):</span>
                <span className="font-semibold">{formatCurrency(pricing.breakdown.licenseTcv)}</span>
              </div>
              <div className="border-t border-pulse-500 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">Total Contract Value:</span>
                  <span className="text-2xl font-bold">{formatCurrency(pricing.breakdown.licenseTcv)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Notes</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          <p>This quote is valid for the terms and conditions specified above.</p>
          <p className="mt-2">For questions, please contact your Samsara representative.</p>
        </div>
      </div>
    </div>
  );
}
