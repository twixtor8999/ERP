export interface ExpenseRecord {
  id: number;
  date: string;
  cat: string;
  sub?: string;
  amt: number;
  paymentType: "Cash" | "Credit" | "Bank";
  paidTo?: string;
  veh?: string;
  billNo?: string;
  remarks?: string;
  ap?: {
    by: string;
    date: string;
    at: string;
  };
}

export interface InwardExpenseRecord {
  id: number;
  purchaseId?: number;
  date: string;
  invoiceNo: string;
  invoiceTotal: number;
  vendorName: string;
  expenseType: string;
  ap?: {
    by: string;
    date: string;
    at: string;
  };
}

export const EXPENSE_CATEGORIES = [
  "Office Expenses",
  "Vehicle Rent",
  "Procurement",
  "Loading & Unloading",
  "Vehicle Fuel & Diesel",
  "Vehicle Maintenance & Repair",
  "Staff Salary & Advance",
  "Tea, Snacks & Refreshments",
  "Shop Rent & Warehouse Lease",
  "Electricity & Utility Bills",
  "Packaging Materials & Gunny Bags",
  "Printing, Stationery & Postage",
  "Miscellaneous Operating Expenses",
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    "id": 1795183646934136,
    "date": "2026-11-20",
    "cat": "Procurement",
    "sub": "Transport to warehouse",
    "amt": 180,
    "paymentType": "Cash",
    "paidTo": "WAGHAJI TRADERS",
    "veh": "",
    "billNo": "WT/26-27/4130",
    "remarks": "Transportation charges \u00b7 Purchase WT/26-27/4130 \u00b7 WAGHAJI TRADERS",
    "ap": {
      "by": "Admin",
      "date": "2026-11-20",
      "at": "2026-11-20T14:07:26.934Z"
    }
  },
  {
    "id": 1795024145077934,
    "date": "2026-11-18",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1400,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AA6256",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-18",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1795024014218934,
    "date": "2026-11-18",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1349,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-18",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794969551504934,
    "date": "2026-11-11",
    "cat": "Loading & Unloading",
    "sub": "Hamali / Coolie",
    "amt": 2200,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "",
    "billNo": "",
    "remarks": "Basu , Malu - Salt & Femiluv pads Loading & Unloading Charges - 2200/- paid  2000 Cash + 200UPI",
    "ap": {
      "by": "Admin",
      "date": "2026-11-11",
      "at": "2026-11-18T02:39:11.504Z"
    }
  },
  {
    "id": 1794969443203934,
    "date": "2026-11-07",
    "cat": "Loading & Unloading",
    "sub": "Hamali / Coolie",
    "amt": 2400,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "",
    "billNo": "",
    "remarks": "Salt 200Bag & Route Vehicle Loading Charges - 2400/-",
    "ap": {
      "by": "Admin",
      "date": "2026-11-07",
      "at": "2026-11-18T02:37:23.203Z"
    }
  },
  {
    "id": 1794968640798934,
    "date": "2026-11-12",
    "cat": "Office Expenses",
    "sub": "Repairs & Maintenance",
    "amt": 9000,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "",
    "billNo": "",
    "remarks": "CCTV Installation Charges",
    "ap": {
      "by": "Admin",
      "date": "2026-11-12",
      "at": "2026-11-18T02:24:00.798Z"
    }
  },
  {
    "id": 1794968537398934,
    "date": "2026-11-12",
    "cat": "Office Expenses",
    "sub": "Stationery & Printing",
    "amt": 700,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "",
    "billNo": "",
    "remarks": "Printing Rolls \n10x70=700",
    "ap": {
      "by": "Admin",
      "date": "2026-11-12",
      "at": "2026-11-18T02:22:17.398Z"
    }
  },
  {
    "id": 1794968188511934,
    "date": "2026-11-16",
    "cat": "Office Expenses",
    "sub": "Stationery & Printing",
    "amt": 600,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "",
    "billNo": "",
    "remarks": "2 Rubber Stamp",
    "ap": {
      "by": "Admin",
      "date": "2026-11-16",
      "at": "2026-11-18T02:16:28.511Z"
    }
  },
  {
    "id": 1794968026253934,
    "date": "2026-11-12",
    "cat": "Office Expenses",
    "sub": "Stationery & Printing",
    "amt": 650,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "",
    "billNo": "074",
    "remarks": "Name Board",
    "ap": {
      "by": "Admin",
      "date": "2026-11-12",
      "at": "2026-11-18T02:13:46.253Z"
    }
  },
  {
    "id": 1794935093861934,
    "date": "2026-11-17",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1587,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-17",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794505560709296,
    "date": "2026-11-12",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1700,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-12",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794072559801060,
    "date": "2026-11-07",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1000,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AA6256",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-07",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794025688223154,
    "date": "2026-11-06",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 2000,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-06",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1793936562573154,
    "date": "2026-11-05",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1700,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-05",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1793813573242009,
    "date": "2026-11-04",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1400,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-04",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794278885558490,
    "date": "2026-11-07",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1400,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-07",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794372445525490,
    "date": "2026-11-10",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 2000,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-10",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794418921827060,
    "date": "2026-11-11",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1400,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-11",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794594594975009,
    "date": "2026-11-13",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 2000,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-13",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794761041051934,
    "date": "2026-11-14",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 2000,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-14",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794888462025934,
    "date": "2026-11-16",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 2000,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-16",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1794968872622934,
    "date": "2026-11-17",
    "cat": "Office Expenses",
    "sub": "Documents Charges",
    "amt": 800,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "",
    "billNo": "",
    "remarks": "Mutual Agreement",
    "ap": {
      "by": "Admin",
      "date": "2026-11-17",
      "at": "2026-11-18T02:27:52.622Z"
    }
  },
  {
    "id": 1794969351417934,
    "date": "2026-10-28",
    "cat": "Office Expenses",
    "sub": "Documents Charges",
    "amt": 1700,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "",
    "billNo": "",
    "remarks": "Rent Agreement \n200+1000+500=1,700",
    "ap": {
      "by": "Admin",
      "date": "2026-10-28",
      "at": "2026-11-18T02:35:51.417Z"
    }
  },
  {
    "id": 1795108067843934,
    "date": "2026-11-19",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1254,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-19",
      "at": "2026-11-20T12:00:00Z"
    }
  },
  {
    "id": 1795236654224934,
    "date": "2026-11-20",
    "cat": "Vehicle Rent",
    "sub": "",
    "amt": 1590,
    "paymentType": "Cash",
    "paidTo": "",
    "veh": "KA28AC0349",
    "billNo": "",
    "remarks": "",
    "ap": {
      "by": "Admin",
      "date": "2026-11-20",
      "at": "2026-11-20T12:00:00Z"
    }
  }
];

