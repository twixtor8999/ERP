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
        title: "Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
      },
    ],
  },
  {
    title: "Operations & Sales",
    items: [
      {
        title: "Point of Sale & Billing",
        href: "/billing",
        iconName: "Receipt",
      },
      {
        title: "Orders",
        href: "/orders",
        iconName: "ShoppingCart",
      },
      {
        title: "Customers & CRM",
        href: "/crm",
        iconName: "Users",
      },
      {
        title: "Duplicate Check",
        href: "/duplicate-check",
        iconName: "UserCheck",
      },
    ],
  },
  {
    title: "Inventory & Purchasing",
    items: [
      {
        title: "Products Catalog",
        href: "/products",
        iconName: "Package",
      },
      {
        title: "Inventory Stock",
        href: "/inventory",
        iconName: "Boxes",
      },
      {
        title: "Purchases",
        href: "/purchases",
        iconName: "Truck",
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        iconName: "Building2",
      },
    ],
  },
  {
    title: "Finance & Accounts",
    items: [
      {
        title: "Payments & Collections",
        href: "/payments",
        iconName: "CreditCard",
      },
      {
        title: "Settlements",
        href: "/settlements",
        iconName: "ArrowLeftRight",
      },
      {
        title: "General Accounts",
        href: "/accounts",
        iconName: "BookOpen",
      },
      {
        title: "Expenses",
        href: "/expenses",
        iconName: "Wallet",
      },
      {
        title: "Business Reports",
        href: "/reports",
        iconName: "BarChart3",
      },
    ],
  },
  {
    title: "Staff & Logistics",
    items: [
      {
        title: "Employees",
        href: "/employees",
        iconName: "UserCog",
      },
      {
        title: "Incentives",
        href: "/incentives",
        iconName: "Award",
      },
      {
        title: "Vehicles & Transport",
        href: "/vehicles",
        iconName: "Car",
      },
    ],
  },
  {
    title: "Enterprise Administration",
    items: [
      {
        title: "Organization",
        href: "/organization",
        iconName: "Building",
      },
      {
        title: "Branches",
        href: "/branches",
        iconName: "GitFork",
      },
      {
        title: "Users & Security",
        href: "/users",
        iconName: "ShieldCheck",
      },
      {
        title: "Roles & Permissions",
        href: "/roles",
        iconName: "KeyRound",
      },
      {
        title: "Subscription & Plans",
        href: "/plans-billing",
        iconName: "Coins",
      },
      {
        title: "Audit Logs",
        href: "/audit-logs",
        iconName: "History",
      },
      {
        title: "System Settings",
        href: "/settings",
        iconName: "Settings",
      },
    ],
  },
];
