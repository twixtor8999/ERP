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
  { title: "Vehicle", href: "/vehicles" },
  { title: "Purchase", href: "/purchases" },
  { title: "CRM Report", href: "/crm?view=reports" },
  { title: "Expenses", href: "/expenses" },
  { title: "Inventory", href: "/inventory" },
  { title: "Stock Split", href: "/inventory?tab=split" },
  { title: "SKU's", href: "/products" },
  { title: "Employees", href: "/employees" },
  { title: "Incentive Scheme", href: "/incentives" },
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
