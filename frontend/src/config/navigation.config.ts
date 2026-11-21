export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  disabled?: boolean;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Business Today",
        href: "/dashboard",
        iconName: "LayoutDashboard",
      },
    ],
  },
  {
    title: "Products & Stock",
    items: [
      {
        title: "Products Catalog",
        href: "/products",
        iconName: "Package",
      },
      {
        title: "Stock & Inventory",
        href: "/inventory",
        iconName: "Boxes",
      },
      {
        title: "Purchase Orders",
        href: "/purchases",
        iconName: "Truck",
      },
      {
        title: "Suppliers & Vendors",
        href: "/suppliers",
        iconName: "Building2",
      },
    ],
  },
  {
    title: "Sales & Bills",
    items: [
      {
        title: "Billing Counter (POS)",
        href: "/pos",
        iconName: "Receipt",
      },
      {
        title: "Bills History & Orders",
        href: "/orders",
        iconName: "ShoppingCart",
      },
      {
        title: "Home Deliveries",
        href: "/deliveries",
        iconName: "Truck",
      },
      {
        title: "Daily Cash & Drawer",
        href: "/settlements",
        iconName: "ArrowLeftRight",
      },
    ],
  },
  {
    title: "Customers & Khata",
    items: [
      {
        title: "Customer Directory & Khata",
        href: "/crm",
        iconName: "Users",
      },
    ],
  },
  {
    title: "Store & Team",
    items: [
      {
        title: "Staff & Attendance",
        href: "/employees",
        iconName: "UserCog",
      },
      {
        title: "Store Branches",
        href: "/branches",
        iconName: "GitFork",
      },
      {
        title: "Accounts & Khata Ledger",
        href: "/accounts",
        iconName: "BookOpen",
      },
      {
        title: "Business Reports",
        href: "/reports",
        iconName: "BarChart3",
      },
      {
        title: "Store Settings & GST",
        href: "/settings",
        iconName: "Settings",
      },
    ],
  },
];

