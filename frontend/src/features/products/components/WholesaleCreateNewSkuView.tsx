import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredSkuProducts,
  saveStoredSkuProducts,
  type SkuProduct,
} from "../data/mockProducts";

export function WholesaleCreateNewSkuView() {
  const navigate = useNavigate();
  const [skus, setSkus] = useState<SkuProduct[]>(() => getStoredSkuProducts());

  // Form State
  const [name, setName] = useState("");
  const [kannadaName, setKannadaName] = useState("");
  const [imageName, setImageName] = useState("");
  const [category, setCategory] = useState("");
  const [hsn, setHsn] = useState("");
  const [gst, setGst] = useState("5");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("0");
  const [min, setMin] = useState("0");

  const categories = [
    "Atta And Sooji Flours",
    "Oil And Ghee",
    "RICE",
    "Rice",
    "Soaps Detergents And Toiletries",
    "Biscuits Beverages And Confectionaries",
    "Jaggery Sugar And Salt",
    "Cereals and Pulses",
    "Electronics And Home Appliances",
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageName(e.target.files[0].name);
    }
  };

  const handleSaveSku = (e: React.FormEvent) => {
    e.preventDefault();
    const trimName = name.trim();
    if (!trimName) {
      toast.error("Enter the SKU name");
      return;
    }

    if (skus.some((s) => s.name.toLowerCase() === trimName.toLowerCase())) {
      toast.error("An SKU with this name already exists");
      return;
    }

    const costNum = parseFloat(cost);
    const priceNum = parseFloat(price);

    if (isNaN(costNum) || costNum <= 0) {
      toast.error("Enter a valid GRN cost price");
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Enter a valid selling price");
      return;
    }

    if (priceNum < costNum) {
      toast.error("Selling rate is less than GRN price");
      return;
    }

    const newId = skus.length ? Math.max(...skus.map((s) => s.id)) + 1 : 1;
    const newSku: SkuProduct = {
      id: newId,
      name: trimName,
      kannadaName: kannadaName.trim() || undefined,
      code: `SKU-${newId.toString().padStart(3, "0")}`,
      category: category.trim() || "Atta And Sooji Flours",
      hsn: hsn.trim(),
      gst: parseInt(gst) || 0,
      cost: costNum,
      price: priceNum,
      mrp: mrp ? parseFloat(mrp) : undefined,
      stock: parseInt(stock) || 0,
      min: parseInt(min) || 0,
      status: "Active",
      added: new Date().toISOString().slice(0, 10),
    };

    const updated = [newSku, ...skus];
    setSkus(updated);
    saveStoredSkuProducts(updated);

    toast.success(`SKU ${trimName} created successfully`);
    navigate("/products?tab=list");
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate("/products?tab=list")}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <span className="text-xs text-slate-500 font-medium">Add New SKU to Catalog</span>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Create new SKU</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Opening stock counts from today. Change stock later with Adjust in Realtime Inventory.
        </p>
      </div>

      {/* Main Creation Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-2xl">
        <form onSubmit={handleSaveSku} className="space-y-4">
          {/* SKU Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SKU name <i className="text-rose-500">*</i>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tata Salt 1kg × 25 bag"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Kannada Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kannada name (auto — edit if wrong)
            </label>
            <input
              type="text"
              placeholder="ಕನ್ನಡ ಹೆಸರು"
              value={kannadaName}
              onChange={(e) => setKannadaName(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* SKU Image */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SKU image (shows in cart)
            </label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition">
                <Upload className="w-3.5 h-3.5" />
                Choose File
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <span className="text-xs text-slate-500">{imageName || "No file chosen"}</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <i className="text-rose-500">*</i>
            </label>
            <input
              list="categories-list"
              required
              placeholder="Pick or type a category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            />
            <datalist id="categories-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* HSN & GST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HSN code</label>
              <input
                type="text"
                placeholder="e.g. 2501"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST %</label>
              <select
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {[0, 3, 5, 12, 18, 28].map((g) => (
                  <option key={g} value={g}>
                    {g}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GRN Price & Selling Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GRN price (incl. GST) <i className="text-rose-500">*</i>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Enter GRN price"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling rate (incl. GST) <i className="text-rose-500">*</i>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Enter selling rate"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 font-bold"
              />
            </div>
          </div>

          {/* MRP */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              MRP (optional, for discount badge)
            </label>
            <input
              type="number"
              step="any"
              placeholder="Enter MRP"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Opening & Minimum Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening stock</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum stock</label>
              <input
                type="number"
                min="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/products?tab=list")}
              className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold shadow-sm transition"
            >
              Save SKU
            </button>
          </div>
        </form>
      </div>

      {/* Recently Added Section */}
      <div className="max-w-2xl space-y-2 pt-2">
        <h3 className="text-sm font-bold text-slate-800">Recently added</h3>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2 px-3 border-r border-blue-700/50">SKU</th>
                <th className="py-2 px-3 border-r border-blue-700/50">HSN</th>
                <th className="py-2 px-3 border-r border-blue-700/50 text-center">GST</th>
                <th className="py-2 px-3 border-r border-blue-700/50 text-right">Price</th>
                <th className="py-2 px-3 border-r border-blue-700/50 text-right">Stock</th>
                <th className="py-2 px-3">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {skus.slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="py-2 px-3 border-r border-slate-100 font-medium">{s.name}</td>
                  <td className="py-2 px-3 border-r border-slate-100 text-slate-500 font-mono">
                    {s.hsn || "—"}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 text-center">{s.gst}%</td>
                  <td className="py-2 px-3 border-r border-slate-100 text-right font-medium">
                    ₹{s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-slate-800">
                    {s.stock}
                  </td>
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{s.added}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
