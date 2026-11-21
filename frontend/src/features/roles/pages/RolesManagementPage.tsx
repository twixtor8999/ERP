import { useState, useEffect } from "react";
import { Shield, KeyRound, Users, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface RoleItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_system: boolean;
  user_count: number;
  permission_count: number;
}

export function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoles() {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/roles");
        setRoles(res.data);
      } catch {
        toast.error("Failed to load roles");
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Roles & Granular RBAC Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Inspect fixed enterprise roles, permission allocations, and administrative access privileges.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading role matrix...</span>
          </div>
        ) : (
          roles.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{r.name}</h3>
                  <div className="font-mono text-xs text-blue-600 mt-0.5">{r.slug}</div>
                </div>
                {r.is_system && (
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                    System Core
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                {r.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  {r.permission_count} Permissions
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {r.user_count} Active Staff
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
