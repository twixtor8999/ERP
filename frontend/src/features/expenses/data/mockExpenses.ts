import { getStoredPurchases } from "@/features/purchases/data/mockPurchases";

export interface ExpenseRecord {
  id: number;
  date: string;
  cat: string;
  sub?: string;
  amt: number;
  paymentType: "Cash" | "Credit" | "Bank";
  paidTo?: string;
  veh?: string;
  billNo?: string;
  remarks?: string;
  ap?: {
    by: string;
    date: string;
    at: string;
  };
}

export interface InwardExpenseRecord {
  id: number;
  purchaseId?: number;
  date: string;
  invoiceNo: string;
  invoiceTotal: number;
  vendorName: string;
  expenseType: string;
  ap?: {
    by: string;
    date: string;
    at: string;
  };
}

export const EXPENSE_CATEGORIES = [
  "Office Expenses",
  "Vehicle Fuel & Diesel",
  "Vehicle Maintenance & Repair",
  "Staff Salary & Advance",
  "Tea, Snacks & Refreshments",
  "Shop Rent & Warehouse Lease",
  "Electricity & Utility Bills",
  "Packaging Materials & Gunny Bags",
  "Loading / Unloading Hamali Charges",
  "Printing, Stationery & Postage",
  "Miscellaneous Operating Expenses",
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 1,
    date: "2026-11-21",
    cat: "Vehicle Fuel & Diesel",
    sub: "Diesel 45L",
    amt: 4250,
    paymentType: "Cash",
    paidTo: "BPCL Vijayapura Auto Fuel",
    veh: "KA28AA6256",
    billNo: "PET-9912",
    remarks: "Fuel for Devara Hippargi delivery trip",
    ap: {
      by: "Vijaykumar Shantagiri (Admin)",
      date: "2026-11-21",
      at: "2026-11-21T18:30:00Z",
    },
  },
  {
    id: 2,
    date: "2026-11-22",
    cat: "Loading / Unloading Hamali Charges",
    sub: "Unloading Atta bags",
    amt: 650,
    paymentType: "Cash",
    paidTo: "Basappa & Team Hamali",
    remarks: "Unloading 150 bags from SHA Hirachand truck",
  },
  {
    id: 3,
    date: "2026-11-22",
    cat: "Tea, Snacks & Refreshments",
    sub: "Daily staff tea",
    amt: 180,
    paymentType: "Cash",
    paidTo: "Om Sai Tea Stall",
    remarks: "Morning and evening tea for packing team",
  },
];

const STORAGE_KEY_EXPENSES = "erp_wholesale_expenses";
const STORAGE_KEY_INWARD = "erp_wholesale_inward_expenses";

export function getStoredExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load expenses", e);
  }
  return INITIAL_EXPENSES;
}

export function saveStoredExpenses(list: ExpenseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save expenses", e);
  }
}

export function getStoredInwardExpenses(): InwardExpenseRecord[] {
  // Sync with stored purchases if available
  const purchases = getStoredPurchases();
  if (purchases && purchases.length > 0) {
    return purchases.map((p) => ({
      id: p.id,
      purchaseId: p.id,
      date: p.date,
      invoiceNo: p.invoiceNo,
      invoiceTotal: p.totalAmount,
      vendorName: p.vendorName,
      expenseType: "Purchase (Stock Inward)",
      ap: p.status === "approved" ? {
        by: "Owner / Admin",
        date: p.date,
        at: p.createdAt || "2026-11-21",
      } : undefined,
    }));
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_INWARD);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load inward expenses", e);
  }

  return [
    {
      id: 1,
      date: "2026-11-21",
      invoiceNo: "INV-SH-9921",
      invoiceTotal: 48500,
      vendorName: "SHA HIRACHAND DONGARCHAND & CO",
      expenseType: "Purchase (Stock Inward)",
      ap: {
        by: "Owner / Admin",
        date: "2026-11-21",
        at: "2026-11-21",
      },
    },
  ];
}

export function saveStoredInwardExpenses(list: InwardExpenseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_INWARD, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save inward expenses", e);
  }
}

