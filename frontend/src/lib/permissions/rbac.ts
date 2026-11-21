/**
 * Role-Based Access Control (RBAC) helpers
 */

export type RoleType =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "BRANCH_MANAGER"
  | "CASHIER"
  | "INVENTORY_MANAGER"
  | "ACCOUNTANT"
  | "STAFF";

export interface UserPermissionContext {
  userId: string;
  role: RoleType;
  organizationId: string;
  allowedBranchIds: string[];
  activeBranchId: string | null;
  permissions: string[];
}

export function hasPermission(
  ctx: UserPermissionContext | null,
  permission: string
): boolean {
  if (!ctx) return false;
  if (ctx.role === "SUPER_ADMIN" || ctx.role === "ORG_ADMIN") {
    return true;
  }
  return ctx.permissions.includes(permission) || ctx.permissions.includes("*");
}

export function hasBranchAccess(
  ctx: UserPermissionContext | null,
  branchId: string
): boolean {
  if (!ctx) return false;
  if (ctx.role === "SUPER_ADMIN" || ctx.role === "ORG_ADMIN") {
    return true;
  }
  return ctx.allowedBranchIds.includes(branchId);
}

