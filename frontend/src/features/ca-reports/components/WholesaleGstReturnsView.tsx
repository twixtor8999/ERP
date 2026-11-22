import React, { useState } from 'react';
import { ArrowLeft, Download, Printer, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialReturnTab?: '1' | '2' | '3b' | '9';
  onNavigateToReport: (reportId: string) => void;
  onBack?: () => void;
}

export const WholesaleGstReturnsView: React.FC<Props> = ({
  initialReturnTab = '1',
  onNavigateToReport,
  onBack,
}) => {
  const [returnType, setReturnType] = useState<'1' | '2' | '3b' | '9'>(initialReturnTab);
  const [filingMode, setFilingMode] = useState('Monthly');
  const [returnMonth, setReturnMonth] = useState('2026-11');
  const [financialYear, setFinancialYear] = useState('FY 2025-26');
  const [searchTerm, setSearchTerm] = useState('');

  const isNov = returnMonth === '2026-11';
  const periodLabel = returnType === '9' ? financialYear : (isNov ? 'November 2026' : 'October 2026');
  const dueDateLabel = returnType === '1' 
    ? (isNov ? '11-12-2026' : '11-11-2026') 
    : returnType === '2' 
    ? 'Generated on the portal on the 14th — match these bills before filing GSTR-3B' 
    : returnType === '3b' 
    ? (isNov ? '20-12-2026' : '20-11-2026') 
    : '31-12-2026';

  // Subtitles per GSTR tab matching screenshots 1-4
  const SUBTITLES: Record<string, string> = {
    '1': "GSTR-1 · Sales return — B2B, B2C, credit notes, HSN, documents. CGST / SGST / IGST is split on every sale from the customer's GSTIN (or state). Please let your CA check before filing on the GST portal.",
    '2': "GSTR-2 · Inward supplies and ITC — to match with GSTR-2B. CGST / SGST / IGST is split on every sale from the customer's GSTIN (or state). Please let your CA check before filing on the GST portal.",
    '3b': "GSTR-3B · Monthly summary and tax payment. CGST / SGST / IGST is split on every sale from the customer's GSTIN (or state). Please let your CA check before filing on the GST portal.",
    '9': "GSTR-9 · Annual return for the financial year. CGST / SGST / IGST is split on every sale from the customer's GSTIN (or state). Please let your CA check before filing on the GST portal.",
  };

  const handleExport = () => {
    toast.success(`Exported GSTR-${returnType} official filing dataset (Excel/CSV)`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Title & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">GST Returns</h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-4xl leading-relaxed">
            {SUBTITLES[returnType]}
          </p>
        </div>

        <button
          onClick={handleExport}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Search Input */}
      <div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4 Big GSTR Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: '1', title: 'GSTR-1', sub: 'Monthly' },
          { id: '2', title: 'GSTR-2', sub: 'Purchases' },
          { id: '3b', title: 'GSTR-3B', sub: 'Monthly' },
          { id: '9', title: 'GSTR-9', sub: 'Yearly' },
        ].map((card) => {
          const isSelected = returnType === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setReturnType(card.id as any)}
              className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-[#0f4d4a] text-white border-[#0f4d4a] shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span className="text-base font-black tracking-wide">{card.title}</span>
              <span
                className={`text-xs mt-0.5 ${
                  isSelected ? 'text-teal-200' : 'text-slate-500'
                }`}
              >
                {card.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Row: Filing, Return month / Financial year, Print */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs text-xs">
        {returnType !== '9' ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-slate-600 font-semibold">Filing</span>
              <select
                value={filingMode}
                onChange={(e) => setFilingMode(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700 min-w-[120px]"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly (QRMP)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-slate-600 font-semibold">Return month</span>
              <input
                type="month"
                value={returnMonth}
                onChange={(e) => setReturnMonth(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700"
              />
            </label>
          </>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-slate-600 font-semibold">Financial year</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700 min-w-[140px]"
            >
              <option value="FY 2025-26">FY 2025-26</option>
              <option value="FY 2024-25">FY 2024-25</option>
              <option value="FY 2023-24">FY 2023-24</option>
            </select>
          </label>
        )}

        <button
          onClick={handlePrint}
          className="mt-auto px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 transition"
        >
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>

      {/* Quick link pills to Other CA reports */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-slate-600 block">Other CA reports</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'carsal', label: 'Sales Register' },
            { id: 'carpur', label: 'Purchase Register' },
            { id: 'carcdn', label: 'Credit / Debit Notes' },
            { id: 'carhsn', label: 'HSN Summary' },
            { id: 'cargsm', label: 'GST Summary (month wise)' },
            { id: 'carven', label: 'Vendor wise Purchases' },
            { id: 'carstk', label: 'Stock Summary' },
            { id: 'carexp', label: 'Expense Register' },
            { id: 'carday', label: 'Day Book' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => onNavigateToReport(pill.id)}
              className="px-3 py-1 text-xs font-medium rounded-full bg-slate-50 hover:bg-blue-50 hover:text-blue-800 text-slate-700 border border-slate-200 transition"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Business Details Card (4 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div>
          <span className="text-slate-500 block">Business</span>
          <b className="text-slate-900 font-bold text-sm">SIDDESHWAR ENTERPRISES</b>
        </div>
        <div>
          <span className="text-slate-500 block">GSTIN</span>
          <b className="text-slate-900 font-mono font-bold text-sm">29FMEPK5524A1Z8</b>
        </div>
        <div>
          <span className="text-slate-500 block">Period</span>
          <b className="text-slate-900 font-bold text-sm">
            {periodLabel}
          </b>
        </div>
        <div>
          <span className="text-slate-500 block">
            {returnType === '1'
              ? 'GSTR-1 due'
              : returnType === '2'
              ? 'GSTR-2B'
              : returnType === '3b'
              ? 'GSTR-3B due'
              : 'GSTR 9 due'}
          </span>
          <b className="text-slate-900 font-bold text-sm">
            {dueDateLabel}
          </b>
          {returnType === '9' && (
            <small className="block text-slate-500 text-[10px] mt-0.5">
              Note: Optional when yearly turnover is up to ₹2 crore — confirm with your CA
            </small>
          )}
        </div>
      </div>

      {/* KPI Tiles Container */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {returnType === '1' && (
          <>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">Taxable value</span>
              <b className="text-base font-bold text-teal-800">{isNov ? '₹17,45,280' : '₹0'}</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">IGST</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">CGST</span>
              <b className="text-base font-bold text-teal-800">{isNov ? '₹43,632' : '₹0'}</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">SGST</span>
              <b className="text-base font-bold text-teal-800">{isNov ? '₹43,632' : '₹0'}</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">Invoices</span>
              <b className="text-base font-bold text-teal-800">{isNov ? '512' : '0'}</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">Credit notes</span>
              <b className="text-base font-bold text-teal-800">{isNov ? '153' : '0'}</b>
            </div>
          </>
        )}

        {returnType === '2' && (
          <>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">Purchases taxable</span>
              <b className="text-base font-bold text-teal-800">₹23,140</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">ITC IGST</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">ITC CGST</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">ITC SGST</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">Net ITC (after returns)</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5">
              <span className="text-xs text-slate-600 block">Bills</span>
              <b className="text-base font-bold text-teal-800">1</b>
            </div>
          </>
        )}

        {returnType === '3b' && (
          <>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 sm:col-span-1.5">
              <span className="text-xs text-slate-600 block">Output tax</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 sm:col-span-1.5">
              <span className="text-xs text-slate-600 block">Net ITC</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 sm:col-span-1.5">
              <span className="text-xs text-slate-600 block">Pay in cash</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 sm:col-span-1.5">
              <span className="text-xs text-slate-600 block">ITC carried forward</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
          </>
        )}

        {returnType === '9' && (
          <>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 sm:col-span-1.5">
              <span className="text-xs text-slate-600 block">Turnover (4N + 5)</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 sm:col-span-1.5">
              <span className="text-xs text-slate-600 block">Output tax</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 sm:col-span-1.5">
              <span className="text-xs text-slate-600 block">ITC availed</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
            <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 sm:col-span-1.5">
              <span className="text-xs text-slate-600 block">Paid in cash</span>
              <b className="text-base font-bold text-teal-800">₹0</b>
            </div>
          </>
        )}
      </div>

      {/* Status banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-lg px-3 py-2 text-xs flex items-center gap-2 text-amber-900 font-medium">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>No problems found in this period</span>
      </div>

      {/* Return Table Content Section */}
      <div className="space-y-2">
        {returnType === '1' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                4A · B2B invoices Customers with GSTIN — one row per invoice and rate
              </span>
              <span className="text-xs text-slate-500">0 row(s) · sheet &quot;b2b&quot;</span>
            </div>
            <div className="p-6 text-center text-xs text-slate-500">
              Nothing in this period.
            </div>
          </div>
        )}

        {returnType === '2' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                ITC summary by rate From bills of vendors with GSTIN — check each bill appears in GSTR-2B on the portal
              </span>
              <span className="text-xs text-slate-500">3 row(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1e40af] text-white font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Rate</th>
                    <th className="py-2.5 px-4">Taxable Value</th>
                    <th className="py-2.5 px-4">IGST</th>
                    <th className="py-2.5 px-4">CGST</th>
                    <th className="py-2.5 px-4">SGST</th>
                    <th className="py-2.5 px-4">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold">5%</td>
                    <td className="py-2.5 px-4 font-mono">₹23,140</td>
                    <td className="py-2.5 px-4 font-mono">₹0</td>
                    <td className="py-2.5 px-4 font-mono">₹578.50</td>
                    <td className="py-2.5 px-4 font-mono">₹578.50</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-teal-800">₹1,157</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {returnType === '3b' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                3.1 · Outward and inward supplies liable to reverse charge Net of credit notes
              </span>
              <span className="text-xs text-slate-500">5 row(s) · sheet &quot;3.1&quot;</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1e40af] text-white font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Nature of Supplies</th>
                    <th className="py-2.5 px-4 text-right">Total Taxable Value</th>
                    <th className="py-2.5 px-4 text-right">Integrated Tax</th>
                    <th className="py-2.5 px-4 text-right">Central Tax</th>
                    <th className="py-2.5 px-4 text-right">State/UT Tax</th>
                    <th className="py-2.5 px-4 text-right">Cess</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-800">(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-800">(b) Outward taxable supplies (zero rated)</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-800">(c) Other outward supplies (nil rated, exempted)</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-800">(d) Inward supplies (liable to reverse charge)</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-800">(e) Non-GST outward supplies</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {returnType === '9' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                Pt II · 4 · Outward supplies on which tax is payable
              </span>
              <span className="text-xs text-slate-500">10 row(s)</span>
            </div>
            <div className="p-6 text-center text-xs text-slate-500">
              No outward supplies recorded for the financial year.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
