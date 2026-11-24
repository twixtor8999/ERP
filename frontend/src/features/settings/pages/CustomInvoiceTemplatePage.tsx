import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Save,
  FileText,
  Settings,
} from 'lucide-react';
import {
  InvoiceTemplateConfig,
  InvoiceFormat,
  getInvoiceTemplateConfig,
  saveInvoiceTemplateConfig,
} from '@/features/orders/utils/invoiceTemplateConfig';
import { openTaxInvoiceWindow, TaxInvoiceOrder } from '@/features/orders/utils/taxInvoicePrinter';
import { toast } from 'sonner';

const SAMPLE_PREVIEW_ORDER: TaxInvoiceOrder = {
  orderNo: 'ORD-1672',
  invoiceNo: 'INV-469',
  orderDate: '24-11-2026',
  orderTime: '08:04 pm',
  customerName: 'Ambiger kirani store - Chandru ambiger',
  customerVillage: 'Muttagi',
  customerPhone: '9986313410',
  customerGstin: '29ABCDE1234F1Z5',
  vehicleNo: 'KA28AC0349',
  route: 'GOLASANGI',
  items: [
    { name: 'Raag Gold Palm Oil 1Ltr 10Pcs Box', hsn: '15119010', qty: 1, price: 1380, gst: 5, total: 1380 },
    { name: 'Tata Salt Vacuum Evaporated 1kg', hsn: '25010010', qty: 5, price: 32, gst: 0, total: 160 },
  ],
  total: 1540,
  taxableAmount: 1474.29,
  paidAmount: 1540,
  balance: 0,
};

