import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Save,
  FileText,
  Settings,
  Package,
  Download,
} from 'lucide-react';
import {
  InvoiceTemplateConfig,
  InvoiceFormat,
  getInvoiceTemplateConfig,
  saveInvoiceTemplateConfig,
} from '@/features/orders/utils/invoiceTemplateConfig';
import { openTaxInvoiceWindow, TaxInvoiceOrder } from '@/features/orders/utils/taxInvoicePrinter';
import {
  openPackingSlipWindow,
  SAMPLE_PREVIEW_PACKING_ORDER,
  PackingSlipOrderData,
} from '@/features/orders/utils/packingSlipPrinter';
import { toast } from 'sonner';

// Sample order matching PDF 1 (INV-469 / ORD-1489)
const SAMPLE_PREVIEW_ORDER_PDF1: TaxInvoiceOrder = {
  orderNo: 'ORD-1489',
  invoiceNo: 'INV-469',
  orderDate: '20-11-2026',
  orderTime: '10:00 AM',
  customerName: 'B M',
  customerNameKn: 'ಕ',
  customerShop: 'B M kirana store',
  customerVillage: 'Bijapur ( Rural )',
  customerVillageKn: 'ಬಿಜಾಪುರ',
  customerPhone: '8105690366',
  customerLandmark: 'Madina Nagar',
  customerTaluka: 'Vijayapura',
  customerDistrict: 'Vijayapura',
  customerRoute: 'Bijapur',
  vehicleNo: 'KA28AB3425',
  createdBy: 'Arun Patil',
  creatorPhone: '9916801495',
  customerGstin: 'N/A',
  items: [
    {
      name: 'BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )',
      nameKn: 'BUMTUM ಬೇಬಿ ಡೈಪರ್ 10 ರೂ. (S1, 4-8 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್ )',
      hsn: '96190030',
      qty: 140,
      price: 7,
      gst: 5,
      total: 980,
    },
    {
      name: 'BUMTUM BABY DIAPER 12RS ( M1 7-12 KG 1PANS PKT )',
      nameKn: 'BUMTUM ಬೇಬಿ ಡೈಪರ್ 12 ರೂ. (M1, 7-12 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್ )',
      hsn: '96190030',
      qty: 100,
      price: 8,
      gst: 5,
      total: 800,
    },
    {
      name: 'BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )',
      nameKn: 'BUMTUM ಬೇಬಿ ಡೈಪರ್ 14 ರೂ. (L1, 9-14 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್ )',
      hsn: '96190030',
      qty: 80,
      price: 10,
      gst: 5,
      total: 800,
    },
  ],
  total: 2580,
  taxableAmount: 2457.14,
  cgst: 61.43,
  sgst: 61.43,
  paidAmount: 2580,
  balance: 0,
};

