import { useState, useEffect } from "react";
import { ShieldCheck, Clock, User, Terminal, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_name: string;
  ip_address: string | null;
  created_at: string | null;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/audit-logs");
        setLogs(res.data);
      } catch {
        toast.error("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Security & Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Chronological audit log tracking administrative changes, inventory updates, and privileged user actions.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading security audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No audit logs recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator / Staff</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "Recent"}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.user_name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                      {log.entity_id ? log.entity_id.slice(0, 12) + "..." : "SYSTEM"}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {log.ip_address || "127.0.0.1"}
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

