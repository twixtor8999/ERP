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

export function generatePackingSlipHtml(order: PackingSlipOrderData): string {
  const customerName = order.customerName || "";
  const village = order.village || "";
  const phone = order.phone || "8748930231";
  const route = order.route ? (order.route.toLowerCase().includes("route") ? order.route : `${order.route} Route`) : "—";
  const orderDate = order.orderDate || "23-11-2026";
  const packedDate = orderDate;
  const title = `packing_${order.orderNo}`;
  const totalQty = order.items.reduce((sum, it) => sum + (it.qty || 0), 0);

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
      gap: 10px;
      align-items: center;
      justify-content: center;
      background: #0d1b4c;
      color: #fff;
      padding: 0 16px;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }
    .nxtb461 b {
      flex: 1;
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .nxtb461 button {
      font-size: 14px;
      font-weight: 700;
      border: 0;
      border-radius: 999px;
      padding: 7px 16px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: opacity 0.15s;
    }
    .nxtb461 button:hover {
      opacity: 0.92;
    }
    .nxtb461 .p {
      background: #f5b400;
      color: #0d1b4c;
      font-size: 19px;
      padding: 5px 16px;
      line-height: 1;
    }
    .nxtb461 .k {
      background: #ffffff;
      color: #0d1b4c;
    }
    #pr {
      display: block !important;
      background: #ffffff;
      margin: 70px auto 30px;
      width: 320px;
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
      background: #cfe2f3;
      font-weight: 700;
      color: #000;
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
    <b>${title}</b>
    <button class="p" onclick="window.print()" title="Print" aria-label="Print">🖨</button>
    <button class="k" onclick="window.print()" title="Save as PDF">⬇ PDF</button>
  </div>
  <div id="pr">
    <div class="inv">
      <div class="co">SIDDESHWAR ENTERPRISES</div>
      <h4>PACKING LIST</h4>
      <div class="bx">
        <div>Order No:<br><b>${order.orderNo}</b></div>
        <div>Packed on:<br><b>${packedDate}</b></div>
      </div>
      <div class="kv">
        <div>
          M/s: ${customerName}
          ${village ? `<br>Village: ${village}` : ''}
          ${phone ? `<br>Mob: ${phone}` : ''}
        </div>
        <div>
          Route: ${route}<br>
          Order date: ${orderDate}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 28px; text-align: center;">Sl</th>
            <th style="text-align: left;">Product Name</th>
            <th class="n" style="width: 36px; text-align: right;">Qty</th>
            <th style="width: 44px; text-align: center;">Check</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 3px 4px;"><b>Total Items</b></td>
            <td class="n" style="border: 1px solid #000; padding: 3px 4px; text-align: right;"><b>${totalQty}</b></td>
            <td style="border: 1px solid #000; padding: 3px 4px;"></td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 18px; font-size: 11px;">Packed by: ____________ &nbsp; Checked by: ____________</p>
    </div>
  </div>
</body>
</html>`;
}

export function openPackingSlipWindow(order: PackingSlipOrderData): boolean {
  try {
    const w = window.open("", "_blank");
    if (!w) return false;
    const docHtml = generatePackingSlipHtml(order);
    w.document.open();
    w.document.write(docHtml);
    w.document.close();
    try {
      w.focus();
    } catch {
      // ignore
    }
    return true;
  } catch (e) {
    console.error("Popup window error:", e);
    return false;
  }
}
