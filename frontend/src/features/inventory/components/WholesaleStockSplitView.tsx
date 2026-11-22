import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Plus, Search, Eye, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredStockSplits,
  saveStoredStockSplits,
  extractKgFromName,
  type StockSplitRecord,
  type ConvertedItem,
  type ShrinkageItem,
} from "../data/mockStockSplit";
import { getStoredSkus, saveStoredSkus, type InventorySku } from "../data/mockInventory";

export function WholesaleStockSplitView() {
  const navigate = useNavigate();

  const [splits, setSplits] = useState<StockSplitRecord[]>(() => getStoredStockSplits());
  const [skus, setSkus] = useState<InventorySku[]>(() => getStoredSkus());

  // Views: list vs add
  const [isAdding, setIsAdding] = useState(false);

  // Filter States for list view
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("2026-11-01");
  const [endDate, setEndDate] = useState("2026-11-22");
  const [appliedStartDate, setAppliedStartDate] = useState("2026-11-01");
  const [appliedEndDate, setAppliedEndDate] = useState("2026-11-22");
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  // View modal state
  const [viewingSplit, setViewingSplit] = useState<StockSplitRecord | null>(null);

  // Add Stock Split Form State
  const [addSearchItem, setAddSearchItem] = useState("");
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null);
  const [outQty, setOutQty] = useState("");
  const [convertedItems, setConvertedItems] = useState<
    { s: number | ""; q: string; p: string }[]
  >([{ s: "", q: "", p: "" }]);
  const [shrinkageItem, setShrinkageItem] = useState<{
    s: number | "";
    q: string;
    p: string;
  }>({ s: "", q: "", p: "" });

  const selectedSourceSku = useMemo(() => {
    return skus.find((s) => s.id === selectedSkuId) || null;
  }, [skus, selectedSkuId]);

  // Compute live stock difference in kg for the add form
  const diffCalculation = useMemo(() => {
    if (!selectedSourceSku) return { known: false, diffKg: 0 };
    const outNum = parseFloat(outQty) || 0;
    const sourceKgPerUnit = extractKgFromName(selectedSourceSku.name);

    let totalInKg = 0;
    let known = true;

    convertedItems.forEach((c) => {
      if (!c.s) return;
      const targetSku = skus.find((item) => item.id === c.s);
      if (!targetSku) return;
      const targetKg = extractKgFromName(targetSku.name);
      const inNum = parseFloat(c.q) || 0;
      totalInKg += inNum * targetKg;
    });

    let shrinkKg = 0;
    if (shrinkageItem.s) {
      const shSku = skus.find((item) => item.id === shrinkageItem.s);
      const shKgPerUnit = shSku ? extractKgFromName(shSku.name) : 1;
      const shNum = parseFloat(shrinkageItem.q) || 0;
      shrinkKg = shNum * shKgPerUnit;
    }

    const diffKg = Math.round((outNum * sourceKgPerUnit - totalInKg - shrinkKg) * 1000) / 1000;
    return { known, diffKg };
  }, [selectedSourceSku, outQty, convertedItems, shrinkageItem, skus]);

  // Filtered splits in date range
  const filteredSplits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return splits.filter((sp) => {
      if (sp.date < appliedStartDate || sp.date > appliedEndDate) return false;
      if (!q) return true;
      return (
        sp.name.toLowerCase().includes(q) ||
        String(sp.s).includes(q) ||
        sp.id.toLowerCase().includes(q)
      );
    });
  }, [splits, appliedStartDate, appliedEndDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSplits.length / itemsPerPage));
  const paginatedSplits = useMemo(() => {
    const start = page * itemsPerPage;
    return filteredSplits.slice(start, start + itemsPerPage);
  }, [filteredSplits, page]);

  // Add Item Search list
  const filteredAddSkus = useMemo(() => {
    const q = addSearchItem.toLowerCase().trim();
    return skus.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || String(s.id).includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [skus, addSearchItem]);

  const handleSelectSkuForSplit = (sku: InventorySku) => {
    setSelectedSkuId(sku.id);
    setOutQty("");
    setConvertedItems([{ s: "", q: "", p: "" }]);
    setShrinkageItem({ s: "", q: "", p: "" });
  };

  const handleAddConvertedRow = () => {
    setConvertedItems([...convertedItems, { s: "", q: "", p: "" }]);
  };

  const handleRemoveConvertedRow = (index: number) => {
    if (convertedItems.length === 1) return;
    setConvertedItems(convertedItems.filter((_, i) => i !== index));
  };

  const handleConvertedSkuChange = (index: number, skuIdNum: number) => {
    const targetSku = skus.find((s) => s.id === skuIdNum);
    setConvertedItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              s: skuIdNum,
              q: item.q,
              p: targetSku ? String(targetSku.cost) : item.p,
            }
          : item
      )
    );
  };

  const handleConvertedQtyChange = (index: number, val: string) => {
    setConvertedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, q: val } : item))
    );
  };

  const handleConvertedPriceChange = (index: number, val: string) => {
    setConvertedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, p: val } : item))
    );
  };

  const handleShrinkageSkuChange = (skuIdNum: number | "") => {
    const targetSku = skus.find((s) => s.id === skuIdNum);
    setShrinkageItem({
      ...shrinkageItem,
      s: skuIdNum,
      p: targetSku ? String(targetSku.cost) : "0",
    });
  };

  const handleLoadDateFilter = () => {
    if (startDate > endDate) {
      toast.error("Start date is after End date");
      return;
    }
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(0);
    toast.success("Data loaded");
  };

  const handleExport = () => {
    if (!filteredSplits.length) {
      toast.error("Nothing to export");
      return;
    }

    const csvRows = [
      [
        "Sl No",
        "Date",
        "Split No",
        "Dc Name",
        "SKU No",
        "Item Name",
        "Split Qty",
        "Split GRN Price",
        "Converted Items",
        "In Qty",
        "Shrinkage Item",
        "Shrinkage Qty",
        "Difference (kg)",
        "By",
      ],
      ...filteredSplits.map((sp, idx) => [
        idx + 1,
        sp.date,
        sp.id,
        sp.dc,
        sp.s,
        sp.name,
        sp.out,
        sp.grn,
        sp.conv.map((c) => c.name).join("; "),
        sp.conv.map((c) => c.q).join("; "),
        sp.shr ? sp.shr.name : "",
        sp.shr ? sp.shr.q : "",
        sp.diffKg != null ? sp.diffKg : "",
        sp.by,
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stock_Split_${appliedStartDate}_to_${appliedEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Stock split exported");
  };

  const handleSubmitSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceSku) {
      toast.error("Select the item to split");
      return;
    }

    const outNum = parseFloat(outQty);
    if (!outNum || outNum <= 0) {
      toast.error("Enter the Out Qty");
      return;
    }

    if (outNum > selectedSourceSku.closing) {
      toast.error(`Out Qty is more than the stock (${selectedSourceSku.closing})`);
      return;
    }

    const convList: ConvertedItem[] = [];
    for (const c of convertedItems) {
      if (!c.s) {
        toast.error("Select the Converted Item");
        return;
      }
      const qNum = parseFloat(c.q);
      if (!qNum || qNum <= 0) {
        toast.error("Enter the In Qty");
        return;
      }
      const pNum = parseFloat(c.p);
      if (isNaN(pNum) || pNum < 0) {
        toast.error("Enter the Converted Item price");
        return;
      }
      const targetSku = skus.find((item) => item.id === c.s);
      convList.push({
        s: Number(c.s),
        name: targetSku?.name || "Converted Item",
        q: qNum,
        p: pNum,
      });
    }

    let shrObj: ShrinkageItem | null = null;
    if (shrinkageItem.s) {
      const shQ = parseFloat(shrinkageItem.q);
      if (!shQ || shQ <= 0) {
        toast.error("Enter the Shrinkage Qty");
        return;
      }
      const shSku = skus.find((item) => item.id === shrinkageItem.s);
      shrObj = {
        s: Number(shrinkageItem.s),
        name: shSku?.name || "Shrinkage Item",
        q: shQ,
        p: parseFloat(shrinkageItem.p) || 0,
      };
    }

    // Create record
    const newSplit: StockSplitRecord = {
      id: "SP" + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString().slice(0, 10),
      at: new Date().toISOString(),
      dc: "SIDDESHWAR ENTERPRISES",
      s: selectedSourceSku.id,
      name: selectedSourceSku.name,
      out: outNum,
      grn: selectedSourceSku.cost,
      conv: convList,
      shr: shrObj,
      diffKg: diffCalculation.known ? diffCalculation.diffKg : null,
      by: "Vijaykumar Shantagiri",
      role: "Owner",
    };

    // Update inventory stocks in storage
    const updatedSkus = skus.map((s) => {
      if (s.id === selectedSourceSku.id) {
        return {
          ...s,
          closing: s.closing - outNum,
          splitOut: s.splitOut + outNum,
        };
      }
      const matchConv = convList.find((c) => c.s === s.id);
      if (matchConv) {
        return {
          ...s,
          closing: s.closing + matchConv.q,
          splitIn: s.splitIn + matchConv.q,
        };
      }
      return s;
    });

    saveStoredSkus(updatedSkus);
    setSkus(updatedSkus);

    const updatedSplits = [newSplit, ...splits];
    saveStoredStockSplits(updatedSplits);
    setSplits(updatedSplits);

    toast.success("Stock split saved");
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Breadcrumb & Back */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
              } else {
                navigate("/dashboard");
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <p className="text-xs text-slate-500 m-0">
            <span
              onClick={() => setIsAdding(false)}
              className="cursor-pointer hover:underline text-[#0f3aa8] font-medium"
            >
              Stock-Split
            </span>{" "}
            /{" "}
            <b className="text-slate-800">
              {isAdding ? "Add Stock Split" : "Standard Stock Split"}
            </b>
          </p>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          DC: <b className="text-slate-800">SIDDESHWAR ENTERPRISES</b>
        </span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">
        {isAdding ? "Add Stock Split" : "Stock Split"}
      </h1>

      {/* VIEW: ADD STOCK SPLIT (nxSpAddView) */}
      {isAdding ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Search & Item Selection */}
          <div className="md:col-span-5 bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search items"
                value={addSearchItem}
                onChange={(e) => setAddSearchItem(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-[68vh] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
              {filteredAddSkus.length === 0 ? (
                <p className="p-4 text-xs text-center text-slate-400">No items found.</p>
              ) : (
                filteredAddSkus.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSkuForSplit(s)}
                    className={`w-full text-left p-2.5 hover:bg-blue-50/50 transition flex flex-col ${
                      selectedSkuId === s.id
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : ""
                    }`}
                  >
                    <b className="text-xs text-slate-900 font-semibold leading-tight">
                      {s.name}
                    </b>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      {s.category} · <b className="text-slate-700">STOCK : {s.closing}</b>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Split Entry Form */}
          <div className="md:col-span-7 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            {!selectedSourceSku ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Search and select the item on the left to split.
              </div>
            ) : (
              <form onSubmit={handleSubmitSplit} className="space-y-4">
                {/* Header Information */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <p className="text-xs text-slate-800 font-semibold mb-0.5">
                    <b>Item :</b> {selectedSourceSku.name}
                  </p>
                  <span className="text-xs text-slate-500">
                    Stock : <b className="text-slate-800">{selectedSourceSku.closing}</b> · GRN
                    price{" "}
                    <b className="text-slate-800">
                      ₹{selectedSourceSku.cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </b>
                  </span>
                </div>

                {/* Out Qty */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Out Qty <i className="text-rose-500">*</i>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    placeholder="Enter qty"
                    value={outQty}
                    onChange={(e) => setOutQty(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Dynamic Converted Items */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Converted Items (Split In)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddConvertedRow}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Converted Item
                    </button>
                  </div>

                  {convertedItems.map((conv, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2 relative"
                    >
                      {convertedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveConvertedRow(idx)}
                          className="absolute right-2 top-2 text-rose-500 hover:text-rose-700 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Converted Item <i className="text-rose-500">*</i>
                          </label>
                          <select
                            required
                            value={conv.s}
                            onChange={(e) => handleConvertedSkuChange(idx, Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select item</option>
                            {skus
                              .filter((s) => s.id !== selectedSourceSku.id)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Converted Item price <i className="text-rose-500">*</i>
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Enter item price"
                            value={conv.p}
                            onChange={(e) => handleConvertedPriceChange(idx, e.target.value)}
                            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          In Qty <i className="text-rose-500">*</i>
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Enter qty"
                          value={conv.q}
                          onChange={(e) => handleConvertedQtyChange(idx, e.target.value)}
                          className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shrinkage Section */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Shrinkage & Stock Difference
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Shrinkage Item
                      </label>
                      <select
                        value={shrinkageItem.s}
                        onChange={(e) =>
                          handleShrinkageSkuChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">No shrinkage</option>
                        {skus.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Shrinkage price
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Enter item price"
                        value={shrinkageItem.p}
                        onChange={(e) =>
                          setShrinkageItem({ ...shrinkageItem, p: e.target.value })
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Shrinkage Qty
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Enter quantity"
                        value={shrinkageItem.q}
                        onChange={(e) =>
                          setShrinkageItem({ ...shrinkageItem, q: e.target.value })
                        }
                        className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Difference in stock
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={diffCalculation.known ? `${diffCalculation.diffKg} kg` : "—"}
                        className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* VIEW: STANDARD STOCK SPLIT LIST */
        <div className="space-y-4">
          {/* Top Bar Card: Search + Add Stock Split + Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="sp_q"
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAdding(true);
                  setSelectedSkuId(null);
                  setAddSearchItem("");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Stock Split
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          {/* Date Filter Card */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span>Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span>End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleLoadDateFilter}
              className="px-4 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold shadow-sm transition"
            >
              Load
            </button>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-blue-700/50 w-16 text-center">
                      Sl No
                    </th>
                    <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[180px]">
                      Dc Name
                    </th>
                    <th className="py-2.5 px-3 border-r border-blue-700/50 w-24">SKU No</th>
                    <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[240px]">
                      Item Name
                    </th>
                    <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-28">
                      Split Qty
                    </th>
                    <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-36">
                      Split GRN Price
                    </th>
                    <th className="py-2.5 px-3 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedSplits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No stock split in this date range.
                      </td>
                    </tr>
                  ) : (
                    paginatedSplits.map((sp, idx) => (
                      <tr key={sp.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-500">
                          {page * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-medium text-slate-800">
                          {sp.dc}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-600">
                          {sp.s}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900">
                          {sp.name}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-right font-bold text-amber-700">
                          {sp.out}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-right font-medium text-slate-900 whitespace-nowrap">
                          ₹{sp.grn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setViewingSplit(sp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition"
                            title="View"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
              <span>Items per page: 10</span>
              <div className="flex items-center gap-3">
                <span>
                  {filteredSplits.length
                    ? `${page * itemsPerPage + 1} – ${Math.min(
                        filteredSplits.length,
                        (page + 1) * itemsPerPage
                      )} of ${filteredSplits.length}`
                    : "0 - 0 of 0"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(0)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-100"
                  >
                    |‹
                  </button>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-100"
                  >
                    ‹
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-100"
                  >
                    ›
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(totalPages - 1)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-100"
                  >
                    ›|
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Split View Modal */}
      {viewingSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-[#0f2d59] px-4 py-3 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Stock split · {viewingSplit.id}</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {new Date(viewingSplit.at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {viewingSplit.dc} · by {viewingSplit.by}
                </p>
              </div>
              <button
                onClick={() => setViewingSplit(null)}
                className="text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1e40af] text-white uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2 px-3 border-r border-blue-700/50">Type</th>
                    <th className="py-2 px-3 border-r border-blue-700/50">SKU No</th>
                    <th className="py-2 px-3 border-r border-blue-700/50 min-w-[180px]">
                      Item Name
                    </th>
                    <th className="py-2 px-3 border-r border-blue-700/50 text-right">Qty</th>
                    <th className="py-2 px-3 border-r border-blue-700/50 text-right">Price</th>
                    <th className="py-2 px-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {/* Split Out */}
                  <tr className="bg-rose-50/40">
                    <td className="py-2 px-3 border-r border-slate-100 font-bold text-rose-600">
                      Split Out
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-mono">
                      {viewingSplit.s}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-medium">
                      {viewingSplit.name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-slate-900">
                      {viewingSplit.out}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right whitespace-nowrap">
                      ₹{viewingSplit.grn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right font-bold whitespace-nowrap text-rose-700">
                      ₹
                      {(viewingSplit.out * viewingSplit.grn).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>

                  {/* Split In Items */}
                  {viewingSplit.conv.map((c, i) => (
                    <tr key={i} className="bg-emerald-50/40">
                      <td className="py-2 px-3 border-r border-slate-100 font-bold text-emerald-700">
                        Split In
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 font-mono">{c.s}</td>
                      <td className="py-2 px-3 border-r border-slate-100 font-medium">{c.name}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-emerald-700">
                        {c.q}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right whitespace-nowrap">
                        ₹{c.p.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-bold whitespace-nowrap text-emerald-800">
                        ₹{(c.q * c.p).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {/* Shrinkage Item */}
                  {viewingSplit.shr && (
                    <tr className="bg-amber-50/40">
                      <td className="py-2 px-3 border-r border-slate-100 font-bold text-amber-700">
                        Shrinkage
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 font-mono">
                        {viewingSplit.shr.s}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 font-medium">
                        {viewingSplit.shr.name}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-amber-700">
                        {viewingSplit.shr.q}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right whitespace-nowrap">
                        ₹{viewingSplit.shr.p.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-bold whitespace-nowrap text-amber-800">
                        ₹
                        {(viewingSplit.shr.q * viewingSplit.shr.p).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <p className="text-xs text-slate-700 pt-1">
                Difference in stock:{" "}
                <b className="text-slate-900">
                  {viewingSplit.diffKg != null ? `${viewingSplit.diffKg} kg` : "—"}
                </b>
              </p>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingSplit(null)}
                className="px-4 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
