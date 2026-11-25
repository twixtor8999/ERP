import React, { useState, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Clock,
  Download,
  CheckCircle2,
  FileText,
  User,
} from 'lucide-react';
import {
  Employee,
  AttendanceRecord,
  SalaryRecord,
  getStoredEmployees,
  getStoredAttendance,
  saveStoredAttendance,
  getStoredSalaries,
  getMonthDays,
  isSunday,
  HOLIDAYS_2026,
} from '../data/mockEmployees';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
  onOpenSalarySlip?: (employeeId: number) => void;
}

const HOLD_DURATION_MS = 5000;

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

export const WholesaleAttendanceView: React.FC<Props> = ({ onBack, onOpenSalarySlip }) => {
  const [employees] = useState<Employee[]>(() => getStoredEmployees());
  const [selectedEmpId, setSelectedEmpId] = useState<number>(() => {
    const list = getStoredEmployees();
    return list.length > 0 ? (list[0]?.id ?? 0) : 0;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getStoredAttendance());
  const [salaries] = useState<SalaryRecord[]>(() => getStoredSalaries());
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  // Today string dynamically defaulting to current real ISO date
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  })();

  // Long-press state
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [isHolding, setIsHolding] = useState(false);
  const holdStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const selectedEmp = useMemo(
    () => employees.find((e) => e.id === selectedEmpId) || employees[0],
    [employees, selectedEmpId]
  );

  // Today's attendance record for selected employee
  const todayRecord = useMemo(() => {
    if (!selectedEmp) return null;
    return attendance.find((a) => a.emp === selectedEmp.id && a.date === todayStr);
  }, [attendance, selectedEmp, todayStr]);

  // Salary record for the selected employee & month
  const currentSalary = useMemo(() => {
    if (!selectedEmp) return null;
    return salaries.find((s) => s.emp === selectedEmp.id && s.mon === selectedMonth);
  }, [salaries, selectedEmp, selectedMonth]);

  // Determine current action mode ('in' | 'out' | 'done')
  const actionKind: 'in' | 'out' | 'done' = useMemo(() => {
    if (!todayRecord || !todayRecord.inT) return 'in';
    if (!todayRecord.outT) return 'out';
    return 'done';
  }, [todayRecord]);

  // Today's work hours
  const todayWorkHours = useMemo(() => {
    if (!todayRecord || !todayRecord.inT) return '—';
    if (!todayRecord.outT) return 'Running...';
    const totalMinutes = getMinutesDiff(todayRecord.inT, todayRecord.outT);
    if (totalMinutes <= 0) return '0h 00m';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${String(mins).padStart(2, '0')}m`;
  }, [todayRecord]);

  // Today's status display
  const todayStatus = useMemo(() => {
    if (isSunday(todayStr)) return 'Week off';
    if (HOLIDAYS_2026[todayStr]) return `Holiday (${HOLIDAYS_2026[todayStr]})`;
    if (!todayRecord || !todayRecord.inT) return 'Not marked';
    if (!todayRecord.outT) return 'Checked in';
    // Calculate if Present or Half day
    const hrs = getMinutesDiff(todayRecord.inT, todayRecord.outT) / 60;
    return hrs >= 8 ? 'Present' : 'Half Day';
  }, [todayRecord, todayStr]);

  // Month attendance calculations
  const monthStats = useMemo(() => {
    if (!selectedEmp) return { present: 0, halfDay: 0, absent: 0, totalHours: '0h 00m', days: [] };
    const days = getMonthDays(selectedMonth);
    let present = 0;
    let halfDay = 0;
    let absent = 0;
    let totalMinutes = 0;

    const dayRows = days.map((d) => {
      const isPast = d <= todayStr;
      const rec = attendance.find((a) => a.emp === selectedEmp.id && a.date === d);
      const isSun = isSunday(d);
      const hol = HOLIDAYS_2026[d];

      let code = '';
      let label = '';
      let hrs = 0;

      if (isSun) {
        code = 'W/O';
        label = 'Week off';
      } else if (hol) {
        code = 'H';
        label = `Holiday: ${hol}`;
      } else if (rec && rec.ov === 'P') {
        code = 'P*';
        label = 'Present (Admin Override)';
        present++;
        hrs = 8;
        totalMinutes += 480;
      } else if (rec && rec.inT) {
        if (rec.outT) {
          const diff = getMinutesDiff(rec.inT, rec.outT);
          hrs = diff / 60;
          totalMinutes += Math.max(0, diff);
          // Fair attendance: Checking in and working marks employee Present
          code = 'P';
          label = `Present (${Math.floor(diff / 60)}h ${diff % 60}m)`;
          present++;
        } else if (d === todayStr) {
          code = 'In';
          label = 'Checked in';
          present++;
        } else {
          code = 'P';
          label = 'Present';
          present++;
        }
      } else if (isPast) {
        code = 'A';
        label = 'Absent';
        absent++;
      } else {
        code = '—';
        label = 'Upcoming';
      }

      return { date: d, code, label, hours: hrs, rec };
    });

    const thH = Math.floor(totalMinutes / 60);
    const thM = totalMinutes % 60;
    const formattedTH = `${thH}h ${String(thM).padStart(2, '0')}m`;

    return { present, halfDay, absent, totalHours: formattedTH, days: dayRows };
  }, [selectedEmp, selectedMonth, attendance, todayStr]);

  // Long press animation loop
  const startHolding = () => {
    if (actionKind === 'done') return;
    setIsHolding(true);
    holdStartTimeRef.current = Date.now();

    const tick = () => {
      if (!holdStartTimeRef.current) return;
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        // Complete hold action!
        completeAttendanceAction();
        cancelHolding();
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const cancelHolding = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    holdStartTimeRef.current = null;
    setIsHolding(false);
    setHoldProgress(0);
  };

  const completeAttendanceAction = () => {
    if (!selectedEmp) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    if (actionKind === 'in') {
      const newRec: AttendanceRecord = {
        id: Date.now(),
        emp: selectedEmp.id,
        date: todayStr,
        inT: currentTime,
      };
      const updated = [...attendance.filter((a) => !(a.emp === selectedEmp.id && a.date === todayStr)), newRec];
      setAttendance(updated);
      saveStoredAttendance(updated);
      toast.success(`Check-in recorded at ${currentTime} for ${selectedEmp.name}`);
    } else if (actionKind === 'out') {
      const updated = attendance.map((a) =>
        a.emp === selectedEmp.id && a.date === todayStr
          ? { ...a, outT: currentTime }
          : a
      );
      setAttendance(updated);
      saveStoredAttendance(updated);
      toast.success(`Check-out recorded at ${currentTime} for ${selectedEmp.name}`);
    }
  };

  const handleExportMonth = () => {
    if (!selectedEmp) return;
    const rows = [
      ['Date', 'Day', 'Status', 'Check-in', 'Check-out', 'Hours'],
      ...monthStats.days.map((d) => [
        d.date,
        isSunday(d.date) ? 'Sunday' : 'Weekday',
        d.label,
        d.rec?.inT || '—',
        d.rec?.outT || '—',
        d.hours ? d.hours.toFixed(1) + ' hrs' : '—',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Attendance_${selectedEmp.code}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Month attendance exported');
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
            <h1 className="text-2xl font-bold tracking-tight text-navy-950">Attendance</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Press and hold Check in / Check out for 5 seconds to mark attendance, only for today.
              Present = 8 hours or more · Half Day = less than 8 hours · Absent = not marked.
            </p>
          </div>
        </div>
      </div>

      {/* Employee Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-bold text-navy-950 whitespace-nowrap">
            Employee:
          </label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(Number(e.target.value))}
            className="w-full sm:w-72 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-navy-900"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.code}) · {e.des}
              </option>
            ))}
          </select>
        </div>

        {selectedEmp && (
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>
              Role: <strong className="text-gray-900">{selectedEmp.role}</strong>
            </span>
            <span>
              Salary: <strong className="text-gray-900">₹{selectedEmp.sal.toLocaleString('en-IN')}</strong>
            </span>
            <span>
              Contact: <strong className="text-gray-900 font-mono">{selectedEmp.ph}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Card 1: Today Attendance */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Today · 22-11-2026</span>
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {todayStatus}
          </span>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Check in
            </div>
            <div className="text-xl font-extrabold text-navy-950 font-mono">
              {todayRecord?.inT || '—'}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Check out
            </div>
            <div className="text-xl font-extrabold text-navy-950 font-mono">
              {todayRecord?.outT || '—'}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Work hours
            </div>
            <div className="text-xl font-extrabold text-navy-950 font-mono">
              {todayWorkHours}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Status
            </div>
            <div
              className={`text-xl font-extrabold ${
                todayStatus === 'Present'
                  ? 'text-emerald-600'
                  : todayStatus === 'Half Day'
                  ? 'text-amber-600'
                  : todayStatus === 'Week off'
                  ? 'text-blue-600'
                  : 'text-gray-700'
              }`}
            >
              {todayStatus}
            </div>
          </div>
        </div>

        {/* Hold 5 sec action button */}
        <div className="pt-2">
          {actionKind === 'done' ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Attendance for today is complete.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <button
                type="button"
                onPointerDown={startHolding}
                onPointerUp={cancelHolding}
                onPointerLeave={cancelHolding}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative overflow-hidden w-full sm:w-80 py-4 px-6 rounded-xl font-bold text-base select-none shadow-md transition-all active:scale-95 touch-none ${
                  actionKind === 'in'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {/* Visual Fill Progress Overlay */}
                <div
                  className="absolute inset-y-0 left-0 bg-white/35 transition-all pointer-events-none"
                  style={{ width: `${holdProgress}%` }}
                />

                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>{actionKind === 'in' ? '🟢' : '🔴'}</span>
                  <span>
                    {isHolding
                      ? `Holding... ${Math.round(holdProgress)}%`
                      : actionKind === 'in'
                      ? 'Hold 5 sec to Check in'
                      : 'Hold 5 sec to Check out'}
                  </span>
                </span>
              </button>

              <p className="text-xs text-gray-500">
                Keep your finger on the button until it fills (5 seconds).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Month Attendance & Salary Slip Status */}
      {selectedEmp && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>{selectedEmp.name} · Month Attendance</span>
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <button
                onClick={handleExportMonth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Salary Status Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              currentSalary && currentSalary.st === 'approved'
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div>
              <div className="font-bold text-sm text-navy-950">
                Salary · November 2026
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {currentSalary && currentSalary.st === 'approved'
                  ? `Approved · ₹${currentSalary.amt?.toLocaleString('en-IN')} · Paid via ${currentSalary.pm} on ${currentSalary.date}`
                  : 'Not approved yet. The salary slip is ready after the Owner / Admin approves the salary in Attendance List → Salary Process.'}
              </p>
            </div>

            {currentSalary && currentSalary.st === 'approved' && onOpenSalarySlip && (
              <button
                onClick={() => onOpenSalarySlip(selectedEmp.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>🧾 Salary Slip</span>
              </button>
            )}
          </div>

          {/* 4 Month KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                Present
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {monthStats.present}
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                Half Day
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {monthStats.halfDay}
              </div>
            </div>

            <div className="p-4 bg-red-50/50 rounded-xl border border-red-200">
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
                Absent
              </div>
              <div className="text-2xl font-black text-red-700 font-mono">
                {monthStats.absent}
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                Total work hours
              </div>
              <div className="text-2xl font-black text-navy-900 font-mono">
                {monthStats.totalHours}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
