import { TaxInvoiceOrder } from "./taxInvoicePrinter";

export type InvoiceFormat =
  | "slip_80"
  | "a4"
  | "a5"
  | "thermal_80"
  | "thermal_58"
  | "packing_slip"
  | "packing_sheet";

export interface InvoiceTemplateConfig {
  documentType?: "invoice" | "packing";
  paperSize: InvoiceFormat;
  companyName: string;
  address: string;
  gstin: string;
  phone: string;
  title: string;
  footerLine: string;
  termsAndConditions: string;
  showCustomer: boolean;
  showVehicle: boolean;
  showHsn: boolean;
  showGstSplit: boolean;
}

export const DEFAULT_INVOICE_CONFIG: InvoiceTemplateConfig = {
  documentType: "invoice",
  paperSize: "slip_80",
  companyName: "SIDDESHWAR ENTERPRISES",
  address: "648/1 Flat No 28 , Akashvani road , Vijayapura,Karnataka ,586101",
  gstin: "29FMEPK5524A1Z8",
  phone: "9880801735",
  title: "TAX INVOICE",
  footerLine: "Thank you. Visit again.",
  termsAndConditions: "",
  showCustomer: true,
  showVehicle: true,
  showHsn: true,
  showGstSplit: true,
};

const INVOICE_CONFIG_STORAGE_KEY = "pk_custom_invoice_config_v2";

