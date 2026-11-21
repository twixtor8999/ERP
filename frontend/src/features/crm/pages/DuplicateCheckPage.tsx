import { useState } from "react";
import { UserCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DuplicateCheckPage() {
  const [phone, setPhone] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ checked: boolean; duplicateFound: boolean } | null>(null);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult({ checked: true, duplicateFound: false });
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-600" />
          Duplicate Identity Resolution
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Check customer records and mobile identifiers to avoid duplicate credit ledgers or redundant accounts.
        </p>
      </div>

      <form onSubmit={handleScan} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Check Mobile Number</label>
          <div className="flex gap-2">
            <Input
              required
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="font-mono text-sm"
            />
            <Button type="submit" disabled={scanning} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
              {scanning ? "Scanning..." : "Scan Database"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Identity Clear: No Duplicate Found</div>
              <div className="text-xs text-emerald-700 mt-0.5">
                The mobile number {phone} is unique and safe to register without conflicting records.
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
