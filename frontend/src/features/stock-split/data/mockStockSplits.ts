import { StockSplitRecord } from '../types';

export const INITIAL_STOCK_SPLITS: StockSplitRecord[] = [
  {
    id: 'SPLIT-1793211755',
    date: '2026-11-24',
    dcName: 'SIDDESHWAR ENTERPRISES',
    parentSkuId: '1793211755095131',
    parentSkuNo: '1793211755095131',
    parentItemName: 'Masoor Dal 30Kg Bag',
    parentCategory: 'Pulses & Grains',
    parentGrnPrice: 2340,
    splitQty: 1,
    childSkuId: '1793211755095132',
    childSkuNo: '1793211755095132',
    childItemName: 'Masoor Dal 1Kg Pkt',
    childCategory: 'Pulses & Grains',
    convertedQty: 30,
    splitGrnPrice: 78.0, // 2340 / 30
    shrinkageQty: 0,
    operatorName: 'Arun Patil',
    notes: 'Split 1x 30kg bulk sack into 30x 1kg retail packs',
    createdAt: '2026-11-24T10:15:00Z',
  },
  {
    id: 'SPLIT-1792862514-S',
    date: '2026-11-24',
    dcName: 'SIDDESHWAR ENTERPRISES',
    parentSkuId: '1792862514918293',
    parentSkuNo: '1792862514918293',
    parentItemName: 'Vilmaa Femiluv Soft Pads - XL 280mm 80Pcs Box',
    parentCategory: 'Personal Care',
    parentGrnPrice: 800,
    splitQty: 1,
    childSkuId: '1792862514918294',
    childSkuNo: '1792862514918294',
    childItemName: 'Vilmaa Femiluv Soft Pads - XL 280mm 1Pcs Pkt',
    childCategory: 'Personal Care',
    convertedQty: 80,
    splitGrnPrice: 10.0, // 800 / 80
    shrinkageQty: 0,
    operatorName: 'Pushpa Patil',
    notes: 'Master box opened for retail packet distribution',
    createdAt: '2026-11-24T11:42:00Z',
  },
  {
    id: 'SPLIT-1792862514-D',
    date: '2026-11-24',
    dcName: 'SIDDESHWAR ENTERPRISES',
    parentSkuId: '1792862514916293',
    parentSkuNo: '1792862514916293',
    parentItemName: 'Vilmaa Femiluv Dry Pads - XL 280mm 80Pcs Box',
    parentCategory: 'Personal Care',
    parentGrnPrice: 800,
    splitQty: 1,
    childSkuId: '1792862514916294',
    childSkuNo: '1792862514916294',
    childItemName: 'Vilmaa Femiluv Dry Pads - XL 280mm 1Pcs Pkt',
    childCategory: 'Personal Care',
    convertedQty: 80,
    splitGrnPrice: 10.0, // 800 / 80
    shrinkageQty: 0,
    operatorName: 'Pushpa Patil',
    notes: 'Bulk carton split into individual retail pouches',
    createdAt: '2026-11-24T12:05:00Z',
  },
];

const SPLITS_STORAGE_KEY = 'pk_stock_splits_v1';

export function getStoredStockSplits(): StockSplitRecord[] {
  try {
    const raw = localStorage.getItem(SPLITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(INITIAL_STOCK_SPLITS));
      return INITIAL_STOCK_SPLITS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stock splits from localStorage', e);
    return INITIAL_STOCK_SPLITS;
  }
}

export function saveStoredStockSplit(record: StockSplitRecord): StockSplitRecord[] {
  const current = getStoredStockSplits();
  const updated = [record, ...current];
  try {
    localStorage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save stock split to localStorage', e);
  }
  return updated;
}
