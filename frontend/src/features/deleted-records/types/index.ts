export type DeletedEntityType = 'order' | 'sku' | 'customer' | 'trip' | 'expense' | 'audit';

export interface DeletedRecord {
  id: string;
  originalId: string | number;
  entityType: DeletedEntityType;
  title: string;
  identifier: string; // e.g. ORD-1420, EMP-0004, SKU-552
  details: string;
  amount?: number;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
  rawData?: Record<string, any>;
  status: 'deleted' | 'restored';
  restoredAt?: string;
  restoredBy?: string;
}
