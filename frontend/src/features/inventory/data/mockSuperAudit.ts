import { SuperAuditItem, ApprovedSuperAuditReport } from '../types/superAudit';
import { PNL_SKUS } from '@/features/pnl/data/mockPnlData';

export function getInitialSuperAuditItems(): SuperAuditItem[] {
  return PNL_SKUS.slice(0, 40).map((s) => {
    const bookStock = s.stock ?? 25;
    // Pre-populate some as counted to match realistic warehouse audit
    const physicalStock = bookStock;
    return {
      skuId: s.id,
      skuName: s.name,
      category: s.cat || 'General FMCG',
      unit: s.uom || 'Unit',
      grnCost: s.cost || 50,
      bookStock,
      physicalStock,
      varianceQty: 0,
      varianceValue: 0,
    };
  });
}

export const INITIAL_SUPER_AUDIT_HISTORY: ApprovedSuperAuditReport[] = [
  {
    id: 'SUP-AUD-2026-11-20',
    auditDate: '20-11-2026',
    auditorName: 'Vijaykumar Shantagiri (Owner)',
    totalSkusCounted: 40,
    matchingSkus: 37,
    shortageSkus: 2,
    surplusSkus: 1,
    netVarianceQty: -3,
    netVarianceValue: -420,
    status: 'approved',
    approvedAt: '20-11-2026 09:30 PM',
  },
  {
    id: 'SUP-AUD-2026-10-31',
    auditDate: '31-10-2026',
    auditorName: 'Vijaykumar Shantagiri (Owner)',
    totalSkusCounted: 38,
    matchingSkus: 35,
    shortageSkus: 3,
    surplusSkus: 0,
    netVarianceQty: -5,
    netVarianceValue: -680,
    status: 'approved',
    approvedAt: '31-10-2026 08:45 PM',
  },
];

const AUDIT_STORAGE_KEY = 'erp_super_stock_audit_live';
const HISTORY_STORAGE_KEY = 'erp_super_stock_audit_history';

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
