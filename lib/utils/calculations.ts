import { ProductLineItem, PricingOption, PaymentOptionPricing, PricingBreakdown, RebatesAndSubsidies } from '@/lib/types/quote';

/**
 * Calculate annual total for a product line item
 */
export function calculateAnnualTotal(item: ProductLineItem): number {
  return (item.perLicensePerMonth * item.quantity * 12) + (item.hardware * item.quantity);
}

/**
 * Calculate total annual list price (before discounts)
 */
export function calculateAnnualListPrice(lineItems: ProductLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + calculateAnnualTotal(item), 0);
}

/**
 * Calculate blended discount percentage
 */
export function calculateBlendedDiscount(
  listPrice: number,
  discountedPrice: number
): number {
  if (listPrice === 0) return 0;
  return ((listPrice - discountedPrice) / listPrice) * 100;
}

/**
 * Calculate total discounted price for a payment option using product-level discounts
 */
export function calculateDiscountedPriceForOption(
  lineItems: ProductLineItem[],
  paymentOption: PricingOption
): number {
  return lineItems.reduce((sum, item) => {
    const itemDiscount = item.discounts?.[paymentOption] || 0;
    const itemAnnualTotal = calculateAnnualTotal(item);
    const discountedItemPrice = itemAnnualTotal * (1 - itemDiscount / 100);
    return sum + discountedItemPrice;
  }, 0);
}

/**
 * Calculate rebate discount for a payment option
 */
export function calculateRebateDiscount(
  rebatesAndSubsidies: RebatesAndSubsidies | undefined,
  paymentOption: PricingOption
): number {
  if (!rebatesAndSubsidies?.rebate) return 0;
  return rebatesAndSubsidies.rebate[paymentOption] || 0;
}

/**
 * Calculate subsidy discount for Financed Monthly
 */
export function calculateSubsidyDiscount(
  rebatesAndSubsidies: RebatesAndSubsidies | undefined,
  paymentOption: PricingOption,
  annualPrice: number
): number {
  if (paymentOption !== 'Financed Monthly' || !rebatesAndSubsidies) return 0;
  
  if (rebatesAndSubsidies.subsidyAmount !== undefined) {
    return rebatesAndSubsidies.subsidyAmount;
  }
  
  if (rebatesAndSubsidies.subsidyPercentage !== undefined) {
    return (annualPrice * rebatesAndSubsidies.subsidyPercentage) / 100;
  }
  
  return 0;
}

/**
 * Calculate free months discount for a payment option
 */
export function calculateFreeMonthsDiscount(
  rebatesAndSubsidies: RebatesAndSubsidies | undefined,
  paymentOption: PricingOption,
  annualPrice: number
): number {
  if (!rebatesAndSubsidies?.freeMonths) return 0;
  const freeMonths = rebatesAndSubsidies.freeMonths[paymentOption] || 0;
  if (freeMonths === 0) return 0;
  // Free months discount = (annual price / 12) * free months
  const monthlyPrice = annualPrice / 12;
  return monthlyPrice * freeMonths;
}

/**
 * Calculate total upfront discounts (rebate + subsidy + free months)
 */
export function calculateTotalUpfrontDiscounts(
  rebatesAndSubsidies: RebatesAndSubsidies | undefined,
  paymentOption: PricingOption,
  annualPrice: number
): number {
  const rebate = calculateRebateDiscount(rebatesAndSubsidies, paymentOption);
  const subsidy = calculateSubsidyDiscount(rebatesAndSubsidies, paymentOption, annualPrice);
  const freeMonths = calculateFreeMonthsDiscount(rebatesAndSubsidies, paymentOption, annualPrice);
  return rebate + subsidy + freeMonths;
}

/**
 * Calculate pricing breakdown for a payment option using product-level discounts and rebates/subsidies
 */
export function calculatePricingBreakdown(
  lineItems: ProductLineItem[],
  paymentOption: PricingOption,
  termLength: number,
  rebatesAndSubsidies?: RebatesAndSubsidies
): PricingBreakdown {
  const annualListPrice = calculateAnnualListPrice(lineItems);
  const discountedPrice = calculateDiscountedPriceForOption(lineItems, paymentOption);
  
  // Apply upfront discounts (rebate, subsidy, free months)
  const upfrontDiscounts = calculateTotalUpfrontDiscounts(
    rebatesAndSubsidies,
    paymentOption,
    discountedPrice
  );
  
  // Final price after all discounts
  const finalPrice = Math.max(0, discountedPrice - upfrontDiscounts);
  
  // Total discount value includes both product discounts and upfront discounts
  const totalDiscountValue = annualListPrice - finalPrice;
  const blendedDiscount = calculateBlendedDiscount(annualListPrice, finalPrice);
  const acv = finalPrice;
  const licenseTcv = acv * (termLength / 12);
  const licenseTcvWithoutUpfrontDiscounts = discountedPrice * (termLength / 12);

  // Discounted hardware total for this option (product-level discounts applied)
  const discountedHardware = lineItems.reduce(
    (sum, item) =>
      sum +
      item.hardware * item.quantity * (1 - (item.discounts?.[paymentOption] ?? 0) / 100),
    0
  );

  // First period payment = recurring amount + hardware costs - applicable subsidies (capped at 0)
  const periodsPerYear =
    paymentOption === 'Annual' ? 1
    : paymentOption === 'Quarterly' ? 4
    : paymentOption === 'Financed Monthly' || paymentOption === 'Direct Monthly' ? 12
    : 0;
  const recurringPeriodAmount = periodsPerYear > 0 ? acv / periodsPerYear : 0;
  const firstPeriodPayment =
    periodsPerYear > 0
      ? Math.max(0, recurringPeriodAmount + discountedHardware - upfrontDiscounts)
      : undefined;

  return {
    blendedDiscount,
    discountValue: totalDiscountValue,
    acv,
    licenseTcv,
    acvWithoutUpfrontDiscounts: discountedPrice,
    licenseTcvWithoutUpfrontDiscounts,
    discountedHardware: periodsPerYear > 0 ? discountedHardware : undefined,
    firstPeriodPayment,
  };
}

/**
 * Calculate pricing for all payment options using product-level discounts and rebates/subsidies
 */
export function calculatePaymentOptionPricing(
  lineItems: ProductLineItem[],
  selectedOptions: PricingOption[],
  termLength: number,
  rebatesAndSubsidies?: RebatesAndSubsidies
): PaymentOptionPricing[] {
  const annualListPrice = calculateAnnualListPrice(lineItems);

  return selectedOptions.map(paymentOption => {
    const breakdown = calculatePricingBreakdown(
      lineItems,
      paymentOption,
      termLength,
      rebatesAndSubsidies
    );
    const annualLicenseDiscount = breakdown.discountValue;
    const recurringAnnualPayment = breakdown.acv;

    return {
      paymentOption,
      annualListPrice,
      annualLicenseDiscount,
      blendedDiscount: breakdown.blendedDiscount,
      recurringAnnualPayment,
      breakdown,
    };
  });
}

/**
 * Calculate discount from target price
 */
export function calculateDiscountFromTargetPrice(
  listPrice: number,
  targetPrice: number
): number {
  if (listPrice === 0) return 0;
  return ((listPrice - targetPrice) / listPrice) * 100;
}

/**
 * Calculate target price from discount
 */
export function calculateTargetPriceFromDiscount(
  listPrice: number,
  discountPercentage: number
): number {
  return listPrice * (1 - discountPercentage / 100);
}
