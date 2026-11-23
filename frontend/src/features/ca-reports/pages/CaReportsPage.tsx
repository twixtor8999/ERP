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
      {/* Render selected view directly driven by sidebar sub-tabs */}
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
