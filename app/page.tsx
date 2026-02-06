'use client';

import { useState, useEffect } from 'react';
import { Quote } from '@/lib/types/quote';
import { useUser } from '@/lib/hooks/useUser';
import { Plus, Search, FileText, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotes');
      const result = await response.json();
      if (result.success) {
        setQuotes(result.data);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      quote.accountName.toLowerCase().includes(query) ||
      quote.dealName.toLowerCase().includes(query) ||
      quote.id.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pulse-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="font-display text-lg font-semibold text-slate-800">Loading quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy mb-2">Pricing Calculator 2.0</h1>
          <p className="text-slate-600">Manage and create pricing quotes for your deals</p>
          {user && (
            <p className="text-sm text-slate-500 mt-2">
              Welcome, {user.name || user.email || 'User'}
            </p>
          )}
        </div>

        {/* Actions Bar */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by account name, deal name, or quote ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
              />
            </div>
            <Link
              href="/quotes/new"
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Quote
            </Link>
          </div>
        </div>

        {/* Quotes List */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-navy">
              All Quotes ({filteredQuotes.length})
            </h2>
          </div>
          
          {filteredQuotes.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-2">
                {searchQuery ? 'No quotes found matching your search' : 'No quotes yet'}
              </p>
              <p className="text-slate-500 mb-6">
                {searchQuery ? 'Try a different search term' : 'Create your first quote to get started'}
              </p>
              {!searchQuery && (
                <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Quote
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredQuotes.map((quote) => {
                // Support both new (pricingOptions array) and legacy (pricingOption single) formats
                const pricingOptions = (quote as any).pricingOptions || ((quote as any).pricingOption ? [(quote as any).pricingOption] : ['Annual']);
                const firstOption = pricingOptions[0] || 'Annual';
                const activePricing = quote.paymentOptionPricing.find(
                  p => p.paymentOption === firstOption
                ) || quote.paymentOptionPricing[0];
                
                return (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="block p-6 hover:bg-slate-50 transition-colors"
                    onClick={(e) => {
                      // Ensure navigation happens
                      console.log('Navigating to quote:', quote.id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-navy">
                            {quote.dealName}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium bg-pulse-100 text-pulse-700 rounded">
                            {quote.pricebook}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-3">{quote.accountName}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(quote.updatedAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {quote.createdBy}
                          </div>
                          {quote.opportunityId && (
                            <span className="text-xs">Opp: {quote.opportunityId}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-navy">
                          {formatCurrency(activePricing?.recurringAnnualPayment || 0, quote.currency)}
                        </div>
                        <div className="text-sm text-slate-500">
                          {pricingOptions.length === 1 ? pricingOptions[0] : `${pricingOptions.length} options`}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {quote.productLineItems.length} product{quote.productLineItems.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
