import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { B2bOrderDetailView } from "./B2bOrderDetailView";

export interface B2bOrderRow {
  sl: number;
  id: string;
  orderNo: string;
  invoiceNo?: string;
  date: string;
  customerName: string;
  villageName: string;
  status: "placed" | "packed" | "invoiced" | "dispatched" | "delivered";
  total: number;
  items: Array<{ name: string; qty: number; price: number }>;
}

export function WholesaleB2bOrdersListView() {
  const navigate = useNavigate();

  // Today's ISO date (YYYY-MM-DD)
  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  })();

  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);
  const [appliedFromDate, setAppliedFromDate] = useState(todayIso);
  const [appliedToDate, setAppliedToDate] = useState(todayIso);
  const [pageSearch, setPageSearch] = useState("");

  const [orders, setOrders] = useState<B2bOrderRow[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<B2bOrderRow | null>(null);

  // Helper to format date into YYYY-MM-DD
  const toIsoDate = (dStr: string): string => {
    const trimmed = (dStr || "").trim();
    const m1 = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m1 && m1[1] && m1[2] && m1[3]) return `${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}`;
    const m2 = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m2 && m2[1] && m2[2] && m2[3]) return `${m2[3]}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`;
    return trimmed || todayIso;
  };

  // Sync real-time orders from pipeline
  useEffect(() => {
    const syncOrders = () => {
      try {
        const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
        if (storedPipeline) {
          const pipeline = JSON.parse(storedPipeline);
          if (Array.isArray(pipeline)) {
            const mapped: B2bOrderRow[] = pipeline.map((po: any, idx: number) => {
              const rawDate = (po.deliveredAt || po.orderDate || "").trim();
              const iso = toIsoDate(rawDate);
              const dParts = iso.split("-");
              const dmy = dParts.length === 3 ? `${dParts[2]}-${dParts[1]}-${dParts[0]}` : iso;

              let status: B2bOrderRow["status"] = "placed";
              const stage = (po.stage || po.status || "").toLowerCase();
              if (stage === "delivered" || stage === "completed") status = "delivered";
              else if (stage === "dispatched" || stage === "dispatch") status = "dispatched";
              else if (stage === "invoice" || stage === "invoiced") status = "invoiced";
              else if (stage === "packed" || stage === "packing") status = "packed";

              return {
                sl: idx + 1,
                id: String(po.id || po.orderNo),
                orderNo: po.orderNo || `ORD-${1000 + idx}`,
                invoiceNo: po.invoiceNo || (po.orderNo ? po.orderNo.replace("ORD-", "INV-") : undefined),
                date: dmy,
                customerName: po.customerName || po.shopName || "Customer",
                villageName: po.village || po.route || "Bijapur",
                status,
                total: Number(po.total || po.orderTotal || 0),
                items: Array.isArray(po.items)
                  ? po.items.map((it: any) => ({
                      name: it.name || it.itemName || "Item",
                      qty: Number(it.qty || 1),
                      price: Number(it.price || it.rate || 0),
                    }))
                  : [],
              };
            });
            setOrders(mapped);
          }
        }
      } catch (e) {
        console.error("Failed to load pipeline orders in B2B Orders List", e);
      }
    };

    syncOrders();
    window.addEventListener("crm_order_placed", syncOrders);
    window.addEventListener("settlements_updated", syncOrders);
    window.addEventListener("storage", syncOrders);
    return () => {
      window.removeEventListener("crm_order_placed", syncOrders);
      window.removeEventListener("settlements_updated", syncOrders);
      window.removeEventListener("storage", syncOrders);
    };
  }, [todayIso]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const oIso = toIsoDate(o.date);
        if (appliedFromDate && oIso < appliedFromDate) return false;
        if (appliedToDate && oIso > appliedToDate) return false;
        if (!pageSearch.trim()) return true;
        const q = pageSearch.toLowerCase();
        return (
          o.customerName.toLowerCase().includes(q) ||
          o.villageName.toLowerCase().includes(q) ||
          o.orderNo.toLowerCase().includes(q) ||
          (o.invoiceNo && o.invoiceNo.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const isoA = toIsoDate(a.date);
        const isoB = toIsoDate(b.date);
        return isoB.localeCompare(isoA);
      });
  }, [orders, appliedFromDate, appliedToDate, pageSearch]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    toast.info("Filter Applied", {
      description: `Loaded customer orders for ${fromDate} to ${toDate}`,
    });
  };

  // Dedicated 2nd Page: Render full B2B order invoice detail view when an order is selected
  if (selectedOrder) {
    return (
      <B2bOrderDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <div className="space-y-3 font-sans antialiased text-[#0f172a] pb-12">
      {/* Top Bar: Back button matching Reference App */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Date Filter Strip matching Reference App Screenshot 2 */}
      <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            max={todayIso}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none cursor-pointer"
          />
          <span>To</span>
          <input
            type="date"
            value={toDate}
            max={todayIso}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none cursor-pointer"
          />
          <button
            type="submit"
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>
      </form>

      {/* Heading Title matching Reference App Screenshot 2 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Orders List
        </h1>
      </div>

      {/* Search in this page... matching Reference App Screenshot 2 */}
      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={pageSearch}
          onChange={(e) => setPageSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Orders List Table with Fixed 5-Row Viewport and Internal Scroll */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 shadow-2xs">
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
                <th className="py-2.5 px-3 text-left w-14">Sl</th>
                <th className="py-2.5 px-3 text-left">Order</th>
                <th className="py-2.5 px-3 text-left">Date</th>
                <th className="py-2.5 px-3 text-left">Customer</th>
                <th className="py-2.5 px-3 text-left">Village</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-center w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredOrders.length === 0 ? (
                <tr className="bg-[#0b1a30]">
                  <td colSpan={8} className="py-6 px-3 text-center text-slate-300 font-medium text-xs tracking-wide">
                    No customer orders in these dates.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                    <td className="py-3 px-3 text-slate-500 font-bold">{row.sl}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 font-mono">{row.orderNo}</div>
                      {row.invoiceNo && (
                        <div className="text-[10px] text-slate-400 font-mono">{row.invoiceNo}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-mono">{row.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{row.customerName}</td>
                    <td className="py-3 px-3 text-slate-700">{row.villageName || "—"}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          row.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.status === "invoiced"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                      ₹{row.total.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedOrder(row)}
                        className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 shadow-xs">
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3">Total</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 font-bold">{filteredOrders.length} order(s)</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    ₹{filteredOrders.reduce((a, b) => a + b.total, 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
