import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ClipboardCheck, History } from 'lucide-react';
import {
  SuperAuditItem,
  ApprovedSuperAuditReport,
} from '../types/superAudit';
import {
  getStoredSuperAuditItems,
  getStoredSuperAuditHistory,
} from '../data/mockSuperAudit';
import { SuperStockAuditLiveView } from '../components/SuperStockAuditLiveView';
import { SuperStockAuditReportView } from '../components/SuperStockAuditReportView';

export const SuperStockAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'live' | 'report'>('live');
  const [items, setItems] = useState<SuperAuditItem[]>(() => getStoredSuperAuditItems());
  const [history, setHistory] = useState<ApprovedSuperAuditReport[]>(() => getStoredSuperAuditHistory());

  const handleAuditApproved = () => {
    setHistory(getStoredSuperAuditHistory());
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <button
          onClick={() => navigate('/inventory')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory
        </button>

        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'live' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Live Super Audit Count</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'report' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Super Stock Audit Report ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Page Title & Exact Subtitle from VW.supa */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
            Super Stock Audit
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Full stock count by the Owner. Each entry is saved at once and shows in Realtime Inventory (Physical Stock column) and in the Super Stock Audit Report. When every SKU with stock is counted, Approve makes the physical stock the closing stock.
        </p>
      </div>

      {/* Views */}
      {activeTab === 'live' ? (
        <SuperStockAuditLiveView
          items={items}
          onUpdateItems={setItems}
          onAuditApproved={handleAuditApproved}
        />
      ) : (
        <SuperStockAuditReportView reports={history} />
      )}
    </div>
  );
};

export default SuperStockAuditPage;
