export interface DenominationCounts {
  n500: number;
  n200: number;
  n100: number;
  n50: number;
  n20: number;
  n10: number;
  coins: number;
}

export interface VehicleDenominationRecord {
  id: string | number;
  date: string;
  vehicleNo: string;
  driverName: string;
  ordersCount: number;
  netSales: number;
  qrAmount: number;
  cashAmount: number;
  diff: number; // (cashAmount + qrAmount) - netSales
  counts: DenominationCounts;
  settledBy: string;
  settledAt: string;
  notes?: string;
  status: 'settled' | 'pending';
}
