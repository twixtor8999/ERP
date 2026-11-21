import { useState, useEffect } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";

interface PurchaseItem {
  id: string;
  po_number: string;
  supplier_name: string;
  po_date: string | null;
  status: string;
  total_amount: number;
}

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/purchases");
        setPurchases(res.data);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-blue-600" />
          Purchase Orders & Goods Receipts (GRN)
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Wholesale purchase requisitions, incoming stock shipments, and supplier invoicing status.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading purchase orders...</span>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No purchase orders on record</p>
            <p className="text-xs text-slate-400 mt-1">Vendor purchase orders will appear here once generated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier Partner</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-right">PO Total Amount</th>
                  <th className="py-3 px-4 text-center">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-blue-600 font-bold">
                      {p.po_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.supplier_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {p.po_date || "Recent"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{p.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
