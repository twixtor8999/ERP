import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Bot, CheckCircle2, FileUp, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredVendors,
  getStoredPurchases,
  saveStoredPurchases,
  type PurchaseRecord,
  type PurchaseLine,
} from "../data/mockPurchases";
import {
  getStoredInwardExpenses,
  saveStoredInwardExpenses,
  type InwardExpenseRecord,
} from "@/features/expenses/data/mockExpenses";

const SAMPLE_SKUS = [
  { id: 1, name: "Fortune Sunlite Refined Sunflower Oil 1L", defaultGrn: 125, defaultSell: 138, gst: 5 },
  { id: 2, name: "Aashirvaad Select Sharbati Atta 10kg", defaultGrn: 420, defaultSell: 460, gst: 5 },
  { id: 3, name: "Tata Salt Vacuum Evaporated Iodised Salt 1kg", defaultGrn: 25, defaultSell: 28, gst: 0 },
  { id: 4, name: "Madhur Pure & Hygienic Sugar 5kg", defaultGrn: 220, defaultSell: 245, gst: 5 },
  { id: 5, name: "Brooke Bond Red Label Tea 500g", defaultGrn: 240, defaultSell: 270, gst: 5 },
  { id: 6, name: "Parle-G Gold Biscuits 1kg Family Pack", defaultGrn: 110, defaultSell: 130, gst: 18 },
  { id: 7, name: "Surf Excel Easy Wash Detergent Powder 1kg", defaultGrn: 135, defaultSell: 155, gst: 18 },
];

