import { RollItem, RollUsageLog } from '../types';

export const INITIAL_ROLLS: RollItem[] = [
  {
    id: 1,
    name: 'BOPP Brown Packaging Tape (2 Inch, 65m)',
    category: 'packing',
    total: 120,
    used: 48,
    minThreshold: 20,
    unit: 'Rolls',
    costPerRoll: 38,
    lastUsedAt: '24-11-2026',
  },
  {
    id: 2,
    name: 'Thermal Billing Paper Roll (80mm x 50m)',
    category: 'thermal',
    total: 80,
    used: 52,
    minThreshold: 25,
    unit: 'Rolls',
    costPerRoll: 45,
    lastUsedAt: '24-11-2026',
  },
  {
    id: 3,
    name: 'POS Handheld Receipt Paper (58mm x 25m)',
    category: 'billing',
    total: 60,
    used: 46,
    minThreshold: 15,
    unit: 'Rolls',
    costPerRoll: 22,
    lastUsedAt: '23-11-2026',
  },
  {
    id: 4,
    name: 'Fragile Security Warning Tape (Red & White)',
    category: 'packing',
    total: 30,
    used: 12,
    minThreshold: 10,
    unit: 'Rolls',
    costPerRoll: 55,
    lastUsedAt: '21-11-2026',
  },
  {
    id: 5,
    name: 'Stretch Wrap Plastic Film Roll (500mm)',
    category: 'packing',
    total: 24,
    used: 9,
    minThreshold: 8,
    unit: 'Rolls',
    costPerRoll: 280,
    lastUsedAt: '22-11-2026',
  },
];

export const INITIAL_USAGE_LOGS: RollUsageLog[] = [
  {
    id: 'RUL-01',
    rollId: 1,
    rollName: 'BOPP Brown Packaging Tape (2 Inch, 65m)',
    qty: 4,
    department: 'Warehouse Packing Station 1',
    usedBy: 'Ramesh Biradar',
    date: '24-11-2026 05:30 PM',
    notes: 'Packing 14 wholesale carton boxes for route GOLASANGI',
  },
  {
    id: 'RUL-02',
    rollId: 2,
    rollName: 'Thermal Billing Paper Roll (80mm x 50m)',
    qty: 2,
    department: 'Delivery Van (KA28AB3425)',
    usedBy: 'Basavaraj Hiremath',
    date: '24-11-2026 08:15 AM',
    notes: 'Route delivery invoice printer rolls refill',
  },
  {
    id: 'RUL-03',
    rollId: 3,
    rollName: 'POS Handheld Receipt Paper (58mm x 25m)',
    qty: 3,
    department: 'Cashier Billing Desk',
    usedBy: 'Pushpa Patil',
    date: '23-11-2026 11:00 AM',
    notes: 'Counter POS terminal replacements',
  },
];

const ROLLS_STORAGE_KEY = 'erp_rolls_inventory_matrix';
const USAGE_STORAGE_KEY = 'erp_rolls_usage_history';

export function getStoredRolls(): RollItem[] {
  if (typeof window === 'undefined') return INITIAL_ROLLS;
  try {
    const raw = localStorage.getItem(ROLLS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROLLS_STORAGE_KEY, JSON.stringify(INITIAL_ROLLS));
      return INITIAL_ROLLS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ROLLS;
  } catch {
    return INITIAL_ROLLS;
  }
}

export function saveStoredRolls(rolls: RollItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLLS_STORAGE_KEY, JSON.stringify(rolls));
  } catch (e) {
    console.error('Failed to save rolls', e);
  }
}

export function getStoredUsageLogs(): RollUsageLog[] {
  if (typeof window === 'undefined') return INITIAL_USAGE_LOGS;
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(INITIAL_USAGE_LOGS));
      return INITIAL_USAGE_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_USAGE_LOGS;
  } catch {
    return INITIAL_USAGE_LOGS;
  }
}

export function saveStoredUsageLogs(logs: RollUsageLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save usage logs', e);
  }
}
