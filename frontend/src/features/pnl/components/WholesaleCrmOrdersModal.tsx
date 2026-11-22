import { X, Download } from 'lucide-react';
import { PnlOrder } from '../types';
import { calculateOrderTotals, getDeliveryDay } from '../data/pnlEngine';
import { toast } from 'sonner';

interface WholesaleCrmOrdersModalProps {
  title: string;
  orders: PnlOrder[];
  onClose: () => void;
}

export function WholesaleCrmOrdersModal({
  title,
  orders,
  onClose,
}: WholesaleCrmOrdersModalProps) {
  const formatMoney = (val: number) =>
    val.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  const formatDateDmy = (dateStr: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const exportModalCsv = () => {
    const headers = ['Order', 'Date', 'Customer', 'Sales', 'Cost', 'Profit', 'Margin'];
    const rows = orders.map((o) => {
      const c = calculateOrderTotals(o);
      const margin =
        c.salesExclGst > 0
          ? ((c.grossProfit / c.salesExclGst) * 100).toFixed(1) + '%'
          : '—';
      return [
        o.inv || o.no,
        getDeliveryDay(o),
        o.custName || 'Customer',
        c.salesExclGst,
        c.cogsExclGst,
        c.grossProfit,
        margin,
      ];
    });

    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-orders.csv`;
    a.click();
    toast.success('Orders exported to CSV');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0f2d59] text-white px-5 py-3.5 flex items-center justify-between">
          <h3 className="font-bold text-sm tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[65vh] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white font-semibold">
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3 text-right">Sales</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right">Profit</th>
                <th className="py-2.5 px-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No orders found for this CRM.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const c = calculateOrderTotals(o);
                  const margin =
                    c.salesExclGst > 0
                      ? ((c.grossProfit / c.salesExclGst) * 100).toFixed(1) + '%'
                      : '—';
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-[#1e40af]">
                        {o.inv || o.no}
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {formatDateDmy(getDeliveryDay(o))}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 max-w-[200px] truncate">
                        {o.custName || 'Customer'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {formatMoney(c.salesExclGst)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {formatMoney(c.cogsExclGst)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-medium ${
                          c.grossProfit < 0
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {formatMoney(c.grossProfit)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {margin}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Total {orders.length} order(s)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportModalCsv}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> ⬇ Export
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#0f2d59] hover:bg-slate-900 text-white text-xs font-bold rounded transition shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
