export interface RollItem {
  id: string | number;
  name: string;
  category: 'packing' | 'billing' | 'thermal' | 'other';
  total: number;
  used: number;
  minThreshold: number;
  unit: string; // e.g. Rolls, Boxes
  costPerRoll: number;
  lastUsedAt?: string;
}

export interface RollUsageLog {
  id: string;
  rollId: string | number;
  rollName: string;
  qty: number;
  department: string; // 'Warehouse Packing' | 'Billing Desk' | 'Delivery Van'
  usedBy: string;
  date: string;
  notes?: string;
}
