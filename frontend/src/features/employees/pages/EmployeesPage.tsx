import { useState, useEffect } from "react";
import { UserCheck, Plus, Building2, BadgeCheck, Loader2 } from "lucide-react";
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

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [branches, setBranches] = useState<{ id: string; branch_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [baseSalary, setBaseSalary] = useState("18000");

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, brRes] = await Promise.all([
        apiClient.get("/admin/employees"),
        apiClient.get("/admin/branches"),
      ]);
      setEmployees(empRes.data);
      setBranches(brRes.data);
    } catch {
      toast.error("Failed to load employee records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) {
      toast.error("Validation Error", { description: "First name and phone are required." });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/admin/employees", {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Employees & Staff Records
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage HR records, branch counter assignments, monthly payroll structures, and staff codes.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Onboard Employee
        </Button>
      </div>

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
            <p className="text-xs text-slate-400 mt-1">Onboard branch cashiers, picking staff, and managers above.</p>
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
                    <td className="py-3 px-4 font-mono text-xs text-blue-600 font-bold">
                      {e.employee_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{e.full_name}</div>
                      {e.email && <div className="text-xs text-slate-400">{e.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 flex items-center gap-1.5 mt-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{e.branch_name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {e.phone}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      ₹{e.base_salary.toFixed(2)}/mo
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <BadgeCheck className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Onboard New Employee</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">First Name *</label>
                  <Input required placeholder="e.g. Anand" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Last Name</label>
                  <Input placeholder="e.g. Shinde" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mobile Phone *</label>
                <Input required placeholder="e.g. 9822114455" value={phone} onChange={(e) => setPhone(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Assigned Branch</label>
                <select aria-label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white">
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Base Salary (₹ / month)</label>
                <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white" disabled={submitting}>
                  {submitting ? "Onboarding..." : "Confirm Onboarding"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
