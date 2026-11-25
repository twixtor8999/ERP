import { VehicleDenominationRecord } from '../types/denomination';

export const INITIAL_DENOMINATIONS: VehicleDenominationRecord[] = [
  {
    id: 'DEN-101',
    date: '24-11-2026',
    vehicleNo: 'KA28AB3425',
    driverName: 'Basavaraj Hiremath',
    ordersCount: 14,
    netSales: 42800,
    qrAmount: 18500,
    cashAmount: 24300,
    diff: 0,
    counts: {
      n500: 42, // 21,000
      n200: 12, // 2,400
      n100: 7,  // 700
      n50: 3,   // 150
      n20: 2,   // 40
      n10: 1,   // 10
      coins: 0,
    },
    settledBy: 'Vijaykumar Shantagiri',
    settledAt: '24-11-2026 07:45 PM',
    status: 'settled',
  },
  {
    id: 'DEN-102',
    date: '23-11-2026',
    vehicleNo: 'KA28C8912',
    driverName: 'Mallappa Pujari',
    ordersCount: 11,
    netSales: 35400,
    qrAmount: 14200,
    cashAmount: 21150,
    diff: -50, // Short 50
    counts: {
      n500: 36, // 18,000
      n200: 14, // 2,800
      n100: 3,  // 300
      n50: 1,   // 50
      n20: 0,
      n10: 0,
      coins: 0,
    },
    settledBy: 'Vijaykumar Shantagiri',
    settledAt: '23-11-2026 08:10 PM',
    notes: 'Shortage of ₹50 waived by owner',
    status: 'settled',
  },
  {
    id: 'DEN-103',
    date: '22-11-2026',
    vehicleNo: 'KA28AB3425',
    driverName: 'Basavaraj Hiremath',
    ordersCount: 16,
    netSales: 51200,
    qrAmount: 26000,
    cashAmount: 25200,
    diff: 0,
    counts: {
      n500: 46, // 23,000
      n200: 9,  // 1,800
      n100: 3,  // 300
      n50: 2,   // 100
      n20: 0,
      n10: 0,
      coins: 0,
    },
    settledBy: 'Vijaykumar Shantagiri',
    settledAt: '22-11-2026 07:30 PM',
    status: 'settled',
  },
  {
    id: 'DEN-104',
    date: '21-11-2026',
    vehicleNo: 'KA28D5540',
    driverName: 'Ramesh Biradar',
    ordersCount: 9,
    netSales: 28900,
    qrAmount: 12000,
    cashAmount: 16920,
    diff: 20, // Excess 20
    counts: {
      n500: 30, // 15,000
      n200: 8,  // 1,600
      n100: 3,  // 300
      n50: 0,
      n20: 1,   // 20
      n10: 0,
      coins: 0,
    },
    settledBy: 'Pushpa Patil',
    settledAt: '21-11-2026 06:50 PM',
    notes: 'Customer gave ₹20 tip/excess rounded',
    status: 'settled',
  },
];

export const PENDING_DENOMINATIONS: VehicleDenominationRecord[] = [];

const STORAGE_KEY = 'erp_denominations_records';
const SETTLEMENTS_STORAGE_KEY = 'ai_smart_bazar_settlements_v5';

export function getStoredDenominations(): VehicleDenominationRecord[] {
  if (typeof window === 'undefined') return INITIAL_DENOMINATIONS;
  try {
    const recordsMap = new Map<string, VehicleDenominationRecord>();

    // Load any explicitly saved denomination vouchers first
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((r) => recordsMap.set(`${r.date}_${r.vehicleNo}`, r));
      }
    }

    // Merge with any settlements saved in Vehicle Settlement (STORAGE_KEY_SETTLEMENTS)
    const rawSettlements = localStorage.getItem(SETTLEMENTS_STORAGE_KEY);
    if (rawSettlements) {
      const settlements = JSON.parse(rawSettlements);
      if (Array.isArray(settlements)) {
        settlements.forEach((s: any) => {
          if (s.countedCash != null) {
            // Convert date to DD-MM-YYYY format for consistent display
            let dateStr = s.date || "25-11-2026";
            const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (m && m[1] && m[2] && m[3]) {
              dateStr = `${m[3].padStart(2, "0")}-${m[2].padStart(2, "0")}-${m[1]}`;
            }

            const key = `${dateStr}_${s.vehicleNumber}`;
            const existing = recordsMap.get(key);
            recordsMap.set(key, {
              id: existing?.id || `DEN-${s.sl || Date.now()}`,
              date: dateStr,
              vehicleNo: s.vehicleNumber,
              driverName: s.driverName || "Driver",
              ordersCount: s.noOfOrders || 0,
              netSales: s.netAmt || s.invoiceAmt || 0,
              qrAmount: s.qrPayment || 0,
              cashAmount: s.countedCash || 0,
              diff: (s.countedCash + (s.qrPayment || 0)) - (s.netAmt || 0),
              counts: existing?.counts || {
                n500: s.denominations?.["500"] || 0,
                n200: s.denominations?.["200"] || 0,
                n100: s.denominations?.["100"] || 0,
                n50: s.denominations?.["50"] || 0,
                n20: s.denominations?.["20"] || 0,
                n10: s.denominations?.["10"] || 0,
                coins: s.denominations?.["1"] || 0,
              },
              settledBy: s.enteredBy || 'Vijaykumar Shantagiri',
              settledAt: existing?.settledAt || `${dateStr} 05:00 PM`,
              notes: s.remarks,
              status: 'settled',
            });
          }
        });
      }
    }

    if (recordsMap.size > 0) {
      return Array.from(recordsMap.values());
    }

    return INITIAL_DENOMINATIONS;
  } catch {
    return INITIAL_DENOMINATIONS;
  }
}

export function saveStoredDenominations(records: VehicleDenominationRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save denominations', e);
  }
}
