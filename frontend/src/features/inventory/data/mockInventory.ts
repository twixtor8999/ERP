export interface InventorySku {
  id: number;
  name: string;
  code: string;
  category: string;
  opening: number;
  purchase: number;
  purchaseReturn: number;
  sales: number;
  salesReturn: number;
  splitIn: number;
  splitOut: number;
  closing: number;
  cost: number; // GRN rate
  price: number; // Selling rate
  minStock: number;
  punchOrders: number;
  orderCancel: number;
}

export interface PunchOrderItem {
  orderId: string;
  orderNo: string;
  customerName: string;
  village: string;
  orderDate: string;
  skuId: number;
  skuName: string;
  qty: number;
  rate: number;
  status: "placed" | "packed" | "invoiced" | "dispatched";
}

export interface AuditLine {
  skuId: number;
  name: string;
  code: string;
  category: string;
  closing: number;
  phys: number;
  diff: number;
  grn: number;
  diffAmount: number;
  remarks: "Matched" | "Negative" | "Positive";
}

export interface SavedAudit {
  id: string;
  date: string;
  time: string;
  auditor: string;
  role: string;
  status: "saved" | "approved";
  lines: AuditLine[];
  netSales: number;
  inventoryClosingValue: number;
}

export const INITIAL_INVENTORY_SKUS: InventorySku[] = [
  {
    id: 101,
    name: "Gajaraj Kesar Sooji 10Kg Bag",
    code: "SKU-SOO-10",
    category: "Atta And Sooji Flours",
    opening: 45,
    purchase: 50,
    purchaseReturn: 0,
    sales: 38,
    salesReturn: 2,
    splitIn: 0,
    splitOut: 0,
    closing: 59,
    cost: 380,
    price: 420,
    minStock: 20,
    punchOrders: 15,
    orderCancel: 3,
  },
  {
    id: 102,
    name: "Gajaraj Kesar Sooji 30Kg Bag",
    code: "SKU-SOO-30",
    category: "Atta And Sooji Flours",
    opening: 12,
    purchase: 20,
    purchaseReturn: 0,
    sales: 18,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 14,
    cost: 1100,
    price: 1250,
    minStock: 10,
    punchOrders: 8,
    orderCancel: 0,
  },
  {
    id: 103,
    name: "Maida 10Kg Bag",
    code: "SKU-MAI-10",
    category: "Atta And Sooji Flours",
    opening: 80,
    purchase: 40,
    purchaseReturn: 0,
    sales: 65,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 55,
    cost: 360,
    price: 400,
    minStock: 25,
    punchOrders: 20,
    orderCancel: 2,
  },
  {
    id: 104,
    name: "Namasthe Gram Flour 10Kg Bag",
    code: "SKU-BES-10",
    category: "Atta And Sooji Flours",
    opening: 30,
    purchase: 20,
    purchaseReturn: 0,
    sales: 15,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 35,
    cost: 780,
    price: 850,
    minStock: 15,
    punchOrders: 10,
    orderCancel: 1,
  },
  {
    id: 105,
    name: "Fortune Sunlite Refined Sunflower Oil 1L",
    code: "SKU-OIL-01",
    category: "Oil And Ghee",
    opening: 250,
    purchase: 300,
    purchaseReturn: 10,
    sales: 280,
    salesReturn: 5,
    splitIn: 0,
    splitOut: 0,
    closing: 265,
    cost: 118,
    price: 130,
    minStock: 100,
    punchOrders: 60,
    orderCancel: 5,
  },
  {
    id: 106,
    name: "Gemini Pure & Gentle Refined Sunflower Oil 1L Pouch",
    code: "SKU-GEM-01",
    category: "Oil And Ghee",
    opening: 120,
    purchase: 150,
    purchaseReturn: 0,
    sales: 140,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 130,
    cost: 115,
    price: 128,
    minStock: 60,
    punchOrders: 45,
    orderCancel: 2,
  },
  {
    id: 107,
    name: "Atta 1Kg 30Pcs Bag",
    code: "SKU-ATT-30",
    category: "Atta And Sooji Flours",
    opening: 25,
    purchase: 30,
    purchaseReturn: 0,
    sales: 40,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 15,
    cost: 980,
    price: 1100,
    minStock: 20,
    punchOrders: 18,
    orderCancel: 0,
  },
  {
    id: 108,
    name: "BUMTUM BABY DIAPER 12RS (M1 7-12 KG 1PANS PKT)",
    code: "SKU-DIA-M1",
    category: "Soaps Detergents And Toiletries",
    opening: 400,
    purchase: 500,
    purchaseReturn: 0,
    sales: 450,
    salesReturn: 10,
    splitIn: 0,
    splitOut: 0,
    closing: 460,
    cost: 8.5,
    price: 12,
    minStock: 150,
    punchOrders: 80,
    orderCancel: 10,
  },
  {
    id: 109,
    name: "Sona Masoori Rice Raw 25Kg Bag",
    code: "SKU-SONA-25",
    category: "RICE",
    opening: 180,
    purchase: 100,
    purchaseReturn: 0,
    sales: 120,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 160,
    cost: 1420,
    price: 1580,
    minStock: 50,
    punchOrders: 35,
    orderCancel: 0,
  },
  {
    id: 110,
    name: "Jeera Samba Rice 25Kg Bag",
    code: "SKU-JEE-25",
    category: "Rice",
    opening: 40,
    purchase: 25,
    purchaseReturn: 0,
    sales: 20,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 45,
    cost: 1850,
    price: 2100,
    minStock: 15,
    punchOrders: 12,
    orderCancel: 1,
  },
  {
    id: 111,
    name: "Sugar M-30 50Kg Bag",
    code: "SKU-SUG-50",
    category: "Jaggery Sugar And Salt",
    opening: 95,
    purchase: 120,
    purchaseReturn: 0,
    sales: 110,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 105,
    cost: 1980,
    price: 2150,
    minStock: 40,
    punchOrders: 30,
    orderCancel: 0,
  },
  {
    id: 112,
    name: "Tata Salt Crystal 1Kg (25 Pkts)",
    code: "SKU-SLT-25",
    category: "Jaggery Sugar And Salt",
    opening: 60,
    purchase: 50,
    purchaseReturn: 0,
    sales: 45,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 65,
    cost: 410,
    price: 475,
    minStock: 25,
    punchOrders: 20,
    orderCancel: 0,
  },
  {
    id: 113,
    name: "Chana Dal 30Kg Bag",
    code: "SKU-CHN-30",
    category: "Cereals and Pulses",
    opening: 50,
    purchase: 30,
    purchaseReturn: 0,
    sales: 35,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 45,
    cost: 2350,
    price: 2600,
    minStock: 20,
    punchOrders: 15,
    orderCancel: 0,
  },
  {
    id: 114,
    name: "Toor Dal Desi 30Kg Bag",
    code: "SKU-TUR-30",
    category: "Cereals and Pulses",
    opening: 35,
    purchase: 25,
    purchaseReturn: 0,
    sales: 22,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 38,
    cost: 4200,
    price: 4650,
    minStock: 15,
    punchOrders: 10,
    orderCancel: 0,
  },
  {
    id: 115,
    name: "Good Day Butter Biscuits 120g (Pack of 24)",
    code: "SKU-GD-24",
    category: "Biscuits Beverages And Confectionaries",
    opening: 140,
    purchase: 100,
    purchaseReturn: 0,
    sales: 125,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 115,
    cost: 580,
    price: 672,
    minStock: 40,
    punchOrders: 25,
    orderCancel: 1,
  },
  {
    id: 116,
    name: "Rin Detergent Bar 250g (Pack of 48)",
    code: "SKU-RIN-48",
    category: "Soaps Detergents And Toiletries",
    opening: 75,
    purchase: 60,
    purchaseReturn: 0,
    sales: 50,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 85,
    cost: 920,
    price: 1056,
    minStock: 30,
    punchOrders: 20,
    orderCancel: 0,
  },
  {
    id: 117,
    name: "Electric Kettle 1.8L Stainless Steel",
    code: "SKU-KET-18",
    category: "Electronics And Home Appliances",
    opening: 18,
    purchase: 10,
    purchaseReturn: 0,
    sales: 8,
    salesReturn: 0,
    splitIn: 0,
    splitOut: 0,
    closing: 20,
    cost: 520,
    price: 699,
    minStock: 8,
    punchOrders: 5,
    orderCancel: 0,
  },
];

