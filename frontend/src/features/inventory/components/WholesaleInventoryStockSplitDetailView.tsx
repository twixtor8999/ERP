import React from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  Calendar,
  Layers,
  Building,
  User,
  Scale,
  FileText,
} from "lucide-react";
import { StockSplitRecord } from "../data/mockStockSplit";
import { toast } from "sonner";

interface Props {
  split: StockSplitRecord;
  onBack: () => void;
}

export const WholesaleInventoryStockSplitDetailView: React.FC<Props> = ({
  split,
  onBack,
}) => {
  const sourceTotalValue = split.out * split.grn;
  const targetTotalValue = split.conv.reduce((sum, item) => sum + item.q * item.p, 0);
  const shrinkageTotalValue = split.shr ? split.shr.q * split.shr.p : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csvRows = [
      ["STOCK SPLIT VOUCHER DETAILS", ""],
      ["Voucher ID", split.id],
      ["Date & Time", split.at],
      ["DC Name", split.dc],
      ["Created By", `${split.by} (${split.role || "Operator"})`],
      ["", ""],
      ["SOURCE BULK SKU (SPLIT OUT)", ""],
      ["SKU ID", split.s],
      ["Item Name", split.name],
      ["Quantity Deducted", split.out],
      ["GRN Price", `₹${split.grn}`],
      ["Total Value", `₹${sourceTotalValue}`],
      ["", ""],
      ["TARGET RETAIL SKUS (SPLIT IN)", ""],
      ...split.conv.map((c) => [
        "Converted SKU",
        c.s,
        c.name,
        `+${c.q}`,
        `₹${c.p}`,
        `₹${(c.q * c.p).toFixed(2)}`,
      ]),
    ];

    if (split.shr) {
      csvRows.push([
        "Shrinkage / Loss",
        split.shr.s,
        split.shr.name,
        `-${split.shr.q}`,
        `₹${split.shr.p}`,
        `₹${shrinkageTotalValue}`,
      ]);
    }

    csvRows.push(["Difference in Stock (kg)", split.diffKg != null ? `${split.diffKg} kg` : "0 kg"]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stock_Split_${split.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Stock split voucher exported to CSV");
  };

  return (
    <div className="space-y-5 text-slate-800 font-sans pb-12 animate-in fade-in duration-150">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f2d59] text-white hover:bg-[#1a3d6d] text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stock Split</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Voucher</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb & Main Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              Inventory / Stock Split / Voucher Details
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <span>Stock Split Voucher · {split.id}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Processed & Reconciled
              </span>
            </h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Voucher ID</span>
            <span className="text-sm font-mono font-bold text-slate-800">{split.id}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" /> Date & Time
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {new Date(split.at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-500" /> Distribution Center
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block truncate">
              {split.dc}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <User className="w-3 h-3 text-slate-500" /> Operator / Created By
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {split.by} {split.role && `(${split.role})`}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <Scale className="w-3 h-3 text-slate-500" /> Stock Difference
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {split.diffKg != null ? `${split.diffKg} kg` : "0 kg"}
            </span>
          </div>
        </div>
      </div>

      {/* Conversion Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Bulk Card */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-2xs overflow-hidden">
          <div className="bg-rose-50 px-4 py-2.5 border-b border-rose-100 flex items-center justify-between text-xs font-bold text-rose-800">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-600" />
              SOURCE BULK SKU (DEDUCTED FROM STOCK)
            </span>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-mono font-bold">
              -{split.out} Bulk Unit(s)
            </span>
          </div>
          <div className="p-4 space-y-3 text-xs">
            <div>
              <div className="text-sm font-black text-slate-900">{split.name}</div>
              <div className="text-2xs font-mono text-slate-500 mt-0.5">SKU No: {split.s}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 text-2xs block uppercase">Bulk GRN Price</span>
                <span className="font-bold text-slate-800">
                  ₹{split.grn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-2xs block uppercase">Total Deducted Value</span>
                <span className="font-black text-rose-700">
                  ₹{sourceTotalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Retail Card */}
        <div className="bg-white rounded-xl border border-emerald-200 shadow-2xs overflow-hidden">
          <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              TARGET RETAIL SKUS (ADDED TO STOCK)
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold">
              +{split.conv.reduce((sum, item) => sum + item.q, 0)} Retail Unit(s)
            </span>
          </div>
          <div className="p-4 space-y-3 text-xs divide-y divide-slate-100">
            {split.conv.map((c, i) => (
              <div key={i} className={i > 0 ? "pt-2" : ""}>
                <div className="text-sm font-black text-slate-900">{c.name}</div>
                <div className="text-2xs font-mono text-slate-500 mt-0.5">SKU No: {c.s}</div>
                <div className="grid grid-cols-2 gap-2 pt-1.5 mt-1">
                  <div>
                    <span className="text-slate-400 text-2xs block uppercase">Converted Qty</span>
                    <span className="font-bold text-emerald-700">+{c.q} units</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-2xs block uppercase">Derived Unit Cost</span>
                    <span className="font-bold text-slate-800">
                      ₹{c.p.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Total Converted Value</span>
              <span className="font-black text-emerald-800">
                ₹{targetTotalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Item Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-[#0f2d59] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">Full Split Line Item Reconciliation</h3>
          </div>
          <span className="text-xs text-slate-300">
            Voucher {split.id} · {split.dc}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Line Type</th>
                <th className="py-2.5 px-4">SKU No</th>
                <th className="py-2.5 px-4 min-w-[200px]">Item Description</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 px-4 text-right">Total Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {/* Split Out */}
              <tr className="bg-rose-50/50 hover:bg-rose-50/80 transition-colors">
                <td className="py-2.5 px-4 font-bold text-rose-600">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    Split Out (Source)
                  </span>
                </td>
                <td className="py-2.5 px-4 font-mono font-medium">{split.s}</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">{split.name}</td>
                <td className="py-2.5 px-4 text-right font-black text-slate-900">-{split.out}</td>
                <td className="py-2.5 px-4 text-right whitespace-nowrap">
                  ₹{split.grn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-4 text-right font-black whitespace-nowrap text-rose-700">
                  ₹{sourceTotalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Split In Items */}
              {split.conv.map((c, i) => (
                <tr key={i} className="bg-emerald-50/50 hover:bg-emerald-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-emerald-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Split In (Target)
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium">{c.s}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-2.5 px-4 text-right font-black text-emerald-700">+{c.q}</td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    ₹{c.p.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-right font-black whitespace-nowrap text-emerald-800">
                    ₹{(c.q * c.p).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {/* Shrinkage Item if present */}
              {split.shr && (
                <tr className="bg-amber-50/50 hover:bg-amber-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-amber-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Shrinkage / Loss
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium">{split.shr.s}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{split.shr.name}</td>
                  <td className="py-2.5 px-4 text-right font-black text-amber-700">{split.shr.q}</td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    ₹{split.shr.p.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-right font-black whitespace-nowrap text-amber-800">
                    ₹{shrinkageTotalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-4">
                  Difference in Stock Weight: {split.diffKg != null ? `${split.diffKg} kg` : "—"}
                </td>
                <td colSpan={2} className="py-3 px-4 text-right text-slate-600">
                  Total Bulk Value vs Converted Value:
                </td>
                <td className="py-3 px-4 text-right text-slate-900">
                  ₹{targetTotalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
