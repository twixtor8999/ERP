import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Bot,
  ShieldAlert,
  PieChart,
  TrendingUp,
  Download,
  Printer,
  ArrowLeft,
} from 'lucide-react';
import { WholesaleGstReportView } from '../components/WholesaleGstReportView';
import { WholesaleAiAssistantView } from '../components/WholesaleAiAssistantView';
import { WholesaleAiCrossCheckView } from '../components/WholesaleAiCrossCheckView';
import { toast } from 'sonner';

type ReportTab = 'gst' | 'ai' | 'audit' | 'ca' | 'pnl';

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const typeParam = searchParams.get('type') || searchParams.get('tab');
  const initialTab: ReportTab =
    typeParam === 'ai'
      ? 'ai'
      : typeParam === 'audit' || typeParam === 'cross-check'
      ? 'audit'
      : typeParam === 'ca'
      ? 'ca'
      : typeParam === 'pnl'
      ? 'pnl'
      : 'gst';

  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);

  useEffect(() => {
    if (typeParam && ['gst', 'ai', 'audit', 'cross-check', 'ca', 'pnl'].includes(typeParam)) {
      setActiveTab(typeParam === 'cross-check' ? 'audit' : (typeParam as ReportTab));
    }
  }, [typeParam]);

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    setSearchParams({ type: tab });
  };

  return (
    <div className="space-y-4">
      {/* Wholesale Subtabs Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'gst', label: '1) GST Report', icon: FileText },
          { id: 'ai', label: '2) AI Assistant', icon: Bot },
          { id: 'audit', label: 'AI Cross Check', icon: ShieldAlert },
          { id: 'ca', label: 'CA Reports', icon: PieChart },
          { id: 'pnl', label: 'P & L', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'ca') {
                  navigate('/ca-reports');
                } else if (tab.id === 'pnl') {
                  navigate('/p-and-l');
                } else {
                  handleTabChange(tab.id as ReportTab);
                }
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#f59e0b] text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1) GST REPORT SUBTAB */}
      {activeTab === 'gst' && (
        <WholesaleGstReportView onBack={() => navigate('/dashboard')} />
      )}

      {/* 2) AI ASSISTANT SUBTAB */}
      {activeTab === 'ai' && (
        <WholesaleAiAssistantView onBack={() => navigate('/dashboard')} />
      )}

      {/* 3) AI CROSS CHECK SUBTAB */}
      {activeTab === 'audit' && (
        <WholesaleAiCrossCheckView onBack={() => navigate('/dashboard')} />
      )}

      {/* CA REPORTS SUBTAB */}
      {activeTab === 'ca' && (
        <div className="space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#1e40af] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 font-medium">From</span>
              <input
                type="date"
                defaultValue="2026-11-22"
                className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700"
              />
              <span className="text-slate-600 font-medium">To</span>
              <input
                type="date"
                defaultValue="2026-11-22"
                className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700"
              />
              <button
                onClick={() => toast.info('Updated CA register date filter')}
                className="bg-[#0f2d59] hover:bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold transition"
              >
                Submit
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">CA Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accountant and Chartered Accountant statutory audit reports & sales registers
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-400 transition cursor-pointer space-y-2"
              onClick={() => toast.success('Exporting CA Sales Register to Excel...')}
            >
              <h3 className="text-sm font-bold text-slate-900">CA Sales Register</h3>
              <p className="text-xs text-slate-500">
                Invoice-wise sales, customer GSTIN, taxable amount & GST split
              </p>
              <button className="w-full mt-2 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download Excel
              </button>
            </div>

            <div
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-400 transition cursor-pointer space-y-2"
              onClick={() => toast.success('Exporting CA Purchase Register to Excel...')}
            >
              <h3 className="text-sm font-bold text-slate-900">CA Purchase Register</h3>
              <p className="text-xs text-slate-500">
                Vendor GSTIN, purchase bills, ITC eligible taxes & HSN
              </p>
              <button className="w-full mt-2 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download Excel
              </button>
            </div>

            <div
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-400 transition cursor-pointer space-y-2"
              onClick={() => toast.success('Exporting Credit & Debit Notes...')}
            >
              <h3 className="text-sm font-bold text-slate-900">Credit & Debit Notes</h3>
              <p className="text-xs text-slate-500">
                Sales returns, vendor return debits and ledger adjustments
              </p>
              <button className="w-full mt-2 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* P & L (PROFIT & LOSS REPORT) SUBTAB */}
      {activeTab === 'pnl' && (
        <div className="space-y-4 text-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#1e40af] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">From</span>
                <input
                  type="date"
                  defaultValue="2026-11-22"
                  className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700"
                />
                <span className="text-slate-600 font-medium">To</span>
                <input
                  type="date"
                  defaultValue="2026-11-22"
                  className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700"
                />
                <button
                  onClick={() => toast.info('Updated P&L statement range')}
                  className="bg-[#0f2d59] hover:bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold transition"
                >
                  Submit
                </button>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print Statement
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Profit & Loss report</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sales are net of returns and exclude GST
            </p>
          </div>

          {/* 4 KPI Cards matching reference VW.pl */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Sales</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">₹23,62,380</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Gross profit</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">₹5,33,310</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Expenses + trips</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">₹2,10,850</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Net profit</div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">₹3,22,460</div>
            </div>
          </div>

          {/* P&L Statement Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#1e40af] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Line</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-800">Sales (net of returns)</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    ₹23,62,380
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-600">Cost of goods sold</td>
                  <td className="py-2.5 px-4 text-right font-mono text-rose-600">
                    − ₹18,29,070
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold border-y border-slate-200">
                  <td className="py-2.5 px-4 text-slate-900">Gross profit</td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-800">
                    ₹5,33,310
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-600 pl-8">Expense: Staff Salaries</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">₹1,15,000</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-600 pl-8">Expense: Warehouse Rent & Electricity</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">₹45,000</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-600 pl-8">Trip costs & Vehicle Fuel</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">₹38,400</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-600 pl-8">Expense: Chai & Snacks</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">₹12,450</td>
                </tr>
                <tr className="bg-emerald-50/70 font-bold text-sm border-t-2 border-emerald-400">
                  <td className="py-3 px-4 text-emerald-950 font-bold">Net profit</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900 text-base">
                    ₹3,22,460
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 italic">
            Sales returns in this range (incl. GST): ₹12,400
          </p>
        </div>
      )}
    </div>
  );
}
