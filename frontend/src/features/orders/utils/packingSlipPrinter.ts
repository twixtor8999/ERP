import type { InvoiceTemplateConfig } from "./invoiceTemplateConfig";
import { getInvoiceTemplateConfig } from "./invoiceTemplateConfig";

export interface PackingSlipOrderData {
  orderNo: string;
  customerName: string;
  shopName?: string;
  village?: string;
  route?: string;
  phone?: string;
  orderDate?: string;
  items: Array<{
    name: string;
    qty: number;
    unit?: string;
  }>;
}

export const SAMPLE_PREVIEW_PACKING_ORDER: PackingSlipOrderData = {
  orderNo: "ORD-1690",
  orderDate: "24-11-2026",
  customerName: "Patil Gundu",
  route: "Basavan Bagewadi",
  village: "Uppaladinni",
  phone: "9611161548",
  items: [
    { name: "Raag Gold Palm Oil 1Ltr 10Pcs Box", qty: 5 },
    { name: "VST Vegetable Oil 1Kg 10Pcs Box", qty: 3 },
    { name: "Zeeba Jeera Rice 26 Kg Bag", qty: 1 },
    { name: "Namasthe Gram Flour 10Kg Bag", qty: 5 },
    { name: "Sugar S-30 50Kg Bag", qty: 1 },
    { name: "Poha 30kg Bag", qty: 1 },
    { name: "Trulove Orange Kreme 5Rs 144Pcs Box", qty: 1 },
  ],
};

