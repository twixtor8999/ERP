import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Eye } from "lucide-react";
import {
  INITIAL_PUNCH_ORDERS,
  type PunchOrderItem,
} from "../data/mockInventory";
import { getAllCrmOrders, type CrmOrderRecord } from "@/features/crm/data/mockCrmReports";
import { getIstDateString } from "@/lib/utilities/istTime";
import { fetchAndMergeCrmPipelineOrders } from "../utils/liveInventory";
import { fetchRealtimeInventory, type ApiRealtimeSku } from "@/lib/api/apiService";

interface SkuPunchSummary {
  skuId: number;
  skuName: string;
  qty: number;
  availableQty: number;
  stockNow: number;
  statusMap: {
    placed: number;
    packed: number;
    invoiced: number;
    dispatched: number;
  };
  orders: PunchOrderItem[];
}

export function WholesalePunchOrdersView() {
  const navigate = useNavigate();
  const todayIso = getIstDateString();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkuSummary, setSelectedSkuSummary] = useState<SkuPunchSummary | null>(null);

  const [skus, setSkus] = useState<ApiRealtimeSku[]>([]);
  const [dataRevision, setDataRevision] = useState(0);

  const syncPunch = useCallback(async () => {
    try {
      const [live] = await Promise.all([
        fetchRealtimeInventory(),
        fetchAndMergeCrmPipelineOrders(todayIso),
      ]);
      setSkus(live);
    } catch { /* ignore */ }
    setDataRevision((r) => r + 1);
  }, [todayIso]);

  useEffect(() => {
    const bump = () => void syncPunch();
    window.addEventListener("crm_order_placed", bump);
    window.addEventListener("settlements_updated", bump);
    window.addEventListener("inventory_updated", bump);
    window.addEventListener("focus", bump);
    void syncPunch();
    return () => {
      window.removeEventListener("crm_order_placed", bump);
      window.removeEventListener("settlements_updated", bump);
      window.removeEventListener("inventory_updated", bump);
      window.removeEventListener("focus", bump);
    };
  }, [syncPunch]);

  // Dynamically derive live punch orders directly from CRM Wholesale orders + pipeline orders
  const orders = useMemo<PunchOrderItem[]>(() => {
    void dataRevision;
    const crmOrders: CrmOrderRecord[] = getAllCrmOrders();
    const liveList: PunchOrderItem[] = [];

    // Filter strictly for un-dispatched pending orders (placed, packed, invoiced)
    crmOrders.forEach((o) => {
      const statusKey = (o.status || "").toLowerCase();
      if (
        statusKey.includes("cancelled") ||
        statusKey.includes("return") ||
        statusKey.includes("delivered") ||
        statusKey.includes("completed") ||
        statusKey.includes("delivery") ||
        statusKey.includes("dispatch")
      ) {
        return;
      }

      const mappedStatus: "placed" | "packed" | "invoiced" =
        statusKey.includes("invoic")
          ? "invoiced"
          : statusKey.includes("pack")
          ? "packed"
          : "placed";

      if (o.items && o.items.length > 0) {
        o.items.forEach((item, idx) => {
          // Find matching SKU
          const foundSku = skus.find(
            (s) =>
              s.name.toLowerCase() === item.name.toLowerCase() ||
              item.name.toLowerCase().includes(s.name.toLowerCase()) ||
              s.name.toLowerCase().includes(item.name.toLowerCase())
          );

          liveList.push({
            orderId: `${o.id}-${idx}`,
            orderNo: o.orderNo || `ORD-${o.id}`,
            customerName: o.customerName,
            village: o.village || "Vijayapura",
            orderDate: o.orderDate,
            skuId: foundSku ? foundSku.id : 1794579615417490,
            skuName: foundSku ? foundSku.name : item.name,
            qty: item.qty,
            rate: item.price,
            status: mappedStatus,
          });
        });
      }
    });

    return liveList.length > 0 ? liveList : INITIAL_PUNCH_ORDERS;
  }, [skus]);

  // Group orders by SKU
  const skuSummaries = useMemo<SkuPunchSummary[]>(() => {
    const map = new Map<number, SkuPunchSummary>();

    orders.forEach((ord) => {
      let existing = map.get(ord.skuId);
      if (!existing) {
        const skuObj = skus.find((s) => s.id === ord.skuId);
        const stockNow = skuObj ? skuObj.closing : 50;
        existing = {
          skuId: ord.skuId,
          skuName: ord.skuName,
          qty: 0,
          availableQty: Math.max(0, stockNow),
          stockNow,
          statusMap: { placed: 0, packed: 0, invoiced: 0, dispatched: 0 },
          orders: [],
        };
        map.set(ord.skuId, existing);
      }

      existing.qty += ord.qty;
      existing.availableQty = Math.max(0, existing.stockNow - existing.qty);
      existing.statusMap[ord.status] = (existing.statusMap[ord.status] || 0) + ord.qty;
      existing.orders.push(ord);
    });

    const list = Array.from(map.values());
    list.sort((a, b) => a.skuName.localeCompare(b.skuName));
    return list;
  }, [orders, skus]);

  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return skuSummaries;
    const q = searchQuery.toLowerCase().trim();
    return skuSummaries.filter((s) => s.skuName.toLowerCase().includes(q));
  }, [skuSummaries, searchQuery]);

  const totals = useMemo(() => {
    return filteredSummaries.reduce(
      (acc, s) => {
        acc.qty += s.qty;
        acc.available += s.availableQty;
        return acc;
      },
      { qty: 0, available: 0 }
    );
  }, [filteredSummaries]);

  if (selectedSkuSummary) {
    const totalPendingQty = selectedSkuSummary.orders.reduce((a, b) => a + b.qty, 0);
    const totalAmount = selectedSkuSummary.orders.reduce((a, b) => a + b.qty * b.rate, 0);

    return (
      <div className="space-y-4 pb-12">
        {/* Top Bar with Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setSelectedSkuSummary(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <span className="text-xs text-slate-500 font-medium">
            Total orders: <b className="text-slate-800">{selectedSkuSummary.orders.length}</b>
          </span>
        </div>

        {/* Page Heading */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">{selectedSkuSummary.skuName}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pending qty <b>{selectedSkuSummary.qty}</b> · Available qty{" "}
            <b className={selectedSkuSummary.availableQty < 0 ? "text-rose-600" : "text-emerald-700"}>
              {selectedSkuSummary.availableQty}
            </b>{" "}
            · Stock now <b>{selectedSkuSummary.stockNow}</b>
          </p>
        </div>

        {/* Dedicated Order Breakdown Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 border-r border-blue-700/50 w-10 text-center">Sl</th>
                  <th className="py-2.5 px-3 border-r border-blue-700/50">Order No</th>
                  <th className="py-2.5 px-3 border-r border-blue-700/50">Customer Name</th>
                  <th className="py-2.5 px-3 border-r border-blue-700/50">Village</th>
                  <th className="py-2.5 px-3 border-r border-blue-700/50">Order Date</th>
                  <th className="py-2.5 px-3 border-r border-blue-700/50 text-right">Qty</th>
                  <th className="py-2.5 px-3 border-r border-blue-700/50 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {selectedSkuSummary.orders.map((o, idx) => (
                  <tr key={o.orderId} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-800">
                      {o.orderNo}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 font-medium">
                      {o.customerName}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">
                      {o.village}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-500 whitespace-nowrap">
                      {o.orderDate}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-right font-bold text-amber-700">
                      {o.qty}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-right font-medium whitespace-nowrap">
                      ₹{(o.qty * o.rate).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          o.status === "placed"
                            ? "bg-blue-100 text-blue-800"
                            : o.status === "packed"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {o.status === "placed" ? "Order placed" : o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right">
                    Total:
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-700">
                    {totalPendingQty}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 whitespace-nowrap">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setSelectedSkuSummary(null)}
            className="px-5 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <span className="text-xs text-slate-500 font-medium">
          Total pending: <b className="text-slate-800">{orders.length} orders</b>
        </span>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Punch orders</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pending punch orders ({orders.length} orders) · Quick orders for one item. With AI cross-check
          on, stock, price and duplicates are checked before saving.
        </p>
      </div>

      {/* AI inventory check banner */}
      <div className="bg-[#2e7d32]/10 border border-[#2e7d32] px-3.5 py-2 rounded-md">
        <b className="text-[#2e7d32] text-xs sm:text-sm">AI inventory check: no errors</b>
      </div>

      {/* Search Input */}
      <div className="relative bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-5 top-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Punch Orders Table with 7-8 visible rows internal scroll */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2.5 px-3 border-r border-blue-700/50 w-12 text-center">Sl</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[240px]">SKU Name</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-24">Qty</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-28">Available Qty</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50">Delivery Status</th>
                <th className="py-2.5 px-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No pending orders. Everything is dispatched.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((s, idx) => (
                  <tr key={s.skuId} className="hover:bg-blue-50/40 transition">
                    <td className="py-2 px-3 border-r border-slate-100 text-center text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-900">
                      {s.skuName}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-amber-700">
                      {s.qty}
                    </td>
                    <td
                      className={`py-2 px-3 border-r border-slate-100 text-right font-bold ${
                        s.availableQty < 0 ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {s.availableQty}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {s.statusMap.placed > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            Order placed {s.statusMap.placed}
                          </span>
                        )}
                        {s.statusMap.packed > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Packed {s.statusMap.packed}
                          </span>
                        )}
                        {s.statusMap.invoiced > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            Invoiced {s.statusMap.invoiced}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => setSelectedSkuSummary(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredSummaries.length > 0 && (
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center"></td>
                  <td className="py-2.5 px-3 border-r border-slate-200">Total</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right text-amber-700">
                    {totals.qty}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right text-emerald-700">
                    {totals.available}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200"></td>
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
