// Mock and persistent data store for Incentive Schemes module
export interface SkuTargetItem {
  id: number;
  skuName: string;
  category: string;
  price: number;
  inc: number; // Incentive per unit in INR
  incMin: number; // Minimum quantity to sell
  incF: string; // Start date YYYY-MM-DD
  incT: string; // End date YYYY-MM-DD
  incImg?: string;
  status: 'running' | 'starts' | 'ended';
  isActive: boolean;
}

export interface SchemeTarget {
  id: number;
  type: 'sale' | 'cust' | 'newc' | 'vill' | 'ord';
  name: string;
  f: string; // Start date
  t: string; // End date
  daily?: boolean;
  emp: string; // 'All CRM staff' or specific employee name
  target: number; // amount or count
  rt: 'fixed' | 'pct'; // fixed amount or % of sales
  rv: number; // reward value (INR or %)
  st: 'active' | 'stopped';
}

export interface AchievedTargetRecord {
  id: number;
  targetId: number;
  targetName: string;
  type: 'sale' | 'cust' | 'newc' | 'vill' | 'ord';
  by: string; // employee name
  date: string; // YYYY-MM-DD
  ach: number;
  rw: number;
  orders: {
    inv: string;
    cust: string;
    village: string;
    value: number;
  }[];
}

export interface TargetStatusRow {
  id: number;
  by: string;
  kind: 'sku' | 'sale' | 'cust' | 'newc' | 'vill' | 'ord';
  schemeName: string;
  f: string;
  t: string;
  target: number;
  ach: number;
  gap: number;
  ok: boolean; // eligible or not yet
  earn: number;
  pot: number;
}

