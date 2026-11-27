import { getAllMergedPnlOrders } from '@/features/pnl/data/pnlEngine';
import { PNL_SKUS } from '@/features/pnl/data/mockPnlData';
import { getStoredCustomers } from '@/features/customers/data/mockCustomers';
import {
  getStoredPurchases,
  getStoredVendors,
  getStoredDebitNotes,
  type PurchaseRecord,
  type VendorRecord,
  type DebitNoteRecord,
} from '@/features/purchases/data/mockPurchases';
import { getStoredExpenses } from '@/features/expenses/data/mockExpenses';
import { getStoredSkuProducts } from '@/features/products/data/mockProducts';
import { getStoredHsnCodes } from '@/features/hsn-gst/data/mockHsnData';
import { getStoredStockSplits } from '@/features/stock-split/data/mockStockSplits';

export interface GstReturnSummary {
  period: string;
  dueDate: string;
  kpis: { label: string; value: string | number }[];
  note?: string;
}

export interface RegisterRow {
  [key: string]: any;
}

export interface RegisterConfig {
  id: string;
  title: string;
  subtitle: string;
  columns: string[];
  moneyCols?: number[];
  kpis?: { label: string; value: string | number }[];
  defaultRowCountLabel?: string;
}

export interface BackupSalesReturn {
  id: number | string;
  date: string;
  orderNo: string;
  invoiceNo: string;
  customerName: string;
  gstin: string;
  skuId: number | string;
  itemName: string;
  returnQty: number;
  returnAmount: number;
  reason: string;
}

