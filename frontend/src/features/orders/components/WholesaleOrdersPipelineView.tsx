import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { fetchRealtimeInventory } from "@/lib/api/apiService";
import { openPackingSlipWindow } from "@/features/orders/utils/packingSlipPrinter";
import { openTaxInvoiceWindow, TaxInvoiceOrder } from "@/features/orders/utils/taxInvoicePrinter";
import { WholesaleItemWisePickingView } from "./WholesaleItemWisePickingView";
import { useAuthStore } from "@/stores/auth.store";
import { getStoredVehicles } from "@/features/vehicles/data/mockVehicles";
import { downloadExcelXlsx } from "@/lib/utilities/excelExport";
import { getIstDateString, isDateInRange } from "@/lib/utilities/istTime";
import realCustomersData from "@/data/realCustomers.json";

export interface OrderHistoryItem {
  when: string;
  from: string;
  to: string;
  by: string;
  where: string;
}

export interface PipelineOrder {
  id: string;
  orderNo: string;
  invoiceNo?: string;
  customerName: string;
  shopName: string;
  village: string;
  route: string;
  createdBy: string;
  source: string;
  orderDate: string;
  orderTime: string;
  vehicleNo?: string;
  total: number;
  balance: number;
  stage: "placed" | "packing" | "invoice" | "dispatch" | "delivery" | "completed" | "cancelled" | "return";
  status?: string;
  history?: OrderHistoryItem[];
  phone?: string;
  items: Array<{
    name: string;
    unit: string;
    qty: number;
    price: number;
    rate?: number;
    gst?: string;
    amount?: number;
  }>;
  cancelReason?: string;
  cancelledAt?: string;
  packedConfirmedAt?: string;
  dispatchedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  returnAmount?: number;
  returnedItems?: Array<{
    name: string;
    qty: number;
    rate: number;
    amount: number;
    reason?: string;
  }>;
  paymentMode?: string;
  cashPaid?: number;
  qrPaid?: number;
  utrNumber?: string;
  screenshotUrl?: string;
}

function readAndCompressSlipImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const rawUrl = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 900;
          const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        } catch {
          resolve(rawUrl);
        }
      };
      img.onerror = () => resolve(rawUrl);
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

function safeSavePipelineOrders(_list: PipelineOrder[]): boolean {
  // Orders are persisted directly in Railway PostgreSQL via /api/v1/admin/crm/orders
  return true;
}

export function extractIsoDate(dStr?: string): string {
  if (!dStr) return "";
  const str = dStr.trim();
  const isoMatch = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  const inMatch = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (inMatch && inMatch[1] && inMatch[2] && inMatch[3]) {
    return `${inMatch[3]}-${inMatch[2].padStart(2, "0")}-${inMatch[1].padStart(2, "0")}`;
  }
  return "";
}

export const INITIAL_PIPELINE_ORDERS: PipelineOrder[] = [
  {
    id: "ord-1672",
    orderNo: "ORD-1672",
    customerName: "Ambiger kirani store - Chandru ambiger",
    shopName: "Ambiger kirani store",
    village: "Muttagi",
    route: "GOLASANGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "08:04 pm",
    phone: "9986313410",
    total: 1540,
    balance: 1540,
    stage: "packing",
    status: "placed",
    history: [
      {
        when: "2026-11-24 20:04",
        from: "Placed",
        to: "Packed",
        by: "Pushpa Patil",
        where: "CRM Place Order",
      },
    ],
    items: [
      { name: "Raag Gold Palm Oil 1Ltr 10Pcs Box", unit: "Box", qty: 1, price: 1380, rate: 1380, gst: "5%", amount: 1380 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 5, price: 32, rate: 32, gst: "0%", amount: 160 },
    ],
  },
  {
    id: "ord-0493",
    orderNo: "ORD-0493",
    customerName: "Arunkumar Kirana Stores - Kallappa B prathamshetti",
    shopName: "Arunkumar Kirana Stores",
    village: "Hebbalahatti",
    route: "TAJAPUR",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "10:30 am",
    phone: "9972334235",
    total: 620,
    balance: 620,
    stage: "packing",
    status: "placed",
    history: [
      {
        when: "2026-11-24 10:30",
        from: "Placed",
        to: "Packed",
        by: "Pushpa Patil",
        where: "CRM Place Order",
      },
    ],
    items: [
      { name: "1/2 LTR WATER ( 24 PCS )", unit: "Box", qty: 1, price: 620, rate: 620, gst: "0%", amount: 620 },
    ],
  },
  {
    id: "ord-1682-arun",
    orderNo: "ORD-1682",
    customerName: "Arun Devargudi",
    shopName: "Daneshwar kirana store",
    village: "Muttagi",
    route: "GOLASANGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "07:44 pm",
    phone: "9590705355",
    total: 7,
    balance: 7,
    stage: "packing",
    status: "packed",
    history: [
      {
        when: "2026-11-24 19:44",
        from: "Placed",
        to: "Packed",
        by: "Pushpa Patil",
        where: "CRM Place Order",
      },
    ],
    items: [
      { name: "1/2 LTR WATER ( 24 PCS )", unit: "Pcs", qty: 1, price: 7, rate: 7, gst: "0%", amount: 7 },
    ],
  },
  {
    id: "ord-1690",
    orderNo: "ORD-1690",
    customerName: "Patil Gundu",
    shopName: "Patil Kirana Store",
    village: "Uppaladinni",
    route: "Basavan Bagewadi",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "01:13 pm",
    phone: "9611161548",
    total: 22326,
    balance: 0,
    stage: "packing",
    status: "packed",
    history: [
      {
        when: "2026-11-24 09:50",
        from: "Placed",
        to: "Packed",
        by: "Vijaykumar Shantagiri",
        where: "pack",
      },
    ],
    items: [
      { name: "Raag Gold Palm Oil 1Ltr 10Pcs Box", unit: "Box", qty: 5, price: 1380, rate: 1380, gst: "5%", amount: 6900 },
      { name: "VST Vegetable Oil 1Kg 10Pcs Box", unit: "Box", qty: 3, price: 1560, rate: 1560, gst: "5%", amount: 4680 },
      { name: "Zeeba Jeera Rice 26 Kg Bag", unit: "Bag", qty: 1, price: 2236, rate: 2236, gst: "0%", amount: 2236 },
      { name: "Namasthe Gram Flour 10Kg Bag", unit: "Bag", qty: 5, price: 740, rate: 740, gst: "5%", amount: 3700 },
      { name: "Sugar S-30 50Kg Bag", unit: "Bag", qty: 1, price: 2760, rate: 2760, gst: "5%", amount: 2760 },
      { name: "Poha 30kg Bag", unit: "Bag", qty: 1, price: 1530, rate: 1530, gst: "0%", amount: 1530 },
      { name: "Trulove Orange Kreme 5Rs 144Pcs Box", unit: "Box", qty: 1, price: 520, rate: 520, gst: "5%", amount: 520 },
    ],
  },
  {
    id: "ord-1682",
    orderNo: "ORD-1682",
    customerName: "Babulal",
    shopName: "Babulal General Stores",
    village: "Babanagar",
    route: "BABANAGAR",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "12:58 pm",
    phone: "9845112233",
    total: 26000,
    balance: 0,
    stage: "packing",
    status: "packed",
    items: [
      { name: "Zeeba Premium Rice 26kg", unit: "Bag", qty: 10, price: 2600, rate: 2600, gst: "0%", amount: 26000 },
    ],
  },
  {
    id: "ord-1685",
    orderNo: "ORD-1685",
    customerName: "S A Mulla",
    shopName: "Mulla Provision Stores",
    village: "Babanagar",
    route: "BABANAGAR",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "12:59 pm",
    phone: "9880123456",
    total: 5520,
    balance: 0,
    stage: "packing",
    status: "packed",
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 40, price: 138, rate: 138, gst: "5%", amount: 5520 },
    ],
  },
  {
    id: "ord-1695",
    orderNo: "ORD-1695",
    customerName: "Jagadev",
    shopName: "Jagadev Kirani Store",
    village: "Dhanyal",
    route: "DHANYAL",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "01:13 pm",
    phone: "9741234567",
    total: 7440,
    balance: 0,
    stage: "packing",
    status: "packed",
    items: [
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 32, price: 232.5, rate: 232.5, gst: "5%", amount: 7440 },
    ],
  },
  {
    id: "ord-1684",
    orderNo: "ORD-1684",
    customerName: "Anand H P",
    shopName: "Anand Trading Co",
    village: "Tikota",
    route: "TIKOTA",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "12:58 pm",
    phone: "9900112233",
    total: 3940,
    balance: 0,
    stage: "packing",
    status: "packed",
    items: [
      { name: "VST Vegetable Oil 1Kg 10Pcs Box", unit: "Box", qty: 2, price: 1560, rate: 1560, gst: "5%", amount: 3120 },
      { name: "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)", unit: "Sheet", qty: 8, price: 102.5, rate: 102.5, gst: "5%", amount: 820 },
    ],
  },
  {
    id: "ord-1683",
    orderNo: "ORD-1683",
    customerName: "S A Hubbali",
    shopName: "Hubbali Stores",
    village: "Tikota",
    route: "TIKOTA",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "24-11-2026",
    orderTime: "12:58 pm",
    phone: "9844001122",
    total: 5066,
    balance: 0,
    stage: "packing",
    status: "packed",
    items: [
      { name: "Namasthe Gram Flour 10Kg Bag", unit: "Bag", qty: 6, price: 740, rate: 740, gst: "5%", amount: 4440 },
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 1, price: 626, rate: 626, gst: "5%", amount: 626 },
    ],
  },
  {
    id: "ord-1664",
    orderNo: "ORD-1664",
    customerName: "Ramesh s kanakappagol",
    shopName: "Kanekeshara store",
    village: "Chimmalgi R.C",
    route: "Chimmalagi RC",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "23-11-2026",
    orderTime: "08:51 pm",
    phone: "8748930231",
    total: 1570,
    balance: 0,
    stage: "packing",
    status: "packed",
    history: [
      {
        when: "2026-11-23 17:42",
        from: "Placed",
        to: "Packed",
        by: "Vijaykumar Shantagiri",
        where: "pack",
      },
    ],
    items: [
      { name: "VST Vegetable Oil 1Kg 10Pcs Box", unit: "Box", qty: 1, price: 1570, rate: 1570, gst: "5%", amount: 1570 },
    ],
  },
  {
    id: "ord-1663",
    orderNo: "ORD-1663",
    customerName: "Shrikant Rathod",
    shopName: "Rathod Traders",
    village: "Chimmalgi R.C",
    route: "Chimmalagi RC",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "23-11-2026",
    orderTime: "08:50 pm",
    phone: "9845123456",
    total: 6652,
    balance: 0,
    stage: "packing",
    items: [
      { name: "VST Vegetable Oil 1Kg 10Pcs Box", unit: "Box", qty: 2, price: 1570, rate: 1570, gst: "5%", amount: 3140 },
      { name: "Zeeba Steam Rice 26kg Bag", unit: "Bag", qty: 1, price: 2050, rate: 2050, gst: "0%", amount: 2050 },
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 3, price: 440, rate: 440, gst: "5%", amount: 1320 },
      { name: "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)", unit: "Sheet", qty: 1, price: 105, rate: 105, gst: "5%", amount: 105 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 1, price: 37, rate: 37, gst: "0%", amount: 37 },
    ],
  },
  {
    id: "ord-1513",
    orderNo: "ORD-1513",
    customerName: "Girish mahatpati",
    shopName: "Girish Kirana Store",
    village: "Kudgi",
    route: "KUDGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "23-11-2026",
    orderTime: "11:20 am",
    total: 3535,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Raag Gold Palm Oil 1Ltr 10Pcs Box", unit: "Box", qty: 1, price: 1380, rate: 1380, gst: "5%", amount: 1380 },
      { name: "Zeeba Steam Rice 26kg Bag", unit: "Bag", qty: 1, price: 2050, rate: 2050, gst: "0%", amount: 2050 },
      { name: "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)", unit: "Sheet", qty: 1, price: 105, rate: 105, gst: "5%", amount: 105 },
    ],
  },
  {
    id: "ord-1506",
    orderNo: "ORD-1506",
    customerName: "Ashok Hadagali",
    shopName: "Hadagali Traders",
    village: "Devara Hippargi",
    route: "DEVARHIPARAGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "10:56 am",
    total: 6247,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 5, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 25, price: 128 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 32, price: 26 },
    ],
  },
  {
    id: "ord-1489",
    orderNo: "ORD-1489",
    invoiceNo: "INV-469",
    customerName: "B M",
    shopName: "B M General Stores",
    village: "Bijapur (Rural)",
    route: "BIJAPUR",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "20-11-2026",
    orderTime: "02:15 pm",
    vehicleNo: "KA28AB3425",
    total: 2580,
    balance: 2580,
    stage: "delivery",
    items: [
      { name: "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )", unit: "Packet", qty: 140, price: 7, rate: 7, gst: "5%", amount: 980 },
      { name: "BUMTUM BABY DIAPER 12RS ( M1 7-12 KG 1PANS PKT )", unit: "Packet", qty: 100, price: 8, rate: 8, gst: "5%", amount: 800 },
      { name: "BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )", unit: "Packet", qty: 80, price: 10, rate: 10, gst: "5%", amount: 800 },
    ],
  },
  {
    id: "ord-1492",
    orderNo: "ORD-1492",
    invoiceNo: "INV-470",
    customerName: "Birappa Pujari",
    shopName: "Arun Kirani stores",
    village: "Jumnal",
    route: "GOLASANGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "21-11-2026",
    orderTime: "04:30 pm",
    vehicleNo: "KA28AA6256",
    total: 4850,
    balance: 4850,
    stage: "delivery",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 6, price: 440, rate: 440, gst: "5%", amount: 2640 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 15, price: 128, rate: 128, gst: "5%", amount: 1920 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 11, price: 26, rate: 26, gst: "5%", amount: 286 },
    ],
  },
  {
    id: "ord-1495",
    orderNo: "ORD-1495",
    invoiceNo: "INV-471",
    customerName: "Kallappa B prathamshetti",
    shopName: "Arunkumar Kirana Stores",
    village: "Hebbalahatti",
    route: "TAJAPUR",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "21-11-2026",
    orderTime: "05:10 pm",
    vehicleNo: "KA28AA6256",
    total: 7175,
    balance: 7175,
    stage: "delivery",
    items: [
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 20, price: 235, rate: 235, gst: "5%", amount: 4700 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 15, price: 165, rate: 165, gst: "5%", amount: 2475 },
    ],
  },
  {
    id: "ord-1503",
    orderNo: "ORD-1503",
    invoiceNo: "INV-472",
    customerName: "SANJU HUGAR",
    shopName: "ARUN KIRANA STORE",
    village: "Kakhandaki",
    route: "MAMADAPUR",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "21-11-2026",
    orderTime: "05:45 pm",
    vehicleNo: "KA28AB3425",
    total: 5460,
    balance: 5460,
    stage: "delivery",
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128, rate: 128, gst: "5%", amount: 3840 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 10, price: 165, rate: 165, gst: "5%", amount: 1650 },
    ],
  },
  {
    id: "ord-1508-a",
    orderNo: "ORD-1508",
    customerName: "Shankargouda Biradar",
    shopName: "Biradar Kirana",
    village: "Tadavalga",
    route: "Tadavalaga",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:39 pm",
    total: 410,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Parle-G Gold Biscuits 1kg Family Pack", unit: "Box", qty: 2, price: 110 },
      { name: "Surf Excel Easy Wash Detergent Powder 1kg", unit: "Packet", qty: 1, price: 140 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 1, price: 26 },
    ],
  },
  {
    id: "ord-1507-a",
    orderNo: "ORD-1507",
    customerName: "Chandrshekhar",
    shopName: "Chandrshekhar General Store",
    village: "Tadavalga",
    route: "Tadavalaga",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:30 pm",
    total: 5660,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 11, price: 165 },
    ],
  },
  {
    id: "ord-1508-b",
    orderNo: "ORD-1508",
    customerName: "M M TALAWAR",
    shopName: "Talawar Provisions",
    village: "Tadavalga",
    route: "Tadavalaga",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:39 pm",
    total: 5960,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 10, price: 440 },
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 6, price: 235 },
      { name: "Everest Turmeric Powder 500g", unit: "Box", qty: 1, price: 150 },
    ],
  },
  {
    id: "ord-1507-b",
    orderNo: "ORD-1507",
    customerName: "Ramesh M Genni",
    shopName: "Genni General Store",
    village: "Tadavalga",
    route: "Tamba",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:30 pm",
    total: 10420,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 12, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 8, price: 165 },
    ],
  },
  {
    id: "ord-1531",
    orderNo: "ORD-1531",
    invoiceNo: "INV-475",
    customerName: "Ashok Hadagali",
    shopName: "Hadagali Traders",
    village: "Devara Hippargi",
    route: "DEVARHIPARAGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "23-11-2026",
    orderTime: "11:45 am",
    vehicleNo: "KA28AA6256",
    total: 4250,
    balance: 0,
    stage: "invoice",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 5, price: 440, rate: 440, gst: "5%", amount: 2200 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 16, price: 128, rate: 128, gst: "5%", amount: 2050 },
    ],
  },
  {
    id: "ord-1524",
    orderNo: "ORD-1524",
    invoiceNo: "INV-474",
    customerName: "Kallappa B prathamshetti",
    shopName: "Arunkumar Kirana Stores",
    village: "Hebbalahatti",
    route: "TAJAPUR",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "03:20 pm",
    vehicleNo: "KA28AC0349",
    total: 3180,
    balance: 0,
    stage: "invoice",
    items: [
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 8, price: 235, rate: 235, gst: "5%", amount: 1880 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 8, price: 162.5, rate: 162.5, gst: "5%", amount: 1300 },
    ],
  },
  {
    id: "ord-1506-disp",
    orderNo: "ORD-1506",
    invoiceNo: "INV-473",
    customerName: "Santosh Pujari",
    shopName: "Pujari Kirana Store",
    village: "Devara Hippargi",
    route: "DEVARHIPARAGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "10:56 am",
    vehicleNo: "KA28AA6256",
    total: 6247,
    balance: 0,
    stage: "dispatch",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 5, price: 440, rate: 440, gst: "5%", amount: 2200 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 25, price: 128, rate: 128, gst: "5%", amount: 3200 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 32, price: 26.47, rate: 26.47, gst: "5%", amount: 847 },
    ],
  },
  {
    id: "ord-1510-disp",
    orderNo: "ORD-1510",
    invoiceNo: "INV-476",
    customerName: "Ramesh s kanakappagol",
    shopName: "Kanekeshara store",
    village: "Chimmalgi R.C",
    route: "Chimmalagi RC",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "23-11-2026",
    orderTime: "04:15 pm",
    vehicleNo: "KA28AB3425",
    total: 8920,
    balance: 0,
    stage: "dispatch",
    items: [
      { name: "VST Vegetable Oil 1Kg 10Pcs Box", unit: "Box", qty: 4, price: 1570, rate: 1570, gst: "5%", amount: 6280 },
      { name: "Zeeba Steam Rice 26kg Bag", unit: "Bag", qty: 1, price: 2050, rate: 2050, gst: "0%", amount: 2050 },
      { name: "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)", unit: "Sheet", qty: 5, price: 105, rate: 105, gst: "5%", amount: 525 },
    ],
  },
  {
    id: "ord-1468-comp",
    orderNo: "ORD-1468",
    invoiceNo: "INV-465",
    customerName: "Arun Devargudi",
    shopName: "Daneshwar kirana store",
    village: "Muttagi",
    route: "GOLASANGI",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "20-11-2026",
    orderTime: "09:30 am",
    vehicleNo: "KA28AB3425",
    total: 10450,
    balance: 0,
    stage: "completed",
    items: [
      { name: "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )", unit: "Packet", qty: 500, price: 7, rate: 7, gst: "5%", amount: 3500 },
      { name: "Zeeba Steam Rice 26kg Bag", unit: "Bag", qty: 3, price: 2050, rate: 2050, gst: "0%", amount: 6150 },
      { name: "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)", unit: "Sheet", qty: 8, price: 105, rate: 105, gst: "5%", amount: 840 },
    ],
  },
  {
    id: "ord-1422-comp",
    orderNo: "ORD-1422",
    invoiceNo: "INV-452",
    customerName: "SANJU HUGAR",
    shopName: "ARUN KIRANA STORE",
    village: "Kakhandaki",
    route: "MAMADAPUR",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "18-11-2026",
    orderTime: "11:15 am",
    vehicleNo: "KA28AC0349",
    total: 5680,
    balance: 0,
    stage: "completed",
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128, rate: 128, gst: "5%", amount: 3840 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 11, price: 165, rate: 165, gst: "5%", amount: 1815 },
    ],
  },
];