export function CustomInvoiceTemplatePage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<InvoiceTemplateConfig>(() => getInvoiceTemplateConfig());
  const [activeTab, setActiveTab] = useState<'invoice' | 'packing'>('invoice');

  // Load real wholesale orders from localStorage if present
  const [pipelineOrders] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('crm_wholesale_pipeline_orders');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string>('sample');

  const selectedRealOrder = pipelineOrders.find(
    (o) => String(o.orderNo || o.id) === String(selectedOrderId)
  );

  const previewTaxOrder: TaxInvoiceOrder = selectedRealOrder
    ? {
        orderNo: selectedRealOrder.orderNo || 'ORD-PREV',
        invoiceNo: selectedRealOrder.invoiceNo || selectedRealOrder.orderNo || 'INV-PREV',
        orderDate: selectedRealOrder.date || selectedRealOrder.orderDate || '20-11-2026',
        orderTime: selectedRealOrder.time || selectedRealOrder.orderTime || '10:00 AM',
        customerName: selectedRealOrder.customerName || selectedRealOrder.customer?.name || 'Customer',
        customerNameKn: selectedRealOrder.customerNameKn || selectedRealOrder.customer?.nameKn || '',
        customerShop: selectedRealOrder.customerShop || selectedRealOrder.shopName || selectedRealOrder.customerName,
        customerVillage: selectedRealOrder.customerVillage || selectedRealOrder.village || 'Village',
        customerVillageKn: selectedRealOrder.customerVillageKn || selectedRealOrder.villageKn || '',
        customerPhone: selectedRealOrder.customerPhone || selectedRealOrder.phone || '',
        customerLandmark: selectedRealOrder.customerLandmark || selectedRealOrder.landmark || '',
        customerTaluka: selectedRealOrder.customerTaluka || selectedRealOrder.taluka || '',
        customerDistrict: selectedRealOrder.customerDistrict || selectedRealOrder.district || '',
        customerRoute: selectedRealOrder.customerRoute || selectedRealOrder.route || '',
        vehicleNo: selectedRealOrder.vehicleNo || 'KA28AB3425',
        createdBy: selectedRealOrder.createdBy || 'Admin',
        creatorPhone: selectedRealOrder.creatorPhone || '',
        customerGstin: selectedRealOrder.customerGstin || selectedRealOrder.gstin || 'N/A',
        items: (selectedRealOrder.items && selectedRealOrder.items.length > 0
          ? selectedRealOrder.items
          : SAMPLE_PREVIEW_ORDER_PDF1.items
        ).map((it: any) => ({
          name: it.name || it.productName || 'Item',
          nameKn: it.nameKn || '',
          hsn: it.hsn || '96190030',
          qty: Number(it.qty || it.quantity || 1),
          price: Number(it.price || it.rate || 10),
          gst: it.gst !== undefined ? Number(it.gst) : 5,
          total: Number(it.total || (it.qty || 1) * (it.price || 10)),
        })),
        total: Number(selectedRealOrder.total || selectedRealOrder.totalAmount || 2580),
        taxableAmount: Number(
          selectedRealOrder.taxableAmount ||
            (selectedRealOrder.total ? selectedRealOrder.total * 0.95 : 2457.14)
        ),
        cgst: Number(selectedRealOrder.cgst || 61.43),
        sgst: Number(selectedRealOrder.sgst || 61.43),
      }
    : SAMPLE_PREVIEW_ORDER_PDF1;

  const previewPackingOrder: PackingSlipOrderData = selectedRealOrder
    ? {
        orderNo: selectedRealOrder.orderNo || 'ORD-PREV',
        customerName: selectedRealOrder.customerName || 'Customer',
        shopName: selectedRealOrder.customerShop || selectedRealOrder.shopName || '',
        village: selectedRealOrder.customerVillage || selectedRealOrder.village || '',
        route: selectedRealOrder.customerRoute || selectedRealOrder.route || '',
        phone: selectedRealOrder.customerPhone || selectedRealOrder.phone || '',
        orderDate: selectedRealOrder.date || selectedRealOrder.orderDate || '24-11-2026',
        items: (selectedRealOrder.items && selectedRealOrder.items.length > 0
          ? selectedRealOrder.items
          : SAMPLE_PREVIEW_PACKING_ORDER.items
        ).map((it: any) => ({
          name: it.name || it.productName || 'Item',
          qty: Number(it.qty || it.quantity || 1),
          unit: it.unit || 'Box',
        })),
      }
    : SAMPLE_PREVIEW_PACKING_ORDER;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveInvoiceTemplateConfig(config);
    toast.success('Invoice & packing templates configuration saved successfully!');
  };

  const handleTestPrint = () => {
    if (activeTab === 'packing' || config.paperSize === 'packing_slip' || config.paperSize === 'packing_sheet') {
      const ok = openPackingSlipWindow(
        previewPackingOrder,
        config.paperSize === 'packing_sheet' ? 'sheet' : 'slip',
        config
      );
      if (ok) {
        toast.success('Launched test print preview for Packing List (PDF 2 Format)');
      } else {
        toast.error('Pop-up window was blocked. Please allow popups for printing.');
      }
      return;
    }

    const ok = openTaxInvoiceWindow(previewTaxOrder, true, config.paperSize, config, false);
    if (ok) {
      toast.success(`Launched test print preview for ${config.paperSize.toUpperCase()}`);
    } else {
      toast.error('Pop-up window was blocked. Please allow popups for printing.');
    }
  };

  return (
    <div className="space-y-4 text-slate-800 pb-16">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestPrint}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" /> Test Print
          </button>
          <button
            type="button"
            onClick={handleTestPrint}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" /> Preview / Save as PDF
          </button>
        </div>
      </div>

      {/* Breadcrumb & Heading */}
      <div className="text-xs text-slate-500 font-medium">
        <span className="text-slate-400">Management</span> / <span className="text-slate-900 font-bold">Custom Invoice</span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
          Custom Invoice & Packing Templates
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Master print formats for official Tax Invoices (PDF 1) and Packing Slips (PDF 2). Changes apply across route delivery, billing, and dispatch packing.
        </p>
      </div>

      {/* Document Category Tabs: Tax Invoice vs Packing List */}
      <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveTab('invoice');
            if (config.paperSize.startsWith('packing')) {
              setConfig({ ...config, paperSize: 'slip_80' });
            }
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'invoice'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Tax Invoice Formats</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
            PDF 1
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('packing');
            setConfig({ ...config, paperSize: 'packing_slip' });
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'packing'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-amber-600" />
          <span>Packing List Formats</span>
          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
            PDF 2
          </span>
        </button>
      </div>

      {/* Main Grid: Controls Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Controls (Left 6 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> Print Configuration
            </h2>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0f2d59] hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>

          {/* Paper Format Selector Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Select Paper Format & Printer Type *
            </label>

            {activeTab === 'invoice' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'slip_80',
                    label: '80mm Slip (PDF 1)',
                    badge: 'Official PDF 1',
                    desc: 'Bilingual Kannada/English, Logo, Tax Summary',
                  },
                  {
                    id: 'a4',
                    label: 'A4 Legal',
                    badge: 'Full Page',
                    desc: 'Full page GST invoice sheet',
                  },
                  {
                    id: 'a5',
                    label: 'A5 Half',
                    badge: 'Compact',
                    desc: 'Half sheet landscape',
                  },
                  {
                    id: 'thermal_80',
                    label: '80mm Thermal',
                    badge: '3-inch Roll',
                    desc: 'Plain monospace thermal receipt',
                  },
                  {
                    id: 'thermal_58',
                    label: '58mm Thermal',
                    badge: '2-inch POS',
                    desc: 'Ultra-compact handheld POS',
                  },
                ].map((fmt) => (
                  <button
                    type="button"
                    key={fmt.id}
                    onClick={() => setConfig({ ...config, paperSize: fmt.id as InvoiceFormat })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                      config.paperSize === fmt.id
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs">{fmt.label}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {fmt.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'packing_slip',
                    label: 'Packing Slip (PDF 2)',
                    badge: 'Official PDF 2',
                    desc: 'Standard dispatch slip with checklist column, total count & sign-off',
                  },
                  {
                    id: 'packing_sheet',
                    label: 'Packing Sheet (A4 / A5)',
                    badge: 'Full Sheet',
                    desc: 'Warehouse picking & packaging verification sheet',
                  },
                ].map((fmt) => (
                  <button
                    type="button"
                    key={fmt.id}
                    onClick={() => setConfig({ ...config, paperSize: fmt.id as InvoiceFormat })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                      config.paperSize === fmt.id
                        ? 'border-amber-600 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs">{fmt.label}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {fmt.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Business Details Form Inputs */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
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

          {/* Visibility Options */}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              LIVE RENDER PREVIEW ({config.paperSize.toUpperCase()})
            </span>

            <div className="flex items-center gap-2">
              {pipelineOrders.length > 0 && (
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="text-[11px] font-bold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-700 focus:outline-none"
                  title="Select order to preview"
                >
                  <option value="sample">
                    Sample Order ({config.paperSize.startsWith('packing') ? 'ORD-1690' : 'INV-469'})
                  </option>
                  {pipelineOrders.map((o) => (
                    <option key={o.orderNo || o.id} value={o.orderNo || o.id}>
                      {o.invoiceNo || o.orderNo} · {o.customerName || 'Customer'}
                    </option>
                  ))}
                </select>
              )}
              <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {config.paperSize.startsWith('packing')
                  ? previewPackingOrder.orderNo
                  : previewTaxOrder.invoiceNo || previewTaxOrder.orderNo}
              </span>
            </div>
          </div>

          {/* Rendered Preview Container */}
          <div className="flex justify-center overflow-x-auto py-2">
            {config.paperSize === 'packing_slip' || config.paperSize === 'packing_sheet' ? (
              /* PDF FORMAT 2: PACKING LIST PREVIEW */
              <div
                className={`bg-white shadow-xl border border-slate-300 p-4 font-sans text-slate-900 rounded-sm text-[11px] ${
                  config.paperSize === 'packing_sheet' ? 'w-[440px]' : 'w-[340px]'
                }`}
              >
                <div className="text-center">
                  <div className="font-bold text-[14.5px] tracking-wide">
                    {config.companyName || 'SIDDESHWAR ENTERPRISES'}
                  </div>
                  <h4 className="font-bold text-[13.5px] tracking-wide my-1">
                    {config.title
                      ? config.title.toUpperCase().includes('PACKING')
                        ? config.title
                        : `${config.title} / PACKING LIST`
                      : 'PACKING LIST'}
                  </h4>
                </div>

                <div className="grid grid-cols-2 border border-black rounded-[7px] text-center my-2 text-[11px]">
                  <div className="p-1 border-r border-black">
                    Order No:<br />
                    <b>{previewPackingOrder.orderNo}</b>
                  </div>
                  <div className="p-1">
                    Packed on:<br />
                    <b>{previewPackingOrder.orderDate}</b>
                  </div>
                </div>

                {config.showCustomer ? (
                  <div className="grid grid-cols-2 gap-2 my-2 text-[11px] leading-tight">
                    <div>
                      M/s: {previewPackingOrder.customerName}<br />
                      {previewPackingOrder.village && (
                        <>Village: {previewPackingOrder.village}<br /></>
                      )}
                      {previewPackingOrder.phone && <>Mob: {previewPackingOrder.phone}</>}
                    </div>
                    <div>
                      {config.showVehicle && previewPackingOrder.route && (
                        <>Route: {previewPackingOrder.route}<br /></>
                      )}
                      Order date: {previewPackingOrder.orderDate}
                    </div>
                  </div>
                ) : (
                  <div className="my-2 text-[11px] leading-tight flex justify-between">
                    {config.showVehicle && previewPackingOrder.route && (
                      <div>Route: {previewPackingOrder.route}</div>
                    )}
                    <div>Order date: {previewPackingOrder.orderDate}</div>
                  </div>
                )}

                <table className="w-full border-collapse border border-black text-[11px] my-2">
                  <thead className="bg-[#cfe2f3]">
                    <tr>
                      <th className="border border-black p-1 text-center w-7">SI</th>
                      <th className="border border-black p-1 text-left">Product Name</th>
                      <th className="border border-black p-1 text-right w-10">Qty</th>
                      <th className="border border-black p-1 text-center w-11">Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPackingOrder.items.map((it: { name: string; qty: number; unit?: string }, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-black p-1 text-center">{idx + 1}</td>
                        <td className="border border-black p-1 text-left">{it.name}</td>
                        <td className="border border-black p-1 text-right font-medium">{it.qty}</td>
                        <td className="border border-black p-1 text-center"></td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} className="border border-black p-1 font-bold">
                        Total Items
                      </td>
                      <td className="border border-black p-1 text-right font-bold">
                        {previewPackingOrder.items.reduce((s: number, it: { name: string; qty: number; unit?: string }) => s + (it.qty || 0), 0)}
                      </td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-5 text-[11px] flex justify-between items-center px-1">
                  <span>Packed by: ____________</span>
                  <span>Checked by: ____________</span>
                </div>

                {config.footerLine && (
                  <div className="mt-2.5 text-center text-[10px] text-slate-600 font-medium border-t border-slate-200 pt-1.5">
                    {config.footerLine}
                  </div>
                )}
                {config.termsAndConditions && (
                  <div className="mt-1 text-center text-[9px] text-slate-500 italic">
                    {config.termsAndConditions}
                  </div>
                )}
              </div>
            ) : config.paperSize === 'slip_80' ? (
              /* PDF FORMAT 1: EXACT 80MM BILINGUAL SLIP TAX INVOICE */
              <div className="bg-white shadow-xl border border-slate-300 p-4 font-sans text-slate-900 rounded-sm w-[340px] text-[11px] relative">
                {/* Watermark Logo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none select-none">
                  <img src="/siddeshwar-logo.png" alt="" className="w-48 -rotate-30" />
                </div>

                {/* Duplicate Copy Header */}
                <div className="border border-black text-center font-black text-xs py-0.5 tracking-widest mb-2 uppercase">
                  DUPLICATE COPY
                </div>

                {/* Circular Temple Logo & Company Header */}
                <div className="text-center mb-1">
                  <img
                    src="/siddeshwar-logo.png"
                    alt="Logo"
                    className="h-14 mx-auto object-contain"
                  />
                  <div className="font-extrabold text-[15px] tracking-tight mt-1">
                    {config.companyName || 'SIDDESHWAR ENTERPRISES'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-700">
                    WHOLESALE FMCG & PROVISION STORE
                  </div>
                  {config.gstin && (
                    <div className="text-[10px] font-bold">GSTIN : {config.gstin}</div>
                  )}
                  {config.address && (
                    <div className="text-[9.5px] text-slate-600 leading-tight">
                      Address: {config.address}
                    </div>
                  )}
                  {config.phone && (
                    <div className="text-[9.5px] text-slate-600 leading-tight">
                      Mobile : {config.phone}
                    </div>
                  )}
                  <h4 className="font-black text-sm tracking-wide uppercase mt-1 mb-1.5">
                    {config.title || 'TAX INVOICE'}
                  </h4>
                </div>

                {/* Order & Invoice box */}
                <div className="grid grid-cols-2 border border-black rounded-[6px] text-center my-1.5 text-[10.5px]">
                  <div className="p-1 border-r border-black">
                    Order No:<br />
                    <b>{previewTaxOrder.orderNo}</b>
                  </div>
                  <div className="p-1">
                    Invoice No:<br />
                    <b>{previewTaxOrder.invoiceNo || 'INV-469'}</b>
                  </div>
                </div>

                {/* Customer KV details */}
                {config.showCustomer ? (
                  <div className="grid grid-cols-2 gap-2 text-[10px] leading-tight my-2">
                    <div>
                      <b>M/s:</b> {previewTaxOrder.customerName}<br />
                      {previewTaxOrder.customerNameKn && (
                        <span>Name : {previewTaxOrder.customerNameKn}<br /></span>
                      )}
                      {previewTaxOrder.customerShop && (
                        <span>Shop : {previewTaxOrder.customerShop}<br /></span>
                      )}
                      {previewTaxOrder.customerVillage && (
                        <span>Village : {previewTaxOrder.customerVillage}<br /></span>
                      )}
                      {previewTaxOrder.customerVillageKn && (
                        <span>Village : {previewTaxOrder.customerVillageKn}<br /></span>
                      )}
                      {previewTaxOrder.customerPhone && (
                        <span>Mob : {previewTaxOrder.customerPhone}<br /></span>
                      )}
                      {config.showVehicle && (
                        <>
                          {previewTaxOrder.vehicleNo && (
                            <span>Vehicle No: {previewTaxOrder.vehicleNo}<br /></span>
                          )}
                          {previewTaxOrder.createdBy && (
                            <span>Order Taken By: {previewTaxOrder.createdBy}<br /></span>
                          )}
                          {previewTaxOrder.creatorPhone && (
                            <span>Mobile: {previewTaxOrder.creatorPhone}<br /></span>
                          )}
                        </>
                      )}
                      <span>GST No: {previewTaxOrder.customerGstin || 'N/A'}</span>
                    </div>
                    <div>
                      <span>
                        Date: {previewTaxOrder.orderDate} {previewTaxOrder.orderTime || ''}
                      </span>
                      <br />
                      {previewTaxOrder.customerLandmark && (
                        <span>Landmark: {previewTaxOrder.customerLandmark}<br /></span>
                      )}
                      {previewTaxOrder.customerTaluka && (
                        <span>Taluka: {previewTaxOrder.customerTaluka}<br /></span>
                      )}
                      {previewTaxOrder.customerDistrict && (
                        <span>District: {previewTaxOrder.customerDistrict}<br /></span>
                      )}
                      {previewTaxOrder.customerRoute && (
                        <span>Route: {previewTaxOrder.customerRoute}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[10px] leading-tight my-2">
                    <div>
                      <span>
                        Date: {previewTaxOrder.orderDate} {previewTaxOrder.orderTime || ''}
                      </span>
                    </div>
                    <div>
                      {previewTaxOrder.customerRoute && (
                        <span>Route: {previewTaxOrder.customerRoute}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <table className="w-full border-collapse border border-black text-[10.5px] my-1.5">
                  <thead className="bg-[#cfe2f3]">
                    <tr>
                      <th className="border border-black p-1 text-left">Product Name</th>
                      <th className="border border-black p-1 text-center w-8">Qty</th>
                      <th className="border border-black p-1 text-right w-10">Price</th>
                      <th className="border border-black p-1 text-right w-11">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewTaxOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-1">
                          <b>{it.name}</b>
                          {it.nameKn && <div className="text-[9.5px]">{it.nameKn}</div>}
                          {config.showHsn && it.hsn && (
                            <div className="text-[9px] text-slate-500">HSN Code : {it.hsn}</div>
                          )}
                        </td>
                        <td className="border border-black p-1 text-center font-bold">{it.qty}</td>
                        <td className="border border-black p-1 text-right">{it.price.toFixed(2)}</td>
                        <td className="border border-black p-1 text-right font-bold">
                          {(it.total || it.qty * it.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="border border-black p-1">Total Items</td>
                      <td className="border border-black p-1 text-center">
                        {previewTaxOrder.items.reduce((s, i) => s + (i.qty || 0), 0)}
                      </td>
                      <td className="border border-black p-1">Total</td>
                      <td className="border border-black p-1 text-right">
                        {(
                          previewTaxOrder.total ||
                          previewTaxOrder.items.reduce((s, i) => s + (i.total || i.qty * i.price), 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotals & Payables */}
                <div className="border-t border-black pt-1 space-y-0.5 text-[10.5px]">
                  {config.showGstSplit && (
                    <>
                      <div className="flex justify-between">
                        <span>Taxable Amount</span>
                        <span className="font-mono">
                          {(
                            previewTaxOrder.taxableAmount ||
                            (previewTaxOrder.total ? previewTaxOrder.total * 0.95 : 2457.14)
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST</span>
                        <span className="font-mono">
                          {(previewTaxOrder.cgst || 61.43).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST</span>
                        <span className="font-mono">
                          {(previewTaxOrder.sgst || 61.43).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                    <span>Total Payable</span>
                    <span className="font-mono">
                      {Math.round(
                        previewTaxOrder.total ||
                          previewTaxOrder.items.reduce(
                            (s, i) => s + (i.total || i.qty * i.price),
                            0
                          )
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Tax Summary Table */}
                {config.showGstSplit && (
                  <>
                    <div className="text-center font-bold text-[10px] mt-2 mb-1">TAX SUMMARY</div>
                    <table className="w-full border-collapse border border-black text-[9px] text-center">
                      <thead className="bg-[#cfe2f3]">
                        <tr>
                          <th className="border border-black p-0.5">TAXABLE</th>
                          <th className="border border-black p-0.5">Tax Rate (%)</th>
                          <th className="border border-black p-0.5">CGST</th>
                          <th className="border border-black p-0.5">SGST</th>
                          <th className="border border-black p-0.5">IGST</th>
                          <th className="border border-black p-0.5">CESS</th>
                          <th className="border border-black p-0.5">NET</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-0.5 font-mono">
                            {(previewTaxOrder.taxableAmount || 2457.14).toFixed(2)}
                          </td>
                          <td className="border border-black p-0.5">5</td>
                          <td className="border border-black p-0.5 font-mono">
                            {(previewTaxOrder.cgst || 61.43).toFixed(2)}
                          </td>
                          <td className="border border-black p-0.5 font-mono">
                            {(previewTaxOrder.sgst || 61.43).toFixed(2)}
                          </td>
                          <td className="border border-black p-0.5 font-mono">0.00</td>
                          <td className="border border-black p-0.5">0</td>
                          <td className="border border-black p-0.5 font-mono">
                            {(previewTaxOrder.total || 2580).toFixed(2)}
                          </td>
                        </tr>
                        <tr className="font-bold">
                          <td className="border border-black p-0.5">TOTAL</td>
                          <td className="border border-black p-0.5">-</td>
                          <td className="border border-black p-0.5 font-mono">
                            {(previewTaxOrder.cgst || 61.43).toFixed(2)}
                          </td>
                          <td className="border border-black p-0.5 font-mono">
                            {(previewTaxOrder.sgst || 61.43).toFixed(2)}
                          </td>
                          <td className="border border-black p-0.5 font-mono">0.00</td>
                          <td className="border border-black p-0.5">0</td>
                          <td className="border border-black p-0.5 font-mono">
                            {(previewTaxOrder.total || 2580).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {/* Footer Note / Notice */}
                {config.footerLine && (
                  <div className="border border-dashed border-slate-600 p-2 rounded text-[9px] text-justify leading-relaxed mt-2">
                    {config.footerLine}
                  </div>
                )}

                {/* Terms and conditions */}
                {config.termsAndConditions && (
                  <div className="text-center text-[8.5px] text-slate-500 italic mt-1.5">
                    {config.termsAndConditions}
                  </div>
                )}

                {/* Offers Cut Line & Thank you */}
                <div className="border-t-2 border-b-2 border-black text-center font-bold text-[10px] tracking-widest my-2 py-0.5">
                  OFFERS
                </div>
                <div className="text-center font-black text-xs tracking-wider">
                  * THANK YOU *
                </div>
              </div>
            ) : config.paperSize === 'thermal_80' || config.paperSize === 'thermal_58' ? (
              /* Plain Monospace POS Roll */
              <div
                className={`bg-white shadow-xl border border-slate-300 p-4 font-mono text-slate-900 rounded-sm ${
                  config.paperSize === 'thermal_80' ? 'w-[300px] text-[11px]' : 'w-[230px] text-[9.5px]'
                }`}
              >
                <div className="text-center space-y-0.5">
                  <div className="font-black text-sm tracking-tight">{config.title || 'RECEIPT'}</div>
                  <div className="font-bold text-xs">{config.companyName || 'SIDDESHWAR ENTERPRISES'}</div>
                  {config.address && (
                    <div className="text-[10px] text-slate-600 leading-tight">{config.address}</div>
                  )}
                  {config.phone && <div className="text-[10px]">Ph: {config.phone}</div>}
                  {config.gstin && (
                    <div className="font-bold text-[10px]">GSTIN: {config.gstin}</div>
                  )}
                </div>

                <div className="border-b-2 border-dashed border-slate-800 my-2.5" />

                <div className="space-y-0.5 text-[10px]">
                  <div><b>Invoice:</b> {previewTaxOrder.invoiceNo || 'INV-469'}</div>
                  <div><b>Order:</b> {previewTaxOrder.orderNo}</div>
                  <div><b>Date:</b> {previewTaxOrder.orderDate} {previewTaxOrder.orderTime || ''}</div>
                  {config.showCustomer && (
                    <div><b>Cust:</b> {previewTaxOrder.customerName} ({previewTaxOrder.customerShop || ''})</div>
                  )}
                  {config.showCustomer && previewTaxOrder.customerRoute && (
                    <div><b>Route:</b> {previewTaxOrder.customerRoute}</div>
                  )}
                  {config.showVehicle && previewTaxOrder.vehicleNo && (
                    <div><b>Vehicle:</b> {previewTaxOrder.vehicleNo}</div>
                  )}
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
                    {previewTaxOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1">
                          <div className="font-bold">{it.name}</div>
                          {config.showHsn && it.hsn && (
                            <div className="text-[9px] text-slate-500">
                              HSN: {it.hsn} · {it.gst || 5}%
                            </div>
                          )}
                        </td>
                        <td className="text-center py-1">{it.qty}</td>
                        <td className="text-right py-1">{it.price}</td>
                        <td className="text-right py-1 font-bold">
                          {(it.total || it.qty * it.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-b border-dashed border-slate-800 my-2" />

                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Items / Qty:</span>
                    <span className="font-bold">
                      {previewTaxOrder.items.length} items /{' '}
                      {previewTaxOrder.items.reduce((s, it) => s + (it.qty || 0), 0)} units
                    </span>
                  </div>
                  {config.showGstSplit && (
                    <>
                      <div className="flex justify-between">
                        <span>Taxable Amt:</span>
                        <span>₹{(previewTaxOrder.taxableAmount || 2457.14).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST + SGST:</span>
                        <span>
                          ₹{((previewTaxOrder.cgst || 61.43) + (previewTaxOrder.sgst || 61.43)).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-b-2 border-dashed border-slate-800 my-1" />
                  <div className="flex justify-between font-black text-xs">
                    <span>TOTAL:</span>
                    <span>
                      ₹
                      {(
                        previewTaxOrder.total ||
                        previewTaxOrder.items.reduce((s, i) => s + (i.total || i.qty * i.price), 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-800 my-2.5" />

                <div className="text-center text-[9px] text-slate-600 space-y-1">
                  {config.footerLine && <div>{config.footerLine}</div>}
                  {config.termsAndConditions && (
                    <div className="italic text-[8px] text-slate-400">
                      {config.termsAndConditions}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* A4 / A5 Full Page Sheet */
              <div
                className={`bg-white shadow-xl border border-slate-300 p-5 font-sans text-slate-800 rounded-sm space-y-3 ${
                  config.paperSize === 'a5' ? 'w-[420px] text-[10.5px]' : 'w-[460px] text-xs'
                }`}
              >
                <div className="border-b-2 border-slate-800 pb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-sm tracking-tight text-slate-900">
                      {config.companyName || 'SIDDESHWAR ENTERPRISES'}
                    </h3>
                    {config.address && (
                      <p className="text-[10px] text-slate-600">{config.address}</p>
                    )}
                    {config.gstin && (
                      <p className="text-[10px] font-mono font-bold">GSTIN: {config.gstin}</p>
                    )}
                    {config.phone && (
                      <p className="text-[10px] text-slate-600">Ph: {config.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded uppercase">
                      {config.title || 'TAX INVOICE'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Invoice: <b>{previewTaxOrder.invoiceNo || 'INV-469'}</b>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Date: {previewTaxOrder.orderDate}
                    </p>
                  </div>
                </div>

                {config.showCustomer && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px] space-y-0.5">
                    <p className="font-bold text-slate-800">
                      Billed To: {previewTaxOrder.customerName} - {previewTaxOrder.customerShop || ''}
                    </p>
                    <p className="text-slate-600">
                      Village: {previewTaxOrder.customerVillage || ''}
                      {previewTaxOrder.customerRoute && ` · Route: ${previewTaxOrder.customerRoute}`}
                      {previewTaxOrder.customerPhone && ` · Ph: ${previewTaxOrder.customerPhone}`}
                    </p>
                    {config.showVehicle && previewTaxOrder.vehicleNo && (
                      <p className="text-slate-600">Vehicle: {previewTaxOrder.vehicleNo}</p>
                    )}
                  </div>
                )}

                <table className="w-full text-left text-[10.5px] border-collapse border border-slate-300">
                  <thead className="bg-[#cfe2f3] font-bold text-[10px]">
                    <tr>
                      <th className="p-1 border border-slate-300">Item</th>
                      {config.showHsn && (
                        <th className="p-1 border border-slate-300 text-center">HSN</th>
                      )}
                      <th className="p-1 border border-slate-300 text-center">Qty</th>
                      <th className="p-1 border border-slate-300 text-right">Price</th>
                      {config.showGstSplit && (
                        <th className="p-1 border border-slate-300 text-center">GST</th>
                      )}
                      <th className="p-1 border border-slate-300 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewTaxOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-1 border border-slate-300 font-semibold">{it.name}</td>
                        {config.showHsn && (
                          <td className="p-1 border border-slate-300 text-center font-mono">
                            {it.hsn || '-'}
                          </td>
                        )}
                        <td className="p-1 border border-slate-300 text-center">{it.qty}</td>
                        <td className="p-1 border border-slate-300 text-right">{it.price.toFixed(2)}</td>
                        {config.showGstSplit && (
                          <td className="p-1 border border-slate-300 text-center">{it.gst || 5}%</td>
                        )}
                        <td className="p-1 border border-slate-300 text-right font-bold">
                          {(it.total || it.qty * it.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-end pt-2 text-[10px]">
                  <div className="text-[9px] text-slate-500 max-w-[220px]">
                    {config.footerLine && <p className="font-bold">{config.footerLine}</p>}
                    {config.termsAndConditions && (
                      <p className="italic">{config.termsAndConditions}</p>
                    )}
                  </div>
                  <div className="text-right space-y-0.5 min-w-[140px]">
                    {config.showGstSplit && (
                      <div className="flex justify-between">
                        <span>Taxable:</span>
                        <span>₹{(previewTaxOrder.taxableAmount || 2457.14).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                      <span>Grand Total:</span>
                      <span>
                        ₹
                        {(
                          previewTaxOrder.total ||
                          previewTaxOrder.items.reduce((s, i) => s + (i.total || i.qty * i.price), 0)
                        ).toFixed(2)}
                      </span>
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

export default CustomInvoiceTemplatePage;