export const INITIAL_PUNCH_ORDERS: PunchOrderItem[] = [
  {
    orderId: "ORD-101",
    orderNo: "ORD-101",
    customerName: "Mahalaxmi Kirana",
    village: "Lakkalakatti",
    orderDate: "22-11-2026",
    skuId: 105,
    skuName: "Fortune Sunlite Refined Sunflower Oil 1L",
    qty: 30,
    rate: 130,
    status: "placed",
  },
  {
    orderId: "ORD-102",
    orderNo: "ORD-102",
    customerName: "Renuka Traders",
    village: "Naregalla",
    orderDate: "22-11-2026",
    skuId: 105,
    skuName: "Fortune Sunlite Refined Sunflower Oil 1L",
    qty: 20,
    rate: 130,
    status: "packed",
  },
  {
    orderId: "ORD-103",
    orderNo: "ORD-103",
    customerName: "Basaveshwar General Store",
    village: "Rajur",
    orderDate: "22-11-2026",
    skuId: 105,
    skuName: "Fortune Sunlite Refined Sunflower Oil 1L",
    qty: 10,
    rate: 130,
    status: "invoiced",
  },
  {
    orderId: "ORD-104",
    orderNo: "ORD-104",
    customerName: "Shivanna Kirana Stores",
    village: "Gogeri",
    orderDate: "22-11-2026",
    skuId: 101,
    skuName: "Gajaraj Kesar Sooji 10Kg Bag",
    qty: 10,
    rate: 420,
    status: "placed",
  },
  {
    orderId: "ORD-105",
    orderNo: "ORD-105",
    customerName: "Annapurna Provisions",
    village: "Kalliganur",
    orderDate: "22-11-2026",
    skuId: 101,
    skuName: "Gajaraj Kesar Sooji 10Kg Bag",
    qty: 5,
    rate: 420,
    status: "packed",
  },
  {
    orderId: "ORD-106",
    orderNo: "ORD-106",
    customerName: "Ganesh Super Market",
    village: "Hirekoppa",
    orderDate: "22-11-2026",
    skuId: 108,
    skuName: "BUMTUM BABY DIAPER 12RS (M1 7-12 KG 1PANS PKT)",
    qty: 50,
    rate: 12,
    status: "placed",
  },
  {
    orderId: "ORD-107",
    orderNo: "ORD-107",
    customerName: "Vijay Traders",
    village: "Nidagundi",
    orderDate: "22-11-2026",
    skuId: 108,
    skuName: "BUMTUM BABY DIAPER 12RS (M1 7-12 KG 1PANS PKT)",
    qty: 30,
    rate: 12,
    status: "packed",
  },
  {
    orderId: "ORD-108",
    orderNo: "ORD-108",
    customerName: "Sri Guru Enterprises",
    village: "Halakeri",
    orderDate: "22-11-2026",
    skuId: 109,
    skuName: "Sona Masoori Rice Raw 25Kg Bag",
    qty: 20,
    rate: 1580,
    status: "placed",
  },
  {
    orderId: "ORD-109",
    orderNo: "ORD-109",
    customerName: "Sangameshwar Store",
    village: "Purthageri",
    orderDate: "22-11-2026",
    skuId: 109,
    skuName: "Sona Masoori Rice Raw 25Kg Bag",
    qty: 15,
    rate: 1580,
    status: "invoiced",
  },
  {
    orderId: "ORD-110",
    orderNo: "ORD-110",
    customerName: "Om Traders",
    village: "Lakkalakatti",
    orderDate: "22-11-2026",
    skuId: 111,
    skuName: "Sugar M-30 50Kg Bag",
    qty: 20,
    rate: 2150,
    status: "placed",
  },
  {
    orderId: "ORD-111",
    orderNo: "ORD-111",
    customerName: "Ravi Kirana",
    village: "Rampur",
    orderDate: "22-11-2026",
    skuId: 111,
    skuName: "Sugar M-30 50Kg Bag",
    qty: 10,
    rate: 2150,
    status: "packed",
  },
  {
    orderId: "ORD-112",
    orderNo: "ORD-112",
    customerName: "Pooja Stores",
    village: "Naregalla",
    orderDate: "22-11-2026",
    skuId: 103,
    skuName: "Maida 10Kg Bag",
    qty: 12,
    rate: 400,
    status: "placed",
  },
  {
    orderId: "ORD-113",
    orderNo: "ORD-113",
    customerName: "Prabhu General",
    village: "Goudageri",
    orderDate: "22-11-2026",
    skuId: 103,
    skuName: "Maida 10Kg Bag",
    qty: 8,
    rate: 400,
    status: "packed",
  },
  {
    orderId: "ORD-114",
    orderNo: "ORD-114",
    customerName: "Mallikarjun Kirana",
    village: "Jigeri",
    orderDate: "22-11-2026",
    skuId: 115,
    skuName: "Good Day Butter Biscuits 120g (Pack of 24)",
    qty: 15,
    rate: 672,
    status: "placed",
  },
  {
    orderId: "ORD-115",
    orderNo: "ORD-115",
    customerName: "Jyoti Stores",
    village: "Dyamhunashi",
    orderDate: "22-11-2026",
    skuId: 115,
    skuName: "Good Day Butter Biscuits 120g (Pack of 24)",
    qty: 10,
    rate: 672,
    status: "packed",
  },
  {
    orderId: "ORD-116",
    orderNo: "ORD-116",
    customerName: "Kuber Provisions",
    village: "Gulaguli",
    orderDate: "22-11-2026",
    skuId: 113,
    skuName: "Chana Dal 30Kg Bag",
    qty: 15,
    rate: 2600,
    status: "placed",
  },
  {
    orderId: "ORD-117",
    orderNo: "ORD-117",
    customerName: "Sujata Store",
    village: "Nellur",
    orderDate: "22-11-2026",
    skuId: 114,
    skuName: "Toor Dal Desi 30Kg Bag",
    qty: 10,
    rate: 4650,
    status: "placed",
  },
  {
    orderId: "ORD-118",
    orderNo: "ORD-118",
    customerName: "Shree Lakshmi Store",
    village: "Nagarashikoppa",
    orderDate: "22-11-2026",
    skuId: 106,
    skuName: "Gemini Pure & Gentle Refined Sunflower Oil 1L Pouch",
    qty: 30,
    rate: 128,
    status: "placed",
  },
  {
    orderId: "ORD-119",
    orderNo: "ORD-119",
    customerName: "Manjunath Kirana",
    village: "Mushigeri",
    orderDate: "22-11-2026",
    skuId: 106,
    skuName: "Gemini Pure & Gentle Refined Sunflower Oil 1L Pouch",
    qty: 15,
    rate: 128,
    status: "packed",
  },
  {
    orderId: "ORD-120",
    orderNo: "ORD-120",
    customerName: "Veerabhadreshwar Store",
    village: "Kuntoji",
    orderDate: "22-11-2026",
    skuId: 116,
    skuName: "Rin Detergent Bar 250g (Pack of 48)",
    qty: 20,
    rate: 1056,
    status: "placed",
  },
  {
    orderId: "ORD-121",
    orderNo: "ORD-121",
    customerName: "Anand Super Bazaar",
    village: "Lakkalakatti",
    orderDate: "22-11-2026",
    skuId: 112,
    skuName: "Tata Salt Crystal 1Kg (25 Pkts)",
    qty: 20,
    rate: 475,
    status: "placed",
  },
  {
    orderId: "ORD-122",
    orderNo: "ORD-122",
    customerName: "Maruti Traders",
    village: "Rajur",
    orderDate: "22-11-2026",
    skuId: 110,
    skuName: "Jeera Samba Rice 25Kg Bag",
    qty: 8,
    rate: 2100,
    status: "placed",
  },
  {
    orderId: "ORD-123",
    orderNo: "ORD-123",
    customerName: "Shri Hari Mart",
    village: "Halakeri",
    orderDate: "22-11-2026",
    skuId: 110,
    skuName: "Jeera Samba Rice 25Kg Bag",
    qty: 4,
    rate: 2100,
    status: "packed",
  },
  {
    orderId: "ORD-124",
    orderNo: "ORD-124",
    customerName: "Gajanan Kirana",
    village: "Gogeri",
    orderDate: "22-11-2026",
    skuId: 107,
    skuName: "Atta 1Kg 30Pcs Bag",
    qty: 18,
    rate: 1100,
    status: "placed",
  },
  {
    orderId: "ORD-125",
    orderNo: "ORD-125",
    customerName: "Bhavani Stores",
    village: "Nidagundi",
    orderDate: "22-11-2026",
    skuId: 104,
    skuName: "Namasthe Gram Flour 10Kg Bag",
    qty: 10,
    rate: 850,
    status: "placed",
  },
  {
    orderId: "ORD-126",
    orderNo: "ORD-126",
    customerName: "Siddalingeshwar Kirana",
    village: "Hirealagundi",
    orderDate: "22-11-2026",
    skuId: 102,
    skuName: "Gajaraj Kesar Sooji 30Kg Bag",
    qty: 8,
    rate: 1250,
    status: "placed",
  },
  {
    orderId: "ORD-127",
    orderNo: "ORD-127",
    customerName: "Kalyan Mart",
    village: "Matarangi",
    orderDate: "22-11-2026",
    skuId: 117,
    skuName: "Electric Kettle 1.8L Stainless Steel",
    qty: 5,
    rate: 699,
    status: "placed",
  },
  {
    orderId: "ORD-128",
    orderNo: "ORD-128",
    customerName: "Shanti Kirana",
    village: "Kodaganur",
    orderDate: "22-11-2026",
    skuId: 105,
    skuName: "Fortune Sunlite Refined Sunflower Oil 1L",
    qty: 5,
    rate: 130,
    status: "placed",
  },
  {
    orderId: "ORD-129",
    orderNo: "ORD-129",
    customerName: "Pragati Stores",
    village: "Myakalzeri",
    orderDate: "22-11-2026",
    skuId: 108,
    skuName: "BUMTUM BABY DIAPER 12RS (M1 7-12 KG 1PANS PKT)",
    qty: 10,
    rate: 12,
    status: "placed",
  },
];

