export type PricingOption = 'Upfront' | 'Annual' | 'Quarterly' | 'Financed Monthly' | 'Direct Monthly';
export type Pricebook = 'FY26' | 'FY25' | 'Legacy';
export type Currency = 'USD' | 'CAD' | 'MXN' | 'GBP' | 'EUR';

export interface ProductLineItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  hardware: number;
  perLicensePerMonth: number;
  annualTotal: number;
  discounts?: Record<PricingOption, number>; // Discount percentage per payment option for this product
  /** When true, display as hardware-only: list price and option columns show only $/unit, no monthly/yearly */
  isHardwareOnly?: boolean;
}

export interface PricingBreakdown {
  blendedDiscount: number; // percentage (includes license discounts + subsidies/rebates/free months)
  discountValue: number; // license discount in dollars for this option period (product line items only)
  acv: number; // Annual Contract Value
  licenseTcv: number; // Total Contract Value over term
  /** ACV before rebates/subsidies/free months (same as acv when no upfront discounts) */
  acvWithoutUpfrontDiscounts: number;
  /** License TCV before rebates/subsidies/free months (same as licenseTcv when no upfront discounts) */
  licenseTcvWithoutUpfrontDiscounts: number;
  /** Discounted hardware total for this option (product-level discounts applied) */
  discountedHardware?: number;
  /** First period payment = recurring + hardware - credit - free months value; only for non-Upfront options */
  firstPeriodPayment?: number;
  /** List price for this option period (license only, non-hardware products). e.g. Quarterly List Price */
  optionListPrice?: number;
  /** License discount for this option period (license only, non-hardware products). e.g. Quarterly License Discount */
  optionLicenseDiscount?: number;
  /** Recurring payment for one period = optionListPrice - optionLicenseDiscount. e.g. Recurring Quarterly Payment */
  recurringPeriodAmount?: number;
}

export interface PaymentOptionPricing {
  paymentOption: PricingOption;
  annualListPrice: number;
  annualLicenseDiscount: number;
  blendedDiscount: number;
  recurringAnnualPayment: number;
  breakdown: PricingBreakdown;
}

export interface RebatesAndSubsidies {
  // Rebate (Buyout / Installation) - fixed $ amount, upfront discount
  // Available for: Upfront, Annual, Direct Monthly (NOT Quarterly, Financed Monthly, Semi-Annual)
  rebate?: Record<PricingOption, number>; // Dollar amount per payment option
  
  // Subsidy for Financed Monthly - upfront % or $ amount
  // Only available for Financed Monthly
  subsidyAmount?: number; // Dollar amount (if using $)
  subsidyPercentage?: number; // Percentage (if using %)
  
  // Free Months - X number of free months applied upfront
  // Available for any payment option
  freeMonths?: Record<PricingOption, number>; // Number of free months per payment option
}

export interface Quote {
  id: string;
  accountName: string;
  dealName: string;
  opportunityId?: string;
  pricingOptions: PricingOption[]; // Multiple selected pricing options
  pricebook: Pricebook;
  currency: Currency;
  termLength: number; // in months
  /** Customer fleet size (required for Opening Price Guidance). */
  fleetSize?: number;
  /** Negotiation position for Opening Price Guidance (USD Enterprise). */
  negotiationPosition?: 'favorable' | 'unfavorable';
  productLineItems: ProductLineItem[];
  paymentOptionPricing: PaymentOptionPricing[];
  discounts?: Record<PricingOption, number>; // Discount percentages by payment option
  rebatesAndSubsidies?: RebatesAndSubsidies;
  notes?: string;
  pricingExpiresOn?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
