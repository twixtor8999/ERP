import { useState, useEffect } from "react";
import { Users, Shield, CheckCircle2, Clock, AlertTriangle, Loader2, UserCheck, Building } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserItem {
  id: string;
  phone: string;
  email: string | null;
  full_name: string;
  approval_status: string;
  is_active: boolean;
  primary_role_slug: string | null;
}

interface RoleItem {
  id: string;
  name: string;
  slug: string;
}

interface BranchItem {
  id: string;
  branch_name: string;
  branch_code: string;
}

export function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Per-user selected role & branch for approvals
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, branchesRes] = await Promise.all([
        apiClient.get("/users"),
        apiClient.get("/admin/roles"),
        apiClient.get("/admin/branches"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setBranches(branchesRes.data);

      // Default role to Cashier or Sales Executive if available
      const defaultRole = rolesRes.data.find((r: RoleItem) => r.slug === "cashier" || r.slug === "sales_executive") || rolesRes.data[0];
      const defaultBranch = branchesRes.data[0];

      const initialRoles: Record<string, string> = {};
      const initialBranches: Record<string, string> = {};

      for (const u of usersRes.data) {
        if (defaultRole) initialRoles[u.id] = defaultRole.id;
        if (defaultBranch) initialBranches[u.id] = defaultBranch.id;
      }
      setSelectedRoles(initialRoles);
      setSelectedBranches(initialBranches);
    } catch {
      toast.error("Failed to load staff management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (userId: string, fullName: string) => {
    const roleId = selectedRoles[userId];
    const branchId = selectedBranches[userId];

    if (!roleId) {
      toast.error("Role Required", { description: "Please select an operational role to assign." });
      return;
    }

    setApprovingId(userId);
    try {
      await apiClient.post(`/users/${userId}/approve`, {
        role_id: roleId,
        branch_id: branchId || null,
      });

      const assignedRoleName = roles.find((r) => r.id === roleId)?.name || "Assigned Role";
      toast.success("Staff Approved & Activated", {
        description: `${fullName} has been granted access as ${assignedRoleName}.`,
      });
      loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        // @ts-expect-error axios response
        ? err.response?.data?.detail || "Approval failed"
        : "Failed to approve staff account";
      toast.error("Approval Error", { description: msg });
    } finally {
      setApprovingId(null);
    }
  };

  const pendingUsers = users.filter((u) => u.approval_status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Staff Security & Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review new staff self-registrations, assign operational roles (Cashier, Sales, CRM, Logistics), and control branch permissions.
          </p>
        </div>
      </div>

      {/* Pending Approvals Queue */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between text-amber-900 font-bold text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Pending Operational Staff Registrations ({pendingUsers.length})</span>
            </div>
            <span className="text-xs text-amber-700 font-medium">Super Admin Decision Required</span>
          </div>

          <div className="space-y-2.5">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 bg-white rounded-xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {u.full_name}
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-medium">
                      <Clock className="w-3 h-3 mr-1" /> Needs Role Assignment
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Phone: {u.phone} {u.email ? `• ${u.email}` : ""}
                  </div>
                </div>

                {/* Role & Branch Assignment Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-600" /> Assign Role:
                    </label>
                    <select
                      value={selectedRoles[u.id] || ""}
                      onChange={(e) => setSelectedRoles({ ...selectedRoles, [u.id]: e.target.value })}
                      aria-label="Assign Role"
                      className="text-xs p-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Building className="w-3 h-3 text-indigo-600" /> Branch:
                    </label>
                    <select
                      value={selectedBranches[u.id] || ""}
                      onChange={(e) => setSelectedBranches({ ...selectedBranches, [u.id]: e.target.value })}
                      aria-label="Assign Branch"
                      className="text-xs p-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleApprove(u.id, u.full_name)}
                    disabled={approvingId === u.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 font-semibold shadow-xs flex items-center gap-1.5 mt-4 md:mt-0"
                  >
                    {approvingId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Approve & Grant Access
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Staff Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-sm">Active Authorized Staff Directory</div>
          <Badge variant="outline" className="text-slate-600 font-mono text-xs">
            {users.length} Total Users
          </Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-600" />
            <span>Loading user directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Security Role</th>
                  <th className="py-3 px-4 text-center">Approval Status</th>
                  <th className="py-3 px-4 text-center">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.email || "No email"}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {u.phone}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-300 font-mono text-xs">
                        {u.primary_role_slug ? u.primary_role_slug.replace(/_/g, " ").toUpperCase() : "GENERAL STAFF"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.approval_status === "APPROVED" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
