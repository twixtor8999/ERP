import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scissors, Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getStoredSkus } from "../data/mockInventory";

export function WholesaleStockSplitView() {
  const navigate = useNavigate();
  const skus = getStoredSkus();

  const [splitBulkSku, setSplitBulkSku] = useState(skus[0]?.code || "SKU-SOO-30");
  const [splitBulkQty, setSplitBulkQty] = useState("1");
  const [splitRetailPacketSize, setSplitRetailPacketSize] = useState("1");
  const [splitWastageKg, setSplitWastageKg] = useState("0.25");
  const [splitTargetSku, setSplitTargetSku] = useState("SKU-SOO-10");
  const [isSplitting, setIsSplitting] = useState(false);

  const totalInputWeight = Number(splitBulkQty) * 30; // e.g. 30kg sack
  const netYieldWeight = Math.max(0, totalInputWeight - Number(splitWastageKg || 0));
  const packetsCreated = Math.floor(netYieldWeight / Number(splitRetailPacketSize || 1));

  const handleExecuteSplit = () => {
    if (!splitBulkSku || !splitTargetSku) {
      toast.error("Please specify both bulk SKU and target retail SKU");
      return;
    }
    setIsSplitting(true);
    setTimeout(() => {
      setIsSplitting(false);
      toast.success(
        `Successfully converted ${splitBulkQty} bag(s) of ${splitBulkSku} into ${packetsCreated} packets of ${splitTargetSku} (Wastage: ${splitWastageKg}kg recorded)`
      );
    }, 600);
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <span className="text-xs text-slate-500 font-medium">Repackaging & Bulk Conversion</span>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Stock Split (Repackaging)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Break down bulk sacks (e.g. 30kg / 50kg bags) into retail consumer packets (1kg / 2kg pouches).
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Source Bulk Sacks */}
          <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-blue-700" />
              Source Bulk Sacks (Stock Deduction)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Source Bulk SKU *
                </label>
                <select
                  value={splitBulkSku}
                  onChange={(e) => setSplitBulkSku(e.target.value)}
                  className="w-full h-9 px-2.5 border border-slate-300 rounded text-xs bg-white font-medium"
                >
                  {skus.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.name} ({s.code}) — {s.closing} bags in stock
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Number of Sacks to Open *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={splitBulkQty}
                    onChange={(e) => setSplitBulkQty(e.target.value)}
                    className="w-full h-9 px-2.5 border border-slate-300 rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Weight per Sack (kg)
                  </label>
                  <input
                    type="number"
                    value="30"
                    disabled
                    className="w-full h-9 px-2.5 border border-slate-300 rounded text-xs font-mono bg-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Target Retail Packets */}
          <div className="space-y-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-700" />
              Target Retail Packets (Stock Addition)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Retail SKU *
                </label>
                <select
                  value={splitTargetSku}
                  onChange={(e) => setSplitTargetSku(e.target.value)}
                  className="w-full h-9 px-2.5 border border-slate-300 rounded text-xs bg-white font-medium"
                >
                  {skus.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Packet Size (kg)
                  </label>
                  <select
                    value={splitRetailPacketSize}
                    onChange={(e) => setSplitRetailPacketSize(e.target.value)}
                    className="w-full h-9 px-2.5 border border-slate-300 rounded text-xs bg-white font-medium"
                  >
                    <option value="1">1 kg Consumer Packet</option>
                    <option value="2">2 kg Value Pack</option>
                    <option value="5">5 kg Family Bag</option>
                    <option value="0.5">500g Trial Pouch</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Recorded Loss / Dust (kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={splitWastageKg}
                    onChange={(e) => setSplitWastageKg(e.target.value)}
                    className="w-full h-9 px-2.5 border border-slate-300 rounded text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Yield Summary Box */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Computed Repackaging Yield
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Total input weight: {totalInputWeight} kg | Net yield: {netYieldWeight.toFixed(2)} kg
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-amber-800 font-semibold block">Retail Packets Created:</span>
              <span className="text-2xl font-black font-mono text-emerald-700">
                {packetsCreated} Packets
              </span>
            </div>
            <button
              onClick={handleExecuteSplit}
              disabled={isSplitting}
              className="px-5 py-2.5 bg-[#0f2d59] hover:bg-[#1a3d6d] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSplitting ? "Processing Split..." : "Confirm & Execute Repackaging"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
