'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import { Account } from '@/lib/types/account';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import AccountAutocomplete from '@/components/AccountAutocomplete';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { generateDealName } from '@/lib/utils/formatting';
import { PRICING_OPTIONS } from '@/lib/constants';
import { PricingOption } from '@/lib/types/quote';

export default function NewQuotePage() {
  const router = useRouter();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    dealName: '',
    opportunityId: '',
    pricingOptions: ['Annual'] as PricingOption[],
    pricebook: 'FY26',
    currency: 'USD',
    termLength: 36,
    notes: '',
  });
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setFormData(prev => ({
      ...prev,
      accountName: account.name,
      dealName: generateDealName(account.name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate form before submitting
    if (!formData.accountName || formData.accountName.trim() === '') {
      alert('Please enter an account name');
      return;
    }
    
    if (formData.pricingOptions.length === 0) {
      alert('Please select at least one pricing option');
      return;
    }
    
    if (formData.termLength <= 0) {
      alert('Please enter a valid term length (greater than 0)');
      return;
    }
    
    setSaving(true);

    const quoteData = {
      accountName: formData.accountName,
      dealName: formData.dealName || generateDealName(formData.accountName),
      opportunityId: formData.opportunityId || undefined,
      pricingOptions: formData.pricingOptions,
      pricebook: formData.pricebook,
      currency: formData.currency,
      termLength: formData.termLength > 0 ? formData.termLength : 36,
      productLineItems: [],
      notes: formData.notes || undefined,
      createdBy: user?.email || user?.name || 'unknown',
    };

    try {
      console.log('Creating quote with data:', quoteData);
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      });

      console.log('Response status:', response.status, response.statusText);
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
          console.log('Response data:', result);
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          const text = await response.text();
          console.error('Response text:', text);
          alert('Error creating quote: Invalid server response. Please check console.');
          setSaving(false);
          return;
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        alert('Error creating quote: ' + (text || `HTTP ${response.status}`));
        setSaving(false);
        return;
      }
      
      if (!response.ok) {
        console.error('API Error (non-200 status):', result);
        const errorMessage = result?.error || result?.message || `HTTP ${response.status}: ${response.statusText}`;
        alert('Error creating quote: ' + errorMessage);
        setSaving(false);
        return;
      }

      if (!result.success) {
        console.error('API Error (success: false):', result);
        const errorMessage = result.error || result.message || 'Unknown error occurred';
        alert('Error creating quote: ' + errorMessage);
        setSaving(false);
        return;
      }

      if (result.success && result.data?.id) {
        const quoteId = result.data.id;
        console.log('Quote created successfully with ID:', quoteId);
        console.log('Full quote data:', result.data);
        
        // Small delay to ensure server has processed the creation
        // Then verify the quote exists before redirecting
        setTimeout(async () => {
          try {
            const verifyResponse = await fetch(`/api/quotes/${quoteId}`);
            if (verifyResponse.ok) {
              const verifyResult = await verifyResponse.json();
              if (verifyResult.success && verifyResult.data) {
                console.log('Quote verified, redirecting...');
                window.location.href = `/quotes/${quoteId}`;
              } else {
                console.error('Quote verification failed:', verifyResult);
                alert('Quote was created but could not be verified. Please refresh the quotes list and try again.');
                window.location.href = '/';
              }
            } else {
              console.error('Quote verification HTTP error:', verifyResponse.status);
              alert('Quote was created but could not be verified. The server may have restarted. Please check the quotes list.');
              window.location.href = '/';
            }
          } catch (verifyError) {
            console.error('Error verifying quote:', verifyError);
            // Still try to redirect - might work
            window.location.href = `/quotes/${quoteId}`;
          }
        }, 100);
      } else {
        console.error('Unexpected response format:', result);
        const errorMsg = result?.error || result?.message || 'Invalid response format - quote ID missing';
        alert('Error: ' + errorMsg + '\n\nPlease check the console for details.');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Error creating quote: ' + errorMessage + '\n\nPlease check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-navy mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Quotes
        </Link>

        <div className="card p-8">
          <h1 className="text-3xl font-bold text-navy mb-6">Create New Quote</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Account Name *
                </label>
                <AccountAutocomplete
                  value={formData.accountName}
                  onChange={(name) => {
                    setFormData(prev => ({
                      ...prev,
                      accountName: name,
                      dealName: name ? generateDealName(name) : '',
                    }));
                  }}
                  onAccountSelect={handleAccountSelect}
                />
                {selectedAccount && (
                  <div className="mt-2 text-sm text-slate-500">
                    {selectedAccount.industry && `${selectedAccount.industry}`}
                    {selectedAccount.region && ` • ${selectedAccount.region}`}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deal Name *
                </label>
                <input
                  type="text"
                  value={formData.dealName}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealName: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                  placeholder="Auto-generated from account + date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opportunity ID
                </label>
                <input
                  type="text"
                  value={formData.opportunityId}
                  onChange={(e) => setFormData(prev => ({ ...prev, opportunityId: e.target.value }))}
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                  placeholder="SFDC Opportunity ID (optional)"
                />
              </div>

              <div>
                <MultiSelectDropdown
                  label="Pricing Options*"
                  options={PRICING_OPTIONS}
                  selected={formData.pricingOptions}
                  onChange={(updated) => {
                    setFormData(prev => ({
                      ...prev,
                      pricingOptions: updated as PricingOption[],
                    }));
                  }}
                  placeholder="Select pricing options..."
                />
                {formData.pricingOptions.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">Please select at least one pricing option</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pricebook *
                </label>
                <select
                  value={formData.pricebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricebook: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
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
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
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
                  value={formData.termLength === 0 ? '' : formData.termLength.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFormData(prev => ({ ...prev, termLength: 0 }));
                    } else {
                      const num = parseInt(value);
                      if (!isNaN(num) && num > 0) {
                        setFormData(prev => ({ ...prev, termLength: num }));
                      }
                    }
                  }}
                  required
                  min={1}
                  placeholder="36"
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
                placeholder="Additional notes (optional)"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || !formData.accountName || formData.pricingOptions.length === 0 || formData.termLength <= 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Creating...' : 'Create Quote'}
              </button>
              <Link
                href="/"
                className="px-6 py-3 text-slate-600 hover:text-navy font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
