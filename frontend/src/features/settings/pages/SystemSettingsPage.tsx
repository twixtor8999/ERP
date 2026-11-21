import { useState } from "react";
import { Sliders, Save, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function SystemSettingsPage() {
  const [saving, setSaving] = useState(false);

  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [currency, setCurrency] = useState("INR (₹)");
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Preferences Saved", { description: "Global ERP configuration updated." });
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-blue-600" />
          Global System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Platform localization, taxation display rules, automated database snapshots, and telemetry options.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 text-sm">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-2">
            <Globe className="w-4 h-4 text-slate-500" />
            Regional & Localization Standards
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">System Timezone</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Display Currency Symbol</label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-2">
            <Shield className="w-4 h-4 text-slate-500" />
            Operational & POS Defaults
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={taxInclusive}
                onChange={(e) => setTaxInclusive(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <div className="font-semibold text-slate-800 text-xs">Standard GST-Inclusive Pricing</div>
                <div className="text-slate-400 text-[11px]">Display final prices inclusive of CGST/SGST on POS counter screens.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <div className="font-semibold text-slate-800 text-xs">Automated Cloud Database Snapshots</div>
                <div className="text-slate-400 text-[11px]">Continuous daily WAL replication via Supabase managed storage.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? "Saving Preferences..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
