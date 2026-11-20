export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: string;
  activeRoleId?: string;
  organizationId: string;
  organizationName: string;
  allowedBranches: BranchSummary[];
  activeBranchId: string | null;
  permissions: string[];
  dashboardRoute?: string;
}

export interface BranchSummary {
  id: string;
  code: string;
  name: string;
  city?: string;
  isHeadquarters?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

