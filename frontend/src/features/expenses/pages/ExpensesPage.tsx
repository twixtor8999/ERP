import { useState, useEffect } from "react";
import { Receipt, Plus, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ExpenseItem {
  id: string;
  expense_number: string;
  branch_name: string;
  amount: number;
  paid_to: string;
  description: string;
  status: string;
  created_at: string | null;
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [branches, setBranches] = useState<{ id: string; branch_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [amount, setAmount] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [description, setDescription] = useState("");
  const [branchId, setBranchId] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, brRes] = await Promise.all([
        apiClient.get("/admin/expenses"),
        apiClient.get("/admin/branches"),
      ]);
      setExpenses(expRes.data);
      setBranches(brRes.data);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paidTo || !description) {
      toast.error("Validation Error", { description: "All fields are required." });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/admin/expenses", {
        amount: parseFloat(amount),
        paid_to: paidTo,
        description,
        branch_id: branchId || null,
      });
      toast.success("Expense Logged", { description: `Recorded payment of ₹${amount} to ${paidTo}` });
      setIsModalOpen(false);
      setAmount("");
      setPaidTo("");
      setDescription("");
      loadData();
    } catch {
      toast.error("Failed to log expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Branch Operating Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Log in-store petty cash, store maintenance, packaging supplies, and utility vouchers.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Log Expense Voucher
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading expense ledgers...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No expense records</p>
            <p className="text-xs text-slate-400 mt-1">Log branch petty cash and operational expenses above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Branch Location</th>
                  <th className="py-3 px-4">Paid To / Payee</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-blue-600 font-bold">
                      {e.expense_number}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {e.branch_name}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {e.paid_to}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {e.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{e.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {e.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Log Expense Voucher</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Amount (₹) *</label>
                <Input required type="number" step="0.01" placeholder="e.g. 1500.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Paid To / Payee *</label>
                <Input required placeholder="e.g. Laxmi Packaging Supplies" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Branch Location</label>
                <select aria-label="Branch Location" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white">
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description / Remarks *</label>
                <Input required placeholder="e.g. Counter roll bags and thermal billing paper rolls" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white" disabled={submitting}>
                  {submitting ? "Logging..." : "Log Voucher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
