import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';
import {
  Employee,
  AttendanceRecord,
  SalaryRecord,
  getStoredEmployees,
  getStoredAttendance,
  saveStoredAttendance,
  getStoredSalaries,
  saveStoredSalaries,
  getMonthDays,
  isSunday,
  HOLIDAYS_2026,
} from '../data/mockEmployees';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
  onOpenSalarySlip?: (employeeId: number) => void;
  onOpenAllSalarySlips?: () => void;
}

function getMinutesDiff(inTime?: string, outTime?: string): number {
  if (!inTime || !outTime) return 0;
  const inP = inTime.split(':').map(Number);
  const outP = outTime.split(':').map(Number);
  const inH = inP[0] ?? 0;
  const inM = inP[1] ?? 0;
  const outH = outP[0] ?? 0;
  const outM = outP[1] ?? 0;
  return outH * 60 + outM - (inH * 60 + inM);
}

export const WholesaleAttendanceListView: React.FC<Props> = ({
  onBack,
  onOpenSalarySlip,
  onOpenAllSalarySlips,
}) => {
  const [employees] = useState<Employee[]>(() => getStoredEmployees());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getStoredAttendance());
  const [salaries, setSalaries] = useState<SalaryRecord[]>(() => getStoredSalaries());
  // Today string dynamically defaulting to current real ISO date
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  })();
  const [selectedMonth, setSelectedMonth] = useState(() => todayStr.slice(0, 7));
  const [showHolidays, setShowHolidays] = useState(false);

  // Modal State for Attendance Override (tap H or A -> P*)
  const [fixModal, setFixModal] = useState<{
    emp: Employee;
    date: string;
    currentCode: string;
    currentLabel: string;
    isOverridden: boolean;
    record?: AttendanceRecord;
  } | null>(null);
  const [fixReason, setFixReason] = useState('');

  // Modal State for Salary Process: Approve
  const [approveModal, setApproveModal] = useState<{
    emp: Employee;
    dw: number;
    calcAmt: number;
    gross: number;
    P: number;
    H: number;
  } | null>(null);
  const [approveAmt, setApproveAmt] = useState<number>(0);
  const [approvePm, setApprovePm] = useState('Bank Transfer');
  const [approveNote, setApproveNote] = useState('');

  const daysInMonth = useMemo(() => getMonthDays(selectedMonth), [selectedMonth]);

  // Compute table rows
  const computedRows = useMemo(() => {
    return employees.map((emp) => {
      let P = 0;
      let HD = 0;
      let A = 0;
      let totalMinutes = 0;

      const dayCells = daysInMonth.map((d) => {
        const isSun = isSunday(d);
        const hol = HOLIDAYS_2026[d];
        const rec = attendance.find((a) => a.emp === emp.id && a.date === d);
        const isPastOrToday = d <= todayStr;

        let code = '';
        let label = '';
        let colorClass = 'text-gray-400';
        let isClickable = false;

        if (isSun) {
          code = 'W/O';
          label = 'Week off (Sunday)';
          colorClass = 'text-blue-500 font-bold';
        } else if (hol) {
          code = 'H';
          label = `Holiday: ${hol}`;
          colorClass = 'text-purple-600 font-bold';
          isClickable = true;
        } else if (rec && rec.ov === 'P') {
          code = 'P*';
          label = `Present (Overridden: ${rec.ovWhy || 'Admin approval'})`;
          colorClass = 'text-emerald-700 font-black';
          P++;
          totalMinutes += 480;
          isClickable = true;
        } else if (rec && rec.inT) {
          if (rec.outT) {
            const diff = getMinutesDiff(rec.inT, rec.outT);
            const hrs = diff / 60;
            totalMinutes += Math.max(0, diff);
            if (hrs >= 8) {
              code = 'P';
              label = 'Present';
              colorClass = 'text-emerald-600 font-bold';
              P++;
            } else {
              code = 'HD';
              label = 'Half Day';
              colorClass = 'text-amber-600 font-bold';
              HD++;
            }
          } else if (d === todayStr) {
            code = 'In';
            label = 'Checked in today';
            colorClass = 'text-blue-600 font-bold';
          } else {
            code = 'HD';
            label = 'Half Day (No checkout)';
            colorClass = 'text-amber-600 font-bold';
            HD++;
          }
        } else if (isPastOrToday) {
          code = 'A';
          label = 'Absent';
          colorClass = 'text-red-600 font-bold';
          A++;
          isClickable = true;
        } else {
          code = '·';
          label = 'Upcoming';
          colorClass = 'text-gray-300';
        }

        return {
          date: d,
          code,
          label,
          colorClass,
          isClickable,
          rec,
        };
      });

      // Total Hours
      const thH = Math.floor(totalMinutes / 60);
      const thM = totalMinutes % 60;
      const totalHoursStr = `${thH}h ${String(thM).padStart(2, '0')}m`;

      // Days working: Present + (Half Day * 0.5) + Sundays + Holidays
      // In wholesale reference app, sundays & holidays count towards working days if employed
      const sundaysCount = daysInMonth.filter((d) => isSunday(d) && d <= todayStr).length;
      const holidaysCount = daysInMonth.filter((d) => HOLIDAYS_2026[d] && d <= todayStr).length;
      const daysWorking = P + HD * 0.5 + sundaysCount + holidaysCount;

      const sal = salaries.find((s) => s.emp === emp.id && s.mon === selectedMonth);

      return {
        emp,
        dayCells,
        P,
        HD,
        A,
        totalHoursStr,
        daysWorking,
        sal,
      };
    });
  }, [employees, daysInMonth, attendance, salaries, todayStr, selectedMonth]);

  // 4 Top KPI Cards
  const topStats = useMemo(() => {
    const totalEmployees = employees.length;
    let checkedIn = 0;
    let checkedOut = 0;
    let notMarked = 0;

    employees.forEach((emp) => {
      const rec = attendance.find((a) => a.emp === emp.id && a.date === todayStr);
      if (rec && rec.inT) {
        checkedIn++;
        if (rec.outT) checkedOut++;
      } else {
        notMarked++;
      }
    });

    return { totalEmployees, checkedIn, checkedOut, notMarked };
  }, [employees, attendance, todayStr]);

  // Handle click on cell to fix attendance
  const handleCellClick = (emp: Employee, cell: any) => {
    if (!cell.isClickable) return;
    setFixModal({
      emp,
      date: cell.date,
      currentCode: cell.code,
      currentLabel: cell.label,
      isOverridden: cell.code === 'P*',
      record: cell.rec,
    });
    setFixReason(cell.rec?.ovWhy || '');
  };

  const handleSaveFix = () => {
    if (!fixModal) return;
    const { emp, date, record } = fixModal;
    const selectEl = document.getElementById('modal-attendance-status-select') as HTMLSelectElement | null;
    const nextOv = (selectEl?.value || 'P') as 'P' | 'HD' | 'A';

    let updated: AttendanceRecord[];
    if (record) {
      updated = attendance.map((a) =>
        a.id === record.id
          ? {
              ...a,
              ov: nextOv,
              ovWas: a.ovWas || fixModal.currentCode,
              ovBy: 'Vijaykumar Shantagiri',
              ovDate: todayStr,
              ovWhy: fixReason.trim() || 'Admin Override',
            }
          : a
      );
    } else {
      const newRec: AttendanceRecord = {
        id: Date.now(),
        emp: emp.id,
        date,
        ov: nextOv,
        ovWas: fixModal.currentCode,
        ovBy: 'Vijaykumar Shantagiri',
        ovDate: todayStr,
        ovWhy: fixReason.trim() || 'Admin Override',
      };
      updated = [...attendance, newRec];
    }

    setAttendance(updated);
    saveStoredAttendance(updated);
    window.dispatchEvent(new Event('attendance_updated'));
    const labelMap = { P: 'Present (P*)', HD: 'Half Day (HD)', A: 'Absent (A)' };
    toast.success(`Marked ${labelMap[nextOv]} for ${emp.name} on ${date}`);
    setFixModal(null);
  };

  const handleUndoFix = () => {
    if (!fixModal || !fixModal.record) return;
    const { emp, date, record } = fixModal;

    const updated = attendance.map((a) =>
      a.id === record.id
        ? {
            ...a,
            ov: undefined,
            ovWas: undefined,
            ovBy: undefined,
            ovDate: undefined,
            ovWhy: undefined,
          }
        : a
    );

    setAttendance(updated);
    saveStoredAttendance(updated);
    toast.success(`Reverted attendance for ${emp.name} on ${date}`);
    setFixModal(null);
  };

  // Salary Process Handlers
  const handleSalaryAction = (emp: Employee, action: string, row: any) => {
    if (action === 'approve') {
      const dim = daysInMonth.length;
      const calcAmt = Math.round((emp.sal * row.daysWorking) / dim);
      setApproveModal({
        emp,
        dw: row.daysWorking,
        calcAmt,
        gross: emp.sal,
        P: row.P,
        H: row.HD,
      });
      setApproveAmt(calcAmt);
      setApprovePm('Bank Transfer');
      setApproveNote('');
    } else if (action === 'wait') {
      const existing = salaries.find((s) => s.emp === emp.id && s.mon === selectedMonth);
      let updated: SalaryRecord[];
      if (existing) {
        updated = salaries.map((s) =>
          s.id === existing.id
            ? { ...s, st: 'wait', by: 'Vijaykumar Shantagiri', date: todayStr }
            : s
        );
      } else {
        updated = [
          ...salaries,
          {
            id: Date.now(),
            emp: emp.id,
            mon: selectedMonth,
            st: 'wait',
            by: 'Vijaykumar Shantagiri',
            date: todayStr,
            why: 'Pending verification',
          },
        ];
      }
      setSalaries(updated);
      saveStoredSalaries(updated);
      toast.info(`Salary for ${emp.name} placed on Wait`);
    } else if (action === 'reject') {
      const existing = salaries.find((s) => s.emp === emp.id && s.mon === selectedMonth);
      let updated: SalaryRecord[];
      if (existing) {
        updated = salaries.map((s) =>
          s.id === existing.id
            ? { ...s, st: 'reject', by: 'Vijaykumar Shantagiri', date: todayStr }
            : s
        );
      } else {
        updated = [
          ...salaries,
          {
            id: Date.now(),
            emp: emp.id,
            mon: selectedMonth,
            st: 'reject',
            by: 'Vijaykumar Shantagiri',
            date: todayStr,
            why: 'Discrepancy in records',
          },
        ];
      }
      setSalaries(updated);
      saveStoredSalaries(updated);
      toast.error(`Salary for ${emp.name} Rejected`);
    }
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModal) return;
    const { emp, dw } = approveModal;

    const existing = salaries.find((s) => s.emp === emp.id && s.mon === selectedMonth);
    let updated: SalaryRecord[];

    const newRec: SalaryRecord = {
      id: existing ? existing.id : Date.now(),
      emp: emp.id,
      mon: selectedMonth,
      st: 'approved',
      days: dw,
      amt: approveAmt,
      pm: approvePm,
      acct: `${emp.bank} · A/C ${emp.acno} · IFSC ${emp.ifsc}`,
      by: 'Vijaykumar Shantagiri',
      date: todayStr,
      note: approveNote,
    };

    if (existing) {
      updated = salaries.map((s) => (s.id === existing.id ? newRec : s));
    } else {
      updated = [...salaries, newRec];
    }

    setSalaries(updated);
    saveStoredSalaries(updated);
    toast.success(`Salary approved for ${emp.name} (₹${approveAmt.toLocaleString('en-IN')})`);
    setApproveModal(null);
  };

  const handleUndoSalary = (empId: number, name: string) => {
    if (confirm(`Undo salary approval for ${name}?`)) {
      const updated = salaries.filter(
        (s) => !(s.emp === empId && s.mon === selectedMonth)
      );
      setSalaries(updated);
      saveStoredSalaries(updated);
      toast.success(`Salary approval undone for ${name}`);
    }
  };

  const handleExportExcel = () => {
    const header = [
      'Employee',
      'Contact',
      ...daysInMonth.map((_, i) => i + 1),
      'Present',
      'Half Day',
      'Absent',
      'Total Hours',
      'Days Working',
      'Salary Process',
      'Salary Amount',
    ];

    const rows = computedRows.map((r) => [
      `"${r.emp.name}"`,
      r.emp.ph,
      ...r.dayCells.map((c) => c.code),
      r.P,
      r.HD,
      r.A,
      r.totalHoursStr,
      r.daysWorking,
      r.sal?.st || 'Pending',
      r.sal?.amt || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Attendance_List_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance matrix exported to CSV');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-950">Attendance List</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              All employees for the month. P = Present (8 h or more) · HD = Half Day · A = Absent ·
              H = Holiday · W/O = Week off · In = checked in today, not yet out. Tap an H or A to change it to P (shown as P*).
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Employees
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">
            {topStats.totalEmployees}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            Checked in today
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {topStats.checkedIn}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
            Not marked today
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">
            {topStats.notMarked}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            Checked out today
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono">
            {topStats.checkedOut}
          </div>
        </div>
      </div>

      {/* Month Bar & Action Buttons */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-navy-950">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          {onOpenAllSalarySlips && (
            <button
              onClick={onOpenAllSalarySlips}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-xs font-semibold shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>🧾 All salary slips</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Expandable Holidays & Week Off Accordion */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <button
          onClick={() => setShowHolidays(!showHolidays)}
          className="w-full px-4 py-2.5 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
        >
          <span className="text-xs font-bold text-gray-700">
            📅 Holidays &amp; Week off: 1 holiday(s) this month · Week off: Sun
          </span>
          {showHolidays ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {showHolidays && (
          <div className="p-4 border-t border-gray-200 bg-white text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-700">18-11-2026:</span>
                <span>Kanakadasa Jayanti (General Holiday)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700">Sundays (1, 8, 15, 22, 29):</span>
                <span>Weekly Off</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Scrollable Attendance Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white font-semibold">
                <th className="py-2.5 px-3 text-left sticky left-0 bg-blue-600 z-10 whitespace-nowrap min-w-[150px]">
                  Employee
                </th>
                {daysInMonth.map((d, idx) => (
                  <th
                    key={d}
                    className={`py-2.5 px-1.5 w-7 text-center font-mono ${
                      d === todayStr ? 'bg-blue-700 underline font-bold' : ''
                    }`}
                  >
                    {idx + 1}
                  </th>
                ))}
                <th className="py-2.5 px-2 bg-emerald-700">P</th>
                <th className="py-2.5 px-2 bg-amber-700">HD</th>
                <th className="py-2.5 px-2 bg-red-700">A</th>
                <th className="py-2.5 px-3 bg-blue-800 whitespace-nowrap">Total Hours</th>
                <th className="py-2.5 px-3 bg-blue-900 whitespace-nowrap">Days Working</th>
                <th className="py-2.5 px-4 bg-navy-950 whitespace-nowrap min-w-[160px]">
                  Salary Process
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {computedRows.map((row) => (
                <tr key={row.emp.id} className="hover:bg-blue-50/30 transition-colors">
                  {/* Fixed Employee Name Column */}
                  <td className="py-2.5 px-3 text-left font-bold text-navy-950 sticky left-0 bg-white z-10 border-r border-gray-200 whitespace-nowrap shadow-sm">
                    {row.emp.name}
                  </td>

                  {/* 30/31 Day Cells */}
                  {row.dayCells.map((cell) => (
                    <td
                      key={cell.date}
                      onClick={() => handleCellClick(row.emp, cell)}
                      title={`${row.emp.name} · ${cell.date} · ${cell.label}`}
                      className={`py-2 px-1 text-center font-mono text-xs select-none transition-colors border-r border-gray-100 ${
                        cell.colorClass
                      } ${cell.isClickable ? 'cursor-pointer hover:bg-yellow-100/60' : ''} ${
                        cell.date === todayStr ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {cell.code}
                    </td>
                  ))}

                  {/* Summary Columns */}
                  <td className="py-2 px-2 text-emerald-700 font-bold bg-emerald-50/30 border-r border-gray-100">
                    {row.P}
                  </td>
                  <td className="py-2 px-2 text-amber-700 font-bold bg-amber-50/30 border-r border-gray-100">
                    {row.HD}
                  </td>
                  <td className="py-2 px-2 text-red-700 font-bold bg-red-50/30 border-r border-gray-100">
                    {row.A}
                  </td>
                  <td className="py-2 px-3 text-navy-900 font-semibold border-r border-gray-100 whitespace-nowrap">
                    {row.totalHoursStr}
                  </td>
                  <td className="py-2 px-3 text-navy-950 font-black border-r border-gray-100 whitespace-nowrap">
                    {row.daysWorking.toFixed(1)}
                  </td>

                  {/* Salary Process Column */}
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    {row.sal && row.sal.st === 'approved' ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                        <div className="text-[10px] text-gray-500 font-mono">
                          ₹{row.sal.amt?.toLocaleString('en-IN')} · {row.sal.date}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {onOpenSalarySlip && (
                            <button
                              onClick={() => onOpenSalarySlip(row.emp.id)}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-navy-900 text-white rounded hover:bg-navy-800 shadow-sm"
                            >
                              🧾 Slip
                            </button>
                          )}
                          <button
                            onClick={() => handleUndoSalary(row.emp.id, row.emp.name)}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Undo
                          </button>
                        </div>
                      </div>
                    ) : row.sal && row.sal.st === 'wait' ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          ⏳ Wait
                        </span>
                        <select
                          onChange={(e) => handleSalaryAction(row.emp, e.target.value, row)}
                          defaultValue=""
                          className="text-[11px] px-1.5 py-0.5 border border-gray-200 rounded bg-white text-gray-700"
                        >
                          <option value="">Change...</option>
                          <option value="approve">Approve</option>
                          <option value="reject">Reject</option>
                        </select>
                      </div>
                    ) : row.sal && row.sal.st === 'reject' ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                          ✖ Rejected
                        </span>
                        <select
                          onChange={(e) => handleSalaryAction(row.emp, e.target.value, row)}
                          defaultValue=""
                          className="text-[11px] px-1.5 py-0.5 border border-gray-200 rounded bg-white text-gray-700"
                        >
                          <option value="">Change...</option>
                          <option value="approve">Approve</option>
                          <option value="wait">Wait</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-[10px] text-gray-500">
                          Pay ₹
                          {Math.round(
                            (row.emp.sal * row.daysWorking) / daysInMonth.length
                          ).toLocaleString('en-IN')}
                        </div>
                        <select
                          onChange={(e) => handleSalaryAction(row.emp, e.target.value, row)}
                          defaultValue=""
                          className="text-xs px-2 py-1 border border-gray-300 rounded-md bg-white font-semibold text-navy-950 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="approve">Approve</option>
                          <option value="wait">Wait</option>
                          <option value="reject">Reject</option>
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Change Attendance (H or A -> P) */}
      {fixModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-navy-950">Change Attendance</h3>
              <button
                onClick={() => setFixModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <strong>{fixModal.emp.name}</strong> · {fixModal.date}
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                Current status: <strong>{fixModal.currentLabel}</strong> (
                <span className="font-mono font-bold">{fixModal.currentCode}</span>)
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Change Status to
              </label>
              <select
                id="modal-attendance-status-select"
                defaultValue="P"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="P">Present (P* - Admin override)</option>
                <option value="HD">Half Day (HD)</option>
                <option value="A">Absent (A)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={fixReason}
                onChange={(e) => setFixReason(e.target.value)}
                placeholder="e.g. leave approved, staff forgot to punch in morning"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setFixModal(null)}
                className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>

              {fixModal.isOverridden ? (
                <button
                  type="button"
                  onClick={handleUndoFix}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                >
                  Undo · back to original
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveFix}
                  className="px-4 py-1.5 bg-[#0d1b4c] hover:bg-[#132038] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Save Attendance
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Approve Salary */}
      {approveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-navy-950">
                Salary Process · Approve
              </h3>
              <button
                onClick={() => setApproveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500">Employee ID:</span>
                  <div className="font-bold text-gray-900">{approveModal.emp.code}</div>
                </div>
                <div>
                  <span className="text-gray-500">Employee Name:</span>
                  <div className="font-bold text-gray-900">{approveModal.emp.name}</div>
                </div>
                <div>
                  <span className="text-gray-500">Month:</span>
                  <div className="font-bold text-gray-900">{selectedMonth}</div>
                </div>
                <div>
                  <span className="text-gray-500">Days Working:</span>
                  <div className="font-bold text-gray-900">{approveModal.dw.toFixed(1)} days</div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">A/C Details:</span>
                  <div className="font-medium text-gray-800">
                    {approveModal.emp.bank} · A/C {approveModal.emp.acno}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Monthly Gross Salary:</span>
                  <div className="font-bold text-navy-900">
                    ₹{approveModal.gross.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Salary Amount (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={approveAmt}
                  onChange={(e) => setApproveAmt(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  ₹{approveModal.gross.toLocaleString('en-IN')} ÷ {daysInMonth.length} days ×{' '}
                  {approveModal.dw.toFixed(1)} days = ₹{approveModal.calcAmt.toLocaleString('en-IN')}.
                  You can adjust the amount as needed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Paid by (Payment Mode) *
                </label>
                <select
                  value={approvePm}
                  onChange={(e) => setApprovePm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="e.g. bonus, adjustment"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setApproveModal(null)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  Approve Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
