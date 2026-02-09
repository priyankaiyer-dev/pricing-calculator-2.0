#!/usr/bin/env node
/**
 * Parses pricebook TSV from stdin and outputs JSON product list.
 * Usage: node scripts/parse-pricebook.mjs < data/pricebook.tsv > lib/data/pricebookProducts.json
 * Or paste TSV and: node scripts/parse-pricebook.mjs < paste.txt
 */

import { readFileSync } from 'fs';

const isStdin = process.stdin.isTTY === false;
const input = isStdin
  ? await new Promise((r) => { let d = ''; process.stdin.on('data', (c) => d += c); process.stdin.on('end', () => r(d)); })
  : readFileSync(process.argv[2] || 'data/pricebook.tsv', 'utf-8');

const lines = input.trim().split(/\r?\n/).filter(Boolean);
if (lines.length < 2) {
  process.stderr.write('Need at least header + 1 row\n');
  process.exit(1);
}

const pricebooks = ['FY26', 'FY25', 'Legacy'];
const pricebookCol = { FY26: 5, FY25: 6, Legacy: 7 };
const col = {
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
};

function parsePrice(s) {
  if (!s || typeof s !== 'string') return 0;
  const cleaned = String(s).replace(/[^\d.]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseRow(row) {
  const products = [];
  const name = (row[col.quoteTableName] || row[col.productName] || '').trim();
  const sku = (row[col.sku] || '').trim();
  if (!name || !sku) return products;

  const hardwareUsd = parsePrice(row[col.hardware]);
  const usdMonthly = parsePrice(row[col.usdMonthly]) || (parsePrice(row[col.usdAnnual]) || 0) / 12;

  for (const pb of pricebooks) {
    const val = row[pricebookCol[pb]];
    if (!val || String(val).toUpperCase() !== 'TRUE') continue;

    const id = `${sku}-${pb}`;
    const pricingByCurrency = {};

    if (row[col.cadMonthly] || row[col.cadAnnual]) {
      const cadM = parsePrice(row[col.cadMonthly]) || parsePrice(row[col.cadAnnual]) / 12;
      const cadH = 0; // sheet has no separate CAD hardware column
      pricingByCurrency.CAD = { hardware: cadH, perLicensePerMonth: cadM };
    }
    if (row[col.mxnMonthly] || row[col.mxnAnnual]) {
      const mxnM = parsePrice(row[col.mxnMonthly]) || parsePrice(row[col.mxnAnnual]) / 12;
      pricingByCurrency.MXN = { hardware: 0, perLicensePerMonth: mxnM };
    }
    if (row[col.eurMonthly] || row[col.eurAnnual]) {
      const eurM = parsePrice(row[col.eurMonthly]) || parsePrice(row[col.eurAnnual]) / 12;
      pricingByCurrency.EUR = { hardware: 0, perLicensePerMonth: eurM };
    }
    if (row[col.gbpMonthly] || row[col.gbpAnnual]) {
      const gbpM = parsePrice(row[col.gbpMonthly]) || parsePrice(row[col.gbpAnnual]) / 12;
      pricingByCurrency.GBP = { hardware: 0, perLicensePerMonth: gbpM };
    }

    products.push({
      id,
      name,
      sku,
      pricebook: pb,
      hardware: hardwareUsd,
      perLicensePerMonth: usdMonthly,
      category: (row[col.category] || '').trim() || undefined,
      pricingByCurrency: Object.keys(pricingByCurrency).length ? pricingByCurrency : undefined,
    });
  }
  return products;
}

const header = lines[0].split('\t');
const all = [];
for (let i = 1; i < lines.length; i++) {
  const row = lines[i].split('\t');
  all.push(...parseRow(row));
}

console.log(JSON.stringify(all, null, 2));
