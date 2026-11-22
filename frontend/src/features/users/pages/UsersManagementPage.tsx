import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  UserCheck,
  Building,
  UserPlus,
  X,
  Lock,
  User,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // New Staff Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRoleSlug, setNewStaffRoleSlug] = useState("crm_executive");
  const [newStaffBranchId, setNewStaffBranchId] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
      const defaultRole =
        rolesRes.data.find((r: RoleItem) => r.slug === "cashier" || r.slug === "sales_executive") ||
        rolesRes.data[0];
      const defaultBranch = branchesRes.data[0];

      if (defaultBranch && !newStaffBranchId) {
        setNewStaffBranchId(defaultBranch.id);
      }

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
      const msg =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error axios response
            err.response?.data?.detail || "Approval failed"
          : "Failed to approve staff account";
      toast.error("Approval Error", { description: msg });
    } finally {
      setApprovingId(null);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newStaffPhone.replace(/\D/g, "");
    if (!newStaffName.trim()) {
      toast.error("Missing Field", { description: "Please enter staff member's full name." });
      return;
    }
    if (cleanPhone.length !== 10) {
      toast.error("Invalid Phone", { description: "Please enter a valid 10-digit mobile number." });
      return;
    }
    if (newStaffPassword.length < 6) {
      toast.error("Short Password", { description: "Password must be at least 6 characters." });
      return;
    }

    setIsCreating(true);
    try {
      await apiClient.post("/users", {
        full_name: newStaffName.trim(),
        phone: cleanPhone,
        email: newStaffEmail.trim() || undefined,
        password: newStaffPassword,
        initial_role_slug: newStaffRoleSlug || undefined,
        initial_branch_id: newStaffBranchId || undefined,
      });

      toast.success("Staff Account Created", {
        description: `${newStaffName.trim()} can now log in using phone number ${cleanPhone}.`,
      });

      // Reset and close
      setNewStaffName("");
      setNewStaffPhone("");
      setNewStaffPassword("");
      setNewStaffEmail("");
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error axios response
            err.response?.data?.detail || "Failed to create staff account"
          : "Failed to create staff account";
      toast.error("Creation Failed", { description: msg });
    } finally {
      setIsCreating(false);
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
            Manage staff credentials, add new employees, assign operational roles (CRM Telecaller, Cashier, Sales, Branch Manager), and manage access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* New Staff Button */}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-4 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ New Staff</span>
          </Button>
        </div>
      </div>

      {/* Pending Approvals Queue (if any legacy or self-registered exist) */}
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

      {/* New Staff Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Staff Member</h3>
                  <p className="text-xs text-slate-500">Create login credentials and assign operational role</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              {/* Staff Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Staff Member Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="pl-9 h-10 text-sm border-slate-300 rounded-lg"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Mobile Number (10 digits) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                    +91
                  </span>
                  <Input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value.replace(/\D/g, ""))}
                    className="pl-12 h-10 font-mono text-sm border-slate-300 rounded-lg"
                    disabled={isCreating}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Used as username to sign in to the CRM or POS portal.</p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Staff Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type={showModalPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Enter password (min 6 characters)"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="pl-9 pr-10 h-10 text-sm border-slate-300 rounded-lg"
                    disabled={isCreating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role & Branch Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Operational Role
                  </Label>
                  <select
                    value={newStaffRoleSlug}
                    onChange={(e) => setNewStaffRoleSlug(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  >
                    <option value="crm_executive">CRM Telecaller (Rural Calling & Orders)</option>
                    <option value="cashier">Cashier (Counter Billing POS)</option>
                    <option value="sales_executive">Sales Executive</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="admin">Store Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    Assigned Branch
                  </Label>
                  <select
                    value={newStaffBranchId}
                    onChange={(e) => setNewStaffBranchId(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="e.g. staff@siddeshwar.in (auto-generated if empty)"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="pl-9 h-10 text-sm border-slate-300 rounded-lg"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="text-xs h-9 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating Staff...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Create & Grant Access
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
