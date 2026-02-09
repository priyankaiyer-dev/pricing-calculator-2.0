import type { Currency } from './quote';

export type Pricebook = 'FY26' | 'FY25' | 'Legacy';

export interface ProductPricingByCurrency {
  hardware: number;
  perLicensePerMonth: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  pricebook: Pricebook;
  hardware: number; // USD default
  perLicensePerMonth: number; // USD default, per license per month
  category?: string;
  /** When quote currency differs from USD, use these if present */
  pricingByCurrency?: Partial<Record<Currency, ProductPricingByCurrency>>;
}

/** Get hardware and perLicensePerMonth for a product in the given currency */
export function getProductPriceForCurrency(
  product: Product,
  currency: Currency
): { hardware: number; perLicensePerMonth: number } {
  const c = product.pricingByCurrency?.[currency];
  if (c) return { hardware: c.hardware, perLicensePerMonth: c.perLicensePerMonth };
  return { hardware: product.hardware, perLicensePerMonth: product.perLicensePerMonth };
}
