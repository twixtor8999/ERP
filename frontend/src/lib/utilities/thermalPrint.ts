/**
 * Isolated Thermal Slip Printer for 80mm / 76mm POS Thermal Printers (e.g. Epson TM-T82X)
 * Directly opens a dedicated print frame without capturing the app background or modal backdrops.
 */

import { getInvoiceTemplateConfig } from "@/features/orders/utils/invoiceTemplateConfig";
import { useAuthStore } from "@/stores/auth.store";

export interface PrintSlipData {
  orderNo: string;
  invoiceNo?: string;
  customerName: string;
  shopName: string;
  village: string;
  route: string;
  createdBy?: string;
  orderDate: string;
  orderTime?: string;
  vehicleNo?: string;
  total: number;
  items: Array<{
    name: string;
    unit?: string;
    qty: number;
    price: number;
  }>;
}

export function printThermalSlip(data: PrintSlipData) {
  const cfg = getInvoiceTemplateConfig();
  const user = useAuthStore.getState().user;
  const companyName = user?.organizationName || cfg.companyName || "Wholesale Mart";
  const addressLine = cfg.address || "Main Road, Wholesale Market";
  const contactPhone = user?.phone || cfg.phone || "";

  const iframeId = "__thermal_print_frame__";
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = iframeId;
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "80mm";
    iframe.style.height = "100mm";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
  }

  const itemsRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 2px 0; font-size: 11px; text-align: left; vertical-align: top;">${item.name}</td>
        <td style="padding: 2px 0; font-size: 11px; text-align: center; vertical-align: top;">${item.qty} ${item.unit || ""}</td>
        <td style="padding: 2px 0; font-size: 11px; text-align: right; vertical-align: top;">₹${item.price}</td>
        <td style="padding: 2px 0; font-size: 11px; text-align: right; vertical-align: top; font-weight: bold;">₹${(item.qty * item.price).toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  const printHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Slip_${data.orderNo}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm 3mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 4px;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.35;
            width: 74mm;
          }
          .center { text-align: center; }
          .bold { font-weight: 700; }
          .dash { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { border-bottom: 1px dashed #000; padding: 3px 0; font-size: 11px; }
          @media print {
            body { width: 74mm; margin: 0; padding: 2px; }
          }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 15px; letter-spacing: 0.5px;">${companyName}</div>
        <div class="center" style="font-size: 10px;">${cfg.title || "WHOLESALE FMCG & PROVISION STORE"}</div>
        <div class="center" style="font-size: 10px;">${addressLine}${contactPhone ? ` · Ph: ${contactPhone}` : ""}${cfg.gstin ? ` · GSTIN: ${cfg.gstin}` : ""}</div>
        <div class="dash"></div>
        <div><b>ORDER:</b> ${data.orderNo} ${data.invoiceNo ? `· <b>INV:</b> ${data.invoiceNo}` : ""}</div>
        <div><b>DATE:</b> ${data.orderDate} ${data.orderTime || ""}</div>
        <div><b>STORE:</b> ${data.shopName || data.customerName}</div>
        <div><b>CUSTOMER:</b> ${data.customerName} (${data.village})</div>
        <div><b>ROUTE:</b> ${data.route || "Bijapur"}</div>
        ${data.vehicleNo ? `<div><b>VEHICLE:</b> ${data.vehicleNo}</div>` : ""}
        <div class="dash"></div>
        <table>
          <thead>
            <tr>
              <th align="left">ITEM</th>
              <th align="center">QTY</th>
              <th align="right">RATE</th>
              <th align="right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <div class="dash"></div>
        <table style="width: 100%;">
          <tr>
            <td class="bold" style="font-size: 13px;">GRAND TOTAL:</td>
            <td class="bold right" style="font-size: 14px; text-align: right;">₹${data.total.toLocaleString("en-IN")}</td>
          </tr>
        </table>
        <div class="dash"></div>
        <div class="center" style="font-size: 10px; margin-top: 6px;">Thank You! Visit Again</div>
      </body>
    </html>
  `;

  const frameDoc = iframe.contentWindow || iframe.contentDocument;
  if (!frameDoc) return;
  const doc = iframe.contentDocument || (iframe.contentWindow ? iframe.contentWindow.document : null);
  if (!doc) return;

  doc.open();
  doc.write(printHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print error:", e);
    }
  }, 250);
}
