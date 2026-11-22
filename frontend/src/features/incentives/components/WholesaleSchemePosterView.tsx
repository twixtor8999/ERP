import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Calendar,
  Settings,
  Target,
  Lightbulb,
  FileCheck,
  Calculator,
} from 'lucide-react';
import {
  SkuTargetItem,
  getStoredSkuTargets,
} from '../data/mockIncentives';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
}

export const WholesaleSchemePosterView: React.FC<Props> = ({ onBack }) => {
  const [skuTargets] = useState<SkuTargetItem[]>(() => getStoredSkuTargets());
  const [searchTerm, setSearchTerm] = useState('');
  const [activePill, setActivePill] = useState<'sku' | 'sales'>('sku');
  const [page, setPage] = useState(1);

  // Top Date range filters
  const [fromDate, setFromDate] = useState('2026-11-22');
  const [toDate, setToDate] = useState('2026-11-22');

  const runningSkus = useMemo(() => {
    return skuTargets.filter((s) => s.isActive && s.inc > 0);
  }, [skuTargets]);

  const filteredSkus = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return runningSkus;
    return runningSkus.filter(
      (s) =>
        s.skuName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [runningSkus, searchTerm]);

  // Pagination for cards: 10 per page
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredSkus.length / pageSize));
  const displayedSkus = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSkus.slice(start, start + pageSize);
  }, [filteredSkus, page, pageSize]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">Scheme Poster</h1>
        </div>

        {/* Date Filter Bar & Print Button */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-none p-0 text-xs font-semibold focus:ring-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-none p-0 text-xs font-semibold focus:ring-0 bg-transparent"
            />
          </div>
          <button
            onClick={() => toast.success('Filter submitted')}
            className="px-3 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            Submit
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Filter Pills (SKU Target | Sales Target) and Pagination (matching Screenshot 9) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePill('sku')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              activePill === 'sku'
                ? 'bg-navy-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            SKU Target
          </button>
          <button
            onClick={() => setActivePill('sales')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              activePill === 'sales'
                ? 'bg-navy-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Sales Target
          </button>
        </div>

        {/* Pagination: < Previous | 1/2 | Next > */}
        <div className="flex items-center gap-2 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 rounded-lg font-bold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <span className="font-mono font-bold text-gray-700 px-2">
            {page}/{totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white rounded-lg font-bold"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* THE ICONIC WHOLESALE POSTER CANVAS (Matching Screenshot 9) */}
      <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-xl overflow-hidden print:m-0 print:border-none print:shadow-none max-w-6xl mx-auto">
        {/* Poster Top Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-50/70 via-white to-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide text-red-600 uppercase">
                SIDDESHWAR <span className="text-navy-950">ENTERPRISES</span>
              </h1>
              <p className="text-xs italic font-semibold text-gray-600">
                Grow Together with SIDDESHWAR ENTERPRISES
              </p>
            </div>
          </div>

          {/* Slanted Eye-Catching Incentive Scheme Badge */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-xl shadow-lg border-2 border-yellow-400 rotate-1 sm:rotate-2 text-center">
            <div className="text-sm font-black tracking-wider uppercase text-yellow-300">
              INCENTIVE SCHEME
            </div>
            <div className="text-[11px] font-bold tracking-tight bg-blue-900 px-2 py-0.5 rounded text-white mt-0.5">
              Sell More · Earn More
            </div>
          </div>
        </div>

        {/* Sub-Banner: Top Selling Products & Incentives */}
        <div className="px-6 pt-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Top Selling Products &amp; Incentives</span>
          </div>
        </div>

        {/* Product Cards Grid (5 per row on desktop, 2-3 on mobile) */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {displayedSkus.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group"
              >
                {/* Category Floating Pill Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-blue-900/90 text-white shadow">
                    {item.category.split('&')[0]}
                  </span>
                </div>

                {/* Product Photo */}
                <div className="h-32 bg-gray-50 flex items-center justify-center p-2 overflow-hidden border-b border-gray-100">
                  <img
                    src={
                      item.incImg ||
                      'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=120&auto=format&fit=crop&q=80'
                    }
                    alt={item.skuName}
                    className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Card Body */}
                <div className="p-2.5 flex-1 flex flex-col justify-between text-center space-y-1">
                  <div className="text-xs font-bold text-navy-950 line-clamp-2 min-h-[32px]">
                    {item.skuName}
                  </div>

                  <div className="text-[11px] font-semibold text-gray-500">
                    MRP: ₹{item.price.toLocaleString('en-IN')}
                  </div>

                  <div className="text-[11px] font-bold text-blue-700 bg-blue-50 py-0.5 rounded">
                    Target: {item.incMin > 0 ? `${item.incMin} Pcs` : 'Any Qty'}
                  </div>

                  {/* Highlight Incentive Yellow Banner */}
                  <div className="bg-amber-300 text-navy-950 font-black text-xs py-1.5 px-2 rounded-lg shadow-sm border border-amber-400">
                    Incentive ₹{item.inc} per pack
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Poster Explanatory 3-Box Rows (matching reference code nxPoster2) */}
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Box 1: Scheme Options */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="font-bold text-navy-950 flex items-center gap-1.5 text-sm">
                <Settings className="w-4 h-4 text-blue-600" />
                <span>Scheme Options</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <strong>By SKU:</strong> Each SKU has its own incentive
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <strong>By Product:</strong> Product-wise incentive
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <strong>By Category:</strong> Category-wise incentives
                </div>
              </div>
            </div>

            {/* Box 2: Scheme Period */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="font-bold text-navy-950 flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Scheme Period</span>
              </div>
              <div className="text-[11px] text-gray-600 space-y-1">
                <div>
                  <strong>Start Date:</strong> 01-Nov-2026
                </div>
                <div>
                  <strong>End Date:</strong> 30-Nov-2026
                </div>
                <div className="text-gray-500">Orders placed in this window qualify for payout.</div>
              </div>
            </div>

            {/* Box 3: Target / Minimum Quantity */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="font-bold text-navy-950 flex items-center gap-1.5 text-sm">
                <Target className="w-4 h-4 text-red-600" />
                <span>Target / Minimum Quantity</span>
              </div>
              <div className="text-[11px] text-gray-600 space-y-1">
                <div>
                  <strong>Minimum Purchase:</strong> As per scheme listed on cards
                </div>
                <div className="text-gray-500">
                  Example: 1 Pc, 5 Pcs, or 10 Pcs per SKU.
                </div>
              </div>
            </div>
          </div>

          {/* 3-Box Row 2: How to Get Incentive, Example Table, Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Box 4: How to Get Incentive? */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="font-bold text-navy-950 flex items-center gap-1.5 text-sm">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>How to Get Incentive?</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-600">
                <li>Order the listed products as per scheme.</li>
                <li>Check the SKU &amp; minimum quantity in the order.</li>
                <li>Incentive is added automatically (returns deducted).</li>
                <li>Grow your sales &amp; earn more!</li>
              </ol>
            </div>

            {/* Box 5: Total Incentive Calculation (Example) */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="font-bold text-navy-950 flex items-center gap-1.5 text-sm">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Total Incentive Calculation (Example)</span>
              </div>
              <table className="w-full text-[10px] text-left">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th>Product</th>
                    <th>Qty</th>
                    <th>₹/Unit</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="truncate max-w-[90px]">Aramane Detergent</td>
                    <td>5</td>
                    <td>₹20</td>
                    <td>₹100</td>
                  </tr>
                  <tr>
                    <td className="truncate max-w-[90px]">Daawat Rice 26kg</td>
                    <td>2</td>
                    <td>₹10</td>
                    <td>₹20</td>
                  </tr>
                  <tr>
                    <td className="truncate max-w-[90px]">Trulove Biscuits</td>
                    <td>10</td>
                    <td>₹10</td>
                    <td>₹100</td>
                  </tr>
                  <tr className="font-bold text-navy-950 bg-blue-50">
                    <td colSpan={3}>Total Incentive</td>
                    <td>₹220</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Box 6: Terms & Conditions */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="font-bold text-navy-950 flex items-center gap-1.5 text-sm">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Terms &amp; Conditions</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-600">
                <li>Scheme valid for the listed SKUs only.</li>
                <li>Minimum quantity as per scheme must be ordered.</li>
                <li>Incentive is calculated on the actual sales bill.</li>
                <li>Cancelled orders do not count; returns are deducted.</li>
                <li>Company reserves the right to modify or withdraw the scheme.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Poster Footer Banner */}
        <div className="bg-[#0d1b4c] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-3 font-semibold text-blue-200">
            <span>Billing</span>
            <span>·</span>
            <span>Inventory</span>
            <span>·</span>
            <span>GST</span>
            <span>·</span>
            <span>Accounting</span>
            <span>·</span>
            <span>Reports</span>
          </div>

          <div className="font-bold text-yellow-400">
            Grow Together with SIDDESHWAR ENTERPRISES
          </div>
        </div>
      </div>
    </div>
  );
};
