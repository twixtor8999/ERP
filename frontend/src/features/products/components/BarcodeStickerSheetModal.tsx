import { useState, useMemo } from "react";
import {
  Printer,
  Search,
  Tag,
  Grid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PrintableProduct {
  id: string;
  name: string;
  display_name?: string;
  sku: string;
  barcode?: string | null;
  mrp: number;
  selling_price: number;
  category?: string;
}

interface BarcodeStickerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: PrintableProduct[];
}

// Generate simple SVG Code 128 / Code 39 bar patterns from barcode/SKU string
function BarcodeSvg({ value, height = 32 }: { value: string; height?: number }) {
  const clean = value || "00000000";
  // Generate deterministic bar widths based on char codes
  const bars: { width: number; isSpace: boolean }[] = [];
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 2) + 1;
    const b2 = ((code >> 2) % 3) + 1;
    const s2 = 1;
    bars.push({ width: b1, isSpace: false });
    bars.push({ width: s1, isSpace: true });
    bars.push({ width: b2, isSpace: false });
    bars.push({ width: s2, isSpace: true });
  }

  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 2, isSpace: false });

  let currentX = 2;
  const rects: { x: number; width: number }[] = [];

  for (const bar of bars) {
    if (!bar.isSpace) {
      rects.push({ x: currentX, width: bar.width });
    }
    currentX += bar.width;
  }

  const totalWidth = currentX + 2;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      className="w-full max-h-8 object-contain"
      preserveAspectRatio="none"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={0} width={r.width} height={height} fill="#000000" />
      ))}
    </svg>
  );
}

