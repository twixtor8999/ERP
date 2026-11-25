/**
 * taxInvoicePrinter.ts
 * Generates and prints the exact Tax Invoice (Duplicate Copy / Original Copy)
 * matching the client reference application (INV-469_duplicate layout).
 */

import type { InvoiceFormat, InvoiceTemplateConfig } from "./invoiceTemplateConfig";
import { getInvoiceTemplateConfig, generateThermalReceiptHtml } from "./invoiceTemplateConfig";

export interface TaxInvoiceItem {
  name: string;
  nameKn?: string;
  hsn?: string;
  qty: number;
  price: number;
  gst?: number;
  total?: number;
}

export interface TaxInvoiceOrder {
  id?: string | number;
  orderNo: string;
  invoiceNo?: string;
  orderDate?: string;
  orderTime?: string;
  status?: string;

  // Customer metadata
  customer?: {
    id?: string | number;
    name: string;
    nameKn?: string;
    shop?: string;
    village?: string;
    villageKn?: string;
    phone?: string;
    landmark?: string;
    taluka?: string;
    district?: string;
    route?: string;
    gstin?: string;
  };
  customerName?: string;
  customerNameKn?: string;
  customerShop?: string;
  customerVillage?: string;
  customerVillageKn?: string;
  customerPhone?: string;
  customerLandmark?: string;
  customerTaluka?: string;
  customerDistrict?: string;
  customerRoute?: string;
  customerGstin?: string;

  vehicleNo?: string;
  createdBy?: string;
  creatorPhone?: string;
  route?: string;

  items: TaxInvoiceItem[];

  total?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  paid?: number;
  paidAmount?: number;
  balance?: number;
  paymentMode?: string;
}

/**
 * Generates the inner Tax Invoice HTML matching the reference app (.inv container).
 */
