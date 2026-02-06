import { Account } from '@/lib/types/account';

// Mock account data for testing
export const mockAccounts: Account[] = [
  {
    id: 'acc-001',
    name: 'Acme Corporation',
    industry: 'Logistics',
    region: 'North America',
    accountType: 'Enterprise',
    existingContractInfo: 'Current customer, 3-year contract',
  },
  {
    id: 'acc-002',
    name: 'Global Transport Solutions',
    industry: 'Transportation',
    region: 'North America',
    accountType: 'Enterprise',
  },
  {
    id: 'acc-003',
    name: 'Metro Delivery Services',
    industry: 'Last Mile Delivery',
    region: 'North America',
    accountType: 'Mid-Market',
  },
  {
    id: 'acc-004',
    name: 'Pacific Freight Lines',
    industry: 'Freight',
    region: 'North America',
    accountType: 'Enterprise',
    existingContractInfo: 'Prospect, no existing contract',
  },
  {
    id: 'acc-005',
    name: 'City Waste Management',
    industry: 'Waste Management',
    region: 'North America',
    accountType: 'Mid-Market',
  },
  {
    id: 'acc-006',
    name: 'Regional Food Distributors',
    industry: 'Food & Beverage',
    region: 'North America',
    accountType: 'Mid-Market',
  },
  {
    id: 'acc-007',
    name: 'National Construction Co.',
    industry: 'Construction',
    region: 'North America',
    accountType: 'Enterprise',
  },
  {
    id: 'acc-008',
    name: 'Express Courier Network',
    industry: 'Courier',
    region: 'North America',
    accountType: 'Mid-Market',
  },
];

// Helper function to search accounts by name
export function searchAccounts(query: string): Account[] {
  const lowerQuery = query.toLowerCase();
  return mockAccounts.filter(acc => 
    acc.name.toLowerCase().includes(lowerQuery)
  );
}

// Helper function to get account by name
export function getAccountByName(name: string): Account | undefined {
  return mockAccounts.find(acc => acc.name === name);
}
