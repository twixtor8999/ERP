import { useState, useEffect } from "react";
import { Award, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";

interface SchemeItem {
  id: string;
  name: string;
  code: string;
  scheme_type: string;
  calculation_basis: string;
  reward: string;
  is_active: boolean;
}

export function IncentivesPage() {
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/incentives");
        setSchemes(res.data);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            Staff Incentive Schemes & Commission Rules
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Active employee reward plans for billing speed, zero-discrepancy shifts, and delivery completion benchmarks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading active incentive models...</span>
          </div>
        ) : (
          schemes.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                  <div className="font-mono text-xs text-blue-600 mt-0.5">{s.code}</div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                </Badge>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Benchmark Criteria:</span>
                  <div className="text-slate-800 font-medium mt-0.5">{s.calculation_basis}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-blue-900 font-semibold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{s.reward}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