export function generateTaxInvoiceInnerHtml(
  order: TaxInvoiceOrder,
  isDuplicate = true,
  config?: InvoiceTemplateConfig
): string {
  const cfg = config || getInvoiceTemplateConfig();
  const logoUrl = typeof window !== "undefined" && window.location?.origin
    ? `${window.location.origin}/siddeshwar-logo.png`
    : "/siddeshwar-logo.png";

  const companyName = cfg.companyName || "SIDDESHWAR ENTERPRISES";
  const companyGstin = cfg.gstin || "29FMEPK5524A1Z8";
  const companyAddress = cfg.address || "648/1 Flat No 28, Akashvani road, Vijayapura, Karnataka, 586101";
  const companyPhone = cfg.phone || "9880801735";
  const invoiceTitle = cfg.title || "TAX INVOICE";

  const custName = order.customerName || order.customer?.name || "";
  const custNameKn = order.customerNameKn || order.customer?.nameKn || "";
  const custShop = order.customerShop || order.customer?.shop || (custName ? `${custName} Store` : "");
  const custVillage = order.customerVillage || order.customer?.village || "";
  const custVillageKn = order.customerVillageKn || order.customer?.villageKn || "";
  const custPhone = order.customerPhone || order.customer?.phone || "";
  const custLandmark = order.customerLandmark || order.customer?.landmark || "";
  const custTaluka = order.customerTaluka || order.customer?.taluka || "";
  const custDistrict = order.customerDistrict || order.customer?.district || "";
  const custRoute = order.customerRoute || order.customer?.route || order.route || "";
  const custGst = order.customerGstin || order.customer?.gstin || "N/A";

  const orderNo = order.orderNo || "";
  const invoiceNo = order.invoiceNo || order.orderNo || "";
  const dateStr = order.orderDate || new Date().toLocaleDateString("en-GB");
  const timeStr = order.orderTime || "";
  const vehicleNo = order.vehicleNo || "";
  const orderTakenBy = order.createdBy || "";
  const takenByPhone = order.creatorPhone || "";

  // Process items & compute GST
  const lines = (order.items && order.items.length > 0 ? order.items : []).map((item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const amt = item.total != null ? Number(item.total) : qty * price;
    const gstRate = item.gst != null ? Number(item.gst) : 5;
    const taxable = amt / (1 + gstRate / 100);
    const tax = amt - taxable;
    return {
      ...item,
      qty,
      price,
      amt,
      gstRate,
      taxable,
      tax,
    };
  });

  const totalQty = lines.reduce((acc, l) => acc + l.qty, 0);
  const totalAmt = lines.reduce((acc, l) => acc + l.amt, 0);
  const totalTaxable = lines.reduce((acc, l) => acc + l.taxable, 0);
  const totalTax = lines.reduce((acc, l) => acc + l.tax, 0);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const totalPayable = Math.round(totalAmt);

  // Group by GST rate for Tax Summary
  const taxSummary: Record<number, { taxable: number; tax: number; net: number }> = {};
  for (const line of lines) {
    if (!taxSummary[line.gstRate]) {
      taxSummary[line.gstRate] = { taxable: 0, tax: 0, net: 0 };
    }
    const entry = taxSummary[line.gstRate];
    if (entry) {
      entry.taxable += line.taxable;
      entry.tax += line.tax;
      entry.net += line.amt;
    }
  }

  return `
    <div class="inv">
      <div class="wm">
        <img src="${logoUrl}" alt="" style="width:78%;opacity:0.12;transform:rotate(-30deg);" />
      </div>

      ${isDuplicate ? `<div class="dup">DUPLICATE COPY</div>` : ""}

      <img src="${logoUrl}" class="logo" alt="${companyName}" />
      <div class="co">${companyName}</div>
      <div class="c" style="font-size:10px;font-weight:700;letter-spacing:0.4px;margin-bottom:2px">WHOLESALE FMCG & PROVISION STORE</div>
      ${companyGstin ? `<div class="c">GSTIN : ${companyGstin}</div>` : ""}
      <div class="ad">
        ${companyAddress ? `<div>Address: ${companyAddress}</div>` : ""}
        ${companyPhone ? `<div>Mobile : ${companyPhone}</div>` : ""}
      </div>

      <h4>${invoiceTitle}</h4>

      <div class="bx">
        <div>Order No:<br /><b>${orderNo}</b></div>
        <div>Invoice No:<br /><b>${invoiceNo}</b></div>
      </div>

      ${cfg.showCustomer ? `
        <div class="kv">
          <div>
            <div>M/s: ${custName}<br /><span class="knl">Name: ${custNameKn}</span></div>
            <div>Shop: ${custShop}</div>
            <div>Village: ${custVillage}<br /><span class="knl">Village: ${custVillageKn}</span></div>
            <div>Mob: ${custPhone}</div>
            ${cfg.showVehicle ? `
              <div>Vehicle No: ${vehicleNo}</div>
              <div>Order Taken By: ${orderTakenBy}</div>
              <div>Mobile: ${takenByPhone}</div>
            ` : ""}
            <div>GST No: ${custGst}</div>
          </div>
          <div>
            <div>Date: ${dateStr} ${timeStr}</div>
            <div>Landmark: ${custLandmark}</div>
            <div>Taluka: ${custTaluka}</div>
            <div>District: ${custDistrict}</div>
            <div>Route: ${custRoute}</div>
          </div>
        </div>
      ` : `
        <div class="kv" style="grid-template-columns: 1fr;">
          <div>
            <div>Date: ${dateStr} ${timeStr}</div>
            <div>Route: ${custRoute}</div>
          </div>
        </div>
      `}

      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th class="n">Qty</th>
            <th class="n">Price</th>
            <th class="n">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lines
            .map(
              (l) => `
            <tr>
              <td>
                ${l.name}
                ${l.nameKn ? `<br /><span class="knl">${l.nameKn}</span>` : ""}
                ${cfg.showHsn && l.hsn ? `<br /><small>HSN Code: ${l.hsn}</small>` : ""}
              </td>
              <td class="n">${l.qty}</td>
              <td class="n">${l.price.toFixed(2)}</td>
              <td class="n">${l.amt.toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
          <tr>
            <td><b>Total Items</b></td>
            <td class="n"><b>${totalQty}</b></td>
            <td><b>Total</b></td>
            <td class="n"><b>${totalAmt.toFixed(2)}</b></td>
          </tr>
        </tbody>
      </table>

      <div class="sum">
        ${cfg.showGstSplit ? `
          <div><span>Taxable Amount</span><span>${totalTaxable.toFixed(2)}</span></div>
          <div><span>CGST</span><span>${cgst.toFixed(2)}</span></div>
          <div><span>SGST</span><span>${sgst.toFixed(2)}</span></div>
        ` : ""}
        <div class="big font-bold"><span>Total Payable</span><span>${totalPayable.toFixed(2)}</span></div>
      </div>

      ${cfg.showGstSplit ? `
        <div class="c" style="margin-top:8px"><b>TAX SUMMARY</b></div>
        <table class="ts">
          <thead>
            <tr>
              <th>Taxable</th>
              <th>Tax Rate (%)</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>CESS</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(taxSummary)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(
                ([rate, s]) => `
              <tr>
                <td class="n">${s.taxable.toFixed(2)}</td>
                <td class="n">${rate}</td>
                <td class="n">${(s.tax / 2).toFixed(2)}</td>
                <td class="n">${(s.tax / 2).toFixed(2)}</td>
                <td class="n">0.00</td>
                <td class="n">0</td>
                <td class="n">${s.net.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
            <tr>
              <th>TOTAL</th>
              <th>-</th>
              <th class="n">${cgst.toFixed(2)}</th>
              <th class="n">${sgst.toFixed(2)}</th>
              <th class="n">0.00</th>
              <th class="n">0</th>
              <th class="n">${totalAmt.toFixed(2)}</th>
            </tr>
          </tbody>
        </table>
      ` : ""}

      ${cfg.footerLine ? `
        <p style="margin:8px 0 0;font-size:10px;line-height:1.45;border:1px dashed #aaa;padding:6px;border-radius:4px;text-align:justify">
          ${cfg.footerLine}
        </p>
      ` : ""}

      ${cfg.termsAndConditions ? `
        <div style="margin:6px 0 2px;font-size:9.5px;color:#444;text-align:center;font-style:italic;">
          ${cfg.termsAndConditions}
        </div>
      ` : ""}

      <div style="border-top:2px double #000;border-bottom:2px double #000;margin:10px 0 6px;padding:3px 0;text-align:center;font-size:10px;font-weight:bold;letter-spacing:1.5px">OFFERS</div>
      <div class="c" style="margin-top:6px;font-weight:bold;letter-spacing:1px">* THANK YOU *</div>
    </div>
  `;
}

/**
 * Generates the full standalone HTML page for the print preview window
 * with the fixed dark navy header bar and print/pdf buttons.
 */
export function generateTaxInvoiceDocument(
  order: TaxInvoiceOrder,
  isDuplicate = true,
  config?: InvoiceTemplateConfig
): string {
  const docTitle = `${order.invoiceNo || order.orderNo || "INV-469"}${isDuplicate ? "_duplicate" : ""}`;
  const innerHtml = generateTaxInvoiceInnerHtml(order, isDuplicate, config);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body {
      background: #e9edf3 !important;
      margin: 0;
      padding: 0;
      font-family: 'Noto Sans Kannada', 'Plus Jakarta Sans', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .nxtb461 {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 48px;
      z-index: 999;
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: flex-end;
      background: #0d1b4c;
      color: #fff;
      padding: 0 16px;
    }
    .nxtb461 b {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    .nxtb461 button {
      border: 0;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s ease, transform 0.1s ease;
    }
    .nxtb461 button:active {
      transform: scale(0.97);
    }
    .nxtb461 button:hover {
      opacity: 0.92;
    }
    .nxtb461 .p {
      background: #f5b400;
      color: #0d1b4c;
      width: 36px;
      height: 36px;
      font-size: 19px;
      padding: 0;
    }
    .nxtb461 .k {
      background: #ffffff;
      color: #0d1b4c;
      font-size: 13px;
      padding: 6px 14px;
      height: 32px;
    }
    #pr {
      display: block !important;
      background: #ffffff;
      margin: 62px auto 40px;
      width: max-content;
      max-width: 100%;
      box-shadow: 0 4px 20px rgba(13, 27, 76, 0.14);
      padding: 6px;
      border-radius: 2px;
      position: relative;
    }
    .inv {
      width: 330px;
      max-width: 100%;
      margin: 0 auto;
      padding: 12px 14px;
      background: #ffffff;
      color: #000000;
      font: 11px/1.38 'Noto Sans Kannada', 'Plus Jakarta Sans', Arial, sans-serif;
      position: relative;
    }
    .inv .dup {
      border: 1.5px solid #000000;
      text-align: center;
      font-weight: 800;
      padding: 2.5px 4px;
      margin-bottom: 8px;
      letter-spacing: 0.12em;
      font-size: 12px;
    }
    .inv .c { text-align: center; }
    .inv .co { font-size: 1.45em; font-weight: 800; text-align: center; letter-spacing: -0.01em; margin-bottom: 1px; }
    .inv .logo { max-height: 60px; max-width: 70%; display: block; margin: 0 auto 4px; }
    .inv .ad { display: grid; grid-template-columns: 1fr; border: 1px solid #000000; margin: 6px 0; }
    .inv .ad > div { padding: 4px; font-size: 10px; }
    .inv h4 { margin: 8px 0 6px; font-size: 1.45em; text-align: center; font-weight: 800; color: #000000; letter-spacing: 0.04em; }
    .inv .bx { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #000000; border-radius: 6px; text-align: center; margin: 6px 0; font-size: 10.5px; }
    .inv .bx > div { padding: 4px; }
    .inv .bx > div + div { border-left: 1px solid #000000; }
    .inv .kv { display: grid; grid-template-columns: 1.25fr 1fr; gap: 0 8px; margin: 8px 0; font-size: 10px; line-height: 1.35; }
    .inv .knl { font-family: 'Noto Sans Kannada', sans-serif; }
    .inv table { font-size: inherit; width: 100%; border-collapse: collapse; background: transparent; margin: 6px 0; }
    .inv th, .inv td { border: 1px solid #000000; padding: 3px 4px; font-size: 1em; color: #000000; background: transparent; white-space: normal; }
    .inv th { background: #cfe2f3 !important; font-weight: 700; color: #000000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .inv td.n, .inv th.n { text-align: right; }
    .inv small { font-size: 0.9em; }
    .inv .ts th, .inv .ts td { font-size: 0.78em; padding: 2px 2px; }
    .inv .sum { border-top: 1px solid #000000; margin-top: 8px; padding-top: 4px; font-size: 11px; }
    .inv .sum > div { display: flex; justify-content: space-between; padding: 1.5px 0; }
    .inv .sum .big { font-size: 1.35em; font-weight: 800; margin-top: 4px; border-top: 1px solid #000000; padding-top: 3px; }
    .inv .wm { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; pointer-events: none; z-index: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .inv .wm img { max-height: 80%; object-fit: contain; }

    @media print {
      .nxtb461 { display: none !important; }
      html, body { background: #ffffff !important; }
      #pr { margin: 0 !important; box-shadow: none !important; padding: 0 !important; width: auto; }
      .inv { width: auto; max-width: 76mm; padding: 0; }
      .inv th { background: #cfe2f3 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="nxtb461">
    <b>${docTitle}</b>
    <button class="p" onclick="window.print()" title="Print" aria-label="Print">🖨</button>
    <button class="k" onclick="nxPdf461()" title="Save as PDF">⬇ PDF</button>
  </div>
  <div id="pr">
    ${innerHtml}
  </div>

  <script>
    async function nxL(u) {
      return new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        s.src = u;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    async function nxPdf461() {
      var bar = document.querySelector('.nxtb461');
      try {
        if (bar) bar.style.display = 'none';
        await nxL('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await nxL('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        var el = document.getElementById('pr');
        var cv = await window.html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, allowTaint: true });
        var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        var w = cv.width / 2;
        var h = cv.height / 2;
        var pdf = new jsPDF({ unit: 'px', format: [w, h], orientation: w > h ? 'l' : 'p' });
        pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
        pdf.save(${JSON.stringify(docTitle)} + '.pdf');
      } catch (err) {
        console.warn('nxPdf461 fallback to window.print():', err);
        window.print();
      } finally {
        if (bar) bar.style.display = 'flex';
      }
    }
    setTimeout(function() {
      try { window.focus(); } catch(e) {}
    }, 150);
  </script>
</body>
</html>`;
}

export {
  getInvoiceTemplateConfig,
  generateThermalReceiptHtml,
};

/**
 * Opens a dedicated popup tab or window with the Tax Invoice
 * (matching the client's reference application `INV-469_duplicate`).
 * Returns true if opened successfully.
 */
export function openTaxInvoiceWindow(
  order: TaxInvoiceOrder,
  isDuplicate = true,
  formatOverride?: InvoiceFormat,
  config?: InvoiceTemplateConfig
): boolean {
  try {
    const effectiveConfig = config || getInvoiceTemplateConfig();
    const effectiveFormat: InvoiceFormat = formatOverride || effectiveConfig.paperSize || "slip_80";

    let doc = "";
    const docTitle = `${order.invoiceNo || order.orderNo || "INV-469"}${isDuplicate ? "_duplicate" : ""}_${effectiveFormat}`;

    if (effectiveFormat === "slip_80") {
      // PDF Format 1: Exact Bilingual 80mm Slip Tax Invoice
      doc = generateTaxInvoiceDocument(order, isDuplicate, effectiveConfig);
    } else if (effectiveFormat === "thermal_80") {
      doc = generateThermalReceiptHtml(order, 80, effectiveConfig);
    } else if (effectiveFormat === "thermal_58") {
      doc = generateThermalReceiptHtml(order, 58, effectiveConfig);
    } else if (effectiveFormat === "a5") {
      // Generate A5 style by modifying page style in the standard invoice document
      doc = generateTaxInvoiceDocument(order, isDuplicate, effectiveConfig).replace(
        "@page { size: A4 portrait;",
        "@page { size: A5 landscape;"
      );
    } else {
      doc = generateTaxInvoiceDocument(order, isDuplicate, effectiveConfig);
    }

    // 1. First attempt: Direct window.open with document.write
    let win: Window | null = null;
    try {
      win = window.open("", "_blank");
      if (win && win.document) {
        win.document.open();
        win.document.write(doc);
        win.document.close();
        win.document.title = docTitle;
        try {
          win.focus();
        } catch {}
        return true;
      }
    } catch (popupErr) {
      console.warn("Direct window.open document.write blocked or restricted, using blob link:", popupErr);
    }

    // 2. Reliable fallback: Blob URL opened via an anchor with target="_blank"
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return true;
  } catch (err) {
    console.error("Failed to open tax invoice window:", err);
    return false;
  }
}
