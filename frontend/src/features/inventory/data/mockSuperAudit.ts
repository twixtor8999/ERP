import { SuperAuditItem, ApprovedSuperAuditReport } from '../types/superAudit';
import { getStoredSkus } from './mockInventory';
import { computeLiveRealtimeSkus } from '../utils/liveInventory';
import { getIstDateString } from '@/lib/utilities/istTime';

export function getInitialSuperAuditItems(): SuperAuditItem[] {
  const todayIso = getIstDateString();
  const liveSkus = computeLiveRealtimeSkus(getStoredSkus(), todayIso);
  return liveSkus.map((s) => ({
    skuId: s.id,
    skuName: s.name,
    category: s.category || 'General FMCG',
    unit: 'Unit',
    grnCost: s.cost || 0,
    bookStock: s.closing,
    physicalStock: s.closing,
    varianceQty: 0,
    varianceValue: 0,
  }));
}

export const INITIAL_SUPER_AUDIT_HISTORY: ApprovedSuperAuditReport[] = [];

const AUDIT_STORAGE_KEY = 'erp_super_stock_audit_live_v2';
const HISTORY_STORAGE_KEY = 'erp_super_stock_audit_history_v2';

export function getStoredSuperAuditItems(): SuperAuditItem[] {
  if (typeof window === 'undefined') return getInitialSuperAuditItems();
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      const init = getInitialSuperAuditItems();
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getInitialSuperAuditItems();
  } catch {
    return getInitialSuperAuditItems();
  }
}

export function saveStoredSuperAuditItems(items: SuperAuditItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save super audit items', e);
  }
}

export function getStoredSuperAuditHistory(): ApprovedSuperAuditReport[] {
  if (typeof window === 'undefined') return INITIAL_SUPER_AUDIT_HISTORY;
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_SUPER_AUDIT_HISTORY));
      return INITIAL_SUPER_AUDIT_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SUPER_AUDIT_HISTORY;
  } catch {
    return INITIAL_SUPER_AUDIT_HISTORY;
  }
}

export function saveStoredSuperAuditHistory(history: ApprovedSuperAuditReport[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save audit history', e);
  }
}