export function WholesaleNewPurchaseView() {
  const navigate = useNavigate();
  const vendors = getStoredVendors();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultSku = SAMPLE_SKUS[0] || {
    id: 1,
    name: "Fortune Sunlite Refined Sunflower Oil 1L",
    defaultGrn: 125,
    defaultSell: 138,
    gst: 5,
  };

  const [selectedVendorId, setSelectedVendorId] = useState<number>(vendors[0]?.id || 1);
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState<boolean>(false);
  const [vendorSearch, setVendorSearch] = useState<string>("");
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setVendorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedVendorObj = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
  const filteredVendors = vendorSearch.trim()
    ? vendors.filter((v) => v.name.toLowerCase().includes(vendorSearch.trim().toLowerCase()))
    : vendors;
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("2026-11-22");
  const [attachedFileName, setAttachedFileName] = useState<string>("");
  const [autoSaveAi, setAutoSaveAi] = useState<boolean>(true);
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiScanReport, setAiScanReport] = useState<string>("");

  const [lines, setLines] = useState<PurchaseLine[]>([
    {
      skuId: defaultSku.id,
      skuName: defaultSku.name,
      qty: 100,
      grnPrice: defaultSku.defaultGrn,
      sellPrice: defaultSku.defaultSell,
      gstPercent: defaultSku.gst,
      lineTotal: 100 * defaultSku.defaultGrn,
    },
  ]);

  const handleVendorChange = (id: number) => {
    setSelectedVendorId(id);
  };

  const handleLineChange = (index: number, field: keyof PurchaseLine, val: any) => {
    setLines((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      if (!cur) return prev;
      const updated: PurchaseLine = { ...cur };

      if (field === "skuId") {
        const sku = SAMPLE_SKUS.find((s) => s.id === Number(val));
        if (sku) {
          updated.skuId = sku.id;
          updated.skuName = sku.name;
          updated.grnPrice = sku.defaultGrn;
          updated.sellPrice = sku.defaultSell;
          updated.gstPercent = sku.gst;
          updated.lineTotal = updated.qty * sku.defaultGrn;
        }
      } else if (field === "qty") {
        const q = Math.max(0, Number(val) || 0);
        updated.qty = q;
        updated.lineTotal = q * updated.grnPrice;
      } else if (field === "grnPrice") {
        const g = Math.max(0, Number(val) || 0);
        updated.grnPrice = g;
        updated.sellPrice = Math.round(g * 1.1); // default 10% wholesale margin
        updated.lineTotal = updated.qty * g;
      } else if (field === "sellPrice") {
        updated.sellPrice = Math.max(0, Number(val) || 0);
      }

      copy[index] = updated;
      return copy;
    });
  };

  const handleAddLine = () => {
    const nextSku = SAMPLE_SKUS[lines.length % SAMPLE_SKUS.length] || defaultSku;
    setLines((prev) => [
      ...prev,
      {
        skuId: nextSku.id,
        skuName: nextSku.name,
        qty: 50,
        grnPrice: nextSku.defaultGrn,
        sellPrice: nextSku.defaultSell,
        gstPercent: nextSku.gst,
        lineTotal: 50 * nextSku.defaultGrn,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) {
      toast.error("Purchase must have at least one line item");
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAttachedFileName(f.name);
      toast.success(`Attached invoice: ${f.name}`);
    }
  };

  const handleAiScanInvoice = () => {
    if (!attachedFileName) {
      toast.error("Please attach an invoice file first");
      return;
    }
    setIsAiScanning(true);
    setAiScanReport(`Analyzing ${attachedFileName} using AI...`);

    setTimeout(() => {
      setIsAiScanning(false);
      setInvoiceNo("INV-AI-2026-904");
      setAiScanReport(
        `✓ AI matched 2 items, GSTIN: 29AAAFS1234F1Z5, HSN rates verified. All calculations match!`
      );
      toast.success("AI parsed and verified supplier tax invoice!");
    }, 900);
  };

  const grandTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNo.trim()) {
      toast.error("Invoice number is required");
      return;
    }

    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    const curVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
    const vId = curVendor ? curVendor.id : 1;
    const vName = curVendor ? curVendor.name : "SHA HIRACHAND DONGARCHAND & CO";

    const newPurchase: PurchaseRecord = {
      id: Date.now(),
      date: invoiceDate,
      vendorId: vId,
      vendorName: vName,
      invoiceNo: invoiceNo.trim().toUpperCase(),
      totalItems: lines.length,
      totalAmount: grandTotal,
      status: "pending",
      att: attachedFileName || undefined,
      lines: lines,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const currentList = getStoredPurchases();
    saveStoredPurchases([newPurchase, ...currentList]);

    // Also sync to Inward Expenses immediately
    try {
      const currentInward = getStoredInwardExpenses();
      const newInward: InwardExpenseRecord = {
        id: newPurchase.id,
        purchaseId: newPurchase.id,
        date: newPurchase.date,
        invoiceNo: newPurchase.invoiceNo,
        invoiceTotal: newPurchase.totalAmount,
        vendorName: newPurchase.vendorName,
        expenseType: "Purchase (Stock Inward)",
      };
      saveStoredInwardExpenses([newInward, ...currentInward]);
    } catch (err) {
      console.error("Failed to sync inward expense:", err);
    }

    toast.success("Purchase entry saved · Waiting for Owner / Admin approval!");
    navigate("/purchases?tab=list");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Top Back Button */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/purchases?tab=list")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Purchase List
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase entry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 1: select vendor, verify invoice number, attach invoice, and review items before submitting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Vendor, Invoice No, Invoice Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div ref={vendorDropdownRef} className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vendor <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setVendorDropdownOpen((o) => !o)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-left flex items-center justify-between gap-2 cursor-pointer"
              >
                <span className="truncate text-slate-900">
                  {selectedVendorObj?.name || "Select vendor"}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${vendorDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {vendorDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search vendor..."
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {filteredVendors.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-slate-400 text-center">
                        No matching vendors
                      </div>
                    ) : (
                      filteredVendors.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            handleVendorChange(v.id);
                            setVendorDropdownOpen(false);
                            setVendorSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                            v.id === selectedVendorId
                              ? "bg-blue-600 text-white"
                              : "text-slate-700 hover:bg-blue-50"
                          }`}
                        >
                          {v.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Invoice no <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INV-9842"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Invoice date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Invoice Attachment & AI Scan Strip */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 shadow-sm transition-colors"
                >
                  <FileUp className="w-3.5 h-3.5 text-blue-600" />
                  Attach Invoice File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-xs font-medium text-slate-600">
                  {attachedFileName ? `✓ ${attachedFileName}` : "No file attached (optional)"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAiScanInvoice}
                  disabled={!attachedFileName}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    attachedFileName
                      ? "bg-[#0d1b4c] text-white hover:bg-[#1a2d6d]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  {isAiScanning ? "AI scanning..." : "AI scan invoice"}
                </button>

                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSaveAi}
                    onChange={(e) => setAutoSaveAi(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600"
                  />
                  Auto-save if AI check passes
                </label>
              </div>
            </div>

            {aiScanReport && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {aiScanReport}
              </p>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Purchase Items (SKUs)
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add SKU
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 min-w-[220px]">SKU</th>
                      <th className="py-2.5 px-3 w-24 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-32 text-right">GRN Rate (₹)</th>
                      <th className="py-2.5 px-3 w-32 text-right">Selling Rate (₹)</th>
                      <th className="py-2.5 px-3 w-20 text-center">GST %</th>
                      <th className="py-2.5 px-3 w-32 text-right">Line Total</th>
                      <th className="py-2.5 px-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {lines.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <select
                            value={l.skuId}
                            onChange={(e) => handleLineChange(idx, "skuId", e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800"
                          >
                            {SAMPLE_SKUS.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            value={l.qty}
                            onChange={(e) => handleLineChange(idx, "qty", e.target.value)}
                            className="w-20 px-2 py-1 text-xs border rounded text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            value={l.grnPrice}
                            onChange={(e) => handleLineChange(idx, "grnPrice", e.target.value)}
                            className="w-24 px-2 py-1 text-xs border rounded text-right font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            value={l.sellPrice}
                            onChange={(e) => handleLineChange(idx, "sellPrice", e.target.value)}
                            className="w-24 px-2 py-1 text-xs border rounded text-right text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        <td className="py-2 px-3 text-center text-slate-500 font-semibold">
                          {l.gstPercent}%
                        </td>

                        <td className="py-2 px-3 text-right font-black text-slate-900">
                          ₹{l.lineTotal.toLocaleString()}
                        </td>

                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Totals & Submit */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Total items: <b className="text-slate-900">{lines.length}</b> &nbsp;|&nbsp; Grand
              Total:{" "}
              <b className="text-blue-700 text-base font-black">
                ₹{grandTotal.toLocaleString()}
              </b>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/purchases?tab=list")}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Submit for approval
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

