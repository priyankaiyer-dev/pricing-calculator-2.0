import { Quote, PaymentOptionPricing } from '@/lib/types/quote';

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
  text += `Annual License Discount:\t${formatCurrency(paymentOption.annualLicenseDiscount, quote.currency)}\n`;
  text += `Blended Discount:\t${formatPercentage(paymentOption.blendedDiscount)}\n`;
  text += `Recurring Annual Payment:\t${formatCurrency(paymentOption.recurringAnnualPayment, quote.currency)}\n`;
  
  return text;
}
