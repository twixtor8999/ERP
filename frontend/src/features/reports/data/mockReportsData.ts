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

// Default GST rates
export const DEFAULT_GST_SLABS: GstRateRow[] = [
  { rate: '0%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '5%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '12%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '18%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '28%', taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
];

export const SAMPLE_POPULATED_GST: GstRateRow[] = [
  { rate: '0%', taxable: 45200, cgst: 0, sgst: 0, totalTax: 0 },
  { rate: '5%', taxable: 480000, cgst: 12000, sgst: 12000, totalTax: 24000 },
  { rate: '12%', taxable: 165000, cgst: 9900, sgst: 9900, totalTax: 19800 },
  { rate: '18%', taxable: 240000, cgst: 21600, sgst: 21600, totalTax: 43200 },
  { rate: '28%', taxable: 35000, cgst: 4900, sgst: 4900, totalTax: 9800 },
];

// Top pill queries
export const AI_TOP_PILLS = [
  'ಈ ತಿಂಗಳ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?',
  'Which customers have the highest outstanding?',
  'Which items are low on stock?',
  'Vehicle wise sales in this range',
  'ಯಾವ ಐಟಂ ಹೆಚ್ಚು ಮಾರಾಟವಾಗಿದೆ?',
];

// Categorized question groups (NXAQ)
export const AI_CATEGORIZED_QUESTIONS: [string, string[]][] = [
  [
    '📋 Summaries',
    [
      'Today summary',
      'Yesterday summary',
      'This month summary',
      'Daily brief with insights',
    ],
  ],
  [
    '📈 Sales',
    [
      'Top 10 customers this month',
      'Top selling items this month',
      'Village wise sales this month',
      'Staff wise orders today',
      'Compare this month with last month',
    ],
  ],
  [
    '💰 Money',
    [
      'Pending payments (outstanding)',
      'Collection today',
      'Profit this month',
      'Expenses this month',
      'GST to pay this month',
    ],
  ],
  [
    '📦 Stock',
    ['Low stock items', 'Slow moving items', 'Stock value'],
  ],
  [
    '👥 Customers & orders',
    [
      'Customers not ordered in 30 days',
      'Orders not yet delivered',
      'New customers this month',
    ],
  ],
];

// Local AI Reasoning Engine matching Siddeshwar Enterprises
export function getLocalAiResponse(query: string): string {
  const q = query.trim().toLowerCase();

  // 1. Daily Brief
  if (/brief|insight|suggest|advice|salah|ಸಲಹೆ/i.test(q)) {
    return `**Daily brief · 22-11-2026**
• Today: 5 order(s) · ₹28,697 (▲ 8% vs yesterday ₹26,550)
• Best item this week: Sugar M-30 (50 Kg Bag) (₹84,500)

**Insights**
• Sales today are tracking 8% higher than yesterday.
• 1 item is out of stock (Aashirvaad Atta 10kg) — make a purchase order to supplier.
• ₹1,24,000 is pending for more than 30 days — follow up for payment with Mahaveer Kirana & Gurukrupa Stores.
• 2 customer(s) have not ordered in 30 days — give them a call.
• 2 order(s) are waiting to be packed / dispatched.`;
  }

  // 2. This month / yesterday / today summary
  if (/today.*summary|ivattu|ಇಂದು|ಇವತ್ತ|today/i.test(q) && !/collection/i.test(q)) {
    return `**Today (22-11-2026)**
• Orders: **5** worth **₹28,697** (▲ 8% vs yesterday ₹26,550)
• Customers ordered: **5** · Average order: ₹5,739
• Money received: **₹24,500**
• Profit (before expenses): **₹5,820** (20.3% margin)
• Top customers: Pushpa Patil Store ₹12,450, Mallikarjun Traders ₹8,920, Basaveshwar Kirana ₹4,550
• Top items: Sugar M-30 ₹9,600, Sun Royal Oil 1L ₹6,400, Daawat Rice 26kg ₹5,800`;
  }

  if (/yesterday|ninne|ನಿನ್ನೆ/i.test(q)) {
    return `**Yesterday (21-11-2026)**
• Orders: **4** worth **₹26,550**
• Customers ordered: **4** · Average order: ₹6,637
• Money received: **₹19,800**
• Profit (before expenses): **₹5,310** (20% margin)
• Top customers: Siddeshwar Provision Stores ₹14,200, Shri Renuka Store ₹7,850
• Top items: Sugar M-30 ₹11,400, Fortune Sunlite ₹8,200`;
  }

  if (/month.*summary|ಈ ತಿಂಗಳ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು|tingal|ತಿಂಗಳ|business/i.test(q)) {
    return `**November 2026 (Month to Date)**
• Orders: **184** worth **₹24,80,500** (▲ 14% vs previous period)
• Customers ordered: **78** · Average order: ₹13,481
• Money received: **₹21,45,000**
• Profit (before expenses): **₹5,33,310** (21.6% margin)
• Top customers: Siddeshwar Provision Stores ₹2,45,000, Mahaveer Kirana ₹1,85,000, Gurukrupa Stores ₹1,42,000
• Top items: Sugar M-30 (50kg) ₹4,80,000, Fortune Sunlite 1L ₹3,40,000, Aashirvaad Atta ₹2,90,000`;
  }

  // 3. Outstanding / Pending payments
  if (/pending pay|outstanding|due|balance|baki|ಬಾಕಿ|credit|receivable|highest outstanding/i.test(q)) {
    return `**Pending payments: ₹4,86,500** from 24 customer(s)
• Older than 30 days: **₹1,24,000**
1. Mahaveer Kirana (Nagathan) — ₹48,450 · 3 bill(s) · oldest 42 days
2. Gurukrupa Stores (Indi) — ₹36,200 · 2 bill(s) · oldest 35 days
3. Basaveshwar Traders (Tikota) — ₹28,900 · 2 bill(s) · oldest 31 days
4. Shri Renuka Store (Babaleshwar) — ₹22,100 · 1 bill(s) · oldest 24 days
5. Mallikarjun Kirana (Chadchan) — ₹18,400 · 1 bill(s) · oldest 18 days`;
  }

  // 4. Low stock
  if (/low stock|out of stock|stock low|ಸ್ಟಾಕ್ ಕಡಿಮೆ|kadime/i.test(q)) {
    return `**Low stock: 4 item(s)** (1 out of stock)
1. Aashirvaad Shudh Chakki Atta 10kg — OUT OF STOCK (min 15)
2. Gemini Groundnut Oil 15L Tin — 2 left (min 10)
3. Sooji 50Kg Bag — 3 left (min 12)
4. Chilli Powder Guntur 500g — 6 left (min 20)
All other items are above their minimum buffer stock 👍`;
  }

  // 5. Vehicle wise sales
  if (/vehicle.*sales|vehicle|ವಾಹನ/i.test(q)) {
    return `**Vehicle wise sales in this range**
1. KA28AB1234 (Tata Ace Gold) — ₹9,85,400 · 42 trip(s) · 124 order(s)
2. KA28CD5678 (Mahindra Bolero Maxi) — ₹7,45,200 · 31 trip(s) · 88 order(s)
3. KA28EF9012 (Ashok Leyland Dost) — ₹4,82,100 · 18 trip(s) · 56 order(s)
4. Direct Counter Pickup — ₹2,67,800 · 34 order(s)`;
  }

  // 6. Top selling items
  if (/top.*(item|sku|product|selling)|best sell|most sold|ಐಟಂ|ಹೆಚ್ಚು ಮಾರಾಟ/i.test(q)) {
    return `**Top selling items · November 2026**
1. Sugar M-30 (50 Kg Bag) — 128 qty · ₹4,86,400
2. Fortune Sunflower Oil 1L — 420 qty · ₹3,78,000
3. Aashirvaad Atta 10Kg — 310 qty · ₹2,94,500
4. Daawat Rice 26Kg Bag — 95 qty · ₹2,18,500
5. Toor Dal Premium Fatka 25Kg — 62 qty · ₹1,98,400`;
  }

  // 7. Top 10 customers
  if (/top.*customer|best customer|customer.*(top|most|highest)|ಗ್ರಾಹಕ/i.test(q)) {
    return `**Top customers · November 2026**
1. Siddeshwar Provision Stores (Indi) — ₹2,45,000 · 12 order(s)
2. Mahaveer Kirana (Nagathan) — ₹1,85,000 · 8 order(s)
3. Gurukrupa Stores (Indi) — ₹1,42,000 · 6 order(s)
4. Basaveshwar Traders (Tikota) — ₹1,18,000 · 5 order(s)
5. Shri Renuka Store (Babaleshwar) — ₹96,400 · 4 order(s)
6. Annapurna Retail Hub (Vijayapura) — ₹88,200 · 4 order(s)
7. Mallikarjun Kirana (Chadchan) — ₹76,500 · 3 order(s)
8. Shree Ganesh Super Market (Sindagi) — ₹69,800 · 3 order(s)
9. Ambika General Stores (Muddebihal) — ₹62,000 · 3 order(s)
10. Venkateshwara Kirana (Basavana Bagewadi) — ₹54,300 · 2 order(s)`;
  }

  // 8. Village wise sales
  if (/village|route|area|ಊರು|ಹಳ್ಳಿ/i.test(q)) {
    return `**Village wise sales · November 2026**
1. Indi — ₹5,42,000 · 28 order(s) · 14 customer(s)
2. Nagathan — ₹3,85,000 · 20 order(s) · 9 customer(s)
3. Tikota — ₹3,18,000 · 16 order(s) · 8 customer(s)
4. Babaleshwar — ₹2,64,000 · 14 order(s) · 7 customer(s)
5. Chadchan — ₹2,12,000 · 12 order(s) · 6 customer(s)
6. Sindagi — ₹1,98,000 · 11 order(s) · 5 customer(s)`;
  }

  // 9. Staff wise orders
  if (/staff|crm|telecaller|salesman|employee|who/i.test(q)) {
    return `**Staff wise orders · Today**
1. Pushpa Patil — 3 order(s) · ₹17,077 (59.5% of sales) · 28 calls made
2. Dhruthi A S — 2 order(s) · ₹11,620 (40.5% of sales) · 22 calls made`;
  }

  // 10. Compare this month with last month
  if (/compare|vs|last month.*this|this month.*last/i.test(q)) {
    return `**This month vs last month (same days: 1 to 22)**
• Sales: ₹24,80,500 vs ₹21,75,000 — **▲ 14%**
• Orders: 184 vs 165 — **▲ 11%**
• Customers: 78 vs 72 — **▲ 8%**
• Profit: ₹5,33,310 vs ₹4,65,000 — **▲ 14%**`;
  }

  // 11. Collection today
  if (/collect|received|ಹಣ ಬಂದ|payment/i.test(q)) {
    return `**Money received · Today: ₹24,500**
• Cash: ₹14,500
• QR / UPI: ₹7,500
• Bank / NEFT: ₹2,500`;
  }

  // 12. Profit this month
  if (/profit|labha|ಲಾಭ|margin/i.test(q)) {
    return `**Profit · November 2026**
• Sales (incl GST): ₹24,80,500 · without GST: ₹23,62,380
• Gross profit (sales − cost of goods): **₹5,33,310** (21.6% margin)
• Operating & Vehicle Expenses: ₹2,10,850
• **Net profit: ₹3,22,460** (13.1% net margin)`;
  }

  // 13. Expenses this month
  if (/expense|kharchu|ಖರ್ಚು/i.test(q)) {
    return `**Expenses · November 2026: ₹2,10,850**
• Staff Salaries: ₹1,15,000
• Warehouse Rent & Electricity: ₹45,000
• Vehicle Fuel, Toll & Maintenance: ₹38,400
• Chai, Snacks & Petty Cash: ₹12,450`;
  }

  // 14. GST to pay this month
  if (/gst|tax|ತೆರಿಗೆ/i.test(q)) {
    return `**GST · November 2026 (so far)**
• Output GST: ₹2,48,050 (CGST ₹1,24,025, SGST ₹1,24,025)
• Input credit (ITC) from purchases: ₹1,82,400
• **To pay in cash: ₹65,650**
• ITC left for next month: ₹0
Full details: CA Reports → GST Returns → GSTR-3B.`;
  }

  // 15. Slow moving items
  if (/slow|not sell|dead/i.test(q)) {
    return `**Slow moving: 3 item(s)** in stock but not sold in the last 30 days · stock value ₹14,800
1. Everest Garam Masala 100g — 45 in stock · ₹4,050
2. Lizol Disinfectant Floor Cleaner 500ml — 28 in stock · ₹3,920
3. Good Knight Gold Flash Refill — 35 in stock · ₹6,830`;
  }

  // 16. Stock value
  if (/stock value|inventory value|ಸ್ಟಾಕ್ ಮೌಲ್ಯ/i.test(q)) {
    return `**Stock value: ₹18,45,200** (at purchase cost) · 66 item(s) active in stock · 254 SKUs in total catalog.`;
  }

  // 17. Customers not ordered in 30 days
  if (/not ordered|inactive|lost|30 days|ಆರ್ಡರ್ ಮಾಡಿಲ್ಲ/i.test(q)) {
    return `**14 customer(s) have not ordered in 30 days**
1. Jagadamba Traders (Tikota) — last order 18-10-2026 (35 days) · 9845123001
2. Bhavani Stores (Indi) — last order 20-10-2026 (33 days) · 9845123002
3. Shree Balaji Provision (Nagathan) — last order 22-10-2026 (31 days) · 9845123003
4. Om Sai General Stores (Chadchan) — last order 22-10-2026 (31 days) · 9845123004
5. Lakshmi Kirana (Babaleshwar) — never ordered · 9845123005`;
  }

  // 18. Orders not yet delivered
  if (/not.*deliver|pending order|undelivered|open order|pack/i.test(q)) {
    return `**4 order(s) not yet delivered**
• Placed / Waiting to pack: 2 · ₹14,200 · oldest 22-11-2026
• Packed / Ready to dispatch: 1 · ₹8,450 · oldest 21-11-2026
• Dispatched / Out for delivery: 1 · ₹6,047 · oldest 22-11-2026`;
  }

  // 19. New customers this month
  if (/new customer|ಹೊಸ ಗ್ರಾಹಕ/i.test(q)) {
    return `**6 new customer(s) · November 2026**
1. Renuka Agro Center (Babaleshwar) · added by Pushpa Patil
2. Sri Guru Kirana (Tikota) · added by Dhruthi A S
3. Maruti Provision Store (Indi) · added by Pushpa Patil
4. Siddharoodha Traders (Nagathan) · added by Dhruthi A S
5. Mahalaxmi Stores (Chadchan) · added by Pushpa Patil
6. Kisan Seva Kendra (Sindagi) · added by Dhruthi A S`;
  }

  // Default fallback
  return `I could not match this question to your data. Try one of the options above, or ask about: sales, summary, top customers, top items, pending payments, collection, profit, expenses, GST, low stock, slow items, villages, staff, new customers, undelivered orders.
(Free questions in Kannada or English work instantly using the local store analytics engine.)`;
}

// 5 Errors and 83 Warnings for AI Cross Check (Exact match with reference app)
export const AUDIT_DISCREPANCIES: DiscrepancyRow[] = [
  // 5 Errors
  {
    id: 'err-1',
    sev: 'Error',
    area: 'Orders',
    ref: 'ORD-2311',
    msg: 'Completed but ₹8,450 is still unpaid',
  },
  {
    id: 'err-2',
    sev: 'Error',
    area: 'Orders',
    ref: 'ORD-2312',
    msg: 'Dispatched but not on any trip',
  },
  {
    id: 'err-3',
    sev: 'Error',
    area: 'Trips',
    ref: 'KA28AB1234 22-11-2026',
    msg: 'Trip not closed. New invoices for this vehicle are blocked',
  },
  {
    id: 'err-4',
    sev: 'Error',
    area: 'Purchase',
    ref: 'INV-9821',
    msg: 'Duplicate invoice for same vendor',
  },
  {
    id: 'err-5',
    sev: 'Error',
    area: 'Inventory',
    ref: 'Aashirvaad Atta 10kg',
    msg: 'Negative stock -3',
  },

  // Warnings
  {
    id: 'warn-1',
    sev: 'Warning',
    area: 'Orders',
    ref: 'ORD-2310',
    msg: 'Invoice has no vehicle selected',
  },
  {
    id: 'warn-2',
    sev: 'Warning',
    area: 'Orders',
    ref: 'ORD-2314',
    msg: 'Not enough stock to pack Sun Royal Oil 1L',
  },
  {
    id: 'warn-3',
    sev: 'Warning',
    area: 'Orders',
    ref: 'ORD-2315',
    msg: 'Order placed more than 2 days ago and still pending packing',
  },
  {
    id: 'warn-4',
    sev: 'Warning',
    area: 'Supplier',
    ref: 'PO-10023',
    msg: 'No invoice file attached',
  },
  {
    id: 'warn-5',
    sev: 'Warning',
    area: 'SKU',
    ref: 'Trulove Biscuits 50g',
    msg: 'Selling price is below GRN price',
  },
  {
    id: 'warn-6',
    sev: 'Warning',
    area: 'Customer',
    ref: 'CUST-9844',
    msg: 'Mahaveer Kirana credit period exceeded 30 days (₹8,450 outstanding)',
  },
  {
    id: 'warn-7',
    sev: 'Warning',
    area: 'Expenses',
    ref: 'Fuel Exp',
    msg: 'Amount ₹0 or negative entry detected',
  },
  {
    id: 'warn-8',
    sev: 'Warning',
    area: 'Sales Return',
    ref: 'ORD-2290',
    msg: 'Return logged without inspection signoff',
  },
  {
    id: 'warn-9',
    sev: 'Warning',
    area: 'Inventory',
    ref: 'SKU-SUGAR-50K',
    msg: 'Physical stock count is 2 bags below recorded ERP system book stock',
  },
  {
    id: 'warn-10',
    sev: 'Warning',
    area: 'Trips',
    ref: 'KA28CD5678',
    msg: 'Trip mileage reading not logged on return',
  },
  {
    id: 'warn-11',
    sev: 'Warning',
    area: 'Purchase',
    ref: 'GRN-4421',
    msg: 'Vendor GSTIN validation pending verification',
  },
  {
    id: 'warn-12',
    sev: 'Warning',
    area: 'Orders',
    ref: 'ORD-2305',
    msg: 'Cash receipt ₹12,000 pending handover from delivery driver',
  },
  {
    id: 'warn-13',
    sev: 'Warning',
    area: 'Customer',
    ref: 'CUST-9852',
    msg: 'Gurukrupa Stores credit limit ₹50,000 exceeded by ₹8,200',
  },
  {
    id: 'warn-14',
    sev: 'Warning',
    area: 'SKU',
    ref: 'Tata Salt 1kg',
    msg: 'HSN code missing or not standard 8 digits',
  },
  {
    id: 'warn-15',
    sev: 'Warning',
    area: 'Inventory',
    ref: 'Gemini Oil 15L',
    msg: 'Stock level at reorder threshold (2 remaining)',
  },
  {
    id: 'warn-16',
    sev: 'Warning',
    area: 'Expenses',
    ref: 'Stationery',
    msg: 'Voucher bill photo not uploaded',
  },
  {
    id: 'warn-17',
    sev: 'Warning',
    area: 'Orders',
    ref: 'ORD-2298',
    msg: 'Customer phone number only 9 digits',
  },
  {
    id: 'warn-18',
    sev: 'Warning',
    area: 'Supplier',
    ref: 'PO-10029',
    msg: 'Expected delivery date overdue by 3 days',
  },
  {
    id: 'warn-19',
    sev: 'Warning',
    area: 'Customer',
    ref: 'CUST-9860',
    msg: 'No GPS landmark coordinates pinned for delivery route',
  },
  {
    id: 'warn-20',
    sev: 'Warning',
    area: 'Trips',
    ref: 'KA28EF9012',
    msg: 'Trip diesel rate differs from configured daily pump rate',
  },
  ...Array.from({ length: 63 }, (_, i) => {
    const areas = ['Orders', 'Inventory', 'Purchase', 'Customer', 'Expenses', 'Trips', 'SKU'];
    const messages = [
      'Document copy awaiting owner digital signoff',
      'Batch expiry date within 45 days',
      'Payment mode split recorded as petty cash',
      'Delivery route delayed due to weather',
      'Inward expense not mapped to purchase GRN',
      'Customer GSTIN state code mismatch with delivery location',
      'Promotional scheme applied without active date approval',
    ];
    return {
      id: `warn-${i + 21}`,
      sev: 'Warning' as const,
      area: areas[i % areas.length] as string,
      ref: `REF-${2000 + i}`,
      msg: messages[i % messages.length] as string,
    };
  }),
];
