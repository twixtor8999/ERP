import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Eye } from "lucide-react";
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

const SAMPLE_CUSTOMER_CARTS: CustomerCartRow[] = [
  {
    sl: 1,
    customerId: "cust-1",
    customerName: "Ramesh M Genni",
    villageName: "Tamba",
    noOfItems: 4,
    totalAmount: 4850,
    items: [
      { skuId: "sku-1", itemName: "Aashirvaad Shudh Chakki Atta 10kg", qty: 4, price: 440 },
      { skuId: "sku-2", itemName: "Fortune Sunlite Refined Sunflower Oil 1L", qty: 12, price: 128 },
      { skuId: "sku-3", itemName: "Tata Salt Vacuum Evaporated 1kg", qty: 20, price: 26 },
      { skuId: "sku-4", itemName: "Madhur Pure Sugar 5kg", qty: 4, price: 235 },
    ],
  },
  {
    sl: 2,
    customerId: "cust-2",
    customerName: "B M Kirana Store",
    villageName: "Bijapur (Rural)",
    noOfItems: 3,
    totalAmount: 11200,
    items: [
      { skuId: "sku-5", itemName: "Fortune Sunflower Oil 15L Tin", qty: 4, price: 1850 },
      { skuId: "sku-6", itemName: "Tur Dal Premium Desi 1kg", qty: 15, price: 165 },
      { skuId: "sku-7", itemName: "Everest Turmeric Powder 500g", qty: 10, price: 145 },
    ],
  },
  {
    sl: 3,
    customerId: "cust-3",
    customerName: "Hanamant Tonashyal",
    villageName: "Bijapur (Rural)",
    noOfItems: 2,
    totalAmount: 2650,
    items: [
      { skuId: "sku-1", itemName: "Aashirvaad Shudh Chakki Atta 10kg", qty: 5, price: 440 },
      { skuId: "sku-4", itemName: "Madhur Pure Sugar 5kg", qty: 2, price: 235 },
    ],
  },
];

export function WholesaleCustomerCartsView() {
  const navigate = useNavigate();
  const [pageSearch, setPageSearch] = useState("");
  const [carts] = useState<CustomerCartRow[]>(SAMPLE_CUSTOMER_CARTS);
  const [selectedCart, setSelectedCart] = useState<CustomerCartRow | null>(null);

  const filteredCarts = carts.filter((c) => {
    if (!pageSearch) return true;
    const q = pageSearch.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.villageName.toLowerCase().includes(q) ||
      String(c.totalAmount).includes(q)
    );
  });

  // Dedicated 2nd Page: Render full customer cart view when a cart is selected
  if (selectedCart) {
    return (
      <CustomerCartDetailView
        cart={selectedCart}
        onBack={() => setSelectedCart(null)}
        onPunchOrder={(c) => {
          toast.success("Converted to Order", {
            description: `Cart of ${c.customerName} pushed to Packing stage.`,
          });
          setSelectedCart(null);
        }}
      />
    );
  }

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

      {/* Heading Title matching Reference App Screenshot 1 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Customer carts
        </h1>
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

      {/* Customer Carts Table matching Screenshot 1 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-xs">
          <thead>
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
              <tr className="bg-[#0b1a30]">
                <td colSpan={6} className="py-4 px-3 text-center text-slate-300 font-medium text-xs tracking-wide">
                  No customer carts active.
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
        </table>
      </div>
    </div>
  );
}
