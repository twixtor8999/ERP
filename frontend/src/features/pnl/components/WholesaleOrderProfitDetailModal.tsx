import { X } from 'lucide-react';
import { PnlOrder } from '../types';
import { calculateOrderTotals } from '../data/pnlEngine';

interface WholesaleOrderProfitDetailModalProps {
  order: PnlOrder | null;
  vehicleExp: number;
  onClose: () => void;
}

export function WholesaleOrderProfitDetailModal({
  order,
  vehicleExp,
  onClose,
}: WholesaleOrderProfitDetailModalProps) {
  if (!order) return null;

  const totals = calculateOrderTotals(order);
  const profitAfterVeh = Math.round((totals.grossProfit - vehicleExp) * 100) / 100;
  const margin =
    totals.salesExclGst > 0
      ? ((profitAfterVeh / totals.salesExclGst) * 100).toFixed(1) + '%'
      : '—';

  const formatMoney = (val: number) =>
    val.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0f2d59] text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide">
              Order {order.inv || order.no} — Profit Details
            </h3>
            <p className="text-xs text-slate-300">
              Customer: {order.custName} · Delivery: {order.dsp || order.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <div className="text-slate-500 text-2xs">Sales (excl. GST)</div>
              <div className="font-bold text-slate-900 text-sm">
                ₹{formatMoney(totals.salesExclGst)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-2xs">COGS (excl. GST)</div>
              <div className="font-bold text-slate-900 text-sm">
                ₹{formatMoney(totals.cogsExclGst)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-2xs">Vehicle Allocated</div>
              <div className="font-bold text-slate-900 text-sm">
                ₹{formatMoney(vehicleExp)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-2xs">Net Profit / Margin</div>
              <div
                className={`font-bold text-sm ${
                  profitAfterVeh < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                ₹{formatMoney(profitAfterVeh)} ({margin})
              </div>
            </div>
          </div>

          {/* Items breakdown */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Order Items</h4>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e40af] text-white font-semibold">
                    <th className="p-2">Item ID</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Selling Price</th>
                    <th className="p-2 text-right">Unit Cost</th>
                    <th className="p-2 text-right">Total Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-2 font-medium">SKU #{it.s}</td>
                      <td className="p-2 text-right">{it.q}</td>
                      <td className="p-2 text-right">₹{formatMoney(it.p)}</td>
                      <td className="p-2 text-right">₹{formatMoney(it.c || 0)}</td>
                      <td className="p-2 text-right font-medium">
                        ₹{formatMoney(it.q * it.p)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Route & Delivery metadata */}
          <div className="text-2xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
            <div>
              <span className="font-semibold text-slate-700">Vehicle:</span>{' '}
              {order.vehNo || '—'}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Route / Area:</span>{' '}
              {order.route || 'Vijayapura Main'}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Placed / Billed By:</span>{' '}
              {order.by || 'Pushpa Patil'}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0f2d59] text-white text-xs font-bold rounded hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
