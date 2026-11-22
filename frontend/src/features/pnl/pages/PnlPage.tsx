import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Users, Calendar } from 'lucide-react';
import { WholesalePnlSummaryView } from '../components/WholesalePnlSummaryView';
import { WholesaleOrderWiseProfitView } from '../components/WholesaleOrderWiseProfitView';
import { WholesaleCrmWiseProfitView } from '../components/WholesaleCrmWiseProfitView';
import { PnlTab } from '../types';
import { toast } from 'sonner';

export function PnlPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state
  const tabParam = (searchParams.get('tab') || 'pl') as PnlTab;
  const [activeTab, setActiveTab] = useState<PnlTab>(
    ['pl', 'plo', 'plc'].includes(tabParam) ? tabParam : 'pl'
  );

  // Date range state defaulting to 22-11-2026 (matching reference app screenshots)
  const [fromDate, setFromDate] = useState('2026-11-22');
  const [toDate, setToDate] = useState('2026-11-22');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');

  useEffect(() => {
    if (tabParam && ['pl', 'plo', 'plc'].includes(tabParam)) {
      setActiveTab(tabParam as PnlTab);
    }
  }, [tabParam]);

  const handleTabChange = (tab: PnlTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period === 'today') {
      setFromDate('2026-11-22');
      setToDate('2026-11-22');
    } else if (period === 'yesterday') {
      setFromDate('2026-11-21');
      setToDate('2026-11-21');
    } else if (period === 'last7') {
      setFromDate('2026-11-15');
      setToDate('2026-11-22');
    } else if (period === 'this_month') {
      setFromDate('2026-11-01');
      setToDate('2026-11-22');
    } else if (period === 'all') {
      setFromDate('2026-10-01');
      setToDate('2026-11-22');
    }
  };

  const handleSubmit = () => {
    toast.success(`Updated P&L statement from ${fromDate} to ${toDate}`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Tab Bar & Range Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
        {/* Horizontal Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
          {[
            { id: 'pl' as PnlTab, label: '1) Profit & Loss Report', icon: TrendingUp },
            { id: 'plo' as PnlTab, label: '2) Order Wise Profit', icon: ShoppingBag },
            { id: 'plc' as PnlTab, label: '3) CRM Wise Profit', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#f59e0b] text-slate-900 shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <span className="text-slate-500 font-medium mr-1 hidden sm:inline">Range:</span>
          {[
            { id: 'today', label: 'Today (22 Nov)' },
            { id: 'yesterday', label: 'Yesterday (21 Nov)' },
            { id: 'last7', label: 'Last 7 Days' },
            { id: 'this_month', label: 'This Month (Nov)' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              className={`px-2.5 py-1 rounded text-2xs font-semibold transition ${
                selectedPeriod === p.id
                  ? 'bg-[#0f2d59] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB VIEWS */}
      {activeTab === 'pl' && (
        <WholesalePnlSummaryView
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onSubmit={handleSubmit}
        />
      )}

      {activeTab === 'plo' && (
        <WholesaleOrderWiseProfitView
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onSubmit={handleSubmit}
        />
      )}

      {activeTab === 'plc' && (
        <WholesaleCrmWiseProfitView
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
