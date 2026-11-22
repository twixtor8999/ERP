import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Printer,
  FileText,
} from 'lucide-react';
import {
  Employee,
  SalaryRecord,
  AttendanceRecord,
  getStoredEmployees,
  getStoredAttendance,
  getStoredSalaries,
  getMonthDays,
  isSunday,
  HOLIDAYS_2026,
  numberToIndianWords,
} from '../data/mockEmployees';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
  initialEmployeeId?: number;
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

export const WholesaleSalarySlipView: React.FC<Props> = ({ onBack, initialEmployeeId }) => {
  const [employees] = useState<Employee[]>(() => getStoredEmployees());
  const [attendance] = useState<AttendanceRecord[]>(() => getStoredAttendance());
  const [salaries] = useState<SalaryRecord[]>(() => getStoredSalaries());

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedEmpId, setSelectedEmpId] = useState<number>(() => {
    if (initialEmployeeId) return initialEmployeeId;
    const list = getStoredEmployees();
    return list.length > 0 ? (list[0]?.id ?? 0) : 0;
  });

  // Date range inputs from screenshot
  const [fromDate, setFromDate] = useState('2026-11-22');
  const [toDate, setToDate] = useState('2026-11-22');

  const selectedEmp = useMemo(
    () => employees.find((e) => e.id === selectedEmpId) || employees[0],
    [employees, selectedEmpId]
  );

  const salaryRecord = useMemo(() => {
    if (!selectedEmp) return null;
    return salaries.find(
      (s) => s.emp === selectedEmp.id && s.mon === selectedMonth && s.st === 'approved'
    );
  }, [salaries, selectedEmp, selectedMonth]);

  // Attendance metrics for the selected month
  const slipStats = useMemo(() => {
    if (!selectedEmp) return null;
    const days = getMonthDays(selectedMonth);
    let P = 0;
    let HD = 0;
    let A = 0;
    let totalMinutes = 0;

    days.forEach((d) => {
      if (d > '2026-11-22') return;
      const isSun = isSunday(d);
      const isHol = !!HOLIDAYS_2026[d];
      const rec = attendance.find((a) => a.emp === selectedEmp.id && a.date === d);

      if (isSun || isHol) {
        // counted in working days
        return;
      }

      if (rec && rec.ov === 'P') {
        P++;
        totalMinutes += 480;
      } else if (rec && rec.inT) {
        if (rec.outT) {
          const diff = getMinutesDiff(rec.inT, rec.outT);
          if (diff >= 480) {
            P++;
          } else {
            HD++;
          }
          totalMinutes += diff;
        } else {
          HD++;
        }
      } else {
        A++;
      }
    });

    const thH = Math.floor(totalMinutes / 60);
    const thM = totalMinutes % 60;
    const totalHoursStr = `${thH}h ${String(thM).padStart(2, '0')}m`;

    const sundaysCount = days.filter((d) => isSunday(d) && d <= '2026-11-22').length;
    const holidaysCount = days.filter((d) => HOLIDAYS_2026[d] && d <= '2026-11-22').length;
    const dw = P + HD * 0.5 + sundaysCount + holidaysCount;

    const gross = selectedEmp.sal;
    const dim = days.length;
    const earned = Math.round((gross * dw) / dim);
    const net = salaryRecord?.amt || earned;
    const adj = net - earned;

    return {
      dim,
      P,
      HD,
      A,
      dw,
      totalHoursStr,
      gross,
      earned,
      adj,
      net,
    };
  }, [selectedEmp, selectedMonth, attendance, salaryRecord]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">Salary Slip</h1>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-none p-0 text-xs font-semibold focus:ring-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-none p-0 text-xs font-semibold focus:ring-0 bg-transparent"
            />
          </div>
          <button
            onClick={() => toast.success('Filter submitted')}
            className="px-3 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Dropdown Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-navy-950">Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-navy-950">Employee:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-navy-950"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {salaryRecord && (
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>🖨 Print / Save PDF</span>
          </button>
        )}
      </div>

      {/* Salary Slip Content or Empty State */}
      {!salaryRecord || !selectedEmp ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-navy-950">No Data Available</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Salary for {selectedMonth} is not processed yet.
          </p>
          <p className="text-xs text-gray-400">
            The salary slip is ready after the Owner / Admin approves the salary in Attendance List → Salary Process.
          </p>
        </div>
      ) : (
        /* Formatted Realistic Wholesale Salary Slip matching reference app nxSlipHtml */
        <div className="bg-white rounded-xl border-2 border-navy-950 shadow-lg max-w-3xl mx-auto overflow-hidden print:m-0 print:border-none print:shadow-none">
          {/* Slip Header Banner */}
          <div className="bg-[#0d1b4c] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black tracking-wide text-white">
                SIDDESHWAR ENTERPRISES
              </div>
              <div className="text-xs text-blue-200 mt-0.5">
                Wholesale Distributors · APMC Yard, Vijayapura - 586101
              </div>
              <div className="text-xs text-blue-200 font-mono">
                GSTIN: 29ABCDE1234F1Z5
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-lg font-extrabold tracking-widest text-[#f5b400]">
                SALARY SLIP
              </div>
              <div className="text-xs font-medium text-blue-100 mt-0.5">
                Month: {selectedMonth}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Employee Particulars Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 px-3 bg-gray-50 font-medium text-gray-600 w-1/4">
                      Employee ID
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-navy-950 w-1/4">
                      {selectedEmp.code}
                    </td>
                    <td className="py-2 px-3 bg-gray-50 font-medium text-gray-600 w-1/4">
                      Employee Name
                    </td>
                    <td className="py-2 px-3 font-bold text-navy-950 w-1/4">
                      {selectedEmp.name}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 bg-gray-50 font-medium text-gray-600">
                      Designation
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-800">
                      {selectedEmp.des}
                    </td>
                    <td className="py-2 px-3 bg-gray-50 font-medium text-gray-600">
                      Joining Date
                    </td>
                    <td className="py-2 px-3 font-mono text-gray-800">
                      {selectedEmp.jd}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 bg-gray-50 font-medium text-gray-600">
                      Mobile No
                    </td>
                    <td className="py-2 px-3 font-mono text-gray-800">
                      {selectedEmp.ph}
                    </td>
                    <td className="py-2 px-3 bg-gray-50 font-medium text-gray-600">
                      Bank A/C Details
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-800">
                      {salaryRecord.acct || `${selectedEmp.bank} · ${selectedEmp.acno}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Attendance Mini Cards Grid */}
            {slipStats && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-gray-500 text-[10px]">Days in month</div>
                  <div className="text-base font-bold text-navy-950 font-mono">
                    {slipStats.dim}
                  </div>
                </div>
                <div className="p-2 border border-emerald-200 rounded-lg bg-emerald-50/50">
                  <div className="text-emerald-700 text-[10px]">Present</div>
                  <div className="text-base font-bold text-emerald-800 font-mono">
                    {slipStats.P}
                  </div>
                </div>
                <div className="p-2 border border-amber-200 rounded-lg bg-amber-50/50">
                  <div className="text-amber-700 text-[10px]">Half Day</div>
                  <div className="text-base font-bold text-amber-800 font-mono">
                    {slipStats.HD}
                  </div>
                </div>
                <div className="p-2 border border-red-200 rounded-lg bg-red-50/50">
                  <div className="text-red-700 text-[10px]">Absent</div>
                  <div className="text-base font-bold text-red-800 font-mono">
                    {slipStats.A}
                  </div>
                </div>
                <div className="p-2 border border-blue-200 rounded-lg bg-blue-50/50">
                  <div className="text-blue-700 text-[10px]">Days working</div>
                  <div className="text-base font-bold text-navy-950 font-mono">
                    {slipStats.dw.toFixed(1)}
                  </div>
                </div>
                <div className="p-2 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-gray-500 text-[10px]">Work hours</div>
                  <div className="text-base font-bold text-navy-950 font-mono">
                    {slipStats.totalHoursStr}
                  </div>
                </div>
              </div>
            )}

            {/* Earnings Breakdown Table */}
            {slipStats && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-blue-50/70 border-b border-gray-200 text-gray-700">
                      <th className="py-2 px-3 text-left font-bold">Earnings Description</th>
                      <th className="py-2 px-3 text-right font-bold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-2 px-3 text-gray-700">
                        Monthly salary (full month base)
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-gray-800">
                        ₹{slipStats.gross.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-gray-700">
                        Salary for {slipStats.dw.toFixed(1)} working days (₹
                        {slipStats.gross.toLocaleString('en-IN')} ÷ {slipStats.dim} ×{' '}
                        {slipStats.dw.toFixed(1)})
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-gray-800">
                        ₹{slipStats.earned.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {slipStats.adj !== 0 && (
                      <tr>
                        <td className="py-2 px-3 text-gray-700">
                          {slipStats.adj > 0 ? 'Incentive / Bonus' : 'Deduction'}
                          {salaryRecord.note ? ` · ${salaryRecord.note}` : ''}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-gray-800">
                          {slipStats.adj > 0 ? '+ ' : '- '}₹
                          {Math.abs(slipStats.adj).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-[#0d1b4c] text-white">
                      <td className="py-3 px-3 font-extrabold text-sm tracking-wide">
                        NET PAY
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-base text-[#f5b400]">
                        ₹{slipStats.net.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* In Words & Payment Meta */}
            {slipStats && (
              <div className="space-y-2 text-xs text-gray-600 border-b pb-4">
                <div>
                  <strong className="text-navy-950">In words:</strong> Rupees{' '}
                  <span className="font-semibold text-gray-800">
                    {numberToIndianWords(slipStats.net)}
                  </span>{' '}
                  Only
                </div>
                <div className="text-[11px] text-gray-500">
                  Paid by: <strong className="text-gray-800">{salaryRecord.pm}</strong> ·
                  Approved by: <strong className="text-gray-800">{salaryRecord.by}</strong> on{' '}
                  <strong className="text-gray-800">{salaryRecord.date}</strong>
                  {salaryRecord.note && ` · Note: ${salaryRecord.note}`}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="flex items-center justify-between pt-6 text-xs text-gray-600">
              <div className="text-center w-44">
                <div className="border-t border-gray-400 pt-1.5 font-medium">
                  Employee signature
                </div>
              </div>
              <div className="text-center w-44">
                <div className="border-t border-gray-400 pt-1.5 font-medium">
                  Authorised signature
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-gray-400 pt-2">
              This is a computer generated salary slip.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
