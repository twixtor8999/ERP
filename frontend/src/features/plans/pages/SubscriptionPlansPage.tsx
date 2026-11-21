import { useState, useEffect } from "react";
import { Sparkles, Check, ShieldCheck, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";

export function SubscriptionPlansPage() {
  const [data, setData] = useState<{
    tier: string;
    status: string;
    renewal_date: string;
    branches_used: number;
    branches_limit: number;
    users_used: number;
    users_limit: number;
    database_backend: string;
    api_quota: string;
    license_holder: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/subscription");
        setData(res.data);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          Subscription & Enterprise Plan Quotas
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Multi-branch deployment limits, cloud database resource allocation, and active staff license seats.
        </p>
      </div>

      {loading || !data ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border flex flex-col items-center">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span>Loading subscription license telemetry...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/40 text-xs px-3 py-1 font-semibold uppercase tracking-wider">
                  {data.tier}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" /> Active Enterprise License
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold">{data.license_holder}</h2>
                <p className="text-xs text-blue-200 mt-1">
                  Cloud Backend: {data.database_backend}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-blue-800/80 text-xs">
                <div>
                  <div className="text-blue-300">Branches Provisioned</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {data.branches_used} / {data.branches_limit}
                  </div>
                </div>
                <div>
                  <div className="text-blue-300">Active Staff Seats</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {data.users_used} / {data.users_limit}
                  </div>
                </div>
                <div>
                  <div className="text-blue-300">Annual Renewal</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {data.renewal_date}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Included Enterprise Capabilities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Multi-Branch POS with Real-Time Stock Locking</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Centralized Multi-Channel Payment Collections (UPI, Cash, Card)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Customer Storefront with OTP-Verified Home Deliveries</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Supabase PostgreSQL 17 Cloud Database Replication</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
