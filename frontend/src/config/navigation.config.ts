export interface NavItem {
  title: string;
  href: string;
  iconName?: string;
  badge?: string;
  disabled?: boolean;
  isSectionHeader?: boolean;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Authoritative 23-tab Super Admin menu structure exactly matching
 * https://siddeshwar-enterprises.web.app/ (PK Ai Smart Bazar v5.08)
 */
export const navigationItems: NavItem[] = [
  { title: "Home Page", href: "/home" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Place Order", href: "/pos" },
  { title: "Callings", href: "/callings" },
  {
    title: "Orders",
    href: "/orders",
    children: [
      { title: "1) Packing", href: "/orders?tab=packing" },
      { title: "2) Invoice", href: "/orders?tab=invoice" },
      { title: "3) Dispatch", href: "/orders?tab=dispatch" },
      { title: "4) Delivery", href: "/orders?tab=delivery" },
      { title: "5) Orders Report", href: "/orders?tab=report" },
    ],
  },
  { title: "Settlement", href: "/settlements" },
  { title: "Sales vs Collection", href: "/payments" },
  { title: "Accounts", href: "/accounts" },
  { title: "QR Payments", href: "/payments?tab=upi" },
  {
    title: "B2B",
    href: "/b2b",
    children: [
      { title: "1) My Cart", href: "/b2b?tab=cart" },
      { title: "2) Orders List", href: "/b2b?tab=orders" },
    ],
  },
  {
    title: "Customer",
    href: "/customers",
    children: [
      { title: "1) New Customer", href: "/customers?tab=new" },
      { title: "2) Customers List", href: "/customers?tab=list" },
      { title: "3) Route Planner", href: "/customers?tab=routes" },
    ],
  },
  {
    title: "Vehicle",
    href: "/vehicles",
    children: [
      { title: "1) New Vehicle", href: "/vehicles?tab=new" },
      { title: "2) Vehicles List", href: "/vehicles?tab=list" },
      { title: "3) Vehicle Trips", href: "/vehicles?tab=trips" },
      { title: "4) Create Trip", href: "/vehicles?tab=create-trip" },
      { title: "5) Diesel Rate", href: "/vehicles?tab=diesel" },
    ],
  },
  {
    title: "Purchase",
    href: "/purchases",
    children: [
      { title: "1) Purchase List", href: "/purchases?tab=list" },
      { title: "Auto PO", href: "/purchases?tab=autopo" },
      { title: "2) Purchase Return", href: "/purchases?tab=returns" },
      { title: "3) Vendor", href: "/purchases?tab=vendor" },
    ],
  },
  {
    title: "CRM Report",
    href: "/crm-report",
    children: [
      { title: "1) CRM Dashboard", href: "/crm-report?tab=dashboard" },
      { title: "2) CRM Sales", href: "/crm-report?tab=sales" },
      { title: "3) Order Total", href: "/crm-report?tab=order-total" },
      { title: "4) Order Status", href: "/crm-report?tab=order-status" },
      { title: "5) Cancelled Orders", href: "/crm-report?tab=cancelled" },
      { title: "6) Team CRM Report", href: "/crm-report?tab=team" },
    ],
  },
  {
    title: "Expenses",
    href: "/expenses",
    children: [
      { title: "1) Expenses", href: "/expenses?tab=expenses" },
      { title: "2) Inward Expenses", href: "/expenses?tab=inward" },
    ],
  },
  {
    title: "Inventory",
    href: "/inventory",
    children: [
      { title: "1) Stock Movement", href: "/inventory?tab=movement" },
      { title: "2) Realtime Inventory", href: "/inventory?tab=realtime" },
      { title: "3) Punch Orders", href: "/inventory?tab=punch" },
      { title: "4) Daily Stock Audit", href: "/inventory?tab=audit" },
      { title: "5) Daily Audit Report", href: "/inventory?tab=report" },
      { title: "6) Physical Stocks", href: "/inventory?tab=physical" },
      { title: "7) Live Inventory V/S Sales", href: "/inventory?tab=livesales" },
    ],
  },
  { title: "Stock Split", href: "/inventory?tab=split" },
  {
    title: "SKU's",
    href: "/products",
    children: [
      { title: "1) SKU List", href: "/products?tab=list" },
      { title: "2) Create New SKU", href: "/products?tab=create" },
      { title: "3) Aging Stocks", href: "/products?tab=aging" },
      { title: "4) SKU's Wise Margin", href: "/products?tab=margin" },
      { title: "5) Category Wise Sales", href: "/products?tab=categories" },
    ],
  },
  {
    title: "Employees",
    href: "/employees",
    children: [
      { title: "1) Employee List", href: "/employees?tab=list" },
      { title: "2) Attendance", href: "/employees?tab=attendance" },
      { title: "3) Attendance List", href: "/employees?tab=att-list" },
      { title: "4) Salary Slip", href: "/employees?tab=salary" },
      { title: "5) Offer Letters", href: "/employees?tab=offers" },
    ],
  },
  {
    title: "Incentive Scheme",
    href: "/incentives",
    children: [
      { title: "1) SKU Target", href: "/incentives?tab=sku" },
      { title: "2) Sales Target", href: "/incentives?tab=sales" },
      { title: "3) Customer Target", href: "/incentives?tab=customer" },
      { title: "4) New Customer Target", href: "/incentives?tab=new-customer" },
      { title: "5) Village Target", href: "/incentives?tab=village" },
      { title: "6) Order Target", href: "/incentives?tab=order" },
      { title: "7) Target Status", href: "/incentives?tab=status" },
      { title: "8) Incentive Report", href: "/incentives?tab=report" },
      { title: "9) Scheme Poster", href: "/incentives?tab=poster" },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    children: [
      { title: "1) GST Report", href: "/reports?type=gst" },
      { title: "2) AI Assistant", href: "/reports?type=ai" },
      { title: "AI Cross Check", href: "/reports?type=audit" },
      { title: "CA Reports", href: "/reports?type=ca" },
      { title: "P & L", href: "/reports?type=pnl" },
    ],
  },
  { title: "Plans & Billing", href: "/plans-billing" },
  { title: "Duplicate Check", href: "/duplicate-check" },
];

// Retain navigationConfig for backwards compatibility where needed
export const navigationConfig: NavSection[] = [
  {
    title: "Operations",
    items: navigationItems,
  },
];