export function generatePackingSlipHtml(
  order: PackingSlipOrderData,
  format: "slip" | "sheet" = "slip",
  config?: InvoiceTemplateConfig
): string {
  const cfg = config || getInvoiceTemplateConfig();
  const isSheet = format === "sheet";
  const containerWidth = isSheet ? "750px" : "380px";
  const customerName = order.customerName || "";
  const village = order.village || "";
  const phone = order.phone || cfg.phone || "";
  const route = order.route ? (order.route.toLowerCase().includes("route") ? order.route : `${order.route} Route`) : "—";
  const orderDate = order.orderDate || new Date().toLocaleDateString("en-GB");
  const packedDate = orderDate;
  const title = `packing_${order.orderNo}`;
  const totalQty = order.items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const companyName = cfg.companyName || "SIDDESHWAR ENTERPRISES";
  const headerTitle = cfg.title ? (cfg.title.toUpperCase().includes("PACKING") ? cfg.title : `${cfg.title} / PACKING LIST`) : "PACKING LIST";

  const itemsRows = order.items
    .map(
      (it, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 3px 4px;">${idx + 1}</td>
        <td style="text-align: left; border: 1px solid #000; padding: 3px 4px;">${it.name}</td>
        <td style="text-align: right; border: 1px solid #000; padding: 3px 4px; font-weight: normal;">${it.qty}</td>
        <td style="border: 1px solid #000; padding: 3px 4px; width: 44px;"></td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
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
      z-index: 99;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      background: #0d1b4c;
      color: #fff;
      padding: 0 18px;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }
    .nxtb461 .title {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: #ffffff;
      white-space: nowrap;
    }
    .nxtb461 .btn-group {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .nxtb461 button {
      font-size: 14px;
      font-weight: 700;
      border: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s;
    }
    .nxtb461 button:hover {
      opacity: 0.92;
    }
    .nxtb461 .p {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #f5b400;
      color: #0d1b4c;
      font-size: 20px;
      line-height: 1;
      padding: 0;
    }
    .nxtb461 .k {
      background: #ffffff;
      color: #0d1b4c;
      border-radius: 999px;
      padding: 8px 18px;
      font-size: 14px;
      font-weight: 700;
      gap: 4px;
    }
    #pr {
      display: block !important;
      background: #ffffff;
      margin: 70px auto 30px;
      width: ${containerWidth};
      max-width: 95%;
      box-shadow: 0 2px 14px rgba(0,0,0,0.12);
      padding: 12px 14px;
      border-radius: 2px;
    }
    .inv {
      width: 100%;
      background: #fff;
      color: #000;
      font-size: 11px;
      line-height: 1.38;
    }
    .inv .co {
      font-size: 14.5px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }
    .inv h4 {
      margin: 4px 0 6px;
      font-size: 13.5px;
      text-align: center;
      font-weight: 700;
      color: #000;
      letter-spacing: 0.5px;
    }
    .inv .bx {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid #000;
      border-radius: 7px;
      text-align: center;
      margin: 6px 0;
      font-size: 11px;
    }
    .inv .bx > div {
      padding: 3px 2px;
    }
    .inv .bx > div + div {
      border-left: 1px solid #000;
    }
    .inv .kv {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 0 8px;
      margin: 10px 0;
      font-size: 11px;
      line-height: 1.35;
    }
    .inv table {
      font-size: 11px;
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      margin: 4px 0;
    }
    .inv th, .inv td {
      border: 1px solid #000;
      padding: 3px 4px;
      font-size: 11px;
      color: #000;
      background: #fff;
      white-space: normal;
    }
    .inv th {
      background: #cfe2f3 !important;
      font-weight: 700;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .inv td.n, .inv th.n {
      text-align: right;
    }
    @media print {
      .nxtb461 {
        display: none !important;
      }
      html, body {
        background: #ffffff !important;
      }
      #pr {
        margin: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        width: auto !important;
        max-width: 76mm !important;
      }
    }
  </style>
</head>
<body>
  <div class="nxtb461">
    <div class="title">${title}</div>
    <div class="btn-group">
      <button class="p" onclick="window.print()" title="Print" aria-label="Print">🖨</button>
      <button class="k" onclick="nxPdf461()" title="Save as PDF">⬇ PDF</button>
    </div>
  </div>
  <div id="pr">
    <div class="inv">
      <div class="co">${companyName}</div>
      <h4>${headerTitle}</h4>
      <div class="bx">
        <div>Order No:<br><b>${order.orderNo}</b></div>
        <div>Packed on:<br><b>${packedDate}</b></div>
      </div>
      ${cfg.showCustomer ? `
        <div class="kv">
          <div>
            M/s: ${customerName}
            ${village ? `<br>Village: ${village}` : ''}
            ${phone ? `<br>Mob: ${phone}` : ''}
          </div>
          <div>
            ${cfg.showVehicle ? `Route: ${route}<br>` : ''}
            Order date: ${orderDate}
          </div>
        </div>
      ` : `
        <div class="kv" style="grid-template-columns: 1fr;">
          <div>
            ${cfg.showVehicle ? `Route: ${route}<br>` : ''}
            Order date: ${orderDate}
          </div>
        </div>
      `}
      <table>
        <thead>
          <tr>
            <th style="width: 28px; text-align: center;">SI</th>
            <th style="text-align: left;">Product Name</th>
            <th class="n" style="width: 36px; text-align: right;">Qty</th>
            <th style="width: 44px; text-align: center;">Check</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 4px 6px;"><b>Total Items</b></td>
            <td class="n" style="border: 1px solid #000; padding: 4px 6px; text-align: right;"><b>${totalQty}</b></td>
            <td style="border: 1px solid #000; padding: 4px 6px;"></td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 24px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; padding: 0 4px;">
        <span>Packed by: ____________________</span>
        <span>Checked by: ____________________</span>
      </div>
      ${cfg.footerLine ? `<div style="text-align: center; font-size: 10px; margin-top: 12px; color: #555;">${cfg.footerLine}</div>` : ""}
      ${cfg.termsAndConditions ? `<div style="text-align: center; font-size: 9px; margin-top: 4px; color: #777; font-style: italic;">${cfg.termsAndConditions}</div>` : ""}
    </div>
  </div>
  <script>
    async function nxL(u) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = u;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    async function nxPdf461() {
      const b = document.querySelector('.nxtb461');
      try {
        if (b) b.style.display = 'none';
        await nxL('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await nxL('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        const el = document.getElementById('pr');
        // @ts-ignore
        const cv = await window.html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const w = cv.width / 2;
        const h = cv.height / 2;
        const pdf = new jsPDF({ unit: 'px', format: [w, h], orientation: w > h ? 'l' : 'p' });
        pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
        pdf.save('${title}.pdf');
      } catch (e) {
        window.print();
      } finally {
        if (b) b.style.display = 'flex';
      }
    }
    setTimeout(function() {
      try { window.focus(); } catch (e) {}
    }, 150);
  </script>
</body>
</html>`;
}

export function openPackingSlipWindow(
  order: PackingSlipOrderData,
  format: "slip" | "sheet" = "slip",
  config?: InvoiceTemplateConfig
): boolean {
  try {
    const docHtml = generatePackingSlipHtml(order, format, config);
    const docTitle = `packing_${order.orderNo}`;

    // 1. Direct window.open with document.write
    try {
      const w = window.open("", "_blank");
      if (w && w.document) {
        w.document.open();
        w.document.write(docHtml);
        w.document.close();
        w.document.title = docTitle;
        try {
          w.focus();
        } catch {}
        return true;
      }
    } catch (popupErr) {
      console.warn("Direct window.open blocked for packing slip, using Blob anchor fallback:", popupErr);
    }

    // 2. Reliable Blob URL anchor fallback
    const blob = new Blob([docHtml], { type: "text/html;charset=utf-8" });
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
  } catch (e) {
    console.error("Popup window error for packing slip:", e);
    return false;
  }
}
