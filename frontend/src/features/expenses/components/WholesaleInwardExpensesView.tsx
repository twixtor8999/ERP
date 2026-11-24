import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredInwardExpenses,
  saveStoredInwardExpenses,
  type InwardExpenseRecord,
} from "../data/mockExpenses";
import { getStoredPurchases, saveStoredPurchases } from "@/features/purchases/data/mockPurchases";

export function WholesaleInwardExpensesView() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-11-24");
  const [toDate, setToDate] = useState("2026-11-24");
  const [searchQuery, setSearchQuery] = useState("");

  const [inwardExpenses, setInwardExpenses] = useState<InwardExpenseRecord[]>(() =>
    getStoredInwardExpenses()
  );
  const [viewExpense, setViewExpense] = useState<InwardExpenseRecord | null>(null);

  // Filtered expenses based on date & search
  const filteredExpenses = useMemo(() => {
    return inwardExpenses.filter((e) => {
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          e.invoiceNo.toLowerCase().includes(q) ||
          e.vendorName.toLowerCase().includes(q) ||
          e.expenseType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [inwardExpenses, fromDate, toDate, searchQuery]);

  // KPI Calculations
  const pendingAmount = useMemo(() => {
    return filteredExpenses
      .filter((e) => !e.ap)
      .reduce((sum, e) => sum + e.invoiceTotal, 0);
  }, [filteredExpenses]);

  const approvedAmount = useMemo(() => {
    return filteredExpenses
      .filter((e) => !!e.ap)
      .reduce((sum, e) => sum + e.invoiceTotal, 0);
  }, [filteredExpenses]);

  const handleApprove = (id: number) => {
    const updated = inwardExpenses.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          ap: {
            by: "Vijaykumar Shantagiri (Admin)",
            date: new Date().toISOString().split("T")[0] || "2026-11-24",
            at: new Date().toISOString(),
          },
        };
      }
      return e;
    });
    setInwardExpenses(updated);
    saveStoredInwardExpenses(updated);

    // Also sync with stored purchases if present
    const purchases = getStoredPurchases();
    const updatedPurchases = purchases.map((p) => {
      if (p.id === id) {
        return { ...p, status: "approved" as const };
      }
      return p;
    });
    saveStoredPurchases(updatedPurchases);

    toast.success("Inward purchase expense approved! Stock added to inventory.");
  };

  const handleExport = () => {
    toast.success(`Exporting Inward Expenses (${fromDate} to ${toDate}) to Excel...`);
  };

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Inward expenses loaded for ${fromDate} to ${toDate}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Top Bar with Back Button & Date Filter & Export matching Screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <form onSubmit={handleSubmitDate} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-600 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <span className="text-gray-600 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-1 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors shadow-sm cursor-pointer"
            >
              Submit
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-full transition-colors shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Page Title & Subtitle matching Screenshot 2 */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0d1b4c]">
          Inward expenses
        </h1>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Every purchase entry comes here automatically as a Purchase expense. Approve it once the invoice is checked / paid.
        </p>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {/* 2 Blue KPI Cards matching Screenshot 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Pending approval */}
        <div className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold opacity-90">
            <span className="text-base">⏳</span>
            Pending approval
          </div>
          <div>
            <div className="text-xs opacity-75 font-medium">Amount</div>
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight mt-0.5 font-mono">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Card 2: Approved in range */}
        <div className="bg-gradient-to-r from-[#1d4ed8] to-[#1e40af] text-white rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold opacity-90">
            <span className="text-base">✓</span>
            Approved in range
          </div>
          <div>
            <div className="text-xs opacity-75 font-medium">Amount</div>
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight mt-0.5 font-mono">
              ₹{approvedAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Inward Expenses Table matching Screenshot 2 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-[#2563eb] text-white font-bold">
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5 font-mono">Invoice no</th>
                <th className="py-2.5 px-3.5 text-right">Invoice Total</th>
                <th className="py-2.5 px-3.5 text-center">Approve</th>
                <th className="py-2.5 px-3.5 min-w-[200px]">Vendor name</th>
                <th className="py-2.5 px-3.5">Expenses type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredExpenses.length === 0 ? (
                /* Matches Screenshot 2 zero row */
                <tr className="hover:bg-gray-50/50 text-gray-500 font-mono text-center">
                  <td className="py-3 px-3.5">0</td>
                  <td className="py-3 px-3.5">0</td>
                  <td className="py-3 px-3.5 text-right">0</td>
                  <td className="py-3 px-3.5 text-center">0</td>
                  <td className="py-3 px-3.5">0</td>
                  <td className="py-3 px-3.5">0</td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setViewExpense(e)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3.5 text-gray-700 font-medium whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700">
                      {e.invoiceNo}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-gray-900 font-mono">
                      ₹{e.invoiceTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3.5 text-center" onClick={(evt) => evt.stopPropagation()}>
                      {e.ap ? (
                        <div>
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-emerald-200">
                            Approved
                          </span>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {e.ap.by.split(" ")[0]} · {e.ap.date}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApprove(e.id)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] rounded transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-gray-900">
                      {e.vendorName}
                    </td>
                    <td className="py-3 px-3.5 text-gray-600">
                      {e.expenseType}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Inward Expense Modal */}
      {viewExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#0d1b4c] text-white">
              <h3 className="font-bold text-base">Inward Purchase Expense</h3>
              <button
                type="button"
                onClick={() => setViewExpense(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs md:text-sm">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <span className="text-gray-500 text-xs">Invoice Total:</span>
                <div className="text-xl font-bold text-blue-900">₹{viewExpense.invoiceTotal.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-gray-500 text-xs">Invoice No:</span>
                  <div className="font-mono font-bold text-gray-800">{viewExpense.invoiceNo}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Invoice Date:</span>
                  <div className="font-semibold text-gray-800">{viewExpense.date}</div>
                </div>
              </div>

              <div>
                <span className="text-gray-500 text-xs">Supplier / Vendor:</span>
                <div className="font-bold text-gray-900 text-sm">{viewExpense.vendorName}</div>
              </div>

              <div>
                <span className="text-gray-500 text-xs">Expense Type:</span>
                <div className="font-medium text-gray-700">{viewExpense.expenseType}</div>
              </div>

              <div>
                <span className="text-gray-500 text-xs">Approval Status:</span>
                <div className="pt-0.5">
                  {viewExpense.ap ? (
                    <span className="text-emerald-700 font-bold">
                      Approved on {viewExpense.ap.date}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">Waiting for Owner / Admin approval</span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              {!viewExpense.ap && (
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(viewExpense.id);
                    setViewExpense(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] rounded transition-colors"
                >
                  Approve Inward Expense
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewExpense(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-300 ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

