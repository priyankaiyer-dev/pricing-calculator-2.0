/**
 * Opening Price Guidance lookup tables (USD, Enterprise segment).
 * Source: Sales "Opening Price Guidance" for competitive deals.
 * Two tables: Motive Compete / Unfavorable vs Favorable Negotiating Position.
 */

export type NegotiationPosition = 'favorable' | 'unfavorable';

export type FleetSizeBucket =
  | '0-50'
  | '51-100'
  | '101-200'
  | '201-500'
  | '501-1500'
  | '1501-3000'
  | '3001-5000'
  | '5001-7500'
  | '7501+';

/** Get fleet size bucket from customer fleet size. */
export function getFleetSizeBucket(fleetSize: number): FleetSizeBucket {
  if (fleetSize <= 50) return '0-50';
  if (fleetSize <= 100) return '51-100';
  if (fleetSize <= 200) return '101-200';
  if (fleetSize <= 500) return '201-500';
  if (fleetSize <= 1500) return '501-1500';
  if (fleetSize <= 3000) return '1501-3000';
  if (fleetSize <= 5000) return '3001-5000';
  if (fleetSize <= 7500) return '5001-7500';
  return '7501+';
}

/** Column keys for the opening price tables (product categories). */
export type GuidanceColumnKey =
  | 'telematics_safety'
  | 'fleet_apps'
  | 'aim4_moby'
  | 'aim4_only'
  | 'safety_only'
  | 'telematics_only'
  | 'eld_addon'
  | 'ag_trailer_premier'
  | 'at11'
  | 'ag_unpowered'
  | 'ag_powered_basic'
  | 'ag_powered_plus';

/** USD Enterprise - Motive Compete / Unfavorable Negotiating Position */
export const OPENING_PRICE_UNFAVORABLE: Record<FleetSizeBucket, Record<GuidanceColumnKey, string>> = {
  '0-50': {
    telematics_safety: '$60',
    fleet_apps: '$25',
    aim4_moby: '$65',
    aim4_only: '$42',
    safety_only: '$37',
    telematics_only: '$27',
    eld_addon: '$8',
    ag_trailer_premier: '$14',
    at11: '$9.50',
    ag_unpowered: '$11',
    ag_powered_basic: '$13',
    ag_powered_plus: '$14',
  },
  '51-100': {
    telematics_safety: '$52',
    fleet_apps: '$22.50',
    aim4_moby: '$55',
    aim4_only: '$37',
    safety_only: '$33',
    telematics_only: '$25',
    eld_addon: '$4',
    ag_trailer_premier: '$13',
    at11: '$9.50',
    ag_unpowered: '$11',
    ag_powered_basic: '$12',
    ag_powered_plus: '$13',
  },
  '101-200': {
    telematics_safety: '$49',
    fleet_apps: '$22.50',
    aim4_moby: '$55',
    aim4_only: '$37',
    safety_only: '$32',
    telematics_only: '$24',
    eld_addon: '$4',
    ag_trailer_premier: '$13',
    at11: '$9.50',
    ag_unpowered: '$11',
    ag_powered_basic: '$12',
    ag_powered_plus: '$13',
  },
  '201-500': {
    telematics_safety: '$41',
    fleet_apps: '$20',
    aim4_moby: '$50',
    aim4_only: '$34',
    safety_only: '$28',
    telematics_only: '$20',
    eld_addon: '$3',
    ag_trailer_premier: '$12',
    at11: '$8',
    ag_unpowered: '$10',
    ag_powered_basic: '$11',
    ag_powered_plus: '$12',
  },
  '501-1500': {
    telematics_safety: '$35',
    fleet_apps: '$20',
    aim4_moby: '$50',
    aim4_only: '$34',
    safety_only: '$25',
    telematics_only: '$17',
    eld_addon: '$3',
    ag_trailer_premier: '$12',
    at11: '$8',
    ag_unpowered: '$10',
    ag_powered_basic: '$11',
    ag_powered_plus: '$12',
  },
  '1501-3000': {
    telematics_safety: '$34',
    fleet_apps: '$15',
    aim4_moby: '$45',
    aim4_only: '$28',
    safety_only: '$23',
    telematics_only: '$16',
    eld_addon: '$2',
    ag_trailer_premier: '$11',
    at11: '$6',
    ag_unpowered: '$8',
    ag_powered_basic: '$10',
    ag_powered_plus: '$11',
  },
  '3001-5000': {
    telematics_safety: '$33',
    fleet_apps: '$15',
    aim4_moby: '$45',
    aim4_only: '$28',
    safety_only: '$22',
    telematics_only: '$15',
    eld_addon: '$2',
    ag_trailer_premier: '$11',
    at11: '$6',
    ag_unpowered: '$8',
    ag_powered_basic: '$10',
    ag_powered_plus: '$11',
  },
  '5001-7500': {
    telematics_safety: '$32',
    fleet_apps: '$15',
    aim4_moby: '$45',
    aim4_only: '$28',
    safety_only: '$21',
    telematics_only: '$14',
    eld_addon: '$2',
    ag_trailer_premier: '$11',
    at11: '$6',
    ag_unpowered: '$8',
    ag_powered_basic: '$10',
    ag_powered_plus: '$11',
  },
  '7501+': {
    telematics_safety: '$30',
    fleet_apps: '$15',
    aim4_moby: '$45',
    aim4_only: '$28',
    safety_only: '$20',
    telematics_only: '$13',
    eld_addon: '$2',
    ag_trailer_premier: '$11',
    at11: '$6',
    ag_unpowered: '$8',
    ag_powered_basic: '$10',
    ag_powered_plus: '$11',
  },
};