export const BACKUP_SALES_RETURNS: BackupSalesReturn[] = [
  {
    "id": 1795277257506136,
    "date": "2026-11-21",
    "orderNo": "ORD-1484",
    "invoiceNo": "INV-452",
    "customerName": "Balaji Kirana Store",
    "gstin": "URP",
    "skuId": 1792862514829293,
    "itemName": "Sugar S-30 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 2760,
    "reason": "Customer Cancel"
  },
  {
    "id": 1795277243519136,
    "date": "2026-11-21",
    "orderNo": "ORD-1474",
    "invoiceNo": "INV-447",
    "customerName": "Mahalaxmi kirani store",
    "gstin": "URP",
    "skuId": 1794579615417490,
    "itemName": "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )",
    "returnQty": 24,
    "returnAmount": 192,
    "reason": "Shop Close"
  },
  {
    "id": 1795277243520136,
    "date": "2026-11-21",
    "orderNo": "ORD-1474",
    "invoiceNo": "INV-447",
    "customerName": "Mahalaxmi kirani store",
    "gstin": "URP",
    "skuId": 1792862514915293,
    "itemName": "Vilmaa Femiluv Dry Pads - XL 280mm 1Pcs Pkt",
    "returnQty": 12,
    "returnAmount": 300,
    "reason": "Shop Close"
  },
  {
    "id": 1795277243521136,
    "date": "2026-11-21",
    "orderNo": "ORD-1474",
    "invoiceNo": "INV-447",
    "customerName": "Mahalaxmi kirani store",
    "gstin": "URP",
    "skuId": 1792862514917293,
    "itemName": "Vilmaa Femiluv Soft Pads - XL 280mm 1Pcs Pkt",
    "returnQty": 1,
    "returnAmount": 25,
    "reason": "Shop Close"
  },
  {
    "id": 1795275066981136,
    "date": "2026-11-21",
    "orderNo": "ORD-1472",
    "invoiceNo": "INV-460",
    "customerName": "Mallikarjun kirani store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1590,
    "reason": "Item Missing"
  },
  {
    "id": 1795275066982136,
    "date": "2026-11-21",
    "orderNo": "ORD-1472",
    "invoiceNo": "INV-460",
    "customerName": "Mallikarjun kirani store",
    "gstin": "URP",
    "skuId": 1792862514832293,
    "itemName": "Raag Gold Palm Oil 1Ltr 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1400,
    "reason": "Item Missing"
  },
  {
    "id": 1795275066983136,
    "date": "2026-11-21",
    "orderNo": "ORD-1472",
    "invoiceNo": "INV-460",
    "customerName": "Mallikarjun kirani store",
    "gstin": "URP",
    "skuId": 1793211755070131,
    "itemName": "Gajaraj Kesar Sooji 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 1300,
    "reason": "Item Missing"
  },
  {
    "id": 1795275051156136,
    "date": "2026-11-21",
    "orderNo": "ORD-1475",
    "invoiceNo": "INV-461",
    "customerName": "Vinod mushekhan",
    "gstin": "URP",
    "skuId": 1793211755075131,
    "itemName": "Sooji 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 410,
    "reason": "Shop Close"
  },
  {
    "id": 1795275051157136,
    "date": "2026-11-21",
    "orderNo": "ORD-1475",
    "invoiceNo": "INV-461",
    "customerName": "Vinod mushekhan",
    "gstin": "URP",
    "skuId": 1792862514829293,
    "itemName": "Sugar S-30 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 2760,
    "reason": "Shop Close"
  },
  {
    "id": 1795275029161136,
    "date": "2026-11-21",
    "orderNo": "ORD-1479",
    "invoiceNo": "INV-468",
    "customerName": "THANARAM PATEL",
    "gstin": "URP",
    "skuId": 1795088768153071,
    "itemName": "Zeeba Steam Rice 26kg Bag",
    "returnQty": 1,
    "returnAmount": 2050,
    "reason": "Customer Cancel"
  },
  {
    "id": 1795274473752136,
    "date": "2026-11-21",
    "orderNo": "ORD-1470",
    "invoiceNo": "INV-463",
    "customerName": "Bidari kirana store",
    "gstin": "URP",
    "skuId": 1794579615417490,
    "itemName": "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )",
    "returnQty": 12,
    "returnAmount": 96,
    "reason": "Item Missing"
  },
  {
    "id": 1795274473753136,
    "date": "2026-11-21",
    "orderNo": "ORD-1470",
    "invoiceNo": "INV-463",
    "customerName": "Bidari kirana store",
    "gstin": "URP",
    "skuId": 1794579826208490,
    "itemName": "BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )",
    "returnQty": 12,
    "returnAmount": 120,
    "reason": "Item Missing"
  },
  {
    "id": 1795274443256136,
    "date": "2026-11-21",
    "orderNo": "ORD-1475",
    "invoiceNo": "INV-458",
    "customerName": "Somlegshwar kirani Store",
    "gstin": "URP",
    "skuId": 1794579615417490,
    "itemName": "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )",
    "returnQty": 2,
    "returnAmount": 16,
    "reason": "Item Missing"
  },
  {
    "id": 1795274372128136,
    "date": "2026-11-21",
    "orderNo": "ORD-1469",
    "invoiceNo": "INV-442",
    "customerName": "Babulal kirani store",
    "gstin": "URP",
    "skuId": 1794579826208490,
    "itemName": "BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )",
    "returnQty": 2,
    "returnAmount": 20,
    "reason": "Item Missing"
  },
  {
    "id": 1795274372129136,
    "date": "2026-11-21",
    "orderNo": "ORD-1469",
    "invoiceNo": "INV-442",
    "customerName": "Babulal kirani store",
    "gstin": "URP",
    "skuId": 1794637089256136,
    "itemName": "BUMTUM BABY DIAPER 46RS (S5 3-8 KG 5 PANS PKT )",
    "returnQty": 2,
    "returnAmount": 76,
    "reason": "Item Missing"
  },
  {
    "id": 1795274372130136,
    "date": "2026-11-21",
    "orderNo": "ORD-1469",
    "invoiceNo": "INV-442",
    "customerName": "Babulal kirani store",
    "gstin": "URP",
    "skuId": 1794580153480490,
    "itemName": "BUMTUM BABY DIAPER 18RS ( NB2 2-5 KG 2 PANS PKT )",
    "returnQty": 2,
    "returnAmount": 32,
    "reason": "Item Missing"
  },
  {
    "id": 1795274286944136,
    "date": "2026-11-21",
    "orderNo": "ORD-1490",
    "invoiceNo": "INV-450",
    "customerName": "Hiremath kirana store",
    "gstin": "URP",
    "skuId": 1792862514825293,
    "itemName": "Powder Salt 1Kg 25Pcs Bag",
    "returnQty": 4,
    "returnAmount": 880,
    "reason": "Quality issue / Damage"
  },
  {
    "id": 1795274270353136,
    "date": "2026-11-21",
    "orderNo": "ORD-1483",
    "invoiceNo": "INV-454",
    "customerName": "Laxmi Kirani Store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1590,
    "reason": "No Cash"
  },
  {
    "id": 1795274270354136,
    "date": "2026-11-21",
    "orderNo": "ORD-1483",
    "invoiceNo": "INV-454",
    "customerName": "Laxmi Kirani Store",
    "gstin": "URP",
    "skuId": 1792862514845293,
    "itemName": "VST Vegetable Oil 500gm 20Pcs Box",
    "returnQty": 1,
    "returnAmount": 1600,
    "reason": "No Cash"
  },
  {
    "id": 1795274270355136,
    "date": "2026-11-21",
    "orderNo": "ORD-1483",
    "invoiceNo": "INV-454",
    "customerName": "Laxmi Kirani Store",
    "gstin": "URP",
    "skuId": 1795088768153071,
    "itemName": "Zeeba Steam Rice 26kg Bag",
    "returnQty": 1,
    "returnAmount": 2050,
    "reason": "No Cash"
  },
  {
    "id": 1795274201608136,
    "date": "2026-11-21",
    "orderNo": "ORD-1476",
    "invoiceNo": "INV-455",
    "customerName": "Pundalika Amble kirani store",
    "gstin": "URP",
    "skuId": 1794637903280136,
    "itemName": "BUMTUM BABY DIAPER 10 RS (S2 4-8KG 2PANS PKT)",
    "returnQty": 24,
    "returnAmount": 384,
    "reason": "Item Missing"
  },
  {
    "id": 1795274187089136,
    "date": "2026-11-21",
    "orderNo": "ORD-1473",
    "invoiceNo": "INV-459",
    "customerName": "Basaveswar kirani store",
    "gstin": "URP",
    "skuId": 1794579615417490,
    "itemName": "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )",
    "returnQty": 12,
    "returnAmount": 96,
    "reason": "Shop Close"
  },
  {
    "id": 1795274187090136,
    "date": "2026-11-21",
    "orderNo": "ORD-1473",
    "invoiceNo": "INV-459",
    "customerName": "Basaveswar kirani store",
    "gstin": "URP",
    "skuId": 1792862514829293,
    "itemName": "Sugar S-30 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 2760,
    "reason": "Shop Close"
  },
  {
    "id": 1795274166537136,
    "date": "2026-11-21",
    "orderNo": "ORD-1488",
    "invoiceNo": "INV-462",
    "customerName": "Mallikarjun kirani store",
    "gstin": "URP",
    "skuId": 1792862514829293,
    "itemName": "Sugar S-30 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 2760,
    "reason": "No Cash"
  },
  {
    "id": 1795274147649136,
    "date": "2026-11-21",
    "orderNo": "ORD-1483",
    "invoiceNo": "INV-444",
    "customerName": "Asafk kirani store",
    "gstin": "URP",
    "skuId": 1792862514829293,
    "itemName": "Sugar S-30 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 2760,
    "reason": "Shop Close"
  },
  {
    "id": 1795274147650136,
    "date": "2026-11-21",
    "orderNo": "ORD-1483",
    "invoiceNo": "INV-444",
    "customerName": "Asafk kirani store",
    "gstin": "URP",
    "skuId": 1793211755076131,
    "itemName": "Sooji 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 1270,
    "reason": "Shop Close"
  },
  {
    "id": 1795274131720136,
    "date": "2026-11-21",
    "orderNo": "ORD-1486",
    "invoiceNo": "INV-451",
    "customerName": "Bhavani hotel",
    "gstin": "URP",
    "skuId": 1795088768153071,
    "itemName": "Zeeba Steam Rice 26kg Bag",
    "returnQty": 1,
    "returnAmount": 2050,
    "reason": "Customer Cancel"
  },
  {
    "id": 1795274115409136,
    "date": "2026-11-21",
    "orderNo": "ORD-1478",
    "invoiceNo": "INV-456",
    "customerName": "Umesh naralay kirani store",
    "gstin": "URP",
    "skuId": 1792862514832293,
    "itemName": "Raag Gold Palm Oil 1Ltr 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1400,
    "reason": "Customer Cancel"
  },
  {
    "id": 1795191420357136,
    "date": "2026-11-20",
    "orderNo": "ORD-1467",
    "invoiceNo": "INV-435",
    "customerName": "Praveen kirani store",
    "gstin": "URP",
    "skuId": 1795088768153071,
    "itemName": "Zeeba Steam Rice 26kg Bag",
    "returnQty": 1,
    "returnAmount": 2050,
    "reason": "Item Missing"
  },
  {
    "id": 1795189386458136,
    "date": "2026-11-20",
    "orderNo": "ORD-1439",
    "invoiceNo": "INV-399",
    "customerName": "Suprit kirani",
    "gstin": "URP",
    "skuId": 1792862514882293,
    "itemName": "Glim Dishwash Soap 10Rs 60Pcs Box",
    "returnQty": 1,
    "returnAmount": 510,
    "reason": "Item Missing"
  },
  {
    "id": 1795189373074136,
    "date": "2026-11-20",
    "orderNo": "ORD-1430",
    "invoiceNo": "INV-414",
    "customerName": "Gangadhar General Store",
    "gstin": "URP",
    "skuId": 1792862514882293,
    "itemName": "Glim Dishwash Soap 10Rs 60Pcs Box",
    "returnQty": 2,
    "returnAmount": 1020,
    "reason": "Item Missing"
  },
  {
    "id": 1795189045826136,
    "date": "2026-11-20",
    "orderNo": "ORD-1426",
    "invoiceNo": "INV-398",
    "customerName": "C B M Traders",
    "gstin": "URP",
    "skuId": 1792862514832293,
    "itemName": "Raag Gold Palm Oil 1Ltr 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1400,
    "reason": "Customer Cancel"
  },
  {
    "id": 1795189010826136,
    "date": "2026-11-20",
    "orderNo": "ORD-1441",
    "invoiceNo": "INV-406",
    "customerName": "Mallikarjun kirani store",
    "gstin": "URP",
    "skuId": 1792862514821293,
    "itemName": "Crystal Salt 1Kg 25Pcs Bag",
    "returnQty": 1,
    "returnAmount": 210,
    "reason": "Customer Cancel"
  },
  {
    "id": 1793978250800154,
    "date": "2026-11-06",
    "orderNo": "ORD-1045",
    "invoiceNo": "INV-53",
    "customerName": "Santosh kirani stor",
    "gstin": "URP",
    "skuId": 1793708242898557,
    "itemName": "SUN ROYAL 750 GM SUNFLOWER OIL BOX",
    "returnQty": 1,
    "returnAmount": 1470,
    "reason": "Shop Close"
  },
  {
    "id": 1793978276336154,
    "date": "2026-11-06",
    "orderNo": "ORD-1046",
    "invoiceNo": "INV-43",
    "customerName": "Shree. Sadguru",
    "gstin": "URP",
    "skuId": 1793211755075131,
    "itemName": "Sooji 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 410,
    "reason": "Item Missing"
  },
  {
    "id": 1793978276337154,
    "date": "2026-11-06",
    "orderNo": "ORD-1046",
    "invoiceNo": "INV-43",
    "customerName": "Shree. Sadguru",
    "gstin": "URP",
    "skuId": 1792862514741293,
    "itemName": "Maida 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 380,
    "reason": "Item Missing"
  },
  {
    "id": 1793978295160154,
    "date": "2026-11-06",
    "orderNo": "ORD-1063",
    "invoiceNo": "INV-51",
    "customerName": "Veerbhadreshwar Hotel",
    "gstin": "URP",
    "skuId": 1792862514748293,
    "itemName": "Namasthe Gram Flour 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 3500,
    "reason": "Fake Order"
  },
  {
    "id": 1793978330820154,
    "date": "2026-11-06",
    "orderNo": "ORD-1068",
    "invoiceNo": "INV-55",
    "customerName": "Husenasab kiran shop",
    "gstin": "URP",
    "skuId": 1793211755069131,
    "itemName": "Gajaraj Kesar Sooji 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 430,
    "reason": "Item Missing"
  },
  {
    "id": 1793978330821154,
    "date": "2026-11-06",
    "orderNo": "ORD-1068",
    "invoiceNo": "INV-55",
    "customerName": "Husenasab kiran shop",
    "gstin": "URP",
    "skuId": 1792862514741293,
    "itemName": "Maida 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 380,
    "reason": "Item Missing"
  },
  {
    "id": 1793978365376154,
    "date": "2026-11-06",
    "orderNo": "ORD-1041",
    "invoiceNo": "INV-65",
    "customerName": "Jagirdar Kirana Store",
    "gstin": "URP",
    "skuId": 1793688416313557,
    "itemName": "Jasmine Rice 30 kg Bag",
    "returnQty": 1,
    "returnAmount": 2800,
    "reason": "Shop Close"
  },
  {
    "id": 1793978383319154,
    "date": "2026-11-06",
    "orderNo": "ORD-1054",
    "invoiceNo": "INV-57",
    "customerName": "Gurubasav kirani store",
    "gstin": "URP",
    "skuId": 1792862514855293,
    "itemName": "Daawat Rice 26Kg Bag",
    "returnQty": 2,
    "returnAmount": 4940,
    "reason": "No Cash"
  },
  {
    "id": 1793978400935154,
    "date": "2026-11-06",
    "orderNo": "ORD-1067",
    "invoiceNo": "INV-67",
    "customerName": "Sauobgya kirana Store",
    "gstin": "URP",
    "skuId": 1793211755091131,
    "itemName": "Gram Dal Fine 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 2860,
    "reason": "Item Missing"
  },
  {
    "id": 1793979069742154,
    "date": "2026-11-06",
    "orderNo": "ORD-1064",
    "invoiceNo": "INV-68",
    "customerName": "V S  Kuchabala kirani Shop",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 2,
    "returnAmount": 3300,
    "reason": "No Cash"
  },
  {
    "id": 1795009297910136,
    "date": "2026-11-18",
    "orderNo": "ORD-1374",
    "invoiceNo": "INV-347",
    "customerName": "Ganagaram kirana store",
    "gstin": "URP",
    "skuId": 1792862514917293,
    "itemName": "Vilmaa Femiluv Soft Pads - XL 280mm 1Pcs Pkt",
    "returnQty": 3,
    "returnAmount": 75,
    "reason": "Shop Close"
  },
  {
    "id": 1795009297911136,
    "date": "2026-11-18",
    "orderNo": "ORD-1374",
    "invoiceNo": "INV-347",
    "customerName": "Ganagaram kirana store",
    "gstin": "URP",
    "skuId": 1792862514915293,
    "itemName": "Vilmaa Femiluv Dry Pads - XL 280mm 1Pcs Pkt",
    "returnQty": 3,
    "returnAmount": 75,
    "reason": "Shop Close"
  },
  {
    "id": 1795009297912136,
    "date": "2026-11-18",
    "orderNo": "ORD-1374",
    "invoiceNo": "INV-347",
    "customerName": "Ganagaram kirana store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1610,
    "reason": "Shop Close"
  },
  {
    "id": 1795009274141136,
    "date": "2026-11-18",
    "orderNo": "ORD-1377",
    "invoiceNo": "INV-362",
    "customerName": "Somlegshwar kirani Store",
    "gstin": "URP",
    "skuId": 1792862514915293,
    "itemName": "Vilmaa Femiluv Dry Pads - XL 280mm 1Pcs Pkt",
    "returnQty": 12,
    "returnAmount": 300,
    "reason": "Item Missing"
  },
  {
    "id": 1795009274142136,
    "date": "2026-11-18",
    "orderNo": "ORD-1377",
    "invoiceNo": "INV-362",
    "customerName": "Somlegshwar kirani Store",
    "gstin": "URP",
    "skuId": 1792862514917293,
    "itemName": "Vilmaa Femiluv Soft Pads - XL 280mm 1Pcs Pkt",
    "returnQty": 12,
    "returnAmount": 300,
    "reason": "Item Missing"
  },
  {
    "id": 1795009274143136,
    "date": "2026-11-18",
    "orderNo": "ORD-1377",
    "invoiceNo": "INV-362",
    "customerName": "Somlegshwar kirani Store",
    "gstin": "URP",
    "skuId": 1792862514908293,
    "itemName": "Sunsilk Shampoo 1Rs 64pcs (4 Sheet Pkt)",
    "returnQty": 2,
    "returnAmount": 104,
    "reason": "Item Missing"
  },
  {
    "id": 1795009248037136,
    "date": "2026-11-18",
    "orderNo": "ORD-1372",
    "invoiceNo": "INV-365",
    "customerName": "Dhangi kirana",
    "gstin": "URP",
    "skuId": 1792862514821293,
    "itemName": "Crystal Salt 1Kg 25Pcs Bag",
    "returnQty": 2,
    "returnAmount": 420,
    "reason": "Customer Cancel"
  },
  {
    "id": 1795009248038136,
    "date": "2026-11-18",
    "orderNo": "ORD-1372",
    "invoiceNo": "INV-365",
    "customerName": "Dhangi kirana",
    "gstin": "URP",
    "skuId": 1792862514825293,
    "itemName": "Powder Salt 1Kg 25Pcs Bag",
    "returnQty": 2,
    "returnAmount": 440,
    "reason": "Customer Cancel"
  },
  {
    "id": 1795004951459136,
    "date": "2026-11-18",
    "orderNo": "ORD-1353",
    "invoiceNo": "INV-342",
    "customerName": "Anukarana kirani store",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Item Missing"
  },
  {
    "id": 1795004886075136,
    "date": "2026-11-18",
    "orderNo": "ORD-1360",
    "invoiceNo": "INV-333",
    "customerName": "Telagi",
    "gstin": "URP",
    "skuId": 1793211755087131,
    "itemName": "Fried Gram Fine 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 3220,
    "reason": "No Cash"
  },
  {
    "id": 1794928567187934,
    "date": "2026-11-17",
    "orderNo": "ORD-1382",
    "invoiceNo": "INV-322",
    "customerName": "Kadshiddeswara kirani store",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 14,
    "returnAmount": 5600,
    "reason": "Fake Order"
  },
  {
    "id": 1794922991786136,
    "date": "2026-11-17",
    "orderNo": "ORD-1329",
    "invoiceNo": "INV-310",
    "customerName": "Ayisha kirani store",
    "gstin": "URP",
    "skuId": 1792862514801293,
    "itemName": "Trulove Chocolate Kreme 5Rs 144Pcs Box",
    "returnQty": 1,
    "returnAmount": 520,
    "reason": "Item Missing"
  },
  {
    "id": 1794922957035136,
    "date": "2026-11-17",
    "orderNo": "ORD-1335",
    "invoiceNo": "INV-314",
    "customerName": "Devu",
    "gstin": "URP",
    "skuId": 1792862514821293,
    "itemName": "Crystal Salt 1Kg 25Pcs Bag",
    "returnQty": 2,
    "returnAmount": 420,
    "reason": "Shop Close"
  },
  {
    "id": 1794922957036136,
    "date": "2026-11-17",
    "orderNo": "ORD-1335",
    "invoiceNo": "INV-314",
    "customerName": "Devu",
    "gstin": "URP",
    "skuId": 1793211755113131,
    "itemName": "Urad Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1280,
    "reason": "Shop Close"
  },
  {
    "id": 1794922941699136,
    "date": "2026-11-17",
    "orderNo": "ORD-1324",
    "invoiceNo": "INV-302",
    "customerName": "Hiremath Kirana Store",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Item Missing"
  },
  {
    "id": 1794922909835136,
    "date": "2026-11-17",
    "orderNo": "ORD-1326",
    "invoiceNo": "INV-294",
    "customerName": "Mallikarjun kirana store",
    "gstin": "URP",
    "skuId": 1792862514845293,
    "itemName": "VST Vegetable Oil 500gm 20Pcs Box",
    "returnQty": 1,
    "returnAmount": 1620,
    "reason": "Shop Close"
  },
  {
    "id": 1794922909836136,
    "date": "2026-11-17",
    "orderNo": "ORD-1326",
    "invoiceNo": "INV-294",
    "customerName": "Mallikarjun kirana store",
    "gstin": "URP",
    "skuId": 1792862514797293,
    "itemName": "Trulove Bourbon Biscuits 5Rs 144Pcs Box",
    "returnQty": 1,
    "returnAmount": 520,
    "reason": "Shop Close"
  },
  {
    "id": 1794922909837136,
    "date": "2026-11-17",
    "orderNo": "ORD-1326",
    "invoiceNo": "INV-294",
    "customerName": "Mallikarjun kirana store",
    "gstin": "URP",
    "skuId": 1793211755113131,
    "itemName": "Urad Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1280,
    "reason": "Shop Close"
  },
  {
    "id": 1794922864930136,
    "date": "2026-11-17",
    "orderNo": "ORD-1328",
    "invoiceNo": "INV-311",
    "customerName": "Sannapagol Kirana Store",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 3,
    "returnAmount": 1860,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794922819659136,
    "date": "2026-11-17",
    "orderNo": "ORD-1351",
    "invoiceNo": "INV-279",
    "customerName": "Sangeeta",
    "gstin": "URP",
    "skuId": 1792862514841293,
    "itemName": "SVT Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1670,
    "reason": "No Cash"
  },
  {
    "id": 1794922796699136,
    "date": "2026-11-17",
    "orderNo": "ORD-1309",
    "invoiceNo": "INV-320",
    "customerName": "DANAMADEEVI KIRAN STORE",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 3,
    "returnAmount": 1860,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794922750707136,
    "date": "2026-11-17",
    "orderNo": "ORD-1314",
    "invoiceNo": "INV-293",
    "customerName": "Jagirdar Kirana Store",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794922735267136,
    "date": "2026-11-17",
    "orderNo": "ORD-1339",
    "invoiceNo": "INV-296",
    "customerName": "Makandar kirana store",
    "gstin": "URP",
    "skuId": 1792862514882293,
    "itemName": "Glim Dishwash Soap 10Rs 60Pcs Box",
    "returnQty": 1,
    "returnAmount": 510,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794922735268136,
    "date": "2026-11-17",
    "orderNo": "ORD-1339",
    "invoiceNo": "INV-296",
    "customerName": "Makandar kirana store",
    "gstin": "URP",
    "skuId": 1792862514864293,
    "itemName": "Aramane Detergent Powder 500gm 30Pcs Bag",
    "returnQty": 1,
    "returnAmount": 750,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794922654219136,
    "date": "2026-11-17",
    "orderNo": "ORD-1316",
    "invoiceNo": "INV-316",
    "customerName": "Shivanand malagan",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794922634084136,
    "date": "2026-11-17",
    "orderNo": "ORD-1315",
    "invoiceNo": "INV-317",
    "customerName": "ADILINAGESWAR KIRAN STORES",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794660679407136,
    "date": "2026-11-14",
    "orderNo": "ORD-1266",
    "invoiceNo": "INV-247",
    "customerName": "Bangalore ayyangar bekari",
    "gstin": "URP",
    "skuId": 1792862514829293,
    "itemName": "Sugar S-30 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 2850,
    "reason": "No Cash"
  },
  {
    "id": 1794660679408136,
    "date": "2026-11-14",
    "orderNo": "ORD-1266",
    "invoiceNo": "INV-247",
    "customerName": "Bangalore ayyangar bekari",
    "gstin": "URP",
    "skuId": 1792862514814293,
    "itemName": "Trulove Orange Kreme 5Rs 144Pcs Box",
    "returnQty": 1,
    "returnAmount": 520,
    "reason": "No Cash"
  },
  {
    "id": 1794498811101490,
    "date": "2026-11-12",
    "orderNo": "ORD-1216",
    "invoiceNo": "INV-196",
    "customerName": "Gogi kirani",
    "gstin": "URP",
    "skuId": 1792862514861293,
    "itemName": "Aramane Detergent Powder 10Rs 12Pcs Pkt",
    "returnQty": 1,
    "returnAmount": 106,
    "reason": "Shop Close"
  },
  {
    "id": 1794323419450490,
    "date": "2026-11-10",
    "orderNo": "ORD-1168",
    "invoiceNo": "INV-136",
    "customerName": "Shashi Kirana Stores",
    "gstin": "URP",
    "skuId": 1793688416313557,
    "itemName": "Jasmine Rice 30 kg Bag",
    "returnQty": 1,
    "returnAmount": 2800,
    "reason": "Fake Order"
  },
  {
    "id": 1794323534144490,
    "date": "2026-11-10",
    "orderNo": "ORD-1138",
    "invoiceNo": "INV-128",
    "customerName": "Dundappagouda nayakra kirani store",
    "gstin": "URP",
    "skuId": 1793211755113131,
    "itemName": "Urad Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1280,
    "reason": "Item Missing"
  },
  {
    "id": 1794323559160490,
    "date": "2026-11-10",
    "orderNo": "ORD-1114",
    "invoiceNo": "INV-134",
    "customerName": "Sadguru Sadananad kirani store",
    "gstin": "URP",
    "skuId": 1793211755075131,
    "itemName": "Sooji 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 410,
    "reason": "Item Missing"
  },
  {
    "id": 1794323669016490,
    "date": "2026-11-10",
    "orderNo": "ORD-1128",
    "invoiceNo": "INV-135",
    "customerName": "Ayisha kirani store",
    "gstin": "URP",
    "skuId": 1793211755086131,
    "itemName": "Fried Gram Fine 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1090,
    "reason": "Item Missing"
  },
  {
    "id": 1794323691272490,
    "date": "2026-11-10",
    "orderNo": "ORD-1145",
    "invoiceNo": "INV-108",
    "customerName": "Shridhar kirani Store",
    "gstin": "URP",
    "skuId": 1792862514843293,
    "itemName": "SVT Vegetable Oil 500gm 20Pcs Box",
    "returnQty": 3,
    "returnAmount": 4980,
    "reason": "Item Missing"
  },
  {
    "id": 1794323716921490,
    "date": "2026-11-10",
    "orderNo": "ORD-1126",
    "invoiceNo": "INV-114",
    "customerName": "C B M Traders",
    "gstin": "URP",
    "skuId": 1793211755094131,
    "itemName": "Masoor Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 833,
    "reason": "Item Missing"
  },
  {
    "id": 1794323842872490,
    "date": "2026-11-10",
    "orderNo": "ORD-1117",
    "invoiceNo": "INV-118",
    "customerName": "Veerabhareswara kirani store",
    "gstin": "URP",
    "skuId": 1792862514842293,
    "itemName": "SVT Vegetable Oil 250gm 40Pcs Box",
    "returnQty": 1,
    "returnAmount": 1670,
    "reason": "Item Missing"
  },
  {
    "id": 1794323870224490,
    "date": "2026-11-10",
    "orderNo": "ORD-1140",
    "invoiceNo": "INV-112",
    "customerName": "Basavaraj umanabadi kirani Store",
    "gstin": "URP",
    "skuId": 1792862514920293,
    "itemName": "Wheel Detergent Powder 10Rs 60Pcs Bag",
    "returnQty": 4,
    "returnAmount": 2080,
    "reason": "Shop Close"
  },
  {
    "id": 1794323870225490,
    "date": "2026-11-10",
    "orderNo": "ORD-1140",
    "invoiceNo": "INV-112",
    "customerName": "Basavaraj umanabadi kirani Store",
    "gstin": "URP",
    "skuId": 1792862514882293,
    "itemName": "Glim Dishwash Soap 10Rs 60Pcs Box",
    "returnQty": 2,
    "returnAmount": 1020,
    "reason": "Shop Close"
  },
  {
    "id": 1794325250135490,
    "date": "2026-11-10",
    "orderNo": "ORD-1162",
    "invoiceNo": "INV-113",
    "customerName": "Mahesh General Store",
    "gstin": "URP",
    "skuId": 1793211755075131,
    "itemName": "Sooji 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 410,
    "reason": "Item Missing"
  },
  {
    "id": 1794323475921490,
    "date": "2026-11-10",
    "orderNo": "ORD-1135",
    "invoiceNo": "INV-141",
    "customerName": "Sangeeta",
    "gstin": "URP",
    "skuId": 1792862514762293,
    "itemName": "Happy Happy Biscuits 5Rs 144Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794323475922490,
    "date": "2026-11-10",
    "orderNo": "ORD-1135",
    "invoiceNo": "INV-141",
    "customerName": "Sangeeta",
    "gstin": "URP",
    "skuId": 1792862514920293,
    "itemName": "Wheel Detergent Powder 10Rs 60Pcs Bag",
    "returnQty": 1,
    "returnAmount": 520,
    "reason": "Customer Cancel"
  },
  {
    "id": 1793978922480154,
    "date": "2026-11-06",
    "orderNo": "ORD-1072",
    "invoiceNo": "INV-39",
    "customerName": "Dundappagouda nayakra kirani store",
    "gstin": "URP",
    "skuId": 1793688416313557,
    "itemName": "Jasmine Rice 30 kg Bag",
    "returnQty": 1,
    "returnAmount": 2800,
    "reason": "No Cash"
  },
  {
    "id": 1793983883627154,
    "date": "2026-11-06",
    "orderNo": "ORD-1072",
    "invoiceNo": "INV-39",
    "customerName": "Dundappagouda nayakra kirani store",
    "gstin": "URP",
    "skuId": 1793211755090131,
    "itemName": "Gram Dal Fine 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 970,
    "reason": "Item Missing"
  },
  {
    "id": 1794289841422063,
    "date": "2026-11-10",
    "orderNo": "ORD-1072",
    "invoiceNo": "INV-39",
    "customerName": "Dundappagouda nayakra kirani store",
    "gstin": "URP",
    "skuId": 1793211755071131,
    "itemName": "Gajaraj Kesar Sooji 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 2150,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794289841424063,
    "date": "2026-11-10",
    "orderNo": "ORD-1072",
    "invoiceNo": "INV-39",
    "customerName": "Dundappagouda nayakra kirani store",
    "gstin": "URP",
    "skuId": 1793211755113131,
    "itemName": "Urad Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1280,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794230515375009,
    "date": "2026-11-09",
    "orderNo": "ORD-1106",
    "invoiceNo": "INV-98",
    "customerName": "Umesh naralay kirani store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 5,
    "returnAmount": 8200,
    "reason": "No Cash"
  },
  {
    "id": 1794230515376009,
    "date": "2026-11-09",
    "orderNo": "ORD-1106",
    "invoiceNo": "INV-98",
    "customerName": "Umesh naralay kirani store",
    "gstin": "URP",
    "skuId": 1793211755070131,
    "itemName": "Gajaraj Kesar Sooji 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 1275,
    "reason": "No Cash"
  },
  {
    "id": 1794230515377009,
    "date": "2026-11-09",
    "orderNo": "ORD-1106",
    "invoiceNo": "INV-98",
    "customerName": "Umesh naralay kirani store",
    "gstin": "URP",
    "skuId": 1793211755076131,
    "itemName": "Sooji 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 1260,
    "reason": "No Cash"
  },
  {
    "id": 1794230515378009,
    "date": "2026-11-09",
    "orderNo": "ORD-1106",
    "invoiceNo": "INV-98",
    "customerName": "Umesh naralay kirani store",
    "gstin": "URP",
    "skuId": 1792862514742293,
    "itemName": "Maida 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 1160,
    "reason": "No Cash"
  },
  {
    "id": 1794230515379009,
    "date": "2026-11-09",
    "orderNo": "ORD-1106",
    "invoiceNo": "INV-98",
    "customerName": "Umesh naralay kirani store",
    "gstin": "URP",
    "skuId": 1792862514746293,
    "itemName": "Namasthe Gram Flour 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 740,
    "reason": "No Cash"
  },
  {
    "id": 1794072321826060,
    "date": "2026-11-07",
    "orderNo": "ORD-1102",
    "invoiceNo": "INV-102",
    "customerName": "Somlegshwar kirani Store",
    "gstin": "URP",
    "skuId": 1792862514799293,
    "itemName": "Trulove Butter Waves 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Item Missing"
  },
  {
    "id": 1794072298591060,
    "date": "2026-11-07",
    "orderNo": "ORD-1107",
    "invoiceNo": "INV-97",
    "customerName": "Veerbreshwar kirani store",
    "gstin": "URP",
    "skuId": 1792862514866293,
    "itemName": "Aramane Detergent Soap 10Rs 60Pcs Box",
    "returnQty": 1,
    "returnAmount": 510,
    "reason": "Item Missing"
  },
  {
    "id": 1793978205480154,
    "date": "2026-11-06",
    "orderNo": "ORD-1073",
    "invoiceNo": "INV-38",
    "customerName": "Tirumal Kirana Store",
    "gstin": "URP",
    "skuId": 1793211755113131,
    "itemName": "Urad Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1280,
    "reason": "Item Missing"
  },
  {
    "id": 1793978276338154,
    "date": "2026-11-06",
    "orderNo": "ORD-1046",
    "invoiceNo": "INV-43",
    "customerName": "Shree. Sadguru",
    "gstin": "URP",
    "skuId": 1793211755086131,
    "itemName": "Fried Gram Fine 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1100,
    "reason": "Item Missing"
  },
  {
    "id": 1793978350224154,
    "date": "2026-11-06",
    "orderNo": "ORD-1077",
    "invoiceNo": "INV-71",
    "customerName": "Veerbhadreshwar Hotel",
    "gstin": "URP",
    "skuId": 1793688416313557,
    "itemName": "Jasmine Rice 30 kg Bag",
    "returnQty": 1,
    "returnAmount": 2800,
    "reason": "No Cash"
  },
  {
    "id": 1794060970572490,
    "date": "2026-11-07",
    "orderNo": "ORD-1090",
    "invoiceNo": "INV-86",
    "customerName": "Vinod mushekhan",
    "gstin": "URP",
    "skuId": 1792862514748293,
    "itemName": "Namasthe Gram Flour 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 3500,
    "reason": "Shop Close"
  },
  {
    "id": 1794060970573490,
    "date": "2026-11-07",
    "orderNo": "ORD-1090",
    "invoiceNo": "INV-86",
    "customerName": "Vinod mushekhan",
    "gstin": "URP",
    "skuId": 1792862514762293,
    "itemName": "Happy Happy Biscuits 5Rs 144Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Shop Close"
  },
  {
    "id": 1794060970574490,
    "date": "2026-11-07",
    "orderNo": "ORD-1090",
    "invoiceNo": "INV-86",
    "customerName": "Vinod mushekhan",
    "gstin": "URP",
    "skuId": 1793211755075131,
    "itemName": "Sooji 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 410,
    "reason": "Shop Close"
  },
  {
    "id": 1794060938140490,
    "date": "2026-11-07",
    "orderNo": "ORD-1098",
    "invoiceNo": "INV-77",
    "customerName": "B K Awati",
    "gstin": "URP",
    "skuId": 1792862514782293,
    "itemName": "Marie Gold Biscuits 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 520,
    "reason": "No Cash"
  },
  {
    "id": 1794060917452490,
    "date": "2026-11-07",
    "orderNo": "ORD-1100",
    "invoiceNo": "INV-74",
    "customerName": "Vinod mushekhan",
    "gstin": "URP",
    "skuId": 1792862514762293,
    "itemName": "Happy Happy Biscuits 5Rs 144Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "No Cash"
  },
  {
    "id": 1794060883981490,
    "date": "2026-11-07",
    "orderNo": "ORD-1085",
    "invoiceNo": "INV-80",
    "customerName": "makhandar kirana Store",
    "gstin": "URP",
    "skuId": 1792862514738293,
    "itemName": "Atta 5Kg 5Pcs Bag",
    "returnQty": 1,
    "returnAmount": 1050,
    "reason": "No Cash"
  },
  {
    "id": 1794060883982490,
    "date": "2026-11-07",
    "orderNo": "ORD-1085",
    "invoiceNo": "INV-80",
    "customerName": "makhandar kirana Store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1650,
    "reason": "No Cash"
  },
  {
    "id": 1794060883983490,
    "date": "2026-11-07",
    "orderNo": "ORD-1085",
    "invoiceNo": "INV-80",
    "customerName": "makhandar kirana Store",
    "gstin": "URP",
    "skuId": 1793211755076131,
    "itemName": "Sooji 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 1280,
    "reason": "No Cash"
  },
  {
    "id": 1794060883984490,
    "date": "2026-11-07",
    "orderNo": "ORD-1085",
    "invoiceNo": "INV-80",
    "customerName": "makhandar kirana Store",
    "gstin": "URP",
    "skuId": 1792862514821293,
    "itemName": "Crystal Salt 1Kg 25Pcs Bag",
    "returnQty": 1,
    "returnAmount": 210,
    "reason": "No Cash"
  },
  {
    "id": 1794060883985490,
    "date": "2026-11-07",
    "orderNo": "ORD-1085",
    "invoiceNo": "INV-80",
    "customerName": "makhandar kirana Store",
    "gstin": "URP",
    "skuId": 1792862514825293,
    "itemName": "Powder Salt 1Kg 25Pcs Bag",
    "returnQty": 1,
    "returnAmount": 220,
    "reason": "No Cash"
  },
  {
    "id": 1794060883986490,
    "date": "2026-11-07",
    "orderNo": "ORD-1085",
    "invoiceNo": "INV-80",
    "customerName": "makhandar kirana Store",
    "gstin": "URP",
    "skuId": 1793211755109131,
    "itemName": "Toor Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1470,
    "reason": "No Cash"
  },
  {
    "id": 1793980548349154,
    "date": "2026-11-06",
    "orderNo": "ORD-1059",
    "invoiceNo": "INV-40",
    "customerName": "Sanketh kirani store",
    "gstin": "URP",
    "skuId": 1793688416313557,
    "itemName": "Jasmine Rice 30 kg Bag",
    "returnQty": 1,
    "returnAmount": 2800,
    "reason": "No Cash"
  },
  {
    "id": 1793980432485154,
    "date": "2026-11-06",
    "orderNo": "ORD-1066",
    "invoiceNo": "INV-56",
    "customerName": "Tirumal Kirana Store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1650,
    "reason": "Item Missing"
  },
  {
    "id": 1793896141652154,
    "date": "2026-11-05",
    "orderNo": "ORD-1166",
    "invoiceNo": "INV-17",
    "customerName": "KGN kirana",
    "gstin": "URP",
    "skuId": 1792862514748293,
    "itemName": "Namasthe Gram Flour 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 3500,
    "reason": "Fake Order"
  },
  {
    "id": 1793896174819154,
    "date": "2026-11-05",
    "orderNo": "ORD-1040",
    "invoiceNo": "INV-19",
    "customerName": "Mallukarjun kirani store",
    "gstin": "URP",
    "skuId": 1792862514738293,
    "itemName": "Atta 5Kg 5Pcs Bag",
    "returnQty": 1,
    "returnAmount": 1050,
    "reason": "Fake Order"
  },
  {
    "id": 1793896216795154,
    "date": "2026-11-05",
    "orderNo": "ORD-1026",
    "invoiceNo": "INV-29",
    "customerName": "Sai kirana store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1650,
    "reason": "Fake Order"
  },
  {
    "id": 1793896234163154,
    "date": "2026-11-05",
    "orderNo": "ORD-1020",
    "invoiceNo": "INV-14",
    "customerName": "Amin kirani stores",
    "gstin": "URP",
    "skuId": 1792862514841293,
    "itemName": "SVT Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1680,
    "reason": "Shop Close"
  },
  {
    "id": 1793978153104154,
    "date": "2026-11-06",
    "orderNo": "ORD-1047",
    "invoiceNo": "INV-42",
    "customerName": "SANTH KIRANA STORE",
    "gstin": "URP",
    "skuId": 1792862514741293,
    "itemName": "Maida 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 380,
    "reason": "Item Missing"
  },
  {
    "id": 1793978153105154,
    "date": "2026-11-06",
    "orderNo": "ORD-1047",
    "invoiceNo": "INV-42",
    "customerName": "SANTH KIRANA STORE",
    "gstin": "URP",
    "skuId": 1793211755075131,
    "itemName": "Sooji 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 410,
    "reason": "Item Missing"
  },
  {
    "id": 1793978153106154,
    "date": "2026-11-06",
    "orderNo": "ORD-1047",
    "invoiceNo": "INV-42",
    "customerName": "SANTH KIRANA STORE",
    "gstin": "URP",
    "skuId": 1793211755090131,
    "itemName": "Gram Dal Fine 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 970,
    "reason": "Item Missing"
  },
  {
    "id": 1794393862326490,
    "date": "2026-11-11",
    "orderNo": "ORD-1178",
    "invoiceNo": "INV-155",
    "customerName": "Bangalore ayyangar bekari",
    "gstin": "URP",
    "skuId": 1792862514814293,
    "itemName": "Trulove Orange Kreme 5Rs 144Pcs Box",
    "returnQty": 1,
    "returnAmount": 520,
    "reason": "No Cash"
  },
  {
    "id": 1794393727623490,
    "date": "2026-11-11",
    "orderNo": "ORD-1154",
    "invoiceNo": "INV-152",
    "customerName": "Asafk kirani store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 2,
    "returnAmount": 3280,
    "reason": "Shop Close"
  },
  {
    "id": 1794393727624490,
    "date": "2026-11-11",
    "orderNo": "ORD-1154",
    "invoiceNo": "INV-152",
    "customerName": "Asafk kirani store",
    "gstin": "URP",
    "skuId": 1792862514882293,
    "itemName": "Glim Dishwash Soap 10Rs 60Pcs Box",
    "returnQty": 1,
    "returnAmount": 510,
    "reason": "Shop Close"
  },
  {
    "id": 1794393472464490,
    "date": "2026-11-11",
    "orderNo": "ORD-1181",
    "invoiceNo": "INV-158",
    "customerName": "Basaveswar kirani store",
    "gstin": "URP",
    "skuId": 1793211755070131,
    "itemName": "Gajaraj Kesar Sooji 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 1275,
    "reason": "Fake Order"
  },
  {
    "id": 1794393504551490,
    "date": "2026-11-11",
    "orderNo": "ORD-1192",
    "invoiceNo": "INV-163",
    "customerName": "Dhangi kirana",
    "gstin": "URP",
    "skuId": 1792862514858293,
    "itemName": "Poha 30kg Bag",
    "returnQty": 1,
    "returnAmount": 1500,
    "reason": "Shop Close"
  },
  {
    "id": 1794393504552490,
    "date": "2026-11-11",
    "orderNo": "ORD-1192",
    "invoiceNo": "INV-163",
    "customerName": "Dhangi kirana",
    "gstin": "URP",
    "skuId": 1793211755094131,
    "itemName": "Masoor Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 833,
    "reason": "Shop Close"
  },
  {
    "id": 1794393535239490,
    "date": "2026-11-11",
    "orderNo": "ORD-1190",
    "invoiceNo": "INV-165",
    "customerName": "Maradisiddesvar",
    "gstin": "URP",
    "skuId": 1792862514746293,
    "itemName": "Namasthe Gram Flour 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 740,
    "reason": "Shop Close"
  },
  {
    "id": 1794393535240490,
    "date": "2026-11-11",
    "orderNo": "ORD-1190",
    "invoiceNo": "INV-165",
    "customerName": "Maradisiddesvar",
    "gstin": "URP",
    "skuId": 1792862514821293,
    "itemName": "Crystal Salt 1Kg 25Pcs Bag",
    "returnQty": 2,
    "returnAmount": 420,
    "reason": "Shop Close"
  },
  {
    "id": 1794393535241490,
    "date": "2026-11-11",
    "orderNo": "ORD-1190",
    "invoiceNo": "INV-165",
    "customerName": "Maradisiddesvar",
    "gstin": "URP",
    "skuId": 1792862514825293,
    "itemName": "Powder Salt 1Kg 25Pcs Bag",
    "returnQty": 2,
    "returnAmount": 440,
    "reason": "Shop Close"
  },
  {
    "id": 1794393559671490,
    "date": "2026-11-11",
    "orderNo": "ORD-1191",
    "invoiceNo": "INV-164",
    "customerName": "Dumake kirana",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1640,
    "reason": "Shop Close"
  },
  {
    "id": 1794393602930490,
    "date": "2026-11-11",
    "orderNo": "ORD-1188",
    "invoiceNo": "INV-149",
    "customerName": "Bidari kirana store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1640,
    "reason": "Shop Close"
  },
  {
    "id": 1794393602931490,
    "date": "2026-11-11",
    "orderNo": "ORD-1188",
    "invoiceNo": "INV-149",
    "customerName": "Bidari kirana store",
    "gstin": "URP",
    "skuId": 1793708242898557,
    "itemName": "SUN ROYAL 750 GM SUNFLOWER OIL BOX",
    "returnQty": 1,
    "returnAmount": 1470,
    "reason": "Shop Close"
  },
  {
    "id": 1794393602932490,
    "date": "2026-11-11",
    "orderNo": "ORD-1188",
    "invoiceNo": "INV-149",
    "customerName": "Bidari kirana store",
    "gstin": "URP",
    "skuId": 1793688416313557,
    "itemName": "Jasmine Rice 30 kg Bag",
    "returnQty": 1,
    "returnAmount": 2800,
    "reason": "Shop Close"
  },
  {
    "id": 1794393790703490,
    "date": "2026-11-11",
    "orderNo": "ORD-1152",
    "invoiceNo": "INV-157",
    "customerName": "Veerbreshwar kirani store",
    "gstin": "URP",
    "skuId": 1793211755073131,
    "itemName": "Idly Sooji 1Kg 20Pcs Bag",
    "returnQty": 1,
    "returnAmount": 960,
    "reason": "No Cash"
  },
  {
    "id": 1794393790704490,
    "date": "2026-11-11",
    "orderNo": "ORD-1152",
    "invoiceNo": "INV-157",
    "customerName": "Veerbreshwar kirani store",
    "gstin": "URP",
    "skuId": 1793211755113131,
    "itemName": "Urad Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1280,
    "reason": "No Cash"
  },
  {
    "id": 1794393790705490,
    "date": "2026-11-11",
    "orderNo": "ORD-1152",
    "invoiceNo": "INV-157",
    "customerName": "Veerbreshwar kirani store",
    "gstin": "URP",
    "skuId": 1793211755094131,
    "itemName": "Masoor Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 833,
    "reason": "No Cash"
  },
  {
    "id": 1794393790706490,
    "date": "2026-11-11",
    "orderNo": "ORD-1152",
    "invoiceNo": "INV-157",
    "customerName": "Veerbreshwar kirani store",
    "gstin": "URP",
    "skuId": 1793211755109131,
    "itemName": "Toor Dal 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 1470,
    "reason": "No Cash"
  },
  {
    "id": 1794582779197490,
    "date": "2026-11-13",
    "orderNo": "ORD-1240",
    "invoiceNo": "INV-226",
    "customerName": "Ashok benakatti",
    "gstin": "URP",
    "skuId": 1793211755076131,
    "itemName": "Sooji 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 1260,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794582809920490,
    "date": "2026-11-13",
    "orderNo": "ORD-1253",
    "invoiceNo": "INV-213",
    "customerName": "Shri Renuka Kirana Store",
    "gstin": "URP",
    "skuId": 1792862514797293,
    "itemName": "Trulove Bourbon Biscuits 5Rs 144Pcs Box",
    "returnQty": 1,
    "returnAmount": 520,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794582809921490,
    "date": "2026-11-13",
    "orderNo": "ORD-1253",
    "invoiceNo": "INV-213",
    "customerName": "Shri Renuka Kirana Store",
    "gstin": "URP",
    "skuId": 1793211755069131,
    "itemName": "Gajaraj Kesar Sooji 10Kg Bag",
    "returnQty": 1,
    "returnAmount": 435,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794582940269490,
    "date": "2026-11-13",
    "orderNo": "ORD-1223",
    "invoiceNo": "INV-224",
    "customerName": "Ravi General Store",
    "gstin": "URP",
    "skuId": 1792862514844293,
    "itemName": "VST Vegetable Oil 1Kg 10Pcs Box",
    "returnQty": 1,
    "returnAmount": 1610,
    "reason": "Item Missing"
  },
  {
    "id": 1794585748074490,
    "date": "2026-11-13",
    "orderNo": "ORD-1251",
    "invoiceNo": "INV-214",
    "customerName": "Dundappagouda nayakra kirani store",
    "gstin": "URP",
    "skuId": 1792862514920293,
    "itemName": "Wheel Detergent Powder 10Rs 60Pcs Bag",
    "returnQty": 1,
    "returnAmount": 520,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794839377360136,
    "date": "2026-11-16",
    "orderNo": "ORD-1304",
    "invoiceNo": "INV-256",
    "customerName": "Shree Banashankari Kirani Shop",
    "gstin": "URP",
    "skuId": 1792862514845293,
    "itemName": "VST Vegetable Oil 500gm 20Pcs Box",
    "returnQty": 1,
    "returnAmount": 1620,
    "reason": "Item Missing"
  },
  {
    "id": 1794839377361136,
    "date": "2026-11-16",
    "orderNo": "ORD-1304",
    "invoiceNo": "INV-256",
    "customerName": "Shree Banashankari Kirani Shop",
    "gstin": "URP",
    "skuId": 1792862514799293,
    "itemName": "Trulove Butter Waves 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Fake Order"
  },
  {
    "id": 1794841232735136,
    "date": "2026-11-16",
    "orderNo": "ORD-1288",
    "invoiceNo": "INV-269",
    "customerName": "Gogi kirani",
    "gstin": "URP",
    "skuId": 1793211755091131,
    "itemName": "Gram Dal Fine 30Kg Bag",
    "returnQty": 1,
    "returnAmount": 2860,
    "reason": "Quality issue / Damage"
  },
  {
    "id": 1794841232736136,
    "date": "2026-11-16",
    "orderNo": "ORD-1288",
    "invoiceNo": "INV-269",
    "customerName": "Gogi kirani",
    "gstin": "URP",
    "skuId": 1793211755071131,
    "itemName": "Gajaraj Kesar Sooji 50Kg Bag",
    "returnQty": 1,
    "returnAmount": 2150,
    "reason": "Item Missing"
  },
  {
    "id": 1794925299591136,
    "date": "2026-11-17",
    "orderNo": "ORD-1286",
    "invoiceNo": "INV-273",
    "customerName": "KGN kirana",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Item Missing"
  },
  {
    "id": 1794925258831136,
    "date": "2026-11-17",
    "orderNo": "ORD-1289",
    "invoiceNo": "INV-271",
    "customerName": "Kambar kurani",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Item Missing"
  },
  {
    "id": 1794925250638136,
    "date": "2026-11-17",
    "orderNo": "ORD-1294",
    "invoiceNo": "INV-277",
    "customerName": "Malapa ukali",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 1,
    "returnAmount": 620,
    "reason": "Item Missing"
  },
  {
    "id": 1794925228095136,
    "date": "2026-11-17",
    "orderNo": "ORD-1298",
    "invoiceNo": "INV-261",
    "customerName": "Layamma devi kirani store",
    "gstin": "URP",
    "skuId": 1792862514754293,
    "itemName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "returnQty": 2,
    "returnAmount": 1240,
    "reason": "Item Missing"
  },
  {
    "id": 1794924690135136,
    "date": "2026-11-17",
    "orderNo": "ORD-1323",
    "invoiceNo": "INV-303",
    "customerName": "Tajes General Store",
    "gstin": "URP",
    "skuId": 1794405193984490,
    "itemName": "1/2 LTR WATER ( 24 PCS)",
    "returnQty": 1,
    "returnAmount": 140,
    "reason": "Customer Cancel"
  },
  {
    "id": 1794926824181136,
    "date": "2026-11-17",
    "orderNo": "ORD-1332",
    "invoiceNo": "INV-287",
    "customerName": "Chandru Biradar kiran",
    "gstin": "URP",
    "skuId": 1792862514825293,
    "itemName": "Powder Salt 1Kg 25Pcs Bag",
    "returnQty": 1,
    "returnAmount": 220,
    "reason": "Customer Cancel"
  },
  {
    "id": 1795099117738136,
    "date": "2026-11-19",
    "orderNo": "ORD-1392",
    "invoiceNo": "INV-372",
    "customerName": "Kaulagi",
    "gstin": "URP",
    "skuId": 1792862514851293,
    "itemName": "Bullet Rice 26Kg Bag",
    "returnQty": 1,
    "returnAmount": 2100,
    "reason": "Quality issue / Damage"
  },
  {
    "id": 1795099030306136,
    "date": "2026-11-19",
    "orderNo": "ORD-1413",
    "invoiceNo": "INV-379",
    "customerName": "V. V. S. Bakery",
    "gstin": "URP",
    "skuId": 1792862514845293,
    "itemName": "VST Vegetable Oil 500gm 20Pcs Box",
    "returnQty": 1,
    "returnAmount": 1600,
    "reason": "Shop Close"
  },
  {
    "id": 1795098779460136,
    "date": "2026-11-19",
    "orderNo": "ORD-1412",
    "invoiceNo": "INV-378",
    "customerName": "Praveen kirana store chikkarugi",
    "gstin": "URP",
    "skuId": 1793708242898557,
    "itemName": "SUN ROYAL 750 GM SUNFLOWER OIL BOX",
    "returnQty": 2,
    "returnAmount": 2900,
    "reason": "No Cash"
  }
];