const SKUS_STORAGE_KEY = "erp_wholesale_inventory_skus";
const AUDIT_DRAFT_KEY = "erp_wholesale_audit_draft";
const SAVED_AUDITS_KEY = "erp_wholesale_saved_audits";
const SUPER_AUDITS_KEY = "erp_wholesale_super_audits";

export function getStoredSkus(): InventorySku[] {
  try {
    const raw = localStorage.getItem(SKUS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SKUS_STORAGE_KEY, JSON.stringify(INITIAL_INVENTORY_SKUS));
      return INITIAL_INVENTORY_SKUS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INVENTORY_SKUS;
  }
}

export function saveStoredSkus(skus: InventorySku[]): void {
  try {
    localStorage.setItem(SKUS_STORAGE_KEY, JSON.stringify(skus));
  } catch (err) {
    console.error("Failed to save SKUs:", err);
  }
}

export function getStoredAuditDraft(): Record<number, number | string> {
  try {
    const raw = localStorage.getItem(AUDIT_DRAFT_KEY);
    return raw ? JSON.parse(raw) : { 101: 59, 105: 265 };
  } catch {
    return { 101: 59, 105: 265 };
  }
}

export function saveStoredAuditDraft(draft: Record<number, number | string>): void {
  try {
    localStorage.setItem(AUDIT_DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error("Failed to save audit draft:", err);
  }
}

export function getStoredSavedAudits(): SavedAudit[] {
  try {
    const raw = localStorage.getItem(SAVED_AUDITS_KEY);
    if (!raw) {
      const initial: SavedAudit[] = [
        {
          id: "AUD-20261122-01",
          date: "22-11-2026",
          time: "03:14 pm",
          auditor: "Vijaykumar Shantagiri",
          role: "Owner",
          status: "saved",
          netSales: 28697,
          inventoryClosingValue: 785640,
          lines: [
            {
              skuId: 101,
              name: "Gajaraj Kesar Sooji 10Kg Bag",
              code: "SKU-SOO-10",
              category: "Atta And Sooji Flours",
              closing: 59,
              phys: 59,
              diff: 0,
              grn: 380,
              diffAmount: 0,
              remarks: "Matched",
            },
            {
              skuId: 105,
              name: "Fortune Sunlite Refined Sunflower Oil 1L",
              code: "SKU-OIL-01",
              category: "Oil And Ghee",
              closing: 265,
              phys: 265,
              diff: 0,
              grn: 118,
              diffAmount: 0,
              remarks: "Matched",
            },
          ],
        },
      ];
      localStorage.setItem(SAVED_AUDITS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredSavedAudits(audits: SavedAudit[]): void {
  try {
    localStorage.setItem(SAVED_AUDITS_KEY, JSON.stringify(audits));
  } catch (err) {
    console.error("Failed to save audit reports:", err);
  }
}

export function getSuperStockAudits(): SavedAudit[] {
  try {
    const raw = localStorage.getItem(SUPER_AUDITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSuperStockAudits(audits: SavedAudit[]): void {
  try {
    localStorage.setItem(SUPER_AUDITS_KEY, JSON.stringify(audits));
  } catch (err) {
    console.error("Failed to save super stock audits:", err);
  }
}

export interface CategorySalesSummary {
  category: string;
  stockAmt: number;
  salesAmt: number;
  salesStockRatio: string;
  categorySalesShare: string;
}

export function getLiveSalesData(skus: InventorySku[]): {
  categories: CategorySalesSummary[];
  totalStockAmt: number;
  totalSalesAmt: number;
} {
  const catMap: Record<string, { stockAmt: number; salesAmt: number }> = {};

  skus.forEach((s) => {
    const cat = s.category || "Other";
    if (!catMap[cat]) {
      catMap[cat] = { stockAmt: 0, salesAmt: 0 };
    }
    catMap[cat].stockAmt += s.closing * s.cost;
    catMap[cat].salesAmt += s.sales * s.price;
  });

  const totalStockAmt = Object.values(catMap).reduce((a, b) => a + b.stockAmt, 0);
  const totalSalesAmt = Object.values(catMap).reduce((a, b) => a + b.salesAmt, 0);

  const categories: CategorySalesSummary[] = Object.entries(catMap).map(([cat, data]) => {
    const st = data.stockAmt;
    const sa = data.salesAmt;
    const salesStockRatio = st > 0 ? (Math.round((sa / st) * 10000) / 100).toFixed(2) + "%" : "0%";
    const categorySalesShare = totalSalesAmt > 0 ? (Math.round((sa / totalSalesAmt) * 10000) / 100).toFixed(2) + "%" : "0%";

    return {
      category: cat,
      stockAmt: st,
      salesAmt: sa,
      salesStockRatio,
      categorySalesShare,
    };
  });

  // Sort by salesAmt desc
  categories.sort((a, b) => b.salesAmt - a.salesAmt);

  return { categories, totalStockAmt, totalSalesAmt };
}