export const INITIAL_INWARD_EXPENSES: InwardExpenseRecord[] = [
  {
    "id": 1,
    "purchaseId": 1795183646542136,
    "date": "2026-11-20",
    "invoiceNo": "WT/26-27/4130",
    "invoiceTotal": 39300,
    "vendorName": "WAGHAJI TRADERS",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-20",
      "at": "2026-11-20"
    }
  },
  {
    "id": 2,
    "purchaseId": 1795175792709071,
    "date": "2026-11-20",
    "invoiceNo": "SHD/2922/26-27",
    "invoiceTotal": 132750,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-20",
      "at": "2026-11-20"
    }
  },
  {
    "id": 3,
    "purchaseId": 1795011936409136,
    "date": "2026-11-18",
    "invoiceNo": "WT/26-27/4111",
    "invoiceTotal": 39600,
    "vendorName": "WAGHAJI TRADERS",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-18",
      "at": "2026-11-18"
    }
  },
  {
    "id": 4,
    "purchaseId": 1795011792729136,
    "date": "2026-11-18",
    "invoiceNo": "5526",
    "invoiceTotal": 19200,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-18",
      "at": "2026-11-18"
    }
  },
  {
    "id": 5,
    "purchaseId": 1795011543722136,
    "date": "2026-11-18",
    "invoiceNo": "5527",
    "invoiceTotal": 60950,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-18",
      "at": "2026-11-18"
    }
  },
  {
    "id": 6,
    "purchaseId": 1795011060554136,
    "date": "2026-11-18",
    "invoiceNo": "984",
    "invoiceTotal": 46800,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-18",
      "at": "2026-11-18"
    }
  },
  {
    "id": 7,
    "purchaseId": 1794974240180136,
    "date": "2026-11-14",
    "invoiceNo": "07676/26-27",
    "invoiceTotal": 2820.3,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-14",
      "at": "2026-11-18"
    }
  },
  {
    "id": 8,
    "purchaseId": 1794974446348136,
    "date": "2026-11-14",
    "invoiceNo": "07674/26-27",
    "invoiceTotal": 19742.1,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-14",
      "at": "2026-11-18"
    }
  },
  {
    "id": 9,
    "purchaseId": 1794974344660136,
    "date": "2026-11-14",
    "invoiceNo": "07675/26-27",
    "invoiceTotal": 19742.1,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-14",
      "at": "2026-11-18"
    }
  },
  {
    "id": 10,
    "purchaseId": 1794493159356490,
    "date": "2026-11-12",
    "invoiceNo": "5361",
    "invoiceTotal": 44700,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-12",
      "at": "2026-11-12"
    }
  },
  {
    "id": 11,
    "purchaseId": 1794492907938490,
    "date": "2026-11-12",
    "invoiceNo": "5360",
    "invoiceTotal": 118350,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-12",
      "at": "2026-11-12"
    }
  },
  {
    "id": 12,
    "purchaseId": 1793954836051154,
    "date": "2026-11-06",
    "invoiceNo": "INV-25262902689699",
    "invoiceTotal": 173220,
    "vendorName": "VilCart Solutions Private Limited",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-06",
      "at": "2026-11-06"
    }
  },
  {
    "id": 13,
    "purchaseId": 1793955237387154,
    "date": "2026-11-06",
    "invoiceNo": "INV-25262902689731",
    "invoiceTotal": 115300,
    "vendorName": "VilCart Solutions Private Limited",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-06",
      "at": "2026-11-06"
    }
  },
  {
    "id": 14,
    "purchaseId": 1793955532970154,
    "date": "2026-11-06",
    "invoiceNo": "INV-25262902689732",
    "invoiceTotal": 14000,
    "vendorName": "VilCart Solutions Private Limited",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-06",
      "at": "2026-11-06"
    }
  },
  {
    "id": 15,
    "purchaseId": 1793890179874154,
    "date": "2026-11-05",
    "invoiceNo": "1",
    "invoiceTotal": 10620,
    "vendorName": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-05",
      "at": "2026-11-05"
    }
  },
  {
    "id": 16,
    "purchaseId": 1793889881810154,
    "date": "2026-11-02",
    "invoiceNo": "2731",
    "invoiceTotal": 45030,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-02",
      "at": "2026-11-05"
    }
  },
  {
    "id": 17,
    "purchaseId": 1793889954474154,
    "date": "2026-11-02",
    "invoiceNo": "2732",
    "invoiceTotal": 45030,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-02",
      "at": "2026-11-05"
    }
  },
  {
    "id": 18,
    "purchaseId": 1793888183522154,
    "date": "2026-11-05",
    "invoiceNo": "1839",
    "invoiceTotal": 49460,
    "vendorName": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-05",
      "at": "2026-11-05"
    }
  },
  {
    "id": 19,
    "purchaseId": 1793796114145154,
    "date": "2026-11-04",
    "invoiceNo": "MAI/26-27/3671",
    "invoiceTotal": 161000,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-04",
      "at": "2026-11-04"
    }
  },
  {
    "id": 20,
    "purchaseId": 1793688675785557,
    "date": "2026-11-03",
    "invoiceNo": "2733",
    "invoiceTotal": 14220,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-03",
      "at": "2026-11-03"
    }
  },
  {
    "id": 21,
    "purchaseId": 1793173861014357,
    "date": "2026-10-28",
    "invoiceNo": "2884",
    "invoiceTotal": 23140,
    "vendorName": "Rishi Enterprises",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-10-28",
      "at": "2026-10-28"
    }
  },
  {
    "id": 22,
    "purchaseId": 1793707798763557,
    "date": "2026-11-03",
    "invoiceNo": "13503",
    "invoiceTotal": 244600,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-03",
      "at": "2026-11-03"
    }
  },
  {
    "id": 23,
    "purchaseId": 1793708384994557,
    "date": "2026-11-03",
    "invoiceNo": "MAI/26-27/3637",
    "invoiceTotal": 147400,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-03",
      "at": "2026-11-03"
    }
  },
  {
    "id": 24,
    "purchaseId": 1793708678166557,
    "date": "2026-11-03",
    "invoiceNo": "PT/483/25-26",
    "invoiceTotal": 49200,
    "vendorName": "PREM TRADERS",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-03",
      "at": "2026-11-03"
    }
  },
  {
    "id": 25,
    "purchaseId": 1793714308269357,
    "date": "2026-11-03",
    "invoiceNo": "INV-25262902689373",
    "invoiceTotal": 77500,
    "vendorName": "VilCart Solutions Private Limited",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-03",
      "at": "2026-11-03"
    }
  },
  {
    "id": 26,
    "purchaseId": 1794406603070490,
    "date": "2026-11-11",
    "invoiceNo": "MAI/26-27/3749",
    "invoiceTotal": 77550,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-11",
      "at": "2026-11-11"
    }
  },
  {
    "id": 27,
    "purchaseId": 1794405342272490,
    "date": "2026-11-06",
    "invoiceNo": "3612",
    "invoiceTotal": 4800,
    "vendorName": "M/S SHRI GANESH FOODS",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-06",
      "at": "2026-11-11"
    }
  },
  {
    "id": 28,
    "purchaseId": 1794404294169490,
    "date": "2026-11-11",
    "invoiceNo": "INV-25262902689842",
    "invoiceTotal": 90900,
    "vendorName": "VilCart Solutions Private Limited",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-11",
      "at": "2026-11-11"
    }
  },
  {
    "id": 29,
    "purchaseId": 1794392719087490,
    "date": "2026-11-06",
    "invoiceNo": "ATC/411/26-27",
    "invoiceTotal": 49200,
    "vendorName": "ARHAM TRADING COMPANY",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-06",
      "at": "2026-11-11"
    }
  },
  {
    "id": 30,
    "purchaseId": 1794392041200490,
    "date": "2026-11-11",
    "invoiceNo": "2",
    "invoiceTotal": 31920,
    "vendorName": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-11",
      "at": "2026-11-11"
    }
  },
  {
    "id": 31,
    "purchaseId": 1794407277373490,
    "date": "2026-11-11",
    "invoiceNo": "SHD/2813/26-27",
    "invoiceTotal": 81300,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-11",
      "at": "2026-11-11"
    }
  },
  {
    "id": 32,
    "purchaseId": 1794549389053490,
    "date": "2026-11-13",
    "invoiceNo": "MAI/26-27/3768",
    "invoiceTotal": 224000,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-13",
      "at": "2026-11-13"
    }
  },
  {
    "id": 33,
    "purchaseId": 1794768311404060,
    "date": "2026-11-06",
    "invoiceNo": "06-11",
    "invoiceTotal": 12600,
    "vendorName": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-06",
      "at": "2026-11-15"
    }
  },
  {
    "id": 34,
    "purchaseId": 1794838257166071,
    "date": "2026-11-16",
    "invoiceNo": "WT/26-27/4064",
    "invoiceTotal": 112560,
    "vendorName": "WAGHAJI TRADERS",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-16",
      "at": "2026-11-16"
    }
  },
  {
    "id": 35,
    "purchaseId": 1795098022635136,
    "date": "2026-11-18",
    "invoiceNo": "985",
    "invoiceTotal": 32000,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-18",
      "at": "2026-11-19"
    }
  },
  {
    "id": 36,
    "purchaseId": 1795089260749071,
    "date": "2026-11-19",
    "invoiceNo": "AG/SO003",
    "invoiceTotal": 196560,
    "vendorName": "SRINIDHI FOODS",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-19",
      "at": "2026-11-19"
    }
  },
  {
    "id": 37,
    "purchaseId": 1795086560039071,
    "date": "2026-11-19",
    "invoiceNo": "MAI/26-27/3881",
    "invoiceTotal": 145600,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-19",
      "at": "2026-11-19"
    }
  },
  {
    "id": 38,
    "purchaseId": 1795070944465071,
    "date": "2026-11-19",
    "invoiceNo": "385",
    "invoiceTotal": 24656,
    "vendorName": "Rishi Enterprises",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-19",
      "at": "2026-11-19"
    }
  },
  {
    "id": 39,
    "purchaseId": 1795249389699071,
    "date": "2026-11-21",
    "invoiceNo": "5641",
    "invoiceTotal": 158950,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-21",
      "at": "2026-11-21"
    }
  },
  {
    "id": 40,
    "purchaseId": 1795250359090071,
    "date": "2026-11-21",
    "invoiceNo": "5642",
    "invoiceTotal": 17800,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "expenseType": "Purchase (Stock Inward)",
    "ap": {
      "by": "Owner / Admin",
      "date": "2026-11-21",
      "at": "2026-11-21"
    }
  }
];