function getAllCombinedSalesReturns(): BackupSalesReturn[] {
  const list: BackupSalesReturn[] = [...BACKUP_SALES_RETURNS];
  try {
    const raw = localStorage.getItem('crm_wholesale_pipeline_orders');
    if (raw) {
      const orders = JSON.parse(raw);
      if (Array.isArray(orders)) {
        orders.forEach((o: any) => {
          (o.items || []).forEach((it: any, idx: number) => {
            const rQty = Number(it.returnQty || 0);
            if (rQty > 0) {
              list.push({
                id: `${o.id}-${idx}`,
                date: (o.deliveredAt || o.orderDate || '').slice(0, 10),
                orderNo: o.orderNo || '',
                invoiceNo: o.invoiceNo || o.orderNo || '',
                customerName: o.shopName || o.customerName || 'Customer',
                gstin: o.gstin || 'URP',
                skuId: it.skuId || it.s || '',
                itemName: it.name || 'Item',
                returnQty: rQty,
                returnAmount: rQty * Number(it.price || it.rate || 0),
                reason: it.returnReason || 'Return',
              });
            }
          });
        });
      }
    }
  } catch {}
  return list;
}

export const CA_REPORT_CONFIGS: Record<string, RegisterConfig> = {
  carsal: {
    id: 'carsal',
    title: 'Sales Register',
    subtitle: 'Every sales invoice with taxable value and GST. Computed from live orders & backup master.',
    columns: [
      'Date',
      'Invoice No',
      'Customer',
      'GSTIN',
      'Place of Supply',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Invoice Total',
      'Received',
      'Balance',
    ],
    moneyCols: [5, 6, 7, 8, 9, 10, 11],
  },
  carpur: {
    id: 'carpur',
    title: 'Purchase Register',
    subtitle: 'Every purchase bill with taxable value and input GST. Computed from live & backup bills.',
    columns: [
      'Date',
      'Bill No',
      'Vendor',
      'GSTIN',
      'State',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Bill Total',
    ],
    moneyCols: [5, 6, 7, 8, 9],
  },
  carcdn: {
    id: 'carcdn',
    title: 'Credit / Debit Notes',
    subtitle: 'Credit notes = sales returns. Debit notes = purchase returns to vendors.',
    columns: [
      'Date',
      'Type',
      'Note No',
      'Party',
      'GSTIN',
      'Against Invoice / Bill',
      'Item',
      'Qty',
      'Total',
    ],
  },
  carexp: {
    id: 'carexp',
    title: 'Expense Register',
    subtitle: 'All expenses including salary, with payment mode and approval.',
    columns: [
      'Date',
      'Category',
      'Details',
      'Amount',
      'Payment Mode',
      'Paid by',
      'Vehicle / Remarks',
    ],
    moneyCols: [3],
  },
  carhsn: {
    id: 'carhsn',
    title: 'HSN Summary',
    subtitle: 'HSN-wise outward summary from real orders.',
    columns: [
      'HSN',
      'Description',
      'UQC',
      'Total Qty',
      'GST Rate',
      'Total Value',
      'Taxable Value',
      'IGST',
      'CGST',
      'SGST',
    ],
    moneyCols: [5, 6, 7, 8, 9],
  },
  cargsm: {
    id: 'cargsm',
    title: 'GST Summary (month wise)',
    subtitle: 'Month wise Output GST, Input GST (ITC) and Net GST payable.',
    columns: ['Month', 'Sales Taxable', 'Output Tax', 'Purchases Taxable', 'Input ITC', 'Net Payable'],
    moneyCols: [1, 2, 3, 4, 5],
  },
  carven: {
    id: 'carven',
    title: 'Vendor wise Purchases',
    subtitle: 'Supplier wise purchase bills, ITC & net totals.',
    columns: ['Vendor', 'GSTIN', 'State', 'Bills', 'Taxable', 'Input Tax', 'Purchase Total', 'Returns', 'Net Purchase'],
    moneyCols: [4, 5, 6, 7, 8],
  },
  carstk: {
    id: 'carstk',
    title: 'Stock Summary',
    subtitle: 'Current SKU closing stock & value at GRN price across live catalog.',
    columns: [
      'SKU',
      'HSN',
      'Purchase Qty',
      'Sales Qty',
      'Sales Return',
      'Splits',
      'Closing Qty',
      'Rate (GRN)',
      'Closing Value',
    ],
    moneyCols: [7, 8],
  },
  carday: {
    id: 'carday',
    title: 'Day Book',
    subtitle: 'Every transaction date wise: sales invoices, purchases, returns and expenses.',
    columns: ['Date', 'Type', 'Ref No', 'Party', 'Mode', 'Amount'],
    moneyCols: [5],
  },
};

