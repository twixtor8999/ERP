import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Plus, Search, Edit3 } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredSkuProducts,
  saveStoredSkuProducts,
  type SkuProduct,
} from "../data/mockProducts";

export function WholesaleSkuListView() {
  const navigate = useNavigate();
  const [skus, setSkus] = useState<SkuProduct[]>(() => getStoredSkuProducts());
  const [filterMode, setFilterMode] = useState<"active" | "inactive" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal State
  const [editingSku, setEditingSku] = useState<SkuProduct | null>(null);
  const [editName, setEditName] = useState("");
  const [editHsn, setEditHsn] = useState("");
  const [editGst, setEditGst] = useState("5");
  const [editPrice, setEditPrice] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editMin, setEditMin] = useState("");

  const activeCount = useMemo(() => skus.filter((s) => s.stock > 0).length, [skus]);
  const inactiveCount = useMemo(() => skus.filter((s) => s.stock <= 0).length, [skus]);

  const filteredSkus = useMemo(() => {
    return skus.filter((s) => {
      if (filterMode === "active" && s.stock <= 0) return false;
      if (filterMode === "inactive" && s.stock > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.hsn.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [skus, filterMode, searchQuery]);

  const handleToggleStatus = (skuId: number) => {
    const updated = skus.map((s) => {
      if (s.id === skuId) {
        const newStatus: "Active" | "Inactive" = s.status === "Active" ? "Inactive" : "Active";
        toast.success(`${s.name} marked as ${newStatus}`);
        return { ...s, status: newStatus };
      }
      return s;
    });
    setSkus(updated);
    saveStoredSkuProducts(updated);
  };

  const handleOpenEdit = (sku: SkuProduct) => {
    setEditingSku(sku);
    setEditName(sku.name);
    setEditHsn(sku.hsn || "");
    setEditGst(String(sku.gst || 5));
    setEditPrice(String(sku.price));
    setEditCost(String(sku.cost));
    setEditMin(String(sku.min || 0));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSku) return;

    const p = parseFloat(editPrice) || 0;
    const c = parseFloat(editCost) || 0;
    const m = parseInt(editMin) || 0;
    const g = parseInt(editGst) || 0;

    const updated = skus.map((s) => {
      if (s.id === editingSku.id) {
        return {
          ...s,
          name: editName,
          hsn: editHsn,
          gst: g,
          price: p,
          cost: c,
          min: m,
        };
      }
      return s;
    });

    setSkus(updated);
    saveStoredSkuProducts(updated);
    toast.success(`SKU ${editName} updated successfully`);
    setEditingSku(null);
  };

  const handleExport = () => {
    const csvRows = [
      [
        "SKU Name",
        "Category",
        "Status",
        "GRN Price (incl. GST)",
        "Selling Price (incl. GST)",
        "Margin per unit",
        "Margin %",
        "HSN",
        "GST %",
        "Current Stock",
        "Min Stock",
      ],
      ...filteredSkus.map((s) => {
        const margin = s.price - s.cost;
        const marginPc = s.price > 0 ? ((margin / s.price) * 100).toFixed(1) + "%" : "0%";
        return [
          s.name,
          s.category,
          s.status,
          s.cost,
          s.price,
          margin.toFixed(2),
          marginPc,
          s.hsn,
          s.gst + "%",
          s.stock,
          s.min,
        ];
      }),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SKU_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("SKU list exported");
  };

  // Dedicated 2nd Page: Edit SKU (0 overlay modals)
  if (editingSku) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto font-sans antialiased text-slate-800 animate-in fade-in duration-150 pb-16">
        <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setEditingSku(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to SKU List
          </button>
          <span className="text-xs text-slate-500 font-mono">SKU ID: {editingSku.id}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#0f2d59] px-6 py-4 text-white flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Edit SKU – {editingSku.name}</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Update product specifications, tax rates, GRN cost, and selling price
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold bg-white/20 rounded-md font-mono">
              {editingSku.code || "SKU"}
            </span>
          </div>

          <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                SKU Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={editHsn}
                  onChange={(e) => setEditHsn(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  GST Rate (%)
                </label>
                <select
                  value={editGst}
                  onChange={(e) => setEditGst(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                >
                  {[0, 3, 5, 12, 18, 28].map((g) => (
                    <option key={g} value={g}>
                      {g}% GST
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  GRN Price (Cost incl. GST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Selling Rate (incl. GST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-blue-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Minimum Stock Alert
              </label>
              <input
                type="number"
                value={editMin}
                onChange={(e) => setEditMin(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSku(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back and Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">SKU List</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          All items, A to Z. GRN price and selling price both include GST. Margin % = (selling price − GRN
          price) ÷ selling price. GST % and HSN as per your SKU file.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-5 top-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Filter Tabs & Create SKU Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Active (stock) */}
          <button
            onClick={() => setFilterMode("active")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
              filterMode === "active"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            Active (stock) <b>{activeCount}</b>
          </button>

          {/* Inactive (no stock) */}
          <button
            onClick={() => setFilterMode("inactive")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
              filterMode === "inactive"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
            Inactive (no stock) <b>{inactiveCount}</b>
          </button>

          {/* All */}
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
              filterMode === "all"
                ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            All <b>{skus.length}</b>
          </button>
        </div>

        <button
          onClick={() => navigate("/products?tab=create")}
          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Create new SKU
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[220px]">SKU Name</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-center w-28">Status</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[180px]">Category</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">
                  GRN Price
                  <div className="text-[9px] font-normal lowercase">incl. GST</div>
                </th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">
                  Selling Price
                  <div className="text-[9px] font-normal lowercase">incl. GST</div>
                </th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-center">HSN</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-center">GST</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Stock</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Min</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">Margin %</th>
                <th className="py-2.5 px-2.5 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    No SKUs found.
                  </td>
                </tr>
              ) : (
                filteredSkus.map((s) => {
                  const margin = s.price - s.cost;
                  const marginPc = s.price > 0 ? (margin / s.price) * 100 : 0;
                  const isActive = s.status === "Active";

                  return (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-2 px-3 border-r border-slate-100 font-semibold text-slate-900">
                        {s.name}
                        {s.kannadaName && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {s.kannadaName}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s.status}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(s.id)}
                          className="block mx-auto mt-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                        >
                          {isActive ? "Make Inactive" : "Make Active"}
                        </button>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-slate-600">
                        {s.category}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-right font-medium text-slate-800 whitespace-nowrap">
                        ₹{s.cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-right font-semibold text-slate-900 whitespace-nowrap">
                        ₹{s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-center font-mono text-slate-500">
                        {s.hsn || "—"}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-center">
                        {s.gst}%
                      </td>
                      <td className="py-2 px-2 border-r border-slate-100 text-right font-bold text-slate-800">
                        {s.stock}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-100 text-right text-slate-500">
                        {s.min}
                      </td>
                      <td
                        className={`py-2 px-2.5 border-r border-slate-100 text-right font-bold ${
                          marginPc <= 0 ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {marginPc.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* End of SKU Table */}
    </div>
  );
}
