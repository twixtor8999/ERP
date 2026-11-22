import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { computeCrmWiseProfit } from '../data/pnlEngine';
import { CrmProfitRow, PnlOrder } from '../types';
import { WholesaleCrmOrdersModal } from './WholesaleCrmOrdersModal';
import { toast } from 'sonner';

interface WholesaleCrmWiseProfitViewProps {
  fromDate: string;
  toDate: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onSubmit: () => void;
}

export function WholesaleCrmWiseProfitView({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onSubmit,
}: WholesaleCrmWiseProfitViewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrmOrders, setSelectedCrmOrders] = useState<{
    title: string;
    orders: PnlOrder[];
  } | null>(null);

  const crmData = useMemo(
    () => computeCrmWiseProfit(fromDate, toDate),
    [fromDate, toDate]
  );

  const formatMoney = (val: number) =>
    val.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return crmData.rows;
    const q = searchQuery.toLowerCase();
    return crmData.rows.filter(
      (r) =>
        r.crm.toLowerCase().includes(q) ||
        r.routes.toLowerCase().includes(q)
    );
  }, [crmData.rows, searchQuery]);

  const exportCrmCsv = () => {
    const headers = [
      'CRM',
      'Routes',
      'Customers',
      'Orders',
      'Sales',
      'Cost',
      'Profit',
      'Margin',
    ];
    const rows = filteredRows.map((r) => [
      r.crm,
      r.routes,
      r.customersCount,
      r.ordersCount,
      r.sales,
      r.cost,
      r.profit,
      r.margin,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-wise-profit-${fromDate}-to-${toDate}.csv`;
    a.click();
    toast.success('CRM wise profit exported to CSV');
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromChange(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-600 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToChange(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={onSubmit}
              className="bg-[#0f2d59] hover:bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold transition shadow-2xs"
            >
              Submit
            </button>
          </div>
        </div>

        <button
          onClick={exportCrmCsv}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" /> ⬇ Export
        </button>
      </div>

      {/* Page Title & Subtitle */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          CRM wise profit
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Profit of billed orders, by the CRM assigned to each route (in range)
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 4 KPI Cards matching Screenshot 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">CRMs</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {crmData.totalCrmsCount}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Sales (excl. GST)</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatMoney(crmData.totalSales)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Gross profit</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatMoney(crmData.totalProfit)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Margin</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {crmData.overallMargin}
          </div>
        </div>
      </div>

      {/* Table: 9 Columns */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white font-semibold">
                <th className="py-2.5 px-3">CRM</th>
                <th className="py-2.5 px-3">Routes</th>
                <th className="py-2.5 px-3 text-right">Customers</th>
                <th className="py-2.5 px-3 text-right">Orders</th>
                <th className="py-2.5 px-3 text-right">Sales</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right">Profit</th>
                <th className="py-2.5 px-3 text-right">Margin</th>
                <th className="py-2.5 px-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No orders billed in these dates.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r: CrmProfitRow, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {r.crm}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[220px] truncate">
                      {r.routes || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {r.customersCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {r.ordersCount}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {formatMoney(r.sales)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {formatMoney(r.cost)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        r.profit < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatMoney(r.profit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {r.margin}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() =>
                          setSelectedCrmOrders({
                            title: `CRM: ${r.crm}`,
                            orders: r.orders,
                          })
                        }
                        className="bg-slate-100 hover:bg-[#1e40af] hover:text-white text-slate-700 px-2.5 py-1 rounded text-2xs font-bold transition shadow-2xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders modal on View Click */}
      {selectedCrmOrders && (
        <WholesaleCrmOrdersModal
          title={selectedCrmOrders.title}
          orders={selectedCrmOrders.orders}
          onClose={() => setSelectedCrmOrders(null)}
        />
      )}
    </div>
  );
}
