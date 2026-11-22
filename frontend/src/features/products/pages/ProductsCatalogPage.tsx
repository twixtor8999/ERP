import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Search,
  Tag,
  Barcode,
  Loader2,
  Download,
  Upload,
  Edit2,
  AlertTriangle,
  Layers,
  Scan,
  ImageIcon,
  IndianRupee,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BarcodeStickerSheetModal } from "../components/BarcodeStickerSheetModal";

interface Variant {
  id: string;
  variant_name: string;
  sku: string;
  barcode: string | null;
  alternate_barcodes?: string[];
  cost_price: number;
  selling_price: number;
  mrp: number;
  wholesale_price: number;
  min_selling_price: number;
  stock_on_hand: number;
  margin_percentage: number;
}

interface ProductItem {
  id: string;
  name: string;
  code: string;
  display_name: string;
  image_url: string | null;
  description: string | null;
  category: string;
  category_id: string | null;
  category_image: string | null;
  uom: string;
  uom_id: string | null;
  tax: string;
  tax_config_id: string | null;
  tax_rate: number;
  hsn_code: string | null;
  is_saleable: boolean;
  is_purchasable: boolean;
  is_inventory_tracked: boolean;
  is_perishable: boolean;
  is_batch_tracked: boolean;
  is_expiry_tracked: boolean;
  is_active: boolean;
  stock_on_hand: number;
  variants: Variant[];
}