/** USD Enterprise - Favorable Negotiating Position */
export const OPENING_PRICE_FAVORABLE: Record<FleetSizeBucket, Record<GuidanceColumnKey, string>> = {
  '0-50': {
    telematics_safety: '$115 (list)',
    fleet_apps: '$30 (list)',
    aim4_moby: '$90',
    aim4_only: '$60',
    safety_only: '$70 (list)',
    telematics_only: '$45 (list)',
    eld_addon: '$10 (list)',
    ag_trailer_premier: '$16 - $19',
    at11: '$9.50',
    ag_unpowered: '$11',
    ag_powered_basic: '$14 - $17',
    ag_powered_plus: '$17 - $20',
  },
  '51-100': {
    telematics_safety: '$80 - $90',
    fleet_apps: '$27.50',
    aim4_moby: '$80',
    aim4_only: '$53',
    safety_only: '$48 - $60',
    telematics_only: '$31 - $38',
    eld_addon: '$5 - $7',
    ag_trailer_premier: '$14 - $17',
    at11: '$9.50',
    ag_unpowered: '$11',
    ag_powered_basic: '$13 - $16',
    ag_powered_plus: '$16 - $19',
  },
  '101-200': {
    telematics_safety: '$70 - $80',
    fleet_apps: '$27.50',
    aim4_moby: '$80',
    aim4_only: '$53',
    safety_only: '$42 - $55',
    telematics_only: '$26 - $36',
    eld_addon: '$5 - $7',
    ag_trailer_premier: '$14 - $17',
    at11: '$9.50',
    ag_unpowered: '$11',
    ag_powered_basic: '$13 - $16',
    ag_powered_plus: '$16 - $19',
  },
  '201-500': {
    telematics_safety: '$60 - $70',
    fleet_apps: '$22.50',
    aim4_moby: '$75',
    aim4_only: '$48',
    safety_only: '$39 - $54',
    telematics_only: '$25 - $35',
    eld_addon: '$4 - $6',
    ag_trailer_premier: '$13 - $16',
    at11: '$8',
    ag_unpowered: '$10',
    ag_powered_basic: '$12 - $15',
    ag_powered_plus: '$15 - $18',
  },
  '501-1500': {
    telematics_safety: '$50 - $60',
    fleet_apps: '$22.50',
    aim4_moby: '$75',
    aim4_only: '$48',
    safety_only: '$36 - $49',
    telematics_only: '$20 - $30',
    eld_addon: '$4 - $6',
    ag_trailer_premier: '$13 - $16',
    at11: '$8',
    ag_unpowered: '$10',
    ag_powered_basic: '$12 - $15',
    ag_powered_plus: '$15 - $18',
  },
  '1501-3000': {
    telematics_safety: '$48 - $58',
    fleet_apps: '$20',
    aim4_moby: '$60',
    aim4_only: '$40',
    safety_only: '$33 - $44',
    telematics_only: '$19 - $25',
    eld_addon: '$3 - $5',
    ag_trailer_premier: '$11 - $13',
    at11: '$6',
    ag_unpowered: '$8',
    ag_powered_basic: '$10 - $12',
    ag_powered_plus: '$13 - $15',
  },
  '3001-5000': {
    telematics_safety: '$45 - $55',
    fleet_apps: '$20',
    aim4_moby: '$60',
    aim4_only: '$40',
    safety_only: '$29 - $38',
    telematics_only: '$18 - $23',
    eld_addon: '$3 - $5',
    ag_trailer_premier: '$11 - $13',
    at11: '$6',
    ag_unpowered: '$8',
    ag_powered_basic: '$10 - $12',
    ag_powered_plus: '$13 - $15',
  },
  '5001-7500': {
    telematics_safety: '$43 - $52',
    fleet_apps: '$20',
    aim4_moby: '$60',
    aim4_only: '$40',
    safety_only: '$28 - $37',
    telematics_only: '$17 - $21',
    eld_addon: '$3 - $5',
    ag_trailer_premier: '$11 - $13',
    at11: '$6',
    ag_unpowered: '$8',
    ag_powered_basic: '$10 - $12',
    ag_powered_plus: '$13 - $15',
  },
  '7501+': {
    telematics_safety: '$42 - $49',
    fleet_apps: '$20',
    aim4_moby: '$60',
    aim4_only: '$40',
    safety_only: '$26 - $35',
    telematics_only: '$16 - $20',
    eld_addon: '$3 - $5',
    ag_trailer_premier: '$11 - $13',
    at11: '$6',
    ag_unpowered: '$8',
    ag_powered_basic: '$10 - $12',
    ag_powered_plus: '$13 - $15',
  },
};

