import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { computeOrderWiseProfit, computePnlCore } from '../data/pnlEngine';
import { OrderProfitRow, PnlOrder } from '../types';
import { WholesaleOrderProfitDetailView } from './WholesaleOrderProfitDetailView';
import { toast } from 'sonner';

interface WholesaleOrderWiseProfitViewProps {
  fromDate: string;
  toDate: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onSubmit: () => void;
}

export function WholesaleOrderWiseProfitView({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onSubmit,
}: WholesaleOrderWiseProfitViewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<{
    order: PnlOrder;
    vehicleExp: number;
  } | null>(null);

  // Compute Core for KPIs
  const core = useMemo(
    () => computePnlCore(fromDate, toDate),
    [fromDate, toDate]
  );

  // Compute Order rows
  const orderData = useMemo(
    () => computeOrderWiseProfit(fromDate, toDate),
    [fromDate, toDate]
  );

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

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return orderData.rows;
    const q = searchQuery.toLowerCase();
    return orderData.rows.filter(
      (r) =>
        r.orderNo.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.vehicleNo.toLowerCase().includes(q)
    );
  }, [orderData.rows, searchQuery]);

  const exportOrderCsv = () => {
    const headers = [
      'Order',
      'Delivery date',
      'Customer',
      'Vehicle',
      'Sales',
      'Cost',
      'Gross profit',
      'Vehicle exp',
      'Profit after vehicle',
      'Margin',
    ];
    const rows = filteredRows.map((r) => [
      r.orderNo,
      r.deliveryDate,
      r.customerName,
      r.vehicleNo,
      r.sales,
      r.cost,
      r.grossProfit,
      r.vehicleExp,
      r.profitAfterVehicle,
      r.margin,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-wise-profit-${fromDate}-to-${toDate}.csv`;
    a.click();
    toast.success('Order wise profit exported to CSV');
  };

  // Dedicated 2nd Page: When an order is clicked for View
  if (selectedOrder) {
    return (
      <WholesaleOrderProfitDetailView
        order={selectedOrder.order}
        vehicleExp={selectedOrder.vehicleExp}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

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
          onClick={exportOrderCsv}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" /> ⬇ Export
        </button>
      </div>

      {/* Page Title & Subtitle */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Order wise profit
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Delivered orders on their delivery day. Vehicle expense of each trip is
          shared by its delivered orders (by sales value).
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

      {/* 5 KPI Cards matching Screenshot 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Sales (excl. GST)</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatMoney(core.sales)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Gross profit</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatMoney(core.grossProfit)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Vehicle expenses</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatMoney(core.vehicleExp)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Other expenses</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatMoney(core.otherExpenses)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Net profit</div>
          <div
            className={`text-xl font-bold mt-1 ${
              core.netProfit < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatMoney(core.netProfit)}
          </div>
        </div>
      </div>

      {/* Table: 11 Columns */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white font-semibold">
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Delivery date</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3 text-right">Sales</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right">Gross profit</th>
                <th className="py-2.5 px-3 text-right">Vehicle exp</th>
                <th className="py-2.5 px-3 text-right">Profit after vehicle</th>
                <th className="py-2.5 px-3 text-right">Margin</th>
                <th className="py-2.5 px-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No delivered orders in these dates.
                  </td>
                </tr>
              ) : (
                <>
                  {filteredRows.map((r: OrderProfitRow) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-[#1e40af]">
                        {r.orderNo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {formatDateDmy(r.deliveryDate)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[200px] truncate">
                        {r.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {r.vehicleNo}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatMoney(r.sales)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatMoney(r.cost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {formatMoney(r.grossProfit)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatMoney(r.vehicleExp)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          r.profitAfterVehicle < 0
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {formatMoney(r.profitAfterVehicle)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {r.margin}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() =>
                            setSelectedOrder({
                              order: r.rawOrder,
                              vehicleExp: r.vehicleExp,
                            })
                          }
                          className="bg-slate-100 hover:bg-[#1e40af] hover:text-white text-slate-700 px-2.5 py-1 rounded text-2xs font-bold transition shadow-2xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Summary / Total Row matching reference VW.plo */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td className="py-3 px-3">Total</td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3">
                      {filteredRows.length} order(s)
                    </td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3 text-right">
                      {formatMoney(orderData.totalSales)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatMoney(orderData.totalCost)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatMoney(orderData.totalGrossProfit)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatMoney(orderData.totalVehicleExp)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatMoney(orderData.totalProfitAfterVehicle)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {orderData.overallMargin}
                    </td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
