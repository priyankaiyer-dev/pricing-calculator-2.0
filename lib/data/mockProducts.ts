import { Product } from '@/lib/types/product';

// Mock product data with SKUs and pricing for FY26, FY25, and Legacy pricebooks
export const mockProducts: Product[] = [
  // FY26 Products
  {
    id: 'prod-001',
    name: 'Video Safety Camera',
    sku: 'VS-CAM-001',
    description: 'AI-powered video safety camera with real-time alerts',
    pricebook: 'FY26',
    hardware: 299.00,
    perLicensePerMonth: 15.00,
    category: 'Video Safety',
  },
  {
    id: 'prod-002',
    name: 'Fleet Gateway',
    sku: 'FG-GW-2026',
    description: 'Next-generation fleet gateway with 5G connectivity',
    pricebook: 'FY26',
    hardware: 399.00,
    perLicensePerMonth: 25.00,
    category: 'Gateway',
  },
  {
    id: 'prod-003',
    name: 'Driver Safety Score',
    sku: 'DSS-PRO-26',
    description: 'Advanced driver safety scoring and coaching',
    pricebook: 'FY26',
    hardware: 0,
    perLicensePerMonth: 12.00,
    category: 'Safety',
  },
  {
    id: 'prod-004',
    name: 'Route Optimization',
    sku: 'RO-PREMIUM-26',
    description: 'AI-powered route optimization and planning',
    pricebook: 'FY26',
    hardware: 0,
    perLicensePerMonth: 18.00,
    category: 'Routing',
  },
  {
    id: 'prod-005',
    name: 'ELD Compliance',
    sku: 'ELD-COMP-26',
    description: 'Electronic Logging Device for DOT compliance',
    pricebook: 'FY26',
    hardware: 199.00,
    perLicensePerMonth: 20.00,
    category: 'Compliance',
  },
  {
    id: 'prod-006',
    name: 'Asset Tracker',
    sku: 'AT-GPS-26',
    description: 'GPS asset tracking with geofencing',
    pricebook: 'FY26',
    hardware: 149.00,
    perLicensePerMonth: 8.00,
    category: 'Tracking',
  },
  {
    id: 'prod-007',
    name: 'Temperature Monitoring',
    sku: 'TEMP-MON-26',
    description: 'Real-time temperature monitoring for cold chain',
    pricebook: 'FY26',
    hardware: 249.00,
    perLicensePerMonth: 10.00,
    category: 'Monitoring',
  },
  {
    id: 'prod-008',
    name: 'Fuel Management',
    sku: 'FUEL-MGT-26',
    description: 'Fuel consumption tracking and optimization',
    pricebook: 'FY26',
    hardware: 0,
    perLicensePerMonth: 14.00,
    category: 'Fuel',
  },
  // FY25 Products (slightly different pricing)
  {
    id: 'prod-009',
    name: 'Video Safety Camera',
    sku: 'VS-CAM-001',
    description: 'AI-powered video safety camera with real-time alerts',
    pricebook: 'FY25',
    hardware: 279.00,
    perLicensePerMonth: 14.00,
    category: 'Video Safety',
  },
  {
    id: 'prod-010',
    name: 'Fleet Gateway',
    sku: 'FG-GW-2025',
    description: 'Fleet gateway with 4G connectivity',
    pricebook: 'FY25',
    hardware: 349.00,
    perLicensePerMonth: 23.00,
    category: 'Gateway',
  },
  {
    id: 'prod-011',
    name: 'Driver Safety Score',
    sku: 'DSS-PRO-25',
    description: 'Driver safety scoring and coaching',
    pricebook: 'FY25',
    hardware: 0,
    perLicensePerMonth: 11.00,
    category: 'Safety',
  },
  {
    id: 'prod-012',
    name: 'Route Optimization',
    sku: 'RO-PREMIUM-25',
    description: 'Route optimization and planning',
    pricebook: 'FY25',
    hardware: 0,
    perLicensePerMonth: 16.00,
    category: 'Routing',
  },
  // Legacy Products
  {
    id: 'prod-013',
    name: 'Video Safety Camera',
    sku: 'VS-CAM-LEGACY',
    description: 'Video safety camera',
    pricebook: 'Legacy',
    hardware: 249.00,
    perLicensePerMonth: 12.00,
    category: 'Video Safety',
  },
  {
    id: 'prod-014',
    name: 'Fleet Gateway',
    sku: 'FG-GW-LEGACY',
    description: 'Fleet gateway',
    pricebook: 'Legacy',
    hardware: 299.00,
    perLicensePerMonth: 20.00,
    category: 'Gateway',
  },
  {
    id: 'prod-015',
    name: 'ELD Compliance',
    sku: 'ELD-COMP-LEGACY',
    description: 'Electronic Logging Device',
    pricebook: 'Legacy',
    hardware: 179.00,
    perLicensePerMonth: 18.00,
    category: 'Compliance',
  },
];

// Helper function to get products by pricebook
export function getProductsByPricebook(pricebook: 'FY26' | 'FY25' | 'Legacy'): Product[] {
  return mockProducts.filter(p => p.pricebook === pricebook);
}

// Helper function to search products by name or SKU
export function searchProducts(query: string, pricebook?: 'FY26' | 'FY25' | 'Legacy'): Product[] {
  const lowerQuery = query.toLowerCase();
  let filtered = mockProducts;
  
  if (pricebook) {
    filtered = filtered.filter(p => p.pricebook === pricebook);
  }
  
  return filtered.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.sku.toLowerCase().includes(lowerQuery)
  );
}
