export interface SuperAuditItem {
  skuId: number | string;
  skuName: string;
  category: string;
  unit: string;
  grnCost: number;
  bookStock: number;
  physicalStock: number | null; // null if uncounted
  varianceQty: number; // physicalStock - bookStock
  varianceValue: number; // varianceQty * grnCost
  notes?: string;
  countedAt?: string;
}

export interface ApprovedSuperAuditReport {
  id: string;
  auditDate: string;
  auditorName: string;
  totalSkusCounted: number;
  matchingSkus: number;
  shortageSkus: number;
  surplusSkus: number;
  netVarianceQty: number;
  netVarianceValue: number;
  status: 'approved';
  approvedAt: string;
}
