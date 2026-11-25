import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { computeVehicleWiseProfit } from '../data/pnlEngine';
import { toast } from 'sonner';

interface Props {
  fromDate: string;
  toDate: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onSubmit: () => void;
}

export const WholesaleVehicleWiseProfitView: React.FC<Props> = ({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const data = useMemo(
    () => computeVehicleWiseProfit(fromDate, toDate),
    [fromDate, toDate]
  );

  const formatMoney = (val: number) =>
    val.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return data.rows;
    const q = searchQuery.toLowerCase();
    return data.rows.filter(
      (r) =>
        r.vehicleNo.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q)
    );
  }, [data.rows, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'Vehicle No',
      'Driver',
      'Trips',
      'Orders',
      'Sales (excl GST)',
      'Order Profit',
      'Trip Cost',
      'Vehicle Expenses',
      'Net Profit',
      'Margin',
    ];
    const rows = filteredRows.map((r) => [
      r.vehicleNo,
      r.driverName,
      r.tripsCount,
      r.ordersCount,
      r.sales,
      r.orderProfit,
      r.tripCost,
      r.vehicleExpenses,
      r.netProfit,
      r.margin,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-wise-profit-${fromDate}-to-${toDate}.csv`;
    a.click();
    toast.success('Vehicle wise profit exported to CSV');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Range Selection (Matches Screenshot 1 & 2) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Date Filter & Submit */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromChange(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-slate-800 bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToChange(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-slate-800 bg-white"
            />
          </div>
          <button
            onClick={onSubmit}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white font-bold px-3 py-1 rounded text-xs transition cursor-pointer"
          >
            Submit
          </button>
        </div>

        <button
          onClick={handleExportCsv}
          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Heading matching Reference App VW.plv */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Vehicle wise profit
        </h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Order profit on its trips minus trip cost and vehicle expenses (in range)
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="🔍 Search in this page (Vehicle, driver)…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Vehicles</div>
          <div className="text-lg font-black text-slate-900 mt-1">
            {data.totalVehicles}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">{data.totalTrips} delivery trips</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Sales (excl. GST)</div>
          <div className="text-lg font-black text-slate-900 mt-1">
            ₹{formatMoney(data.totalSales)}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Delivered orders</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Order Gross Profit</div>
          <div className="text-lg font-black text-emerald-700 mt-1">
            ₹{formatMoney(data.totalGrossProfit)}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Gross margins</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Trip & Vehicle Exp</div>
          <div className="text-lg font-black text-rose-700 mt-1">
            ₹{formatMoney(data.totalTripCost + data.totalVehExp)}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Fuel, rent & repairs</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-2xs font-bold text-slate-500 uppercase">Net Vehicle Profit</div>
          <div
            className={`text-lg font-black mt-1 ${
              data.totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            ₹{formatMoney(data.totalNetProfit)}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Overall Margin {data.overallMargin}</div>
        </div>
      </div>

      {/* Main Table matching Client App VW.plv */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#1e40af] text-white font-semibold uppercase tracking-wider text-2xs">
              <tr>
                <th className="py-2.5 px-3 bg-[#1e40af]">Vehicle</th>
                <th className="py-2.5 px-3 bg-[#1e40af]">Driver</th>
                <th className="py-2.5 px-3 text-center bg-[#1e40af]">Trips</th>
                <th className="py-2.5 px-3 text-center bg-[#1e40af]">Orders</th>
                <th className="py-2.5 px-3 text-right bg-[#1e40af]">Sales</th>
                <th className="py-2.5 px-3 text-right bg-[#1e40af]">Order Profit</th>
                <th className="py-2.5 px-3 text-right bg-[#1e40af]">Trip Cost</th>
                <th className="py-2.5 px-3 text-right bg-[#1e40af]">Vehicle Expenses</th>
                <th className="py-2.5 px-3 text-right bg-[#1e40af]">Net Profit</th>
                <th className="py-2.5 px-3 text-center bg-[#1e40af]">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.map((r) => (
                <tr key={r.vehicleId} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                    {r.vehicleNo}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {r.driverName}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold">
                    {r.tripsCount}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold">
                    {r.ordersCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    ₹{formatMoney(r.sales)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    ₹{formatMoney(r.orderProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    ₹{formatMoney(r.tripCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                    ₹{formatMoney(r.vehicleExpenses)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                    <span className={r.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                      ₹{formatMoney(r.netProfit)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-2xs ${
                        parseFloat(r.margin) >= 5
                          ? 'bg-emerald-50 text-emerald-800'
                          : parseFloat(r.margin) > 0
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {r.margin}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Totals Footer */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                <td className="py-3 px-3">Total</td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 text-center font-mono text-sm">{data.totalTrips}</td>
                <td className="py-3 px-3 text-center font-mono text-sm">
                  {filteredRows.reduce((a, b) => a + b.ordersCount, 0)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm">
                  ₹{formatMoney(data.totalSales)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-emerald-700">
                  ₹{formatMoney(data.totalGrossProfit)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm">
                  ₹{formatMoney(data.totalTripCost)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-rose-600">
                  ₹{formatMoney(data.totalVehExp)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-emerald-800">
                  ₹{formatMoney(data.totalNetProfit)}
                </td>
                <td className="py-3 px-3 text-center font-mono text-xs text-blue-700">
                  {data.overallMargin}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WholesaleVehicleWiseProfitView;