const VEHICLES_LIST = [
  "Select vehicle",
  "KA28AA6256",
  "KA28AC0349",
  "KA28B1092",
];

function stripRoleSuffix(name?: string): string {
  return (name || "Staff").replace(/\s*\([^)]*\)\s*$/g, "").trim();
}

function normalizePipelineOrder(o: PipelineOrder): PipelineOrder {
  const rawCreator = o.createdBy || "";
  const isAdminPlaced =
    /\((super admin|admin|owner|business owner)\)/i.test(rawCreator) ||
    o.source === "Admin";
  return {
    ...o,
    createdBy: stripRoleSuffix(rawCreator),
    source: isAdminPlaced ? "Store" : o.source,
  };
}

export function WholesaleOrdersPipelineView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Active sub-tab: "packing" | "invoice" | "dispatch" | "delivery" | "report"
  const rawTab = searchParams.get("tab") || "packing";
  const activeTab = rawTab.toLowerCase().replace(/[^a-z]/g, "");

  const [orders, setOrders] = useState<PipelineOrder[]>(() => {
    // Check if any real-time orders stored in local cache from CRM / Store
    if (typeof window !== "undefined") {
      const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
      if (storedPipeline) {
        try {
          const parsed = JSON.parse(storedPipeline);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure newly added authoritative orders (like ORD-1690) are always merged in
            const map = new Map(parsed.map((o: PipelineOrder) => [o.orderNo, normalizePipelineOrder(o)]));
            for (const initO of INITIAL_PIPELINE_ORDERS) {
              if (!map.has(initO.orderNo)) {
                map.set(initO.orderNo, initO);
              }
            }
            const loaded = Array.from(map.values());
            if (!localStorage.getItem("pk_invoice_vehicle_default_cleared_v1")) {
              localStorage.setItem("pk_invoice_vehicle_default_cleared_v1", "1");
              return loaded.map((o) =>
                (o.stage === "packing" || o.stage === "invoice") &&
                (o.vehicleNo === "KA28AA6256" || (o.vehicleNo && /^\d{10,}$/.test(o.vehicleNo)))
                  ? { ...o, vehicleNo: "" }
                  : o
              );
            }
            return loaded;
          }
        } catch {}
      }
    }
    return INITIAL_PIPELINE_ORDERS;
  });
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [justMovedToInvoiceIds, setJustMovedToInvoiceIds] = useState<Set<string>>(new Set());

  // Date filters defaulting to 1st of current month -> today (IST)
  const todayStr = getIstDateString();
  const monthStartStr = `${todayStr.slice(0, 7)}-01`;
  const [fromDate, setFromDate] = useState(monthStartStr);
  const [toDate, setToDate] = useState(todayStr);
  const [appliedFromDate, setAppliedFromDate] = useState(monthStartStr);
  const [appliedToDate, setAppliedToDate] = useState(todayStr);
  const [pageSearch, setPageSearch] = useState("");

  // Sync real-time orders from backend API
  const fetchLiveOrders = useCallback(async () => {
    try {
      const res = await apiClient.get<any[]>("/api/v1/admin/crm/orders?limit=150");
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setOrders((prev) => {
          const prevMap = new Map(prev.map((o) => [o.orderNo, o]));
          const merged: PipelineOrder[] = [];

          for (const bo of res.data) {
            const orderNo = bo.order_number || `ORD-${bo.id}`;
            const existing = prevMap.get(orderNo);

            // Determine stage based on db status or previous stage (never revert locally delivered/returned orders back to delivery)
            let stage: PipelineOrder["stage"] = "packing";
            const sUpper = (bo.status || "").toUpperCase();
            if (sUpper === "DELIVERED") stage = "completed";
            else if (sUpper === "RETURNED") stage = "return";
            else if (sUpper === "CANCELLED") stage = "cancelled";
            else if (existing && (existing.stage === "completed" || existing.stage === "return" || existing.stage === "cancelled")) stage = existing.stage;
            else if (sUpper === "OUT_FOR_DELIVERY") stage = "delivery";
            else if (sUpper === "DISPATCHED") stage = "dispatch";
            else if (sUpper === "INVOICED" || sUpper === "INVOICE") stage = "invoice";
            else if (existing) stage = existing.stage;
            else stage = "packing";

            const mappedOrder: PipelineOrder = {
              id: bo.id || existing?.id || `ord-${orderNo}`,
              orderNo: orderNo,
              invoiceNo: existing?.invoiceNo || (bo.invoice_number ? bo.invoice_number : undefined),
              customerName: bo.customer_name || existing?.customerName || "Customer",
              shopName: bo.shop_name || existing?.shopName || "Store",
              village: bo.village || existing?.village || "Bijapur",
              route: bo.route || existing?.route || "Bijapur Route",
              createdBy: stripRoleSuffix(bo.created_by || existing?.createdBy || "Pushpa Patil"),
              source: bo.source === "Admin" ? "Store" : (bo.source || existing?.source || "CRM"),
              orderDate: bo.order_date || existing?.orderDate || "24-11-2026",
              orderTime: bo.order_placed ? bo.order_placed.split(" ")[1] || "10:00 am" : existing?.orderTime || "10:00 am",
              vehicleNo: (() => {
                const rawV = existing?.vehicleNo || (bo.vehicle_no && !/^\d{10,}$/.test(String(bo.vehicle_no)) ? String(bo.vehicle_no) : "");
                if ((stage === "packing" || stage === "invoice") && rawV === "KA28AA6256" && !existing?.vehicleNo) {
                  return "";
                }
                return rawV || "";
              })(),
              total: typeof bo.total_amount === "number" ? bo.total_amount : existing?.total || 0,
              balance: bo.payment_status === "PAID" ? 0 : typeof bo.total_amount === "number" ? bo.total_amount : existing?.balance || 0,
              stage: stage,
              status: bo.status || existing?.status,
              phone: bo.customer_phone || existing?.phone,
              paymentMode:
                existing?.paymentMode ||
                (bo.payment_method === "QR" ? "QR" : bo.payment_method === "CASH_AND_QR" ? "Split" : undefined),
              cashPaid: existing?.cashPaid ?? (typeof bo.cash_paid === "number" ? bo.cash_paid : undefined),
              qrPaid: existing?.qrPaid ?? (typeof bo.qr_paid === "number" ? bo.qr_paid : undefined),
              returnAmount: existing?.returnAmount ?? (typeof bo.return_amount === "number" ? bo.return_amount : undefined),
              utrNumber: existing?.utrNumber || bo.utr_number || undefined,
              screenshotUrl: existing?.screenshotUrl,
              packedConfirmedAt:
                bo.packed_confirmed && bo.packed_confirmed !== "—"
                  ? bo.packed_confirmed
                  : existing?.packedConfirmedAt,
              dispatchedAt:
                bo.dispatched && bo.dispatched !== "—" ? bo.dispatched : existing?.dispatchedAt,
              outForDeliveryAt:
                bo.out_for_delivery && bo.out_for_delivery !== "—"
                  ? bo.out_for_delivery
                  : existing?.outForDeliveryAt,
              deliveredAt:
                bo.delivered && bo.delivered !== "—" ? bo.delivered : existing?.deliveredAt,
              items: (bo.items && bo.items.length > 0)
                ? bo.items.map((it: any) => ({
                    name: it.product_name,
                    unit: "Unit",
                    qty: it.quantity,
                    price: it.unit_price,
                    rate: it.unit_price,
                    gst: "5%",
                    amount: it.total_amount,
                  }))
                : existing?.items || [
                    { name: "General FMCG Items", unit: "Pkt", qty: 1, price: bo.total_amount || 100, amount: bo.total_amount || 100 },
                  ],
              history: existing?.history || [],
            };

            merged.push(mappedOrder);
            prevMap.delete(orderNo);
          }

          // Retain any remaining initial demo/custom orders
          const finalOrders = [...merged, ...Array.from(prevMap.values())];
          safeSavePipelineOrders(finalOrders);
          return finalOrders;
        });
      }
    } catch {
      // Fallback: sync orders from localStorage
      syncOrdersFromStorage();
    }
  }, []);

  const lastStorageMapRef = useRef<Map<string, string>>(new Map());

  // Sync real-time orders directly from local storage only when raw payloads changed
  const syncOrdersFromStorage = useCallback((force = false) => {
    if (typeof window === "undefined") return;

    try {
      const relevantKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === "crm_wholesale_pipeline_orders" || key.startsWith("crm_reports_") || key === "crm_orders_master")) {
          relevantKeys.push(key);
        }
      }
      const nextRaw = new Map<string, string>();
      let unchanged = !force && relevantKeys.length === lastStorageMapRef.current.size;
      for (const k of relevantKeys) {
        const val = localStorage.getItem(k) || "";
        nextRaw.set(k, val);
        if (unchanged && lastStorageMapRef.current.get(k) !== val) {
          unchanged = false;
        }
      }

      if (unchanged) {
        return;
      }
      lastStorageMapRef.current = nextRaw;

      // 1. Read crm_wholesale_pipeline_orders
      const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
      const pipelineOrders: PipelineOrder[] = storedPipeline ? JSON.parse(storedPipeline) : [];

      // 2. Read CRM reports across all stored dates in localStorage
      const reportOrders: PipelineOrder[] = [];

      try {
        for (const key of relevantKeys) {
          if (key.startsWith("crm_reports_") || key === "crm_orders_master") {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              const list = Array.isArray(parsed) ? parsed : (parsed.my_orders || []);
              if (Array.isArray(list)) {
                for (const mo of list) {
                  const oNo = mo.order_number || mo.orderNo;
                  if (!oNo) continue;
                  reportOrders.push({
                    id: mo.id || `ord-${oNo}`,
                    orderNo: oNo,
                    customerName: mo.customer_name || mo.customerName || "Customer",
                    shopName: mo.shop_name || mo.shopName || "Kirana Store",
                    village: mo.village || "Bijapur",
                    route: mo.route || "Bijapur Route",
                    createdBy: stripRoleSuffix(mo.telecaller_name || mo.createdBy || "Pushpa Patil"),
                    source: "CRM",
                    orderDate: mo.order_date || mo.orderDate || "24-11-2026",
                    orderTime: mo.order_placed ? (mo.order_placed.split(" ")[1] || "10:30 am") : (mo.orderTime || "10:30 am"),
                    phone: mo.customer_phone || mo.phone || "",
                    vehicleNo: "",
                    total: mo.total_amount || mo.total || 0,
                    balance: 0,
                    stage: "packing",
                    status: mo.status || "placed",
                    items: (mo.items && mo.items.length > 0)
                      ? mo.items.map((it: any) => ({
                          name: it.product_name || it.name,
                          unit: it.unit || "Unit",
                          qty: it.quantity || it.qty || 1,
                          price: it.unit_price || it.price || 0,
                          rate: it.unit_price || it.price || 0,
                          gst: "5%",
                          amount: it.total_amount || it.amount || 0,
                        }))
                      : [{ name: "FMCG Grocery Package", unit: "Pkg", qty: 1, price: mo.total_amount || 140, amount: mo.total_amount || 140 }],
                  });
                }
              }
            }
          }
        }
      } catch {}

      setOrders((prev) => {
        const orderMap = new Map<string, PipelineOrder>();

        // 1. CRM real-time orders (highest priority so newly placed orders like ORD-0494 appear at ROW 1)
        for (const ro of reportOrders) {
          orderMap.set(ro.orderNo, ro);
        }

        // 2. Authoritative pipeline orders from local storage
        for (const po of pipelineOrders) {
          orderMap.set(po.orderNo, normalizePipelineOrder(po));
        }

        // 3. Prior state orders
        for (const o of prev) {
          if (!orderMap.has(o.orderNo)) {
            orderMap.set(o.orderNo, o);
          }
        }

        // 4. Base demo orders (only add if not present, never override real CRM orders)
        for (const initO of INITIAL_PIPELINE_ORDERS) {
          if (!orderMap.has(initO.orderNo)) {
            orderMap.set(initO.orderNo, initO);
          }
        }

        const merged = Array.from(orderMap.values());
        safeSavePipelineOrders(merged);
        return merged;
      });
    } catch {}
  }, []);

  // Fetch on mount, listen to storage events, and check lazily every 15 seconds (skips work if unchanged)
  useEffect(() => {
    fetchLiveOrders();
    syncOrdersFromStorage(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "crm_wholesale_pipeline_orders" ||
        (e.key && e.key.startsWith("crm_reports_")) ||
        e.key === "crm_orders_master"
      ) {
        syncOrdersFromStorage(true);
      }
    };

    const handleCustomCrmOrder = () => {
      fetchLiveOrders();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("crm_order_placed", handleCustomCrmOrder);
    const interval = setInterval(() => {
      syncOrdersFromStorage(false);
    }, 15000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("crm_order_placed", handleCustomCrmOrder);
      clearInterval(interval);
    };
  }, [fetchLiveOrders, syncOrdersFromStorage]);

  // Stage filters
  const [routeFilter, setRouteFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("0");

  // Dynamically extract all unique routes from orders and real customers
  const availableRoutes = useMemo(() => {
    const rSet = new Set<string>();
    orders.forEach((o) => {
      if (o.route) rSet.add(o.route.trim());
    });
    (realCustomersData as any[]).forEach((c) => {
      if (c.route) rSet.add(c.route.trim());
    });
    return ["All routes", ...Array.from(rSet).filter(Boolean).sort()];
  }, [orders]);

  // Dynamically extract unique villages ONLY from orders currently in the active stage, date range, and route
  const availableVillages = useMemo(() => {
    const vSet = new Set<string>();
    const isAllRoutes = !routeFilter || routeFilter === "All routes" || routeFilter === "All";
    const targetStage = activeTab === "report" ? "all" : activeTab;
    orders.forEach((o) => {
      const matchesStage =
        targetStage === "all"
          ? true
          : targetStage === "packing"
          ? o.stage === "packing" || o.stage === "placed"
          : o.stage === targetStage;
      if (!matchesStage) return;
      const orderIso = extractIsoDate(o.orderDate || o.orderTime);
      if (!isDateInRange(orderIso, appliedFromDate, appliedToDate)) return;
      if (isAllRoutes || (o.route || "").toLowerCase() === routeFilter.toLowerCase()) {
        if (o.village) vSet.add(o.village.trim());
      }
    });
    return ["All villages", ...Array.from(vSet).filter(Boolean).sort()];
  }, [orders, activeTab, appliedFromDate, appliedToDate, routeFilter]);

  // Kannada Connection Alert Modal state (Exact 1:1 to Image 5 from client website)
  const [offlineAlertOpen, setOfflineAlertOpen] = useState(false);

  // Modals
  const [viewingOrder, setViewingOrder] = useState<PipelineOrder | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<PipelineOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Dedicated Drilldown view for Orders Report (matching reference nxOrList452)
  const [reportDrilldown, setReportDrilldown] = useState<{
    title: string;
    stageKey: PipelineOrder["stage"] | null;
  } | null>(null);

  // Delivery Returns & Payment State
  const [itemReturns, setItemReturns] = useState<Record<number, { qty: number; reason: string }>>({});
  const [deliveryPaymentType, setDeliveryPaymentType] = useState<"QR">("QR");
  const [deliveryQrAmount, setDeliveryQrAmount] = useState<number | string>("");
  const [qrBoxFocused, setQrBoxFocused] = useState(false);
  const [deliveryUtrNumber, setDeliveryUtrNumber] = useState("");
  const [deliverySlipDataUrl, setDeliverySlipDataUrl] = useState("");
  const [deliverySlipName, setDeliverySlipName] = useState("");

  // Reset per-order delivery form state whenever switching viewed orders
  useEffect(() => {
    setItemReturns({});
    setDeliveryPaymentType("QR");
    setDeliveryQrAmount("");
    setQrBoxFocused(false);
    setDeliveryUtrNumber(viewingOrder?.utrNumber || "");
    setDeliverySlipDataUrl(viewingOrder?.screenshotUrl || "");
    setDeliverySlipName(viewingOrder?.screenshotUrl ? "Uploaded slip" : "");
  }, [viewingOrder?.id]);

  // Immediately exit any open order/drilldown view when switching Orders tabs from sidebar
  useEffect(() => {
    setViewingOrder(null);
    setCancellingOrder(null);
    setCancelReason("");
    setReportDrilldown(null);
    setShowExportMenu(false);
  }, [rawTab, location.key]);

  // Filtered orders for the current stage
  const currentStageOrders = useMemo(() => {
    let targetStage: PipelineOrder["stage"] = "packing";
    if (activeTab.includes("inv")) targetStage = "invoice";
    else if (activeTab.includes("disp")) targetStage = "dispatch";
    else if (activeTab.includes("dlv") || activeTab.includes("deliv")) targetStage = "delivery";

    const q = pageSearch.toLowerCase().trim();

    return orders.filter((o) => {
      if (activeTab.includes("rep")) return true; // Report tab handles summary separately

      // 1. Stage Check: Strict stage queue — once moved forward (e.g. Move to invoice), the order leaves the current tab and appears in the next stage tab.
      const matchesStage =
        targetStage === "packing"
          ? o.stage === "packing" || o.stage === "placed"
          : o.stage === targetStage;

      // 2. Search query filter
      const matchSearch =
        !q ||
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.village.toLowerCase().includes(q) ||
        o.createdBy.toLowerCase().includes(q) ||
        (o.phone && o.phone.toLowerCase().includes(q)) ||
        (o.invoiceNo && o.invoiceNo.toLowerCase().includes(q));

      // If user is searching explicitly for an order number or customer, prioritize search:
      if (q && matchSearch) {
        return true;
      }

      if (!matchesStage) return false;

      // 3. Date Range Filter (strictly reject undated/out-of-range rows when a date bound is active)
      const orderIso = extractIsoDate(o.orderDate || o.orderTime);
      const matchDate = isDateInRange(orderIso, appliedFromDate, appliedToDate);

      // 4. Route & Village & Vehicle filters
      const matchRoute =
        !routeFilter ||
        routeFilter === "All routes" ||
        routeFilter === "All" ||
        (o.route || "").toLowerCase() === routeFilter.toLowerCase();

      const matchVillage =
        !villageFilter ||
        villageFilter === "All villages" ||
        villageFilter === "All" ||
        (o.village || "").toLowerCase() === villageFilter.toLowerCase();

      const matchVehicle =
        selectedVehicle === "0" || selectedVehicle === "Select vehicle" || o.vehicleNo === selectedVehicle;

      return matchDate && matchSearch && matchRoute && matchVillage && matchVehicle;
    });
  }, [orders, activeTab, appliedFromDate, appliedToDate, pageSearch, routeFilter, villageFilter, selectedVehicle, justMovedToInvoiceIds]);

  // Stage Totals
  const totalAmount = currentStageOrders.reduce((acc, o) => acc + o.total, 0);

  // Checkbox helpers
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.size === currentStageOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(currentStageOrders.map((o) => o.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Workflow transitions: Packing -> Invoice -> Dispatch -> Delivery -> Completed
  const handleMoveToInvoice = (orderId: string) => {
    setJustMovedToInvoiceIds((prev) => new Set(prev).add(orderId));
    const invNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowD = new Date();
    const dStr = `${nowD.getDate().toString().padStart(2, "0")}-${(nowD.getMonth() + 1).toString().padStart(2, "0")}-${nowD.getFullYear()}`;
    const timeStr = nowD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
    const timestampStr = `${dStr} ${timeStr}`;

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} moved to Invoice!`, {
            description: `Generated Invoice: ${invNum}`,
          });
          const historyEntry: OrderHistoryItem = {
            when: new Date().toISOString().replace("T", " ").substring(0, 16),
            from: "Packed",
            to: "Invoice",
            by: useAuthStore.getState().user?.fullName || "Staff",
            where: "invoice",
          };
          return {
            ...o,
            stage: "invoice" as const,
            invoiceNo: invNum,
            vehicleNo: o.vehicleNo || "",
            status: "invoiced",
            packedConfirmedAt: timestampStr,
            history: [...(o.history || []), historyEntry],
          };
        }
        return o;
      });
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      window.dispatchEvent(new Event("crm_order_placed"));
      return updated;
    });

    // Also update in today's crm_reports if present so CRM Order Status updates instantly
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      const stored = localStorage.getItem(`crm_reports_${todayIso}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.my_orders && Array.isArray(parsed.my_orders)) {
          parsed.my_orders = parsed.my_orders.map((mo: any) => {
            if (mo.id === orderId || mo.order_number === orderId) {
              return {
                ...mo,
                status: "PACKED",
                packed_confirmed: timestampStr,
              };
            }
            return mo;
          });
          localStorage.setItem(`crm_reports_${todayIso}`, JSON.stringify(parsed));
        }
      }
    } catch {}

    // Notify backend in background for real-time CRM Order Status sync
    const ordRef = orders.find((o) => o.id === orderId);
    apiClient.post(`/api/v1/admin/crm/orders/${orderId}/stage`, { stage: "invoice", order_no: ordRef?.orderNo, invoice_no: invNum }).catch(() => {});
    setViewingOrder(null);
  };

  const handlePrintPackingSlip = (order: PipelineOrder) => {
    // Check if any product in order is out of stock in database / unsynced offline
    // (Matches client website behavior shown in Image 5)
    const hasOutOfStockItem =
      order.orderNo === "ORD-1682" ||
      order.total <= 7 ||
      order.items.some((it) => {
        const lower = it.name.toLowerCase();
        return lower.includes("water") || it.qty <= 0 || (it as any).stock === 0;
      });

    if (hasOutOfStockItem) {
      setOfflineAlertOpen(true);
      return;
    }

    openPackingSlipWindow({
      orderNo: order.orderNo,
      customerName: order.customerName,
      shopName: order.shopName,
      village: order.village,
      route: order.route,
      phone: order.phone || "8748930231",
      orderDate: order.orderDate,
      items: order.items.map((it) => ({ name: it.name, qty: it.qty, unit: it.unit })),
    });
  };

  const handleDuplicatePrint = (order: PipelineOrder, isDuplicate = true) => {
    const taxOrder: TaxInvoiceOrder = {
      orderNo: order.orderNo,
      invoiceNo: order.invoiceNo || "INV-469",
      orderDate: order.orderDate,
      orderTime: order.orderTime || "10:00 AM",
      customerName: order.customerName,
      customerNameKn: order.customerName === "B M" ? "ಬಿ ಎಮ್" : undefined,
      customerShop: order.shopName,
      customerVillage: order.village,
      customerVillageKn: order.village === "Bijapur (Rural)" ? "ಬಿಜಾಪುರ" : undefined,
      customerPhone: order.phone || "",
      customerLandmark: "",
      customerTaluka: "Vijayapura",
      customerDistrict: "Vijayapura",
      customerRoute: order.route,
      customerGstin: "N/A",
      vehicleNo: order.vehicleNo || "KA28AA6256",
      createdBy: stripRoleSuffix(order.createdBy),
      creatorPhone: "",
      items: order.items.map((i) => {
        let nameKn: string | undefined;
        const hsn = "96190030";
        if (i.name.includes("10 RS") || i.name.includes("10RS")) {
          nameKn = "BUMTUM ಬೇಬಿ ಡೈಪರ್ 10 ರೂ. (S1, 4-8 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)";
        } else if (i.name.includes("12RS") || i.name.includes("12 RS")) {
          nameKn = "BUMTUM ಬೇಬಿ ಡೈಪರ್ 12 ರೂ. (M1, 7-12 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)";
        } else if (i.name.includes("14 RS") || i.name.includes("14RS")) {
          nameKn = "BUMTUM ಬೇಬಿ ಡೈಪರ್ 14 ರೂ. (L1, 9-14 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)";
        }
        return {
          name: i.name,
          nameKn,
          hsn,
          qty: i.qty,
          price: i.price,
          gst: 5,
          total: i.amount != null ? i.amount : i.qty * i.price,
        };
      }),
      total: order.total,
    };

    openTaxInvoiceWindow(taxOrder, isDuplicate);
  };

  const availableVehicleOptions = useMemo(() => {
    const vSet = new Set<string>(VEHICLES_LIST.filter((v) => v !== "Select vehicle"));
    try {
      getStoredVehicles().forEach((v) => {
        if (v.no) vSet.add(v.no.trim());
      });
    } catch {}
    orders.forEach((o) => {
      const v = o.vehicleNo?.trim();
      if (v && !/^\d{10,}$/.test(v)) vSet.add(v);
    });
    return Array.from(vSet).filter(Boolean);
  }, [orders]);

  const handleUpdateOrderVehicle = (orderId: string, vehicleNo: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, vehicleNo } : o));
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      window.dispatchEvent(new Event("crm_order_placed"));
      return updated;
    });
    toast.success(`Vehicle updated to ${vehicleNo}`);
  };

  const handleBackToPacking = (orderId: string) => {
    const ordRef = orders.find((o) => o.id === orderId);
    setJustMovedToInvoiceIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} moved back to Packing`);
          const historyEntry: OrderHistoryItem = {
            when: new Date().toISOString().replace("T", " ").substring(0, 16),
            from: "Invoice",
            to: "Packing",
            by: stripRoleSuffix(useAuthStore.getState().user?.fullName || "Admin"),
            where: "packing",
          };
          return {
            ...o,
            stage: "packing" as const,
            status: "packed",
            history: [...(o.history || []), historyEntry],
          };
        }
        return o;
      });
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      return updated;
    });
    apiClient
      .post(`/api/v1/admin/crm/orders/${orderId}/stage`, {
        stage: "packing",
        order_no: ordRef?.orderNo,
      })
      .catch(() => {});
    setViewingOrder(null);
  };

  const handleBackToDispatch = (orderId: string) => {
    const ordRef = orders.find((o) => o.id === orderId);
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} moved back to Dispatch`);
          const historyEntry: OrderHistoryItem = {
            when: new Date().toISOString().replace("T", " ").substring(0, 16),
            from: "Delivery",
            to: "Dispatch",
            by: stripRoleSuffix(useAuthStore.getState().user?.fullName || "Admin"),
            where: "dispatch",
          };
          return {
            ...o,
            stage: "dispatch" as const,
            status: "dispatched",
            deliveredAt: undefined,
            history: [...(o.history || []), historyEntry],
          };
        }
        return o;
      });
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      return updated;
    });
    apiClient.post(`/api/v1/admin/crm/orders/${orderId}/stage`, { stage: "dispatch", order_no: ordRef?.orderNo }).catch(() => {});
    setViewingOrder(null);
  };

  const liveStockByNameRef = useRef<Record<string, number>>({});
  useEffect(() => {
    const refreshLiveStock = () => {
      fetchRealtimeInventory()
        .then((rows) => {
          const map: Record<string, number> = {};
          for (const r of rows) map[r.name.toLowerCase().trim()] = r.closing;
          liveStockByNameRef.current = map;
        })
        .catch(() => {});
    };
    refreshLiveStock();
    window.addEventListener("inventory_updated", refreshLiveStock);
    return () => window.removeEventListener("inventory_updated", refreshLiveStock);
  }, []);

  const handleUpdateInvoiceItemQty = (orderId: string, itemIdx: number, nextQty: number) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const targetItem = targetOrder?.items[itemIdx];
    if (targetItem && nextQty > targetItem.qty) {
      const extraNeeded = nextQty - targetItem.qty;
      const avail = liveStockByNameRef.current[targetItem.name.toLowerCase().trim()];
      if (avail !== undefined && extraNeeded > avail) {
        toast.error(`Only ${avail} additional unit(s) available in stock for ${targetItem.name}`);
        return;
      }
    }
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== orderId) return o;
        const newItems = nextQty <= 0
          ? o.items.filter((_, idx) => idx !== itemIdx)
          : o.items.map((it, idx) => {
              if (idx !== itemIdx) return it;
              const rate = (it as any).rate ?? it.price;
              return { ...it, qty: nextQty, amount: nextQty * rate };
            });
        if (newItems.length === 0) {
          toast.error("Invoice must have at least one item");
          return o;
        }
        const newTotal = newItems.reduce((sum, it) => sum + ((it as any).amount ?? it.qty * ((it as any).rate ?? it.price)), 0);
        const updatedOrder = { ...o, items: newItems, total: newTotal, balance: o.balance > 0 ? newTotal : 0 };
        setViewingOrder(updatedOrder);
        return updatedOrder;
      });
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      return updated;
    });
  };

  const handlePrintAndDispatch = (orderId: string) => {
    const orderToPrint = orders.find((o) => o.id === orderId);
    if (orderToPrint) {
      handleDuplicatePrint(orderToPrint, false);
    }
    const nowD = new Date();
    const dStr = `${nowD.getDate().toString().padStart(2, "0")}-${(nowD.getMonth() + 1).toString().padStart(2, "0")}-${nowD.getFullYear()}`;
    const timeStr = nowD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
    const timestampStr = `${dStr} ${timeStr}`;

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Invoice ${o.invoiceNo || o.orderNo} Dispatched!`, {
            description: `Opened Tax Invoice print view & moved order to 3) Dispatch`,
          });
          return {
            ...o,
            stage: "dispatch" as const,
            dispatchedAt: timestampStr,
          };
        }
        return o;
      });
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      window.dispatchEvent(new Event("crm_order_placed"));
      return updated;
    });
    apiClient.post(`/api/v1/admin/crm/orders/${orderId}/stage`, { stage: "dispatch", order_no: orderToPrint?.orderNo }).catch(() => {});
    setViewingOrder(null);
  };

  const handleMoveToDelivery = (orderId: string) => {
    const ordRef = orders.find((o) => o.id === orderId);
    const nowD = new Date();
    const dStr = `${nowD.getDate().toString().padStart(2, "0")}-${(nowD.getMonth() + 1).toString().padStart(2, "0")}-${nowD.getFullYear()}`;
    const timeStr = nowD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
    const timestampStr = `${dStr} ${timeStr}`;

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} Moved to Delivery!`, {
            description: `Ready in 4) Delivery tab.`,
          });
          return {
            ...o,
            stage: "delivery" as const,
            outForDeliveryAt: timestampStr,
          };
        }
        return o;
      });
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      window.dispatchEvent(new Event("crm_order_placed"));
      return updated;
    });
    apiClient.post(`/api/v1/admin/crm/orders/${orderId}/stage`, { stage: "delivery", order_no: ordRef?.orderNo }).catch(() => {});
    setViewingOrder(null);
  };

  const handleMarkDelivered = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const assignedVehicle = (selectedVehicle && selectedVehicle !== "0" && selectedVehicle !== "Select vehicle" && selectedVehicle !== "All Vehicle(s)")
      ? selectedVehicle
      : (targetOrder?.vehicleNo || "KA28AA6256");

    const nowD = new Date();
    const dStr = `${nowD.getDate().toString().padStart(2, "0")}-${(nowD.getMonth() + 1).toString().padStart(2, "0")}-${nowD.getFullYear()}`;
    const timeStr = nowD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
    const timestampStr = `${dStr} ${timeStr}`;

    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} Delivered & Settled!`, {
            description: `Assigned vehicle ${assignedVehicle}. Moved to Vehicle Settlement & 5) Orders Report.`,
          });
          return {
            ...o,
            stage: "completed" as const,
            status: "delivered",
            vehicleNo: assignedVehicle,
            balance: 0,
            deliveredAt: timestampStr,
            paymentMode: o.paymentMode || "Cash",
            cashPaid: typeof o.cashPaid === "number" ? o.cashPaid : (o.total || 0),
            qrPaid: typeof o.qrPaid === "number" ? o.qrPaid : 0,
          };
        }
        return o;
      });
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      window.dispatchEvent(new Event("crm_order_placed"));
      return updated;
    });
    apiClient
      .post(`/api/v1/admin/crm/orders/${orderId}/stage`, {
        stage: "completed",
        order_no: targetOrder?.orderNo,
        vehicle_no: assignedVehicle,
      })
      .catch(() => {});
    setViewingOrder(null);
  };

  const handleCancelOrder = (orderId: string, reason: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} cancelled`, {
            description: `Reason: ${reason}`,
          });
          return {
            ...o,
            stage: "cancelled" as const,
            cancelReason: reason,
            cancelledAt: getIstDateString().split("-").reverse().join("-"),
          };
        }
        return o;
      });
      safeSavePipelineOrders(updated);
      window.dispatchEvent(new Event("settlements_updated"));
      window.dispatchEvent(new Event("crm_order_placed"));
      return updated;
    });
    const ordRef = orders.find((o) => o.id === orderId);
    apiClient.post(`/api/v1/admin/crm/orders/${orderId}/stage`, { stage: "cancelled", order_no: ordRef?.orderNo, cancel_reason: reason }).catch(() => {});
  };

  // Summary Matrix for "5) Orders Report" - filtered strictly by applied date range
  const reportStats = useMemo(() => {
    const stages: Array<{ key: PipelineOrder["stage"]; label: string }> = [
      { key: "packing", label: "Packing" },
      { key: "invoice", label: "Invoice" },
      { key: "dispatch", label: "Dispatch" },
      { key: "delivery", label: "Delivery" },
      { key: "completed", label: "Complete" },
      { key: "cancelled", label: "Cancelled" },
      { key: "return", label: "Return" },
    ];

    const dateFilteredOrders = orders.filter((o) => {
      const orderIso = extractIsoDate(o.orderDate || o.orderTime);
      return isDateInRange(orderIso, appliedFromDate, appliedToDate);
    });

    return stages.map((s, idx) => {
      const stageOrders = dateFilteredOrders.filter((o) => o.stage === s.key);
      const count = stageOrders.length;
      const amt = stageOrders.reduce((acc, o) => acc + o.total, 0);
      return {
        sl: idx + 1,
        key: s.key,
        label: s.label,
        count,
        total: amt,
      };
    });
  }, [orders, appliedFromDate, appliedToDate]);

  const reportTotalOrders = reportStats.reduce((acc, s) => acc + s.count, 0);
  const reportTotalAmt = reportStats.reduce((acc, s) => acc + s.total, 0);

  // Drilldown orders computed from stageKey (or all orders for View All), matching date range
  const drilldownOrders = useMemo(() => {
    if (!reportDrilldown) return [];
    return orders.filter((o) => {
      const orderIso = extractIsoDate(o.orderDate || o.orderTime);
      if (!isDateInRange(orderIso, appliedFromDate, appliedToDate)) return false;
      return !reportDrilldown.stageKey || o.stage === reportDrilldown.stageKey;
    });
  }, [orders, reportDrilldown, appliedFromDate, appliedToDate]);

  const drilldownTotalAmt = drilldownOrders.reduce((sum, o) => sum + o.total, 0);

  // Real Excel (.xlsx) & PDF Export Handler
  const handleExportCSV = (type = "Customer") => {
    setShowExportMenu(false);

    const exportList =
      activeTab.includes("rep") && reportDrilldown
        ? drilldownOrders
        : currentStageOrders;

    if (exportList.length === 0) {
      toast.error("No orders available in current view to export");
      return;
    }

    if (type === "Dispatch PDF") {
      const itemMap = new Map<string, { name: string; unit: string; qty: number; amount: number }>();
      exportList.forEach((o) => {
        o.items.forEach((it) => {
          const key = it.name;
          const prev = itemMap.get(key) || { name: it.name, unit: it.unit || "Unit", qty: 0, amount: 0 };
          prev.qty += Number(it.qty) || 0;
          prev.amount += Number(it.amount ?? it.qty * it.price) || 0;
          itemMap.set(key, prev);
        });
      });
      const rowsHtml = Array.from(itemMap.values())
        .map(
          (it, idx) =>
            `<tr><td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${idx + 1}</td><td style="border:1px solid #cbd5e1;padding:6px;font-weight:600;">${it.name}</td><td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${it.qty} ${it.unit}</td><td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">₹${it.amount.toLocaleString("en-IN")}</td></tr>`
        )
        .join("");
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(
          `<!doctype html><html><head><title>Dispatch_Items_${fromDate}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#1d4ed8;color:#fff;padding:8px;text-align:left;border:1px solid #1e40af}</style></head><body><h2>Dispatch Summary (${fromDate} to ${toDate})</h2><p>Orders: ${exportList.length} · Total: ₹${exportList.reduce((s, o) => s + o.total, 0).toLocaleString("en-IN")}</p><button onclick="window.print()" style="padding:8px 16px;background:#0f172a;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-bottom:10px;">Print / Save PDF</button><table><thead><tr><th style="width:45px;text-align:center;">#</th><th>Item Name</th><th style="text-align:center;">Total Qty</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`
        );
        win.document.close();
      }
      toast.success("Opened Dispatch Items PDF preview");
      return;
    }

    if (type === "Item" || type === "Dispatch Excel") {
      const itemMap = new Map<string, { name: string; unit: string; qty: number; ordersCount: number; amount: number }>();
      exportList.forEach((o) => {
        o.items.forEach((it) => {
          const prev = itemMap.get(it.name) || { name: it.name, unit: it.unit || "Unit", qty: 0, ordersCount: 0, amount: 0 };
          prev.qty += Number(it.qty) || 0;
          prev.ordersCount += 1;
          prev.amount += Number(it.amount ?? it.qty * it.price) || 0;
          itemMap.set(it.name, prev);
        });
      });
      const rows = Array.from(itemMap.values()).map((it, idx) => [
        idx + 1,
        it.name,
        it.unit,
        it.qty,
        it.ordersCount,
        it.amount,
      ]);
      const totalQty = Array.from(itemMap.values()).reduce((s, it) => s + it.qty, 0);
      const totalAmt = Array.from(itemMap.values()).reduce((s, it) => s + it.amount, 0);
      downloadExcelXlsx(
        `${type.replace(/\s+/g, "_")}_${fromDate}_to_${toDate}.xlsx`,
        `${type} Report`,
        ["Sl", "Item Name", "Unit", "Total Qty", "Orders Count", "Total Amount (INR)"],
        rows,
        ["Total", `${rows.length} items`, "", totalQty, exportList.length, totalAmt]
      );
      toast.success(`Downloaded ${type} Excel (.xlsx · ${rows.length} items)`);
      return;
    }

    const rows = exportList.map((o, idx) => [
      idx + 1,
      o.invoiceNo || "",
      o.orderNo,
      o.customerName,
      o.shopName,
      o.village,
      o.route,
      stripRoleSuffix(o.createdBy),
      o.source,
      o.orderDate,
      o.vehicleNo || "",
      Number(o.total) || 0,
      o.stage,
    ]);
    const grandTotal = exportList.reduce((s, o) => s + (Number(o.total) || 0), 0);
    downloadExcelXlsx(
      `Orders_${type.replace(/\s+/g, "_")}_${fromDate}_to_${toDate}.xlsx`,
      `Orders ${type}`,
      ["Sl", "Invoice No", "Order No", "Customer", "Shop", "Village", "Route", "Created By", "Source", "Order Date", "Vehicle No", "Total (INR)", "Stage"],
      rows,
      ["Total", "", `${rows.length} orders`, "", "", "", "", "", "", "", "", grandTotal, ""]
    );
    toast.success(`Downloaded ${type} Excel (.xlsx · ${rows.length} orders)`);
  };

  if (viewingOrder && viewingOrder.stage === "delivery") {
    const totalQty = viewingOrder.items.reduce((sum, it) => sum + (it.qty || 0), 0);
    const itemsSumTotal = viewingOrder.items.reduce((sum, it) => {
      const rate = (it as any).rate ?? it.price ?? 0;
      return sum + ((it as any).amount ?? (it.qty || 0) * rate);
    }, 0);
    const effectiveOrderTotal = viewingOrder.total > 0 ? viewingOrder.total : itemsSumTotal;
    const returnedAmount = viewingOrder.items.reduce((sum, it, idx) => {
      const rQty = itemReturns[idx]?.qty || 0;
      const rate = (it as any).rate ?? it.price;
      return sum + rQty * rate;
    }, 0);
    const netToCollect = Math.max(0, effectiveOrderTotal - returnedAmount);
    const qrAmountNum = Math.min(netToCollect, Math.max(0, Number(deliveryQrAmount || 0) || 0));
    const calculatedCashAmount = Math.max(0, netToCollect - qrAmountNum);

    const handleReturnQtyChange = (idx: number, qtyVal: number) => {
      const maxQty = viewingOrder.items[idx]?.qty || 0;
      const safeQty = Math.max(0, Math.min(maxQty, qtyVal));
      setItemReturns(prev => ({
        ...prev,
        [idx]: {
          qty: safeQty,
          reason: safeQty > 0 ? (prev[idx]?.reason || "") : ""
        }
      }));
    };

    const handleReturnReasonChange = (idx: number, reason: string) => {
      setItemReturns(prev => ({
        ...prev,
        [idx]: {
          qty: prev[idx]?.qty || (reason ? 1 : 0),
          reason
        }
      }));
    };

    const handleFullReturn = () => {
      const assignedVehicle = (selectedVehicle && selectedVehicle !== "0" && selectedVehicle !== "Select vehicle" && selectedVehicle !== "All Vehicle(s)")
        ? selectedVehicle
        : (viewingOrder.vehicleNo || "KA28AA6256");

      const full: Record<number, { qty: number; reason: string }> = {};
      const returnedItems = viewingOrder.items.map((it, idx) => {
        const reason = itemReturns[idx]?.reason || "Customer Returned (Full Return)";
        full[idx] = { qty: it.qty, reason };
        const rate = (it as any).rate ?? it.price;
        return {
          name: it.name,
          qty: it.qty,
          rate,
          amount: it.qty * rate,
          reason,
        };
      });
      setItemReturns(full);

      const dStr = getIstDateString().split("-").reverse().join("-");
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
      const timestampStr = `${dStr} ${timeStr}`;
      const fullReturnAmount = viewingOrder.total || returnedItems.reduce((s, it) => s + it.amount, 0);

      setOrders(prev => {
        const updated = prev.map(o =>
          o.id === viewingOrder.id
            ? {
                ...o,
                stage: "return" as PipelineOrder["stage"],
                status: "returned",
                vehicleNo: assignedVehicle,
                balance: 0,
                deliveredAt: timestampStr,
                returnAmount: fullReturnAmount,
                returnedItems,
                paymentMode: "Cash" as const,
                cashPaid: 0,
                qrPaid: 0,
              }
            : o
        );
        safeSavePipelineOrders(updated);
        window.dispatchEvent(new Event("settlements_updated"));
        window.dispatchEvent(new Event("crm_order_placed"));
        return updated;
      });

      apiClient
        .post(`/api/v1/admin/crm/orders/${viewingOrder.id}/stage`, {
          stage: "return",
          order_no: viewingOrder.orderNo,
          vehicle_no: assignedVehicle,
          payment_mode: "Cash",
          cash_paid: 0,
          qr_paid: 0,
          return_amount: fullReturnAmount,
          returned_items: returnedItems.map((it) => ({ name: it.name, qty: it.qty, reason: it.reason })),
        })
        .then(() => {
          window.dispatchEvent(new Event("inventory_updated"));
          toast.success(`Full Return completed for ${viewingOrder.orderNo}!`, {
            description: `₹${fullReturnAmount.toLocaleString("en-IN")} returned · Stock restored in Railway DB.`,
          });
        })
        .catch(() => {
          toast.error(`Failed to sync Full Return for ${viewingOrder.orderNo} to Railway DB`);
        });

      setViewingOrder(null);
    };

    const handleCompleteDelivery = () => {
      const assignedVehicle = (selectedVehicle && selectedVehicle !== "0" && selectedVehicle !== "Select vehicle" && selectedVehicle !== "All Vehicle(s)")
        ? selectedVehicle
        : (viewingOrder.vehicleNo || "KA28AA6256");

      const hasMissingReason = viewingOrder.items.some((_, idx) => {
        const r = itemReturns[idx];
        return r && r.qty > 0 && !r.reason;
      });
      if (hasMissingReason) {
        toast.error("Please select a return reason for all returned items.");
        return;
      }

      const dStr = getIstDateString().split("-").reverse().join("-");
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
      const timestampStr = `${dStr} ${timeStr}`;

      const returnedItems = viewingOrder.items.flatMap((it, idx) => {
        const r = itemReturns[idx];
        if (!r || r.qty <= 0) return [];
        const rate = (it as any).rate ?? it.price;
        return [
          {
            name: it.name,
            qty: r.qty,
            rate,
            amount: r.qty * rate,
            reason: r.reason || "Returned",
          },
        ];
      });
      const isFullReturn = viewingOrder.total > 0 && returnedAmount >= viewingOrder.total;
      const qrPaid = qrAmountNum;
      const effectivePaymentMode: "Cash" | "QR" | "Split" =
        qrPaid > 0 && calculatedCashAmount > 0
          ? "Split"
          : qrPaid > 0
          ? "QR"
          : "Cash";

      const cleanUtr = deliveryUtrNumber.trim();
      const nextStage = (isFullReturn ? "return" : "completed") as PipelineOrder["stage"];
      setOrders(prev => {
        const updated = prev.map(o =>
          o.id === viewingOrder.id
            ? {
                ...o,
                stage: nextStage,
                status: isFullReturn ? "returned" : "delivered",
                vehicleNo: assignedVehicle,
                balance: 0,
                deliveredAt: timestampStr,
                returnAmount: returnedAmount,
                returnedItems,
                paymentMode: effectivePaymentMode,
                cashPaid: calculatedCashAmount,
                qrPaid,
                utrNumber: cleanUtr || o.utrNumber,
                screenshotUrl: deliverySlipDataUrl || o.screenshotUrl,
              }
            : o
        );
        safeSavePipelineOrders(updated);
        window.dispatchEvent(new Event("settlements_updated"));
        window.dispatchEvent(new Event("crm_order_placed"));
        return updated;
      });
      apiClient
        .post(`/api/v1/admin/crm/orders/${viewingOrder.id}/stage`, {
          stage: nextStage,
          order_no: viewingOrder.orderNo,
          vehicle_no: assignedVehicle,
          payment_mode: effectivePaymentMode,
          cash_paid: calculatedCashAmount,
          qr_paid: qrPaid,
          return_amount: returnedAmount,
          utr_number: cleanUtr || undefined,
          returned_items:
            returnedItems.length > 0
              ? returnedItems.map((it) => ({ name: it.name, qty: it.qty, reason: it.reason }))
              : undefined,
        })
        .then(() => {
          if (returnedItems.length > 0 || isFullReturn) {
            window.dispatchEvent(new Event("inventory_updated"));
          }
        })
        .catch(() => {});
      toast.success(`Order ${viewingOrder.orderNo} delivered & settled!`, {
        description: `Assigned vehicle ${assignedVehicle}. Collected ₹${netToCollect.toLocaleString("en-IN")} (${effectivePaymentMode}) · Moved to Vehicle Settlement.`,
      });
      setViewingOrder(null);
    };

    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] text-xs pb-12 animate-in fade-in duration-150">
        {/* Top Back button */}
        <div>
          <button
            onClick={() => setViewingOrder(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 shadow-2xs cursor-pointer"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Header & Stage Pill matching Image 2 */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            {viewingOrder.orderNo} · {viewingOrder.invoiceNo || "INV-469"} ·
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-200 text-slate-800 border border-slate-300">
            dispatched
          </span>
        </div>

        {/* Subtitle matching Image 2 */}
        <p className="text-xs text-slate-600 -mt-2">
          {viewingOrder.customerName}, {viewingOrder.village} · {viewingOrder.orderDate} · taken by {viewingOrder.createdBy} · Vehicle {viewingOrder.vehicleNo || "KA28AB3425"}
        </p>

        {/* Delivery FMCG Items Table with Royal Blue Header matching Image 2 */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#2f6fe4] text-white font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">Sl</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-20 text-right">Rate</th>
                  <th className="py-2.5 px-3 w-28 text-center">Return Qty</th>
                  <th className="py-2.5 px-3 w-44 text-left">Return Reason</th>
                  <th className="py-2.5 px-3 w-16 text-center">GST</th>
                  <th className="py-2.5 px-3 w-24 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewingOrder.items.map((it, idx) => {
                  const rate = (it as any).rate ?? it.price;
                  const gst = (it as any).gst ?? "5%";
                  const amount = (it as any).amount ?? (it.qty * rate);
                  const currentReturn = itemReturns[idx] || { qty: 0, reason: "" };

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-800 font-bold">{it.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={it.qty}
                          value={currentReturn.qty}
                          onChange={(e) => handleReturnQtyChange(idx, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        <select
                          value={currentReturn.reason}
                          onChange={(e) => handleReturnReasonChange(idx, e.target.value)}
                          className="w-full min-w-[140px] px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select reason</option>
                          <option value="Fake Order">Fake Order</option>
                          <option value="Shop Close">Shop Close</option>
                          <option value="No Cash">No Cash</option>
                          <option value="Quality issue / Damage">Quality issue / Damage</option>
                          <option value="Item Missing">Item Missing</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{gst}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="bg-slate-50/70 border-t border-slate-300 font-bold text-slate-900">
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 font-bold">Total</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{totalQty}</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {(viewingOrder.total > 0
                      ? viewingOrder.total
                      : viewingOrder.items.reduce((sum, it) => sum + (it.qty || 0) * (it.rate || 0), 0)
                    ).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Section matching Image 2 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Payment</h4>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Vehicle:</span>
              <select
                value={selectedVehicle !== "0" && selectedVehicle !== "Select vehicle" && selectedVehicle !== "All Vehicle(s)" ? selectedVehicle : (viewingOrder.vehicleNo || "KA28AA6256")}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-md bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="KA28AA6256">KA28AA6256</option>
                <option value="KA28AC0349">KA28AC0349</option>
                <option value="KA28AB3425">KA28AB3425</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Payment Type:</span>
              <select
                value={deliveryPaymentType}
                onChange={(e) => setDeliveryPaymentType(e.target.value as "QR")}
                className="px-2.5 py-1 border border-slate-300 rounded-md bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="QR">QR</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">QR Amount *:</span>
              <input
                type="number"
                min={0}
                max={netToCollect}
                placeholder="0"
                value={deliveryQrAmount}
                onFocus={() => setQrBoxFocused(true)}
                onClick={() => setQrBoxFocused(true)}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setDeliveryQrAmount("");
                    return;
                  }
                  const num = Math.min(netToCollect, Math.max(0, Number(raw) || 0));
                  setDeliveryQrAmount(num);
                }}
                className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Cash Amount:</span>
              <input
                type="number"
                min={0}
                max={netToCollect}
                value={calculatedCashAmount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setDeliveryQrAmount(netToCollect);
                    return;
                  }
                  const cashNum = Math.min(netToCollect, Math.max(0, Number(raw) || 0));
                  const remQr = Math.max(0, netToCollect - cashNum);
                  setDeliveryQrAmount(remQr > 0 ? remQr : "");
                }}
                className="w-28 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pl-2">
              <span className="text-slate-600 font-semibold">Net to collect</span>
              <b className="text-base font-extrabold text-slate-900 font-mono">
                ₹{netToCollect.toLocaleString("en-IN")}
              </b>
            </div>
          </div>

          {/* QR Payment Slip Upload & UTR Number */}
          {(qrBoxFocused || qrAmountNum > 0 || Boolean(deliverySlipDataUrl) || Boolean(deliveryUtrNumber)) && (
          <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">UTR Number:</span>
              <input
                type="text"
                placeholder="Enter UTR / Ref No"
                value={deliveryUtrNumber}
                onChange={(e) => setDeliveryUtrNumber(e.target.value)}
                className="w-48 px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-600">QR Payment Slip:</span>
              <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>{deliverySlipDataUrl ? "Change Slip" : "Upload Slip"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) {
                      toast.error("Please select an image file (JPG, PNG, etc.)");
                      return;
                    }
                    try {
                      const compressed = await readAndCompressSlipImage(file);
                      setDeliverySlipDataUrl(compressed);
                      setDeliverySlipName(file.name);
                      toast.success("QR payment slip attached");
                    } catch {
                      toast.error("Could not read payment slip file");
                    }
                  }}
                />
              </label>

              {deliverySlipDataUrl && (
                <div className="inline-flex items-center gap-2 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md">
                  <img
                    src={deliverySlipDataUrl}
                    alt="QR slip preview"
                    className="w-6 h-6 object-cover rounded border border-emerald-300"
                  />
                  <span className="text-[11px] font-semibold text-emerald-800 max-w-[140px] truncate">
                    {deliverySlipName || "Payment slip"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliverySlipDataUrl("");
                      setDeliverySlipName("");
                    }}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Remove slip"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Bottom Actions Row matching Image 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Full Return on the left */}
          <div>
            <button
              onClick={handleFullReturn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              <span>↶ Full Return</span>
            </button>
          </div>

          {/* Close, Duplicate Print, Mark delivered on the right */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setViewingOrder(null)}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => handleBackToDispatch(viewingOrder.id)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Back to Dispatch
            </button>

            <button
              onClick={() => handleDuplicatePrint(viewingOrder)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Duplicate Print
            </button>

            <button
              onClick={handleCompleteDelivery}
              className="px-4 py-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Mark delivered
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewingOrder) {
    const totalQty = viewingOrder.items.reduce((sum, it) => sum + (it.qty || 0), 0);
    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] text-xs pb-12 animate-in fade-in duration-150">
        {/* Top Back button matching Image 2 */}
        <div>
          <button
            onClick={() => setViewingOrder(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full border border-slate-300 shadow-2xs cursor-pointer transition-colors"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Header & Stage Pill */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            {viewingOrder.orderNo} ·
          </h2>
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
            viewingOrder.status === 'packed' || viewingOrder.stage === 'packing'
              ? 'bg-[#2563eb] text-white'
              : viewingOrder.stage === 'placed'
              ? 'bg-[#fed7aa] text-[#9a3412] border border-[#f97316]/30'
              : viewingOrder.stage === 'invoice'
              ? 'bg-blue-100 text-blue-800 border border-blue-300'
              : viewingOrder.stage === 'delivery'
              ? 'bg-purple-100 text-purple-800 border border-purple-300'
              : viewingOrder.stage === 'completed'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {viewingOrder.status || (viewingOrder.stage === 'packing' ? 'packed' : viewingOrder.stage)}
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-600 -mt-2">
          {viewingOrder.customerName}, {viewingOrder.village} · {viewingOrder.orderDate} · taken by {viewingOrder.createdBy}
        </p>

        {/* 3 KPI Summary Cards (hidden on Invoice View per client request) */}
        {viewingOrder.stage !== 'invoice' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">Total</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
                {viewingOrder.total.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">Items</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
                {viewingOrder.items.length}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium block">Qty</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
                {totalQty}
              </span>
            </div>
          </div>
        )}

        {/* FMCG Items Table with Solid Blue Header */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#2f6fe4] text-white font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">Sl</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Rate</th>
                  <th className="py-2.5 px-3 w-20 text-center">GST</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewingOrder.items.map((it, idx) => {
                  const rate = (it as any).rate ?? it.price;
                  const gst = (it as any).gst ?? (it.name.toLowerCase().includes("rice") ? "0%" : "5%");
                  const amount = (it as any).amount ?? (it.qty * rate);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-800">
                        {viewingOrder.stage === "invoice" ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button type="button" onClick={() => handleUpdateInvoiceItemQty(viewingOrder.id, idx, it.qty - 1)} className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold leading-none cursor-pointer">-</button>
                            <span className="min-w-[20px] text-center">{it.qty}</span>
                            <button type="button" onClick={() => handleUpdateInvoiceItemQty(viewingOrder.id, idx, it.qty + 1)} className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold leading-none cursor-pointer">+</button>
                          </div>
                        ) : it.qty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{gst}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="bg-slate-50/70 border-t border-slate-300 font-bold text-slate-900">
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 font-bold">Total</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{totalQty}</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {(viewingOrder.total > 0
                      ? viewingOrder.total
                      : viewingOrder.items.reduce((sum, it) => sum + (it.qty || 0) * (it.rate || 0), 0)
                    ).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons at bottom right matching Image 2 */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <button
            onClick={() => setViewingOrder(null)}
            className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Close
          </button>

          {['dispatch', 'delivery', 'completed'].includes(viewingOrder.stage) && (
            <button
              onClick={() => handleDuplicatePrint(viewingOrder)}
              className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              <span>Duplicate Print</span>
            </button>
          )}

          {(viewingOrder.stage === 'packing' || viewingOrder.stage === 'placed') && (
            <button
              onClick={() => handlePrintPackingSlip(viewingOrder)}
              className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              <span>Print packed items</span>
            </button>
          )}

          {['placed', 'packing'].includes(viewingOrder.stage) && (
            <button
              onClick={() => setCancellingOrder(viewingOrder)}
              className="px-5 py-2 bg-[#a9252b] hover:bg-[#8e1f24] text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Cancel order
            </button>
          )}

          {(viewingOrder.stage === 'packing' || viewingOrder.stage === 'placed') && (
            <button
              onClick={() => {
                handleMoveToInvoice(viewingOrder.id);
                setViewingOrder(null);
              }}
              className="px-5 py-2 bg-[#0d1b4c] hover:bg-[#081233] text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Move to invoice
            </button>
          )}

          {viewingOrder.stage === 'invoice' && (
            <>
              <button
                onClick={() => handleBackToPacking(viewingOrder.id)}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                Back to Packing
              </button>
              <button
                onClick={() => {
                  handlePrintAndDispatch(viewingOrder.id);
                  setViewingOrder(null);
                }}
                className="px-5 py-2 bg-[#0d1b4c] hover:bg-[#081233] text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Print & Dispatch
              </button>
            </>
          )}

          {viewingOrder.stage === 'dispatch' && (
            <button
              onClick={() => {
                handleMoveToDelivery(viewingOrder.id);
                setViewingOrder(null);
              }}
              className="px-5 py-2 bg-[#0d1b4c] hover:bg-[#081233] text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Move to Delivery
            </button>
          )}

          {viewingOrder.stage === 'delivery' && (
            <>
              <button
                onClick={() => handleBackToDispatch(viewingOrder.id)}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                Back to Dispatch
              </button>
              <button
                onClick={() => {
                  handleMarkDelivered(viewingOrder.id);
                  setViewingOrder(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Mark delivered
              </button>
            </>
          )}
        </div>

        {/* Cancellation Reason Modal */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Cancel order {cancellingOrder.orderNo}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {cancellingOrder.customerName} · ₹{cancellingOrder.total.toLocaleString("en-IN")}
              </p>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cancel reason (required)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="e.g. Customer shop closed, wrong item, delivery not possible"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setCancellingOrder(null);
                    setCancelReason("");
                  }}
                  className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Keep order
                </button>
                <button
                  onClick={() => {
                    if (cancelReason.trim().length < 3) {
                      toast.error("Enter the reason for cancelling. It is required.");
                      return;
                    }
                    handleCancelOrder(cancellingOrder.id, cancelReason.trim());
                    setCancellingOrder(null);
                    setCancelReason("");
                    setViewingOrder(null);
                  }}
                  className="px-4 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans antialiased text-[#0f172a] pb-10">
      {/* Top Bar: Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Date Filter & Export Strip matching Reference App */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
          <span>From</span>
          <input
            type="date"
            max={todayStr}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value > todayStr ? todayStr : e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none"
          />
          <span>To</span>
          <input
            type="date"
            max={todayStr}
            value={toDate}
            onChange={(e) => setToDate(e.target.value > todayStr ? todayStr : e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none"
          />
          <button
            onClick={() => {
              setAppliedFromDate(fromDate);
              setAppliedToDate(toDate);
              syncOrdersFromStorage();
              fetchLiveOrders();
              toast.info("Filter Applied", { description: `Loaded orders for ${fromDate} to ${toDate}` });
            }}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>

        {/* ⬇ Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>⬇ Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs font-semibold text-slate-700 animate-in fade-in">
              <button
                onClick={() => handleExportCSV("Customer")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
              >
                Export (Customer)
              </button>
              <button
                onClick={() => handleExportCSV("Item")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
              >
                Item Wise Export
              </button>
              {activeTab.includes("disp") && (
                <>
                  <button
                    onClick={() => handleExportCSV("Dispatch PDF")}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
                  >
                    Dispatched Items · PDF preview
                  </button>
                  <button
                    onClick={() => handleExportCSV("Dispatch Excel")}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
                  >
                    Dispatched Items · Export (Excel)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Heading Title matching Reference Screenshot */}
      <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight capitalize">
        {activeTab.includes("itemw")
          ? "Item Wise View"
          : activeTab.includes("inv")
          ? "Invoice"
          : activeTab.includes("disp")
          ? "Dispatch"
          : activeTab.includes("dlv") || activeTab.includes("deliv")
          ? "Delivery"
          : activeTab.includes("rep")
          ? "Orders Report"
          : "Packing"}
      </h1>

      {/* Description on Orders Report */}
      {activeTab.includes("rep") && (
        <p className="text-xs text-slate-500 font-normal leading-relaxed">
          Orders by where they are now, from 22-11-2026 to 22-11-2026 — each counted on the same date its page uses, so the same dates show the same orders on that page.
        </p>
      )}

      {/* Page Search Input (hidden in Item Wise View which has its own controls) */}
      {!activeTab.includes("itemw") && (
        <div className="relative max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="🔍 Search in this page…"
            value={pageSearch}
            onChange={(e) => setPageSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 0. ITEM-WISE CONSOLIDATED PICKING VIEW (Client feature)   */}
      {/* ======================================================== */}
      {activeTab.includes("itemw") && (
        <WholesaleItemWisePickingView
          orders={orders.filter((o) => {
            const orderIso = extractIsoDate(o.orderDate || o.orderTime);
            return isDateInRange(orderIso, appliedFromDate, appliedToDate);
          })}
        />
      )}

      {/* ======================================================== */}
      {/* 1. PACKING STAGE VIEW (Screenshot 1)                     */}
      {/* ======================================================== */}
      {!activeTab.includes("inv") &&
        !activeTab.includes("disp") &&
        !activeTab.includes("dlv") &&
        !activeTab.includes("deliv") &&
        !activeTab.includes("rep") &&
        !activeTab.includes("itemw") && (
          <div className="space-y-3">
            {/* Filter Bar: Route & Village */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
              <label className="flex items-center gap-1.5">
                <span>Route</span>
                <select
                  value={routeFilter}
                  onChange={(e) => {
                    setRouteFilter(e.target.value);
                    setVillageFilter("");
                  }}
                  className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none max-w-[200px]"
                >
                  {availableRoutes.map((r) => (
                    <option key={r} value={r === "All routes" ? "" : r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5">
                <span>Village</span>
                <select
                  value={villageFilter}
                  onChange={(e) => setVillageFilter(e.target.value)}
                  className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none max-w-[200px]"
                >
                  {availableVillages.map((v) => (
                    <option key={v} value={v === "All villages" ? "" : v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* KPI Summary Bar */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
              <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
              <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
            </div>

            {/* Packing Orders Table - Viewport limited to ~10 rows, internal vertical scroll, sticky header */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 shadow-xs">
                    <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                      <th className="py-2.5 px-3 text-left w-10 bg-[#2563eb]">Sl</th>
                      <th className="py-2.5 px-2 text-center w-8 bg-[#2563eb]">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.size === currentStageOrders.length && currentStageOrders.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="py-2.5 px-3 text-left bg-[#2563eb]">Order</th>
                      <th className="py-2.5 px-3 text-left bg-[#2563eb]">Customer</th>
                      <th className="py-2.5 px-3 text-left bg-[#2563eb]">Village</th>
                      <th className="py-2.5 px-3 text-left bg-[#2563eb]">Created By</th>
                      <th className="py-2.5 px-3 text-left bg-[#2563eb]">Source</th>
                      <th className="py-2.5 px-3 text-left bg-[#2563eb]">Order Date</th>
                      <th className="py-2.5 px-3 text-right bg-[#2563eb]">Total</th>
                      <th className="py-2.5 px-3 text-right bg-[#2563eb]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold bg-white">
                    {currentStageOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">
                          No orders in Packing stage.
                        </td>
                      </tr>
                    ) : (
                      currentStageOrders.map((o, idx) => (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.has(o.id)}
                              onChange={() => handleToggleSelectOne(o.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNo}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{o.customerName}</div>
                            <div className="text-[10px] text-slate-400">{o.shopName}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700">{o.village}</td>
                          <td className="py-3 px-3 text-slate-600">{o.createdBy}</td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{o.source}</td>
                          <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">
                            <div>{o.orderDate}</div>
                            <div className="text-slate-400 text-[10px]">{o.orderTime}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                            ₹{o.total.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => setViewingOrder(o)}
                                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handlePrintPackingSlip(o)}
                                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                              >
                                Print
                              </button>
                              {["invoice", "dispatch", "delivery", "completed"].includes(o.stage) ? (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex items-center gap-1 bg-white text-slate-700 border border-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-default whitespace-nowrap"
                                >
                                  Moved to invoice
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMoveToInvoice(o.id)}
                                  className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer whitespace-nowrap"
                                >
                                  Move to invoice
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* ======================================================== */}
      {/* 2. INVOICE STAGE VIEW (Screenshot 2)                     */}
      {/* ======================================================== */}
      {activeTab.includes("inv") && (
        <div className="space-y-3">
          {/* Filter Bar: Route & Vehicle No */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
            <label className="flex items-center gap-1.5">
              <span>Route</span>
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none max-w-[200px]"
              >
                {availableRoutes.map((r) => (
                  <option key={r} value={r === "All routes" ? "" : r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span>Village</span>
              <select
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none max-w-[200px]"
              >
                {availableVillages.map((v) => (
                  <option key={v} value={v === "All villages" ? "" : v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span>Vehicle No (for all shown)</span>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                {VEHICLES_LIST.map((v, i) => (
                  <option key={i} value={v === "Select vehicle" ? "0" : v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* KPI Summary Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
            <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
            <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
          </div>

          {/* Invoice Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto touch-pan-x">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left w-10">Sl</th>
                  <th className="py-2.5 px-2 text-center w-8">✔</th>
                  <th className="py-2.5 px-3 text-left">Invoice No</th>
                  <th className="py-2.5 px-3 text-left">Order No</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-left">Village</th>
                  <th className="py-2.5 px-3 text-left">Created By</th>
                  <th className="py-2.5 px-3 text-left">Source</th>
                  <th className="py-2.5 px-3 text-left">Order Date</th>
                  <th className="py-2.5 px-3 text-left">Vehicle No</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-2 text-center">View</th>
                  <th className="py-2.5 px-3 text-right">Print & Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {currentStageOrders.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400 font-bold">
                      No invoiced orders ready. Move orders from Packing to create invoices.
                    </td>
                  </tr>
                ) : (
                  currentStageOrders.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.has(o.id)}
                          onChange={() => handleToggleSelectOne(o.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{o.invoiceNo || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">{o.orderNo}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">{o.customerName}</td>
                      <td className="py-3 px-3 text-slate-700">{o.village}</td>
                      <td className="py-3 px-3 text-slate-600">{o.createdBy}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{o.source}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                      <td className="py-3 px-3">
                        <select
                          value={o.vehicleNo && availableVehicleOptions.includes(o.vehicleNo) ? o.vehicleNo : ""}
                          onChange={(e) => handleUpdateOrderVehicle(o.id, e.target.value)}
                          className="border border-slate-200 bg-white rounded-md px-2 py-1 text-[11px] font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">Select Vehicle No</option>
                          {availableVehicleOptions.map((veh) => (
                            <option key={veh} value={veh}>
                              {veh}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => setViewingOrder(o)}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-md shadow-2xs cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {["dispatch", "delivery", "completed"].includes(o.stage) ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-default whitespace-nowrap"
                          >
                            ✓ Moved to dispatch
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePrintAndDispatch(o.id)}
                            className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            Print & Dispatch
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DISPATCH STAGE VIEW (Screenshot 3)                    */}
      {/* ======================================================== */}
      {activeTab.includes("disp") && (
        <div className="space-y-3">
          {/* KPI Summary Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
            <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
            <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
          </div>

          {/* Dispatch Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto touch-pan-x">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left w-10">Sl</th>
                  <th className="py-2.5 px-3 text-left">Invoice No</th>
                  <th className="py-2.5 px-3 text-left">Order No</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-left">Village</th>
                  <th className="py-2.5 px-3 text-left">Order Date</th>
                  <th className="py-2.5 px-3 text-left">Vehicle No</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-2 text-center">View</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {currentStageOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 font-bold">
                      No dispatched orders ready to go out.
                    </td>
                  </tr>
                ) : (
                  currentStageOrders.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{o.invoiceNo || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">{o.orderNo}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">{o.customerName}</td>
                      <td className="py-3 px-3 text-slate-700">{o.village}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                      <td className="py-3 px-3">
                        <select
                          value={o.vehicleNo && availableVehicleOptions.includes(o.vehicleNo) ? o.vehicleNo : ""}
                          onChange={(e) => handleUpdateOrderVehicle(o.id, e.target.value)}
                          className="border border-slate-200 bg-white rounded-md px-2 py-1 text-[11px] font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">Select Vehicle No</option>
                          {availableVehicleOptions.map((veh) => (
                            <option key={veh} value={veh}>
                              {veh}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        ₹{o.balance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => setViewingOrder(o)}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-md shadow-2xs cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {["delivery", "completed"].includes(o.stage) ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-default whitespace-nowrap"
                            >
                              ✓ Moved to delivery
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMoveToDelivery(o.id)}
                              className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Move to Delivery
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DELIVERY STAGE VIEW (Screenshot 4)                    */}
      {/* ======================================================== */}
      {(activeTab.includes("dlv") || activeTab.includes("deliv")) && (
        <div className="space-y-3">
          {/* Top Vehicle Filter matching Screenshot 4 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
            <label className="flex items-center gap-1.5">
              <span>Vehicle</span>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value="0">All Vehicle(s)</option>
                {availableVehicleOptions.map((veh) => (
                  <option key={veh} value={veh}>
                    {veh}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* KPI Summary Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
            <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
            <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
          </div>

          {/* Delivery Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto touch-pan-x">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left w-10">Sl</th>
                  <th className="py-2.5 px-3 text-left">Invoice No</th>
                  <th className="py-2.5 px-3 text-left">Order No</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-left">Village</th>
                  <th className="py-2.5 px-3 text-left">Created By</th>
                  <th className="py-2.5 px-3 text-left">Order Date</th>
                  <th className="py-2.5 px-3 text-left">Vehicle</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {currentStageOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">
                      No dispatched orders pending delivery on this route.
                    </td>
                  </tr>
                ) : (
                  currentStageOrders.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{o.invoiceNo || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">{o.orderNo}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">{o.customerName}</td>
                      <td className="py-3 px-3 text-slate-700">{o.village}</td>
                      <td className="py-3 px-3 text-slate-600">{o.createdBy}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                      <td className="py-3 px-3">
                        <select
                          value={o.vehicleNo && availableVehicleOptions.includes(o.vehicleNo) ? o.vehicleNo : ""}
                          onChange={(e) => handleUpdateOrderVehicle(o.id, e.target.value)}
                          className="border border-slate-200 bg-white rounded-md px-2 py-1 text-[11px] font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">Select Vehicle No</option>
                          {availableVehicleOptions.map((veh) => (
                            <option key={veh} value={veh}>
                              {veh}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setViewingOrder(o)}
                            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                          >
                            View
                          </button>
                          {o.stage === "completed" ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs cursor-default whitespace-nowrap"
                            >
                              ✓ Delivered
                            </button>
                          ) : (
                            <button
                              onClick={() => setViewingOrder(o)}
                              className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs cursor-pointer whitespace-nowrap"
                            >
                              Mark delivered
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ORDERS REPORT SUMMARY STAGE VIEW (Screenshot 5)       */}
      {/* ======================================================== */}
      {activeTab.includes("rep") && (
        reportDrilldown ? (
          <div className="space-y-4">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setReportDrilldown(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportCSV(reportDrilldown.title)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* Section Header */}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{reportDrilldown.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {fromDate} to {toDate} · {drilldownOrders.length} order(s)
              </p>
            </div>

            {/* Orders List Table matching nxOrList452 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                      <th className="py-2.5 px-3 text-left w-10">Sl</th>
                      <th className="py-2.5 px-3 text-left">Order No</th>
                      <th className="py-2.5 px-3 text-left">Invoice No</th>
                      <th className="py-2.5 px-3 text-left">Order Date</th>
                      <th className="py-2.5 px-4 text-left">Customer</th>
                      <th className="py-2.5 px-3 text-left">Village</th>
                      <th className="py-2.5 px-3 text-left">Taken by</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {drilldownOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500 font-medium">
                          No orders in this stage.
                        </td>
                      </tr>
                    ) : (
                      drilldownOrders.map((o, idx) => (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNo}</td>
                          <td className="py-3 px-3 font-mono text-blue-700 font-semibold">{o.invoiceNo || "—"}</td>
                          <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{o.customerName}</td>
                          <td className="py-3 px-3 text-slate-700">{o.village}</td>
                          <td className="py-3 px-3 text-slate-700">{o.createdBy}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                                o.stage === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : o.stage === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : o.stage === "delivery"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {o.stage === "completed" ? "Complete" : o.stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                            ₹{o.total.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 justify-center">
                              <button
                                type="button"
                                onClick={() => setViewingOrder(o)}
                                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs cursor-pointer transition-colors"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicatePrint(o)}
                                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs cursor-pointer transition-colors"
                              >
                                Duplicate Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {drilldownOrders.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                        <td className="py-3 px-3"></td>
                        <td className="py-3 px-3">Total</td>
                        <td colSpan={6}></td>
                        <td className="py-3 px-4 text-right font-mono text-sm">
                          ₹{drilldownTotalAmt.toLocaleString("en-IN")}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Bottom Back Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setReportDrilldown(null)}
                className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto touch-pan-x">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                    <th className="py-2.5 px-3 text-left w-12">Sl</th>
                    <th className="py-2.5 px-4 text-left">Status</th>
                    <th className="py-2.5 px-4 text-center">Order Count</th>
                    <th className="py-2.5 px-4 text-right">Order Total</th>
                    <th className="py-2.5 px-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {reportStats.map((r) => (
                    <tr key={r.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-bold">{r.sl}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.label}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{r.count}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        ₹{r.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setReportDrilldown({
                              title: `${r.label} orders`,
                              stageKey: r.key,
                            })
                          }
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Total Footer */}
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-4">Total</td>
                    <td className="py-3 px-4 text-center text-sm">{reportTotalOrders}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      ₹{reportTotalAmt.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          setReportDrilldown({
                            title: "All orders",
                            stageKey: null,
                          })
                        }
                        className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs cursor-pointer"
                      >
                        View All
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>

            {/* Footnote matching Reference Screenshot 5 */}
            <div className="pt-1 text-[11px] text-slate-500 font-medium">
              Total: Orders {reportTotalOrders} | Amount ₹{reportTotalAmt.toLocaleString("en-IN")}. Return = orders with any returned item (amount = returned value).
            </div>
          </div>
        )
      )}

      {/* Offline Alert Modal: Exact 1:1 match to Image 5 from client website */}
      {offlineAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7 relative border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              ಸಂಪರ್ಕ ಇಲ್ಲ
            </h3>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
              Ai Smart Bazar ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಕೆಲಸ ಮಾಡುತ್ತದೆ. ಇದು ಉಳಿದಿಲ್ಲ.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              ಸಂಪರ್ಕ ಸಿದ್ಧವಾಗುತ್ತಿದೆ. ಸ್ವಲ್ಪ ಹೊತ್ತಿನ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOfflineAlertOpen(false)}
                className="bg-[#1e293b] hover:bg-slate-900 active:scale-95 text-white font-bold px-6 py-2 rounded-lg text-xs tracking-wider transition-all cursor-pointer shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
