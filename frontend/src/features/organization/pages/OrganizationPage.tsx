import { useState, useEffect } from "react";
import { Building2, Save, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function OrganizationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");

  const loadOrg = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/organization");
      const d = res.data;
      setName(d.name || "");
      setLegalName(d.legal_name || "");
      setGstin(d.gstin || "");
      setPan(d.pan || "");
      setPhone(d.phone || "");
      setEmail(d.email || "");
      setAddress(d.address || "");
      setState(d.state || "Maharashtra");
      setCountry(d.country || "India");
      setCurrency(d.base_currency || "INR");
    } catch {
      toast.error("Failed to load organization settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrg();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch("/admin/organization", {
        name,
        legal_name: legalName,
        gstin,
        pan,
        phone,
        email,
        address,
      });
      toast.success("Organization Settings Saved", { description: "Corporate master profile updated." });
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Corporate Organization Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure legal entity identifiers, GST compliance details, and registered corporate headquarters.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border flex flex-col items-center">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span>Loading organization profile...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Display Trade Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Legal Registered Entity Name</label>
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">GSTIN Tax Registration</label>
              <Input value={gstin} onChange={(e) => setGstin(e.target.value)} className="font-mono" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Corporate PAN Number</label>
              <Input value={pan} onChange={(e) => setPan(e.target.value)} className="font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Official Contact Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Corporate Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Registered Office Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">State</label>
              <Input value={state} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Country</label>
              <Input value={country} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Base Currency</label>
              <Input value={currency} disabled className="bg-slate-50 text-slate-500 font-mono" />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Corporate Profile"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
