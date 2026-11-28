import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Trash2, ChevronDown } from 'lucide-react';
import { StockSplitRecord, SplitSkuOption } from '../types';
import { getStoredSkus } from '@/features/inventory/data/mockInventory';
import { computeLiveRealtimeSkus } from '@/features/inventory/utils/liveInventory';
import { fetchRealtimeInventory, executeStockSplit, type ApiRealtimeSku } from '@/lib/api/apiService';
import { getIstDateString } from '@/lib/utilities/istTime';
import { useAuthStore } from '@/stores/auth.store';
import { getInvoiceTemplateConfig } from '@/features/orders/utils/invoiceTemplateConfig';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
  onSuccess: (record: StockSplitRecord) => void;
}

interface SplitItemRow {
  uid: string;
  childId: string;
  sellingPrice: string;
  inQty: string;
}

interface SearchableItemDropdownProps {
  options: SplitSkuOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}

const SearchableItemDropdown: React.FC<SearchableItemDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = options.find((s) => String(s.id) === String(value));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 80);
    return options
      .filter((s) => s.name.toLowerCase().includes(q) || s.skuNo.toLowerCase().includes(q))
      .slice(0, 80);
  }, [options, query]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-2 text-left cursor-pointer"
      >
        <span className={`truncate ${selected ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search converted item..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">No matching SKUs</div>
            ) : (
              filtered.map((s) => {
                const isSelected = String(s.id) === String(value);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onChange(String(s.id));
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-600 text-white font-semibold' : 'text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    {s.name} (Stock: {s.stock})
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function createSplitRow(idx: number): SplitItemRow {
  return {
    uid: `split-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    childId: '',
    sellingPrice: '',
    inQty: '',
  };
}

