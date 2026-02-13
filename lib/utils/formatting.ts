import { Quote, PaymentOptionPricing, PricingOption, PricingBreakdown } from '@/lib/types/quote';

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generate deal name from account name and date
 */
export function generateDealName(accountName: string): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${accountName} - ${dateStr}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Generate formatted quote text for copy/paste
 */
export function generateFormattedQuoteText(quote: Quote, paymentOption: PaymentOptionPricing): string {
  const termYears = Math.floor(quote.termLength / 12);
  const termMonths = quote.termLength % 12;
  const termStr = termMonths > 0 ? `${termYears}-Years ${termMonths}-Months` : `${termYears}-Years`;
  
  let text = `Payment Option: ${paymentOption.paymentOption}\tLicense Term: ${termStr}\n\n`;
  text += `PRODUCT\tQTY\tHARDWARE\tPER LIC/MONTH\tANNUAL TOTAL\n`;
  
  quote.productLineItems.forEach(item => {
    text += `${item.productName} (${item.sku})\t${item.quantity}\t${formatCurrency(item.hardware, quote.currency)}\t${formatCurrency(item.perLicensePerMonth, quote.currency)}\t${formatCurrency(item.annualTotal, quote.currency)}\n`;
  });
  
  text += `\n`;
  text += `* Figures do not include tax or shipping\n`;
  if (quote.pricingExpiresOn) {
    text += `* Pricing Expires on ${formatDate(quote.pricingExpiresOn)} and requires bulk shipment\n`;
  }
  text += `\n`;
  text += `Annual List Price:\t${formatCurrency(paymentOption.annualListPrice, quote.currency)}\n`;
  text += `License Discount:\t${formatCurrency(paymentOption.annualLicenseDiscount, quote.currency)}\n`;
  text += `Blended Discount:\t${formatPercentage(paymentOption.blendedDiscount)}\n`;
  text += `${getRecurringPaymentLabel(paymentOption.paymentOption)}:\t${formatCurrency(getRecurringPaymentValue(paymentOption.breakdown, paymentOption.paymentOption), quote.currency)}\n`;
  
  return text;
}

/**
 * Label for the recurring/upfront payment by option (e.g. "Recurring Quarterly Payment", "Upfront Payment")
 */
export function getRecurringPaymentLabel(option: PricingOption): string {
  switch (option) {
    case 'Upfront':
      return 'Upfront Payment';
    case 'Annual':
      return 'Recurring Annual Payment';
    case 'Quarterly':
      return 'Recurring Quarterly Payment';
    case 'Financed Monthly':
    case 'Direct Monthly':
      return 'Recurring Monthly Payment';
    default:
      return 'Recurring Payment';
  }
}

/**
 * Recurring payment = List - License Discounts (per period).
 * Uses recurringPeriodAmount when set (option-period formula); else derives from acvWithoutUpfrontDiscounts; Upfront = license TCV.
 */
export function getRecurringPaymentValue(breakdown: PricingBreakdown, option: PricingOption): number {
  if (option === 'Upfront') return breakdown.licenseTcv;
  if (breakdown.recurringPeriodAmount != null) return breakdown.recurringPeriodAmount;
  switch (option) {
    case 'Annual':
      return breakdown.acvWithoutUpfrontDiscounts;
    case 'Quarterly':
      return breakdown.acvWithoutUpfrontDiscounts / 4;
    case 'Financed Monthly':
    case 'Direct Monthly':
      return breakdown.acvWithoutUpfrontDiscounts / 12;
    default:
      return breakdown.acvWithoutUpfrontDiscounts;
  }
}

/**
 * Label for license discount by option (e.g. "Annual License Discount", "Quarterly License Discount")
 */
export function getLicenseDiscountLabel(option: PricingOption): string {
  switch (option) {
    case 'Upfront':
      return 'Upfront License Discount';
    case 'Annual':
      return 'Annual License Discount';
    case 'Quarterly':
      return 'Quarterly License Discount';
    case 'Financed Monthly':
    case 'Direct Monthly':
      return 'Monthly License Discount';
    default:
      return 'License Discount';
  }
}

/**
 * Label for list price by option (e.g. "Annual List Price", "Quarterly List Price")
 */
export function getListPriceLabel(option: PricingOption): string {
  switch (option) {
    case 'Upfront':
      return 'Upfront List Price';
    case 'Annual':
      return 'Annual List Price';
    case 'Quarterly':
      return 'Quarterly List Price';
    case 'Financed Monthly':
    case 'Direct Monthly':
      return 'Monthly List Price';
    default:
      return 'List Price';
  }
}

/**
 * Label for first period payment (e.g. "First Annual Payment", "First Quarterly Payment"). Not used for Upfront.
 */
export function getFirstPeriodPaymentLabel(option: PricingOption): string {
  switch (option) {
    case 'Annual':
      return 'First Annual Payment';
    case 'Quarterly':
      return 'First Quarterly Payment';
    case 'Financed Monthly':
    case 'Direct Monthly':
      return 'First Monthly Payment';
    default:
      return 'First Payment';
  }
}

/**
 * Label for the Products table rightmost price column by payment option
 * (e.g. "Annual Price", "Quarterly Price", "Monthly Price", "Upfront Price").
 */
export function getPriceColumnLabel(option: PricingOption): string {
  switch (option) {
    case 'Upfront':
      return 'Upfront Price';
    case 'Annual':
      return 'Annual Price';
    case 'Quarterly':
      return 'Quarterly Price';
    case 'Financed Monthly':
    case 'Direct Monthly':
      return 'Monthly Price';
    default:
      return 'Price';
  }
}
