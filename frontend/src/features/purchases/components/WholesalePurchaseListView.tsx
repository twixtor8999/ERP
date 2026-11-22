import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Download,
  Bot,
  CheckCircle2,
  Trash2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredPurchases,
  saveStoredPurchases,
  type PurchaseRecord,
} from "../data/mockPurchases";

export function WholesalePurchaseListView() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => getStoredPurchases());

  const todayStr = "2026-11-22";
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (fromDate && p.date < fromDate) return false;
      if (toDate && p.date > toDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          p.vendorName.toLowerCase().includes(q) ||
          p.invoiceNo.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [purchases, fromDate, toDate, searchQuery]);

  const approvedSum = useMemo(() => {
    return filteredPurchases
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.totalAmount, 0);
  }, [filteredPurchases]);

  const handleApprove = (id: number) => {
    const updated = purchases.map((p) => {
      if (p.id === id) {
        return { ...p, status: "approved" as const };
      }
      return p;
    });
    setPurchases(updated);
    saveStoredPurchases(updated);
    if (selectedPurchase?.id === id) {
      setSelectedPurchase({ ...selectedPurchase, status: "approved" });
    }
    toast.success("Purchase approved! Stock updated in Inventory.");
  };

  const handleDelete = (id: number, inv: string) => {
    if (confirm(`Delete purchase invoice ${inv}?`)) {
      const updated = purchases.filter((p) => p.id !== id);
      setPurchases(updated);
      saveStoredPurchases(updated);
      if (selectedPurchase?.id === id) setSelectedPurchase(null);
      toast.success(`Purchase ${inv} deleted`);
    }
  };

  const handleExport = () => {
    toast.success(`Exporting Purchase List (${fromDate} to ${toDate}) to Excel...`);
  };

  const handleAiPriceCheck = () => {
    toast.info("AI Price Check: All purchased SKU rates are within fair wholesale APMC market limits!");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header Row with Date Range Filter, + New Purchase, Export, AI Price Check */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {/* Date Range Strip */}
          <div className="flex items-center gap-2 text-xs bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 font-semibold pl-2">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded font-medium focus:outline-none"
            />
            <span className="text-slate-500 font-semibold">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded font-medium focus:outline-none"
            />
            <button
              type="button"
              onClick={() => toast.success("Filtered purchase list")}
              className="px-3 py-1 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors"
            >
              Submit
            </button>
          </div>

          {/* + New Purchase Button right beside Submit */}
          <button
            type="button"
            onClick={() => navigate("/purchases?tab=new")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Purchase
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            type="button"
            onClick={handleAiPriceCheck}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-sm transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            AI Price Check
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase List</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {fromDate} to {toDate} · Stock reaches Inventory only after Owner / Admin approves the entry.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
      </div>

      {/* Royal Blue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-bold text-[11px] tracking-wide uppercase">
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center w-12">Sl</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 w-28">Date</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[200px]">Vendor</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 w-36">Invoice</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center w-28">
                  Total Items
                </th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 text-right w-36">Total</th>
                <th className="py-2.5 px-4 text-center w-36">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No purchases in this range.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-800">
                      {p.date}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-slate-900">
                      {p.vendorName}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-mono font-medium text-blue-700">
                      <button
                        type="button"
                        onClick={() => setSelectedPurchase(p)}
                        className="hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {p.invoiceNo}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center font-bold">
                      {p.totalItems}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 text-right font-black text-slate-900">
                      ₹{p.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {p.status === "approved" ? (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded">
                          Approved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApprove(p.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-colors"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary Text matching Screenshot 1 */}
      <div className="text-xs font-semibold text-slate-600">
        Approved in this range: <b className="text-slate-900">₹{approvedSum.toLocaleString()}</b>
      </div>

      {/* Invoice Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Invoice {selectedPurchase.invoiceNo}
                </h3>
                <p className="text-xs text-slate-500">
                  Vendor: <b>{selectedPurchase.vendorName}</b> · Date: {selectedPurchase.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b">
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">GRN Rate</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedPurchase.lines.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{l.skuName}</td>
                      <td className="py-2 px-3 text-center">{l.qty}</td>
                      <td className="py-2 px-3 text-right">₹{l.grnPrice}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ₹{l.lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedPurchase.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedPurchase.id)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Entry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(selectedPurchase.id, selectedPurchase.invoiceNo)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500">
                  Total: <b className="text-slate-900 text-sm">₹{selectedPurchase.totalAmount.toLocaleString()}</b>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
