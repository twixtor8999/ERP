import { useState, useEffect } from "react";
import { Users, Shield, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
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

export function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/users");
      setUsers(res.data);
    } catch {
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (userId: string, fullName: string) => {
    setApprovingId(userId);
    try {
      await apiClient.post(`/users/${userId}/approve`, {
        approval_status: "APPROVED",
        approver_notes: "Approved by Super Admin via ERP Command Center",
      });
      toast.success("Staff Approved", { description: `${fullName} has been granted access.` });
      loadUsers();
    } catch {
      toast.error("Approval Failed");
    } finally {
      setApprovingId(null);
    }
  };

  const pendingUsers = users.filter((u) => u.approval_status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            User Accounts & Security Access
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage authorized employee accounts, approve pending self-registrations, and inspect RBAC status.
          </p>
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Pending Operational Staff Approvals ({pendingUsers.length})
          </div>
          <div className="divide-y divide-amber-200/60 bg-white rounded-lg border border-amber-200">
            {pendingUsers.map((u) => (
              <div key={u.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-slate-900">{u.full_name}</div>
                  <div className="text-xs text-slate-500 font-mono">Mobile: {u.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    <Clock className="w-3 h-3 mr-1" /> Pending Approval
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(u.id, u.full_name)}
                    disabled={approvingId === u.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    {approvingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Approve Account"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading user directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4 text-center">Approval Status</th>
                  <th className="py-3 px-4 text-center">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-xs text-slate-400">{u.email || "No email"}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {u.phone}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        {u.primary_role_slug || "cashier"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.approval_status === "APPROVED" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
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
