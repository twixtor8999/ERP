import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import {
  getStoredInwardExpenses,
  saveStoredInwardExpenses,
  type InwardExpenseRecord,
  getStoredExpenses,
  saveStoredExpenses,
  type ExpenseRecord,
} from "../data/mockExpenses";
import { getStoredPurchases, saveStoredPurchases } from "@/features/purchases/data/mockPurchases";
import { WholesaleInwardExpenseDetailView } from "./WholesaleInwardExpenseDetailView";

export function WholesaleInwardExpensesView() {
  const navigate = useNavigate();
  const todayIso = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);
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
    const today = new Date().toISOString().slice(0, 10);
    const currentUser = useAuthStore.getState().user;
    const approverName = currentUser?.fullName ? `${currentUser.fullName} (${currentUser.role ? currentUser.role.replace(/_/g, " ") : "Admin"})` : "Admin";
    let approvedRecord: InwardExpenseRecord | undefined;

    const updated: InwardExpenseRecord[] = inwardExpenses.map((e) => {
      if (e.id === id) {
        approvedRecord = {
          ...e,
          ap: {
            by: approverName,
            date: today,
            at: new Date().toISOString(),
          },
        };
        return approvedRecord;
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

    // Log corresponding entry into main Expenses ledger
    if (approvedRecord) {
      const expenses = getStoredExpenses();
      const existingExp = expenses.find((x) => x.billNo === approvedRecord!.invoiceNo);
      if (!existingExp) {
        const newExpense: ExpenseRecord = {
          id: Date.now(),
          date: today,
          cat: "Procurement",
          sub: "Stock Inward",
          amt: approvedRecord.invoiceTotal,
          paymentType: "Credit",
          paidTo: approvedRecord.vendorName,
          billNo: approvedRecord.invoiceNo,
          remarks: `Purchase invoice ${approvedRecord.invoiceNo} · ${approvedRecord.vendorName}`,
          ap: {
            by: "Vijaykumar Shantagiri (Admin)",
            date: today,
            at: new Date().toISOString(),
          },
        };
        saveStoredExpenses([newExpense, ...expenses]);
      }
    }

    toast.success("Inward purchase expense approved! Synced to Purchases and Expenses.");
  };

  const handleExport = () => {
    toast.success(`Exporting Inward Expenses (${fromDate} to ${toDate}) to Excel...`);
  };

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Inward expenses loaded for ${fromDate} to ${toDate}`);
  };

  // Dedicated 2nd Page: If viewing inward expense, render full page
  if (viewExpense) {
    return (
      <WholesaleInwardExpenseDetailView
        expense={viewExpense}
        onBack={() => setViewExpense(null)}
        onApprove={(id) => {
          handleApprove(id);
          setViewExpense(null);
        }}
      />
    );
  }

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

      {/* Inward Expenses Table matching Screenshot 2 with fixed 7-8 rows scroll */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead className="sticky top-0 z-10 shadow-sm">
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
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                    <p className="text-sm font-semibold text-gray-700">No inward purchase expenses recorded in this date range.</p>
                    <p className="text-xs text-gray-400 mt-1">Select another date range or submit purchase entries in the Purchase module.</p>
                  </td>
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
    </div>
  );
}

