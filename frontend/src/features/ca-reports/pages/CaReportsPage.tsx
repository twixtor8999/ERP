import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WholesaleGstReturnsView } from '../components/WholesaleGstReturnsView';
import { WholesaleRegisterView } from '../components/WholesaleRegisterView';

type CaTabKey =
  | 'gstr'
  | 'gstr1'
  | 'gstr2'
  | 'gstr3b'
  | 'gstr9'
  | 'carsal'
  | 'carpur'
  | 'carcdn'
  | 'carexp'
  | 'carhsn'
  | 'cargsm'
  | 'carven'
  | 'carstk'
  | 'carday';

export function CaReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = (searchParams.get('tab') || searchParams.get('type') || 'gstr') as CaTabKey;
  const [activeTab, setActiveTab] = useState<CaTabKey>(tabParam);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: CaTabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const isGstReturnTab = ['gstr', 'gstr1', 'gstr2', 'gstr3b', 'gstr9'].includes(activeTab);

  const getGstrInitialType = (): '1' | '2' | '3b' | '9' => {
    if (activeTab === 'gstr2') return '2';
    if (activeTab === 'gstr3b') return '3b';
    if (activeTab === 'gstr9') return '9';
    return '1';
  };

  return (
    <div className="space-y-4">
      {/* Top Sub-tabs Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'gstr', label: 'All GST Returns' },
          { id: 'gstr1', label: 'GSTR-1 · Sales' },
          { id: 'gstr2', label: 'GSTR-2 · Purchases' },
          { id: 'gstr3b', label: 'GSTR-3B · Summary' },
          { id: 'gstr9', label: 'GSTR-9 · Annual' },
          { id: 'carsal', label: 'Sales Register' },
          { id: 'carpur', label: 'Purchase Register' },
          { id: 'carcdn', label: 'Credit / Debit Notes' },
          { id: 'carexp', label: 'Expense Register' },
          { id: 'carhsn', label: 'HSN Summary' },
          { id: 'cargsm', label: 'GST Summary' },
          { id: 'carven', label: 'Vendor Purchases' },
          { id: 'carstk', label: 'Stock Summary' },
          { id: 'carday', label: 'Day Book' },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id as CaTabKey)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#f59e0b] text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Render selected view */}
      {isGstReturnTab ? (
        <WholesaleGstReturnsView
          initialReturnTab={getGstrInitialType()}
          onNavigateToReport={(repId) => handleTabChange(repId as CaTabKey)}
          onBack={() => navigate('/dashboard')}
        />
      ) : (
        <WholesaleRegisterView
          reportId={activeTab}
          onBack={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
}
export default CaReportsPage;
