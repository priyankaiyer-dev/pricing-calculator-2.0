'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Quote, PricingOption, ProductLineItem } from '@/lib/types/quote';
import { ArrowLeft, Download, Copy, Printer, Check } from 'lucide-react';
import Link from 'next/link';
import { getRecurringPaymentLabel, getFirstPeriodPaymentLabel, getListPriceLabel, getLicenseDiscountLabel, getPriceColumnLabel } from '@/lib/utils/formatting';
import { calculateRebateDiscount, calculateSubsidyDiscount } from '@/lib/utils/calculations';

export default function CustomerQuotePage() {
  const params = useParams();
  const quoteId = params.id as string;
  const paymentOption = decodeURIComponent(params.option as string) as PricingOption;
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const isHardwareOnly = (item: ProductLineItem): boolean => {
    const hasLicense = (item.perLicensePerMonth ?? 0) > 0;
    const hasHardware = (item.hardware ?? 0) > 0;
    if (item.isHardwareOnly === true) return true;
    if (hasHardware && !hasLicense) return true;
    if (hasHardware && hasLicense) {
      const hw = item.hardware ?? 0;
      const lic = item.perLicensePerMonth ?? 0;
      if (hw > 0 && Math.abs(lic * 12 - hw) < 1) return true;
    }
    return false;
  };

  /** Option-period frequency (months): 12 Annual, 3 Quarterly, 1 Monthly, termLength Upfront. */
  const optionFrequency =
    paymentOption === 'Annual' ? 12
    : paymentOption === 'Quarterly' ? 3
    : paymentOption === 'Financed Monthly' || paymentOption === 'Direct Monthly' ? 1
    : paymentOption === 'Upfront' ? (quote?.termLength ?? 0) : 12;

  /** Option List Price = SUM(Monthly Unit List Price * Quantity * frequency) for non-hardware. Ties to products above. */
  const optionListPriceFromProducts =
    quote?.productLineItems?.reduce((sum, item) => {
      if (isHardwareOnly(item)) return sum;
      return sum + (item.perLicensePerMonth ?? 0) * item.quantity * optionFrequency;
    }, 0) ?? 0;

  /** Option License Discount = SUM(License discount $/unit/month * Quantity * frequency) for non-hardware. */
  const optionLicenseDiscountFromProducts =
    quote?.productLineItems?.reduce((sum, item) => {
      if (isHardwareOnly(item)) return sum;
      const discountPct = item.discounts?.[paymentOption] ?? 0;
      const licenseDiscountPerUnitPerMonth = (item.perLicensePerMonth ?? 0) * (discountPct / 100);
      return sum + licenseDiscountPerUnitPerMonth * item.quantity * optionFrequency;
    }, 0) ?? 0;

  /** Sum of the "[Option] Price" column in Products table (e.g. 178.50 + 114.75 = 293.25 for Quarterly). */
  const sumOfOptionPrices =
    quote?.productLineItems?.reduce((sum, item) => {
      if (isHardwareOnly(item)) return sum;
      const discount = item.discounts?.[paymentOption] ?? 0;
      const annualPrice = item.annualTotal * (1 - discount / 100);
      let optionPrice = annualPrice;
      if (paymentOption === 'Quarterly') optionPrice = annualPrice / 4;
      else if (paymentOption === 'Financed Monthly' || paymentOption === 'Direct Monthly') optionPrice = annualPrice / 12;
      else if (paymentOption === 'Upfront') optionPrice = annualPrice * ((quote?.termLength ?? 0) / 12);
      return sum + optionPrice;
    }, 0) ?? 0;

  /** Discounted hardware total (product-level discounts applied). */
  const discountedHardwareFromProducts =
    quote?.productLineItems?.reduce(
      (sum, item) =>
        sum + (item.hardware ?? 0) * item.quantity * (1 - (item.discounts?.[paymentOption] ?? 0) / 100),
      0
    ) ?? 0;

  /** Free Months Value = Total post-license discount Monthly price × Number of free months. */
  const freeMonthsCount = quote?.rebatesAndSubsidies?.freeMonths?.[paymentOption] ?? 0;
  const postDiscountMonthlyPrice = optionFrequency > 0 ? sumOfOptionPrices / optionFrequency : 0;
  const freeMonthsValue = postDiscountMonthlyPrice * freeMonthsCount;

  /** First = Recurring + Hardware - Credit - Free Months Value (non-Upfront only). */
  const pricingForCredit = quote?.paymentOptionPricing?.find((p) => p.paymentOption === paymentOption);
  const creditAmount =
    quote && pricingForCredit
      ? calculateRebateDiscount(quote.rebatesAndSubsidies, paymentOption) +
        calculateSubsidyDiscount(
          quote.rebatesAndSubsidies,
          paymentOption,
          pricingForCredit.breakdown.acvWithoutUpfrontDiscounts ?? 0
        )
      : 0;
  const firstPaymentFromProducts =
    paymentOption !== 'Upfront'
      ? Math.max(0, sumOfOptionPrices + discountedHardwareFromProducts - creditAmount - freeMonthsValue)
      : null;

  /** Total License Cost = (Total Post-Discount Monthly Price × Term Length) + Upfront Hardware - Upfront Credits - Free Months Value. */
  const termLengthMonths = quote?.termLength ?? 0;
  const totalLicenseCostFromProducts = Math.max(
    0,
    postDiscountMonthlyPrice * termLengthMonths +
      discountedHardwareFromProducts -
      creditAmount -
      freeMonthsValue
  );

  const handleCopyQuote = async () => {
    const { html, plainText } = generateQuoteTableForClipboard();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(plainText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert('Could not copy to clipboard.');
      }
    }
  };

  /** Build combined Products & Pricing + Pricing Summary as HTML and plain text for clipboard (formatting retained when pasted). */
  function generateQuoteTableForClipboard(): { html: string; plainText: string } {
    if (!quote) return { html: '', plainText: '' };
    const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const th = (content: string, align: 'left' | 'center' | 'right' = 'left') =>
      `<th style="padding:10px 14px;text-align:${align};font-weight:700;font-size:13px;color:#334155;background:#f1f5f9;border:1px solid #e2e8f0;">${esc(content)}</th>`;
    const td = (content: string, align: 'left' | 'center' | 'right' = 'left', style = '') =>
      `<td style="padding:10px 14px;text-align:${align};border:1px solid #e2e8f0;${style}">${content}</td>`;

    let bodyRows = '';
    quote.productLineItems.forEach((item) => {
      const discount = item.discounts?.[paymentOption] ?? 0;
      const annualPrice = item.annualTotal * (1 - discount / 100);
      const monthlyUnitPrice = (item.perLicensePerMonth ?? 0) * (1 - discount / 100);
      const hardwareListTotal = (item.hardware ?? 0) * item.quantity;
      const hardwareTotal = hardwareListTotal * (1 - discount / 100);
      let optionPrice: number;
      switch (paymentOption) {
        case 'Annual': optionPrice = annualPrice; break;
        case 'Quarterly': optionPrice = annualPrice / 4; break;
        case 'Financed Monthly':
        case 'Direct Monthly': optionPrice = annualPrice / 12; break;
        case 'Upfront': optionPrice = annualPrice * (quote.termLength / 12); break;
        default: optionPrice = annualPrice;
      }
      const productCell = `<div style="font-weight:500;color:#1e3a5f;">${esc(item.productName)}</div><div style="font-size:12px;color:#64748b;margin-top:2px;">${esc(item.sku)}</div>`;
      const qtyCell = esc(String(item.quantity));
      const hwCell = hardwareListTotal === 0 ? '—' : `<span style="color:#64748b;text-decoration:line-through;">${esc(formatCurrency(hardwareListTotal))}</span><br><span style="font-weight:600;color:#1e3a5f;">${esc(formatCurrency(hardwareTotal))}</span>`;
      const monthlyCell = isHardwareOnly(item) ? '—' : `<span style="color:#64748b;text-decoration:line-through;">${esc(formatCurrency(item.perLicensePerMonth ?? 0))}</span><br><span style="font-weight:600;color:#1e3a5f;">${esc(formatCurrency(monthlyUnitPrice))}</span>`;
      const optionCell = isHardwareOnly(item) ? 'Upfront Cost' : formatCurrency(optionPrice);
      bodyRows += `<tr>${td(productCell, 'left')}${td(qtyCell, 'center')}${td(hwCell, 'right')}${td(monthlyCell, 'center')}${td(esc(optionCell), 'right', 'font-weight:600;color:#1e3a5f;')}</tr>`;
    });

    const pricingForCopy = quote.paymentOptionPricing.find((p) => p.paymentOption === paymentOption);
    const summaryRows = [
      [getListPriceLabel(paymentOption), formatCurrency(optionListPriceFromProducts)],
      [getLicenseDiscountLabel(paymentOption), formatCurrency(optionLicenseDiscountFromProducts)],
      ['Blended Discount', pricingForCopy ? `${pricingForCopy.blendedDiscount.toFixed(2)}%` : '—'],
      [getRecurringPaymentLabel(paymentOption), paymentOption === 'Upfront' ? '—' : formatCurrency(sumOfOptionPrices)],
      ['Hardware', formatCurrency(discountedHardwareFromProducts)],
      ['Credit (subsidies/rebates)', formatCurrency(creditAmount)],
      [`Free Months Value${freeMonthsCount > 0 ? ` (${freeMonthsCount} months)` : ''}`, formatCurrency(freeMonthsValue)],
      [getFirstPeriodPaymentLabel(paymentOption), formatCurrency(paymentOption === 'Upfront' ? totalLicenseCostFromProducts : (firstPaymentFromProducts ?? 0))],
      [`Total License Cost (${quote.termLength} months)`, formatCurrency(totalLicenseCostFromProducts)],
    ];

    const sectionHeaderStyle = 'padding:12px 14px;font-weight:700;font-size:15px;color:#334155;background:#f8fafc;border:1px solid #e2e8f0;';
    let summaryHtml = summaryRows.map(([label, value]) => `<tr><td colspan="4" style="padding:10px 14px;border:1px solid #e2e8f0;color:#475569;">${esc(label)}</td><td style="padding:10px 14px;text-align:right;border:1px solid #e2e8f0;font-weight:600;color:#1e3a5f;">${esc(value)}</td></tr>`).join('');
    const tableHtml = `<table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:system-ui,sans-serif;font-size:14px;">` +
      `<thead><tr><td colspan="5" style="${sectionHeaderStyle}">Products &amp; Pricing</td></tr><tr>${th('Product', 'left')}${th('Quantity', 'center')}${th('Hardware', 'right')}${th('Monthly Unit Price', 'center')}${th(getPriceColumnLabel(paymentOption), 'right')}</tr></thead>` +
      `<tbody>${bodyRows}` +
      `<tr><td colspan="5" style="${sectionHeaderStyle}">Pricing Summary</td></tr>` +
      summaryHtml + `</tbody></table>`;

    const html = `<meta charset="utf-8">${tableHtml}`;
    let plain = 'Products & Pricing\n' + 'Product\tQuantity\tHardware\tMonthly Unit Price\t' + getPriceColumnLabel(paymentOption) + '\n';
    quote.productLineItems.forEach((item) => {
      const discount = item.discounts?.[paymentOption] ?? 0;
      const annualPrice = item.annualTotal * (1 - discount / 100);
      const monthlyUnitPrice = (item.perLicensePerMonth ?? 0) * (1 - discount / 100);
      const hardwareListTotal = (item.hardware ?? 0) * item.quantity;
      const hardwareTotal = hardwareListTotal * (1 - discount / 100);
      let optionPrice: number;
      switch (paymentOption) {
        case 'Annual': optionPrice = annualPrice; break;
        case 'Quarterly': optionPrice = annualPrice / 4; break;
        case 'Financed Monthly':
        case 'Direct Monthly': optionPrice = annualPrice / 12; break;
        case 'Upfront': optionPrice = annualPrice * (quote.termLength / 12); break;
        default: optionPrice = annualPrice;
      }
      const optionCell = isHardwareOnly(item) ? 'Upfront Cost' : formatCurrency(optionPrice);
      plain += `${item.productName} (${item.sku})\t${item.quantity}\t${formatCurrency(hardwareTotal)}\t${isHardwareOnly(item) ? '—' : formatCurrency(monthlyUnitPrice)}\t${optionCell}\n`;
    });
    plain += '\nPricing Summary\n';
    summaryRows.forEach(([label, value]) => { plain += `${label}\t${value}\n`; });
    return { html, plainText: plain };
  }

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
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                copied
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
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
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Quantity</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Hardware</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Monthly Unit Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">{getPriceColumnLabel(paymentOption)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quote.productLineItems.map((item) => {
                  const discount = item.discounts?.[paymentOption] || 0;
                  const annualPrice = item.annualTotal * (1 - discount / 100);
                  const monthlyUnitPrice = (item.perLicensePerMonth ?? 0) * (1 - discount / 100);
                  const hardwareListTotal = (item.hardware ?? 0) * item.quantity;
                  const hardwareTotal = hardwareListTotal * (1 - discount / 100);
                  let optionPrice: number;
                  switch (paymentOption) {
                    case 'Annual':
                      optionPrice = annualPrice;
                      break;
                    case 'Quarterly':
                      optionPrice = annualPrice / 4;
                      break;
                    case 'Financed Monthly':
                    case 'Direct Monthly':
                      optionPrice = annualPrice / 12;
                      break;
                    case 'Upfront':
                      optionPrice = annualPrice * (quote.termLength / 12);
                      break;
                    default:
                      optionPrice = annualPrice;
                  }
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-navy">{item.productName}</div>
                        <div className="text-xs text-slate-500 mt-1">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        {hardwareListTotal === 0 ? (
                          '—'
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-slate-500 line-through">{formatCurrency(hardwareListTotal)}</span>
                            <span className="font-semibold text-navy">{formatCurrency(hardwareTotal)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {isHardwareOnly(item) ? (
                          '—'
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-500 line-through">{formatCurrency(item.perLicensePerMonth ?? 0)}</span>
                            <span className="font-semibold text-navy">{formatCurrency(monthlyUnitPrice)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-navy">
                        {isHardwareOnly(item) ? 'Upfront Cost' : formatCurrency(optionPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Summary - right-aligned */}
        <div className="mb-12 flex justify-end">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-xl w-full">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Pricing Summary</h3>
            <div className="space-y-0">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">{getListPriceLabel(paymentOption)}</span>
                <span className="font-medium">{formatCurrency(optionListPriceFromProducts)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">{getLicenseDiscountLabel(paymentOption)}</span>
                <span className="font-medium">{formatCurrency(optionLicenseDiscountFromProducts)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Blended Discount</span>
                <span className="font-medium">{pricing.blendedDiscount.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-2.5 px-3 -mx-3 bg-pulse-50 border-b border-pulse-100 rounded">
                <span className="text-slate-700 font-medium">{getRecurringPaymentLabel(paymentOption)}</span>
                <span className="font-semibold text-navy">
                  {paymentOption === 'Upfront' ? '—' : formatCurrency(sumOfOptionPrices)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Hardware</span>
                <span className="font-medium">{formatCurrency(discountedHardwareFromProducts)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Credit (subsidies/rebates)</span>
                <span className="font-medium">{formatCurrency(creditAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">
                  Free Months Value{freeMonthsCount > 0 ? ` (${freeMonthsCount} months)` : ''}
                </span>
                <span className="font-medium">{formatCurrency(freeMonthsValue)}</span>
              </div>
              {(firstPaymentFromProducts != null || paymentOption === 'Upfront') && (
                <div className="flex justify-between py-2.5 px-3 -mx-3 bg-pulse-50 border-b border-pulse-100 rounded">
                  <span className="text-slate-700 font-medium">{getFirstPeriodPaymentLabel(paymentOption)}</span>
                  <span className="font-semibold text-navy">
                    {formatCurrency(
                      paymentOption === 'Upfront' ? totalLicenseCostFromProducts : (firstPaymentFromProducts ?? 0)
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3 mt-2 border-t-2 border-slate-200 items-baseline">
                <span className="text-lg font-semibold text-slate-700">Total License Cost ({quote.termLength} months)</span>
                <span className="text-lg font-bold text-navy">{formatCurrency(totalLicenseCostFromProducts)}</span>
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
