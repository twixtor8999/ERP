import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WholesaleEmployeeListView } from '../components/WholesaleEmployeeListView';
import { WholesaleAttendanceView } from '../components/WholesaleAttendanceView';
import { WholesaleAttendanceListView } from '../components/WholesaleAttendanceListView';
import { WholesaleSalarySlipView } from '../components/WholesaleSalarySlipView';
import { WholesaleOfferLettersView } from '../components/WholesaleOfferLettersView';

type TabKey = 'list' | 'attendance' | 'att-list' | 'salary' | 'offers';

export const EmployeesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') || 'list';
  const selectedEmpParam = searchParams.get('emp');

  // Normalize tab key
  const activeTab: TabKey = ((): TabKey => {
    if (tabParam === 'list' || tabParam === 'emp') return 'list';
    if (tabParam === 'attendance' || tabParam === 'att') return 'attendance';
    if (tabParam === 'att-list' || tabParam === 'attl') return 'att-list';
    if (tabParam === 'salary' || tabParam === 'sal' || tabParam === 'sslip') return 'salary';
    if (tabParam === 'offers' || tabParam === 'off' || tabParam === 'offl') return 'offers';
    return 'list';
  })();

  const setTab = (key: TabKey, empId?: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', key);
    if (empId) {
      params.set('emp', String(empId));
    } else {
      params.delete('emp');
    }
    setSearchParams(params);
  };

  const handleOpenSalarySlip = (employeeId: number) => {
    setTab('salary', employeeId);
  };

  const handleOpenAllSalarySlips = () => {
    setTab('salary');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Render Active Sub-View */}
      {activeTab === 'list' && (
        <WholesaleEmployeeListView onBack={() => navigate('/')} />
      )}

      {activeTab === 'attendance' && (
        <WholesaleAttendanceView
          onBack={() => setTab('list')}
          onOpenSalarySlip={handleOpenSalarySlip}
        />
      )}

      {activeTab === 'att-list' && (
        <WholesaleAttendanceListView
          onBack={() => setTab('list')}
          onOpenSalarySlip={handleOpenSalarySlip}
          onOpenAllSalarySlips={handleOpenAllSalarySlips}
        />
      )}

      {activeTab === 'salary' && (
        <WholesaleSalarySlipView
          onBack={() => setTab('list')}
          initialEmployeeId={selectedEmpParam ? Number(selectedEmpParam) : undefined}
        />
      )}

      {activeTab === 'offers' && (
        <WholesaleOfferLettersView onBack={() => setTab('list')} />
      )}
    </div>
  );
};

export default EmployeesPage;
