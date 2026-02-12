'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ProductLineItem, PricingOption } from '@/lib/types/quote';
import { getOpeningPriceGuidance } from '@/lib/data/openingPriceGuidance';
import { Trash2, Minus, Plus } from 'lucide-react';

const OPENING_GUIDANCE_TOOLTIP_INTRO =
  'Recommended opening price based on product, competitive position, fleet size, and segment to win against Motive and command a premium in other deals.';
const OPENING_GUIDANCE_ENT_LINK = 'https://docs.google.com/document/d/1CashUzZ2wkt0WBosRx7Fcdj2yyPPGgQzH-t0k3Yh1eg/edit?tab=t.xofao8ml9ok2';
const OPENING_GUIDANCE_MM_LINK = 'https://docs.google.com/document/d/1zEeCq2Mo6MdglWT_6JavHigo-8MDUBUaJO8oYV-QYYU/edit?tab=t.xofao8ml9ok2';
const TOOLTIP_DELAY_MS = 150;
const TOOLTIP_HIDE_DELAY_MS = 200;

interface ProductLineItemsProps {
  items: ProductLineItem[];
  currency: string;
  pricingOptions: PricingOption[];
  fleetSize?: number;
  negotiationPosition?: 'favorable' | 'unfavorable';
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDiscount: (id: string, paymentOption: PricingOption, discount: number) => void;
  onRemove: (id: string) => void;
}

