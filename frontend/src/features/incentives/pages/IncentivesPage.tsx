import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  PackageCheck,
  TrendingUp,
  Users,
  UserPlus,
  MapPin,
  ShoppingBag,
  CheckCircle,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import { WholesaleSkuTargetView } from '../components/WholesaleSkuTargetView';
import { WholesaleTargetSectionView } from '../components/WholesaleTargetSectionView';
import { WholesaleTargetStatusView } from '../components/WholesaleTargetStatusView';
import { WholesaleIncentiveReportView } from '../components/WholesaleIncentiveReportView';
import { WholesaleSchemePosterView } from '../components/WholesaleSchemePosterView';

type IncentiveTabKey =
  | 'sku'
  | 'sales'
  | 'customer'
  | 'new-customer'
  | 'village'
  | 'order'
  | 'status'
  | 'report'
  | 'poster';

const INCENTIVE_SUB_TABS: {
  key: IncentiveTabKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: 'sku', label: '1) SKU Target', icon: PackageCheck },
  { key: 'sales', label: '2) Sales Target', icon: TrendingUp },
  { key: 'customer', label: '3) Customer Target', icon: Users },
  { key: 'new-customer', label: '4) New Customer Target', icon: UserPlus },
  { key: 'village', label: '5) Village Target', icon: MapPin },
  { key: 'order', label: '6) Order Target', icon: ShoppingBag },
  { key: 'status', label: '7) Target Status', icon: CheckCircle },
  { key: 'report', label: '8) Incentive Report', icon: FileSpreadsheet },
  { key: 'poster', label: '9) Scheme Poster', icon: ImageIcon },
];

export const IncentivesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') || 'sku';

  const activeTab: IncentiveTabKey = ((): IncentiveTabKey => {
    if (tabParam === 'sku' || tabParam === 'incs') return 'sku';
    if (tabParam === 'sales' || tabParam === 'itsale') return 'sales';
    if (tabParam === 'customer' || tabParam === 'itcust') return 'customer';
    if (tabParam === 'new-customer' || tabParam === 'itnewc') return 'new-customer';
    if (tabParam === 'village' || tabParam === 'itvill') return 'village';
    if (tabParam === 'order' || tabParam === 'itord') return 'order';
    if (tabParam === 'status' || tabParam === 'itst') return 'status';
    if (tabParam === 'report' || tabParam === 'incr') return 'report';
    if (tabParam === 'poster' || tabParam === 'incp' || tabParam === 'cinc') return 'poster';
    return 'sku';
  })();

  const setTab = (key: IncentiveTabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', key);
    setSearchParams(params);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* 9 Sub-Tabs Pill Navigation Bar */}
      <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1 overflow-x-auto">
        {INCENTIVE_SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active View */}
      {activeTab === 'sku' && (
        <WholesaleSkuTargetView onBack={() => navigate('/')} />
      )}

      {activeTab === 'sales' && (
        <WholesaleTargetSectionView
          type="sale"
          title="Sales Target"
          targetUnitLabel="Amount (₹)"
          onBack={() => setTab('sku')}
        />
      )}

      {activeTab === 'customer' && (
        <WholesaleTargetSectionView
          type="cust"
          title="Customer Target"
          targetUnitLabel="No. of Distinct Customers"
          onBack={() => setTab('sku')}
        />
      )}

      {activeTab === 'new-customer' && (
        <WholesaleTargetSectionView
          type="newc"
          title="New Customer Target"
          targetUnitLabel="No. of New Customers"
          onBack={() => setTab('sku')}
        />
      )}

      {activeTab === 'village' && (
        <WholesaleTargetSectionView
          type="vill"
          title="Village Target"
          targetUnitLabel="No. of Villages"
          onBack={() => setTab('sku')}
        />
      )}

      {activeTab === 'order' && (
        <WholesaleTargetSectionView
          type="ord"
          title="Order Target"
          targetUnitLabel="No. of Orders"
          onBack={() => setTab('sku')}
        />
      )}

      {activeTab === 'status' && (
        <WholesaleTargetStatusView onBack={() => setTab('sku')} />
      )}

      {activeTab === 'report' && (
        <WholesaleIncentiveReportView onBack={() => setTab('sku')} />
      )}

      {activeTab === 'poster' && (
        <WholesaleSchemePosterView onBack={() => setTab('sku')} />
      )}
    </div>
  );
};

export default IncentivesPage;