export const INITIAL_SKU_TARGETS: SkuTargetItem[] = [
  {
    id: 1,
    skuName: 'Aramane Detergent Powder 10Rs 120Pcs Bag',
    category: 'SOAPS & DETERGENTS',
    price: 1000,
    inc: 20,
    incMin: 5,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 2,
    skuName: 'Daawat Rice 26Kg Bag',
    category: 'RICE',
    price: 2470,
    inc: 10,
    incMin: 1,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 3,
    skuName: 'Jasmine Rice 30 kg Bag',
    category: 'RICE',
    price: 2700,
    inc: 10,
    incMin: 2,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 4,
    skuName: 'SUN ROYAL 750 GM SUNFLOWER OIL BOX',
    category: 'EDIBLE OILS',
    price: 1450,
    inc: 10,
    incMin: 5,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 5,
    skuName: 'Trulove Bourbon Biscuits 5Rs 144Pcs Box',
    category: 'BISCUITS & CONFECTIONERY',
    price: 510,
    inc: 10,
    incMin: 10,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 6,
    skuName: 'Trulove Choco Milk Biscuit 5Rs 144Pcs Box',
    category: 'BISCUITS & CONFECTIONERY',
    price: 510,
    inc: 10,
    incMin: 10,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 7,
    skuName: 'Trulove Orange Cream 5Rs 144Pcs Box',
    category: 'BISCUITS & CONFECTIONERY',
    price: 510,
    inc: 10,
    incMin: 10,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 8,
    skuName: 'Akva 200 ml Water Cups Box',
    category: 'BEVERAGES',
    price: 240,
    inc: 5,
    incMin: 20,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 9,
    skuName: 'Aashirvaad Atta 10 kg Bag',
    category: 'GRAINS & FLOUR',
    price: 420,
    inc: 8,
    incMin: 4,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 10,
    skuName: 'Tata Salt 1 kg (25 Pcs Box)',
    category: 'SPICES & CONDIMENTS',
    price: 600,
    inc: 12,
    incMin: 3,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 11,
    skuName: 'Fortune Sunlite Oil 1 Ltr (15 Pcs Box)',
    category: 'EDIBLE OILS',
    price: 1850,
    inc: 15,
    incMin: 2,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
  {
    id: 12,
    skuName: 'Red Label Tea 500g (20 Pcs Box)',
    category: 'BEVERAGES',
    price: 4800,
    inc: 20,
    incMin: 2,
    incF: '2026-11-01',
    incT: '2026-11-30',
    incImg: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=120&auto=format&fit=crop&q=80',
    status: 'running',
    isActive: true,
  },
];

export const INITIAL_SCHEME_TARGETS: SchemeTarget[] = [
  {
    id: 1,
    type: 'sale',
    name: 'Sales Target Nov 2026',
    f: '2026-11-05',
    t: '2026-11-30',
    daily: true,
    emp: 'All CRM staff',
    target: 120000,
    rt: 'fixed',
    rv: 100,
    st: 'active',
  },
];

export const INITIAL_ACHIEVED_TARGETS: AchievedTargetRecord[] = [
  {
    id: 1,
    targetId: 1,
    targetName: 'Sales Target Nov 2026 (07-11-2026)',
    type: 'sale',
    by: 'Pushpa Patil',
    date: '2026-11-07',
    ach: 124500,
    rw: 50,
    orders: [
      { inv: 'INV-2026-0891', cust: 'Basaveshwar Kirana', village: 'Tikota', value: 45000 },
      { inv: 'INV-2026-0894', cust: 'Shri Renuka Stores', village: 'Horti', value: 38500 },
      { inv: 'INV-2026-0899', cust: 'Annapurna Traders', village: 'Babaleshwar', value: 41000 },
    ],
  },
  {
    id: 2,
    targetId: 1,
    targetName: 'Sales Target Nov 2026 (06-11-2026)',
    type: 'sale',
    by: 'Dhruthi A S',
    date: '2026-11-06',
    ach: 131200,
    rw: 50,
    orders: [
      { inv: 'INV-2026-0870', cust: 'Mahalaxmi Provision', village: 'Chadchan', value: 52000 },
      { inv: 'INV-2026-0875', cust: 'Siddaroodha Stores', village: 'Indi', value: 48200 },
      { inv: 'INV-2026-0881', cust: 'Om Kirana Center', village: 'Sindagi', value: 31000 },
    ],
  },
  {
    id: 3,
    targetId: 1,
    targetName: 'Sales Target Nov 2026 (06-11-2026)',
    type: 'sale',
    by: 'Pushpa Patil',
    date: '2026-11-06',
    ach: 122800,
    rw: 50,
    orders: [
      { inv: 'INV-2026-0868', cust: 'Sri Guru Kirana', village: 'Tikota', value: 65000 },
      { inv: 'INV-2026-0872', cust: 'Ganesh General Store', village: 'Babaleshwar', value: 57800 },
    ],
  },
  {
    id: 4,
    targetId: 1,
    targetName: 'Sales Target Nov 2026 (05-11-2026)',
    type: 'sale',
    by: 'Pushpa Patil',
    date: '2026-11-05',
    ach: 142000,
    rw: 100,
    orders: [
      { inv: 'INV-2026-0850', cust: 'Vijay Trading Co', village: 'Vijayapura', value: 85000 },
      { inv: 'INV-2026-0855', cust: 'Laxmi Retail Store', village: 'Horti', value: 57000 },
    ],
  },
  {
    id: 5,
    targetId: 1,
    targetName: 'Sales Target Nov 2026 (05-11-2026)',
    type: 'sale',
    by: 'Dhruthi A S',
    date: '2026-11-05',
    ach: 128500,
    rw: 100,
    orders: [
      { inv: 'INV-2026-0852', cust: 'Bharat General Stores', village: 'Indi', value: 72500 },
      { inv: 'INV-2026-0859', cust: 'Kalyan Stores', village: 'Chadchan', value: 56000 },
    ],
  },
];

export const INITIAL_TARGET_STATUS_ROWS: TargetStatusRow[] = [
  {
    id: 1,
    by: 'Pushpa Patil',
    kind: 'sku',
    schemeName: 'Aramane Detergent Powder 10Rs 120Pcs Bag',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 5,
    ach: 5,
    gap: 0,
    ok: true,
    earn: 100,
    pot: 100,
  },
  {
    id: 2,
    by: 'Pushpa Patil',
    kind: 'sku',
    schemeName: 'Daawat Rice 26Kg Bag',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 1,
    ach: 3,
    gap: 0,
    ok: true,
    earn: 30,
    pot: 30,
  },
  {
    id: 3,
    by: 'Pushpa Patil',
    kind: 'sku',
    schemeName: 'Jasmine Rice 30 kg Bag',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 2,
    ach: 4,
    gap: 0,
    ok: true,
    earn: 40,
    pot: 40,
  },
  {
    id: 4,
    by: 'Pushpa Patil',
    kind: 'sku',
    schemeName: 'SUN ROYAL 750 GM SUNFLOWER OIL BOX',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 5,
    ach: 8,
    gap: 0,
    ok: true,
    earn: 80,
    pot: 80,
  },
  {
    id: 5,
    by: 'Pushpa Patil',
    kind: 'sale',
    schemeName: 'Sales Target Nov 2026',
    f: '2026-11-05',
    t: '2026-11-30',
    target: 120000,
    ach: 142000,
    gap: 0,
    ok: true,
    earn: 100,
    pot: 100,
  },
  {
    id: 6,
    by: 'Dhruthi A S',
    kind: 'sku',
    schemeName: 'Aramane Detergent Powder 10Rs 120Pcs Bag',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 5,
    ach: 6,
    gap: 0,
    ok: true,
    earn: 120,
    pot: 120,
  },
  {
    id: 7,
    by: 'Dhruthi A S',
    kind: 'sale',
    schemeName: 'Sales Target Nov 2026',
    f: '2026-11-05',
    t: '2026-11-30',
    target: 120000,
    ach: 128500,
    gap: 0,
    ok: true,
    earn: 100,
    pot: 100,
  },
  {
    id: 8,
    by: 'Pushpa Patil',
    kind: 'sku',
    schemeName: 'Trulove Bourbon Biscuits 5Rs 144Pcs Box',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 10,
    ach: 6,
    gap: 4,
    ok: false,
    earn: 0,
    pot: 100,
  },
  {
    id: 9,
    by: 'Pushpa Patil',
    kind: 'sku',
    schemeName: 'Trulove Choco Milk Biscuit 5Rs 144Pcs Box',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 10,
    ach: 5,
    gap: 5,
    ok: false,
    earn: 0,
    pot: 100,
  },
  {
    id: 10,
    by: 'Dhruthi A S',
    kind: 'sku',
    schemeName: 'Trulove Orange Cream 5Rs 144Pcs Box',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 10,
    ach: 4,
    gap: 6,
    ok: false,
    earn: 0,
    pot: 100,
  },
  {
    id: 11,
    by: 'Dhruthi A S',
    kind: 'sku',
    schemeName: 'Akva 200 ml Water Cups Box',
    f: '2026-11-01',
    t: '2026-11-30',
    target: 20,
    ach: 8,
    gap: 12,
    ok: false,
    earn: 0,
    pot: 100,
  },
];

// LocalStorage helpers
const SKU_TGT_KEY = 'erp_incentives_sku_targets_v1';
const SCH_TGT_KEY = 'erp_incentives_scheme_targets_v1';
const ACH_TGT_KEY = 'erp_incentives_achieved_targets_v1';
const STAT_TGT_KEY = 'erp_incentives_status_rows_v1';

export function getStoredSkuTargets(): SkuTargetItem[] {
  try {
    const raw = localStorage.getItem(SKU_TGT_KEY);
    if (!raw) {
      localStorage.setItem(SKU_TGT_KEY, JSON.stringify(INITIAL_SKU_TARGETS));
      return INITIAL_SKU_TARGETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SKU_TARGETS;
  }
}

export function saveStoredSkuTargets(list: SkuTargetItem[]) {
  try {
    localStorage.setItem(SKU_TGT_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving SKU targets:', e);
  }
}

export function getStoredSchemeTargets(): SchemeTarget[] {
  try {
    const raw = localStorage.getItem(SCH_TGT_KEY);
    if (!raw) {
      localStorage.setItem(SCH_TGT_KEY, JSON.stringify(INITIAL_SCHEME_TARGETS));
      return INITIAL_SCHEME_TARGETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SCHEME_TARGETS;
  }
}

export function saveStoredSchemeTargets(list: SchemeTarget[]) {
  try {
    localStorage.setItem(SCH_TGT_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving scheme targets:', e);
  }
}

export function getStoredAchievedTargets(): AchievedTargetRecord[] {
  try {
    const raw = localStorage.getItem(ACH_TGT_KEY);
    if (!raw) {
      localStorage.setItem(ACH_TGT_KEY, JSON.stringify(INITIAL_ACHIEVED_TARGETS));
      return INITIAL_ACHIEVED_TARGETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ACHIEVED_TARGETS;
  }
}

export function saveStoredAchievedTargets(list: AchievedTargetRecord[]) {
  try {
    localStorage.setItem(ACH_TGT_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving achieved targets:', e);
  }
}

export function getStoredStatusRows(): TargetStatusRow[] {
  try {
    const raw = localStorage.getItem(STAT_TGT_KEY);
    if (!raw) {
      localStorage.setItem(STAT_TGT_KEY, JSON.stringify(INITIAL_TARGET_STATUS_ROWS));
      return INITIAL_TARGET_STATUS_ROWS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TARGET_STATUS_ROWS;
  }
}

export function saveStoredStatusRows(list: TargetStatusRow[]) {
  try {
    localStorage.setItem(STAT_TGT_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving status rows:', e);
  }
}
