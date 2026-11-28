import React, { useState, useMemo } from "react";
import { ArrowLeft, Printer, Download, Search, X } from "lucide-react";
import { CrmStaffMember, CrmOrderRecord } from "../data/mockCrmReports";
import { getStoredSkus } from "@/features/inventory/data/mockInventory";
import { toast } from "sonner";

interface Props {
  staff: CrmStaffMember;
  orders: CrmOrderRecord[];
  onBack: () => void;
}

export const CrmStaffOrdersDetailView: React.FC<Props> = ({
  staff,
  orders,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openOrder, setOpenOrder] = useState<CrmOrderRecord | null>(null);

  const skuCostMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of getStoredSkus()) {
      if (s.name && s.cost > 0) {
        map.set(s.name.trim().toLowerCase(), s.cost);
      }
    }
    return map;
  }, []);

  const enrichedOrders = useMemo(() => {
    return orders.map((o) => {
      const sales = Number(o.total) || 0;
      const itemCostSum = (o.items || []).reduce((sum, it: any) => {
        const qty = Number(it.qty ?? it.quantity ?? 1) || 0;
        const unitSell = Number(it.price ?? it.rate ?? 0) || 0;
        const lookupCost = skuCostMap.get((it.name || "").trim().toLowerCase());
        const unitCost =
          Number(it.costPrice ?? it.cost ?? 0) ||
          lookupCost ||
          (unitSell > 0 ? Math.round(unitSell * 0.92 * 100) / 100 : 0);
        return sum + qty * unitCost;
      }, 0);
      const cost = itemCostSum > 0 ? Math.round(itemCostSum) : Math.round(sales * 0.92);
      const profit = sales - cost;
      const marginPct = sales > 0 ? (profit / sales) * 100 : 0;
      return { order: o, sales, cost, profit, marginPct };
    });
  }, [orders, skuCostMap]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return enrichedOrders;
    const q = searchQuery.toLowerCase();
    return enrichedOrders.filter(
      ({ order: o }) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.village.toLowerCase().includes(q)
    );
  }, [enrichedOrders, searchQuery]);

  const totalSales = filteredOrders.reduce((s, r) => s + r.sales, 0);
  const totalCost = filteredOrders.reduce((s, r) => s + r.cost, 0);
  const totalProfit = totalSales - totalCost;
  const avgMarginPct = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Order", "Date", "Customer", "Village", "Sales", "Cost", "Profit", "Margin %"];
    const rows = filteredOrders.map(({ order: o, sales, cost, profit, marginPct }) => [
      o.orderNo,
      o.orderDate,
      `"${o.customerName}"`,
      `"${o.village}"`,
      sales,
      cost,
      profit,
      `${marginPct.toFixed(1)}%`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_by_${staff.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders list exported to CSV");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto text-[#0f172a]">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-full transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Heading matching reference: Sales by Pushpa Patil */}
      <h1 className="text-xl font-bold text-[#0f2d59]">Sales by {staff.name}</h1>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-2xs"
        />
      </div>

      {/* Orders Table matching Order | Date | Customer | Village | Sales | Cost | Profit | Margin | Open */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e5ad7] text-white font-semibold">
                <th className="py-2.5 px-3.5">Order</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5 min-w-[200px]">Customer</th>
                <th className="py-2.5 px-3.5">Village</th>
                <th className="py-2.5 px-3.5 text-right">Sales</th>
                <th className="py-2.5 px-3.5 text-right">Cost</th>
                <th className="py-2.5 px-3.5 text-right">Profit</th>
                <th className="py-2.5 px-3.5 text-right">Margin</th>
                <th className="py-2.5 px-3.5 text-center w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No orders recorded for {staff.name} in this date range.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(({ order: o, sales, cost, profit, marginPct }) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {o.orderNo}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-mono whitespace-nowrap">
                      {o.orderDate}
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-900">
                      {o.customerName}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700">{o.village}</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900">
                      {sales.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-700">
                      {cost.toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`py-2.5 px-3.5 text-right font-mono font-semibold ${
                        profit < 0 ? "text-rose-600" : "text-slate-900"
                      }`}
                    >
                      {profit.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-700">
                      {marginPct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setOpenOrder(o)}
                        className="px-3 py-1 bg-[#0d1b4c] hover:bg-[#1a2d6d] text-white text-[11px] font-bold rounded-full cursor-pointer transition-colors"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <td colSpan={4} className="py-2.5 px-3.5 text-right text-slate-600">
                    Total ({filteredOrders.length} orders)
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono">
                    {totalSales.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono">
                    {totalCost.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono">
                    {totalProfit.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono">
                    {avgMarginPct.toFixed(1)}%
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Order Items Detail Modal when clicking Open */}
      {openOrder && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-[#0f2d59]">
                  {openOrder.orderNo} · {openOrder.customerName}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {openOrder.village} · {openOrder.orderDate} {openOrder.orderTime}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenOrder(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1e5ad7] text-white font-semibold">
                    <th className="py-2 px-3 w-12 text-center">Sl</th>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {openOrder.items.map((it: any, idx: number) => {
                    const qty = Number(it.qty ?? it.quantity ?? 1) || 0;
                    const rate = Number(it.price ?? it.rate ?? 0) || 0;
                    const amt = Number(it.amount ?? qty * rate) || 0;
                    return (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{it.name}</td>
                        <td className="py-2 px-3 text-center font-mono">{qty}</td>
                        <td className="py-2 px-3 text-right font-mono">{rate.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">{amt.toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center bg-slate-50 text-xs">
              <span className="font-bold text-slate-800">
                Order Total: ₹{Number(openOrder.total || 0).toLocaleString("en-IN")}
              </span>
              <button
                type="button"
                onClick={() => setOpenOrder(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-full font-semibold text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