export default function ProductLineItems({ 
  items, 
  currency, 
  pricingOptions,
  fleetSize,
  negotiationPosition = 'unfavorable',
  onUpdateQuantity, 
  onUpdateDiscount,
  onRemove 
}: ProductLineItemsProps) {
  const [editingDiscount, setEditingDiscount] = useState<{ itemId: string; option: PricingOption } | null>(null);
  const [openingGuidanceTooltipVisible, setOpeningGuidanceTooltipVisible] = useState(false);
  const [openingGuidanceTooltipRect, setOpeningGuidanceTooltipRect] = useState<DOMRect | null>(null);
  const openingGuidanceTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openingGuidanceHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openingGuidanceHeaderRef = useRef<HTMLTableCellElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      onUpdateQuantity(id, newQuantity);
    }
  };

  const handleDiscountChange = (itemId: string, option: PricingOption, value: string) => {
    if (value === '' || value === '.') {
      onUpdateDiscount(itemId, option, 0);
      return;
    }
    const discount = parseFloat(value);
    if (!isNaN(discount) && discount >= 0 && discount <= 100) {
      onUpdateDiscount(itemId, option, discount);
    }
  };

  const getItemDiscount = (item: ProductLineItem, option: PricingOption): number => {
    return item.discounts?.[option] || 0;
  };

  const calculateDiscountedAnnualPrice = (item: ProductLineItem, option: PricingOption): number => {
    const discount = getItemDiscount(item, option);
    return item.annualTotal * (1 - discount / 100);
  };

  const calculateDiscountedMonthlyPrice = (item: ProductLineItem, option: PricingOption): number => {
    const annualPrice = calculateDiscountedAnnualPrice(item, option);
    return annualPrice / 12;
  };

  const hasLicense = (item: ProductLineItem) => (item.perLicensePerMonth ?? 0) > 0;
  const hasHardware = (item: ProductLineItem) => (item.hardware ?? 0) > 0;

  /** True if we should show hardware-only (list price and cells: only $/unit). */
  const isHardwareOnlyDisplay = (item: ProductLineItem): boolean => {
    if (item.isHardwareOnly === true) return true;
    if (hasHardware(item) && !hasLicense(item)) return true;
    if (hasHardware(item) && hasLicense(item)) {
      const hw = item.hardware ?? 0;
      const lic = item.perLicensePerMonth ?? 0;
      if (hw > 0 && Math.abs(lic * 12 - hw) < 1) return true;
    }
    return false;
  };

  const getListPriceDisplay = (item: ProductLineItem): string[] => {
    const hw = item.hardware ?? 0;
    const lic = item.perLicensePerMonth ?? 0;
    if (isHardwareOnlyDisplay(item)) {
      return [`${formatCurrency(hw)}/unit`];
    }
    if (hasLicense(item) && !hasHardware(item)) {
      return [`${formatCurrency(lic)}/mo`];
    }
    if (hasLicense(item) && hasHardware(item)) {
      return [`${formatCurrency(lic)}/mo`, `${formatCurrency(hw)}/unit`];
    }
    return [formatCurrency(0)];
  };

  const getDiscountedUnitPrice = (item: ProductLineItem, option: PricingOption): number => {
    const discount = getItemDiscount(item, option);
    return (item.hardware ?? 0) * (1 - discount / 100);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No products added yet. Use the search above to add products.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200">
            <th className="px-2 py-3 text-center text-sm font-semibold text-slate-700 w-12" aria-label="Remove" />
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">PRODUCT</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">QTY</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">LIST PRICE</th>
            {pricingOptions.map(option => (
              <th key={option} className="px-3 py-3 text-center text-sm font-semibold text-slate-700 bg-slate-50 min-w-[180px]">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium mb-1">{option}</span>
                  <div className="text-xs font-normal text-slate-500 space-y-0.5">
                    <div>Discount %</div>
                    <div>Post-Discount Price</div>
                  </div>
                </div>
              </th>
            ))}
            <th
              ref={openingGuidanceHeaderRef}
              className="px-4 py-3 text-center text-sm font-semibold text-slate-800 bg-sky-100 min-w-[140px]"
              onMouseEnter={() => {
                if (openingGuidanceHideTimer.current) {
                  clearTimeout(openingGuidanceHideTimer.current);
                  openingGuidanceHideTimer.current = null;
                }
                openingGuidanceTooltipTimer.current = setTimeout(() => {
                  const el = openingGuidanceHeaderRef.current;
                  if (el) setOpeningGuidanceTooltipRect(el.getBoundingClientRect());
                  setOpeningGuidanceTooltipVisible(true);
                }, TOOLTIP_DELAY_MS);
              }}
              onMouseLeave={() => {
                if (openingGuidanceTooltipTimer.current) {
                  clearTimeout(openingGuidanceTooltipTimer.current);
                  openingGuidanceTooltipTimer.current = null;
                }
                openingGuidanceHideTimer.current = setTimeout(() => {
                  setOpeningGuidanceTooltipVisible(false);
                  setOpeningGuidanceTooltipRect(null);
                  openingGuidanceHideTimer.current = null;
                }, TOOLTIP_HIDE_DELAY_MS);
              }}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>Opening Price Guidance</span>
                <span className="text-xs font-normal text-slate-600">
                  {negotiationPosition === 'favorable' ? 'Favorable Position' : 'Compete Position'}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-2 py-3 text-center">
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  aria-label={`Remove ${item.productName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium text-navy">{item.productName}</div>
                  <div className="text-sm text-slate-500">SKU: {item.sku}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="p-1 rounded hover:bg-slate-200 transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="p-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-medium text-slate-800">
                <div className="flex flex-col items-end gap-0.5">
                  {getListPriceDisplay(item).map((line, i) => (
                    <span key={i} className="text-sm">{line}</span>
                  ))}
                </div>
              </td>
              {pricingOptions.map(option => {
                const discount = getItemDiscount(item, option);
                const discountedAnnual = calculateDiscountedAnnualPrice(item, option);
                const discountedMonthly = calculateDiscountedMonthlyPrice(item, option);
                const discountedUnit = getDiscountedUnitPrice(item, option);
                const showLicense = hasLicense(item);
                const showHardware = hasHardware(item);

                return (
                  <td key={option} className="px-3 py-3 bg-slate-50">
                    <div className="flex flex-col items-center gap-2">
                      {/* 1. Discount % */}
                      <input
                        type="text"
                        value={discount === 0 ? '' : discount.toString()}
                        onChange={(e) => handleDiscountChange(item.id, option, e.target.value)}
                        onFocus={() => setEditingDiscount({ itemId: item.id, option })}
                        onBlur={() => setEditingDiscount(null)}
                        placeholder="0"
                        className="w-20 px-2 py-1.5 text-sm bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-pulse-500 text-center"
                      />
                      {/* 2. Hardware-only: only unit price. License: monthly + annual + unit. */}
                      {isHardwareOnlyDisplay(item) ? (
                        <div className="text-xs text-slate-700 font-semibold">
                          {formatCurrency(discountedUnit)}/unit
                        </div>
                      ) : showLicense ? (
                        <>
                          <div className="text-xs text-slate-600 font-medium">
                            {formatCurrency(discountedMonthly)}/mo
                          </div>
                          <div className="text-xs text-slate-700 font-semibold">
                            {formatCurrency(discountedAnnual)}/yr
                          </div>
                          {showHardware ? (
                            <div className="text-xs text-slate-700 font-semibold">
                              {formatCurrency(discountedUnit)}/unit
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">—</div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-slate-500">—</div>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center bg-sky-50 align-middle">
                <div className="flex items-center justify-center min-h-[80px]">
                  {currency === 'USD' && fleetSize != null && (
                    <span className="text-sm font-medium text-slate-800">
                      {getOpeningPriceGuidance(
                        negotiationPosition,
                        fleetSize,
                        item.sku,
                        item.productName
                      ) ?? '—'}
                    </span>
                  )}
                  {((currency !== 'USD') || fleetSize == null) && (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {typeof document !== 'undefined' &&
        openingGuidanceTooltipVisible &&
        openingGuidanceTooltipRect &&
        createPortal(
          <div
            className="fixed px-3 py-2.5 text-xs font-normal text-white bg-slate-800 rounded shadow-lg whitespace-normal w-72 z-[9999]"
            role="tooltip"
            style={{
              left: openingGuidanceTooltipRect.left + openingGuidanceTooltipRect.width / 2,
              top: openingGuidanceTooltipRect.bottom + 6,
              transform: 'translateX(-50%)',
            }}
            onMouseEnter={() => {
              if (openingGuidanceHideTimer.current) {
                clearTimeout(openingGuidanceHideTimer.current);
                openingGuidanceHideTimer.current = null;
              }
            }}
            onMouseLeave={() => {
              setOpeningGuidanceTooltipVisible(false);
              setOpeningGuidanceTooltipRect(null);
            }}
          >
            <p className="text-left mb-2">{OPENING_GUIDANCE_TOOLTIP_INTRO}</p>
            <p className="text-left">
              See{' '}
              <a
                href={OPENING_GUIDANCE_ENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pulse-300 underline hover:text-pulse-200"
              >
                ENT
              </a>{' '}
              and{' '}
              <a
                href={OPENING_GUIDANCE_MM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pulse-300 underline hover:text-pulse-200"
              >
                MM
              </a>{' '}
              Opening Price Guidance for more detail.
            </p>
          </div>,
          document.body
        )}
    </div>
  );
}