const STORAGE_KEY_EXPENSES = "erp_expenses_data_v2";
const STORAGE_KEY_INWARD = "erp_inward_expenses_data_v2";

export function getStoredExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load expenses", e);
  }
  return INITIAL_EXPENSES;
}

export function saveStoredExpenses(list: ExpenseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save expenses", e);
  }
}

import { getStoredPurchases } from "@/features/purchases/data/mockPurchases";

export function getStoredInwardExpenses(): InwardExpenseRecord[] {
  try {
    let inwardList: InwardExpenseRecord[] = [];
    const raw = localStorage.getItem(STORAGE_KEY_INWARD);
    if (raw) {
      inwardList = JSON.parse(raw);
    } else {
      inwardList = INITIAL_INWARD_EXPENSES;
    }

    // Dynamic sync: Ensure every purchase in mockPurchases is reflected as an Inward Expense
    const purchases = getStoredPurchases();
    const existingPurchaseIds = new Set(inwardList.filter((e) => e.purchaseId).map((e) => e.purchaseId));
    const existingInvoices = new Set(inwardList.map((e) => e.invoiceNo.trim().toUpperCase()));

    const newlyAddedFromPurchases: InwardExpenseRecord[] = [];
    for (const p of purchases) {
      const invClean = p.invoiceNo.trim().toUpperCase();
      if (!existingPurchaseIds.has(p.id) && !existingInvoices.has(invClean)) {
        newlyAddedFromPurchases.push({
          id: p.id,
          purchaseId: p.id,
          date: p.date,
          invoiceNo: p.invoiceNo,
          invoiceTotal: p.totalAmount,
          vendorName: p.vendorName,
          expenseType: "Purchase (Stock Inward)",
          ap: p.status === "approved" ? {
            by: "Owner / Admin",
            date: p.date,
            at: p.createdAt || p.date,
          } : undefined,
        });
      }
    }

    if (newlyAddedFromPurchases.length > 0) {
      const combined = [...newlyAddedFromPurchases, ...inwardList];
      saveStoredInwardExpenses(combined);
      return combined;
    }

    return inwardList;
  } catch (e) {
    console.error("Failed to load inward expenses", e);
  }
  return INITIAL_INWARD_EXPENSES;
}