/** Map product SKU (and optionally product name) to guidance column key. */
function getColumnKeyForProduct(sku: string, productName?: string): GuidanceColumnKey | null {
  const skuUpper = sku.toUpperCase();
  const nameUpper = (productName ?? '').toUpperCase();

  if (skuUpper === 'LIC-VG-ENTERPRISE') return 'telematics_only';
  if (skuUpper === 'LIC-CM-D-ENTERPRISE') return 'safety_only';
  if (skuUpper === 'LIC-FL-APPS') return 'fleet_apps';
  if (skuUpper === 'LIC-MC-AIM4') {
    return nameUpper.includes('MOBY') ? 'aim4_moby' : 'aim4_only';
  }
  if (skuUpper === 'LIC-COMPLIANCE') return 'eld_addon';
  if (skuUpper === 'LIC-TRLR-PREM') return 'ag_trailer_premier';
  if (skuUpper === 'LIC-AT-TAG') return 'at11';
  if (skuUpper === 'LIC-AG-UNPWR') return 'ag_unpowered';
  if (skuUpper === 'LIC-AG-PWR-BASIC') return 'ag_powered_basic';
  if (skuUpper === 'LIC-AG-PWR-PLUS') return 'ag_powered_plus';

  return null;
}

/**
 * Look up opening price guidance for a product.
 * Returns the target monthly opening price string (e.g. "$60" or "$80 - $90") or null if no match.
 * Assumes USD and Enterprise segment.
 */
export function getOpeningPriceGuidance(
  negotiationPosition: NegotiationPosition,
  fleetSize: number,
  sku: string,
  productName?: string
): string | null {
  const columnKey = getColumnKeyForProduct(sku, productName);
  if (!columnKey) return null;

  const bucket = getFleetSizeBucket(fleetSize);
  const table = negotiationPosition === 'favorable' ? OPENING_PRICE_FAVORABLE : OPENING_PRICE_UNFAVORABLE;
  const row = table[bucket];
  return row[columnKey] ?? null;
}
