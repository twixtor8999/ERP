export interface CrmStaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  targetMonthly: number;
  ordersCount: number;
  customersCount: number;
  totalSales: number;
  incentive: number;
  lastOrderTime: string;
  callResults: {
    notReachable: number;
    shopClosed: number;
    callLater: number;
    stockAvailable: number;
    notInterested: number;
    orderPlaced: number;
  };
}

export interface CrmOrderItem {
  name: string;
  unit: string;
  qty: number;
  price: number;
}

export interface CrmOrderRecord {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  shopName: string;
  village: string;
  route: string;
  staffName: string;
  source: "CRM" | "APP";
  orderDate: string;
  orderTime: string;
  placedTimestamp: string;
  packedTimestamp?: string;
  dispatchedTimestamp?: string;
  outForDeliveryTimestamp?: string;
  deliveredTimestamp?: string;
  completedTimestamp?: string;
  status: "placed" | "packed" | "dispatched" | "delivered" | "completed" | "cancelled";
  statusDisplay: string;
  total: number;
  items: CrmOrderItem[];
}

export interface CancelledOrderRecord {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  orderTakenDate: string;
  cancelledDate: string;
  stage: string;
  reason: string;
  cancelledBy: string;
  amount: number;
}

export const INITIAL_CRM_STAFF: CrmStaffMember[] = [
  {
    id: "staff-pushpa",
    name: "Pushpa Patil",
    phone: "9880012589",
    role: "CRM Staff / Telecaller",
    targetMonthly: 500000,
    ordersCount: 3,
    customersCount: 3,
    totalSales: 17077,
    incentive: 0,
    lastOrderTime: "22-11-2026 10:56 am",
    callResults: {
      notReachable: 0,
      shopClosed: 0,
      callLater: 0,
      stockAvailable: 0,
      notInterested: 0,
      orderPlaced: 3,
    },
  },
  {
    id: "staff-dhruthi",
    name: "Dhruthi A S",
    phone: "8861146082",
    role: "CRM Staff / Telecaller",
    targetMonthly: 400000,
    ordersCount: 2,
    customersCount: 2,
    totalSales: 11620,
    incentive: 0,
    lastOrderTime: "22-11-2026 05:39 pm",
    callResults: {
      notReachable: 0,
      shopClosed: 0,
      callLater: 0,
      stockAvailable: 0,
      notInterested: 0,
      orderPlaced: 2,
    },
  },
  {
    id: "staff-mahalaxmi",
    name: "Mahalaxmi Hiremath",
    phone: "9688638706",
    role: "CRM Staff / Telecaller",
    targetMonthly: 350000,
    ordersCount: 0,
    customersCount: 0,
    totalSales: 0,
    incentive: 0,
    lastOrderTime: "—",
    callResults: {
      notReachable: 0,
      shopClosed: 0,
      callLater: 0,
      stockAvailable: 0,
      notInterested: 0,
      orderPlaced: 0,
    },
  },
];

export const INITIAL_CRM_ORDERS: CrmOrderRecord[] = [
  {
    id: "ord-1505",
    orderNo: "ORD-1505",
    customerName: "SOUJANYA ENTERPRISES",
    customerPhone: "9880012589",
    shopName: "Soujanya Store",
    village: "Tadavajga",
    route: "Tadavalaga",
    staffName: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "10:56 am",
    placedTimestamp: "22-11-2026 10:56 am",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 7140,
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 6, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 25, price: 26 },
    ],
  },
  {
    id: "ord-1506",
    orderNo: "ORD-1506",
    customerName: "Ashok Hadagali",
    customerPhone: "8861146082",
    shopName: "Hadagali Traders",
    village: "Devara Hippargi",
    route: "DEVARHIPARAGI",
    staffName: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "11:20 am",
    placedTimestamp: "22-11-2026 11:20 am",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 6247,
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 5, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 25, price: 128 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 32, price: 26 },
    ],
  },
  {
    id: "ord-1507",
    orderNo: "ORD-1507",
    customerName: "Chandrshekhar",
    customerPhone: "9688638706",
    shopName: "Chandrshekhar General Store",
    village: "Tadavajga",
    route: "Tadavalaga",
    staffName: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "01:15 pm",
    placedTimestamp: "22-11-2026 01:15 pm",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 3690,
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 20, price: 128 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 7, price: 165 },
    ],
  },
  {
    id: "ord-1508",
    orderNo: "ORD-1508",
    customerName: "M M TALAWAR",
    customerPhone: "7483168829",
    shopName: "Talawar Provisions",
    village: "Tadavajga",
    route: "Tadavalaga",
    staffName: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:39 pm",
    placedTimestamp: "22-11-2026 05:39 pm",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 5960,
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 10, price: 440 },
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 6, price: 235 },
      { name: "Everest Turmeric Powder 500g", unit: "Box", qty: 1, price: 150 },
    ],
  },
  {
    id: "ord-1509",
    orderNo: "ORD-1509",
    customerName: "BASAVARAJ PATIL",
    customerPhone: "9035755672",
    shopName: "Patil Kirana",
    village: "Tadavajga",
    route: "Tamba",
    staffName: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:30 pm",
    placedTimestamp: "22-11-2026 05:30 pm",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 5660,
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 11, price: 165 },
    ],
  },
];

export const INITIAL_CANCELLED_ORDERS: CancelledOrderRecord[] = [];
