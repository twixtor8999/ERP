import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

export const IncentivesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
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

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Render Active View directly based on sidebar tab navigation */}
      {activeTab === 'sku' && (
        <WholesaleSkuTargetView onBack={() => navigate('/dashboard')} />
      )}

      {activeTab === 'sales' && (
        <WholesaleTargetSectionView
          type="sale"
          title="Sales Target"
          targetUnitLabel="Amount (₹)"
          onBack={() => navigate('/dashboard')}
        />
      )}

      {activeTab === 'customer' && (
        <WholesaleTargetSectionView
          type="cust"
          title="Customer Target"
          targetUnitLabel="No. of Distinct Customers"
          onBack={() => navigate('/dashboard')}
        />
      )}

      {activeTab === 'new-customer' && (
        <WholesaleTargetSectionView
          type="newc"
          title="New Customer Target"
          targetUnitLabel="No. of New Customers"
          onBack={() => navigate('/dashboard')}
        />
      )}

      {activeTab === 'village' && (
        <WholesaleTargetSectionView
          type="vill"
          title="Village Target"
          targetUnitLabel="No. of Villages"
          onBack={() => navigate('/dashboard')}
        />
      )}

      {activeTab === 'order' && (
        <WholesaleTargetSectionView
          type="ord"
          title="Order Target"
          targetUnitLabel="No. of Orders"
          onBack={() => navigate('/dashboard')}
        />
      )}

      {activeTab === 'status' && (
        <WholesaleTargetStatusView onBack={() => navigate('/dashboard')} />
      )}

      {activeTab === 'report' && (
        <WholesaleIncentiveReportView onBack={() => navigate('/dashboard')} />
      )}

      {activeTab === 'poster' && (
        <WholesaleSchemePosterView onBack={() => navigate('/dashboard')} />
      )}
    </div>
  );
};

export default IncentivesPage;
