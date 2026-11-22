export interface VendorRecord {
  id: number;
  name: string;
  gstin: string;
  ph: string;
  state: string;
  pan: string;
  addr: string;
  createdAt: string;
}

export interface PurchaseLine {
  skuId: number;
  skuName: string;
  qty: number;
  grnPrice: number;
  sellPrice: number;
  gstPercent: number;
  lineTotal: number;
}

export interface PurchaseRecord {
  id: number;
  date: string;
  vendorId: number;
  vendorName: string;
  invoiceNo: string;
  totalItems: number;
  totalAmount: number;
  status: "approved" | "pending";
  att?: string;
  lines: PurchaseLine[];
  createdAt: string;
}

export interface PurchaseReturnLine {
  skuId: number;
  skuName: string;
  purchasedQty: number;
  returnedEarlier: number;
  inStock: number;
  canReturn: number;
  grnPrice: number;
  returnQty: number;
  reason: string;
  amount: number;
}

export interface DebitNoteRecord {
  id: number;
  date: string;
  debitNoteNo: string;
  vendorId: number;
  vendorName: string;
  invoiceNo: string;
  totalItems: number;
  amount: number;
  status: "approved" | "pending";
  lines: PurchaseReturnLine[];
}

export interface AutoPoItem {
  id: number;
  skuName: string;
  stock: number;
  min: number;
  soldPerDay: number;
  suggestedQty: number;
  vendorId?: number;
  vendorName?: string;
}

export const INITIAL_VENDORS: VendorRecord[] = [
  {
    id: 1,
    name: "SHA HIRACHAND DONGARCHAND & CO",
    gstin: "29AAAFS1234F1Z5",
    ph: "9845012345",
    state: "Karnataka",
    pan: "AAAFS1234F",
    addr: "KIRANA BAZAR VIJAYAPUR 586101 Karnataka - 586101, India",
    createdAt: "2026-01-05",
  },
  {
    id: 2,
    name: "Sample Wholesale Distributors",
    gstin: "29AAAAA1111A1Z1",
    ph: "9845000000",
    state: "Karnataka",
    pan: "AAAAA1111A",
    addr: "APMC Yard, Vijayapura, Karnataka - 586102",
    createdAt: "2026-01-10",
  },
  {
    id: 3,
    name: "VIJAYAPURA KIRANA TRADERS",
    gstin: "29AABCV5678B1Z2",
    ph: "9845022222",
    state: "Karnataka",
    pan: "AABCV5678B",
    addr: "APMC Market Gate 1, Vijayapura, Karnataka - 586102",
    createdAt: "2026-02-15",
  },
  {
    id: 4,
    name: "BASAVESHWAR AGRO SUPPLIES",
    gstin: "29BBCDA3344C1Z9",
    ph: "9845033333",
    state: "Karnataka",
    pan: "BBCDA3344C",
    addr: "Station Road, Vijayapura, Karnataka - 586101",
    createdAt: "2026-03-01",
  },
  {
    id: 5,
    name: "SHREE SHANKAR CEREALS & PULSES",
    gstin: "29CCCDS8899D1Z4",
    ph: "9845044444",
    state: "Karnataka",
    pan: "CCCDS8899D",
    addr: "Grain Market, Bagalkot Road, Vijayapura - 586109",
    createdAt: "2026-03-20",
  },
];

export const INITIAL_PURCHASES: PurchaseRecord[] = [
  {
    id: 1,
    date: "2026-11-21",
    vendorId: 1,
    vendorName: "SHA HIRACHAND DONGARCHAND & CO",
    invoiceNo: "INV-SH-9921",
    totalItems: 3,
    totalAmount: 48500,
    status: "approved",
    createdAt: "2026-11-21",
    lines: [
      {
        skuId: 1,
        skuName: "Fortune Sunlite Refined Sunflower Oil 1L",
        qty: 150,
        grnPrice: 125,
        sellPrice: 138,
        gstPercent: 5,
        lineTotal: 18750,
      },
      {
        skuId: 2,
        skuName: "Aashirvaad Select Sharbati Atta 10kg",
        qty: 50,
        grnPrice: 420,
        sellPrice: 460,
        gstPercent: 5,
        lineTotal: 21000,
      },
      {
        skuId: 3,
        skuName: "Tata Salt Vacuum Evaporated Iodised Salt 1kg",
        qty: 350,
        grnPrice: 25,
        sellPrice: 28,
        gstPercent: 0,
        lineTotal: 8750,
      },
    ],
  },
];

