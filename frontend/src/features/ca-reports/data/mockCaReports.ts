export interface GstReturnSummary {
  period: string;
  dueDate: string;
  kpis: { label: string; value: string | number }[];
  note?: string;
}

export interface RegisterRow {
  [key: string]: any;
}

export interface RegisterConfig {
  id: string;
  title: string;
  subtitle: string;
  columns: string[];
  moneyCols?: number[];
  kpis?: { label: string; value: string | number }[];
  defaultRowCountLabel?: string;
}

// Master list of CA Reports
export const CA_REPORT_CONFIGS: Record<string, RegisterConfig> = {
  carsal: {
    id: 'carsal',
    title: 'Sales Register',
    subtitle:
      'Every sales invoice with taxable value and GST. Returns are in Credit / Debit Notes. 01-11-2026 to 30-11-2026 · 468 row(s)',
    columns: [
      'Date',
      'Invoice No',
      'Customer',
      'GSTIN',
      'Place of Supply',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Invoice Total',
      'Received',
      'Balance',
    ],
    moneyCols: [5, 6, 7, 8, 9, 10, 11],
    defaultRowCountLabel: '468 row(s)',
  },
  carpur: {
    id: 'carpur',
    title: 'Purchase Register',
    subtitle:
      'Every purchase bill (approved) with taxable value and input GST. 01-11-2026 to 30-11-2026 · 39 row(s)',
    columns: [
      'Date',
      'Bill No',
      'Vendor',
      'GSTIN',
      'State',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Bill Total',
    ],
    moneyCols: [5, 6, 7, 8, 9],
    defaultRowCountLabel: '39 row(s)',
  },
  carcdn: {
    id: 'carcdn',
    title: 'Credit / Debit Notes',
    subtitle:
      'Credit notes = sales returns. Debit notes = purchase returns to vendors. 01-11-2026 to 30-11-2026 · 153 row(s)',
    columns: [
      'Date',
      'Type',
      'Note No',
      'Party',
      'GSTIN',
      'Against Invoice / Bill',
      'Item',
      'Qty',
      'Total',
    ],
    kpis: [
      { label: 'Credit notes', value: '2,02,181' },
      { label: 'Debit notes', value: '0' },
    ],
    defaultRowCountLabel: '153 row(s)',
  },
  carexp: {
    id: 'carexp',
    title: 'Expense Register',
    subtitle:
      'All expenses including salary, with payment mode and approval. 01-11-2026 to 30-11-2026 · 24 row(s)',
    columns: [
      'Date',
      'Category',
      'Details',
      'Amount',
      'Payment Mode',
      'Paid by',
      'Vehicle / Remarks',
    ],
    defaultRowCountLabel: '24 row(s)',
  },
  carhsn: {
    id: 'carhsn',
    title: 'HSN Summary',
    subtitle:
      'Outward supplies (sales minus sales returns) grouped by HSN and GST rate, for GSTR-1 / GSTR-9. 01-11-2026 to 30-11-2026 · 36 row(s)',
    columns: [
      'HSN',
      'Description',
      'UQC',
      'Total Qty',
      'Rate',
      'Total Value',
      'Taxable Value',
      'IGST',
      'CGST',
      'SGST',
    ],
    defaultRowCountLabel: '36 row(s)',
  },
  cargsm: {
    id: 'cargsm',
    title: 'GST Summary (month wise)',
    subtitle:
      'Output GST (sales minus returns) and input GST (purchases minus purchase returns) for each month. Net = Output − Input. 01-11-2026 to 30-11-2026 · 1 row(s)',
    columns: [
      'Month',
      'Sales Taxable',
      'Output GST',
      'Purchase Taxable',
      'Input GST (ITC)',
      'Net GST (Output − Input)',
    ],
    defaultRowCountLabel: '1 row(s)',
  },
  carven: {
    id: 'carven',
    title: 'Vendor wise Purchases',
    subtitle:
      'Purchases and purchase returns for each vendor. 01-11-2026 to 30-11-2026 · 12 row(s)',
    columns: [
      'Vendor',
      'GSTIN',
      'State',
      'Bills',
      'Taxable Value',
      'GST',
      'Purchase Total',
      'Purchase Returns',
      'Net Purchase',
    ],
    defaultRowCountLabel: '12 row(s)',
  },
  carstk: {
    id: 'carstk',
    title: 'Stock Summary',
    subtitle:
      'Opening, in, out and closing stock of each SKU with closing value at GRN price without GST. 01-11-2026 to 30-11-2026 · 254 row(s)',
    columns: [
      'SKU',
      'HSN',
      'Opening Qty',
      'Purchase',
      'Purchase Return',
      'Sales',
      'Sales Return',
      'Adjust / Split',
      'Closing Qty',
      'Rate (GRN without GST)',
      'Closing Value',
    ],
    defaultRowCountLabel: '254 row(s)',
  },
  carday: {
    id: 'carday',
    title: 'Day Book',
    subtitle:
      'Every transaction date wise: sales invoices, money received, purchases, returns and expenses. 01-11-2026 to 30-11-2026 · 1111 row(s)',
    columns: ['Date', 'Type', 'Ref No', 'Party', 'Mode', 'Amount'],
    kpis: [
      { label: 'Purchase', value: '29,50,929.55' },
      { label: 'Sales invoice', value: '22,70,717.96' },
      { label: 'Receipt', value: '20,64,558' },
      { label: 'Expense', value: '42,310' },
      { label: 'Sales return', value: '2,02,181' },
    ],
    defaultRowCountLabel: '1111 row(s)',
  },
};

