import { StockSplitRecord } from '../types';
export type { StockSplitRecord };
import {
  getStoredStockSplits as getInventoryStockSplits,
  saveStoredStockSplits as saveInventoryStockSplits,
  type StockSplitRecord as InventoryStockSplitRecord,
} from '@/features/inventory/data/mockStockSplit';
import { getStoredSkus } from '@/features/inventory/data/mockInventory';

function mapInventorySplitToViewRecord(sp: InventoryStockSplitRecord): StockSplitRecord {
  const skus = getStoredSkus();
  const parentSku = skus.find((s) => s.id === sp.s);
  const firstConv = sp.conv?.[0];
  const childSku = firstConv ? skus.find((s) => s.id === firstConv.s) : undefined;
  const totalConvQty = (sp.conv || []).reduce((acc, c) => acc + (Number(c.q) || 0), 0);

  return {
    id: sp.id,
    date: sp.date,
    dcName: sp.dc || 'SIDDESHWAR ENTERPRISES',
    parentSkuId: sp.s,
    parentSkuNo: parentSku?.code || String(sp.s),
    parentItemName: sp.name,
    parentCategory: parentSku?.category || 'General',
    parentGrnPrice: Number(sp.grn) || 0,
    splitQty: Number(sp.out) || 0,
    childSkuId: firstConv?.s ?? '',
    childSkuNo: childSku?.code || (firstConv ? String(firstConv.s) : ''),
    childItemName: (sp.conv || []).map((c) => c.name).join(', ') || 'Converted Item',
    childCategory: childSku?.category || 'General',
    convertedQty: totalConvQty,
    splitGrnPrice: Number(firstConv?.p) || 0,
    shrinkageQty: sp.shr ? Number(sp.shr.q) || 0 : 0,
    operatorName: sp.by || 'Staff',
    notes: sp.shr
      ? `Split ${sp.out}x ${sp.name} (shrinkage: ${sp.shr.q})`
      : `Split ${sp.out}x ${sp.name} → ${totalConvQty}x ${(sp.conv || []).map((c) => c.name).join(', ')}`,
    createdAt: sp.at,
  };
}

export function getStoredStockSplits(): StockSplitRecord[] {
  return getInventoryStockSplits().map(mapInventorySplitToViewRecord);
}

export function saveStoredStockSplit(record: StockSplitRecord): StockSplitRecord[] {
  const current = getInventoryStockSplits();
  const invRecord: InventoryStockSplitRecord = {
    id: String(record.id),
    date: record.date,
    at: record.createdAt || new Date().toISOString(),
    dc: record.dcName || 'SIDDESHWAR ENTERPRISES',
    s: Number(record.parentSkuId),
    name: record.parentItemName,
    out: Number(record.splitQty) || 0,
    grn: Number(record.parentGrnPrice) || 0,
    conv: [
      {
        s: Number(record.childSkuId),
        name: record.childItemName,
        q: Number(record.convertedQty) || 0,
        p: Number(record.splitGrnPrice) || 0,
      },
    ],
    shr:
      record.shrinkageQty && record.shrinkageQty > 0
        ? {
            s: Number(record.parentSkuId),
            name: record.parentItemName,
            q: Number(record.shrinkageQty),
            p: Number(record.parentGrnPrice) || 0,
          }
        : null,
    diffKg: null,
    by: record.operatorName || 'Admin',
    role: 'Admin',
  };

  const updated = [invRecord, ...current];
  saveInventoryStockSplits(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('inventory_updated'));
    window.dispatchEvent(new Event('storage'));
  }
  return updated.map(mapInventorySplitToViewRecord);
}