export function CustomInvoiceTemplatePage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<InvoiceTemplateConfig>(() => getInvoiceTemplateConfig());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveInvoiceTemplateConfig(config);
    toast.success('Custom invoice template preferences saved successfully!');
  };

  const handleTestPrint = () => {
    const ok = openTaxInvoiceWindow(SAMPLE_PREVIEW_ORDER, true, config.paperSize);
    if (ok) {
      toast.success(`Launched test print preview for ${config.paperSize.toUpperCase()}`);
    } else {
      toast.error('Pop-up window was blocked. Please allow popups for printing.');
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top action row */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestPrint}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" /> Test Print
          </button>
        </div>
      </div>

      {/* Breadcrumb & Heading matching client app Management -> Custom invoice */}
      <div className="text-xs text-slate-500 font-medium">
        <span className="text-slate-400">Management</span> / <span className="text-slate-900 font-bold">Custom Invoice</span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
          Custom Invoice Template
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Master invoice template. Changes apply to every wholesale route delivery and POS invoice print.
        </p>
      </div>

      {/* Main Grid: Controls Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls (Left 6 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> Print Configuration
            </h2>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#132038] hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>

          {/* Paper Size Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Default Paper Format & Printer Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'a4', label: 'A4 Legal', desc: 'Full page GST' },
                { id: 'a5', label: 'A5 Half', desc: 'Compact sheet' },
                { id: 'thermal_80', label: '80mm Thermal', desc: '3-inch roll' },
                { id: 'thermal_58', label: '58mm Thermal', desc: '2-inch POS' },
              ].map((fmt) => (
                <button
                  type="button"
                  key={fmt.id}
                  onClick={() => setConfig({ ...config, paperSize: fmt.id as InvoiceFormat })}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    config.paperSize === fmt.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="font-black text-xs">{fmt.label}</div>
                  <div className="text-[10px] text-slate-500">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Business Address</label>
              <textarea
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[50px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">GSTIN</label>
                <input
                  type="text"
                  value={config.gstin}
                  onChange={(e) => setConfig({ ...config, gstin: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Invoice Header Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Footer Note Line</label>
              <input
                type="text"
                value={config.footerLine}
                onChange={(e) => setConfig({ ...config, footerLine: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Terms & Conditions / Disclaimer</label>
              <textarea
                value={config.termsAndConditions}
                onChange={(e) => setConfig({ ...config, termsAndConditions: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[50px]"
              />
            </div>
          </div>

          {/* Visibility Checkbox Options */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Print Sections Visibility</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showCustomer}
                  onChange={(e) => setConfig({ ...config, showCustomer: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-800">Show Customer</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showVehicle}
                  onChange={(e) => setConfig({ ...config, showVehicle: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-800">Show Vehicle / Driver</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showHsn}
                  onChange={(e) => setConfig({ ...config, showHsn: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-800">Show HSN Code</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGstSplit}
                  onChange={(e) => setConfig({ ...config, showGstSplit: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-800">Show GST Tax Split</span>
              </label>
            </div>
          </div>
        </form>

        {/* Live Preview (Right 6 Cols) */}
        <div className="lg:col-span-6 bg-slate-100/90 p-5 rounded-xl border border-slate-300/80 shadow-inner space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-600 tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> Live Render Preview ({config.paperSize.toUpperCase()})
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              INV-469
            </span>
          </div>

          {/* Rendered Preview Container */}
          <div className="flex justify-center overflow-x-auto py-2">
            {config.paperSize === 'thermal_80' || config.paperSize === 'thermal_58' ? (
              /* Thermal Roll Simulation */
              <div
                className={`bg-white shadow-xl border border-slate-300 p-4 font-mono text-slate-900 rounded-sm ${
                  config.paperSize === 'thermal_80' ? 'w-[300px] text-[11px]' : 'w-[230px] text-[9.5px]'
                }`}
              >
                {/* Header */}
                <div className="text-center space-y-0.5">
                  <div className="font-black text-sm tracking-tight">{config.title}</div>
                  <div className="font-bold text-xs">{config.companyName}</div>
                  <div className="text-[10px] text-slate-600 leading-tight">{config.address}</div>
                  {config.phone && <div className="text-[10px]">Ph: {config.phone}</div>}
                  <div className="font-bold text-[10px]">GSTIN: {config.gstin}</div>
                </div>

                <div className="border-b-2 border-dashed border-slate-800 my-2.5" />

                <div className="space-y-0.5 text-[10px]">
                  <div><b>Invoice:</b> INV-469</div>
                  <div><b>Order:</b> ORD-1672</div>
                  <div><b>Date:</b> 24-11-2026 08:04 pm</div>
                  {config.showCustomer && <div><b>Cust:</b> Ambiger kirani store</div>}
                  {config.showCustomer && <div><b>Route:</b> GOLASANGI (Muttagi)</div>}
                  {config.showVehicle && <div><b>Vehicle:</b> KA28AC0349</div>}
                </div>

                <div className="border-b border-dashed border-slate-800 my-2" />

                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-dashed border-slate-800">
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">
                        <div className="font-bold">Raag Gold Palm Oil 1Ltr</div>
                        {config.showHsn && <div className="text-[9px] text-slate-500">HSN: 15119010 · 5%</div>}
                      </td>
                      <td className="text-center py-1">1</td>
                      <td className="text-right py-1">1380</td>
                      <td className="text-right py-1 font-bold">1,380</td>
                    </tr>
                    <tr>
                      <td className="py-1">
                        <div className="font-bold">Tata Salt 1kg</div>
                        {config.showHsn && <div className="text-[9px] text-slate-500">HSN: 25010010 · 0%</div>}
                      </td>
                      <td className="text-center py-1">5</td>
                      <td className="text-right py-1">32</td>
                      <td className="text-right py-1 font-bold">160</td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-b border-dashed border-slate-800 my-2" />

                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Items / Qty:</span>
                    <span className="font-bold">2 items / 6 units</span>
                  </div>
                  {config.showGstSplit && (
                    <>
                      <div className="flex justify-between">
                        <span>Taxable Amt:</span>
                        <span>₹1,474.29</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST + SGST:</span>
                        <span>₹65.71</span>
                      </div>
                    </>
                  )}
                  <div className="border-b-2 border-dashed border-slate-800 my-1" />
                  <div className="flex justify-between font-black text-xs">
                    <span>TOTAL:</span>
                    <span>₹1,540.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Paid / Cash:</span>
                    <span>₹1,540.00</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-800 my-2.5" />

                <div className="text-center text-[9px] text-slate-600 space-y-1">
                  <div>{config.footerLine}</div>
                  <div className="italic text-[8px] text-slate-400">{config.termsAndConditions}</div>
                </div>
              </div>
            ) : (
              /* A4 / A5 Sheet Simulation */
              <div
                className={`bg-white shadow-xl border border-slate-300 p-5 font-sans text-slate-800 rounded-sm space-y-3 ${
                  config.paperSize === 'a5' ? 'w-[420px] text-[10.5px]' : 'w-[460px] text-xs'
                }`}
              >
                {/* Letterhead */}
                <div className="border-b-2 border-slate-800 pb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-sm tracking-tight text-slate-900">{config.companyName}</h3>
                    <p className="text-[10px] text-slate-600">{config.address}</p>
                    <p className="text-[10px] font-mono font-bold">GSTIN: {config.gstin}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded uppercase">
                      {config.title}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Invoice: <b>INV-469</b></p>
                    <p className="text-[10px] text-slate-500">Date: 24-11-2026</p>
                  </div>
                </div>

                {/* Bill To */}
                {config.showCustomer && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px] space-y-0.5">
                    <p className="font-bold text-slate-800">Billed To: Ambiger kirani store</p>
                    <p className="text-slate-600">Village: Muttagi · Route: GOLASANGI · Ph: 9986313410</p>
                    {config.showVehicle && <p className="text-slate-600">Vehicle: KA28AC0349</p>}
                  </div>
                )}

                {/* Items Table */}
                <table className="w-full text-left text-[10.5px] border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-[10px]">
                    <tr>
                      <th className="p-1 border border-slate-300">Item</th>
                      {config.showHsn && <th className="p-1 border border-slate-300 text-center">HSN</th>}
                      <th className="p-1 border border-slate-300 text-center">Qty</th>
                      <th className="p-1 border border-slate-300 text-right">Price</th>
                      {config.showGstSplit && <th className="p-1 border border-slate-300 text-center">GST</th>}
                      <th className="p-1 border border-slate-300 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1 border border-slate-300 font-semibold">Raag Gold Palm Oil 1Ltr 10Pcs Box</td>
                      {config.showHsn && <td className="p-1 border border-slate-300 text-center font-mono">15119010</td>}
                      <td className="p-1 border border-slate-300 text-center">1</td>
                      <td className="p-1 border border-slate-300 text-right">1,380</td>
                      {config.showGstSplit && <td className="p-1 border border-slate-300 text-center">5%</td>}
                      <td className="p-1 border border-slate-300 text-right font-bold">1,380.00</td>
                    </tr>
                    <tr>
                      <td className="p-1 border border-slate-300 font-semibold">Tata Salt 1kg</td>
                      {config.showHsn && <td className="p-1 border border-slate-300 text-center font-mono">25010010</td>}
                      <td className="p-1 border border-slate-300 text-center">5</td>
                      <td className="p-1 border border-slate-300 text-right">32</td>
                      {config.showGstSplit && <td className="p-1 border border-slate-300 text-center">0%</td>}
                      <td className="p-1 border border-slate-300 text-right font-bold">160.00</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals & Signatory */}
                <div className="flex justify-between items-end pt-2 text-[10px]">
                  <div className="text-[9px] text-slate-500 max-w-[220px]">
                    <p className="font-bold">{config.footerLine}</p>
                    <p className="italic">{config.termsAndConditions}</p>
                  </div>
                  <div className="text-right space-y-0.5 min-w-[140px]">
                    {config.showGstSplit && (
                      <div className="flex justify-between">
                        <span>Taxable:</span>
                        <span>₹1,474.29</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                      <span>Grand Total:</span>
                      <span>₹1,540.00</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
