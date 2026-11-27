import { DeletedRecord } from '../types';

export const INITIAL_DELETED_RECORDS: DeletedRecord[] = [];

const STORAGE_KEY = 'erp_deleted_records_vault_v2';

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
