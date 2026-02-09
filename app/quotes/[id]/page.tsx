'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Quote, ProductLineItem, PricingOption } from '@/lib/types/quote';
import { Product, getProductPriceForCurrency } from '@/lib/types/product';
import { Account } from '@/lib/types/account';
import { ArrowLeft, Save, Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';
import AccountAutocomplete from '@/components/AccountAutocomplete';
import ProductSelector from '@/components/ProductSelector';
import ProductLineItems from '@/components/ProductLineItems';
import RebatesAndSubsidies from '@/components/RebatesAndSubsidies';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { calculateAnnualTotal, calculatePaymentOptionPricing, calculateAnnualListPrice, calculateDiscountedPriceForOption } from '@/lib/utils/calculations';
import { generateDealName } from '@/lib/utils/formatting';
import { PRICING_OPTIONS } from '@/lib/constants';

export default function QuoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [selectedPricingOptions, setSelectedPricingOptions] = useState<PricingOption[]>([]);

  useEffect(() => {
    if (quoteId) {
      console.log('Fetching quote with ID:', quoteId);
      fetchQuote();
    }
  }, [quoteId]);

  useEffect(() => {
    if (quote) {
      console.log('Quote loaded:', quote.id, quote.dealName);
      // Initialize pricing options (support both old single option and new multi-option)
      if (Array.isArray((quote as any).pricingOptions)) {
        setSelectedPricingOptions((quote as any).pricingOptions);
      } else if ((quote as any).pricingOption) {
        // Legacy: single pricing option
        setSelectedPricingOptions([(quote as any).pricingOption]);
      } else {
        setSelectedPricingOptions(['Annual']); // Default
      }
    }
  }, [quote]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quotes/${quoteId}`);
      
      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          console.log('Raw response text:', text);
          
          if (!text || text.trim() === '') {
            console.error('Empty response body');
            alert(`Error loading quote: Empty response from server (Status: ${response.status})`);
            router.push('/');
            return;
          }
          
          result = JSON.parse(text);
          console.log('Parsed result:', result);
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          alert('Error loading quote: Invalid server response format. Please check console.');
          router.push('/');
          return;
        }
      } else {
        // Non-JSON response
        const text = await response.text();
        console.error('Non-JSON response:', text);
        alert('Error loading quote: ' + (text || `HTTP ${response.status}`));
        router.push('/');
        return;
      }
      
      if (!response.ok) {
        console.error('API Error fetching quote - Status:', response.status, 'Response:', result);
        const errorMessage = result?.error || result?.message || `HTTP ${response.status}: Quote not found`;
        alert('Error loading quote: ' + errorMessage + '\n\nNote: In-memory quotes are lost on server restart.');
        router.push('/');
        return;
      }
      
      if (result && result.success && result.data) {
        console.log('Quote loaded successfully:', result.data.id);
        setQuote(result.data);
      } else {
        console.error('Unexpected response format:', result);
        alert('Quote not found or invalid format. Response: ' + JSON.stringify(result));
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      alert('Error loading quote: ' + (error instanceof Error ? error.message : 'Please try again'));
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const saveQuote = useCallback(async (updates: Partial<Quote>) => {
    if (!quote) return;

    try {
      setSaving(true);
      setSaveStatus('saving');

      // Recalculate payment option pricing using product-level discounts and rebates/subsidies
      const lineItems = updates.productLineItems || quote.productLineItems;
      const termLength = updates.termLength || quote.termLength;
      const pricingOpts = (updates as any).pricingOptions || selectedPricingOptions;
      const rebatesAndSubsidies = (updates as any).rebatesAndSubsidies || quote.rebatesAndSubsidies;

      const paymentOptionPricing = calculatePaymentOptionPricing(
        lineItems,
        pricingOpts,
        termLength,
        rebatesAndSubsidies
      );

      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          pricingOptions: pricingOpts,
          paymentOptionPricing,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setQuote(result.data);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus('error');
        console.error('Error saving quote:', result.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving quote:', error);
    } finally {
      setSaving(false);
    }
  }, [quote, quoteId, selectedPricingOptions]);

  const handleAccountSelect = (account: Account) => {
    if (!quote) return;
    
    const dealName = generateDealName(account.name);
    saveQuote({
      accountName: account.name,
      dealName,
    });
  };

  const handleProductSelect = (product: Product) => {
    if (!quote) return;

    const { hardware, perLicensePerMonth } = getProductPriceForCurrency(product, quote.currency);

    const newItem: ProductLineItem = {
      id: `item-${Date.now()}`,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      hardware,
      perLicensePerMonth,
      annualTotal: calculateAnnualTotal({
        id: '',
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        hardware,
        perLicensePerMonth,
        annualTotal: 0,
      }),
      discounts: Object.fromEntries(PRICING_OPTIONS.map((opt) => [opt, 0])) as Record<PricingOption, number>,
    };

    const updatedItems = [...quote.productLineItems, newItem];
    saveQuote({ productLineItems: updatedItems });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (!quote) return;

    const updatedItems = quote.productLineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, quantity };
        return {
          ...updated,
          annualTotal: calculateAnnualTotal(updated),
        };
      }
      return item;
    });

    saveQuote({ productLineItems: updatedItems });
  };

  const handleRemoveProduct = (id: string) => {
    if (!quote) return;

    const updatedItems = quote.productLineItems.filter(item => item.id !== id);
    saveQuote({ productLineItems: updatedItems });
  };

  const handleProductDiscountChange = (itemId: string, paymentOption: PricingOption, discount: number) => {
    if (!quote) return;

    const defaultDiscounts = Object.fromEntries(PRICING_OPTIONS.map((opt) => [opt, 0])) as Record<PricingOption, number>;
    const updatedItems = quote.productLineItems.map(item => {
      if (item.id === itemId) {
        const updatedDiscounts: Record<PricingOption, number> = {
          ...defaultDiscounts,
          ...(item.discounts || defaultDiscounts),
          [paymentOption]: discount,
        };
        return { ...item, discounts: updatedDiscounts };
      }
      return item;
    });

    saveQuote({ productLineItems: updatedItems });
  };

  const handleRebatesAndSubsidiesChange = (updates: any) => {
    if (!quote) return;
    saveQuote({ rebatesAndSubsidies: updates });
  };

  const handleFieldChange = (field: keyof Quote, value: any) => {
    if (!quote) return;
    saveQuote({ [field]: value });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        router.push('/');
      } else {
        alert('Error deleting quote: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Error deleting quote');
    }
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
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-600">Quote not found</p>
          <Link href="/" className="text-pulse-600 hover:underline">Back to quotes</Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quote.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get annual list price from first pricing option (all should have same list price)
  const annualListPrice = quote.paymentOptionPricing[0]?.annualListPrice || 0;

  return (
    <div className="min-h-screen gradient-mesh p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-navy"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Quotes
          </Link>
          <div className="flex items-center gap-4">
            {saveStatus && (
              <span className={`text-sm ${
                saveStatus === 'saved' ? 'text-green-600' : 
                saveStatus === 'saving' ? 'text-blue-600' : 
                'text-red-600'
              }`}>
                {saveStatus === 'saved' ? 'Saved' : 
                 saveStatus === 'saving' ? 'Saving...' : 
                 'Error saving'}
              </span>
            )}
            <button
              onClick={handleDelete}
              type="button"
              className="px-4 py-2 text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Deal Information */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-navy mb-4">Deal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Name *
              </label>
              <AccountAutocomplete
                value={quote.accountName}
                onChange={(name) => handleFieldChange('accountName', name)}
                onAccountSelect={handleAccountSelect}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deal Name *
              </label>
              <input
                type="text"
                value={quote.dealName}
                onChange={(e) => handleFieldChange('dealName', e.target.value)}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Opportunity ID
              </label>
              <input
                type="text"
                value={quote.opportunityId || ''}
                onChange={(e) => handleFieldChange('opportunityId', e.target.value || undefined)}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                placeholder="SFDC Opportunity ID (optional)"
              />
            </div>

            <div>
              <MultiSelectDropdown
                label="Pricing Options*"
                options={PRICING_OPTIONS}
                selected={selectedPricingOptions}
                onChange={(updated) => {
                  setSelectedPricingOptions(updated);
                  handleFieldChange('pricingOptions' as any, updated);
                }}
                placeholder="Select pricing options..."
              />
              {selectedPricingOptions.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Please select at least one pricing option</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pricebook *
              </label>
              <select
                value={quote.pricebook}
                onChange={(e) => handleFieldChange('pricebook', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
              >
                <option value="FY26">FY26</option>
                <option value="FY25">FY25</option>
                <option value="Legacy">Legacy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency *
              </label>
              <select
                value={quote.currency}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="MXN">MXN</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Term Length (months) *
              </label>
              <input
                type="text"
                value={quote.termLength === 0 ? '' : quote.termLength.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleFieldChange('termLength', 0);
                  } else {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                      handleFieldChange('termLength', num);
                    }
                  }
                }}
                placeholder="36"
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
              />
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-navy mb-4">Add Products</h2>
          <ProductSelector
            pricebook={quote.pricebook}
            onProductSelect={handleProductSelect}
            selectedProductIds={quote.productLineItems.map(item => item.id)}
          />
        </div>

        {/* Product Line Items */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-navy mb-4">Product Line Items</h2>
          {selectedPricingOptions.length === 0 ? (
            <p className="text-slate-500">Please select at least one pricing option to add discounts.</p>
          ) : (
            <ProductLineItems
              items={quote.productLineItems}
              currency={quote.currency}
              pricingOptions={selectedPricingOptions}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateDiscount={handleProductDiscountChange}
              onRemove={handleRemoveProduct}
            />
          )}
        </div>

        {/* Rebates and Subsidies */}
        {quote.productLineItems.length > 0 && selectedPricingOptions.length > 0 && (() => {
          // Calculate discounted annual prices for each payment option (after product-level discounts, before rebates/subsidies)
          const discountedPrices: Record<PricingOption, number> = {} as Record<PricingOption, number>;
          selectedPricingOptions.forEach(option => {
            discountedPrices[option] = calculateDiscountedPriceForOption(quote.productLineItems, option);
          });
          
          return (
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold text-navy mb-4">Rebates and Subsidies</h2>
              <RebatesAndSubsidies
                pricingOptions={selectedPricingOptions}
                rebatesAndSubsidies={quote.rebatesAndSubsidies || {}}
                annualListPrice={calculateAnnualListPrice(quote.productLineItems)}
                discountedAnnualPrices={discountedPrices}
                currency={quote.currency}
                onUpdate={handleRebatesAndSubsidiesChange}
              />
            </div>
          );
        })()}

        {/* Pricing Breakdown */}
        {quote.productLineItems.length > 0 && selectedPricingOptions.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-navy">
                Pricing Breakdown
              </h2>
            </div>
            {selectedPricingOptions.map(option => {
              const pricing = quote.paymentOptionPricing.find(p => p.paymentOption === option);
              if (!pricing) return null;
              
              return (
                <div key={option} className="mb-6 last:mb-0 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">{option}</h3>
                    <Link
                      href={`/quotes/${quote.id}/view/${encodeURIComponent(option)}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      View Customer Quote
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Blended Discount</div>
                      <div className="text-2xl font-bold text-navy">
                        {pricing.blendedDiscount.toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Discount Value</div>
                      <div className="text-2xl font-bold text-navy">
                        {formatCurrency(pricing.breakdown.discountValue)}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">ACV</div>
                      <div className="text-2xl font-bold text-navy">
                        {formatCurrency(pricing.breakdown.acv)}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">License TCV</div>
                      <div className="text-2xl font-bold text-navy">
                        {formatCurrency(pricing.breakdown.licenseTcv)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-pulse-600 text-white rounded-lg">
                    <div className="text-sm mb-1">Recurring Annual Payment</div>
                    <div className="text-3xl font-bold">
                      {formatCurrency(pricing.recurringAnnualPayment)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
