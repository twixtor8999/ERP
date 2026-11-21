import { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Plus,
  Building2,
  Loader2,
  Calendar,
  Printer,
  Clock,
  RefreshCw,
  FileText,
  DollarSign,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EmployeeItem {
  id: string;
  employee_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  branch_name: string;
  status: string;
  salary_type: string;
  base_salary: number;
  is_active: boolean;
  joining_date: string | null;
}

interface AttendanceItem {
  id: string;
  employee_id: string;
  employee_name: string;
  attendance_date: string;
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | "LEAVE";
  check_in?: string;
  notes?: string;
}

interface SalarySlipItem {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  employee_phone: string;
  branch_name: string;
  month: number;
  year: number;
  working_days: number;
  present_days: number;
  absent_days: number;
  base_salary: number;
  per_day_rate: number;
  earned_salary: number;
  incentives: number;
  deductions: number;
  net_salary: number;
  payment_status: string;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
}

export function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<"roster" | "attendance" | "slips">("roster");
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [branches, setBranches] = useState<{ id: string; branch_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Onboard Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [baseSalary, setBaseSalary] = useState("18000");

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceItem[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Salary Slips State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salarySlips, setSalarySlips] = useState<SalarySlipItem[]>([]);
  const [loadingSlips, setLoadingSlips] = useState(false);
  const [isGeneratingSlips, setIsGeneratingSlips] = useState(false);
  const [viewingSlip, setViewingSlip] = useState<SalarySlipItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, brRes] = await Promise.all([
        apiClient.get<EmployeeItem[]>("/api/v1/admin/employees"),
        apiClient.get<{ id: string; branch_name: string }[]>("/api/v1/admin/branches"),
      ]);
      setEmployees(empRes.data);
      setBranches(brRes.data);
    } catch {
      toast.error("Failed to load employee records");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const parts = (attendanceDate || "").split("-");
      const month = parts[1] ? parseInt(parts[1], 10) : new Date().getMonth() + 1;
      const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
      const res = await apiClient.get<AttendanceItem[]>("/api/v1/admin/attendance", {
        params: {
          month,
          year,
        },
      });
      // Filter for exact date
      setAttendanceRecords(res.data.filter((r) => r.attendance_date === attendanceDate));
    } catch {
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [attendanceDate]);

  const loadSalarySlips = useCallback(async () => {
    try {
      setLoadingSlips(true);
      const res = await apiClient.get<SalarySlipItem[]>("/api/v1/admin/salary-slips", {
        params: {
          month: selectedMonth,
          year: selectedYear,
        },
      });
      setSalarySlips(res.data);
    } catch {
      setSalarySlips([]);
    } finally {
      setLoadingSlips(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "attendance") {
      loadAttendance();
    } else if (activeTab === "slips") {
      loadSalarySlips();
    }
  }, [activeTab, loadAttendance, loadSalarySlips]);

  const handlePunchAttendance = async (empId: string, status: "PRESENT" | "HALF_DAY" | "ABSENT" | "LEAVE") => {
    try {
      await apiClient.post("/api/v1/admin/attendance", {
        employee_id: empId,
        attendance_date: attendanceDate,
        status,
      });
      toast.success("Attendance Marked", { description: `Status set to ${status}` });
      loadAttendance();
    } catch {
      toast.error("Failed to mark attendance");
    }
  };

  const handleGenerateSlips = async () => {
    try {
      setIsGeneratingSlips(true);
      await apiClient.post("/api/v1/admin/salary-slips/generate", {
        month: selectedMonth,
        year: selectedYear,
        working_days: 30,
      });
      toast.success("Salary Slips Generated", {
        description: `Payroll computed for month ${selectedMonth}/${selectedYear}`,
      });
      loadSalarySlips();
    } catch {
      toast.error("Failed to generate salary slips");
    } finally {
      setIsGeneratingSlips(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) {
      toast.error("Validation Error", { description: "First name and phone are required." });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/api/v1/admin/employees", {
        first_name: firstName,
        last_name: lastName || null,
        phone,
        email: email || null,
        branch_id: branchId || null,
        base_salary: parseFloat(baseSalary) || 18000,
      });
      toast.success("Employee Onboarded", { description: `${firstName} added to staff roster.` });
      setIsModalOpen(false);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      loadData();
    } catch {
      toast.error("Failed to onboard employee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Staff Attendance & Salary Slips
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage HR records, daily branch attendance punches, monthly salary slip vouchers, and staff rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "roster" && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 font-bold"
            >
              <Plus className="w-4 h-4" /> Onboard Employee
            </Button>
          )}
          {activeTab === "slips" && (
            <Button
              onClick={handleGenerateSlips}
              disabled={isGeneratingSlips}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 font-bold"
            >
              <DollarSign className="w-4 h-4" />
              {isGeneratingSlips ? "Computing Payroll..." : `Generate Slips (${selectedMonth}/${selectedYear})`}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === "roster") loadData();
              else if (activeTab === "attendance") loadAttendance();
              else loadSalarySlips();
            }}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingAttendance || loadingSlips ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab("roster")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "roster" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Staff Roster ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "attendance" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" /> Daily Attendance Register
        </button>
        <button
          onClick={() => setActiveTab("slips")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "slips" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4" /> Monthly Salary Slips ({salarySlips.length})
        </button>
      </div>

      {/* Tab 1: Staff Roster */}
      {activeTab === "roster" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span>Loading employee roster...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold">No employees on record</p>
              <p className="text-xs text-slate-400 mt-1">Onboard branch cashiers, delivery drivers, and managers above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Assigned Branch</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-right">Base Salary</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-blue-600 font-bold">{e.employee_code}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{e.full_name}</div>
                        {e.email && <div className="text-xs text-slate-400">{e.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-700 flex items-center gap-1.5 mt-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{e.branch_name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">{e.phone}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900">₹{e.base_salary.toFixed(2)}/mo</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">ACTIVE</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Daily Attendance Register */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-xs font-semibold uppercase text-slate-400">Attendance Punch Date</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="block text-base font-bold text-slate-900 border-none p-0 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Click status button to log daily attendance for each employee.
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Current Status</th>
                  <th className="py-3 px-4 text-right">Quick Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {employees.map((emp) => {
                  const record = attendanceRecords.find((r) => r.employee_id === emp.id);
                  const currentStatus = record ? record.status : "NOT_MARKED";
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.full_name}</div>
                        <div className="font-mono text-xs text-slate-400">{emp.employee_code}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{emp.branch_name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{emp.phone}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            currentStatus === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : currentStatus === "HALF_DAY"
                              ? "bg-amber-100 text-amber-800"
                              : currentStatus === "ABSENT"
                              ? "bg-rose-100 text-rose-800"
                              : currentStatus === "LEAVE"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handlePunchAttendance(emp.id, "PRESENT")}
                          className={`px-2.5 py-1 text-xs font-bold rounded ${
                            currentStatus === "PRESENT"
                              ? "bg-emerald-600 text-white shadow"
                              : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          P (Present)
                        </button>
                        <button
                          onClick={() => handlePunchAttendance(emp.id, "HALF_DAY")}
                          className={`px-2.5 py-1 text-xs font-bold rounded ${
                            currentStatus === "HALF_DAY"
                              ? "bg-amber-500 text-white shadow"
                              : "bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                          }`}
                        >
                          HD (Half Day)
                        </button>
                        <button
                          onClick={() => handlePunchAttendance(emp.id, "ABSENT")}
                          className={`px-2.5 py-1 text-xs font-bold rounded ${
                            currentStatus === "ABSENT"
                              ? "bg-rose-600 text-white shadow"
                              : "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                          }`}
                        >
                          A (Absent)
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Salary Slips */}
      {activeTab === "slips" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Payroll Month</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="h-8 rounded border border-slate-300 text-xs font-bold px-2"
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Year</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="h-8 rounded border border-slate-300 text-xs font-bold px-2"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Generated vouchers: <strong className="text-slate-900">{salarySlips.length} Staff Slips</strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3 text-center">Working Days</th>
                  <th className="py-3 px-3 text-center">Present / Absent</th>
                  <th className="py-3 px-4 text-right">Base Salary</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {loadingSlips ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading salary slips...
                    </td>
                  </tr>
                ) : salarySlips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No salary slips generated for this month. Click &quot;Generate Slips&quot; above.
                    </td>
                  </tr>
                ) : (
                  salarySlips.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{s.employee_name}</div>
                        <div className="font-mono text-xs text-slate-400">
                          {s.employee_code} • {s.branch_name}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs">{s.working_days} Days</td>
                      <td className="py-3 px-3 text-center text-xs font-mono">
                        <span className="text-emerald-600 font-bold">{s.present_days}P</span> /{" "}
                        <span className="text-rose-600 font-bold">{s.absent_days}A</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">₹{s.base_salary.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">
                        {s.deductions > 0 ? `-₹${s.deductions.toFixed(2)}` : "₹0.00"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-base">
                        ₹{s.net_salary.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingSlip(s)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5" /> View Slip
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  Onboard Employee / Staff Member
                </h3>
                <p className="text-xs text-slate-300">Add branch cashier, warehouse picker, or delivery driver.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">First Name *</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Last Name</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Patil"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone *</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9845123456"
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@siddeshwar.com"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Branch</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 px-3 text-xs"
                  >
                    <option value="">Central HQ</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Monthly Base Salary (₹)</label>
                  <Input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {submitting ? "Saving..." : "Onboard Employee"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Print Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border flex flex-col max-h-[92vh]">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-400" />
                Salary Slip Voucher
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-bold"
                >
                  Print Salary Slip
                </Button>
                <button
                  onClick={() => setViewingSlip(null)}
                  className="text-slate-400 hover:text-white text-base font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-4 print:p-0">
              {/* Slip Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-black uppercase text-slate-900">SIDDESHWAR ENTERPRISES</h2>
                <p className="text-xs text-slate-500 font-medium">Wholesale & Retail FMCG Distribution • Vijayapura</p>
                <div className="mt-2 text-xs font-bold uppercase tracking-wider bg-slate-100 py-1 rounded inline-block px-4">
                  SALARY SLIP — {viewingSlip.month}/{viewingSlip.year}
                </div>
              </div>

              {/* Employee & Branch Details */}
              <div className="grid grid-cols-2 text-xs gap-y-1 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="text-slate-400">Employee Name:</span>{" "}
                  <strong className="text-slate-900">{viewingSlip.employee_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Employee Code:</span>{" "}
                  <strong className="font-mono text-slate-900">{viewingSlip.employee_code}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Branch Location:</span>{" "}
                  <strong className="text-slate-900">{viewingSlip.branch_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Contact Phone:</span>{" "}
                  <strong className="font-mono text-slate-900">{viewingSlip.employee_phone}</strong>
                </div>
              </div>

              {/* Attendance & Days Summary */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded border">
                  <span className="text-slate-400 block">Working Days</span>
                  <strong className="text-sm font-mono text-slate-900">{viewingSlip.working_days}</strong>
                </div>
                <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="text-emerald-700 block">Present Days</span>
                  <strong className="text-sm font-mono text-emerald-800">{viewingSlip.present_days}</strong>
                </div>
                <div className="bg-rose-50 p-2 rounded border border-rose-200">
                  <span className="text-rose-700 block">Absent Days</span>
                  <strong className="text-sm font-mono text-rose-800">{viewingSlip.absent_days}</strong>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Earnings Description</th>
                    <th className="p-2 border-r border-slate-300 text-right">Amount (₹)</th>
                    <th className="p-2 border-r border-slate-300">Deductions</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr>
                    <td className="p-2 border-r border-slate-200">Basic Monthly Salary</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      ₹{viewingSlip.base_salary.toFixed(2)}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-rose-600">
                      Attendance Deductions ({viewingSlip.absent_days} Days)
                    </td>
                    <td className="p-2 text-right font-mono text-rose-600">
                      ₹{viewingSlip.deductions.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200">Performance Incentives</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      ₹{viewingSlip.incentives.toFixed(2)}
                    </td>
                    <td className="p-2 border-r border-slate-200">Other Deductions</td>
                    <td className="p-2 text-right font-mono">₹0.00</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td colSpan={3} className="p-3 text-right uppercase tracking-wider text-sm">
                      Net Payable Salary:
                    </td>
                    <td className="p-3 text-right font-mono text-base text-emerald-400">
                      ₹{viewingSlip.net_salary.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-2 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
                  <span>Employee Signature</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
                  <span>Authorized Signatory (Siddeshwar)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