export function ProductsCatalogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // Auxiliary lookups (Categories, Taxes, UOMs) cached for 15 minutes
  const { data: lookups } = useQuery({
    queryKey: ["admin-product-lookups"],
    queryFn: async () => {
      const [catsRes, taxesRes, uomsRes] = await Promise.all([
        apiClient.get<{ id: string; name: string; product_count: number }[]>("/admin/categories"),
        apiClient.get<{ id: string; description: string; percentage: string }[]>("/admin/taxes"),
        apiClient.get<{ id: string; name: string; symbol: string }[]>("/admin/uoms"),
      ]);
      return {
        categories: catsRes.data,
        taxes: taxesRes.data,
        uoms: uomsRes.data,
      };
    },
    staleTime: 1000 * 60 * 15,
  });

  const categories = lookups?.categories || [];
  const taxes = lookups?.taxes || [];
  const uoms = lookups?.uoms || [];

  // Products query cached with placeholderData for smooth transitions
  const {
    data: products = [],
    isLoading: loading,
    refetch: loadData,
  } = useQuery<ProductItem[]>({
    queryKey: ["admin-products", search, selectedCategory, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get<ProductItem[]>("/admin/products", {
        params: {
          search: search || undefined,
          category_id: selectedCategory || undefined,
          status_filter: statusFilter,
        },
      });
      return res.data;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes instant cache
    placeholderData: (prev) => prev,
  });

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [uomId, setUomId] = useState("");
  const [taxConfigId, setTaxConfigId] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [altBarcodes, setAltBarcodes] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [minSellingPrice, setMinSellingPrice] = useState("");
  const [initialStock, setInitialStock] = useState("0");
  const [isSaleable, setIsSaleable] = useState(true);
  const [isPurchasable, setIsPurchasable] = useState(true);
  const [isInventoryTracked, setIsInventoryTracked] = useState(true);
  const [isPerishable, setIsPerishable] = useState(false);
  const [isBatchTracked, setIsBatchTracked] = useState(false);
  const [isExpiryTracked, setIsExpiryTracked] = useState(false);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editSellingPrice, setEditSellingPrice] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editMrp, setEditMrp] = useState("");
  const [editWholesalePrice, setEditWholesalePrice] = useState("");
  const [editStockAdjustment, setEditStockAdjustment] = useState("0");
  const [editBarcode, setEditBarcode] = useState("");
  const [editAltBarcodes, setEditAltBarcodes] = useState("");
  const [editIsSaleable, setEditIsSaleable] = useState(true);
  const [editIsPerishable, setEditIsPerishable] = useState(false);
  const [editIsBatchTracked, setEditIsBatchTracked] = useState(false);

  // Scanner Quick Lookup Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerCode, setScannerCode] = useState("");
  const [scannedResult, setScannedResult] = useState<Record<string, unknown> | null>(null);
  const [scannerLoading, setScannerLoading] = useState(false);

  // Import CSV Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // A4 Barcode Stickers Modal State
  const [isBarcodeStickerModalOpen, setIsBarcodeStickerModalOpen] = useState(false);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const total = products.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValuation = 0;

    for (const p of products) {
      const stock = p.stock_on_hand || 0;
      const primaryVar = p.variants[0];
      const cost = primaryVar?.cost_price || 0;
      totalValuation += stock * cost;

      if (stock > 10) inStock++;
      else if (stock > 0 && stock <= 10) lowStock++;
      else outOfStock++;
    }

    return { total, inStock, lowStock, outOfStock, totalValuation };
  }, [products]);

  // Add Product Handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !sku || !sellingPrice) {
      toast.error("Validation Error", { description: "Please fill all mandatory fields (Name, Code, SKU, Selling Price)" });
      return;
    }

    setSubmitting(true);
    try {
      const altBcList = altBarcodes
        ? altBarcodes.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await apiClient.post("/admin/products", {
        name,
        code,
        display_name: displayName || name,
        image_url: imageUrl || null,
        category_id: categoryId || null,
        uom_id: uomId || null,
        tax_config_id: taxConfigId || null,
        description: description || null,
        is_saleable: isSaleable,
        is_purchasable: isPurchasable,
        is_inventory_tracked: isInventoryTracked,
        is_perishable: isPerishable,
        is_batch_tracked: isBatchTracked,
        is_expiry_tracked: isExpiryTracked,
        initial_variant: {
          variant_name: "Standard",
          sku,
          barcode: barcode || null,
          alternate_barcodes: altBcList,
          cost_price: parseFloat(costPrice) || 0,
          selling_price: parseFloat(sellingPrice),
          mrp: parseFloat(mrp) || parseFloat(sellingPrice),
          wholesale_price: parseFloat(wholesalePrice) || parseFloat(sellingPrice),
          min_selling_price: parseFloat(minSellingPrice) || parseFloat(costPrice) || 0,
          initial_stock: parseFloat(initialStock) || 0,
        },
      });

      toast.success("Product Master Created", { description: `${name} (${sku}) created in central catalog.` });
      setIsAddModalOpen(false);
      // Reset form
      setName("");
      setCode("");
      setDisplayName("");
      setImageUrl("");
      setDescription("");
      setSku("");
      setBarcode("");
      setAltBarcodes("");
      setCostPrice("0");
      setSellingPrice("");
      setMrp("");
      setWholesalePrice("");
      setMinSellingPrice("");
      setInitialStock("0");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        // @ts-expect-error axios response
        ? err.response?.data?.detail || "Creation failed"
        : "Failed to create product";
      toast.error("Error", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setEditDisplayName(p.display_name || p.name);
    const primaryVar = p.variants[0];
    setEditSellingPrice(primaryVar?.selling_price.toString() || "");
    setEditCostPrice(primaryVar?.cost_price.toString() || "");
    setEditMrp(primaryVar?.mrp.toString() || "");
    setEditWholesalePrice(primaryVar?.wholesale_price.toString() || "");
    setEditBarcode(primaryVar?.barcode || "");
    setEditAltBarcodes((primaryVar?.alternate_barcodes || []).join(", "));
    setEditStockAdjustment("0");
    setEditIsSaleable(p.is_saleable);
    setEditIsPerishable(p.is_perishable);
    setEditIsBatchTracked(p.is_batch_tracked);
  };

  // Submit Edit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSubmitting(true);
    try {
      const primaryVar = editingProduct.variants[0];
      const altBcList = editAltBarcodes
        ? editAltBarcodes.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await apiClient.put(`/admin/products/${editingProduct.id}`, {
        display_name: editDisplayName,
        is_saleable: editIsSaleable,
        is_perishable: editIsPerishable,
        is_batch_tracked: editIsBatchTracked,
        variant_id: primaryVar?.id,
        barcode: editBarcode || null,
        alternate_barcodes: altBcList,
        cost_price: parseFloat(editCostPrice) || 0,
        selling_price: parseFloat(editSellingPrice) || 0,
        mrp: parseFloat(editMrp) || parseFloat(editSellingPrice) || 0,
        wholesale_price: parseFloat(editWholesalePrice) || 0,
        stock_adjustment: parseFloat(editStockAdjustment) || 0,
      });

      toast.success("Product Updated", { description: `${editingProduct.name} updated successfully.` });
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        // @ts-expect-error axios response
        ? err.response?.data?.detail || "Update failed"
        : "Failed to update product";
      toast.error("Error", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Barcode Scanner Lookup Handler
  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerCode.trim()) return;

    setScannerLoading(true);
    setScannedResult(null);
    try {
      const res = await apiClient.get(`/admin/products/lookup/barcode/${scannerCode.trim()}`);
      setScannedResult(res.data);
      toast.success("Barcode Match Found", { description: `${res.data.name} (SKU: ${res.data.sku})` });
    } catch {
      toast.error("Barcode Not Found", { description: `No catalog SKU matching '${scannerCode}'` });
    } finally {
      setScannerLoading(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = async () => {
    try {
      toast.info("Generating CSV Export...");
      const res = await apiClient.get("/admin/products/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `siddeshwar_master_catalog_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export Downloaded", { description: "Full catalog CSV saved." });
    } catch {
      toast.error("Export Failed", { description: "Unable to generate CSV catalog export" });
    }
  };

  // Import CSV Handler
  const handleImportBatch = async () => {
    if (!importText.trim()) {
      toast.error("CSV text is required");
      return;
    }

    setImporting(true);
    try {
      // Parse simple CSV rows
      const lines = importText.trim().split("\n");
      const rows = [];
      const firstLine = lines[0] || "";
      const startIdx = firstLine.toLowerCase().includes("name") ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        const parts = line.split(",").map((p) => p.trim());
        const pName = parts[0];
        const pPrice = parts[1];
        if (pName && pPrice) {
          rows.push({
            name: pName,
            selling_price: parseFloat(pPrice) || 0,
            cost_price: parseFloat(parts[2] || "0") || 0,
            sku: parts[3] || undefined,
            barcode: parts[4] || undefined,
            category: parts[5] || undefined,
            stock: parseFloat(parts[6] || "0") || 0,
          });
        }
      }

      if (rows.length === 0) {
        toast.error("Invalid CSV format", { description: "Please provide valid rows: Name, Selling Price, Cost Price, SKU, Barcode, Category, Stock" });
        return;
      }

      const res = await apiClient.post("/admin/products/import", { rows });
      toast.success("Import Completed", { description: res.data.message });
      setIsImportModalOpen(false);
      setImportText("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        // @ts-expect-error axios response
        ? err.response?.data?.detail || "Import failed"
        : "Failed to import catalog CSV";
      toast.error("Import Error", { description: msg });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Products & Master Catalog
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-mono">
                  Phase 03.2 Enterprise
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized multi-branch master data • Dual-language display • Fast barcode engine • Live godown stock
              </p>
            </div>
          </div>
        </div>

        {/* Global Catalog Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBarcodeStickerModalOpen(true)}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Tag className="w-4 h-4 text-purple-600" />
            A4 Barcode Stickers
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Scan className="w-4 h-4 text-purple-600" />
            Barcode Scanner
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            Import CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Export CSV
          </Button>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Add Master SKU
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total SKUs</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Central catalog records</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>In Stock</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.inStock}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Healthy godown stock</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStock}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Below 10 units</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats.outOfStock}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Needs reorder</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Stock Valuation</span>
            <IndianRupee className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ₹{stats.totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">At purchase cost</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search by English name, Kannada name, SKU, code, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 text-sm"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by Category"
          className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 font-medium"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.product_count})
            </option>
          ))}
        </select>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === "ACTIVE" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("LOW_STOCK")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === "LOW_STOCK" ? "bg-amber-500 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setStatusFilter("OUT_OF_STOCK")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === "OUT_OF_STOCK" ? "bg-rose-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Products Master Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
            <span className="text-sm font-semibold">Loading product master catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-base text-slate-800">No products match your query</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or add a new master product SKU.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item & Kannada Name</th>
                  <th className="py-3 px-4">Category & Tax</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">MRP / Wholesale</th>
                  <th className="py-3 px-4 text-center">Margin %</th>
                  <th className="py-3 px-4 text-center">Godown Stock</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => {
                  const primaryVar = p.variants[0];
                  const stock = p.stock_on_hand || 0;
                  const margin = primaryVar?.margin_percentage || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & Kannada Display */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">{p.name}</div>
                            {p.display_name && p.display_name !== p.name && (
                              <div className="text-xs text-blue-700 font-normal mt-0.5 font-sans">
                                {p.display_name}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.code}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category & UOM */}
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs">
                          {p.category}
                        </Badge>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-sans">
                          <span>{p.tax}</span>
                          <span>•</span>
                          <span>{p.uom}</span>
                        </div>
                      </td>

                      {/* Primary SKU & Barcode */}
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="text-slate-900 font-bold">{primaryVar?.sku || "NO-SKU"}</div>
                        {primaryVar?.barcode && (
                          <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" />
                            <span>{primaryVar.barcode}</span>
                          </div>
                        )}
                        {primaryVar?.alternate_barcodes && primaryVar.alternate_barcodes.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            +{primaryVar.alternate_barcodes.length} alt barcodes
                          </div>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 text-right text-slate-600">
                        ₹{(primaryVar?.cost_price || 0).toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{(primaryVar?.selling_price || 0).toFixed(2)}
                      </td>

                      {/* MRP & Wholesale Price */}
                      <td className="py-3 px-4 text-right text-xs">
                        <div className="text-slate-700 font-medium">MRP: ₹{(primaryVar?.mrp || 0).toFixed(2)}</div>
                        <div className="text-slate-500 text-[11px]">
                          WS: ₹{(primaryVar?.wholesale_price || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={`text-xs font-semibold ${
                            margin >= 15
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : margin >= 5
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {margin > 0 ? `+${margin}%` : "0%"}
                        </Badge>
                      </td>

                      {/* Stock on Hand */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={`font-mono text-xs px-2.5 py-0.5 font-bold ${
                            stock > 10
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : stock > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {stock.toFixed(0)} units
                        </Badge>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(p)}
                          className="h-8 px-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1 mx-auto"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Add New Master Product SKU
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">English Product Name *</label>
                  <Input
                    required
                    placeholder="e.g. Basmati Rice Royal 50Kg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kannada / Regional Display Name</label>
                  <Input
                    placeholder="e.g. ಬಾಸ್ಮತಿ ಅಕ್ಕಿ ರಾಯಲ್ 50ಕೆ.ಜಿ"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Product Code *</label>
                  <Input
                    required
                    placeholder="e.g. SKU-BASMATI-50KG"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    aria-label="Product Category"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Unit of Measure</label>
                  <select
                    value={uomId}
                    onChange={(e) => setUomId(e.target.value)}
                    aria-label="Unit of Measure"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                  >
                    <option value="">Select UOM</option>
                    {uoms.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">GST Tax Configuration</label>
                  <select
                    value={taxConfigId}
                    onChange={(e) => setTaxConfigId(e.target.value)}
                    aria-label="GST Tax Configuration"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                  >
                    <option value="">Select GST Rate</option>
                    {taxes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.description} ({t.percentage})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Image URL or Data URI</label>
                  <Input
                    placeholder="https://... or data:image/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Product Description</label>
                <Input
                  placeholder="Optional details, ingredients, packaging notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Product Classification Toggles */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-semibold text-xs text-slate-700 mb-2 uppercase tracking-wider">
                  Product Classification Controls
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSaleable}
                      onChange={(e) => setIsSaleable(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Saleable in POS</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPurchasable}
                      onChange={(e) => setIsPurchasable(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Purchasable in PO</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInventoryTracked}
                      onChange={(e) => setIsInventoryTracked(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Inventory Tracked</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPerishable}
                      onChange={(e) => setIsPerishable(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Perishable / Grocery</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBatchTracked}
                      onChange={(e) => setIsBatchTracked(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Batch / Lot Tracked</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExpiryTracked}
                      onChange={(e) => setIsExpiryTracked(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Expiry Tracked</span>
                  </label>
                </div>
              </div>

              {/* Variant Pricing & Barcodes */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                <div className="font-semibold text-xs text-blue-900 uppercase tracking-wider">
                  Master SKU Pricing & Initial Stock
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">SKU Identifier *</label>
                    <Input
                      required
                      placeholder="e.g. SKU-BAS-50K"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Primary Barcode</label>
                    <Input
                      placeholder="e.g. 8901234567890"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Alt Barcodes (comma-sep)</label>
                    <Input
                      placeholder="e.g. 89012345, 89012346"
                      value={altBarcodes}
                      onChange={(e) => setAltBarcodes(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Cost Price (₹)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Selling Price (₹) *</label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">MRP (₹)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Wholesale Price (₹)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Min Selling Price (₹)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={minSellingPrice}
                      onChange={(e) => setMinSellingPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Initial Godown Stock</label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                  {submitting ? "Saving Master SKU..." : "Save Product SKU"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit Master Product
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{editingProduct.name} ({editingProduct.code})</div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Kannada / Regional Display Name</label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Primary Barcode</label>
                  <Input
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Alt Barcodes (comma-sep)</label>
                  <Input
                    value={editAltBarcodes}
                    onChange={(e) => setEditAltBarcodes(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Cost Price (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Selling Price (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">MRP (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Wholesale (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editWholesalePrice}
                    onChange={(e) => setEditWholesalePrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Stock adjustment */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1">
                  <span>Current Godown Stock</span>
                  <span className="font-mono text-sm">{editingProduct.stock_on_hand.toFixed(0)} units</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-amber-800">Quick Stock Adjustment (+ or - units)</label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="e.g. +50 or -10"
                    value={editStockAdjustment}
                    onChange={(e) => setEditStockAdjustment(e.target.value)}
                    className="bg-white border-amber-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-700 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsSaleable}
                    onChange={(e) => setEditIsSaleable(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Saleable in POS</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPerishable}
                    onChange={(e) => setEditIsPerishable(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Perishable</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsBatchTracked}
                    onChange={(e) => setEditIsBatchTracked(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Batch Tracked</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                  {submitting ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER LOOKUP MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scan className="w-5 h-5 text-purple-600" />
                Barcode Scanner Fast Lookup
              </h2>
              <button
                onClick={() => {
                  setIsScannerOpen(false);
                  setScannedResult(null);
                  setScannerCode("");
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBarcodeScan} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Scan or Type Barcode / EAN</label>
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder="Scan USB barcode or enter number..."
                    value={scannerCode}
                    onChange={(e) => setScannerCode(e.target.value)}
                    className="font-mono text-sm bg-slate-50"
                  />
                  <Button type="submit" disabled={scannerLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                    {scannerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Scan Result Card */}
            {scannedResult && (
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2 animate-in fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{String(scannedResult.name)}</div>
                    {Boolean(scannedResult.display_name) && String(scannedResult.display_name) !== String(scannedResult.name) && (
                      <div className="text-xs text-purple-700 font-medium">{String(scannedResult.display_name)}</div>
                    )}
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      SKU: {String(scannedResult.sku)} • BC: {String(scannedResult.barcode)}
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono">
                    {Number(scannedResult.stock_on_hand || 0).toFixed(0)} {String(scannedResult.uom || "pcs")}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-200 text-xs">
                  <div>
                    <span className="text-slate-500">Cost:</span>{" "}
                    <span className="font-semibold">₹{Number(scannedResult.cost_price || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Price:</span>{" "}
                    <span className="font-bold text-purple-900">₹{Number(scannedResult.selling_price || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">MRP:</span>{" "}
                    <span className="font-semibold">₹{Number(scannedResult.mrp || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IMPORT CSV MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Bulk Import Products via CSV
              </h2>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>Paste CSV rows with the following comma-separated order:</p>
              <div className="p-2 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-700">
                Product Name, Selling Price, Cost Price, SKU, Barcode, Category, Stock
              </div>
              <p className="text-[11px] text-slate-400">
                Example: Royal Basmati Rice 10kg, 850, 780, SKU-BAS-10, 8901234, Rice, 40
              </p>
            </div>

            <textarea
              rows={8}
              placeholder="Paste CSV rows here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-blue-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(false)}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportBatch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={importing}
              >
                {importing ? "Importing Rows..." : "Import Catalog Records"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* A4 BARCODE & PRICE STICKER SHEET MODAL */}
      <BarcodeStickerSheetModal
        isOpen={isBarcodeStickerModalOpen}
        onClose={() => setIsBarcodeStickerModalOpen(false)}
        products={products.map((p) => {
          const primary = p.variants[0];
          return {
            id: p.id,
            name: p.name,
            display_name: p.display_name,
            sku: primary?.sku || p.code,
            barcode: primary?.barcode || null,
            mrp: primary?.mrp || primary?.selling_price || 0,
            selling_price: primary?.selling_price || 0,
            category: p.category,
          };
        })}
      />
    </div>
  );
}