export const INITIAL_DEBIT_NOTES: DebitNoteRecord[] = [
  {
    id: 1,
    date: "2026-11-20",
    debitNoteNo: "DN-2026-001",
    vendorId: 1,
    vendorName: "SHA HIRACHAND DONGARCHAND & CO",
    invoiceNo: "INV-SH-9921",
    totalItems: 1,
    amount: 2500,
    status: "approved",
    lines: [
      {
        skuId: 1,
        skuName: "Fortune Sunlite Refined Sunflower Oil 1L",
        purchasedQty: 150,
        returnedEarlier: 0,
        inStock: 140,
        canReturn: 140,
        grnPrice: 125,
        returnQty: 20,
        reason: "Damaged in transit",
        amount: 2500,
      },
    ],
  },
];

export const INITIAL_AUTO_PO: AutoPoItem[] = [
  {
    id: 1,
    skuName: "Fortune Sunlite Sunflower Oil 1L",
    stock: 12,
    min: 50,
    soldPerDay: 15.2,
    suggestedQty: 100,
    vendorId: 1,
    vendorName: "SHA HIRACHAND DONGARCHAND & CO",
  },
  {
    id: 2,
    skuName: "Aashirvaad Sharbati Atta 10kg",
    stock: 5,
    min: 30,
    soldPerDay: 8.4,
    suggestedQty: 50,
    vendorId: 2,
    vendorName: "Sample Wholesale Distributors",
  },
  {
    id: 3,
    skuName: "Tata Salt 1kg Pack",
    stock: 24,
    min: 100,
    soldPerDay: 28.5,
    suggestedQty: 200,
    vendorId: undefined,
    vendorName: undefined, // "No vendor" in red
  },
  {
    id: 4,
    skuName: "Madhur Pure & Hygienic Sugar 5kg",
    stock: 8,
    min: 40,
    soldPerDay: 12.0,
    suggestedQty: 80,
    vendorId: undefined,
    vendorName: undefined, // "No vendor" in red
  },
  {
    id: 5,
    skuName: "Brooke Bond Red Label Tea 500g",
    stock: 14,
    min: 45,
    soldPerDay: 9.6,
    suggestedQty: 60,
    vendorId: 3,
    vendorName: "VIJAYAPURA KIRANA TRADERS",
  },
];

const STORAGE_KEY_VENDORS = "erp_vendors_data";
const STORAGE_KEY_PURCHASES = "erp_purchases_data";
const STORAGE_KEY_DEBITS = "erp_debit_notes_data";

export function getStoredVendors(): VendorRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VENDORS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load vendors", e);
  }
  return INITIAL_VENDORS;
}

export function saveStoredVendors(list: VendorRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save vendors", e);
  }
}

export function getStoredPurchases(): PurchaseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PURCHASES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load purchases", e);
  }
  return INITIAL_PURCHASES;
}

export function saveStoredPurchases(list: PurchaseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save purchases", e);
  }
}

export function getStoredDebitNotes(): DebitNoteRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEBITS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load debit notes", e);
  }
  return INITIAL_DEBIT_NOTES;
}

export function saveStoredDebitNotes(list: DebitNoteRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DEBITS, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save debit notes", e);
  }
}

export const STATE_CODE_MAP: Record<string, string> = {
  "29": "Karnataka",
  "27": "Maharashtra",
  "30": "Goa",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "24": "Gujarat",
  "07": "Delhi",
};
