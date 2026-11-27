import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Eye, ShoppingCart, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { CustomerCartDetailView } from "./CustomerCartDetailView";

export interface CustomerCartItem {
  skuId: string;
  itemName: string;
  qty: number;
  price: number;
}

export interface CustomerCartRow {
  sl: number;
  customerId: string;
  customerName: string;
  villageName: string;
  noOfItems: number;
  totalAmount: number;
  items: CustomerCartItem[];
}

const STORAGE_B2B_CARTS = "erp_b2b_customer_carts_v2";

const INITIAL_BACKUP_CARTS: CustomerCartRow[] = [
  {
    sl: 1,
    customerId: "1792946086855293",
    customerName: "Shivanand H Kudagi (Kudagi Store)",
    villageName: "Muttagi",
    noOfItems: 1,
    totalAmount: 2150,
    items: [
      {
        skuId: "113",
        itemName: "Wholesale B2B Catalog Item #113",
        qty: 1,
        price: 2150,
      },
    ],
  },
];

export function WholesaleCustomerCartsView() {
  const navigate = useNavigate();
  const [pageSearch, setPageSearch] = useState("");

  const [carts, setCarts] = useState<CustomerCartRow[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_B2B_CARTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(STORAGE_B2B_CARTS, JSON.stringify(INITIAL_BACKUP_CARTS));
    } catch {}
    return INITIAL_BACKUP_CARTS;
  });

  const [selectedCart, setSelectedCart] = useState<CustomerCartRow | null>(null);

  const filteredCarts = useMemo(() => {
    if (!pageSearch.trim()) return carts;
    const q = pageSearch.toLowerCase();
    return carts.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.villageName.toLowerCase().includes(q) ||
        String(c.totalAmount).includes(q)
    );
  }, [carts, pageSearch]);

  const handlePunchOrder = (c: CustomerCartRow) => {
    try {
      const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
      const pipeline: any[] = storedPipeline ? JSON.parse(storedPipeline) : [];
      const orderNo = `ORD-${Date.now().toString().slice(-4)}`;

      const newPipelineOrder = {
        id: String(Date.now()),
        orderNo,
        customerName: c.customerName,
        shopName: c.customerName,
        village: c.villageName,
        route: "Direct Order",
        createdBy: "B2B Self-Order",
        source: "B2B Portal",
        orderDate: new Date().toISOString().split("T")[0] || "2026-11-25",
        orderTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase(),
        phone: "",
        total: c.totalAmount,
        balance: 0,
        stage: "packing",
        status: "packed",
        history: [
          {
            when: new Date().toISOString().replace("T", " ").substring(0, 16),
            from: "B2B Cart",
            to: "Packing",
            by: "Vijaykumar Shantagiri",
            where: "B2B Customer Carts",
          },
        ],
        items: c.items.map((it) => ({
          name: it.itemName,
          unit: "Unit",
          qty: it.qty,
          price: it.price,
          rate: it.price,
          gst: "5%",
          amount: it.qty * it.price,
        })),
      };

      const nextPipeline = [newPipelineOrder, ...pipeline];
      localStorage.setItem("crm_wholesale_pipeline_orders", JSON.stringify(nextPipeline));
      window.dispatchEvent(new Event("crm_order_placed"));

      const nextCarts = carts.filter((item) => item.customerId !== c.customerId);
      setCarts(nextCarts);
      localStorage.setItem(STORAGE_B2B_CARTS, JSON.stringify(nextCarts));

      toast.success("Converted to Live Order", {
        description: `Order ${orderNo} for ${c.customerName} pushed to Orders > Packing.`,
      });
      setSelectedCart(null);
    } catch (e) {
      console.error("Failed to punch order from cart", e);
      toast.error("Failed to punch order");
    }
  };

  // Dedicated 2nd Page: Render full customer cart view when a cart is selected
  if (selectedCart) {
    return (
      <CustomerCartDetailView
        cart={selectedCart}
        onBack={() => setSelectedCart(null)}
        onPunchOrder={handlePunchOrder}
      />
    );
  }

  return (
    <div className="space-y-3 font-sans antialiased text-[#0f172a] pb-12">
      {/* Top Bar: Back button matching Reference App */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          onClick={() => navigate("/orders/place-order")}
          className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Place New Order</span>
        </button>
      </div>

      {/* Heading Title matching Reference App Screenshot 1 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Customer carts
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Live B2B carts from retailers before order confirmation
        </p>
      </div>

      {/* Search in this page... matching Reference App Screenshot 1 */}
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

      {/* Customer Carts Table with Fixed 5-Row Viewport and Internal Scroll */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 shadow-2xs">
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
                <th className="py-2.5 px-3 text-left w-14">Sl</th>
                <th className="py-2.5 px-3 text-left">Customer name</th>
                <th className="py-2.5 px-3 text-left">Village name</th>
                <th className="py-2.5 px-3 text-center">No. of items</th>
                <th className="py-2.5 px-3 text-right">Total amount</th>
                <th className="py-2.5 px-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredCarts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <p className="text-slate-600 font-bold text-sm">No active customer carts</p>
                      <p className="text-slate-400 text-xs max-w-sm">
                        Retailers placing self-orders will appear here. To create an order for a kirana store now, use Place Order.
                      </p>
                      <button
                        onClick={() => navigate("/orders/place-order")}
                        className="mt-2 bg-[#132038] hover:bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition shadow-2xs"
                      >
                        Go to Place Order &rarr;
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCarts.map((row) => (
                  <tr key={row.customerId} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                    <td className="py-3 px-3 text-slate-500 font-bold">{row.sl}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{row.customerName}</td>
                    <td className="py-3 px-3 text-slate-700">{row.villageName || "—"}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{row.noOfItems}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                      ₹{row.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedCart(row)}
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
            {filteredCarts.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 shadow-xs">
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3">Total</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    {filteredCarts.reduce((a, b) => a + b.noOfItems, 0)} items
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    ₹{filteredCarts.reduce((a, b) => a + b.totalAmount, 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