export function getInvoiceTemplateConfig(): InvoiceTemplateConfig {
  try {
    const raw = localStorage.getItem(INVOICE_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_INVOICE_CONFIG;
    return { ...DEFAULT_INVOICE_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_INVOICE_CONFIG;
  }
}

export function saveInvoiceTemplateConfig(config: Partial<InvoiceTemplateConfig>): InvoiceTemplateConfig {
  const current = getInvoiceTemplateConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(INVOICE_CONFIG_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save invoice template config", e);
  }
  return updated;
}

/**
 * Generates compact Thermal POS / Delivery receipt (80mm or 58mm width)
 */
export function generateThermalReceiptHtml(
  order: TaxInvoiceOrder,
  widthMm: 80 | 58 = 80,
  config?: InvoiceTemplateConfig,
  autoPrint = true
): string {
  const cfg = config || getInvoiceTemplateConfig();
  const widthPx = widthMm === 80 ? 302 : 219;
  const fontSize = widthMm === 80 ? "11px" : "9.5px";

  const totalQty = order.items.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalAmount = order.total || order.items.reduce((sum, i) => sum + (i.total || i.qty * i.price), 0);
  const paidAmount = order.paidAmount || (order.balance === 0 ? totalAmount : totalAmount - (order.balance || 0));
  const balanceAmount = order.balance !== undefined ? order.balance : Math.max(0, totalAmount - paidAmount);

  // Tax calculations
  let totalTaxable = 0;
  let totalGst = 0;
  order.items.forEach((item) => {
    const rate = item.gst !== undefined ? item.gst : 5;
    const itemTotal = item.total || item.qty * item.price;
    const taxable = itemTotal / (1 + rate / 100);
    totalTaxable += taxable;
    totalGst += (itemTotal - taxable);
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${order.invoiceNo || order.orderNo}_Thermal_${widthMm}mm</title>
  <style>
    @page {
      margin: 0;
      size: ${widthMm}mm auto;
    }
    body {
      margin: 0;
      padding: 6px 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.35;
      color: #000;
      width: ${widthPx}px;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .dash {
      border-bottom: 1px dashed #000;
      margin: 5px 0;
    }
    .double-dash {
      border-bottom: 2px dashed #000;
      margin: 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: inherit;
    }
    th, td {
      padding: 2px 0;
      vertical-align: top;
    }
    th {
      border-bottom: 1px dashed #000;
      text-align: left;
    }
    .receipt-title {
      font-size: 1.25em;
      font-weight: 900;
      margin-bottom: 2px;
    }
    .co-name {
      font-size: 1.15em;
      font-weight: 800;
    }
    .action-bar {
      margin-bottom: 10px;
      text-align: center;
    }
    @media print {
      .action-bar { display: none !important; }
      body { width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <button onclick="window.print()" style="padding: 6px 14px; font-weight: bold; cursor: pointer; background: #132038; color: #fff; border-radius: 4px; border: none;">
      🖨️ Print ${widthMm}mm Thermal Receipt
    </button>
  </div>

  <div class="text-center">
    <div class="receipt-title">${cfg.title}</div>
    <div class="co-name">${cfg.companyName}</div>
    <div>${cfg.address}</div>
    ${cfg.phone ? `<div>Ph: ${cfg.phone}</div>` : ""}
    <div class="font-bold">GSTIN: ${cfg.gstin}</div>
  </div>

  <div class="double-dash"></div>

  <div>
    ${order.invoiceNo ? `<div><b>Invoice:</b> ${order.invoiceNo}</div>` : ""}
    <div><b>Order No:</b> ${order.orderNo}</div>
    <div><b>Date:</b> ${order.orderDate || new Date().toISOString().split("T")[0]} ${order.orderTime || ""}</div>
    ${cfg.showCustomer && (order.customerName || order.customer?.name) ? `<div><b>Customer:</b> ${order.customerName || order.customer?.name}</div>` : ""}
    ${cfg.showCustomer && (order.customerVillage || order.customer?.village) ? `<div><b>Village / Route:</b> ${order.customerVillage || order.customer?.village || ""} ${order.route ? `(${order.route})` : ""}</div>` : ""}
    ${cfg.showCustomer && (order.customerPhone || order.customer?.phone) ? `<div><b>Phone:</b> ${order.customerPhone || order.customer?.phone}</div>` : ""}
    ${cfg.showVehicle && order.vehicleNo ? `<div><b>Vehicle:</b> ${order.vehicleNo}</div>` : ""}
  </div>

  <div class="dash"></div>

  <table>
    <thead>
      <tr>
        <th style="width: 48%;">Item</th>
        <th style="width: 14%; text-align: center;">Qty</th>
        <th style="width: 18%; text-align: right;">Rate</th>
        <th style="width: 20%; text-align: right;">Amt</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((it) => {
        const itemAmt = it.total || it.qty * it.price;
        return `
        <tr>
          <td>
            <div class="font-bold">${it.name}</div>
            ${cfg.showHsn && it.hsn ? `<div style="font-size: 0.85em; color: #333;">HSN: ${it.hsn} · GST: ${it.gst || 0}%</div>` : ""}
          </td>
          <td style="text-align: center;">${it.qty}</td>
          <td style="text-align: right;">${it.price}</td>
          <td style="text-align: right; font-weight: bold;">${itemAmt.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>

  <div class="dash"></div>

  <div>
    <div style="display: flex; justify-content: space-between;">
      <span>Total Items / Qty:</span>
      <span class="font-bold">${order.items.length} items / ${totalQty} units</span>
    </div>
    ${cfg.showGstSplit ? `
    <div style="display: flex; justify-content: space-between;">
      <span>Taxable Amount:</span>
      <span>₹${totalTaxable.toFixed(2)}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>CGST + SGST:</span>
      <span>₹${totalGst.toFixed(2)}</span>
    </div>
    ` : ""}
    <div class="double-dash"></div>
    <div style="display: flex; justify-content: space-between; font-size: 1.2em; font-weight: 900;">
      <span>NET TOTAL:</span>
      <span>₹${Math.round(totalAmount).toLocaleString("en-IN")}</span>
    </div>
    <div class="double-dash"></div>
    <div style="display: flex; justify-content: space-between;">
      <span>Paid / Received:</span>
      <span class="font-bold">₹${Math.round(paidAmount).toLocaleString("en-IN")}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-weight: bold;">
      <span>Balance Due:</span>
      <span>${balanceAmount > 0 ? `₹${Math.round(balanceAmount).toLocaleString("en-IN")}` : "✔ NIL"}</span>
    </div>
  </div>

  <div class="dash"></div>

  <div class="text-center" style="font-size: 0.9em; margin-top: 6px;">
    <div>${cfg.footerLine}</div>
    ${cfg.termsAndConditions ? `<div style="font-size: 0.8em; margin-top: 4px; color: #444;">${cfg.termsAndConditions}</div>` : ""}
  </div>

  <script>
${autoPrint ? `    var printed = false;
    function triggerAutoPrint() {
      if (printed) return;
      printed = true;
      try { window.focus(); } catch(e) {}
      try { window.print(); } catch(e) {}
    }
    if (document.readyState === 'complete') {
      setTimeout(triggerAutoPrint, 250);
    } else {
      window.addEventListener('load', function() {
        setTimeout(triggerAutoPrint, 250);
      });
      setTimeout(triggerAutoPrint, 900);
    }` : `    setTimeout(function() {
      try { window.focus(); } catch(e) {}
    }, 150);`}
  </script>
</body>
</html>`;
}
