export interface StockSplitRecord {
  id: string | number;
  date: string;
  dcName: string;
  parentSkuId: number | string;
  parentSkuNo: string;
  parentItemName: string;
  parentCategory?: string;
  parentGrnPrice: number;
  splitQty: number; // e.g. 1 (bag)
  childSkuId: number | string;
  childSkuNo: string;
  childItemName: string;
  childCategory?: string;
  convertedQty: number; // e.g. 30 (packets)
  splitGrnPrice: number; // Unit cost for child = (splitQty * parentGrnPrice) / convertedQty
  shrinkageQty?: number;
  operatorName: string;
  notes?: string;
  createdAt?: string;
}

export interface SplitSkuOption {
  id: number | string;
  skuNo: string;
  name: string;
  category: string;
  stock: number;
  cost: number;
  price: number;
  hsn?: string;
  gst?: number;
  uom?: string;
}