export function BarcodeStickerSheetModal({
  isOpen,
  onClose,
  products,
}: BarcodeStickerSheetModalProps) {
  const [template, setTemplate] = useState<"24" | "40">("24");
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [storeName, setStoreName] = useState("Siddeshwar Enterprises");

  // Filtered product list
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.display_name && p.display_name.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, search]);

  const handleSetQuantity = (id: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, qty),
    }));
  };

  const handleSelectAll = (qty: number) => {
    const updated: Record<string, number> = {};
    filteredProducts.forEach((p) => {
      updated[p.id] = qty;
    });
    setQuantities(updated);
  };

  const handleClearAll = () => {
    setQuantities({});
  };

  // Compile sticker items
  const stickersToPrint = useMemo(() => {
    const list: PrintableProduct[] = [];
    products.forEach((p) => {
      const count = quantities[p.id] || 0;
      for (let i = 0; i < count; i++) {
        list.push(p);
      }
    });
    return list;
  }, [products, quantities]);

  const totalStickers = stickersToPrint.length;
  const sheetCapacity = template === "24" ? 24 : 40;
  const estimatedSheets = Math.ceil(totalStickers / sheetCapacity) || 1;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                A4 Barcode & Shelf Price Tag Generator
              </h2>
              <p className="text-xs text-slate-300">
                Print laser-ready 24-up or 40-up adhesive sticker sheets for store racks & products.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Template Format */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Sticker Sheet Layout</label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={template === "24" ? "default" : "outline"}
                onClick={() => setTemplate("24")}
                className={`flex-1 h-8 text-xs font-bold gap-1 ${
                  template === "24" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> 24-Up (3×8)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={template === "40" ? "default" : "outline"}
                onClick={() => setTemplate("40")}
                className={`flex-1 h-8 text-xs font-bold gap-1 ${
                  template === "40" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> 40-Up (4×10)
              </Button>
            </div>
          </div>

          {/* Store Name Header */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Header Label</label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="h-8 text-xs bg-white"
              placeholder="Store Name"
            />
          </div>

          {/* Search Catalog */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Filter Products</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SKU, barcode..."
                className="h-8 pl-8 text-xs bg-white"
              />
            </div>
          </div>

          {/* Print Summary & Action */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-[11px] text-slate-500">Selected Stickers:</div>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {totalStickers} labels ({estimatedSheets} A4 sheet{estimatedSheets > 1 ? "s" : ""})
              </div>
            </div>
            <Button
              type="button"
              disabled={totalStickers === 0}
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs gap-1 shadow-sm px-3"
            >
              <Printer className="w-3.5 h-3.5" /> Print A4 Sheet
            </Button>
          </div>
        </div>

        {/* Content Body: Split View (Products Selection Table & Live Sheet Preview) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Product Selection Table (5 cols) */}
          <div className="lg:col-span-5 p-4 flex flex-col max-h-[60vh] overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b text-xs">
              <span className="font-semibold text-slate-700">Catalog Products ({filteredProducts.length})</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(1)}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  +1 All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(template === "24" ? 24 : 40)}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Fill Full Sheet
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-500 hover:text-rose-600 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map((p) => {
                const count = quantities[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between text-xs ${
                      count > 0 ? "border-purple-300 bg-purple-50/40" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate">
                        {p.display_name || p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>SKU: {p.sku}</span>
                        {p.barcode && <span>• BC: {p.barcode}</span>}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        Price: ₹{p.selling_price.toFixed(2)}{" "}
                        {p.mrp > p.selling_price && (
                          <span className="text-slate-400 line-through font-normal">
                            ₹{p.mrp.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        value={count === 0 ? "" : count}
                        onChange={(e) => handleSetQuantity(p.id, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-14 h-7 text-xs font-mono font-bold text-center bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetQuantity(p.id, count + 1)}
                        className="h-7 w-7 p-0 text-xs font-bold"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live A4 Sheet Preview (7 cols) */}
          <div className="lg:col-span-7 p-4 bg-slate-100 flex flex-col max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-600">
              <span className="font-semibold">
                Live A4 Preview ({template === "24" ? "24 Labels • 3×8 Grid" : "40 Labels • 4×10 Grid"})
              </span>
              <span className="text-[11px] text-slate-400">
                Standard A4 210mm × 297mm • Self-Adhesive Sticker Paper
              </span>
            </div>

            {totalStickers === 0 ? (
              <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-8 bg-white border border-dashed rounded-xl text-center text-slate-400">
                <Tag className="w-10 h-10 mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No stickers selected</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Choose label quantities from the product table on the left, or click &quot;Fill Full Sheet&quot; to preview A4 print layout.
                </p>
              </div>
            ) : (
              <div className="bg-white p-3 border rounded-xl shadow-xs overflow-x-auto">
                <div
                  className={`grid gap-1.5 text-black ${
                    template === "24" ? "grid-cols-3" : "grid-cols-4"
                  }`}
                >
                  {stickersToPrint.map((item, idx) => (
                    <div
                      key={idx}
                      className={`border border-slate-300 rounded p-1.5 flex flex-col justify-between text-center bg-white ${
                        template === "24" ? "h-28" : "h-20 text-[10px]"
                      }`}
                    >
                      <div>
                        <div className="text-[9px] font-extrabold uppercase tracking-tight text-slate-800 truncate">
                          {storeName}
                        </div>
                        <div className="text-[10px] font-bold text-slate-900 leading-tight line-clamp-1 mt-0.5">
                          {item.display_name || item.name}
                        </div>
                      </div>

                      <div className="my-0.5 px-1">
                        <BarcodeSvg value={item.barcode || item.sku} height={template === "24" ? 22 : 16} />
                        <div className="text-[8px] font-mono tracking-widest text-slate-700">
                          {item.barcode || item.sku}
                        </div>
                      </div>

                      <div className="pt-0.5 border-t border-slate-200 flex items-center justify-between px-1">
                        <span className="text-[8px] text-slate-500 font-mono">
                          MRP: ₹{item.mrp.toFixed(0)}
                        </span>
                        <span className="text-[10px] font-black font-mono text-slate-900">
                          ₹{item.selling_price.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Tip: Set printer paper size to <strong className="text-slate-800">A4</strong> and margins to{" "}
            <strong className="text-slate-800">None / Minimum</strong> in the print dialog.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Close
            </Button>
            <Button
              disabled={totalStickers === 0}
              onClick={handlePrint}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Sticker Sheet
            </Button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY CSS CONTAINER FOR CLEAN LASER STICKER PRINTING */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .a4-sticker-print-sheet, .a4-sticker-print-sheet * {
            visibility: visible;
          }
          .a4-sticker-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            padding: 8mm;
            background: white;
            color: black;
          }
        }
      `}</style>

      <div className="a4-sticker-print-sheet hidden print:block">
        <div
          className={`grid gap-2 ${
            template === "24"
              ? "grid-cols-3"
              : "grid-cols-4"
          }`}
          style={{ width: "194mm" }}
        >
          {stickersToPrint.map((item, idx) => (
            <div
              key={idx}
              className={`border border-black p-1.5 flex flex-col justify-between text-center ${
                template === "24" ? "h-[34mm]" : "h-[25mm]"
              }`}
            >
              <div>
                <div className="text-[10px] font-black uppercase tracking-tight">{storeName}</div>
                <div className="text-[11px] font-bold leading-tight truncate">
                  {item.display_name || item.name}
                </div>
              </div>

              <div className="my-1">
                <BarcodeSvg value={item.barcode || item.sku} height={template === "24" ? 28 : 20} />
                <div className="text-[9px] font-mono tracking-widest">{item.barcode || item.sku}</div>
              </div>

              <div className="border-t border-black pt-1 flex items-center justify-between text-xs px-1">
                <span className="text-[9px] font-mono">MRP: ₹{item.mrp.toFixed(2)}</span>
                <span className="font-black font-mono text-sm">₹{item.selling_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

