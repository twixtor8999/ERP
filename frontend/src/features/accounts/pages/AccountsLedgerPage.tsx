import { useState, useEffect } from "react";
import { BookOpen, Wallet, ArrowUpRight, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AccountItem {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  is_group: boolean;
  current_balance: number;
  is_active: boolean;
}

export function AccountsLedgerPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/accounts");
        setAccounts(res.data);
      } catch {
        toast.error("Failed to load chart of accounts");
      } finally {
        setLoading(false);
      }
    }
    loadAccounts();
  }, []);

  const totalAssets = accounts
    .filter((a) => a.account_type === "ASSET")
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const totalRevenue = accounts
    .filter((a) => a.account_type === "REVENUE")
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            General Ledger & Chart of Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Financial chart of accounts, operational ledger hierarchy, and current trial balance figures.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Total Current Assets</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">₹{totalAssets.toFixed(2)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Recorded Revenue Ledger</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">₹{totalRevenue.toFixed(2)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading chart of accounts...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                      {a.account_code}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      {a.account_name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          a.account_type === "ASSET"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : a.account_type === "REVENUE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : a.account_type === "LIABILITY"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }
                      >
                        {a.account_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{a.current_balance.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
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
