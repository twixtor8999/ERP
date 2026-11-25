import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { computePnlCore, computePnlSkuBatches } from '../data/pnlEngine';
import { toast } from 'sonner';

interface WholesalePnlSummaryViewProps {
  fromDate: string;
  toDate: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onSubmit: () => void;
}

export function WholesalePnlSummaryView({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onSubmit,
}: WholesalePnlSummaryViewProps) {
  const navigate = useNavigate();
  const [subView, setSubView] = useState<'sum' | 'sku'>('sum');
  const [searchQuery, setSearchQuery] = useState('');

  // Core P&L summary
  const core = useMemo(
    () => computePnlCore(fromDate, toDate),
    [fromDate, toDate]
  );

  // SKU Batches
  const skuBatches = useMemo(
    () => computePnlSkuBatches(fromDate, toDate),
    [fromDate, toDate]
  );

  const formatMoney = (val: number) =>
    val.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  const exportSummaryCsv = () => {
    if (subView === 'sum') {
      const rows = [
        ['Line', 'Amount'],
        ['Sales (delivered orders, net of returns)', core.sales],
        ['Cost of goods sold (FIFO)', core.cogs],
        ['Gross profit', core.grossProfit],
        ...Object.entries(core.categoryExpenses).map(([k, v]) => [`Expense: ${k}`, v]),
        [`Vehicle expenses (${core.vehicleTripsCount} trip(s) with delivered orders)`, core.vehicleExp],
        ['Net profit', core.netProfit],
      ];
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pnl-summary-${fromDate}-to-${toDate}.csv`;
      a.click();
      toast.success('P&L summary exported to CSV');
    } else {
      const headers = [
        'Sl',
        'SKU Name',
        'Batch',
        'GRN Price',
        'Selling Price',
        'Qty',
        'Orders',
        'Sales (excl. GST)',
        'Cost (excl. GST)',
        'Profit',
        'Margin',
      ];
      const rows = skuBatches.rows.map((r) => [
        r.sl,
        r.skuName,
        r.batch,
        r.grnPrice,
        r.sellingPrice,
        r.qty,
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
      a.download = `pnl-sku-batches-${fromDate}-to-${toDate}.csv`;
      a.click();
      toast.success('SKU wise P&L exported to CSV');
    }
  };

  const filteredSkuRows = useMemo(() => {
    if (!searchQuery.trim()) return skuBatches.rows;
    const q = searchQuery.toLowerCase();
    return skuBatches.rows.filter((r) =>
      String(r.skuName).toLowerCase().includes(q)
    );
  }, [skuBatches.rows, searchQuery]);

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
          onClick={exportSummaryCsv}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" /> ⬇ Export
        </button>
      </div>

      {/* Page Title & Subtitle */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Profit & Loss report
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {subView === 'sum'
            ? 'Sales and vehicle expenses are counted on the delivery day, only for delivered orders. Sales exclude GST.'
            : 'SKU wise · FIFO: old stock is sold at its old GRN / selling price, then the new batch. Sales and cost exclude GST, net of returns.'}
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

      {/* View Switch Pills (Summary / SKU Wise) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSubView('sum')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            subView === 'sum'
              ? 'bg-[#0f2d59] text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setSubView('sku')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            subView === 'sku'
              ? 'bg-[#0f2d59] text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          SKU wise (GRN / Selling price batches)
        </button>
      </div>

      {/* VIEW 1: SUMMARY */}
      {subView === 'sum' && (
        <div className="space-y-4">
          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Sales</div>
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
              <div className="text-xs text-slate-500 font-medium">Expenses + vehicle</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatMoney(core.otherExpenses + core.vehicleExp)}
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

          {/* Table: Line | Amount */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-[#1e40af] text-white font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 bg-[#1e40af]">Line</th>
                    <th className="py-2.5 px-4 text-right bg-[#1e40af]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4">
                      Sales (delivered orders, net of returns)
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium">
                      {formatMoney(core.sales)}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4">Cost of goods sold (FIFO)</td>
                    <td className="py-2.5 px-4 text-right font-medium">
                      {formatMoney(core.cogs)}
                    </td>
                  </tr>

                  <tr className="bg-slate-50/90 font-bold text-slate-900">
                    <td className="py-2.5 px-4">Gross profit</td>
                    <td className="py-2.5 px-4 text-right">
                      {formatMoney(core.grossProfit)}
                    </td>
                  </tr>

                  {/* Expenses by Category */}
                  {Object.entries(core.categoryExpenses)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cat, amt]) => (
                      <tr key={cat} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 text-slate-600">
                          Expense: {cat}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium">
                          {formatMoney(amt)}
                        </td>
                      </tr>
                    ))}

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-600">
                      Vehicle expenses ({core.vehicleTripsCount} trip(s) with delivered orders)
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium">
                      {formatMoney(core.vehicleExp)}
                    </td>
                  </tr>

                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td className="py-3 px-4 text-slate-900">Net profit</td>
                    <td
                      className={`py-3 px-4 text-right text-sm ${
                        core.netProfit < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatMoney(core.netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom delivered orders message matching reference app */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              {core.orders.length} delivered order(s).
              {core.pendingOrdersCount > 0 && (
                <span>
                  {' '}
                  Not delivered yet: {core.pendingOrdersCount} order(s), ₹
                  {formatMoney(core.pendingSales)} – counted on their delivery day.
                </span>
              )}
              {core.waitingVehicleExp > 0 && (
                <span>
                  {' '}
                  Vehicle expenses waiting for delivery: ₹
                  {formatMoney(core.waitingVehicleExp)}.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SKU WISE BATCHES */}
      {subView === 'sku' && (
        <div className="space-y-4">
          {/* 4 KPI Cards for SKU Batches */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">SKUs sold</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {skuBatches.skusSold}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">
                SKUs with 2+ price batches
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {skuBatches.multiBatchSkus}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Sales</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatMoney(skuBatches.totalSales)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Gross profit</div>
              <div
                className={`text-xl font-bold mt-1 ${
                  skuBatches.totalProfit < 0
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {formatMoney(skuBatches.totalProfit)}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-[#1e40af] text-white font-semibold">
                  <tr>
                    <th className="py-2 px-3 bg-[#1e40af]">Sl</th>
                    <th className="py-2 px-3 bg-[#1e40af]">SKU Name</th>
                    <th className="py-2 px-3 bg-[#1e40af]">Batch</th>
                    <th className="py-2 px-3 text-right bg-[#1e40af]">GRN Price</th>
                    <th className="py-2 px-3 text-right bg-[#1e40af]">Selling Price</th>
                    <th className="py-2 px-3 text-right bg-[#1e40af]">Qty</th>
                    <th className="py-2 px-3 text-right bg-[#1e40af]">Orders</th>
                    <th className="py-2 px-3 text-right bg-[#1e40af]">Sales (excl. GST)</th>
                    <th className="py-2 px-3 text-right bg-[#1e40af]">Cost (excl. GST)</th>
                    <th className="py-2 px-3 text-right bg-[#1e40af]">Profit</th>
                    <th className="py-2 px-3 text-right bg-[#1e40af]">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSkuRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-slate-400">
                        No SKU batches sold in these dates.
                      </td>
                    </tr>
                  ) : (
                    filteredSkuRows.map((r, i) => {
                      if (r.isGrandTotal) {
                        return (
                          <tr
                            key={i}
                            className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900"
                          >
                            <td className="py-2.5 px-3"></td>
                            <td className="py-2.5 px-3">{r.skuName}</td>
                            <td className="py-2.5 px-3"></td>
                            <td className="py-2.5 px-3 text-right"></td>
                            <td className="py-2.5 px-3 text-right"></td>
                            <td className="py-2.5 px-3 text-right">{r.qty}</td>
                            <td className="py-2.5 px-3 text-right"></td>
                            <td className="py-2.5 px-3 text-right">
                              {formatMoney(r.sales)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {formatMoney(r.cost)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {formatMoney(r.profit)}
                            </td>
                            <td className="py-2.5 px-3 text-right">{r.margin}</td>
                          </tr>
                        );
                      }

                      if (r.isTotal) {
                        return (
                          <tr
                            key={i}
                            className="bg-slate-50 italic text-slate-800 font-semibold"
                          >
                            <td className="py-2 px-3"></td>
                            <td className="py-2 px-3">{r.skuName}</td>
                            <td className="py-2 px-3"></td>
                            <td className="py-2 px-3 text-right"></td>
                            <td className="py-2 px-3 text-right"></td>
                            <td className="py-2 px-3 text-right">{r.qty}</td>
                            <td className="py-2 px-3 text-right"></td>
                            <td className="py-2 px-3 text-right">
                              {formatMoney(r.sales)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {formatMoney(r.cost)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {formatMoney(r.profit)}
                            </td>
                            <td className="py-2.5 px-3 text-right">{r.margin}</td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-slate-500">{r.sl}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {r.skuName}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{r.batch}</td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            ₹{formatMoney(r.grnPrice)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            ₹{formatMoney(r.sellingPrice)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {r.qty}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {r.ordersCount}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {formatMoney(r.sales)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {formatMoney(r.cost)}
                          </td>
                          <td
                            className={`py-2 px-3 text-right font-medium ${
                              r.profit < 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {formatMoney(r.profit)}
                          </td>
                          <td className="py-2 px-3 text-right">{r.margin}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
