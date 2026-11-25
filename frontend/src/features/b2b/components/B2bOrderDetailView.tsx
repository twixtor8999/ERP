import React from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  Package,
  Receipt,
  Truck,
} from 'lucide-react';
import { B2bOrderRow } from './WholesaleB2bOrdersListView';
import { toast } from 'sonner';

interface Props {
  order: B2bOrderRow;
  onBack: () => void;
}

export const B2bOrderDetailView: React.FC<Props> = ({ order, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['B2B ORDER INVOICE DETAILS', ''],
      ['Order No', order.orderNo],
      ['Invoice No', order.invoiceNo || order.orderNo],
      ['Date', order.date],
      ['Customer Name', order.customerName],
      ['Village / Route', order.villageName],
      ['Status', order.status.toUpperCase()],
      ['', ''],
      ['ORDER ITEMS', ''],
      ['Sl', 'Item Name', 'Qty', 'Unit Price', 'Subtotal'],
      ...order.items.map((it, idx) => [
        idx + 1,
        `"${it.name}"`,
        it.qty,
        `₹${it.price}`,
        `₹${it.qty * it.price}`,
      ]),
      ['', '', '', 'Total Order Amount', `₹${order.total}`],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Order_${order.orderNo}_${order.customerName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('B2B order details exported to CSV');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 text-slate-800 animate-in fade-in duration-150">
      {/* Top Header & Actions Bar (Hidden during Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <button
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders List
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#132038] hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Tax Invoice
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 font-medium print:hidden">
        <button onClick={onBack} className="text-slate-400 hover:text-blue-600 transition">
          B2B
        </button>{' '}
        /{' '}
        <button onClick={onBack} className="text-slate-500 hover:text-blue-600 transition">
          Orders List
        </button>{' '}
        /{' '}
        <span className="text-blue-900 font-bold font-mono">
          Order {order.orderNo}
        </span>
      </div>

      {/* Official Order Document */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Header Banner */}
        <div className="bg-[#132038] text-white p-6 sm:p-7 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-2xs font-extrabold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> SIDDESHWAR ENTERPRISES · B2B WHOLESALE INVOICE
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 font-mono">
              Order {order.orderNo}
              {order.invoiceNo && (
                <span className="text-sm font-normal text-slate-300">({order.invoiceNo})</span>
              )}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Customer: {order.customerName} · {order.villageName}
            </p>
          </div>

          <div className="text-right space-y-1">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-2xs capitalize ${
                order.status === 'delivered'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : order.status === 'invoiced'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> {order.status}
            </span>
            <div className="text-xs font-mono text-slate-300">
              Grand Total: <b className="text-white text-base">₹{order.total.toLocaleString('en-IN')}</b>
            </div>
          </div>
        </div>

        {/* Order Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Customer Name
            </span>
            <p className="font-bold text-slate-900">{order.customerName}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Village / Route
            </span>
            <p className="font-semibold text-slate-900">{order.villageName || '—'}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Order Date
            </span>
            <p className="font-bold text-slate-900 font-mono">{order.date}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3" /> Delivery Mode
            </span>
            <p className="font-medium text-slate-900">Direct Route Delivery</p>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-700" />
                Billed Invoice Items
              </h4>
              <span className="text-xs font-mono text-slate-600">
                Total Line Items: <b>{order.items.length}</b>
              </span>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1e40af] text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-center w-14">Sl</th>
                  <th className="py-2.5 px-4 text-left">Item Name</th>
                  <th className="py-2.5 px-4 text-center w-28">Quantity</th>
                  <th className="py-2.5 px-4 text-right w-36">Unit Price</th>
                  <th className="py-2.5 px-4 text-right w-40">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-500 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {it.name}
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
                    Total Qty Billed: {order.items.reduce((a, b) => a + b.qty, 0)} Units
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs uppercase text-slate-500">
                    Grand Total Amount:
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-lg text-blue-700">
                    ₹{order.total.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Fulfillment Status Callout */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>
                <b>Fulfillment Life Cycle:</b> This order has been verified and settled against route manifest.
              </span>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#132038] hover:bg-slate-900 text-white font-bold rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Copy
            </button>
          </div>

          {/* Signature Strip */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Customer Receiver Sign</p>
            </div>
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Delivery Driver Sign</p>
            </div>
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Authorized Billing Stamp</p>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden during Print) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            ← Back to Orders List
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-[#132038] hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Tax Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
