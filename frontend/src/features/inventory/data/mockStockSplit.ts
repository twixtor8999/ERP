export interface ConvertedItem {
  s: number;
  name: string;
  q: number;
  p: number;
}

export interface ShrinkageItem {
  s: number;
  name: string;
  q: number;
  p: number;
}

export interface StockSplitRecord {
  id: string;
  date: string;
  at: string;
  dc: string;
  s: number; // source SKU id
  name: string; // source SKU name
  out: number;
  grn: number;
  conv: ConvertedItem[];
  shr: ShrinkageItem | null;
  diffKg: number | null;
  by: string;
  role: string;
}

export const INITIAL_STOCK_SPLITS: StockSplitRecord[] = [
  {
    id: "SP-20261122-01",
    date: "2026-11-22",
    at: "2026-11-22T14:30:00.000Z",
    dc: "SIDDESHWAR ENTERPRISES",
    s: 102,
    name: "Gajaraj Kesar Sooji 30Kg Bag",
    out: 2,
    grn: 1100,
    conv: [
      {
        s: 101,
        name: "Gajaraj Kesar Sooji 10Kg Bag",
        q: 6,
        p: 380,
      },
    ],
    shr: {
      s: 101,
      name: "Sooji Dust / Loss",
      q: 0.5,
      p: 0,
    },
    diffKg: 0.5,
    by: "Vijaykumar Shantagiri",
    role: "Owner",
  },
  {
    id: "SP-20261121-02",
    date: "2026-11-21",
    at: "2026-11-21T11:15:00.000Z",
    dc: "SIDDESHWAR ENTERPRISES",
    s: 111,
    name: "Sugar M-30 50Kg Bag",
    out: 1,
    grn: 1980,
    conv: [
      {
        s: 112,
        name: "Tata Salt Crystal 1Kg (25 Pkts)",
        q: 2,
        p: 410,
      },
    ],
    shr: null,
    diffKg: 0,
    by: "Vijaykumar Shantagiri",
    role: "Owner",
  },
];

const SPLIT_STORAGE_KEY = "erp_wholesale_stock_splits";

export function getStoredStockSplits(): StockSplitRecord[] {
  try {
    const raw = localStorage.getItem(SPLIT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify(INITIAL_STOCK_SPLITS));
      return INITIAL_STOCK_SPLITS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STOCK_SPLITS;
  }
}

export function saveStoredStockSplits(splits: StockSplitRecord[]): void {
  try {
    localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify(splits));
  } catch (err) {
    console.error("Failed to save stock splits:", err);
  }
}

// Helper to extract kg weight from SKU name, matching nxKg from reference app
export function extractKgFromName(name: string): number {
  if (!name) return 1;
  const m = name.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/i);
  if (m && m[1]) return parseFloat(m[1]);
  const gm = name.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram)/i);
  if (gm && gm[1]) return parseFloat(gm[1]) / 1000;
  const l = name.match(/(\d+(?:\.\d+)?)\s*(?:l|ltr|liter)/i);
  if (l && l[1]) return parseFloat(l[1]);
  return 1;
}
