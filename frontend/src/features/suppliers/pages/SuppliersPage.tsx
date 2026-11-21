import { useState, useEffect } from "react";
import { Plus, Building, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SupplierItem {
  id: string;
  supplier_code: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string | null;
  gstin: string | null;
  current_balance: number;
  is_active: boolean;
}

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/suppliers");
      setSuppliers(res.data);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !phone) {
      toast.error("Validation Error", { description: "Company, contact person, and phone are required." });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/admin/suppliers", {
        company_name: companyName,
        contact_person: contactPerson,
        phone,
        email: email || null,
        gstin: gstin || null,
      });
      toast.success("Supplier Onboarded", { description: `${companyName} added to directory.` });
      setIsModalOpen(false);
      setCompanyName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setGstin("");
      loadData();
    } catch {
      toast.error("Failed to onboard supplier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Suppliers & Vendor Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage wholesale grain mills, FMCG distributors, payment terms, and vendor GST identifiers.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Onboard Supplier
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading suppliers...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No suppliers onboarded</p>
            <p className="text-xs text-slate-400 mt-1">Register wholesale grain vendors and distributors above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4 font-mono text-xs">GSTIN</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-blue-600 font-bold">
                      {s.supplier_code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {s.company_name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {s.contact_person}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {s.phone}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {s.gstin || "Unregistered"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
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
              <h2 className="text-lg font-bold text-slate-900">Onboard Supplier Partner</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Company / Firm Name *</label>
                <Input required placeholder="e.g. Kolhapur Agro Millers Ltd" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Contact Person Name *</label>
                <Input required placeholder="e.g. Suresh Shinde" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Phone *</label>
                  <Input required placeholder="9822998877" value={phone} onChange={(e) => setPhone(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">GSTIN</label>
                  <Input placeholder="27AAACS8899B1Z2" value={gstin} onChange={(e) => setGstin(e.target.value)} className="font-mono" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <Input type="email" placeholder="vendor@agro.in" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white" disabled={submitting}>
                  {submitting ? "Onboarding..." : "Confirm Supplier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
