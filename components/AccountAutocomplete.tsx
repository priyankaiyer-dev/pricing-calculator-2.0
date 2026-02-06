'use client';

import { useState, useEffect, useRef } from 'react';
import { Account } from '@/lib/types/account';
import { Search, X } from 'lucide-react';

interface AccountAutocompleteProps {
  value: string;
  onChange: (accountName: string) => void;
  onAccountSelect?: (account: Account) => void;
  placeholder?: string;
}

export default function AccountAutocomplete({
  value,
  onChange,
  onAccountSelect,
  placeholder = 'Search accounts...',
}: AccountAutocompleteProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      fetchAccounts();
    } else {
      setAccounts([]);
      setShowResults(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounts?q=${encodeURIComponent(value)}`);
      const result = await response.json();
      
      if (result.success) {
        setAccounts(result.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (account: Account) => {
    onChange(account.name);
    if (onAccountSelect) {
      onAccountSelect(account);
    }
    setShowResults(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pulse-500"
        />
        {value && (
          <button
            onClick={() => {
              onChange('');
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-500">Searching...</div>
          ) : accounts.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              {value.length < 2 
                ? 'Type at least 2 characters to search'
                : 'No accounts found'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleSelect(account)}
                  className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="font-medium text-navy">{account.name}</div>
                  {account.industry && (
                    <div className="text-sm text-slate-500 mt-1">
                      {account.industry}
                      {account.region && ` • ${account.region}`}
                    </div>
                  )}
                  {account.existingContractInfo && (
                    <div className="text-xs text-slate-400 mt-1">{account.existingContractInfo}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
