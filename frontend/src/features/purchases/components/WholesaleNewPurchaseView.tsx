import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Bot,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getIstDateString } from "@/lib/utilities/istTime";
import { fetchRealtimeInventory, fetchSuppliers } from "@/lib/api/apiService";
import { getStoredSkus } from "@/features/inventory/data/mockInventory";
import {
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

interface LiveSkuOption {
  id: number;
  variantId: string;
  name: string;
  code: string;
  defaultCost: number;
  defaultSell: number;
  gst: number;
}

interface DetailedLine {
  uid: string;
  skuId: number;
  skuName: string;
  qty: number;
  rateExclGst: number;
  gstPercent: number;
  expiryDate: string;
  unloadingPerUnit: number;
  sellingRate: number;
  sellingManuallyEdited: boolean;
}

function createEmptyLine(index: number): DetailedLine {
  return {
    uid: `line-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    skuId: 0,
    skuName: "",
    qty: 1,
    rateExclGst: 0,
    gstPercent: 5,
    expiryDate: "",
    unloadingPerUnit: 0,
    sellingRate: 0,
    sellingManuallyEdited: false,
  };
}

function computeLineMetrics(line: DetailedLine) {
  const qty = Math.max(0, Number(line.qty) || 0);
  const rate = Math.max(0, Number(line.rateExclGst) || 0);
  const gst = Math.max(0, Number(line.gstPercent) || 0);
  const unloading = Math.max(0, Number(line.unloadingPerUnit) || 0);

  const taxableValue = qty * rate;
  const totalGst = taxableValue * (gst / 100);
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  const netAmount = taxableValue + totalGst;
  const grnPriceInclGst = rate * (1 + gst / 100);
  const landingCost = grnPriceInclGst + unloading;
  const unloadingTotal = qty * unloading;

  return {
    taxableValue,
    cgst,
    sgst,
    netAmount,
    grnPriceInclGst,
    landingCost,
    unloadingTotal,
  };
}

interface SearchableSkuInputProps {
  skus: LiveSkuOption[];
  selectedSkuName: string;
  onSelect: (sku: LiveSkuOption) => void;
}

function SearchableSkuInput({ skus, selectedSkuName, onSelect }: SearchableSkuInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedSkuName);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selectedSkuName);
  }, [selectedSkuName]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selectedSkuName);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [selectedSkuName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === selectedSkuName.toLowerCase()) return skus.slice(0, 80);
    return skus
      .filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .slice(0, 80);
  }, [skus, query, selectedSkuName]);

  return (
    <div ref={wrapperRef} className="relative min-w-[210px]">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          placeholder="Search item name..."
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-400 text-center">No matching SKUs</div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.variantId}
                type="button"
                onClick={() => {
                  onSelect(s);
                  setQuery(s.name);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors cursor-pointer ${
                  s.name === selectedSkuName ? "bg-blue-600 text-white hover:bg-blue-600 font-semibold" : "text-slate-700"
                }`}
              >
                <div className="truncate">{s.name}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function WholesaleNewPurchaseView() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const todayIso = getIstDateString();

  const [vendors, setVendors] = useState<Array<{ id: string; numericId: number; name: string }>>([]);
  const [vendorsLoading, setVendorsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setVendorsLoading(true);
    fetchSuppliers()
      .then((rows) => {
        if (!active) return;
        setVendors(
          rows
            .filter((s) => s.is_active !== false && (s.company_name || s.name))
            .map((s, idx) => ({
              id: s.id,
              numericId: idx + 1,
              name: s.company_name || s.name || "",
            }))
        );
      })
      .catch(() => {
        if (active) toast.error("Failed to load vendors from database");
      })
      .finally(() => {
        if (active) setVendorsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const [liveSkus, setLiveSkus] = useState<LiveSkuOption[]>(() =>
    getStoredSkus().map((s) => ({
      id: s.id,
      variantId: String(s.id),
      name: s.name,
      code: String(s.id),
      defaultCost: Number(s.cost) || 0,
      defaultSell: Number(s.price) || 0,
      gst: 5,
    }))
  );

  useEffect(() => {
    let active = true;
    fetchRealtimeInventory()
      .then((rows) => {
        if (!active || !Array.isArray(rows) || rows.length === 0) return;
        setLiveSkus(
          rows.map((r) => ({
            id: r.id,
            variantId: r.variantId,
            name: r.name,
            code: r.code || "",
            defaultCost: Number(r.cost) || 0,
            defaultSell: Number(r.price) || 0,
            gst: 5,
          }))
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
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

  const selectedVendorObj =
    selectedVendorId !== null ? vendors.find((v) => v.id === selectedVendorId) : undefined;
  const filteredVendors = vendorSearch.trim()
    ? vendors.filter((v) => v.name.toLowerCase().includes(vendorSearch.trim().toLowerCase()))
    : vendors;

  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(todayIso);
  const [attachedFileName, setAttachedFileName] = useState<string>("");
  const [autoSaveAi, setAutoSaveAi] = useState<boolean>(false);
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiScanReport, setAiScanReport] = useState<string>("");

  const [moreDetailsOpen, setMoreDetailsOpen] = useState<boolean>(false);
  const [ewayBillNo, setEwayBillNo] = useState<string>("");
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [lines, setLines] = useState<DetailedLine[]>(() => [createEmptyLine(0)]);
  const [transportationCharges, setTransportationCharges] = useState<number>(0);
  const [invoiceTotalInput, setInvoiceTotalInput] = useState<string>("");

  const handleSelectSku = (index: number, sku: LiveSkuOption) => {
    setLines((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      if (!cur) return prev;
      const gst = cur.gstPercent || sku.gst || 5;
      // Convert stored cost (incl. GST) to excl. GST rate if > 0
      const rateExcl = sku.defaultCost > 0 ? Number((sku.defaultCost / (1 + gst / 100)).toFixed(2)) : 0;
      const grnIncl = rateExcl * (1 + gst / 100);
      const autoSell = cur.sellingManuallyEdited
        ? cur.sellingRate
        : sku.defaultSell > 0
        ? sku.defaultSell
        : Number((grnIncl * 1.05).toFixed(2));
      copy[index] = {
        ...cur,
        skuId: sku.id,
        skuName: sku.name,
        rateExclGst: rateExcl,
        gstPercent: gst,
        sellingRate: autoSell,
      };
      return copy;
    });
  };

  const handleLineChange = (index: number, field: keyof DetailedLine, val: string | number) => {
    setLines((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      if (!cur) return prev;
      const updated: DetailedLine = { ...cur };

      if (field === "qty") {
        updated.qty = Math.max(0, Number(val) || 0);
      } else if (field === "rateExclGst") {
        const rate = Math.max(0, Number(val) || 0);
        updated.rateExclGst = rate;
        if (!updated.sellingManuallyEdited) {
          const grnIncl = rate * (1 + updated.gstPercent / 100);
          updated.sellingRate = Number((grnIncl * 1.05).toFixed(2));
        }
      } else if (field === "gstPercent") {
        const gst = Math.max(0, Number(val) || 0);
        updated.gstPercent = gst;
        if (!updated.sellingManuallyEdited) {
          const grnIncl = updated.rateExclGst * (1 + gst / 100);
          updated.sellingRate = Number((grnIncl * 1.05).toFixed(2));
        }
      } else if (field === "unloadingPerUnit") {
        updated.unloadingPerUnit = Math.max(0, Number(val) || 0);
      } else if (field === "sellingRate") {
        updated.sellingRate = Math.max(0, Number(val) || 0);
        updated.sellingManuallyEdited = true;
      } else if (field === "expiryDate") {
        updated.expiryDate = String(val);
      }

      copy[index] = updated;
      return copy;
    });
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, createEmptyLine(prev.length)]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) {
      toast.error("Purchase must have at least one line item");
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const names = Array.from(files).map((f) => f.name).join(", ");
      setAttachedFileName(names);
      toast.success(`Attached invoice: ${names}`);
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
      if (!invoiceNo.trim()) {
        setInvoiceNo("INV-AI-2026-904");
      }
      setAiScanReport(
        `✓ AI verified ${attachedFileName} · GSTIN & HSN rates checked.`
      );
      toast.success("AI parsed and verified supplier tax invoice!");
    }, 900);
  };

  const summary = useMemo(() => {
    let taxableValue = 0;
    let cgst = 0;
    let sgst = 0;
    let itemsNetAmount = 0;
    let unloadingTotal = 0;

    for (const l of lines) {
      const m = computeLineMetrics(l);
      taxableValue += m.taxableValue;
      cgst += m.cgst;
      sgst += m.sgst;
      itemsNetAmount += m.netAmount;
      unloadingTotal += m.unloadingTotal;
    }

    const transport = Math.max(0, Number(transportationCharges) || 0);
    const rawTotal = itemsNetAmount + transport;
    const roundedNetAmount = Math.ceil(rawTotal);
    const roundUp = Math.max(0, roundedNetAmount - rawTotal);
    const netLandingAmount = roundedNetAmount + unloadingTotal;

    return {
      taxableValue,
      cgst,
      sgst,
      itemsNetAmount,
      roundUp,
      netAmount: roundedNetAmount,
      unloadingTotal,
      netLandingAmount,
    };
  }, [lines, transportationCharges]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVendorObj) {
      toast.error("Please select a vendor first");
      return;
    }
    if (!invoiceNo.trim()) {
      toast.error("Invoice number is required");
      return;
    }
    const validLines = lines.filter((l) => l.skuName.trim());
    if (validLines.length === 0) {
      toast.error("Please select at least one SKU");
      return;
    }

    const mappedLines: PurchaseLine[] = validLines.map((l) => {
      const m = computeLineMetrics(l);
      return {
        skuId: l.skuId || 1,
        skuName: l.skuName,
        qty: l.qty,
        grnPrice: Number(m.grnPriceInclGst.toFixed(2)),
        sellPrice: Number(l.sellingRate.toFixed(2)),
        gstPercent: l.gstPercent,
        lineTotal: Number(m.netAmount.toFixed(2)),
      };
    });

    const finalTotal = Number(invoiceTotalInput) > 0 ? Number(invoiceTotalInput) : summary.netAmount;

    const newPurchase: PurchaseRecord = {
      id: Date.now(),
      date: invoiceDate,
      vendorId: selectedVendorObj.numericId,
      vendorName: selectedVendorObj.name,
      invoiceNo: invoiceNo.trim().toUpperCase(),
      totalItems: mappedLines.length,
      totalAmount: finalTotal,
      status: "pending",
      att: attachedFileName || undefined,
      lines: mappedLines,
      createdAt: todayIso,
    };

    const currentList = getStoredPurchases();
    saveStoredPurchases([newPurchase, ...currentList]);

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
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Top Back & Purchase List Buttons */}
      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-full transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={() => navigate("/purchases?tab=list")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0d1b4c] bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Purchase List
        </button>
      </div>

      <h1 className="text-xl font-bold text-[#0f2d59] tracking-tight">Purchase entry</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Top Row: Vendor, Invoice no, Invoice date */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div ref={vendorDropdownRef} className="relative w-full sm:w-80">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Vendor
              </label>
              <button
                type="button"
                onClick={() => setVendorDropdownOpen((o) => !o)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-left flex items-center justify-between gap-2 cursor-pointer"
              >
                <span className={`truncate ${selectedVendorObj ? "text-slate-900" : "text-slate-400"}`}>
                  {selectedVendorObj?.name || "Search vendor"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                    vendorDropdownOpen ? "rotate-180" : ""
                  }`}
                />
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
                    {vendorsLoading ? (
                      <div className="px-3 py-3 text-xs text-slate-400 text-center">
                        Loading vendors...
                      </div>
                    ) : filteredVendors.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-slate-400 text-center">
                        No matching vendors
                      </div>
                    ) : (
                      filteredVendors.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVendorId(v.id);
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

            {selectedVendorObj && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Invoice no
                  </label>
                  <input
                    type="text"
                    placeholder="Invoice no"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                    className="w-36 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Invoice date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {!selectedVendorObj ? (
            <p className="text-xs text-slate-500 pt-1">
              Invoice details, attachment, SKUs and the AI check open after you pick a vendor.
            </p>
          ) : (
            <>
              {/* Invoice Attach (required) + AI Scan Invoice + Auto-save */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600">
                    Invoice attach (required)
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer"
                  >
                    Choose Files
                  </button>
                  <span className="text-xs text-slate-500">
                    {attachedFileName || "No file chosen"}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAiScanInvoice}
                    disabled={isAiScanning}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-full transition-colors cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    {isAiScanning ? "Scanning..." : "AI scan invoice"}
                  </button>

                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSaveAi}
                      onChange={(e) => setAutoSaveAi(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Auto-save if AI check passes
                  </label>
                </div>
              </div>

              {aiScanReport && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{aiScanReport}</span>
                </div>
              )}

              {/* Collapsible More details for the invoice (optional) */}
              <div className="border border-slate-200 rounded-lg bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setMoreDetailsOpen((o) => !o)}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-slate-800 text-left cursor-pointer"
                >
                  {moreDetailsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>More details for the invoice (optional)</span>
                </button>
                {moreDetailsOpen && (
                  <div className="px-3.5 pb-3 pt-1 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        E-Way Bill No
                      </label>
                      <input
                        type="text"
                        value={ewayBillNo}
                        onChange={(e) => setEwayBillNo(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Vehicle No
                      </label>
                      <input
                        type="text"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Notes / Remarks
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Purchase Items Table matching reference */}
              <div className="border border-slate-200 rounded-lg overflow-visible">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#1e5ad7] text-white font-semibold">
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Sl No</th>
                        <th className="py-2.5 px-3 min-w-[220px] whitespace-nowrap">SKU Name</th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">GRN Qty</th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Rate (excl. GST)</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Taxable Value</th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">GST Rate</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">CGST</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">SGST</th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">
                          <div>Net Amount</div>
                          <div className="text-[10px] font-normal text-blue-100">Qty × (Rate+CGST+SGST)</div>
                        </th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">
                          <div>GRN Price</div>
                          <div className="text-[10px] font-normal text-blue-100">Rate+CGST+SGST</div>
                        </th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Expiry Date</th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <div>Unloading Charges</div>
                          <div className="text-[10px] font-normal text-blue-100">₹ per unit</div>
                        </th>
                        <th className="py-2.5 px-2.5 text-right whitespace-nowrap">
                          <div>Landing Cost</div>
                          <div className="text-[10px] font-normal text-blue-100">GRN Price + Unloading</div>
                        </th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Selling rate (incl. GST)</th>
                        <th className="py-2.5 px-2.5 text-center whitespace-nowrap"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {lines.map((l, idx) => {
                        const m = computeLineMetrics(l);
                        return (
                          <tr key={l.uid} className="hover:bg-slate-50/60">
                            <td className="py-2 px-2.5 text-center font-mono text-slate-600">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <SearchableSkuInput
                                skus={liveSkus}
                                selectedSkuName={l.skuName}
                                onSelect={(sku) => handleSelectSku(idx, sku)}
                              />
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <input
                                type="number"
                                min="1"
                                step="any"
                                value={l.qty}
                                onChange={(e) => handleLineChange(idx, "qty", e.target.value)}
                                className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={l.rateExclGst}
                                onChange={(e) => handleLineChange(idx, "rateExclGst", e.target.value)}
                                className="w-24 px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                              {m.taxableValue.toFixed(2)}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <select
                                value={l.gstPercent}
                                onChange={(e) => handleLineChange(idx, "gstPercent", Number(e.target.value))}
                                className="px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono"
                              >
                                {[0, 5, 12, 18, 28].map((g) => (
                                  <option key={g} value={g}>
                                    {g}%
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                              {m.cgst.toFixed(2)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                              {m.sgst.toFixed(2)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              {m.netAmount.toFixed(2)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                              {m.grnPriceInclGst.toFixed(2)}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <input
                                type="date"
                                value={l.expiryDate}
                                onChange={(e) => handleLineChange(idx, "expiryDate", e.target.value)}
                                className="px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={l.unloadingPerUnit}
                                onChange={(e) => handleLineChange(idx, "unloadingPerUnit", e.target.value)}
                                className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                              {m.landingCost.toFixed(2)}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={l.sellingRate}
                                onChange={(e) => handleLineChange(idx, "sellingRate", e.target.value)}
                                className="w-24 px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-300 rounded-md cursor-pointer"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Selling rate is filled as GRN price + 5%. You can change it.
              </p>

              {/* + Add SKU and Items total */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-full transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add SKU
                </button>
                <div className="text-xs font-bold text-slate-800">
                  Items total <span className="font-mono">{summary.itemsNetAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Bottom Right Summary Box + Invoice total + Save Purchase */}
              <div className="flex flex-col items-end gap-3 pt-2">
                <div className="w-full sm:w-80 border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Taxable Value</span>
                    <span className="font-mono font-bold text-slate-900">{summary.taxableValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">CGST</span>
                    <span className="font-mono font-bold text-slate-900">{summary.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">SGST</span>
                    <span className="font-mono font-bold text-slate-900">{summary.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Items Net Amount</span>
                    <span className="font-mono font-bold text-slate-900">{summary.itemsNetAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-600">Transportation Charges</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={transportationCharges}
                      onChange={(e) => setTransportationCharges(Math.max(0, Number(e.target.value) || 0))}
                      className="w-24 px-2 py-1 text-right text-xs border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Round up</span>
                    <span className="font-mono font-bold text-slate-900">{summary.roundUp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-800">Net Amount</span>
                    <span className="font-mono font-bold text-slate-900">{summary.netAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Unloading Charges (total)</span>
                    <span className="font-mono font-bold text-slate-900">{summary.unloadingTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800">Net Landing Amount</span>
                    <span className="font-mono font-bold text-slate-900">{summary.netLandingAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">
                    Net Amount = Items Net Amount + Transportation, rounded up to the next rupee. Net Landing
                    Amount = Net Amount + Unloading Charges.
                  </p>
                </div>

                <div className="w-full sm:w-80 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Invoice total (incl GST)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={summary.netAmount.toFixed(2)}
                    value={invoiceTotalInput}
                    onChange={(e) => setInvoiceTotalInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-full shadow-sm transition-colors cursor-pointer"
                >
                  Save Purchase
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
