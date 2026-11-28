import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { fetchCrmOrders, type ApiCrmOrder } from "@/lib/api/apiService";
import { downloadExcelXlsx } from "@/lib/utilities/excelExport";
import type { VehicleTripRecord } from "../data/mockVehicles";

interface Props {
  trip: VehicleTripRecord;
  onBack: () => void;
  onEditTrip: () => void;
}

export function WholesaleVehicleTripDetailsView({ trip, onBack, onEditTrip }: Props) {
  const [orders, setOrders] = useState<ApiCrmOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCrmOrders(500)
      .then((rows) => {
        if (!active) return;
        const tripVeh = (trip.vehNo || "").trim().toUpperCase();
        const tripDate = (trip.date || "").slice(0, 10);
        const matched = rows.filter((o) => {
          const ov = (o.vehicle_no || "").trim().toUpperCase();
          if (!ov || ov !== tripVeh) return false;
          const od = (o.order_date || "").slice(0, 10);
          return !tripDate || !od || od === tripDate;
        });
        setOrders(matched);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trip.vehNo, trip.date]);

  const orderRows = useMemo(() => {
    return orders.map((o) => {
      const invAmt = Number(o.total_amount) || 0;
      const retAmt = Number(o.return_amount) || 0;
      const netAmt = Math.max(0, invAmt - retAmt);
      const cash = Number((o as any).cash_paid ?? 0) || (o.status === "delivered" || o.status === "completed" ? netAmt : 0);
      const qr = Number((o as any).qr_paid ?? 0) || 0;
      const bank = 0;
      const balance = Math.max(0, netAmt - cash - qr - bank);
      return {
        orderNo: o.order_number,
        invoiceNo: o.invoice_number || "—",
        customer: o.customer_name || "Customer",
        village: o.village || "—",
        invAmt,
        retAmt,
        netAmt,
        cash,
        bank,
        qr,
        balance,
        status: o.status || "dispatched",
        items: o.items || [],
      };
    });
  }, [orders]);

  const itemsSummary = useMemo(() => {
    const map = new Map<string, { name: string; qtySent: number; returned: number; delivered: number; amount: number }>();
    for (const o of orderRows) {
      for (const it of o.items) {
        const key = (it.product_name || "").trim();
        if (!key) continue;
        const qty = Number(it.quantity) || 0;
        const amt = Number(it.total_amount) || 0;
        const cur = map.get(key) || { name: key, qtySent: 0, returned: 0, delivered: 0, amount: 0 };
        cur.qtySent += qty;
        cur.delivered += qty;
        cur.amount += amt;
        map.set(key, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orderRows]);

  const totalInv = orderRows.reduce((s, r) => s + r.invAmt, 0) || trip.invoiceAmt;
  const totalRet = orderRows.reduce((s, r) => s + r.retAmt, 0) || trip.returns;
  const totalNet = orderRows.reduce((s, r) => s + r.netAmt, 0) || trip.netSales;
  const totalCash = orderRows.reduce((s, r) => s + r.cash, 0);
  const totalQr = orderRows.reduce((s, r) => s + r.qr, 0);
  const totalCollected = totalCash + totalQr;
  const totalBalance = orderRows.reduce((s, r) => s + r.balance, 0);
  const tripCost = trip.totalRent || trip.fixedRent + trip.otherCost;
  const costPerKm = trip.totalKm > 0 ? Math.round(tripCost / trip.totalKm) : 0;
  const estProfit = Math.round(totalNet * 0.1 - tripCost);

  const handleExportExcel = () => {
    downloadExcelXlsx(
      `Trip_Details_${trip.vehNo}_${trip.date}.xlsx`,
      `Trip ${trip.vehNo}`,
      ["Sl", "Order", "Invoice", "Customer", "Village", "Invoice Amt", "Return", "Net Amt", "Cash", "Bank", "QR", "Balance", "Status"],
      orderRows.map((r, idx) => [
        idx + 1,
        r.orderNo,
        r.invoiceNo,
        r.customer,
        r.village,
        r.invAmt,
        r.retAmt,
        r.netAmt,
        r.cash,
        r.bank,
        r.qr,
        r.balance,
        r.status,
      ])
    );
    toast.success("Trip details exported to Excel");
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12 text-slate-800">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-lg font-bold text-[#0f2d59]">Trip details – {trip.vehNo}</h1>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            trip.status === "closed"
              ? "bg-emerald-600 text-white"
              : "bg-rose-700 text-white"
          }`}
        >
          {trip.status === "closed" ? "Closed" : "Trip in Progress"}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Date {trip.date} · Driver {(trip as any).driver || "—"}
      </p>

      {/* Row 1 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Start Km", val: trip.startKm > 0 ? trip.startKm.toLocaleString("en-IN") : "—" },
          { label: "End Km", val: trip.endKm > 0 ? trip.endKm.toLocaleString("en-IN") : "—" },
          { label: "Total Km", val: trip.totalKm > 0 ? trip.totalKm.toLocaleString("en-IN") : "—" },
          { label: "Rent", val: trip.fixedRent.toLocaleString("en-IN") },
          { label: "Other cost", val: trip.otherCost.toLocaleString("en-IN") },
          { label: "Trip cost", val: tripCost.toLocaleString("en-IN") },
          { label: "Cost per km", val: costPerKm > 0 ? costPerKm.toLocaleString("en-IN") : "—" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">{k.label}</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{k.val}</div>
          </div>
        ))}
      </div>

      {/* Row 2 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Orders", val: String(orderRows.length || trip.ordersCount) },
          { label: "Invoice amt", val: totalInv.toLocaleString("en-IN") },
          { label: "Returns", val: totalRet.toLocaleString("en-IN") },
          { label: "Net sales", val: totalNet.toLocaleString("en-IN") },
          { label: "Collected", val: totalCollected.toLocaleString("en-IN") },
          { label: "Balance", val: totalBalance.toLocaleString("en-IN"), cls: "text-emerald-700" },
          { label: "Trip profit", val: estProfit.toLocaleString("en-IN"), cls: estProfit >= 0 ? "text-emerald-700" : "text-rose-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-medium">{k.label}</div>
            <div className={`text-base font-bold font-mono mt-0.5 ${k.cls || "text-slate-900"}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Orders on this trip */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-[#0f2d59]">Orders on this trip</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1e5ad7] text-white font-semibold">
                  <th className="py-2.5 px-3 text-center w-12">Sl</th>
                  <th className="py-2.5 px-3">Order</th>
                  <th className="py-2.5 px-3">Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3 text-right">Invoice Amt</th>
                  <th className="py-2.5 px-3 text-right">Return</th>
                  <th className="py-2.5 px-3 text-right">Net Amt</th>
                  <th className="py-2.5 px-3 text-right">Cash</th>
                  <th className="py-2.5 px-3 text-right">Bank</th>
                  <th className="py-2.5 px-3 text-right">QR</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400">Loading trip orders...</td>
                  </tr>
                ) : orderRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400">No orders matched to this vehicle/date.</td>
                  </tr>
                ) : (
                  orderRows.map((r, idx) => (
                    <tr key={r.orderNo} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{r.orderNo}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{r.invoiceNo}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{r.customer}</td>
                      <td className="py-2 px-3 text-slate-700">{r.village}</td>
                      <td className="py-2 px-3 text-right font-mono">{r.invAmt.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right font-mono">{r.retAmt.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">{r.netAmt.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right font-mono">{r.cash.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right font-mono">{r.bank.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right font-mono">{r.qr.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-right font-mono">{r.balance.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {orderRows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td colSpan={5} className="py-2 px-3 text-center">Total</td>
                    <td className="py-2 px-3 text-right font-mono">{totalInv.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right font-mono">{totalRet.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right font-mono">{totalNet.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right font-mono">{totalCash.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right font-mono">0</td>
                    <td className="py-2 px-3 text-right font-mono">{totalQr.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right font-mono">{totalBalance.toLocaleString("en-IN")}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Items on this trip */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-[#0f2d59]">Items on this trip</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1e5ad7] text-white font-semibold">
                  <th className="py-2.5 px-3 text-center w-12">Sl</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 text-right">Qty sent</th>
                  <th className="py-2.5 px-3 text-right">Returned</th>
                  <th className="py-2.5 px-3 text-right">Delivered</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">No items recorded.</td>
                  </tr>
                ) : (
                  itemsSummary.map((it, idx) => (
                    <tr key={it.name} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{it.name}</td>
                      <td className="py-2 px-3 text-right font-mono">{it.qtySent}</td>
                      <td className="py-2 px-3 text-right font-mono">{it.returned}</td>
                      <td className="py-2 px-3 text-right font-mono">{it.delivered}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {it.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-full cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-full cursor-pointer"
        >
          Excel
        </button>
        <button
          type="button"
          onClick={onEditTrip}
          className="px-4 py-1.5 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-full cursor-pointer"
        >
          Edit trip
        </button>
      </div>
    </div>
  );
}
