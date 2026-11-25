import React from 'react';
import {
  ArrowLeft,
  Printer,
  ShoppingBag,
  User,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { CustomerCartRow } from './WholesaleCustomerCartsView';

interface Props {
  cart: CustomerCartRow;
  onBack: () => void;
  onPunchOrder: (cart: CustomerCartRow) => void;
}

export const CustomerCartDetailView: React.FC<Props> = ({
  cart,
  onBack,
  onPunchOrder,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 text-slate-800 animate-in fade-in duration-150">
      {/* Top Header & Actions Bar (Hidden during Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <button
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Carts
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Cart Sheet
          </button>
          <button
            onClick={() => onPunchOrder(cart)}
            className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Punch as Order
          </button>
        </div>
      </div>

      {/* Breadcrumb matching app navigation */}
      <div className="text-xs text-slate-500 font-medium print:hidden">
        <button onClick={onBack} className="text-slate-400 hover:text-blue-600 transition">
          B2B
        </button>{' '}
        /{' '}
        <button onClick={onBack} className="text-slate-500 hover:text-blue-600 transition">
          Customer Carts
        </button>{' '}
        /{' '}
        <span className="text-blue-900 font-bold font-mono">
          {cart.customerName} ({cart.villageName})
        </span>
      </div>

      {/* Customer Cart Document */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Header Banner */}
        <div className="bg-[#132038] text-white p-6 sm:p-7 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-2xs font-extrabold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> B2B CUSTOMER SELF-ORDER CART
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {cart.customerName}
            </h2>
            <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" /> Village: {cart.villageName} · {cart.noOfItems} Distinct Items in Cart
            </p>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active Live Cart
            </div>
            <div className="text-xs font-mono text-slate-300">
              Total Cart Value: <b className="text-white text-sm">₹{cart.totalAmount.toLocaleString('en-IN')}</b>
            </div>
          </div>
        </div>

        {/* Customer & Route Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Customer Name
            </span>
            <p className="font-bold text-slate-900">{cart.customerName}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Village / Route
            </span>
            <p className="font-semibold text-slate-900">{cart.villageName}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" /> Total Items
            </span>
            <p className="font-bold text-slate-900 font-mono">{cart.noOfItems} SKU Lines</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Synced Time
            </span>
            <p className="font-medium text-slate-900 font-mono">Today, Live Sync</p>
          </div>
        </div>

        {/* Cart Items Table */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-700" />
                Selected Wholesale Cart Items
              </h4>
              <span className="text-xs font-mono text-slate-600">
                Customer ID: <b>{cart.customerId}</b>
              </span>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1e40af] text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-center w-14">Sl</th>
                  <th className="py-2.5 px-4 text-left">Item Name</th>
                  <th className="py-2.5 px-4 text-center w-28">Order Qty</th>
                  <th className="py-2.5 px-4 text-right w-36">Wholesale Rate</th>
                  <th className="py-2.5 px-4 text-right w-40">Subtotal Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {cart.items.map((it, idx) => (
                  <tr key={it.skuId || idx} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-500 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {it.itemName}
                      <span className="block text-[10px] font-mono text-slate-400 font-normal">
                        SKU ID: {it.skuId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-slate-900 text-sm">
                      {it.qty}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 text-sm">
                      ₹{it.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{(it.qty * it.price).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                  <td colSpan={3} className="py-3.5 px-4 text-left font-bold text-slate-700">
                    Grand Total ({cart.items.reduce((a, b) => a + b.qty, 0)} Units Across {cart.noOfItems} Items):
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs uppercase text-slate-500">
                    Total Cart Value:
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-lg text-blue-700">
                    ₹{cart.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Action Callout */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-blue-950">
                Ready to dispatch this Kirana shop order?
              </span>
              <p className="text-xs text-blue-800">
                Pushing as order will immediately reserve warehouse stock and move items into the <b>Packing</b> stage for route picking.
              </p>
            </div>

            <button
              onClick={() => onPunchOrder(cart)}
              className="px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" /> Punch as Order (₹{cart.totalAmount.toLocaleString('en-IN')})
            </button>
          </div>
        </div>

        {/* Footer Actions (Hidden during Print) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            ← Back to Customer Carts
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Cart
            </button>
            <button
              onClick={() => onPunchOrder(cart)}
              className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Punch as Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