export const WholesaleAddStockSplitView: React.FC<Props> = ({ onBack, onSuccess }) => {
  const user = useAuthStore((s) => s.user);
  const dcName = user?.organizationName || getInvoiceTemplateConfig().companyName || 'SIDDESHWAR ENTERPRISES';
  const operatorName = user?.fullName || 'Authorized Staff';
  const todayIso = getIstDateString();

  const [leftSearch, setLeftSearch] = useState('');
  const [showAllItems, setShowAllItems] = useState(true);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [outQtyInput, setOutQtyInput] = useState<string>('');
  const [splitRows, setSplitRows] = useState<SplitItemRow[]>(() => [createSplitRow(0)]);

  const [shrinkageItemId, setShrinkageItemId] = useState<string>('');
  const [shrinkagePrice, setShrinkagePrice] = useState<string>('');
  const [shrinkageQtyInput, setShrinkageQtyInput] = useState<string>('');

  const [liveApiSkus, setLiveApiSkus] = useState<ApiRealtimeSku[] | null>(null);

  useEffect(() => {
    fetchRealtimeInventory()
      .then((rows) => {
        if (rows.length > 0) setLiveApiSkus(rows);
      })
      .catch(() => {});
  }, []);

  const skuOptions: SplitSkuOption[] = useMemo(() => {
    if (liveApiSkus && liveApiSkus.length > 0) {
      return liveApiSkus.map((s) => ({
        id: s.variantId || s.id,
        skuNo: s.code || String(s.id),
        name: s.name,
        category: s.category || 'General',
        stock: s.available ?? s.closing,
        cost: s.cost,
        price: s.price,
        uom: 'Unit',
      }));
    }
    const liveSkus = computeLiveRealtimeSkus(getStoredSkus(), todayIso);
    return liveSkus.map((s) => ({
      id: s.id,
      skuNo: s.code || String(s.id),
      name: s.name,
      category: s.category || 'General',
      stock: s.available ?? s.closing,
      cost: s.cost,
      price: s.price,
      uom: 'Unit',
    }));
  }, [liveApiSkus, todayIso]);

  const leftFilteredSkus = useMemo(() => {
    const q = leftSearch.trim().toLowerCase();
    return skuOptions.filter((s) => {
      if (!showAllItems && s.stock <= 0 && !q) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.skuNo.toLowerCase().includes(q)
      );
    });
  }, [skuOptions, leftSearch, showAllItems]);

  const parentSku = useMemo(
    () => skuOptions.find((s) => String(s.id) === String(selectedParentId)),
    [skuOptions, selectedParentId]
  );

  const outQtyNum = Math.max(0, Number(outQtyInput) || 0);
  const totalInQty = splitRows.reduce((sum, r) => sum + Math.max(0, Number(r.inQty) || 0), 0);
  const shrinkageQtyNum = Math.max(0, Number(shrinkageQtyInput) || 0);
  const diffQty = Math.max(0, outQtyNum - (totalInQty > 0 ? outQtyNum : 0));

  const handleSelectParent = (sku: SplitSkuOption) => {
    setSelectedParentId(String(sku.id));
    setOutQtyInput('');
    setSplitRows([createSplitRow(0)]);
    setShrinkageItemId('');
    setShrinkagePrice('');
    setShrinkageQtyInput('');
  };

  const handleRowChange = (uid: string, patch: Partial<SplitItemRow>) => {
    setSplitRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentSku) {
      toast.error('Please select an item to split from the left list');
      return;
    }
    if (outQtyNum <= 0) {
      toast.error('Please enter Out Qty greater than 0');
      return;
    }

    const validRows = splitRows.filter((r) => r.childId && (Number(r.inQty) || 0) > 0);
    if (validRows.length === 0) {
      toast.error('Please select a Converted Item and enter In Qty');
      return;
    }

    const mappedItems: Array<{
      childSku: SplitSkuOption;
      inQty: number;
      sellingPrice: number;
    }> = [];
    for (const row of validRows) {
      const childSku = skuOptions.find((s) => String(s.id) === String(row.childId));
      if (!childSku) continue;
      if (String(childSku.id) === String(parentSku.id)) {
        toast.error('Converted item must be different from the main item');
        return;
      }
      mappedItems.push({
        childSku,
        inQty: Number(row.inQty) || 0,
        sellingPrice: Number(row.sellingPrice) || 0,
      });
    }

    if (mappedItems.length === 0) return;

    let voucherId = `SP${Date.now().toString(36).toUpperCase()}`;
    try {
      const res = await executeStockSplit({
        parent_variant_id: typeof parentSku.id === 'string' ? parentSku.id : undefined,
        parent_sku_name: parentSku.name,
        out_qty: outQtyNum,
        items: mappedItems.map((m) => ({
          child_variant_id: typeof m.childSku.id === 'string' ? m.childSku.id : undefined,
          child_sku_name: m.childSku.name,
          in_qty: m.inQty,
          selling_price: m.sellingPrice > 0 ? m.sellingPrice : undefined,
        })),
        shrinkage_qty: shrinkageQtyNum,
        notes: `Standard stock split ${parentSku.name} → ${mappedItems.map((m) => `${m.inQty}x ${m.childSku.name}`).join(', ')}`,
      });
      if (res?.voucher_id) voucherId = res.voucher_id;
    } catch {
      toast.error('Failed to save stock split to Railway database');
      return;
    }

    const totalCost = outQtyNum * parentSku.cost;
    const totalConverted = mappedItems.reduce((s, m) => s + m.inQty, 0);
    const allocatedUnitCost = totalConverted > 0 ? totalCost / totalConverted : 0;
    const firstChild = mappedItems[0]?.childSku;
    if (!firstChild) return;

    const newRecord: StockSplitRecord = {
      id: voucherId,
      date: todayIso,
      dcName,
      parentSkuId: parentSku.id,
      parentSkuNo: parentSku.skuNo,
      parentItemName: parentSku.name,
      parentCategory: parentSku.category,
      parentGrnPrice: parentSku.cost,
      splitQty: outQtyNum,
      childSkuId: firstChild.id,
      childSkuNo: firstChild.skuNo,
      childItemName:
        mappedItems.length > 1
          ? mappedItems.map((m) => `${m.inQty}x ${m.childSku.name}`).join(', ')
          : firstChild.name,
      childCategory: firstChild.category,
      convertedQty: totalConverted,
      splitGrnPrice: Math.round(allocatedUnitCost * 100) / 100,
      shrinkageQty: shrinkageQtyNum,
      operatorName,
      notes: `Standard stock split ${parentSku.name} → ${mappedItems.map((m) => `${m.inQty}x ${m.childSku.name}`).join(', ')}`,
      createdAt: new Date().toISOString(),
    };
    window.dispatchEvent(new Event('inventory_updated'));
    onSuccess(newRecord);
    toast.success('Stock split saved to Railway DB & Inventory updated!');
    onBack();
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16">
      {/* Top Back Button & Breadcrumb matching reference */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d1b4c] hover:bg-[#1a2d6d] text-white text-xs font-bold shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="text-xs text-slate-500">
          <button type="button" onClick={onBack} className="text-blue-600 hover:underline cursor-pointer">
            Stock-Split
          </button>{' '}
          / <span className="text-slate-700 font-medium">Add Stock Split</span>
        </div>
        <h1 className="text-xl font-bold text-[#0f2d59]">Add Stock Split</h1>
      </div>

      {/* Two-Panel Layout matching reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Panel: Search items + Show all items + Scrollable SKU list */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items"
              value={leftSearch}
              onChange={(e) => setLeftSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAllItems}
              onChange={(e) => setShowAllItems(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Show all items
          </label>

          <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
            {leftFilteredSkus.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No items found</div>
            ) : (
              leftFilteredSkus.map((s) => {
                const isSelected = String(s.id) === String(selectedParentId);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectParent(s)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="text-xs font-semibold text-blue-700">{s.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {s.category} STOCK : {s.stock}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Prompt or Split Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {!parentSku ? (
            <p className="text-xs text-slate-600 py-2">Search and select the item to split.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Item Header */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Item : {parentSku.name}</span>
                  <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Box → split in Pkt / Pcs
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Stock: <b>{parentSku.stock}</b> · GRN price <b>{parentSku.cost}</b>
                </div>
                <button
                  type="button"
                  onClick={() => setSplitRows((prev) => [...prev, createSplitRow(prev.length)])}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-full cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add split item
                </button>
              </div>

              {/* Out Qty */}
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Out Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter qty"
                  value={outQtyInput}
                  onChange={(e) => setOutQtyInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Split Item Cards */}
              <div className="space-y-3">
                {splitRows.map((row, idx) => {
                  const autoGrn =
                    outQtyNum > 0 && totalInQty > 0
                      ? ((outQtyNum * parentSku.cost) / totalInQty).toFixed(2)
                      : 'auto';
                  return (
                    <div
                      key={row.uid}
                      className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/40 relative"
                    >
                      {splitRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSplitRows((prev) => prev.filter((r) => r.uid !== row.uid))}
                          className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove split item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Converted Item <span className="text-rose-500">*</span>
                          </label>
                          <SearchableItemDropdown
                            options={skuOptions.filter((s) => String(s.id) !== String(parentSku.id))}
                            value={row.childId}
                            onChange={(id) => {
                              const picked = skuOptions.find((s) => String(s.id) === id);
                              handleRowChange(row.uid, {
                                childId: id,
                                sellingPrice: picked && picked.price > 0 ? String(picked.price) : row.sellingPrice,
                              });
                            }}
                            placeholder={idx === 0 ? 'Select item' : 'Select item'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            GRN price (from main SKU)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={autoGrn}
                            className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Selling Price <span className="text-rose-500">*</span>{' '}
                            <span className="font-normal text-[11px] text-slate-500">
                              (main selling converted ÷ ₹1)
                            </span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter selling price"
                            value={row.sellingPrice}
                            onChange={(e) => handleRowChange(row.uid, { sellingPrice: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            In Qty <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Enter qty"
                            value={row.inQty}
                            onChange={(e) => handleRowChange(row.uid, { inQty: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Plus Circle Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setSplitRows((prev) => [...prev, createSplitRow(prev.length)])}
                  className="w-7 h-7 rounded-full bg-[#0d1b4c] hover:bg-[#1a2d6d] text-white inline-flex items-center justify-center shadow-sm cursor-pointer"
                  title="Add another split item"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Shrinkage & Difference in stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Shrinkage Item</label>
                  <select
                    value={shrinkageItemId}
                    onChange={(e) => setShrinkageItemId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No shrinkage</option>
                    {skuOptions.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Shrinkage price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter item price"
                    value={shrinkagePrice}
                    onChange={(e) => setShrinkagePrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Shrinkage Qty</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    value={shrinkageQtyInput}
                    onChange={(e) => setShrinkageQtyInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Difference in stock</label>
                  <input
                    type="text"
                    readOnly
                    value={`${diffQty} Box ✓`}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold"
                  />
                </div>
              </div>

              {/* Balance Summary Bar */}
              <div className="bg-rose-50/70 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-lg text-xs font-semibold">
                Main item: {outQtyNum} Out · Split items total: {totalInQty} Pcs
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-full shadow-sm cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