export function saveStoredInwardExpenses(list: InwardExpenseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_INWARD, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save inward expenses", e);
  }
}

// ─── API-FIRST LOADERS ────────────────────────────────────────────────────────
import { fetchExpenses as _fetchExpenses, createExpense as _createExpense } from "@/lib/api/apiService";

export async function loadExpensesFromApi(dateFrom?: string, dateTo?: string): Promise<ExpenseRecord[]> {
  const apiData = await _fetchExpenses(dateFrom, dateTo);
  return apiData.map((e) => ({
    id: e.id as unknown as number,
    date: e.date,
    cat: e.category,
    sub: e.sub_category,
    amt: e.amount,
    paymentType: (e.payment_type as "Cash" | "Credit" | "Bank") || "Cash",
    paidTo: e.paid_to,
    veh: e.vehicle_no,
    billNo: e.bill_no,
    remarks: e.remarks,
    ap: e.approved_by ? { by: e.approved_by, date: e.approved_at || e.date, at: e.approved_at || e.date } : undefined,
  }));
}

export async function addExpenseToApi(expense: Omit<ExpenseRecord, "id">): Promise<ExpenseRecord> {
  const newLocal: ExpenseRecord = { ...expense, id: Date.now() };
  try {
    const result = await _createExpense({
      date: expense.date,
      category: expense.cat,
      sub_category: expense.sub,
      amount: expense.amt,
      payment_type: expense.paymentType,
      paid_to: expense.paidTo,
      vehicle_no: expense.veh,
      bill_no: expense.billNo,
      remarks: expense.remarks,
    });
    if (result?.expense_id) {
      newLocal.id = result.expense_id as unknown as number;
    }
  } catch { /* fall through — save locally */ }
  const list = getStoredExpenses();
  saveStoredExpenses([newLocal, ...list]);
  return newLocal;
}
