import { useState, useEffect, useCallback, useId } from "react";
import {
  ArrowRightLeft,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  RefreshCw,
  X,
  Printer,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface StockBalanceItem {
  id: string;
  sku: string;
  product_name: string;
  variant_name: string;
  branch_name: string;
  quantity_on_hand: string | number;
  quantity_available: string | number;
  quantity_reserved: string | number;
  average_unit_cost: string | number;
  total_value: string | number;
}

function SvgBarcode({ code }: { code: string }) {
  const bars: { width: number; isBlack: boolean }[] = [];
  let isBlack = true;
  const str = code || "12345678";
  for (let i = 0; i < str.length; i++) {
    const val = (str.charCodeAt(i) % 3) + 1;
    bars.push({ width: val, isBlack });
    bars.push({ width: 1, isBlack: false });
    isBlack = !isBlack;
  }
  let currentX = 10;
  return (
    <svg viewBox="0 0 160 36" className="w-full h-7 max-w-[140px] mx-auto">
      {bars.map((bar, idx) => {
        const x = currentX;
        currentX += bar.width + 1;
        if (bar.isBlack) {
          return <rect key={idx} x={x} y="0" width={bar.width} height="36" fill="#000" />;
        }
        return null;
      })}
    </svg>
  );
}

export function InventoryManagementPage() {
  const stockSearchId = useId();
  const sourceBranchId = useId();
  const destBranchId = useId();
  const transferSkuId = useId();
  const transferQtyId = useId();
  const transferNotesId = useId();
  const adjBranchId = useId();
  const adjSkuId = useId();
  const adjTypeId = useId();
  const adjDeltaId = useId();
  const adjReasonId = useId();

  const { activeBranch, availableBranches } = useBranchStore();

  const [activeTab, setActiveTab] = useState<"balances" | "transfers" | "adjustments" | "barcodes">("balances");
  const [balances, setBalances] = useState<StockBalanceItem[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Barcode Printing State
  const [barcodeProductName, setBarcodeProductName] = useState("Siddeshwar Fresh Toor Dal (1kg)");
  const [barcodeSku, setBarcodeSku] = useState("8901234567890");
  const [barcodeMrp, setBarcodeMrp] = useState("165.00");
  const [barcodePrice, setBarcodePrice] = useState("142.00");
  const [barcodeLayout, setBarcodeLayout] = useState<"24" | "30" | "single">("24");
  const [barcodeCount, setBarcodeCount] = useState(24);
  const [barcodePackedDate, setBarcodePackedDate] = useState(
    new Date().toLocaleDateString("en-GB")
  );

  const handleSelectProductForBarcode = (b: StockBalanceItem) => {
    setBarcodeProductName(b.product_name);
    setBarcodeSku(b.sku);
    setBarcodePrice((Number(b.average_unit_cost) * 1.2).toFixed(2));
    setBarcodeMrp((Number(b.average_unit_cost) * 1.35).toFixed(2));
    setActiveTab("barcodes");
    toast.success("Loaded Product into Barcode Generator", {
      description: `${b.product_name} ready for sticker printing.`,
    });
  };

  // Transfers
  const [showRequestTransferModal, setShowRequestTransferModal] = useState(false);
  const [sourceBranch, setSourceBranch] = useState("");
  const [destBranch, setDestBranch] = useState("");
  const [transferSku, setTransferSku] = useState("");
  const [transferQty, setTransferQty] = useState("10");
  const [transferNotes, setTransferNotes] = useState("");

  // Adjustment Modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustBranch, setAdjustBranch] = useState("");
  const [adjustSku, setAdjustSku] = useState("");
  const [adjustType, setAdjustType] = useState<"CORRECTION" | "DAMAGE" | "EXPIRY" | "THEFT">("CORRECTION");
  const [adjustDelta, setAdjustDelta] = useState("0");
  const [adjustReason, setAdjustReason] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchBalances = useCallback(async () => {
    try {
      setIsLoadingBalances(true);
      const res = await apiClient.get<StockBalanceItem[]>("/api/v1/inventory/balances", {
        params: {
          branch_id: activeBranch?.id,
        },
      });
      setBalances(res.data);
    } catch {
      setBalances([]);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Set default branches
  useEffect(() => {
    if (availableBranches.length > 0) {
      if (!sourceBranch && availableBranches[0]) setSourceBranch(availableBranches[0].id);
      if (!destBranch && availableBranches.length > 1 && availableBranches[1]) setDestBranch(availableBranches[1].id);
      if (!adjustBranch) setAdjustBranch(activeBranch?.id || availableBranches[0]?.id || "");
    }
  }, [availableBranches, activeBranch, sourceBranch, destBranch, adjustBranch]);

  const handleRequestTransfer = async () => {
    if (!sourceBranch || !destBranch || !transferSku || parseFloat(transferQty) <= 0) {
      setNotification({ type: "error", message: "Please fill in all transfer fields." });
      return;
    }
    if (sourceBranch === destBranch) {
      setNotification({ type: "error", message: "Source and destination branches must be distinct." });
      return;
    }

    try {
      await apiClient.post("/api/v1/transfers/request", {
        source_branch_id: sourceBranch,
        destination_branch_id: destBranch,
        notes: transferNotes || undefined,
        items: [
          {
            sku: transferSku.trim(),
            quantity: parseFloat(transferQty),
          },
        ],
      });
      setNotification({ type: "success", message: "Stock transfer requested successfully." });
      setShowRequestTransferModal(false);
      setTransferSku("");
      setTransferNotes("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setNotification({
        type: "error",
        message: errorObj?.response?.data?.detail || "Failed to create transfer request.",
      });
    }
  };

  const handleStockAdjustment = async () => {
    const delta = parseFloat(adjustDelta);
    if (!adjustBranch || !adjustSku.trim() || delta === 0 || !adjustReason.trim()) {
      setNotification({
        type: "error",
        message: "Branch, SKU, non-zero quantity delta, and audit reason are mandatory.",
      });
      return;
    }

    try {
      await apiClient.post("/api/v1/inventory/adjust", {
        branch_id: adjustBranch,
        sku: adjustSku.trim(),
        adjustment_type: adjustType,
        quantity_delta: delta,
        reason: adjustReason.trim(),
      });
      setNotification({ type: "success", message: "Inventory adjusted and audit log recorded." });
      setShowAdjustmentModal(false);
      setAdjustSku("");
      setAdjustDelta("0");
      setAdjustReason("");
      fetchBalances();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setNotification({
        type: "error",
        message: errorObj?.response?.data?.detail || "Failed to execute stock adjustment.",
      });
    }
  };

  const filteredBalances = balances.filter((b) => {
    const matchesSearch =
      b.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branch_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = onlyLowStock ? Number(b.quantity_available) <= 10 : true;
    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Inventory & Multi-Branch Stock Tracking
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Branch: {activeBranch?.name || "All Branches"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Authoritative stock balances, inter-branch transfers & audited inventory adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAdjustmentModal(true)}
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" /> Stock Adjustment
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-primary text-primary-foreground"
            onClick={() => setShowRequestTransferModal(true)}
          >
            <ArrowRightLeft className="w-4 h-4" /> Request Stock Transfer
          </Button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 text-sm rounded-lg flex items-center justify-between ${
            notification.type === "success"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{notification.message}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotification(null)} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("balances")}
          className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "balances"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Stock Balances & Valuation
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "transfers"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Inter-Branch Transfers
        </button>
        <button
          onClick={() => setActiveTab("barcodes")}
          className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "barcodes"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          🏷️ Barcode Sticker Generator (A4 Sheets)
        </button>
      </div>

      {/* TAB 1: Stock Balances */}
      {activeTab === "balances" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <label htmlFor={stockSearchId} className="sr-only">Search SKU, product or branch</label>
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                id={stockSearchId}
                placeholder="Search SKU, product or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={onlyLowStock ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className="gap-1.5 text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {onlyLowStock ? "Showing Low Stock (<= 10)" : "Filter Low Stock"}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchBalances} className="gap-1.5 text-xs">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBalances ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">SKU / Product</th>
                      <th className="py-2.5 px-3 font-medium">Branch</th>
                      <th className="py-2.5 px-3 font-medium text-right">On Hand</th>
                      <th className="py-2.5 px-3 font-medium text-right">Available</th>
                      <th className="py-2.5 px-3 font-medium text-right">Reserved</th>
                      <th className="py-2.5 px-3 font-medium text-right">Avg Cost</th>
                      <th className="py-2.5 px-3 font-medium text-right">Total Valuation</th>
                      <th className="py-2.5 px-4 font-medium text-center">Status</th>
                      <th className="py-2.5 px-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoadingBalances ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                          Loading inventory balances...
                        </td>
                      </tr>
                    ) : filteredBalances.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                          No stock balance records found.
                        </td>
                      </tr>
                    ) : (
                      filteredBalances.map((item) => {
                        const avail = Number(item.quantity_available);
                        const isZero = avail <= 0;
                        const isLow = avail > 0 && avail <= 10;
                        return (
                          <tr key={item.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-foreground">{item.product_name}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {item.sku} {item.variant_name ? `• ${item.variant_name}` : ""}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-xs">{item.branch_name}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium">
                              {Number(item.quantity_on_hand).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                              {avail.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              {Number(item.quantity_reserved).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              ₹ {Number(item.average_unit_cost).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                              ₹ {Number(item.total_value).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {isZero ? (
                                <Badge variant="destructive" className="text-xs font-mono">
                                  Out of Stock
                                </Badge>
                              ) : isLow ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs font-mono">
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-mono">
                                  In Stock
                                </Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectProductForBarcode(item)}
                                className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
                              >
                                <Printer className="w-3.5 h-3.5" /> Barcode
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: Inter-Branch Transfers */}
      {activeTab === "transfers" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Inter-Branch Stock Transfer Workflow</span>
              <Button size="sm" onClick={() => setShowRequestTransferModal(true)} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Request Transfer
              </Button>
            </CardTitle>
            <CardDescription>
              4-Step Controlled Movement: Request &rarr; Approval &rarr; Dispatch &rarr; Receive & Verify.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4 text-center text-xs">
              <div className="p-3 border rounded-lg bg-card/60">
                <span className="font-bold text-sm block mb-1">1. Request</span>
                <p className="text-muted-foreground">Branch manager submits requisition for low-stock SKUs.</p>
              </div>
              <div className="p-3 border rounded-lg bg-card/60">
                <span className="font-bold text-sm block mb-1">2. Approval</span>
                <p className="text-muted-foreground">Source branch or Admin validates available inventory.</p>
              </div>
              <div className="p-3 border rounded-lg bg-card/60">
                <span className="font-bold text-sm block mb-1">3. Dispatch</span>
                <p className="text-muted-foreground">Stock deducted from source on-hand and marked in transit.</p>
              </div>
              <div className="p-3 border rounded-lg bg-card/60">
                <span className="font-bold text-sm block mb-1">4. Receive</span>
                <p className="text-muted-foreground">Destination scans receipt and increases local stock atomically.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Barcode Sticker Generator (A4 Sheets) */}
      {activeTab === "barcodes" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card>
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-600" />
                  A4 Barcode Sticker Sheet Generator
                </span>
                <Button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs h-8 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Sticker Sheet ({barcodeCount} Labels)
                </Button>
              </CardTitle>
              <CardDescription>
                Print standard adhesive barcode labels for loose grocery packets, counter pricing, and retail shelves.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Product Display Name</label>
                  <Input
                    value={barcodeProductName}
                    onChange={(e) => setBarcodeProductName(e.target.value)}
                    placeholder="e.g. Basmati Rice 1kg"
                    className="text-xs h-8 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Barcode / SKU</label>
                  <Input
                    value={barcodeSku}
                    onChange={(e) => setBarcodeSku(e.target.value)}
                    placeholder="e.g. 8901234567890"
                    className="text-xs h-8 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">MRP (₹)</label>
                  <Input
                    type="number"
                    value={barcodeMrp}
                    onChange={(e) => setBarcodeMrp(e.target.value)}
                    className="text-xs h-8 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Our Price (₹)</label>
                  <Input
                    type="number"
                    value={barcodePrice}
                    onChange={(e) => setBarcodePrice(e.target.value)}
                    className="text-xs h-8 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Sheet Format / Template</label>
                  <select
                    value={barcodeLayout}
                    onChange={(e) => {
                      const val = e.target.value as "24" | "30" | "single";
                      setBarcodeLayout(val);
                      if (val === "24") setBarcodeCount(24);
                      else if (val === "30") setBarcodeCount(30);
                      else setBarcodeCount(1);
                    }}
                    className="w-full h-8 rounded border border-input text-xs font-medium px-2 bg-background"
                  >
                    <option value="24">A4 Sheet — 24 Labels (3 cols × 8 rows, 64mm × 33.9mm)</option>
                    <option value="30">A4 Sheet — 30 Labels (3 cols × 10 rows, 70mm × 29.7mm)</option>
                    <option value="single">Counter Roll — Single Label (50mm × 25mm)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Labels Count</label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={barcodeCount}
                    onChange={(e) => setBarcodeCount(parseInt(e.target.value) || 1)}
                    className="text-xs h-8 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Packed Date</label>
                  <Input
                    value={barcodePackedDate}
                    onChange={(e) => setBarcodePackedDate(e.target.value)}
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Sheet Preview */}
          <div className="bg-slate-200 p-6 rounded-xl border flex justify-center overflow-x-auto">
            <div
              className={`bg-white shadow-xl p-4 border border-slate-300 w-full max-w-[210mm] min-h-[297mm] ${
                barcodeLayout === "single"
                  ? "flex items-center justify-center min-h-[150px] max-w-[300px]"
                  : barcodeLayout === "30"
                  ? "grid grid-cols-3 gap-2"
                  : "grid grid-cols-3 gap-3"
              }`}
            >
              {Array.from({ length: barcodeCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="border border-slate-300 border-dashed rounded p-2 flex flex-col justify-between text-center bg-white h-[32mm]"
                >
                  <div className="text-[10px] font-black uppercase text-slate-800 tracking-wider leading-tight">
                    SIDDESHWAR ENTERPRISES
                  </div>
                  <div className="text-[11px] font-bold text-slate-900 truncate my-0.5">
                    {barcodeProductName}
                  </div>
                  <SvgBarcode code={barcodeSku} />
                  <div className="font-mono text-[9px] font-bold text-slate-700 tracking-widest leading-none">
                    {barcodeSku}
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200 mt-0.5">
                    <span className="text-slate-400 line-through text-[9px]">MRP: ₹{barcodeMrp}</span>
                    <span className="font-extrabold text-slate-900 text-[11px]">OUR: ₹{barcodePrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Request Stock Transfer */}
      {showRequestTransferModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" /> Request Inter-Branch Transfer
              </CardTitle>
              <CardDescription>
                Transfer inventory from a source branch warehouse to a destination branch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor={sourceBranchId} className="text-xs font-semibold text-muted-foreground">Source Branch (Sending)</label>
                  <select
                    id={sourceBranchId}
                    aria-label="Source Branch (Sending)"
                    value={sourceBranch}
                    onChange={(e) => setSourceBranch(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs bg-background"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={destBranchId} className="text-xs font-semibold text-muted-foreground">Destination Branch (Receiving)</label>
                  <select
                    id={destBranchId}
                    aria-label="Destination Branch (Receiving)"
                    value={destBranch}
                    onChange={(e) => setDestBranch(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs bg-background"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor={transferSkuId} className="text-xs font-semibold text-muted-foreground">Product SKU</label>
                  <Input
                    id={transferSkuId}
                    placeholder="e.g. DAL-TUR-1KG"
                    value={transferSku}
                    onChange={(e) => setTransferSku(e.target.value)}
                    className="font-mono text-xs uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={transferQtyId} className="text-xs font-semibold text-muted-foreground">Quantity to Transfer</label>
                  <Input
                    id={transferQtyId}
                    type="number"
                    step="1"
                    min="1"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    className="font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={transferNotesId} className="text-xs font-semibold text-muted-foreground">Requisition Notes (Optional)</label>
                <Input
                  id={transferNotesId}
                  placeholder="Reason for transfer (e.g. stockout imminent)..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowRequestTransferModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-primary text-primary-foreground" onClick={handleRequestTransfer}>
                  Submit Transfer Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: Stock Adjustment */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" /> Audited Stock Adjustment
              </CardTitle>
              <CardDescription>
                Correct physical inventory mismatches, damaged goods, or write-offs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor={adjBranchId} className="text-xs font-semibold text-muted-foreground">Branch</label>
                  <select
                    id={adjBranchId}
                    aria-label="Branch"
                    value={adjustBranch}
                    onChange={(e) => setAdjustBranch(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs bg-background"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={adjTypeId} className="text-xs font-semibold text-muted-foreground">Adjustment Reason Type</label>
                  <select
                    id={adjTypeId}
                    aria-label="Adjustment Reason Type"
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full p-2 border rounded-md text-xs bg-background font-mono"
                  >
                    <option value="CORRECTION">CORRECTION (Physical Count Mismatch)</option>
                    <option value="DAMAGE">DAMAGE (Damaged / Broken Goods)</option>
                    <option value="EXPIRY">EXPIRY (Expired Goods Write-Off)</option>
                    <option value="THEFT">THEFT (Shrinkage / Stolen Item)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor={adjSkuId} className="text-xs font-semibold text-muted-foreground">Product SKU</label>
                  <Input
                    id={adjSkuId}
                    placeholder="e.g. RICE-BASMATI-5KG"
                    value={adjustSku}
                    onChange={(e) => setAdjustSku(e.target.value)}
                    className="font-mono text-xs uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={adjDeltaId} className="text-xs font-semibold text-muted-foreground">
                    Quantity Delta (+ Add / - Deduct)
                  </label>
                  <Input
                    id={adjDeltaId}
                    type="number"
                    step="0.01"
                    placeholder="e.g. -5 or +10"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(e.target.value)}
                    className="font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={adjReasonId} className="text-xs font-semibold text-muted-foreground">
                  Audit Remarks & Justification (Mandatory)
                </label>
                <Input
                  id={adjReasonId}
                  placeholder="Mandatory audit trail remarks for ledger..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAdjustmentModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-destructive text-white hover:bg-destructive/90" onClick={handleStockAdjustment}>
                  Execute Adjustment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