function fmtDmy(iso: string): string {
  if (!iso) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(iso)) return iso;
  const p = iso.slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : iso;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getSampleRowsForRegister(id: string): any[][] {
  const orders = getAllMergedPnlOrders().filter((o) => o.st !== 'cancelled');
  const customers = getStoredCustomers();
  const custMap = new Map(customers.map((c) => [String(c.id), c]));
  const skus = getStoredSkuProducts();
  const skuById = new Map(skus.map((s) => [String(s.id), s]));
  const pnlSkuById = new Map(PNL_SKUS.map((s) => [String(s.id), s]));
  const purchases: PurchaseRecord[] = getStoredPurchases();
  const vendors: VendorRecord[] = getStoredVendors();
  const vendorMap = new Map<string, VendorRecord>(vendors.map((v) => [String(v.id), v]));
  const expenses = getStoredExpenses();
  const returns = getAllCombinedSalesReturns();
  const debitNotes: DebitNoteRecord[] = getStoredDebitNotes();
  const hsnMaster = getStoredHsnCodes();
  const hsnDescMap = new Map(hsnMaster.map((h) => [h.code, h.desc]));

  switch (id) {
    case 'carsal': {
      return orders.map((o) => {
        const cust = custMap.get(String(o.cust));
        const gstin = cust?.gstin || 'URP';
        const state = cust?.state || 'Karnataka';
        const isInterstate = gstin !== 'URP' && !gstin.startsWith('29') && state.toLowerCase() !== 'karnataka';
        let taxable = 0;
        let tax = 0;
        for (const it of o.items || []) {
          const sku = skuById.get(String(it.s)) || pnlSkuById.get(String(it.s));
          const gstRate = Number(sku?.gst ?? 5);
          const lineGross = Number(it.q || 0) * Number(it.p || 0);
          const base = lineGross / (1 + gstRate / 100);
          taxable += base;
          tax += lineGross - base;
        }
        const total = taxable + tax;
        const cgst = isInterstate ? 0 : tax / 2;
        const sgst = isInterstate ? 0 : tax / 2;
        const igst = isInterstate ? tax : 0;
        const isDelivered = o.st === 'completed' || o.st === 'delivered';
        return [
          fmtDmy(o.dsp || o.date),
          o.inv || o.no,
          o.custName || cust?.shop || cust?.name || 'Customer',
          gstin,
          state,
          round2(taxable),
          round2(cgst),
          round2(sgst),
          round2(igst),
          round2(total),
          isDelivered ? round2(total) : 0,
          isDelivered ? 0 : round2(total),
        ];
      });
    }

    case 'carpur': {
      return purchases.map((p) => {
        const vend = vendorMap.get(String(p.vendorId));
        const gstin = vend?.gstin || 'URP';
        const state = vend?.state || 'Karnataka';
        const isInterstate = gstin !== 'URP' && !gstin.startsWith('29') && state.toLowerCase() !== 'karnataka';
        let taxable = 0;
        let tax = 0;
        for (const l of p.lines || []) {
          const base = (l.qty * l.grnPrice) / (1 + (l.gstPercent || 0) / 100);
          taxable += base;
          tax += l.qty * l.grnPrice - base;
        }
        const total = p.totalAmount || taxable + tax;
        if (taxable === 0 && total > 0) {
          taxable = total / 1.05;
          tax = total - taxable;
        }
        return [
          fmtDmy(p.date),
          p.invoiceNo,
          p.vendorName,
          gstin,
          state,
          round2(taxable),
          isInterstate ? 0 : round2(tax / 2),
          isInterstate ? 0 : round2(tax / 2),
          isInterstate ? round2(tax) : 0,
          round2(total),
        ];
      });
    }

    case 'carcdn': {
      const cnRows = returns.map((r, idx) => [
        fmtDmy(r.date),
        'Credit note (sales return)',
        `CN-${String(idx + 1).padStart(3, '0')}`,
        r.customerName || 'Customer',
        r.gstin || 'URP',
        r.invoiceNo || r.orderNo,
        r.itemName,
        r.returnQty,
        round2(r.returnAmount),
      ]);
      const dnRows = debitNotes.map((d) => [
        fmtDmy(d.date),
        'Debit note (purchase return)',
        d.debitNoteNo,
        d.vendorName,
        'URP',
        d.invoiceNo,
        `${d.lines?.length || 0} item(s)`,
        d.lines?.reduce((s, x) => s + x.returnQty, 0) || 0,
        round2(d.amount),
      ]);
      return [...cnRows, ...dnRows];
    }

    case 'carexp': {
      return expenses.map((e) => [
        fmtDmy(e.date),
        e.cat,
        e.sub || e.paidTo || '-',
        round2(e.amt),
        e.paymentType || 'Cash',
        e.ap?.by || 'Admin',
        [e.veh, e.remarks].filter(Boolean).join(' · ') || '-',
      ]);
    }

    case 'carhsn': {
      const buckets = new Map<string, { desc: string; qty: number; rate: number; total: number; taxable: number; tax: number }>();
      for (const o of orders) {
        for (const it of o.items || []) {
          const sku = skuById.get(String(it.s)) || pnlSkuById.get(String(it.s));
          const hsn = (sku && 'hsn' in sku ? sku.hsn : '') || '2106';
          const rate = Number(sku?.gst ?? 5);
          const qty = Number(it.q || 0);
          const gross = qty * Number(it.p || 0);
          const taxable = gross / (1 + rate / 100);
          const tax = gross - taxable;
          const b = buckets.get(hsn) || {
            desc: hsnDescMap.get(hsn.slice(0, 4)) || sku?.name || 'Goods',
            qty: 0,
            rate,
            total: 0,
            taxable: 0,
            tax: 0,
          };
          b.qty += qty;
          b.total += gross;
          b.taxable += taxable;
          b.tax += tax;
          buckets.set(hsn, b);
        }
      }
      return Array.from(buckets.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .map(([hsn, v]) => [
          hsn,
          v.desc,
          'NOS',
          v.qty,
          `${v.rate}%`,
          round2(v.total),
          round2(v.taxable),
          0,
          round2(v.tax / 2),
          round2(v.tax / 2),
        ]);
    }

    case 'cargsm': {
      const months = new Map<string, { salTaxable: number; outTax: number; purTaxable: number; inTax: number }>();
      for (const o of orders) {
        const mKey = (o.dsp || o.date || '').slice(0, 7) || '2026-11';
        const bucket = months.get(mKey) || { salTaxable: 0, outTax: 0, purTaxable: 0, inTax: 0 };
        for (const it of o.items || []) {
          const sku = skuById.get(String(it.s)) || pnlSkuById.get(String(it.s));
          const rate = Number(sku?.gst ?? 5);
          const gross = Number(it.q || 0) * Number(it.p || 0);
          const taxable = gross / (1 + rate / 100);
          bucket.salTaxable += taxable;
          bucket.outTax += gross - taxable;
        }
        months.set(mKey, bucket);
      }
      for (const p of purchases) {
        const mKey = (p.date || '').slice(0, 7) || '2026-11';
        const bucket = months.get(mKey) || { salTaxable: 0, outTax: 0, purTaxable: 0, inTax: 0 };
        for (const l of p.lines || []) {
          const base = (l.qty * l.grnPrice) / (1 + (l.gstPercent || 0) / 100);
          bucket.purTaxable += base;
          bucket.inTax += l.qty * l.grnPrice - base;
        }
        months.set(mKey, bucket);
      }
      return Array.from(months.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([m, v]) => [
          m,
          round2(v.salTaxable),
          round2(v.outTax),
          round2(v.purTaxable),
          round2(v.inTax),
          round2(Math.max(0, v.outTax - v.inTax)),
        ]);
    }

    case 'carven': {
      const vStats = new Map<number, { bills: number; taxable: number; tax: number; total: number }>();
      for (const p of purchases) {
        const cur = vStats.get(p.vendorId) || { bills: 0, taxable: 0, tax: 0, total: 0 };
        cur.bills += 1;
        let txb = 0;
        let tx = 0;
        for (const l of p.lines || []) {
          const base = (l.qty * l.grnPrice) / (1 + (l.gstPercent || 0) / 100);
          txb += base;
          tx += l.qty * l.grnPrice - base;
        }
        cur.taxable += txb || p.totalAmount / 1.05;
        cur.tax += tx;
        cur.total += p.totalAmount;
        vStats.set(p.vendorId, cur);
      }
      return vendors.map((v) => {
        const st = vStats.get(v.id) || { bills: 0, taxable: 0, tax: 0, total: 0 };
        const ret = debitNotes.filter((d) => d.vendorId === v.id).reduce((s, d) => s + d.amount, 0);
        return [
          v.name,
          v.gstin || 'URP',
          v.state,
          st.bills,
          round2(st.taxable),
          round2(st.tax),
          round2(st.total),
          round2(ret),
          round2(st.total - ret),
        ];
      });
    }

    case 'carstk': {
      const purQty = new Map<string, number>();
      const salQty = new Map<string, number>();
      const retQty = new Map<string, number>();
      const splitQty = new Map<string, number>();
      for (const p of purchases) {
        for (const l of p.lines || []) {
          purQty.set(String(l.skuId), (purQty.get(String(l.skuId)) || 0) + l.qty);
        }
      }
      for (const o of orders) {
        for (const it of o.items || []) {
          salQty.set(String(it.s), (salQty.get(String(it.s)) || 0) + Number(it.q || 0));
        }
      }
      for (const r of returns) {
        retQty.set(String(r.skuId), (retQty.get(String(r.skuId)) || 0) + Number(r.returnQty || 0));
      }
      for (const sp of getStoredStockSplits()) {
        splitQty.set(String(sp.parentSkuId), (splitQty.get(String(sp.parentSkuId)) || 0) + Number(sp.splitQty || 0));
      }
      return skus.map((s) => {
        const idStr = String(s.id);
        const rateExcl = s.cost / (1 + (s.gst || 0) / 100);
        return [
          s.name,
          s.hsn || '-',
          purQty.get(idStr) || 0,
          salQty.get(idStr) || 0,
          retQty.get(idStr) || 0,
          splitQty.get(idStr) || 0,
          s.stock,
          round2(rateExcl),
          round2(s.stock * rateExcl),
        ];
      });
    }

    case 'carday': {
      const rows: any[][] = [];
      for (const o of orders) {
        const tot = (o.items || []).reduce((s, it) => s + Number(it.q || 0) * Number(it.p || 0), 0);
        rows.push([fmtDmy(o.date), 'Sales invoice', o.inv || o.no, o.custName || 'Customer', 'Sale', round2(tot)]);
      }
      for (const p of purchases) {
        rows.push([fmtDmy(p.date), 'Purchase', p.invoiceNo, p.vendorName, 'Purchase', round2(p.totalAmount)]);
      }
      for (const e of expenses) {
        rows.push([fmtDmy(e.date), 'Expense', e.billNo || `EXP-${String(e.id).slice(-4)}`, e.cat, e.paymentType, round2(e.amt)]);
      }
      for (const r of returns) {
        rows.push([fmtDmy(r.date), 'Sales return', r.invoiceNo || r.orderNo, r.customerName, 'Credit Note', round2(r.returnAmount)]);
      }
      return rows;
    }

    default:
      return [];
  }
}

export function computeGstReturnData(returnMonth: string, financialYear: string) {
  const orders = getAllMergedPnlOrders().filter((o) => o.st !== 'cancelled');
  const customers = getStoredCustomers();
  const custMap = new Map(customers.map((c) => [String(c.id), c]));
  const skus = getStoredSkuProducts();
  const skuById = new Map(skus.map((s) => [String(s.id), s]));
  const pnlSkuById = new Map(PNL_SKUS.map((s) => [String(s.id), s]));
  const purchases: PurchaseRecord[] = getStoredPurchases();
  const vendors: VendorRecord[] = getStoredVendors();
  const vendorMap = new Map<string, VendorRecord>(vendors.map((v) => [String(v.id), v]));
  const returns = getAllCombinedSalesReturns();

  const monthOrders = orders.filter((o) => (o.dsp || o.date || '').startsWith(returnMonth));
  const monthPurchases = purchases.filter((p) => (p.date || '').startsWith(returnMonth));
  const monthReturns = returns.filter((r) => (r.date || '').startsWith(returnMonth));

  let salesTaxable = 0;
  let salesCgst = 0;
  let salesSgst = 0;
  let salesIgst = 0;
  const b2bRows: any[] = [];

  for (const o of monthOrders) {
    const cust = custMap.get(String(o.cust));
    const gstin = (cust?.gstin || '').trim();
    const state = cust?.state || 'Karnataka';
    const isInterstate = gstin.length >= 10 && !gstin.startsWith('29') && state.toLowerCase() !== 'karnataka';
    let oTaxable = 0;
    let oTax = 0;
    for (const it of o.items || []) {
      const sku = skuById.get(String(it.s)) || pnlSkuById.get(String(it.s));
      const rate = Number(sku?.gst ?? 5);
      const gross = Number(it.q || 0) * Number(it.p || 0);
      const base = gross / (1 + rate / 100);
      oTaxable += base;
      oTax += gross - base;
    }
    salesTaxable += oTaxable;
    if (isInterstate) salesIgst += oTax;
    else {
      salesCgst += oTax / 2;
      salesSgst += oTax / 2;
    }
    if (gstin.length >= 10) {
      b2bRows.push({
        invoiceNo: o.inv || o.no,
        date: fmtDmy(o.dsp || o.date),
        customer: o.custName || cust?.shop || 'Customer',
        gstin,
        taxable: round2(oTaxable),
        tax: round2(oTax),
        total: round2(oTaxable + oTax),
      });
    }
  }

  let purTaxable = 0;
  let purCgst = 0;
  let purSgst = 0;
  let purIgst = 0;
  const itcByRate = new Map<number, { taxable: number; igst: number; cgst: number; sgst: number; totalTax: number }>();

  for (const p of monthPurchases) {
    const vend = vendorMap.get(String(p.vendorId));
    const gstin = (vend?.gstin || '').trim();
    const state = vend?.state || 'Karnataka';
    const isInterstate = gstin.length >= 10 && !gstin.startsWith('29') && state.toLowerCase() !== 'karnataka';
    for (const l of p.lines || []) {
      const rate = Number(l.gstPercent || 0);
      const gross = l.qty * l.grnPrice;
      const base = gross / (1 + rate / 100);
      const tax = gross - base;
      purTaxable += base;
      const ig = isInterstate ? tax : 0;
      const cg = isInterstate ? 0 : tax / 2;
      const sg = isInterstate ? 0 : tax / 2;
      purIgst += ig;
      purCgst += cg;
      purSgst += sg;

      const cur = itcByRate.get(rate) || { taxable: 0, igst: 0, cgst: 0, sgst: 0, totalTax: 0 };
      cur.taxable += base;
      cur.igst += ig;
      cur.cgst += cg;
      cur.sgst += sg;
      cur.totalTax += tax;
      itcByRate.set(rate, cur);
    }
  }

  const fyOrders = orders;
  let fyTurnover = 0;
  let fyOutputTax = 0;
  for (const o of fyOrders) {
    for (const it of o.items || []) {
      const sku = skuById.get(String(it.s)) || pnlSkuById.get(String(it.s));
      const rate = Number(sku?.gst ?? 5);
      const gross = Number(it.q || 0) * Number(it.p || 0);
      const base = gross / (1 + rate / 100);
      fyTurnover += base;
      fyOutputTax += gross - base;
    }
  }
  let fyItc = 0;
  for (const p of purchases) {
    for (const l of p.lines || []) {
      const rate = Number(l.gstPercent || 0);
      const gross = l.qty * l.grnPrice;
      fyItc += gross - gross / (1 + rate / 100);
    }
  }

  const outputTaxTotal = salesCgst + salesSgst + salesIgst;
  const itcTotal = purCgst + purSgst + purIgst;

  return {
    gstr1: {
      taxableValue: Math.round(salesTaxable),
      igst: Math.round(salesIgst),
      cgst: Math.round(salesCgst),
      sgst: Math.round(salesSgst),
      invoicesCount: monthOrders.length,
      creditNotesCount: monthReturns.length,
      b2bRows,
    },
    gstr2: {
      purchasesTaxable: Math.round(purTaxable),
      itcIgst: Math.round(purIgst),
      itcCgst: Math.round(purCgst),
      itcSgst: Math.round(purSgst),
      netItc: Math.round(itcTotal),
      billsCount: monthPurchases.length,
      rateRows: Array.from(itcByRate.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([rate, v]) => ({
          rate: `${rate}%`,
          taxable: round2(v.taxable),
          igst: round2(v.igst),
          cgst: round2(v.cgst),
          sgst: round2(v.sgst),
          totalTax: round2(v.totalTax),
        })),
    },
    gstr3b: {
      taxableOutward: round2(salesTaxable),
      outputTax: Math.round(outputTaxTotal),
      netItc: Math.round(itcTotal),
      payInCash: Math.max(0, Math.round(outputTaxTotal - itcTotal)),
      itcCarriedForward: Math.max(0, Math.round(itcTotal - outputTaxTotal)),
      cgst: round2(salesCgst),
      sgst: round2(salesSgst),
      igst: round2(salesIgst),
    },
    gstr9: {
      financialYear,
      turnover: Math.round(fyTurnover),
      outputTax: Math.round(fyOutputTax),
      itcAvailed: Math.round(fyItc),
      paidInCash: Math.max(0, Math.round(fyOutputTax - fyItc)),
      ordersCount: fyOrders.length,
    },
  };
}
