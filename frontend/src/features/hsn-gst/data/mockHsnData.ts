import { HsnGstRecord } from '../types';

export const INITIAL_HSN_CODES: HsnGstRecord[] = [
  { code: '15119020', desc: 'Refined Palm Oil (Edible)', gst: 5, skusCount: 14, category: 'Edible Oils' },
  { code: '15121910', desc: 'Refined Sunflower Seed Oil', gst: 5, skusCount: 18, category: 'Edible Oils' },
  { code: '11010000', desc: 'Wheat Flour / Maida / Atta (Packaged)', gst: 5, skusCount: 22, category: 'Atta & Flours' },
  { code: '11029000', desc: 'Besan / Gram Flour & Cereal Flours', gst: 5, skusCount: 8, category: 'Atta & Flours' },
  { code: '17019990', desc: 'Refined Sugar (S-30, M-30 Packaged)', gst: 5, skusCount: 12, category: 'Sugar & Salt' },
  { code: '25010010', desc: 'Common Edible Iodised Salt (Tata Salt)', gst: 0, skusCount: 6, category: 'Sugar & Salt' },
  { code: '09103020', desc: 'Turmeric Powder (Haldi) Packaged', gst: 5, skusCount: 10, category: 'Spices & Masala' },
  { code: '09109929', desc: 'Garam Masala & Mixed Spice Powders', gst: 5, skusCount: 15, category: 'Spices & Masala' },
  { code: '19053100', desc: 'Sweet Biscuits (Parle-G, Marie Gold)', gst: 18, skusCount: 34, category: 'Biscuits & Snacks' },
  { code: '19059040', desc: 'Wafers & Salty Snacks (Namkeen)', gst: 12, skusCount: 16, category: 'Biscuits & Snacks' },
  { code: '33051090', desc: 'Hair Shampoos (Dove, Clinic Plus Sachets)', gst: 18, skusCount: 20, category: 'Personal Care' },
  { code: '34011110', desc: 'Medicated Toilet Soaps', gst: 18, skusCount: 12, category: 'Personal Care' },
  { code: '34011942', desc: 'Laundry Soap Cakes & Detergent Bars', gst: 18, skusCount: 16, category: 'Household' },
  { code: '34029020', desc: 'Synthetic Detergent Powders (Surf Excel)', gst: 18, skusCount: 18, category: 'Household' },
  { code: '96190010', desc: 'Baby Diapers & Sanitary Napkins (Bumtum)', gst: 12, skusCount: 15, category: 'Baby Care' },
  { code: '21069099', desc: 'Packaged Ready-to-Eat Food Preparations', gst: 18, skusCount: 9, category: 'Packaged Foods' },
];

const STORAGE_KEY = 'erp_hsn_gst_master_matrix';

export function getStoredHsnCodes(): HsnGstRecord[] {
  if (typeof window === 'undefined') return INITIAL_HSN_CODES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HSN_CODES));
      return INITIAL_HSN_CODES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_HSN_CODES;
  } catch {
    return INITIAL_HSN_CODES;
  }
}

export function saveStoredHsnCodes(codes: HsnGstRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch (e) {
    console.error('Failed to save HSN codes', e);
  }
}

/**
 * Longest prefix match algorithm matching client application:
 * e.g. 34011942 matches before 3401
 */
export function resolveGstForHsn(hsn: string, hsnList: HsnGstRecord[] = getStoredHsnCodes()): number {
  if (!hsn) return 5;
  const clean = hsn.replace(/[^0-9]/g, '');
  const sorted = [...hsnList].sort((a, b) => b.code.length - a.code.length);
  for (const item of sorted) {
    if (clean.startsWith(item.code)) {
      return item.gst;
    }
  }
  return 5;
}
