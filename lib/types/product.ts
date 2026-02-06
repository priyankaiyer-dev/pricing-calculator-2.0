export type Pricebook = 'FY26' | 'FY25' | 'Legacy';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  pricebook: Pricebook;
  hardware: number;
  perLicensePerMonth: number; // Base price per license per month
  category?: string;
}
