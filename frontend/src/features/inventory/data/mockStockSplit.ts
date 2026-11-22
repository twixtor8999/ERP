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
    "id": "SPMWNGF7IV",
    "date": "2026-11-19",
    "at": "2026-11-19T11:15:50.359Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755070131,
    "name": "Gajaraj Kesar Sooji 30Kg Bag",
    "out": 2,
    "grn": 1240,
    "conv": [
      {
        "s": 1793211755069131,
        "name": "Gajaraj Kesar Sooji 10Kg Bag",
        "q": 6,
        "p": 413.33
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWNGE1ZR",
    "date": "2026-11-19",
    "at": "2026-11-19T11:14:56.535Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755114131,
    "name": "Urad Dal 30Kg Bag",
    "out": 1,
    "grn": 3750,
    "conv": [
      {
        "s": 1793211755113131,
        "name": "Urad Dal 10Kg Bag",
        "q": 3,
        "p": 1250
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWLLWT3O",
    "date": "2026-11-18",
    "at": "2026-11-18T04:13:57.204Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755076131,
    "name": "Sooji 30Kg Bag",
    "out": 1,
    "grn": 1240,
    "conv": [
      {
        "s": 1793211755075131,
        "name": "Sooji 10Kg Bag",
        "q": 3,
        "p": 413.33
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Prashant Kalamadi",
    "role": "Admin"
  },
  {
    "id": "SPMWKL3HXM",
    "date": "2026-11-17",
    "at": "2026-11-17T11:03:23.530Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1792862514742293,
    "name": "Maida 30Kg Bag",
    "out": 1,
    "grn": 1070,
    "conv": [
      {
        "s": 1792862514741293,
        "name": "Maida 10Kg Bag",
        "q": 3,
        "p": 356.67
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Arun Patil",
    "role": "Admin"
  },
  {
    "id": "SPMWIXUXTL",
    "date": "2026-11-16",
    "at": "2026-11-16T07:25:06.873Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755095131,
    "name": "Masoor Dal 30Kg Bag",
    "out": 1,
    "grn": 2340,
    "conv": [
      {
        "s": 1793211755094131,
        "name": "Masoor Dal 10Kg Bag",
        "q": 3,
        "p": 780
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWIR3O7C",
    "date": "2026-11-16",
    "at": "2026-11-16T04:15:57.000Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755110131,
    "name": "Toor Dal 30Kg Bag",
    "out": 1,
    "grn": 1000,
    "conv": [
      {
        "s": 1793211755109131,
        "name": "Toor Dal 10Kg Bag",
        "q": 3,
        "p": 333.33
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Prashant Kalamadi",
    "role": "Admin"
  },
  {
    "id": "SPMWIR2Q3Z",
    "date": "2026-11-16",
    "at": "2026-11-16T04:15:12.815Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755095131,
    "name": "Masoor Dal 30Kg Bag",
    "out": 1,
    "grn": 2340,
    "conv": [
      {
        "s": 1793211755094131,
        "name": "Masoor Dal 10Kg Bag",
        "q": 3,
        "p": 780
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Prashant Kalamadi",
    "role": "Admin"
  },
  {
    "id": "SPMWIYW88O",
    "date": "2026-11-16",
    "at": "2026-11-16T07:54:06.648Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755114131,
    "name": "Urad Dal 30Kg Bag",
    "out": 1,
    "grn": 3750,
    "conv": [
      {
        "s": 1793211755113131,
        "name": "Urad Dal 10Kg Bag",
        "q": 3,
        "p": 1250
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWDT0SOO",
    "date": "2026-11-12",
    "at": "2026-11-12T17:10:51.192Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1792862514913293,
    "name": "Surf Excel Detergent Soap 250gm 60Pcs Box",
    "out": 2,
    "grn": 1000,
    "conv": [
      {
        "s": 1792862514912293,
        "name": "Surf Excel Detergent Soap 250gm 6Pcs Pkt",
        "q": 20,
        "p": 205
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Prashant Kalamadi",
    "role": "Admin"
  },
  {
    "id": "SPMWDPR3B0",
    "date": "2026-11-12",
    "at": "2026-11-12T15:39:19.548Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1792862514918293,
    "name": "Vilmaa Femiluv Soft Pads - XL 280mm 80Pcs Box",
    "out": 1,
    "grn": 800,
    "conv": [
      {
        "s": 1792862514917293,
        "name": "Vilmaa Femiluv Soft Pads - XL 280mm 1Pcs Pkt",
        "q": 80,
        "p": 25
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWDPQEAC",
    "date": "2026-11-12",
    "at": "2026-11-12T15:38:47.124Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1792862514916293,
    "name": "Vilmaa Femiluv Dry Pads - XL 280mm 80Pcs Box",
    "out": 1,
    "grn": 800,
    "conv": [
      {
        "s": 1792862514915293,
        "name": "Vilmaa Femiluv Dry Pads - XL 280mm 1Pcs Pkt",
        "q": 80,
        "p": 25
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWDN5S0Q",
    "date": "2026-11-12",
    "at": "2026-11-12T14:26:45.914Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755070131,
    "name": "Gajaraj Kesar Sooji 30Kg Bag",
    "out": 1,
    "grn": 1240,
    "conv": [
      {
        "s": 1793211755069131,
        "name": "Gajaraj Kesar Sooji 10Kg Bag",
        "q": 3,
        "p": 450
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWDN0GDU",
    "date": "2026-11-12",
    "at": "2026-11-12T14:22:37.554Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755090131,
    "name": "Gram Dal Fine 10Kg Bag",
    "out": 3,
    "grn": 920,
    "conv": [
      {
        "s": 1793211755091131,
        "name": "Gram Dal Fine 30Kg Bag",
        "q": 1,
        "p": 2900
      }
    ],
    "shr": null,
    "diffKg": -0.003,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWDMYV1M",
    "date": "2026-11-12",
    "at": "2026-11-12T14:21:23.242Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755069131,
    "name": "Gajaraj Kesar Sooji 10Kg Bag",
    "out": 6,
    "grn": 403.33,
    "conv": [
      {
        "s": 1793211755070131,
        "name": "Gajaraj Kesar Sooji 30Kg Bag",
        "q": 2,
        "p": 1320
      }
    ],
    "shr": null,
    "diffKg": -0.006,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWDPMTW5",
    "date": "2026-11-12",
    "at": "2026-11-12T15:36:00.725Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1792862514875293,
    "name": "Dabur Vatika Health Shampoo 1Rs 960Pcs Box",
    "out": 1,
    "grn": 450,
    "conv": [
      {
        "s": 1792862514874293,
        "name": "Dabur Vatika Health Shampoo 1Rs 64pcs (4 Sheet Pkt)",
        "q": 15,
        "p": 46.67
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWDPM8CD",
    "date": "2026-11-12",
    "at": "2026-11-12T15:35:32.797Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1792862514909293,
    "name": "Sunsilk Shampoo 1Rs 960Pcs Box",
    "out": 1,
    "grn": 450,
    "conv": [
      {
        "s": 1792862514908293,
        "name": "Sunsilk Shampoo 1Rs 64pcs (4 Sheet Pkt)",
        "q": 15,
        "p": 65
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMWDPL5KD",
    "date": "2026-11-12",
    "at": "2026-11-12T15:34:42.541Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1792862514877293,
    "name": "Dove Daily Shine Shampoo 2Rs 960Pcs Box",
    "out": 1,
    "grn": 650,
    "conv": [
      {
        "s": 1792862514876293,
        "name": "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)",
        "q": 15,
        "p": 130
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMW9199JV",
    "date": "2026-11-09",
    "at": "2026-11-09T09:02:32.347Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755095131,
    "name": "Masoor Dal 30Kg Bag",
    "out": 1,
    "grn": 2340,
    "conv": [
      {
        "s": 1793211755094131,
        "name": "Masoor Dal 10Kg Bag",
        "q": 3,
        "p": 813.33
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Prashant Kalamadi",
    "role": "Admin"
  },
  {
    "id": "SPMW4RO06X",
    "date": "2026-11-06",
    "at": "2026-11-06T09:22:59.193Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755110131,
    "name": "Toor Dal 30Kg Bag",
    "out": 1,
    "grn": 1000,
    "conv": [
      {
        "s": 1793211755109131,
        "name": "Toor Dal 10Kg Bag",
        "q": 3,
        "p": 1450
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Prashant Kalamadi",
    "role": "Admin"
  },
  {
    "id": "SPMW3OGS4B",
    "date": "2026-11-05",
    "at": "2026-11-05T15:05:37.115Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755114131,
    "name": "Urad Dal 30Kg Bag",
    "out": 1,
    "grn": 3750,
    "conv": [
      {
        "s": 1793211755113131,
        "name": "Urad Dal 10Kg Bag",
        "q": 3,
        "p": 1250
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMW3OFRLN",
    "date": "2026-11-05",
    "at": "2026-11-05T15:04:49.787Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755087131,
    "name": "Fried Gram Fine 30Kg Bag",
    "out": 2,
    "grn": 3120,
    "conv": [
      {
        "s": 1793211755086131,
        "name": "Fried Gram Fine 10Kg Bag",
        "q": 6,
        "p": 1100
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMW3OEFLN",
    "date": "2026-11-05",
    "at": "2026-11-05T15:03:47.579Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755091131,
    "name": "Gram Dal Fine 30Kg Bag",
    "out": 2,
    "grn": 2760,
    "conv": [
      {
        "s": 1793211755090131,
        "name": "Gram Dal Fine 10Kg Bag",
        "q": 6,
        "p": 970
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMW3N2ZBM",
    "date": "2026-11-05",
    "at": "2026-11-05T14:26:53.650Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1792862514742293,
    "name": "Maida 30Kg Bag",
    "out": 2,
    "grn": 1080,
    "conv": [
      {
        "s": 1792862514741293,
        "name": "Maida 10Kg Bag",
        "q": 6,
        "p": 390
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMW3N0236",
    "date": "2026-11-05",
    "at": "2026-11-05T14:24:37.266Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755070131,
    "name": "Gajaraj Kesar Sooji 30Kg Bag",
    "out": 2,
    "grn": 1220,
    "conv": [
      {
        "s": 1793211755069131,
        "name": "Gajaraj Kesar Sooji 10Kg Bag",
        "q": 6,
        "p": 440
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  },
  {
    "id": "SPMW3MYCBN",
    "date": "2026-11-05",
    "at": "2026-11-05T14:23:17.219Z",
    "dc": "SIDDESHWAR ENTERPRISES",
    "s": 1793211755076131,
    "name": "Sooji 30Kg Bag",
    "out": 2,
    "grn": 1200,
    "conv": [
      {
        "s": 1793211755075131,
        "name": "Sooji 10Kg Bag",
        "q": 6,
        "p": 435
      }
    ],
    "shr": null,
    "diffKg": 0,
    "by": "Vijaykumar Shantagiri",
    "role": "Admin"
  }
];

const SPLIT_STORAGE_KEY = "erp_wholesale_stock_splits_v2";

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
    console.error("Failed to save stock splits", err);
  }
}

export function extractKgFromName(name: string): number {
  if (!name) return 1;
  const m = name.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/i);
  if (m && m[1]) return parseFloat(m[1]);
  const gm = name.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram)/i);
  if (gm && gm[1]) return parseFloat(gm[1]) / 1000;
  const l = name.match(/(\d+(?:\.\d+)?)\s*(?:l|ltr|liter|litre)/i);
  if (l && l[1]) return parseFloat(l[1]);
  return 1;
}
