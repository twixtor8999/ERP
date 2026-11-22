import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, X, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

interface PendingRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: string;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isStaffAdmin =
    user?.role?.toLowerCase().includes("admin") ||
    user?.role?.toLowerCase().includes("owner") ||
    user?.permissions?.includes("*");

  const loadRequests = async () => {
    if (!isStaffAdmin) return;
    try {
      setLoading(true);
      const res = await apiClient.get<PendingRequest[]>("/api/v1/admin/access-requests");
      setRequests(res.data);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStaffAdmin) {
      loadRequests();
      const interval = setInterval(loadRequests, 30000); // 30s polling
      return () => clearInterval(interval);
    }
  }, [isStaffAdmin]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleQuickApprove = async (req: PendingRequest) => {
    setActionInProgress(req.id);
    try {
      await apiClient.post(`/api/v1/admin/access-requests/${req.id}/approve`, {
        base_salary: 18000,
        role_slug: req.role || "crm_executive",
      });
      toast.success("Approved & Activated!", {
        description: `${req.full_name} is now active. Login credentials enabled.`,
      });
      loadRequests();
    } catch {
      toast.error("Failed to approve access request");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleQuickReject = async (req: PendingRequest) => {
    setActionInProgress(req.id);
    try {
      await apiClient.post(`/api/v1/admin/access-requests/${req.id}/reject`);
      toast.info("Request Declined", {
        description: `Access request for ${req.full_name} declined.`,
      });
      loadRequests();
    } catch {
      toast.error("Failed to decline request");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadRequests();
        }}
        className="relative h-9 w-9 text-slate-600 hover:text-slate-900 cursor-pointer"
        title="Staff Access Applications"
      >
        <Bell className="w-4 h-4" />
        <span className="sr-only">Notifications</span>
        {requests.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black shadow-xs animate-bounce">
            {requests.length}
          </span>
        )}
      </Button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Staff Applications ({requests.length})
              </h4>
            </div>
            <Link
              to="/dashboard/employees"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-blue-300 hover:text-white flex items-center gap-1 font-semibold"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mb-1 text-blue-600" />
                <span className="text-xs">Checking applications...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-6 text-center text-slate-500 space-y-1">
                <p className="text-xs font-semibold">No Pending Applications</p>
                <p className="text-[10px] text-slate-400">
                  New telecallers & staff registering from the login portal will appear here for 1-click approval.
                </p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="p-3 hover:bg-slate-50 transition-colors space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{req.full_name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{req.phone}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {req.role === "crm_executive" || req.role === "telecaller"
                        ? "📞 Telecaller"
                        : req.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleQuickReject(req)}
                      disabled={actionInProgress === req.id}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => handleQuickApprove(req)}
                      disabled={actionInProgress === req.id}
                      className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      {actionInProgress === req.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

