import { useState, useEffect } from "react";
import { GitBranch, Plus, MapPin, Phone, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BranchItem {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_type: string;
  phone: string | null;
  email: string | null;
  address: string;
  state: string;
  gstin: string | null;
  is_active: boolean;
}

export function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchType, setBranchType] = useState("STORE");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [state] = useState("Maharashtra");

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/branches");
      setBranches(res.data);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !branchCode || !address) {
      toast.error("Validation Error", { description: "Branch Name, Code, and Address are required." });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/admin/branches", {
        branch_name: branchName,
        branch_code: branchCode,
        branch_type: branchType,
        address,
        phone: phone || null,
        state,
      });
      toast.success("Branch Added", { description: `${branchName} established.` });
      setIsModalOpen(false);
      setBranchName("");
      setBranchCode("");
      setAddress("");
      setPhone("");
      loadBranches();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        // @ts-expect-error axios response
        ? err.response?.data?.detail || "Creation failed"
        : "Failed to establish branch";
      toast.error("Error", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-blue-600" />
            Branch Network Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure enterprise physical retail stores, regional distribution hubs, and main warehouse facilities.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Branch Location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading branch network...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-xl border">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No branches configured</p>
          </div>
        ) : (
          branches.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {b.branch_code}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {b.branch_type}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-2 text-base">{b.branch_name}</h3>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{b.address}, {b.state}</span>
                </div>
                {b.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                )}
                {b.gstin && (
                  <div className="font-mono text-[11px] text-slate-400 mt-1">
                    GSTIN: {b.gstin}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add New Branch</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Branch Name *</label>
                <Input required placeholder="e.g. Siddeshwar Mart Hadapsar" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Branch Code *</label>
                  <Input required placeholder="e.g. BR-02" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Type</label>
                  <select aria-label="Branch Type" value={branchType} onChange={(e) => setBranchType(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white">
                    <option value="STORE">Retail Store</option>
                    <option value="WAREHOUSE">Warehouse Depot</option>
                    <option value="HYBRID">Hybrid Store & Depot</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Address *</label>
                <Input required placeholder="e.g. Shop 4-5, Magarpatta Road, Pune" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Phone</label>
                <Input placeholder="e.g. +91 20 25550002" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white" disabled={submitting}>
                  {submitting ? "Establishing..." : "Establish Branch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
