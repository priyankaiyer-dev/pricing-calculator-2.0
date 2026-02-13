import { ProductLineItem, PricingOption, PaymentOptionPricing, PricingBreakdown, RebatesAndSubsidies } from '@/lib/types/quote';

/** True if item is hardware-only (no recurring license to show in option list/discount) */
export function isHardwareOnlyItem(item: ProductLineItem): boolean {
  const hasLicense = (item.perLicensePerMonth ?? 0) > 0;
  const hasHardware = (item.hardware ?? 0) > 0;
  if (item.isHardwareOnly === true) return true;
  if (hasHardware && !hasLicense) return true;
  if (hasHardware && hasLicense) {
    const hw = item.hardware ?? 0;
    const lic = item.perLicensePerMonth ?? 0;
    if (hw > 0 && Math.abs(lic * 12 - hw) < 1) return true;
  }
  return false;
}

/** Months per period for list/discount formulas: 12 Annual, 3 Quarterly, 1 Monthly, termLength Upfront */
export function getOptionFrequency(option: PricingOption, termLength: number): number {
  switch (option) {
    case 'Annual': return 12;
    case 'Quarterly': return 3;
    case 'Financed Monthly':
    case 'Direct Monthly': return 1;
    case 'Upfront': return termLength;
    default: return 12;
  }
}

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
 * Calculate pricing breakdown for a payment option using product-level discounts and rebates/subsidies.
 * List/discount/recurring use license-only, non-hardware products with option-period frequency.
 */
export function calculatePricingBreakdown(
  lineItems: ProductLineItem[],
  paymentOption: PricingOption,
  termLength: number,
  rebatesAndSubsidies?: RebatesAndSubsidies
): PricingBreakdown {
  const nonHardware = lineItems.filter((i) => !isHardwareOnlyItem(i));
  const frequency = getOptionFrequency(paymentOption, termLength);
  const isUpfront = paymentOption === 'Upfront';

  // Option-period list price (license only): SUM(Monthly Unit List Price * Quantity * frequency)
  // e.g. Quarterly List Price = list prices * 3 * quantity
  const optionListPrice = nonHardware.reduce(
    (sum, item) => sum + (item.perLicensePerMonth ?? 0) * item.quantity * frequency,
    0
  );

  // Option-period license discount: SUM(License Discount Value per unit per month * Quantity * frequency)
  const optionLicenseDiscount = nonHardware.reduce(
    (sum, item) => {
      const discountPct = item.discounts?.[paymentOption] ?? 0;
      const licenseDiscountPerUnitPerMonth = (item.perLicensePerMonth ?? 0) * (discountPct / 100);
      return sum + licenseDiscountPerUnitPerMonth * item.quantity * frequency;
    },
    0
  );

  // Sum of discounted annual totals (license+hardware) for non-hardware = same basis as Products table option column
  const discountedAnnualTotalNonHardware = nonHardware.reduce(
    (sum, item) => sum + (item.annualTotal ?? 0) * (1 - (item.discounts?.[paymentOption] ?? 0) / 100),
    0
  );

  // Recurring = sum of the "[Option] Price" column from Products table (e.g. 178.50 + 114.75 = Quarterly Price column sum)
  // Per line: option price = (annualTotal * (1-d)) / periodsPerYear → Annual /1, Quarterly /4, Monthly /12
  const recurringPeriodAmount =
    !isUpfront && frequency > 0 ? (discountedAnnualTotalNonHardware * frequency) / 12 : 0;

  // Annual equivalent and TCV
  const acvWithoutUpfrontDiscounts = isUpfront
    ? discountedAnnualTotalNonHardware * (termLength / 12)
    : (recurringPeriodAmount * 12) / frequency;
  const licenseTcvWithoutUpfrontDiscounts = isUpfront
    ? discountedAnnualTotalNonHardware * (termLength / 12)
    : acvWithoutUpfrontDiscounts * (termLength / 12);

  const discountedHardware = lineItems.reduce(
    (sum, item) =>
      sum + (item.hardware ?? 0) * item.quantity * (1 - (item.discounts?.[paymentOption] ?? 0) / 100),
    0
  );

  // Upfront discounts (used for TCV and first payment)
  const upfrontDiscounts = calculateTotalUpfrontDiscounts(
    rebatesAndSubsidies,
    paymentOption,
    acvWithoutUpfrontDiscounts
  );
  const licenseTcv = Math.max(0, licenseTcvWithoutUpfrontDiscounts - upfrontDiscounts);
  const acv = Math.max(0, acvWithoutUpfrontDiscounts);

  const annualListPrice = calculateAnnualListPrice(lineItems);
  const totalDiscountedAnnual = acvWithoutUpfrontDiscounts + discountedHardware;
  const blendedDiscount = calculateBlendedDiscount(annualListPrice, totalDiscountedAnnual);

  const rebate = calculateRebateDiscount(rebatesAndSubsidies, paymentOption);
  const subsidy = calculateSubsidyDiscount(rebatesAndSubsidies, paymentOption, acvWithoutUpfrontDiscounts);
  const freeMonthsCount = rebatesAndSubsidies?.freeMonths?.[paymentOption] ?? 0;
  const freeMonthsValue = frequency > 0 ? (recurringPeriodAmount / frequency) * freeMonthsCount : 0;

  const firstPeriodPayment =
    !isUpfront
      ? Math.max(0, recurringPeriodAmount + discountedHardware - rebate - subsidy - freeMonthsValue)
      : undefined;

  return {
    blendedDiscount,
    discountValue: optionLicenseDiscount,
    acv,
    licenseTcv,
    acvWithoutUpfrontDiscounts,
    licenseTcvWithoutUpfrontDiscounts,
    discountedHardware,
    firstPeriodPayment,
    optionListPrice,
    optionLicenseDiscount,
    recurringPeriodAmount,
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
    const annualLicenseDiscount = breakdown.discountValue; // License discount value (product line items only)
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