// Seed sample data for each register
export function getSampleRowsForRegister(id: string): any[][] {
  switch (id) {
    case 'carsal':
      return [
        ['01-11-2026', 'INV-10492', 'Siddeshwar Provision Stores', '29ABCDE1234F1Z5', 'Karnataka', 24500, 1225, 1225, 0, 26950, 26950, 0],
        ['01-11-2026', 'INV-10493', 'Mahaveer Kirana', '29BCDEF2345G2Z6', 'Karnataka', 18450, 922.5, 922.5, 0, 20295, 11845, 8450],
        ['02-11-2026', 'INV-10494', 'Gurukrupa Stores', '29CDEFG3456H3Z7', 'Karnataka', 32000, 1600, 1600, 0, 35200, 30000, 5200],
        ['02-11-2026', 'INV-10495', 'Basaveshwar Traders', '29DEFGH4567I4Z8', 'Karnataka', 14200, 710, 710, 0, 15620, 15620, 0],
        ['03-11-2026', 'INV-10496', 'Shri Renuka Store', '29EFGHI5678J5Z9', 'Karnataka', 21500, 1075, 1075, 0, 23650, 23650, 0],
        ['03-11-2026', 'INV-10497', 'Annapurna Retail Hub', '29FGHIJ6789K6Z0', 'Karnataka', 28900, 1445, 1445, 0, 31790, 31790, 0],
        ['04-11-2026', 'INV-10498', 'Mallikarjun Kirana', '29GHIJK7890L7Z1', 'Karnataka', 16800, 840, 840, 0, 18480, 18480, 0],
        ['04-11-2026', 'INV-10499', 'Shree Ganesh Super Market', '29HIJKL8901M8Z2', 'Karnataka', 38500, 1925, 1925, 0, 42350, 42350, 0],
        ['05-11-2026', 'INV-10500', 'Ambika General Stores', '29IJKLM9012N9Z3', 'Karnataka', 12400, 620, 620, 0, 13640, 13640, 0],
        ['05-11-2026', 'INV-10501', 'Venkateshwara Kirana', '29JKLMN0123O0Z4', 'Karnataka', 29600, 1480, 1480, 0, 32560, 32560, 0],
        ['06-11-2026', 'INV-10502', 'Bhavani Provision', '29KLMNO1234P1Z5', 'Karnataka', 17500, 875, 875, 0, 19250, 19250, 0],
        ['06-11-2026', 'INV-10503', 'Laxmi Super Bazar', '29LMNOP2345Q2Z6', 'Karnataka', 34200, 1710, 1710, 0, 37620, 37620, 0],
      ];

    case 'carpur':
      return [
        ['01-11-2026', 'PUR-8821', 'Shree Renuka Sugars Ltd', '29AAACR3421A1Z0', 'Karnataka', 245000, 12250, 12250, 0, 269500],
        ['02-11-2026', 'PUR-8822', 'Adani Wilmar Edible Oils', '24AAACA1234B1Z1', 'Gujarat', 185000, 0, 0, 9250, 194250],
        ['03-11-2026', 'PUR-8823', 'ITC Limited (Aashirvaad)', '19AAACI4567C1Z2', 'West Bengal', 142000, 0, 0, 7100, 149100],
        ['04-11-2026', 'PUR-8824', 'Daawat Basmati Mills', '06AAACD7890D1Z3', 'Haryana', 215000, 0, 0, 10750, 225750],
        ['05-11-2026', 'PUR-8825', 'Tata Consumer Products', '27AAACT2345E1Z4', 'Maharashtra', 98000, 0, 0, 4900, 102900],
        ['06-11-2026', 'PUR-8826', 'Fortune Sunlite Refinery', '29AAACF9012F1Z5', 'Karnataka', 165000, 8250, 8250, 0, 181500],
      ];

    case 'carcdn':
      return [
        ['02-11-2026', 'Credit note (sales return)', 'CN-1021', 'Mahaveer Kirana', '29BCDEF2345G2Z6', 'INV-10493', 'Sugar M-30 50kg', 2, 7600],
        ['04-11-2026', 'Credit note (sales return)', 'CN-1022', 'Gurukrupa Stores', '29CDEFG3456H3Z7', 'INV-10494', 'Sun Royal Oil 1L', 10, 1450],
        ['06-11-2026', 'Credit note (sales return)', 'CN-1023', 'Shri Renuka Store', '29EFGHI5678J5Z9', 'INV-10496', 'Aashirvaad Atta 10kg', 5, 2350],
        ['08-11-2026', 'Credit note (sales return)', 'CN-1024', 'Mallikarjun Kirana', '29GHIJK7890L7Z1', 'INV-10498', 'Trulove Biscuits Box', 4, 1800],
      ];

    case 'carexp':
      return [
        ['01-11-2026', 'Salary', 'Pushpa Patil (CRM Staff)', 18000, 'Bank Transfer', 'Admin', 'November Advance'],
        ['01-11-2026', 'Salary', 'Dhruthi A S (CRM Staff)', 16000, 'Bank Transfer', 'Admin', 'November Advance'],
        ['02-11-2026', 'Vehicle Fuel', 'KA28AB1234 Diesel 45L', 4230, 'UPI / QR', 'Driver Ramesh', 'APMC Route Trip'],
        ['03-11-2026', 'Vehicle Maintenance', 'KA28CD5678 Brake Pad & Oil', 2850, 'Cash', 'Garage Garage', 'Regular Service'],
        ['04-11-2026', 'Warehouse Rent', 'Main Godown APMC Indi', 45000, 'Bank Transfer', 'Owner', 'Monthly Rent'],
        ['05-11-2026', 'Electricity', 'HESCOM Godown Bill', 6840, 'Online Bill', 'Accountant', 'October Usage'],
        ['06-11-2026', 'Tea & Snacks', 'Staff Daily Refreshment', 420, 'Cash', 'Store Boy', 'Chai Counter'],
      ];

    case 'carhsn':
      return [
        ['1006', 'Rice & Paddy (Packaged)', 'KGS', 14200, '5%', 745500, 710000, 0, 17750, 17750],
        ['1507', 'Soybean / Sunflower Edible Oil', 'LTR', 3850, '5%', 485100, 462000, 0, 11550, 11550],
        ['1701', 'Cane Sugar M-30', 'KGS', 8900, '5%', 373800, 356000, 0, 8900, 8900],
        ['0910', 'Spices, Turmeric, Ginger', 'KGS', 1450, '5%', 228375, 217500, 0, 5437.5, 5437.5],
        ['2106', 'Food preparations / snacks', 'NOS', 6200, '12%', 486080, 434000, 0, 26040, 26040],
        ['1101', 'Wheat Flour (Atta)', 'KGS', 6400, '5%', 304500, 290000, 0, 7250, 7250],
      ];

    case 'cargsm':
      return [
        ['November 2026', 2362380, 118119, 1045000, 52250, 65869],
      ];

    case 'carven':
      return [
        ['Shree Renuka Sugars Ltd', '29AAACR3421A1Z0', 'Karnataka', 8, 480000, 24000, 504000, 0, 504000],
        ['Adani Wilmar Edible Oils', '24AAACA1234B1Z1', 'Gujarat', 6, 360000, 18000, 378000, 0, 378000],
        ['ITC Limited (Aashirvaad)', '19AAACI4567C1Z2', 'West Bengal', 5, 290000, 14500, 304500, 0, 304500],
        ['Daawat Basmati Mills', '06AAACD7890D1Z3', 'Haryana', 4, 215000, 10750, 225750, 0, 225750],
        ['Tata Consumer Products', '27AAACT2345E1Z4', 'Maharashtra', 3, 165000, 8250, 173250, 0, 173250],
        ['Fortune Sunlite Refinery', '29AAACF9012F1Z5', 'Karnataka', 3, 145000, 7250, 152250, 0, 152250],
      ];

    case 'carstk':
      return [
        ['Sugar M-30 50kg Bag', '1701', 120, 200, 0, 185, 2, 0, 137, 3420, 468540],
        ['Fortune Sunflower Oil 1L Pouch', '1507', 350, 600, 0, 520, 10, 0, 440, 132, 58080],
        ['Aashirvaad Shudh Chakki Atta 10kg', '1101', 80, 250, 0, 310, 5, 0, 25, 420, 10500],
        ['Daawat Rozana Gold Basmati 26kg', '1006', 45, 80, 0, 72, 0, 0, 53, 2100, 111300],
        ['Tata Salt Iodized 1kg Packet', '2501', 400, 800, 0, 680, 0, 0, 520, 24, 12480],
        ['Sun Royal Refined Oil 15L Tin', '1507', 25, 60, 0, 52, 0, 0, 33, 1850, 61050],
      ];

    case 'carday':
      return [
        ['01-11-2026', 'Sales invoice', 'INV-10492', 'Siddeshwar Provision Stores', 'Credit sale', 26950],
        ['01-11-2026', 'Receipt', 'RCP-4201', 'Siddeshwar Provision Stores', 'Bank / NEFT', 26950],
        ['01-11-2026', 'Purchase', 'PUR-8821', 'Shree Renuka Sugars Ltd', 'Credit purchase', 269500],
        ['02-11-2026', 'Sales invoice', 'INV-10493', 'Mahaveer Kirana', 'Credit sale', 20295],
        ['02-11-2026', 'Receipt', 'RCP-4202', 'Mahaveer Kirana', 'Cash', 11845],
        ['02-11-2026', 'Sales return', 'CN-1021', 'Mahaveer Kirana', 'Credit Note', 7600],
        ['02-11-2026', 'Expense', 'EXP-901', 'Vehicle Fuel KA28AB1234', 'UPI / QR', 4230],
        ['03-11-2026', 'Sales invoice', 'INV-10494', 'Gurukrupa Stores', 'Credit sale', 35200],
        ['03-11-2026', 'Receipt', 'RCP-4203', 'Gurukrupa Stores', 'UPI / QR', 30000],
        ['03-11-2026', 'Purchase', 'PUR-8822', 'Adani Wilmar Edible Oils', 'Credit purchase', 194250],
        ['04-11-2026', 'Sales invoice', 'INV-10495', 'Basaveshwar Traders', 'Credit sale', 15620],
        ['04-11-2026', 'Expense', 'EXP-902', 'Warehouse Rent Godown', 'Bank Transfer', 45000],
      ];

    default:
      return [];
  }
}
