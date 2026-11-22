import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Eye, X } from "lucide-react";
import { toast } from "sonner";

export interface B2bOrderRow {
  sl: number;
  id: string;
  orderNo: string;
  invoiceNo?: string;
  date: string;
  customerName: string;
  villageName: string;
  status: "placed" | "packed" | "invoiced" | "dispatched" | "delivered";
  total: number;
  items: Array<{ name: string; qty: number; price: number }>;
}

const SAMPLE_B2B_ORDERS: B2bOrderRow[] = [
  {
    sl: 1,
    id: "ord-b2b-1",
    orderNo: "ORD-1029",
    invoiceNo: "INV-1029",
    date: "22-11-2026",
    customerName: "Ramesh M Genni",
    villageName: "Tamba",
    status: "delivered",
    total: 4850,
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", qty: 4, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", qty: 12, price: 128 },
      { name: "Tata Salt Vacuum Evaporated 1kg", qty: 20, price: 26 },
      { name: "Madhur Pure Sugar 5kg", qty: 4, price: 235 },
    ],
  },
  {
    sl: 2,
    id: "ord-b2b-2",
    orderNo: "ORD-1030",
    invoiceNo: "INV-1030",
    date: "22-11-2026",
    customerName: "B M Kirana Store",
    villageName: "Bijapur (Rural)",
    status: "invoiced",
    total: 11200,
    items: [
      { name: "Fortune Sunflower Oil 15L Tin", qty: 4, price: 1850 },
      { name: "Tur Dal Premium Desi 1kg", qty: 15, price: 165 },
      { name: "Everest Turmeric Powder 500g", qty: 10, price: 145 },
    ],
  },
];

export function WholesaleB2bOrdersListView() {
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [pageSearch, setPageSearch] = useState("");

  const [orders] = useState<B2bOrderRow[]>(SAMPLE_B2B_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<B2bOrderRow | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (!pageSearch) return true;
    const q = pageSearch.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.villageName.toLowerCase().includes(q) ||
      o.orderNo.toLowerCase().includes(q) ||
      (o.invoiceNo && o.invoiceNo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-3 font-sans antialiased text-[#0f172a] pb-12">
      {/* Top Bar: Back button matching Reference App */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Date Filter Strip matching Reference App Screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none"
          />
          <span>To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none"
          />
          <button
            onClick={() => toast.info("Filter Applied", { description: `Loaded B2B customer orders for ${fromDate} to ${toDate}` })}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Heading Title matching Reference App Screenshot 2 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Orders List
        </h1>
      </div>

      {/* Search in this page... matching Reference App Screenshot 2 */}
      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={pageSearch}
          onChange={(e) => setPageSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Orders List Table matching Screenshot 2 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
              <th className="py-2.5 px-3 text-left w-14">Sl</th>
              <th className="py-2.5 px-3 text-left">Order</th>
              <th className="py-2.5 px-3 text-left">Date</th>
              <th className="py-2.5 px-3 text-left">Customer</th>
              <th className="py-2.5 px-3 text-left">Village</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-center w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {filteredOrders.length === 0 ? (
              <tr className="bg-[#0b1a30]">
                <td colSpan={8} className="py-4 px-3 text-center text-slate-300 font-medium text-xs tracking-wide">
                  No customer orders in these dates.
                </td>
              </tr>
            ) : (
              filteredOrders.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                  <td className="py-3 px-3 text-slate-500 font-bold">{row.sl}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 font-mono">{row.orderNo}</div>
                    {row.invoiceNo && (
                      <div className="text-[10px] text-slate-400 font-mono">{row.invoiceNo}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{row.date}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{row.customerName}</td>
                  <td className="py-3 px-3 text-slate-700">{row.villageName || "—"}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        row.status === "delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : row.status === "invoiced"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    ₹{row.total.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedOrder(row)}
                      className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#132038]">
                  Order {selectedOrder.orderNo}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedOrder.customerName} · {selectedOrder.villageName}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#2563eb] text-white font-extrabold whitespace-nowrap">
                    <th className="py-2 px-3 text-left w-10">Sl</th>
                    <th className="py-2 px-3 text-left">Item name</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {selectedOrder.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{it.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        ₹{it.price.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{(it.qty * it.price).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-black border-t border-slate-200 text-slate-900">
                    <td colSpan={4} className="py-2.5 px-3 text-right">Order Total</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700">
                      ₹{selectedOrder.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white rounded-lg text-xs font-bold transition-colors"
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
