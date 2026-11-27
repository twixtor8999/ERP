import { getAllMergedPnlOrders } from '@/features/pnl/data/pnlEngine';
import { PNL_SKUS } from '@/features/pnl/data/mockPnlData';
import { getStoredSkuProducts } from '@/features/products/data/mockProducts';
import { getStoredCustomers } from '@/features/customers/data/mockCustomers';
import { getStoredPurchases } from '@/features/purchases/data/mockPurchases';
import { getStoredExpenses } from '@/features/expenses/data/mockExpenses';
import { isDateInRange } from '@/lib/utilities/istTime';

export interface GstRateRow {
  rate: string;
  taxable: number;
  cgst: number;
  sgst: number;
  totalTax: number;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  time?: string;
}

export interface DiscrepancyRow {
  id: string;
  sev: 'Error' | 'Warning';
  area: string;
  ref: string;
  msg: string;
}

export const DEFAULT_GST_SLABS: GstRateRow[] = [
  { rate: '0%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '5%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '12%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '18%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '28%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
];

export function computeRealGstSlabs(fromDate: string, toDate: string): GstRateRow[] {
  const orders = getAllMergedPnlOrders().filter((o) => o.st !== 'cancelled');
  const skus = getStoredSkuProducts();
  const skuById = new Map(skus.map((s) => [String(s.id), s]));
  const pnlSkuById = new Map(PNL_SKUS.map((s) => [String(s.id), s]));

  const slabs: Record<string, { taxable: number; cgst: number; sgst: number; totalTax: number }> = {
    '0%': { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    '5%': { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    '12%': { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    '18%': { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    '28%': { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  };

  for (const order of orders) {
    const oDate = order.dsp || order.date || '';
    if (fromDate && toDate && !isDateInRange(oDate, fromDate, toDate)) continue;
    for (const it of order.items || []) {
      const sku = skuById.get(String(it.s)) || pnlSkuById.get(String(it.s));
      const ratePct = Number(sku?.gst ?? 5);
      const rateKey = `${ratePct}%`;
      if (!slabs[rateKey]) slabs[rateKey] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
      const gross = Number(it.q || 1) * Number(it.p || 0);
      const base = gross / (1 + ratePct / 100);
      const tax = gross - base;
      slabs[rateKey].taxable += base;
      slabs[rateKey].cgst += tax / 2;
      slabs[rateKey].sgst += tax / 2;
      slabs[rateKey].totalTax += tax;
    }
  }

  return Object.entries(slabs).map(([rate, v]) => ({
    rate,
    taxable: Math.round(v.taxable * 100) / 100,
    cgst: Math.round(v.cgst * 100) / 100,
    sgst: Math.round(v.sgst * 100) / 100,
    totalTax: Math.round(v.totalTax * 100) / 100,
  }));
}

export const SAMPLE_POPULATED_GST: GstRateRow[] = computeRealGstSlabs('2026-10-01', '2026-11-30');

export const AI_TOP_PILLS = [
  'ಈ ತಿಂಗಳ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?',
  'Which customers have the highest outstanding?',
  'Which items are low on stock?',
  'Vehicle wise sales in this range',
  'ಯಾವ ಐಟಂ ಹೆಚ್ಚು ಮಾರಾಟವಾಗಿದೆ?',
];

export const AI_CATEGORIZED_QUESTIONS: [string, string[]][] = [
  [
    '📋 Summaries',
    ['Today summary', 'Yesterday summary', 'This month summary', 'Daily brief with insights'],
  ],
  [
    '📈 Sales',
    ['Top 10 customers this month', 'Top selling items this month', 'Village wise sales this month', 'Staff wise orders today'],
  ],
  [
    '💰 Money',
    ['Pending payments (outstanding)', 'Profit this month', 'Expenses this month', 'GST to pay this month'],
  ],
  ['📦 Stock', ['Low stock items', 'Slow moving items', 'Stock value']],
  ['👥 Customers & orders', ['Customers not ordered in 30 days', 'Orders not yet delivered']],
];

export function computeAuditDiscrepancies(): DiscrepancyRow[] {
  const rows: DiscrepancyRow[] = [];
  const skus = getStoredSkuProducts();
  const customers = getStoredCustomers();
  const purchases = getStoredPurchases();
  const orders = getAllMergedPnlOrders();

  // Check real SKUs with missing/short HSN, low stock, or margin inversion (price < cost)
  for (const s of skus) {
    if (!s.hsn || s.hsn.replace(/\D/g, '').length < 4) {
      rows.push({
        id: `sku-hsn-${s.id}`,
        sev: 'Warning',
        area: 'SKU HSN',
        ref: s.name,
        msg: `HSN code missing or fewer than 4 digits (${s.hsn || 'empty'})`,
      });
    }
    if (s.price > 0 && s.cost > 0 && s.price < s.cost) {
      rows.push({
        id: `sku-margin-${s.id}`,
        sev: 'Error',
        area: 'SKU Margin',
        ref: s.name,
        msg: `Selling price ₹${s.price} is lower than GRN cost ₹${s.cost}`,
      });
    }
    if (s.stock <= 0) {
      rows.push({
        id: `sku-stock0-${s.id}`,
        sev: 'Warning',
        area: 'Out of Stock',
        ref: s.name,
        msg: `Closing stock is 0 (min threshold ${s.min})`,
      });
    }
  }

  // Check purchases without attachment or pending
  for (const p of purchases) {
    if (p.status === 'pending') {
      rows.push({
        id: `pur-pend-${p.id}`,
        sev: 'Warning',
        area: 'Purchase',
        ref: p.invoiceNo,
        msg: `${p.vendorName} purchase ₹${p.totalAmount.toLocaleString('en-IN')} is awaiting approval`,
      });
    }
  }

  // Check customers without mobile or route
  const noPhoneCount = customers.filter((c) => !c.ph || c.ph.replace(/\D/g, '').length < 10).length;
  if (noPhoneCount > 0) {
    rows.push({
      id: 'cust-phone-gap',
      sev: 'Warning',
      area: 'Customers',
      ref: `${noPhoneCount} profiles`,
      msg: `${noPhoneCount} of ${customers.length.toLocaleString()} customers have missing or non-10-digit mobile numbers`,
    });
  }

  // Check undelivered / open orders
  const openOrders = orders.filter((o) => o.st === 'placed' || o.st === 'packed');
  openOrders.slice(0, 15).forEach((o) => {
    rows.push({
      id: `ord-open-${o.id}`,
      sev: 'Warning',
      area: 'Orders',
      ref: o.no,
      msg: `Order ${o.no} (${o.custName}) from ${o.date} is still in "${o.st}" stage`,
    });
  });

  return rows;
}

export const AUDIT_DISCREPANCIES: DiscrepancyRow[] = computeAuditDiscrepancies();

export function getLocalAiResponse(query: string): string {
  const q = query.trim().toLowerCase();
  const orders = getAllMergedPnlOrders().filter((o) => o.st !== 'cancelled');
  const skus = getStoredSkuProducts();
  const customers = getStoredCustomers();
  const expenses = getStoredExpenses();

  const totalSales = orders.reduce(
    (sum, o) => sum + (o.items || []).reduce((s, it) => s + Number(it.q || 0) * Number(it.p || 0), 0),
    0
  );
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amt || 0), 0);
  const stockValue = skus.reduce((sum, s) => sum + s.stock * s.cost, 0);

  if (/low stock|stock value|slow/i.test(q)) {
    const low = skus.filter((s) => s.stock <= s.min).slice(0, 10);
    return `**Live Inventory Summary (${skus.length} SKUs)**\n• Total Stock Value: **₹${Math.round(stockValue).toLocaleString('en-IN')}**\n• SKUs at/below min stock: **${skus.filter((s) => s.stock <= s.min).length}**\n\n` +
      low.map((s) => `• ${s.name}: Stock **${s.stock}** (Min ${s.min})`).join('\n');
  }

  if (/ಮಾರಾಟ|top selling|ಐಟಂ/i.test(q)) {
    const skuMap = new Map(skus.map((s) => [String(s.id), s.name]));
    const qtyMap = new Map<string, number>();
    orders.forEach((o) => (o.items || []).forEach((it) => {
      const name = skuMap.get(String(it.s)) || String(it.s);
      qtyMap.set(name, (qtyMap.get(name) || 0) + Number(it.q || 0));
    }));
    const top = Array.from(qtyMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return `**Total Processed Sales: ₹${Math.round(totalSales).toLocaleString('en-IN')} (${orders.length} orders)**\n\nTop Selling SKUs:\n` +
      top.map(([n, cnt], i) => `${i + 1}. ${n} — **${cnt} units**`).join('\n');
  }

  if (/expense/i.test(q)) {
    return `**Expenses Summary (${expenses.length} entries)**\n• Total recorded expenses: **₹${Math.round(totalExpenses).toLocaleString('en-IN')}**\n\nRecent:\n` +
      expenses.slice(0, 5).map((e) => `• ${e.date} · ${e.cat}: ₹${e.amt.toLocaleString('en-IN')}`).join('\n');
  }

  if (/gst/i.test(q)) {
    const slabs = computeRealGstSlabs('2026-10-01', '2026-11-30');
    const taxTotal = slabs.reduce((s, r) => s + r.totalTax, 0);
    return `**Live Output GST Breakdown**\n• Total Output Tax: **₹${Math.round(taxTotal).toLocaleString('en-IN')}**\n` +
      slabs.map((r) => `• Slab ${r.rate}: Taxable ₹${Math.round(r.taxable).toLocaleString('en-IN')} | Tax ₹${Math.round(r.totalTax).toLocaleString('en-IN')}`).join('\n');
  }

  return `**SIDDESHWAR ENTERPRISES · Live Business Snapshot**\n• Active Customers: **${customers.length.toLocaleString('en-IN')}**\n• Active SKUs: **${skus.length}** (Stock value ₹${Math.round(stockValue).toLocaleString('en-IN')})\n• Processed Orders: **${orders.length}** (Total Sales ₹${Math.round(totalSales).toLocaleString('en-IN')})\n• Expenses Recorded: **₹${Math.round(totalExpenses).toLocaleString('en-IN')}**`;
}
