import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  CalendarDays,
  FileSpreadsheet,
  FileCheck,
} from 'lucide-react';
import { WholesaleEmployeeListView } from '../components/WholesaleEmployeeListView';
import { WholesaleAttendanceView } from '../components/WholesaleAttendanceView';
import { WholesaleAttendanceListView } from '../components/WholesaleAttendanceListView';
import { WholesaleSalarySlipView } from '../components/WholesaleSalarySlipView';
import { WholesaleOfferLettersView } from '../components/WholesaleOfferLettersView';

type TabKey = 'list' | 'attendance' | 'att-list' | 'salary' | 'offers';

const SUB_TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'list', label: '1) Employee List', icon: Users },
  { key: 'attendance', label: '2) Attendance', icon: Clock },
  { key: 'att-list', label: '3) Attendance List', icon: CalendarDays },
  { key: 'salary', label: '4) Salary Slip', icon: FileSpreadsheet },
  { key: 'offers', label: '5) Offer Letters', icon: FileCheck },
];

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
      {/* Subtabs Navigation Bar */}
      <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1 overflow-x-auto">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
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
