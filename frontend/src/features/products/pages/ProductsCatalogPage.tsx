import { useState, useEffect } from "react";
import { Package, Plus, Search, Tag, Barcode, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Variant {
  id: string;
  variant_name: string;
  sku: string;
  barcode: string | null;
  cost_price: number;
  selling_price: number;
  mrp: number;
}

interface ProductItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: string;
  category_id: string | null;
  uom: string;
  tax: string;
  is_active: boolean;
  variants: Variant[];
}

export function ProductsCatalogPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [taxes, setTaxes] = useState<{ id: string; description: string; percentage: string }[]>([]);
  const [uoms, setUoms] = useState<{ id: string; name: string; symbol: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [uomId, setUomId] = useState("");
  const [taxConfigId, setTaxConfigId] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, taxesRes, uomsRes] = await Promise.all([
        apiClient.get("/admin/products", { params: { search: search || undefined, category_id: selectedCategory || undefined } }),
        apiClient.get("/admin/categories"),
        apiClient.get("/admin/taxes"),
        apiClient.get("/admin/uoms"),
      ]);
      setProducts(prodsRes.data);
      setCategories(catsRes.data);
      setTaxes(taxesRes.data);
      setUoms(uomsRes.data);
    } catch {
      toast.error("Failed to load product catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !sku || !sellingPrice) {
      toast.error("Validation Error", { description: "Please fill all mandatory fields (Name, Code, SKU, Selling Price)" });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/admin/products", {
        name,
        code,
        category_id: categoryId || null,
        uom_id: uomId || null,
        tax_config_id: taxConfigId || null,
        description: description || null,
        initial_variant: {
          variant_name: "Standard",
          sku,
          barcode: barcode || null,
          cost_price: parseFloat(costPrice) || 0,
          selling_price: parseFloat(sellingPrice),
          mrp: parseFloat(sellingPrice),
        },
      });
      toast.success("Product Created", { description: `${name} (${sku}) added to catalog.` });
      setIsModalOpen(false);
      // Reset
      setName("");
      setCode("");
      setSku("");
      setBarcode("");
      setSellingPrice("");
      setCostPrice("0");
      setDescription("");
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Products & Master Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage central product master records, SKU barcodes, GST tax rules, and branch selling prices.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Product SKU
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search by product name, code, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 text-sm"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 font-medium"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading product master catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No products found</p>
            <p className="text-xs text-slate-400 mt-1">Add your first SKU using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Primary SKU & Barcode</th>
                  <th className="py-3 px-4">Tax & UOM</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => {
                  const primaryVar = p.variants[0];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{p.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {p.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="text-slate-800 font-bold">{primaryVar?.sku || "NO-SKU"}</div>
                        {primaryVar?.barcode && (
                          <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                            <Barcode className="w-3 h-3" /> {primaryVar.barcode}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div>{p.tax}</div>
                        <div className="text-slate-400">{p.uom}</div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        ₹{(primaryVar?.cost_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{(primaryVar?.selling_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Add New Master Product
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Product Name *</label>
                  <Input
                    required
                    placeholder="e.g. Basmati Rice Royal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Product Code *</label>
                  <Input
                    required
                    placeholder="e.g. PROD-BASMATI-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    aria-label="Category"
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
                    aria-label="Unit of measure"
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">GST Tax Rate</label>
                  <select
                    value={taxConfigId}
                    onChange={(e) => setTaxConfigId(e.target.value)}
                    aria-label="GST Tax Rate"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                  >
                    <option value="">Select Tax</option>
                    {taxes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.description} ({t.percentage})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Initial SKU Variant & Pricing
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">SKU Identifier *</label>
                    <Input
                      required
                      placeholder="e.g. SKU-BASMATI-5KG"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Barcode / EAN</label>
                    <Input
                      placeholder="e.g. 8901234567890"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      placeholder="350.00"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                  {submitting ? "Saving SKU..." : "Save Product SKU"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
