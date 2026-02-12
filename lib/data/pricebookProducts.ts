/**
 * Products and pricing from the official pricebook (TSV source).
 * Source: data/pricebook.tsv — update that file to refresh products.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Product } from '@/lib/types/product';
import type { Pricebook } from '@/lib/types/product';
import type { Currency } from '@/lib/types/quote';

const DATA_FILE = join(process.cwd(), 'data', 'pricebook.tsv');

const PRICEBOOK_COL = { FY26: 5, FY25: 6, Legacy: 7 } as const;
const COL = {
  sku: 0,
  productName: 1,
  type: 2,
  category: 3,
  quoteTableName: 9,
  hardware: 12,
  usdAnnual: 13,
  usdMonthly: 14,
  cadAnnual: 15,
  cadMonthly: 16,
  mxnAnnual: 17,
  mxnMonthly: 18,
  eurAnnual: 19,
  eurMonthly: 20,
  gbpAnnual: 21,
  gbpMonthly: 22,
} as const;

function parsePrice(s: string): number {
  if (!s || typeof s !== 'string') return 0;
  const cleaned = String(s).replace(/[^\d.]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseRow(row: string[]): Product[] {
  const products: Product[] = [];
  const name = (row[COL.quoteTableName] || row[COL.productName] || '').trim();
  const sku = (row[COL.sku] || '').trim();
  if (!name || !sku) return products;

  const hardwareUsd = parsePrice(row[COL.hardware] ?? '');
  const usdMonthly =
    parsePrice(row[COL.usdMonthly] ?? '') || parsePrice(row[COL.usdAnnual] ?? '') / 12;
  const productType = (row[COL.type] ?? '').trim().toLowerCase();
  const isHardwareOnly = productType === 'accessory' || productType === 'hardware';

  const pricebooks: Pricebook[] = ['FY26', 'FY25', 'Legacy'];
  for (const pb of pricebooks) {
    const val = row[PRICEBOOK_COL[pb]];
    if (!val || String(val).toUpperCase() !== 'TRUE') continue;

    const id = `${sku}-${pb}`;
    const pricingByCurrency: Partial<Record<Currency, { hardware: number; perLicensePerMonth: number }>> = {};

    const cadM = parsePrice(row[COL.cadMonthly] ?? '') || parsePrice(row[COL.cadAnnual] ?? '') / 12;
    if (cadM > 0) pricingByCurrency.CAD = { hardware: 0, perLicensePerMonth: cadM };

    const mxnM = parsePrice(row[COL.mxnMonthly] ?? '') || parsePrice(row[COL.mxnAnnual] ?? '') / 12;
    if (mxnM > 0) pricingByCurrency.MXN = { hardware: 0, perLicensePerMonth: mxnM };

    const eurM = parsePrice(row[COL.eurMonthly] ?? '') || parsePrice(row[COL.eurAnnual] ?? '') / 12;
    if (eurM > 0) pricingByCurrency.EUR = { hardware: 0, perLicensePerMonth: eurM };

    const gbpM = parsePrice(row[COL.gbpMonthly] ?? '') || parsePrice(row[COL.gbpAnnual] ?? '') / 12;
    if (gbpM > 0) pricingByCurrency.GBP = { hardware: 0, perLicensePerMonth: gbpM };

    products.push({
      id,
      name,
      sku,
      pricebook: pb,
      hardware: hardwareUsd,
      perLicensePerMonth: usdMonthly,
      category: (row[COL.category] ?? '').trim() || undefined,
      pricingByCurrency: Object.keys(pricingByCurrency).length > 0 ? pricingByCurrency : undefined,
      isHardwareOnly: isHardwareOnly || undefined,
    });
  }
  return products;
}

let cachedProducts: Product[] | null = null;

function loadProducts(): Product[] {
  if (cachedProducts) return cachedProducts;
  if (!existsSync(DATA_FILE)) {
    console.warn('[pricebookProducts] data/pricebook.tsv not found, returning empty list');
    cachedProducts = [];
    return cachedProducts;
  }
  const raw = readFileSync(DATA_FILE, 'utf-8');
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    cachedProducts = [];
    return cachedProducts;
  }
  const all: Product[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split('\t');
    all.push(...parseRow(row));
  }
  cachedProducts = all;
  return cachedProducts;
}

export function getProductsByPricebook(pricebook: Pricebook): Product[] {
  return loadProducts().filter((p) => p.pricebook === pricebook);
}

export function searchProducts(query: string, pricebook?: Pricebook): Product[] {
  const lower = query.toLowerCase();
  let list = loadProducts();
  if (pricebook) list = list.filter((p) => p.pricebook === pricebook);
  return list.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.sku.toLowerCase().includes(lower) ||
      (p.category && p.category.toLowerCase().includes(lower))
  );
}

export function getAllPricebookProducts(): Product[] {
  return loadProducts();
}
