import { DeletedRecord } from '../types';

export const INITIAL_DELETED_RECORDS: DeletedRecord[] = [
  {
    id: 'DEL-1795501',
    originalId: 'ord-1490',
    entityType: 'order',
    title: 'Anand Stores · Tikota · 4 Bags Atta',
    identifier: 'ORD-1490',
    details: 'Order value ₹3,200. Cancelled due to duplicate CRM entry on route TIKOTA.',
    amount: 3200,
    deletedAt: '24-11-2026 04:30 PM',
    deletedBy: 'Vijaykumar Shantagiri',
    reason: 'Duplicate phone booking',
    status: 'deleted',
  },
  {
    id: 'DEL-1795502',
    originalId: '1792862514829999',
    entityType: 'sku',
    title: 'Discontinued Brand Tea Powder 250g',
    identifier: 'SKU-0842',
    details: 'Beverages category · Discontinued vendor SKU · Zero remaining stock.',
    amount: 0,
    deletedAt: '23-11-2026 11:15 AM',
    deletedBy: 'Vijaykumar Shantagiri',
    reason: 'Vendor discontinued distribution',
    status: 'deleted',
  },
  {
    id: 'DEL-1795503',
    originalId: 'cust-9921',
    entityType: 'customer',
    title: 'Girish Kirani General - Girish M',
    identifier: '9845112233',
    details: 'Village: Golasangi · Route: GOLASANGI · Shop permanently closed.',
    amount: 0,
    deletedAt: '21-11-2026 02:20 PM',
    deletedBy: 'Vijaykumar Shantagiri',
    reason: 'Shop permanently closed',
    status: 'deleted',
  },
  {
    id: 'DEL-1795504',
    originalId: 'trip-440',
    entityType: 'trip',
    title: 'KA28AB3425 · Devar Hippargi · Test Route Run',
    identifier: 'TRIP-440',
    details: '0 delivered orders · Erroneous trip logged during driver training.',
    amount: 150,
    deletedAt: '20-11-2026 06:10 PM',
    deletedBy: 'Vijaykumar Shantagiri',
    reason: 'Driver training test run',
    status: 'deleted',
  },
  {
    id: 'DEL-1795505',
    originalId: 'exp-981',
    entityType: 'expense',
    title: 'Duplicate Toll Booth Receipt ₹80',
    identifier: 'EXP-981',
    details: 'Toll fee on Almatti route entered twice by assistant cashier.',
    amount: 80,
    deletedAt: '19-11-2026 08:00 PM',
    deletedBy: 'Pushpa Patil',
    reason: 'Double voucher entered',
    status: 'deleted',
  },
];

const STORAGE_KEY = 'erp_deleted_records_vault';

export function getStoredDeletedRecords(): DeletedRecord[] {
  if (typeof window === 'undefined') return INITIAL_DELETED_RECORDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DELETED_RECORDS));
      return INITIAL_DELETED_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DELETED_RECORDS;
  } catch {
    return INITIAL_DELETED_RECORDS;
  }
}

export function saveStoredDeletedRecords(records: DeletedRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save deleted records', e);
  }
}

export function addDeletedRecord(
  entityType: DeletedRecord['entityType'],
  originalId: string | number,
  title: string,
  identifier: string,
  details: string,
  amount: number = 0,
  reason: string = 'User requested delete'
): void {
  const current = getStoredDeletedRecords();
  const d = new Date();
  const dStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const newRec: DeletedRecord = {
    id: `DEL-${Date.now().toString().slice(-7)}`,
    originalId,
    entityType,
    title,
    identifier,
    details,
    amount,
    deletedAt: dStr,
    deletedBy: 'Vijaykumar Shantagiri',
    reason,
    status: 'deleted',
  };
  saveStoredDeletedRecords([newRec, ...current]);
}
