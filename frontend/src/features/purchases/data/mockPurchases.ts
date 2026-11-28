export interface VendorRecord {
  id: number;
  name: string;
  gstin: string;
  ph: string;
  state: string;
  pan: string;
  addr: string;
  createdAt: string;
}

export interface PurchaseLine {
  skuId: number;
  skuName: string;
  qty: number;
  grnPrice: number;
  sellPrice: number;
  gstPercent: number;
  lineTotal: number;
}

export interface PurchaseRecord {
  id: number;
  date: string;
  vendorId: number;
  vendorName: string;
  invoiceNo: string;
  totalItems: number;
  totalAmount: number;
  status: "approved" | "pending";
  att?: string;
  lines: PurchaseLine[];
  createdAt: string;
}

export interface PurchaseReturnLine {
  skuId: number;
  skuName: string;
  purchasedQty: number;
  returnedEarlier: number;
  inStock: number;
  canReturn: number;
  grnPrice: number;
  returnQty: number;
  reason: string;
  amount: number;
}

export interface DebitNoteRecord {
  id: number;
  date: string;
  debitNoteNo: string;
  vendorId: number;
  vendorName: string;
  invoiceNo: string;
  totalItems: number;
  amount: number;
  status: "approved" | "pending";
  lines: PurchaseReturnLine[];
}

export const INITIAL_VENDORS: VendorRecord[] = [
  {
    "id": 1794417264296131,
    "name": "SHA HIRACHAND DONGARCHAND & CO",
    "gstin": "29AATFS4707R1Z2",
    "ph": "7899944558",
    "state": "Karnataka",
    "pan": "AATFS4707R",
    "addr": "KIRANA BAZAR VIJAYAPUR 586101 Karnataka - 586101, India,",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1794417658639131,
    "name": "M/S SHRI GANESH FOODS",
    "gstin": "29ABPFM8099P1ZT",
    "ph": "6363178767",
    "state": "Karnataka",
    "pan": "ABPFM8099P",
    "addr": "SY No 13L/6,7,8. Part of It, Highway Road, NH 13 Rambhapur Cross, Vijayapur, Rambhapur, Vijayapura, Karnataka, 586104",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1793886242914154,
    "name": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "gstin": "29CFRPC2523Q1ZV",
    "ph": "7483111744",
    "state": "Karnataka",
    "pan": "CFRPC2523Q",
    "addr": "SHOP NO. 137 ALIYABAD , KIADB,INDUSTRIAL AREA NEW KIRANA BAZAR , VIJAYAPUR ,KARNATAKA ,29",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1793173675973357,
    "name": "Rishi Enterprises",
    "gstin": "29AOCPB6692K1ZK",
    "ph": "9886931355",
    "state": "Karnataka",
    "pan": "",
    "addr": "Halasangi Complex , Sy No : 646*/2 Mallikarjun Nagar Athani Jamakandi Ring Road Vijayapura- 586101",
    "createdAt": "2026-10-20"
  },
  {
    "id": 101,
    "name": "Test Vendor",
    "gstin": "29AAAAA0000A1Z5",
    "ph": "9999999999",
    "state": "Karnataka",
    "pan": "",
    "addr": "Test Address, Vijayapura, Karnataka",
    "createdAt": "2026-10-20"
  },
  {
    "id": 128,
    "name": "Sample Wholesale Supplier",
    "gstin": "29AAAAA1111A1Z1",
    "ph": "9845011111",
    "state": "Karnataka",
    "pan": "",
    "addr": "APMC Yard, Vijayapura, Karnataka",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1793687754957557,
    "name": "SHA PRATAPMAL DEVICHAND",
    "gstin": "29ACLPJ6288Q1ZG",
    "ph": "9902384220",
    "state": "Karnataka",
    "pan": "ACLPJ6288Q",
    "addr": "General Merchants & Commission Agent,\nShop No. 41, KIADB Industrial Area, VIJAYAPUR-586 104",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1793705719341557,
    "name": "SHAH NARAYANMAL JERUPJI BAFNA",
    "gstin": "29AAAHB9055J1Z3",
    "ph": "9611711064",
    "state": "Karnataka",
    "pan": "AAAHB9055J",
    "addr": "Kirana Merchant, Kirana Bazar\nVIJAYAPURA - 586 101 (Kamataka)\nGSTIN/UIN: 29AAAHB9055J1Z3\nState Name: Karnataka, Code: 29",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1793707961988557,
    "name": "MADHUKAR AGRO INDUSTRIES",
    "gstin": "29AAKPO1958K1Z1",
    "ph": "8147928849",
    "state": "Karnataka",
    "pan": "AAKPO1958K",
    "addr": "PLOT NO.24,KIADB BLOCK 1\nINDUSTRIAL AREA INDI ROAD,, VIJAYAPUR-586104",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1793708576853557,
    "name": "PREM TRADERS",
    "gstin": "29ABDFP5750E1Z5",
    "ph": "9036251016",
    "state": "Karnataka",
    "pan": "ABDFP5750E",
    "addr": "# 120. KIADB NEW KIRANA MERCHANT LAYOUT\nALIYABAD, VIJAYAPUR GSTIN/UIN: 29ABDFP5750E1Z5\nState Name: Karataka, Code: 29",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1793713846385357,
    "name": "VilCart Solutions Private Limited",
    "gstin": "29AAGCV4428E1Z7",
    "ph": "9606933138",
    "state": "Karnataka",
    "pan": "AAGCV4428E",
    "addr": "Survey No 6874A, Athani road, Sherkhane colony, near bhimabai gidde primary school, Vijayapura-586101",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1793977635698154,
    "name": "ARHAM TRADING COMPANY",
    "gstin": "29AHUPM9439L1Z5",
    "ph": "9916257756",
    "state": "Karnataka",
    "pan": "AHUPM9439L",
    "addr": "PLOT NO .120 SY NO. 220/222 KIRANA MERCHANT LAYOUT,ALYABAD BLOOK , VIJAYAPUR ,KARNATAKA 29",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1794837977210071,
    "name": "WAGHAJI TRADERS",
    "gstin": "29ACDPD1244L1ZQ",
    "ph": "8105471771",
    "state": "Karnataka",
    "pan": "ACDPD1244L",
    "addr": "0, CTS NO 797, KIRANI BAZAR, KIRANI BAZAR, VIJAYAPUR, Vijayapura, Karnataka, 586101",
    "createdAt": "2026-10-20"
  },
  {
    "id": 1795087413987071,
    "name": "SRINIDHI FOODS",
    "gstin": "29ADLFS9324F1ZM",
    "ph": "9845343999",
    "state": "Karnataka",
    "pan": "ADLFS9324F",
    "addr": "#80/1-15 1ST CROSS SOMESHWAR NAGAR, YESHWANTAPURA BANGALORE - 560022",
    "createdAt": "2026-10-20"
  }
];

export const INITIAL_PURCHASES: PurchaseRecord[] = [
  {
    "id": 1795183646542136,
    "date": "2026-11-20",
    "vendorId": 1794837977210071,
    "vendorName": "WAGHAJI TRADERS",
    "invoiceNo": "WT/26-27/4130",
    "totalItems": 1,
    "totalAmount": 39300,
    "status": "approved",
    "att": "DocScanner 20 Nov 2026 07-32 pm.pdf",
    "lines": [
      {
        "skuId": 1792862514832293,
        "skuName": "Raag Gold Palm Oil 1Ltr 10Pcs Box",
        "qty": 30,
        "grnPrice": 1310.001,
        "sellPrice": 1380,
        "gstPercent": 5,
        "lineTotal": 39300.03
      }
    ],
    "createdAt": "2026-11-20"
  },
  {
    "id": 1795175792709071,
    "date": "2026-11-20",
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "invoiceNo": "SHD/2922/26-27",
    "totalItems": 1,
    "totalAmount": 132750,
    "status": "approved",
    "att": "Siddeshwar Enterprises,  VIJAYAPURA    2922.pdf",
    "lines": [
      {
        "skuId": 1792862514829293,
        "skuName": "Sugar S-30 50Kg Bag",
        "qty": 50,
        "grnPrice": 2654.9985,
        "sellPrice": 2760,
        "gstPercent": 5,
        "lineTotal": 132749.93
      }
    ],
    "createdAt": "2026-11-20"
  },
  {
    "id": 1795011936409136,
    "date": "2026-11-18",
    "vendorId": 1794837977210071,
    "vendorName": "WAGHAJI TRADERS",
    "invoiceNo": "WT/26-27/4111",
    "totalItems": 1,
    "totalAmount": 39600,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-18 at 7.19.24 PM (2).jpeg",
    "lines": [
      {
        "skuId": 1792862514832293,
        "skuName": "Raag Gold Palm Oil 1Ltr 10Pcs Box",
        "qty": 30,
        "grnPrice": 1319.997,
        "sellPrice": 1386,
        "gstPercent": 5,
        "lineTotal": 39599.91
      }
    ],
    "createdAt": "2026-11-18"
  },
  {
    "id": 1795011792729136,
    "date": "2026-11-18",
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "invoiceNo": "5526",
    "totalItems": 2,
    "totalAmount": 19200,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-18 at 7.19.25 PM (2).jpeg",
    "lines": [
      {
        "skuId": 1792862514738293,
        "skuName": "Atta 5Kg 5Pcs Bag",
        "qty": 10,
        "grnPrice": 980.007,
        "sellPrice": 1050,
        "gstPercent": 5,
        "lineTotal": 9800.07
      },
      {
        "skuId": 1793211755073131,
        "skuName": "Idly Sooji 1Kg 20Pcs Bag",
        "qty": 10,
        "grnPrice": 940.002,
        "sellPrice": 980,
        "gstPercent": 5,
        "lineTotal": 9400.02
      }
    ],
    "createdAt": "2026-11-18"
  },
  {
    "id": 1795011543722136,
    "date": "2026-11-18",
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "invoiceNo": "5527",
    "totalItems": 4,
    "totalAmount": 60950,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-18 at 7.17.52 PM (4).jpeg",
    "lines": [
      {
        "skuId": 1792862514858293,
        "skuName": "Poha 30kg Bag",
        "qty": 10,
        "grnPrice": 1410,
        "sellPrice": 1530,
        "gstPercent": 0,
        "lineTotal": 14100
      },
      {
        "skuId": 1792862514856293,
        "skuName": "Nice Poha 30Kg Bag",
        "qty": 10,
        "grnPrice": 1560,
        "sellPrice": 1630,
        "gstPercent": 0,
        "lineTotal": 15600
      },
      {
        "skuId": 1793211755070131,
        "skuName": "Gajaraj Kesar Sooji 30Kg Bag",
        "qty": 10,
        "grnPrice": 1240,
        "sellPrice": 1320,
        "gstPercent": 0,
        "lineTotal": 12400
      },
      {
        "skuId": 1792862514851293,
        "skuName": "Bullet Rice 26Kg Bag",
        "qty": 10,
        "grnPrice": 1885,
        "sellPrice": 2080,
        "gstPercent": 0,
        "lineTotal": 18850
      }
    ],
    "createdAt": "2026-11-18"
  },
  {
    "id": 1795011060554136,
    "date": "2026-11-18",
    "vendorId": 1793687754957557,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "invoiceNo": "984",
    "totalItems": 1,
    "totalAmount": 46800,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-18 at 4.48.39 PM.jpeg",
    "lines": [
      {
        "skuId": 1793688416313557,
        "skuName": "Jasmine Rice 30 kg Bag",
        "qty": 20,
        "grnPrice": 2340,
        "sellPrice": 2800,
        "gstPercent": 0,
        "lineTotal": 46800
      }
    ],
    "createdAt": "2026-11-18"
  },
  {
    "id": 1794974240180136,
    "date": "2026-11-14",
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "invoiceNo": "07676/26-27",
    "totalItems": 1,
    "totalAmount": 2820.3,
    "status": "approved",
    "att": "Siddeshwar Enterprises,  VIJAYAPURA   07676.pdf",
    "lines": [
      {
        "skuId": 1792862514832293,
        "skuName": "Raag Gold Palm Oil 1Ltr 10Pcs Box",
        "qty": 2,
        "grnPrice": 1410.15,
        "sellPrice": 1480.66,
        "gstPercent": 5,
        "lineTotal": 2820.3
      }
    ],
    "createdAt": "2026-11-18"
  },
  {
    "id": 1794974446348136,
    "date": "2026-11-14",
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "invoiceNo": "07674/26-27",
    "totalItems": 1,
    "totalAmount": 19742.1,
    "status": "approved",
    "att": "Siddeshwar Enterprises,  VIJAYAPURA    07674 (1).pdf",
    "lines": [
      {
        "skuId": 1792862514832293,
        "skuName": "Raag Gold Palm Oil 1Ltr 10Pcs Box",
        "qty": 14,
        "grnPrice": 1410.15,
        "sellPrice": 1480.66,
        "gstPercent": 5,
        "lineTotal": 19742.1
      }
    ],
    "createdAt": "2026-11-18"
  },
  {
    "id": 1794974344660136,
    "date": "2026-11-14",
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "invoiceNo": "07675/26-27",
    "totalItems": 1,
    "totalAmount": 19742.1,
    "status": "approved",
    "att": "Siddeshwar Enterprises,  VIJAYAPURA   07675.pdf",
    "lines": [
      {
        "skuId": 1792862514832293,
        "skuName": "Raag Gold Palm Oil 1Ltr 10Pcs Box",
        "qty": 14,
        "grnPrice": 1410.15,
        "sellPrice": 1480.66,
        "gstPercent": 5,
        "lineTotal": 19742.1
      }
    ],
    "createdAt": "2026-11-18"
  },
  {
    "id": 1794493159356490,
    "date": "2026-11-12",
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "invoiceNo": "5361",
    "totalItems": 2,
    "totalAmount": 44700,
    "status": "approved",
    "att": "Voucher Display_12112026_185803 (1).pdf",
    "lines": [
      {
        "skuId": 1792862514746293,
        "skuName": "Namasthe Gram Flour 10Kg Bag",
        "qty": 50,
        "grnPrice": 708,
        "sellPrice": 745,
        "gstPercent": 5,
        "lineTotal": 35400
      },
      {
        "skuId": 1793211755073131,
        "skuName": "Idly Sooji 1Kg 20Pcs Bag",
        "qty": 10,
        "grnPrice": 930,
        "sellPrice": 970,
        "gstPercent": 5,
        "lineTotal": 9300
      }
    ],
    "createdAt": "2026-11-12"
  },
  {
    "id": 1794492907938490,
    "date": "2026-11-12",
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "invoiceNo": "5360",
    "totalItems": 6,
    "totalAmount": 118350,
    "status": "approved",
    "att": "Voucher Display_12112026_185746.pdf",
    "lines": [
      {
        "skuId": 1792862514748293,
        "skuName": "Namasthe Gram Flour 50Kg Bag",
        "qty": 10,
        "grnPrice": 3320,
        "sellPrice": 3500,
        "gstPercent": 0,
        "lineTotal": 33200
      },
      {
        "skuId": 1793211755076131,
        "skuName": "Sooji 30Kg Bag",
        "qty": 20,
        "grnPrice": 1240,
        "sellPrice": 1320,
        "gstPercent": 0,
        "lineTotal": 24800
      },
      {
        "skuId": 1793211755070131,
        "skuName": "Gajaraj Kesar Sooji 30Kg Bag",
        "qty": 10,
        "grnPrice": 1240,
        "sellPrice": 1320,
        "gstPercent": 0,
        "lineTotal": 12400
      },
      {
        "skuId": 1792862514858293,
        "skuName": "Poha 30kg Bag",
        "qty": 10,
        "grnPrice": 1380,
        "sellPrice": 1500,
        "gstPercent": 0,
        "lineTotal": 13800
      },
      {
        "skuId": 1792862514856293,
        "skuName": "Nice Poha 30Kg Bag",
        "qty": 10,
        "grnPrice": 1530,
        "sellPrice": 1600,
        "gstPercent": 0,
        "lineTotal": 15300
      },
      {
        "skuId": 1792862514851293,
        "skuName": "Bullet Rice 26Kg Bag",
        "qty": 10,
        "grnPrice": 1885,
        "sellPrice": 2100,
        "gstPercent": 0,
        "lineTotal": 18850
      }
    ],
    "createdAt": "2026-11-12"
  },
  {
    "id": 1793954836051154,
    "date": "2026-11-06",
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited",
    "invoiceNo": "INV-25262902689699",
    "totalItems": 32,
    "totalAmount": 173220,
    "status": "approved",
    "att": "6df9639d-9477-4d58-af75-68c5c4e559cd.pdf",
    "lines": [
      {
        "skuId": 1792862514814293,
        "skuName": "Trulove Orange Kreme 5Rs 144Pcs Box",
        "qty": 77,
        "grnPrice": 320,
        "sellPrice": 520,
        "gstPercent": 5,
        "lineTotal": 24640
      },
      {
        "skuId": 1792862514801293,
        "skuName": "Trulove Chocolate Kreme 5Rs 144Pcs Box",
        "qty": 26,
        "grnPrice": 320,
        "sellPrice": 520,
        "gstPercent": 5,
        "lineTotal": 8320
      },
      {
        "skuId": 1792862514799293,
        "skuName": "Trulove Butter Waves 5Rs 168Pcs Box",
        "qty": 25,
        "grnPrice": 350,
        "sellPrice": 620,
        "gstPercent": 5,
        "lineTotal": 8750
      },
      {
        "skuId": 1792862514754293,
        "skuName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
        "qty": 33,
        "grnPrice": 350,
        "sellPrice": 620,
        "gstPercent": 5,
        "lineTotal": 11550
      },
      {
        "skuId": 1792862514810293,
        "skuName": "Trulove Marie Biscuits 10Rs 30Pcs Box",
        "qty": 4,
        "grnPrice": 180,
        "sellPrice": 220,
        "gstPercent": 5,
        "lineTotal": 720
      },
      {
        "skuId": 1792862514809293,
        "skuName": "Trulove Krazy Masti 5Rs 140Pcs Box",
        "qty": 25,
        "grnPrice": 320,
        "sellPrice": 520,
        "gstPercent": 5,
        "lineTotal": 8000
      },
      {
        "skuId": 1793211755110131,
        "skuName": "Toor Dal 30Kg Bag",
        "qty": 6,
        "grnPrice": 1000,
        "sellPrice": 4350,
        "gstPercent": 0,
        "lineTotal": 6000
      },
      {
        "skuId": 1792862514762293,
        "skuName": "Happy Happy Biscuits 5Rs 144Pcs Box",
        "qty": 4,
        "grnPrice": 320,
        "sellPrice": 620,
        "gstPercent": 5,
        "lineTotal": 1280
      },
      {
        "skuId": 1792862514911293,
        "skuName": "Surf Excel Detergent Soap 10Rs 140Pcs Box",
        "qty": 1,
        "grnPrice": 500,
        "sellPrice": 1200,
        "gstPercent": 18,
        "lineTotal": 500
      },
      {
        "skuId": 1792862514913293,
        "skuName": "Surf Excel Detergent Soap 250gm 60Pcs Box",
        "qty": 9,
        "grnPrice": 1000,
        "sellPrice": 2050,
        "gstPercent": 18,
        "lineTotal": 9000
      },
      {
        "skuId": 1792862514797293,
        "skuName": "Trulove Bourbon Biscuits 5Rs 144Pcs Box",
        "qty": 30,
        "grnPrice": 350,
        "sellPrice": 520,
        "gstPercent": 5,
        "lineTotal": 10500
      },
      {
        "skuId": 1792862514862293,
        "skuName": "Aramane Detergent Powder 10Rs 120Pcs Bag",
        "qty": 39,
        "grnPrice": 320,
        "sellPrice": 1000,
        "gstPercent": 18,
        "lineTotal": 12480
      },
      {
        "skuId": 1792862514864293,
        "skuName": "Aramane Detergent Powder 500gm 30Pcs Bag",
        "qty": 29,
        "grnPrice": 320,
        "sellPrice": 750,
        "gstPercent": 18,
        "lineTotal": 9280
      },
      {
        "skuId": 1792862514922293,
        "skuName": "Wheel Detergent Soap 10Rs 60Pcs Box",
        "qty": 1,
        "grnPrice": 800,
        "sellPrice": 800,
        "gstPercent": 18,
        "lineTotal": 800
      },
      {
        "skuId": 1792862514884293,
        "skuName": "Glim Dishwash Soap 250gm 72Pcs Box",
        "qty": 11,
        "grnPrice": 500,
        "sellPrice": 1500,
        "gstPercent": 18,
        "lineTotal": 5500
      },
      {
        "skuId": 1792862514886293,
        "skuName": "Glim Dishwash Soap 500gm 36Pcs Box",
        "qty": 8,
        "grnPrice": 500,
        "sellPrice": 1150,
        "gstPercent": 18,
        "lineTotal": 4000
      },
      {
        "skuId": 1792862514920293,
        "skuName": "Wheel Detergent Powder 10Rs 60Pcs Bag",
        "qty": 21,
        "grnPrice": 355.33,
        "sellPrice": 520,
        "gstPercent": 18,
        "lineTotal": 7461.93
      },
      {
        "skuId": 1792862514919293,
        "skuName": "Wheel Detergent Powder 1Kg 25Pcs Bag",
        "qty": 1,
        "grnPrice": 1575,
        "sellPrice": 1700,
        "gstPercent": 18,
        "lineTotal": 1575
      },
      {
        "skuId": 1792862514921293,
        "skuName": "Wheel Detergent Powder 500gm 30Pcs Bag",
        "qty": 21,
        "grnPrice": 600,
        "sellPrice": 1100,
        "gstPercent": 18,
        "lineTotal": 12600
      },
      {
        "skuId": 1792862514904293,
        "skuName": "Santoor Orange Soap 10Rs 4Pcs Pkt",
        "qty": 72,
        "grnPrice": 15,
        "sellPrice": 34,
        "gstPercent": 5,
        "lineTotal": 1080
      },
      {
        "skuId": 1792862514906293,
        "skuName": "Santoor Orange Soap 100gm 12Pcs Pkt",
        "qty": 1,
        "grnPrice": 250,
        "sellPrice": 400,
        "gstPercent": 5,
        "lineTotal": 250
      },
      {
        "skuId": 1792862514863293,
        "skuName": "Aramane Detergent Powder 500gm 6Pcs Pkt",
        "qty": 1,
        "grnPrice": 175,
        "sellPrice": 180,
        "gstPercent": 18,
        "lineTotal": 175
      },
      {
        "skuId": 1792862514861293,
        "skuName": "Aramane Detergent Powder 10Rs 12Pcs Pkt",
        "qty": 1,
        "grnPrice": 106,
        "sellPrice": 106,
        "gstPercent": 18,
        "lineTotal": 106
      },
      {
        "skuId": 1792862514883293,
        "skuName": "Glim Dishwash Soap 250gm 12Pcs Pkt",
        "qty": 4,
        "grnPrice": 276,
        "sellPrice": 276,
        "gstPercent": 18,
        "lineTotal": 1104
      },
      {
        "skuId": 1792862514875293,
        "skuName": "Dabur Vatika Health Shampoo 1Rs 960Pcs Box",
        "qty": 2,
        "grnPrice": 450,
        "sellPrice": 700,
        "gstPercent": 5,
        "lineTotal": 900
      },
      {
        "skuId": 1792862514877293,
        "skuName": "Dove Daily Shine Shampoo 2Rs 960Pcs Box",
        "qty": 3,
        "grnPrice": 650,
        "sellPrice": 1300,
        "gstPercent": 5,
        "lineTotal": 1950
      },
      {
        "skuId": 1792862514909293,
        "skuName": "Sunsilk Shampoo 1Rs 960Pcs Box",
        "qty": 3,
        "grnPrice": 450,
        "sellPrice": 700,
        "gstPercent": 5,
        "lineTotal": 1350
      },
      {
        "skuId": 1792862514866293,
        "skuName": "Aramane Detergent Soap 10Rs 60Pcs Box",
        "qty": 60,
        "grnPrice": 250,
        "sellPrice": 510,
        "gstPercent": 18,
        "lineTotal": 15000
      },
      {
        "skuId": 1792862514882293,
        "skuName": "Glim Dishwash Soap 10Rs 60Pcs Box",
        "qty": 29,
        "grnPrice": 250,
        "sellPrice": 510,
        "gstPercent": 18,
        "lineTotal": 7250
      },
      {
        "skuId": 1792862514782293,
        "skuName": "Marie Gold Biscuits 5Rs 168Pcs Box",
        "qty": 1,
        "grnPrice": 320,
        "sellPrice": 520,
        "gstPercent": 5,
        "lineTotal": 320
      },
      {
        "skuId": 1792862514885293,
        "skuName": "Glim Dishwash Soap 500gm 6Pcs Pkt",
        "qty": 4,
        "grnPrice": 187,
        "sellPrice": 195,
        "gstPercent": 18,
        "lineTotal": 748
      },
      {
        "skuId": 1792862514767293,
        "skuName": "KB-Skitos Fryums Wheels Chips 5Rs 14Pcs Sheet",
        "qty": 2,
        "grnPrice": 15,
        "sellPrice": 15.75,
        "gstPercent": 5,
        "lineTotal": 30
      }
    ],
    "createdAt": "2026-11-06"
  },
  {
    "id": 1793955237387154,
    "date": "2026-11-06",
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited",
    "invoiceNo": "INV-25262902689731",
    "totalItems": 4,
    "totalAmount": 115300,
    "status": "approved",
    "att": "Vilcart Invoice.pdf",
    "lines": [
      {
        "skuId": 1792862514821293,
        "skuName": "Crystal Salt 1Kg 25Pcs Bag",
        "qty": 140,
        "grnPrice": 120,
        "sellPrice": 126,
        "gstPercent": 0,
        "lineTotal": 16800
      },
      {
        "skuId": 1792862514825293,
        "skuName": "Powder Salt 1Kg 25Pcs Bag",
        "qty": 250,
        "grnPrice": 120,
        "sellPrice": 126,
        "gstPercent": 0,
        "lineTotal": 30000
      },
      {
        "skuId": 1792862514801293,
        "skuName": "Trulove Chocolate Kreme 5Rs 144Pcs Box",
        "qty": 50,
        "grnPrice": 320,
        "sellPrice": 520,
        "gstPercent": 5,
        "lineTotal": 16000
      },
      {
        "skuId": 1792862514797293,
        "skuName": "Trulove Bourbon Biscuits 5Rs 144Pcs Box",
        "qty": 150,
        "grnPrice": 350,
        "sellPrice": 520,
        "gstPercent": 5,
        "lineTotal": 52500
      }
    ],
    "createdAt": "2026-11-06"
  },
  {
    "id": 1793955532970154,
    "date": "2026-11-06",
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited",
    "invoiceNo": "INV-25262902689732",
    "totalItems": 1,
    "totalAmount": 14000,
    "status": "approved",
    "att": "Vilcart Invoice-cfa.pdf",
    "lines": [
      {
        "skuId": 1792862514835293,
        "skuName": "Ruchi Gold Palm Oil 15Ltr 1Tin Tin",
        "qty": 7,
        "grnPrice": 2000,
        "sellPrice": 2350,
        "gstPercent": 5,
        "lineTotal": 14000
      }
    ],
    "createdAt": "2026-11-06"
  },
  {
    "id": 1793890179874154,
    "date": "2026-11-05",
    "vendorId": 1793886242914154,
    "vendorName": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "invoiceNo": "1",
    "totalItems": 1,
    "totalAmount": 10620,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-05 at 7.41.48 PM (2).jpeg",
    "lines": [
      {
        "skuId": 1793211755076131,
        "skuName": "Sooji 30Kg Bag",
        "qty": 9,
        "grnPrice": 1180,
        "sellPrice": 1280,
        "gstPercent": 0,
        "lineTotal": 10620
      }
    ],
    "createdAt": "2026-11-05"
  },
  {
    "id": 1793889881810154,
    "date": "2026-11-02",
    "vendorId": 1793687754957557,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "invoiceNo": "2731",
    "totalItems": 1,
    "totalAmount": 45030,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-05 at 8.12.08 PM.jpeg",
    "lines": [
      {
        "skuId": 1793688416313557,
        "skuName": "Jasmine Rice 30 kg Bag",
        "qty": 19,
        "grnPrice": 2370,
        "sellPrice": 2800,
        "gstPercent": 0,
        "lineTotal": 45030
      }
    ],
    "createdAt": "2026-11-05"
  },
  {
    "id": 1793889954474154,
    "date": "2026-11-02",
    "vendorId": 1793687754957557,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "invoiceNo": "2732",
    "totalItems": 1,
    "totalAmount": 45030,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-05 at 8.12.08 PM (1).jpeg",
    "lines": [
      {
        "skuId": 1793688416313557,
        "skuName": "Jasmine Rice 30 kg Bag",
        "qty": 19,
        "grnPrice": 2370,
        "sellPrice": 2800,
        "gstPercent": 0,
        "lineTotal": 45030
      }
    ],
    "createdAt": "2026-11-05"
  },
  {
    "id": 1793888183522154,
    "date": "2026-11-05",
    "vendorId": 1793886242914154,
    "vendorName": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "invoiceNo": "1839",
    "totalItems": 3,
    "totalAmount": 49460,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-05 at 7.41.48 PM (1).jpeg",
    "lines": [
      {
        "skuId": 1793211755076131,
        "skuName": "Sooji 30Kg Bag",
        "qty": 11,
        "grnPrice": 1180,
        "sellPrice": 1280,
        "gstPercent": 0,
        "lineTotal": 12980
      },
      {
        "skuId": 1792862514742293,
        "skuName": "Maida 30Kg Bag",
        "qty": 16,
        "grnPrice": 1070,
        "sellPrice": 1180,
        "gstPercent": 0,
        "lineTotal": 17120
      },
      {
        "skuId": 1793211755070131,
        "skuName": "Gajaraj Kesar Sooji 30Kg Bag",
        "qty": 16,
        "grnPrice": 1210,
        "sellPrice": 1320,
        "gstPercent": 0,
        "lineTotal": 19360
      }
    ],
    "createdAt": "2026-11-05"
  },
  {
    "id": 1793796114145154,
    "date": "2026-11-04",
    "vendorId": 1793707961988557,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "invoiceNo": "MAI/26-27/3671",
    "totalItems": 1,
    "totalAmount": 161000,
    "status": "approved",
    "att": "Voucher Display_04112026_174326 (1).pdf",
    "lines": [
      {
        "skuId": 1792862514844293,
        "skuName": "VST Vegetable Oil 1Kg 10Pcs Box",
        "qty": 100,
        "grnPrice": 1610,
        "sellPrice": 1650,
        "gstPercent": 5,
        "lineTotal": 161000
      }
    ],
    "createdAt": "2026-11-04"
  },
  {
    "id": 1793688675785557,
    "date": "2026-11-03",
    "vendorId": 1793687754957557,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "invoiceNo": "2733",
    "totalItems": 1,
    "totalAmount": 14220,
    "status": "approved",
    "att": "IMG_1872.jpeg",
    "lines": [
      {
        "skuId": 1793688416313557,
        "skuName": "Jasmine Rice 30 kg Bag",
        "qty": 6,
        "grnPrice": 2370,
        "sellPrice": 2800,
        "gstPercent": 0,
        "lineTotal": 14220
      }
    ],
    "createdAt": "2026-11-03"
  },
  {
    "id": 1793173861014357,
    "date": "2026-10-28",
    "vendorId": 1793173675973357,
    "vendorName": "Rishi Enterprises",
    "invoiceNo": "2884",
    "totalItems": 1,
    "totalAmount": 23140,
    "status": "approved",
    "att": "IMG_1685.jpeg",
    "lines": [
      {
        "skuId": 1792862514855293,
        "skuName": "Daawat Rice 26Kg Bag",
        "qty": 10,
        "grnPrice": 2314,
        "sellPrice": 2470,
        "gstPercent": 0,
        "lineTotal": 23140
      }
    ],
    "createdAt": "2026-10-28"
  },
  {
    "id": 1793707798763557,
    "date": "2026-11-03",
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "invoiceNo": "13503",
    "totalItems": 12,
    "totalAmount": 244600,
    "status": "approved",
    "att": "image.jpg",
    "lines": [
      {
        "skuId": 1792862514746293,
        "skuName": "Namasthe Gram Flour 10Kg Bag",
        "qty": 50,
        "grnPrice": 702,
        "sellPrice": 740,
        "gstPercent": 5,
        "lineTotal": 35100
      },
      {
        "skuId": 1792862514748293,
        "skuName": "Namasthe Gram Flour 50Kg Bag",
        "qty": 10,
        "grnPrice": 3300,
        "sellPrice": 3500,
        "gstPercent": 0,
        "lineTotal": 33000
      },
      {
        "skuId": 1792862514743293,
        "skuName": "Maida 50Kg Bag",
        "qty": 10,
        "grnPrice": 1840,
        "sellPrice": 1950,
        "gstPercent": 0,
        "lineTotal": 18400
      },
      {
        "skuId": 1793211755071131,
        "skuName": "Gajaraj Kesar Sooji 50Kg Bag",
        "qty": 10,
        "grnPrice": 2070,
        "sellPrice": 2150,
        "gstPercent": 0,
        "lineTotal": 20700
      },
      {
        "skuId": 1793211755073131,
        "skuName": "Idly Sooji 1Kg 20Pcs Bag",
        "qty": 10,
        "grnPrice": 920,
        "sellPrice": 960,
        "gstPercent": 5,
        "lineTotal": 9200
      },
      {
        "skuId": 1793211755114131,
        "skuName": "Urad Dal 30Kg Bag",
        "qty": 5,
        "grnPrice": 3750,
        "sellPrice": 3950,
        "gstPercent": 0,
        "lineTotal": 18750
      },
      {
        "skuId": 1793211755091131,
        "skuName": "Gram Dal Fine 30Kg Bag",
        "qty": 10,
        "grnPrice": 2760,
        "sellPrice": 2860,
        "gstPercent": 0,
        "lineTotal": 27600
      },
      {
        "skuId": 1793211755087131,
        "skuName": "Fried Gram Fine 30Kg Bag",
        "qty": 10,
        "grnPrice": 3120,
        "sellPrice": 3220,
        "gstPercent": 0,
        "lineTotal": 31200
      },
      {
        "skuId": 1793211755095131,
        "skuName": "Masoor Dal 30Kg Bag",
        "qty": 5,
        "grnPrice": 2340,
        "sellPrice": 2460,
        "gstPercent": 0,
        "lineTotal": 11700
      },
      {
        "skuId": 1792862514738293,
        "skuName": "Atta 5Kg 5Pcs Bag",
        "qty": 10,
        "grnPrice": 985,
        "sellPrice": 1050,
        "gstPercent": 5,
        "lineTotal": 9850
      },
      {
        "skuId": 1792862514858293,
        "skuName": "Poha 30kg Bag",
        "qty": 10,
        "grnPrice": 1380,
        "sellPrice": 1520,
        "gstPercent": 0,
        "lineTotal": 13800
      },
      {
        "skuId": 1792862514856293,
        "skuName": "Nice Poha 30Kg Bag",
        "qty": 10,
        "grnPrice": 1530,
        "sellPrice": 1600,
        "gstPercent": 0,
        "lineTotal": 15300
      }
    ],
    "createdAt": "2026-11-03"
  },
  {
    "id": 1793708384994557,
    "date": "2026-11-03",
    "vendorId": 1793707961988557,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "invoiceNo": "MAI/26-27/3637",
    "totalItems": 2,
    "totalAmount": 147400,
    "status": "approved",
    "att": "IMG_1887.jpeg",
    "lines": [
      {
        "skuId": 1792862514844293,
        "skuName": "VST Vegetable Oil 1Kg 10Pcs Box",
        "qty": 60,
        "grnPrice": 1610,
        "sellPrice": 1650,
        "gstPercent": 5,
        "lineTotal": 96600
      },
      {
        "skuId": 1793708242898557,
        "skuName": "SUN ROYAL 750 GM SUNFLOWER OIL BOX",
        "qty": 40,
        "grnPrice": 1270,
        "sellPrice": 1470,
        "gstPercent": 5,
        "lineTotal": 50800
      }
    ],
    "createdAt": "2026-11-03"
  },
  {
    "id": 1793708678166557,
    "date": "2026-11-03",
    "vendorId": 1793708576853557,
    "vendorName": "PREM TRADERS",
    "invoiceNo": "PT/483/25-26",
    "totalItems": 1,
    "totalAmount": 49200,
    "status": "approved",
    "att": "IMG_1880.jpeg",
    "lines": [
      {
        "skuId": 1792862514841293,
        "skuName": "SVT Vegetable Oil 1Kg 10Pcs Box",
        "qty": 30,
        "grnPrice": 1640,
        "sellPrice": 1680,
        "gstPercent": 5,
        "lineTotal": 49200
      }
    ],
    "createdAt": "2026-11-03"
  },
  {
    "id": 1793714308269357,
    "date": "2026-11-03",
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited",
    "invoiceNo": "INV-25262902689373",
    "totalItems": 4,
    "totalAmount": 77500,
    "status": "approved",
    "att": "9f5bad18-8d30-4a76-aaeb-5e42bccea7c1.pdf",
    "lines": [
      {
        "skuId": 1792862514831293,
        "skuName": "Geo Vegetable Oil 500ml 20Pcs Box",
        "qty": 12,
        "grnPrice": 1200,
        "sellPrice": 1550,
        "gstPercent": 5,
        "lineTotal": 14400
      },
      {
        "skuId": 1792862514835293,
        "skuName": "Ruchi Gold Palm Oil 15Ltr 1Tin Tin",
        "qty": 1,
        "grnPrice": 2000,
        "sellPrice": 2350,
        "gstPercent": 5,
        "lineTotal": 2000
      },
      {
        "skuId": 1792862514842293,
        "skuName": "SVT Vegetable Oil 250gm 40Pcs Box",
        "qty": 17,
        "grnPrice": 1300,
        "sellPrice": 1670,
        "gstPercent": 5,
        "lineTotal": 22100
      },
      {
        "skuId": 1792862514843293,
        "skuName": "SVT Vegetable Oil 500gm 20Pcs Box",
        "qty": 30,
        "grnPrice": 1300,
        "sellPrice": 1660,
        "gstPercent": 5,
        "lineTotal": 39000
      }
    ],
    "createdAt": "2026-11-03"
  },
  {
    "id": 1794406603070490,
    "date": "2026-11-11",
    "vendorId": 1793707961988557,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "invoiceNo": "MAI/26-27/3749",
    "totalItems": 2,
    "totalAmount": 77550,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-11 at 7.44.58 PM (1).jpeg",
    "lines": [
      {
        "skuId": 1792862514844293,
        "skuName": "VST Vegetable Oil 1Kg 10Pcs Box",
        "qty": 30,
        "grnPrice": 1547,
        "sellPrice": 1610,
        "gstPercent": 5,
        "lineTotal": 46410
      },
      {
        "skuId": 1792862514845293,
        "skuName": "VST Vegetable Oil 500gm 20Pcs Box",
        "qty": 20,
        "grnPrice": 1557,
        "sellPrice": 1620,
        "gstPercent": 5,
        "lineTotal": 31140
      }
    ],
    "createdAt": "2026-11-11"
  },
  {
    "id": 1794405342272490,
    "date": "2026-11-06",
    "vendorId": 1794417658639131,
    "vendorName": "M/S SHRI GANESH FOODS",
    "invoiceNo": "3612",
    "totalItems": 2,
    "totalAmount": 4800,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-11 at 7.12.06 PM.jpeg",
    "lines": [
      {
        "skuId": 1794405056889490,
        "skuName": "1 LTR WATER ( 12 PCS)",
        "qty": 30,
        "grnPrice": 80,
        "sellPrice": 100,
        "gstPercent": 5,
        "lineTotal": 2400
      },
      {
        "skuId": 1794405193984490,
        "skuName": "1/2 LTR WATER ( 24 PCS)",
        "qty": 20,
        "grnPrice": 120,
        "sellPrice": 140,
        "gstPercent": 5,
        "lineTotal": 2400
      }
    ],
    "createdAt": "2026-11-11"
  },
  {
    "id": 1794404294169490,
    "date": "2026-11-11",
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited",
    "invoiceNo": "INV-25262902689842",
    "totalItems": 5,
    "totalAmount": 90900,
    "status": "approved",
    "att": "Vilcart-11-11-2026.pdf",
    "lines": [
      {
        "skuId": 1792862514916293,
        "skuName": "Vilmaa Femiluv Dry Pads - XL 280mm 80Pcs Box",
        "qty": 35,
        "grnPrice": 800,
        "sellPrice": 1920,
        "gstPercent": 0,
        "lineTotal": 28000
      },
      {
        "skuId": 1792862514918293,
        "skuName": "Vilmaa Femiluv Soft Pads - XL 280mm 80Pcs Box",
        "qty": 35,
        "grnPrice": 800,
        "sellPrice": 1920,
        "gstPercent": 0,
        "lineTotal": 28000
      },
      {
        "skuId": 1792862514801293,
        "skuName": "Trulove Chocolate Kreme 5Rs 144Pcs Box",
        "qty": 35,
        "grnPrice": 320,
        "sellPrice": 520,
        "gstPercent": 5,
        "lineTotal": 11200
      },
      {
        "skuId": 1792862514825293,
        "skuName": "Powder Salt 1Kg 25Pcs Bag",
        "qty": 10,
        "grnPrice": 120,
        "sellPrice": 220,
        "gstPercent": 0,
        "lineTotal": 1200
      },
      {
        "skuId": 1792862514866293,
        "skuName": "Aramane Detergent Soap 10Rs 60Pcs Box",
        "qty": 90,
        "grnPrice": 250,
        "sellPrice": 510,
        "gstPercent": 18,
        "lineTotal": 22500
      }
    ],
    "createdAt": "2026-11-11"
  },
  {
    "id": 1794392719087490,
    "date": "2026-11-06",
    "vendorId": 1793977635698154,
    "vendorName": "ARHAM TRADING COMPANY",
    "invoiceNo": "ATC/411/26-27",
    "totalItems": 1,
    "totalAmount": 49200,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-11 at 3.52.31 PM.jpeg",
    "lines": [
      {
        "skuId": 1792862514841293,
        "skuName": "SVT Vegetable Oil 1Kg 10Pcs Box",
        "qty": 30,
        "grnPrice": 1640,
        "sellPrice": 1670,
        "gstPercent": 5,
        "lineTotal": 49200
      }
    ],
    "createdAt": "2026-11-11"
  },
  {
    "id": 1794392041200490,
    "date": "2026-11-11",
    "vendorId": 1793886242914154,
    "vendorName": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "invoiceNo": "2",
    "totalItems": 2,
    "totalAmount": 31920,
    "status": "approved",
    "att": "Purchase Invoice 1.pdf",
    "lines": [
      {
        "skuId": 1792862514742293,
        "skuName": "Maida 30Kg Bag",
        "qty": 14,
        "grnPrice": 1070,
        "sellPrice": 1180,
        "gstPercent": 0,
        "lineTotal": 14980
      },
      {
        "skuId": 1793211755070131,
        "skuName": "Gajaraj Kesar Sooji 30Kg Bag",
        "qty": 14,
        "grnPrice": 1210,
        "sellPrice": 1320,
        "gstPercent": 0,
        "lineTotal": 16940
      }
    ],
    "createdAt": "2026-11-11"
  },
  {
    "id": 1794407277373490,
    "date": "2026-11-11",
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO",
    "invoiceNo": "SHD/2813/26-27",
    "totalItems": 1,
    "totalAmount": 81300,
    "status": "approved",
    "att": "Siddeshwar Enterprises,  VIJAYAPURA    2813.pdf",
    "lines": [
      {
        "skuId": 1792862514829293,
        "skuName": "Sugar S-30 50Kg Bag",
        "qty": 30,
        "grnPrice": 2710,
        "sellPrice": 2900,
        "gstPercent": 5,
        "lineTotal": 81300
      }
    ],
    "createdAt": "2026-11-11"
  },
  {
    "id": 1794549389053490,
    "date": "2026-11-13",
    "vendorId": 1793707961988557,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "invoiceNo": "MAI/26-27/3768",
    "totalItems": 3,
    "totalAmount": 224000,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-13 at 11.26.07 AM.jpeg",
    "lines": [
      {
        "skuId": 1792862514844293,
        "skuName": "VST Vegetable Oil 1Kg 10Pcs Box",
        "qty": 100,
        "grnPrice": 1550,
        "sellPrice": 1610,
        "gstPercent": 5,
        "lineTotal": 155000
      },
      {
        "skuId": 1792862514845293,
        "skuName": "VST Vegetable Oil 500gm 20Pcs Box",
        "qty": 20,
        "grnPrice": 1560,
        "sellPrice": 1620,
        "gstPercent": 5,
        "lineTotal": 31200
      },
      {
        "skuId": 1793708242898557,
        "skuName": "SUN ROYAL 750 GM SUNFLOWER OIL BOX",
        "qty": 30,
        "grnPrice": 1260,
        "sellPrice": 1470,
        "gstPercent": 5,
        "lineTotal": 37800
      }
    ],
    "createdAt": "2026-11-13"
  },
  {
    "id": 1794768311404060,
    "date": "2026-11-06",
    "vendorId": 1793886242914154,
    "vendorName": "MOHAN TRADERS VIJAYAPUR - 2025-26",
    "invoiceNo": "06-11",
    "totalItems": 1,
    "totalAmount": 12600,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-11 at 11.10.42 PM.jpeg",
    "lines": [
      {
        "skuId": 1793211755091131,
        "skuName": "Gram Dal Fine 30Kg Bag",
        "qty": 5,
        "grnPrice": 2520,
        "sellPrice": 2860,
        "gstPercent": 0,
        "lineTotal": 12600
      }
    ],
    "createdAt": "2026-11-15"
  },
  {
    "id": 1794838257166071,
    "date": "2026-11-16",
    "vendorId": 1794837977210071,
    "vendorName": "WAGHAJI TRADERS",
    "invoiceNo": "WT/26-27/4064",
    "totalItems": 1,
    "totalAmount": 112560,
    "status": "approved",
    "att": "Voucher Display_16112026_191119.pdf",
    "lines": [
      {
        "skuId": 1792862514829293,
        "skuName": "Sugar S-30 50Kg Bag",
        "qty": 42,
        "grnPrice": 2679.9991,
        "sellPrice": 2800,
        "gstPercent": 5,
        "lineTotal": 112559.96
      }
    ],
    "createdAt": "2026-11-16"
  },
  {
    "id": 1795098022635136,
    "date": "2026-11-18",
    "vendorId": 1793687754957557,
    "vendorName": "SHA PRATAPMAL DEVICHAND",
    "invoiceNo": "985",
    "totalItems": 1,
    "totalAmount": 32000,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-18 at 4.48.38 PM (1).jpeg",
    "lines": [
      {
        "skuId": 1795097577668136,
        "skuName": "Jasmine Rice 5kg Bag",
        "qty": 80,
        "grnPrice": 400,
        "sellPrice": 420,
        "gstPercent": 5,
        "lineTotal": 32000
      }
    ],
    "createdAt": "2026-11-19"
  },
  {
    "id": 1795089260749071,
    "date": "2026-11-19",
    "vendorId": 1795087413987071,
    "vendorName": "SRINIDHI FOODS",
    "invoiceNo": "AG/SO003",
    "totalItems": 2,
    "totalAmount": 196560,
    "status": "approved",
    "att": "P.pdf",
    "lines": [
      {
        "skuId": 1795089069760071,
        "skuName": "Zeeba Jeera Rice 26 Kg Bag",
        "qty": 70,
        "grnPrice": 2028,
        "sellPrice": 2400,
        "gstPercent": 0,
        "lineTotal": 141960
      },
      {
        "skuId": 1795088768153071,
        "skuName": "Zeeba Steam Rice 26kg Bag",
        "qty": 30,
        "grnPrice": 1820,
        "sellPrice": 2140,
        "gstPercent": 0,
        "lineTotal": 54600
      }
    ],
    "createdAt": "2026-11-19"
  },
  {
    "id": 1795086560039071,
    "date": "2026-11-19",
    "vendorId": 1793707961988557,
    "vendorName": "MADHUKAR AGRO INDUSTRIES",
    "invoiceNo": "MAI/26-27/3881",
    "totalItems": 2,
    "totalAmount": 145600,
    "status": "approved",
    "att": "Voucher Display_19112026_162601.pdf",
    "lines": [
      {
        "skuId": 1792862514844293,
        "skuName": "VST Vegetable Oil 1Kg 10Pcs Box",
        "qty": 70,
        "grnPrice": 1539.993,
        "sellPrice": 1590,
        "gstPercent": 5,
        "lineTotal": 107799.51
      },
      {
        "skuId": 1793708242898557,
        "skuName": "SUN ROYAL 750 GM SUNFLOWER OIL BOX",
        "qty": 30,
        "grnPrice": 1260,
        "sellPrice": 1450,
        "gstPercent": 5,
        "lineTotal": 37800
      }
    ],
    "createdAt": "2026-11-19"
  },
  {
    "id": 1795070944465071,
    "date": "2026-11-19",
    "vendorId": 1793173675973357,
    "vendorName": "Rishi Enterprises",
    "invoiceNo": "385",
    "totalItems": 8,
    "totalAmount": 24656,
    "status": "approved",
    "att": "WhatsApp Image 2026-11-19 at 10.54.36 AM.jpeg",
    "lines": [
      {
        "skuId": 1794579615417490,
        "skuName": "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )",
        "qty": 600,
        "grnPrice": 6.07,
        "sellPrice": 7.5,
        "gstPercent": 5,
        "lineTotal": 3642.0
      },
      {
        "skuId": 1794579981992490,
        "skuName": "BUMTUM BABY DIAPER 12RS ( M1 7-12 KG 1PANS PKT )",
        "qty": 600,
        "grnPrice": 6.497,
        "sellPrice": 7.5,
        "gstPercent": 5,
        "lineTotal": 3898.2
      },
      {
        "skuId": 1794579826208490,
        "skuName": "BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )",
        "qty": 600,
        "grnPrice": 7.2,
        "sellPrice": 9,
        "gstPercent": 5,
        "lineTotal": 4320.0
      },
      {
        "skuId": 1794580153480490,
        "skuName": "BUMTUM BABY DIAPER 18RS ( NB2 2-5 KG 2 PANS PKT )",
        "qty": 288,
        "grnPrice": 13.82,
        "sellPrice": 17,
        "gstPercent": 5,
        "lineTotal": 3980.16
      },
      {
        "skuId": 1794637089256136,
        "skuName": "BUMTUM BABY DIAPER 46RS (S5 3-8 KG 5 PANS PKT )",
        "qty": 60,
        "grnPrice": 35.59,
        "sellPrice": 42,
        "gstPercent": 5,
        "lineTotal": 2135.4
      },
      {
        "skuId": 1794637301728136,
        "skuName": "BUMTUM BABY DIAPER 56RS (M5 7-12 KG 5 PANS PKT )",
        "qty": 60,
        "grnPrice": 43.51,
        "sellPrice": 55,
        "gstPercent": 5,
        "lineTotal": 2610.6
      },
      {
        "skuId": 1794637408143136,
        "skuName": "BUMTUM BABY DIAPER 66RS (L5 9-14 KG 5 PANS PKT )",
        "qty": 60,
        "grnPrice": 47.45,
        "sellPrice": 55,
        "gstPercent": 5,
        "lineTotal": 2847.0
      },
      {
        "skuId": 1794637903280136,
        "skuName": "BUMTUM BABY DIAPER 10 RS (S2 4-8KG 2PANS PKT)",
        "qty": 84,
        "grnPrice": 14.55,
        "sellPrice": 20,
        "gstPercent": 5,
        "lineTotal": 1222.2
      }
    ],
    "createdAt": "2026-11-19"
  },
  {
    "id": 1795249389699071,
    "date": "2026-11-21",
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "invoiceNo": "5641",
    "totalItems": 7,
    "totalAmount": 158950,
    "status": "approved",
    "att": "Voucher Display_21112026_130323 (1).pdf",
    "lines": [
      {
        "skuId": 1793211755091131,
        "skuName": "Gram Dal Fine 30Kg Bag",
        "qty": 10,
        "grnPrice": 2580,
        "sellPrice": 2860,
        "gstPercent": 0,
        "lineTotal": 25800
      },
      {
        "skuId": 1793211755070131,
        "skuName": "Gajaraj Kesar Sooji 30Kg Bag",
        "qty": 20,
        "grnPrice": 1240,
        "sellPrice": 1320,
        "gstPercent": 0,
        "lineTotal": 24800
      },
      {
        "skuId": 1792862514742293,
        "skuName": "Maida 30Kg Bag",
        "qty": 20,
        "grnPrice": 1080,
        "sellPrice": 1180,
        "gstPercent": 0,
        "lineTotal": 21600
      },
      {
        "skuId": 1793211755071131,
        "skuName": "Gajaraj Kesar Sooji 50Kg Bag",
        "qty": 5,
        "grnPrice": 2060,
        "sellPrice": 2150,
        "gstPercent": 0,
        "lineTotal": 10300
      },
      {
        "skuId": 1793211755095131,
        "skuName": "Masoor Dal 30Kg Bag",
        "qty": 5,
        "grnPrice": 2250,
        "sellPrice": 2350,
        "gstPercent": 0,
        "lineTotal": 11250
      },
      {
        "skuId": 1792862514748293,
        "skuName": "Namasthe Gram Flour 50Kg Bag",
        "qty": 10,
        "grnPrice": 3340,
        "sellPrice": 3500,
        "gstPercent": 0,
        "lineTotal": 33400
      },
      {
        "skuId": 1793211755087131,
        "skuName": "Fried Gram Fine 30Kg Bag",
        "qty": 10,
        "grnPrice": 3180,
        "sellPrice": 3220,
        "gstPercent": 0,
        "lineTotal": 31800
      }
    ],
    "createdAt": "2026-11-21"
  },
  {
    "id": 1795250359090071,
    "date": "2026-11-21",
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA",
    "invoiceNo": "5642",
    "totalItems": 1,
    "totalAmount": 17800,
    "status": "approved",
    "att": "Voucher Display_21112026_130353 (2).pdf",
    "lines": [
      {
        "skuId": 1792862514745293,
        "skuName": "Namasthe Gram Flour 10Kg 5Pcs Bag",
        "qty": 25,
        "grnPrice": 712.005,
        "sellPrice": 740,
        "gstPercent": 5,
        "lineTotal": 17800.12
      }
    ],
    "createdAt": "2026-11-21"
  }
];

export const INITIAL_DEBIT_NOTES: DebitNoteRecord[] = [];

const STORAGE_KEY_VENDORS = "erp_purchases_vendors_v2";
const STORAGE_KEY_PURCHASES = "erp_purchases_list_v2";
const STORAGE_KEY_DEBITS = "erp_purchases_debits_v2";

export function getStoredVendors(): VendorRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VENDORS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load vendors", e);
  }
  return INITIAL_VENDORS;
}

export function saveStoredVendors(list: VendorRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save vendors", e);
  }
}

export function getStoredPurchases(): PurchaseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PURCHASES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load purchases", e);
  }
  return INITIAL_PURCHASES;
}

export function saveStoredPurchases(list: PurchaseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save purchases", e);
  }
}

export function getStoredDebitNotes(): DebitNoteRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEBITS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load debit notes", e);
  }
  return INITIAL_DEBIT_NOTES;
}

export function saveStoredDebitNotes(list: DebitNoteRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DEBITS, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save debit notes", e);
  }
}

export const STATE_CODE_MAP: Record<string, string> = {
  "29": "Karnataka",
  "27": "Maharashtra",
  "30": "Goa",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "24": "Gujarat",
  "07": "Delhi",
};

export interface AutoPoItem {
  id: number;
  skuName: string;
  stock: number;
  min: number;
  soldPerDay: number;
  suggestedQty: number;
  vendorId: number;
  vendorName: string;
}

export const INITIAL_AUTO_PO: AutoPoItem[] = [
  {
    "id": 1792862514917293,
    "skuName": "Vilmaa Femiluv Soft Pads - XL 280mm 1Pcs Pkt",
    "stock": 1,
    "min": 5,
    "soldPerDay": 3.3,
    "suggestedQty": 14,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1793211755075131,
    "skuName": "Sooji 10Kg Bag",
    "stock": 1,
    "min": 5,
    "soldPerDay": 0.5,
    "suggestedQty": 14,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514882293,
    "skuName": "Glim Dishwash Soap 10Rs 60Pcs Box",
    "stock": 3,
    "min": 5,
    "soldPerDay": 1.2,
    "suggestedQty": 12,
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited"
  },
  {
    "id": 1792862514743293,
    "skuName": "Maida 50Kg Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.3,
    "suggestedQty": 15,
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA"
  },
  {
    "id": 1792862514864293,
    "skuName": "Aramane Detergent Powder 500gm 30Pcs Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 1.0,
    "suggestedQty": 15,
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited"
  },
  {
    "id": 1794405193984490,
    "skuName": "1/2 LTR WATER ( 24 PCS)",
    "stock": 1,
    "min": 5,
    "soldPerDay": 0.8,
    "suggestedQty": 14,
    "vendorId": 1794417658639131,
    "vendorName": "M/S SHRI GANESH FOODS"
  },
  {
    "id": 1793211755113131,
    "skuName": "Urad Dal 10Kg Bag",
    "stock": 2,
    "min": 5,
    "soldPerDay": 0.5,
    "suggestedQty": 13,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514738293,
    "skuName": "Atta 5Kg 5Pcs Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.8,
    "suggestedQty": 15,
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA"
  },
  {
    "id": 1792862514754293,
    "skuName": "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box",
    "stock": 0,
    "min": 5,
    "soldPerDay": 2.2,
    "suggestedQty": 15,
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited"
  },
  {
    "id": 1793211755109131,
    "skuName": "Toor Dal 10Kg Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.3,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1794405056889490,
    "skuName": "1 LTR WATER ( 12 PCS)",
    "stock": 0,
    "min": 5,
    "soldPerDay": 1.0,
    "suggestedQty": 15,
    "vendorId": 1794417658639131,
    "vendorName": "M/S SHRI GANESH FOODS"
  },
  {
    "id": 1792862514877293,
    "skuName": "Dove Daily Shine Shampoo 2Rs 960Pcs Box",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.1,
    "suggestedQty": 15,
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited"
  },
  {
    "id": 1792862514912293,
    "skuName": "Surf Excel Detergent Soap 250gm 6Pcs Pkt",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.7,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1793211755094131,
    "skuName": "Masoor Dal 10Kg Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.4,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1793211755071131,
    "skuName": "Gajaraj Kesar Sooji 50Kg Bag",
    "stock": 5,
    "min": 5,
    "soldPerDay": 0.4,
    "suggestedQty": 10,
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA"
  },
  {
    "id": 1793211755095131,
    "skuName": "Masoor Dal 30Kg Bag",
    "stock": 5,
    "min": 5,
    "soldPerDay": 0.1,
    "suggestedQty": 10,
    "vendorId": 1793705719341557,
    "vendorName": "SHAH NARAYANMAL JERUPJI BAFNA"
  },
  {
    "id": 1793211755081131,
    "skuName": "Red Lable Tea Powder 100gm 6Pcs Pkt",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514897293,
    "skuName": "Parachute Coconut oil 250ml 1Pcs Pkt",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514786293,
    "skuName": "Marino Glucose Biscuit 4.5Rs 24Pcs Pkt",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514920293,
    "skuName": "Wheel Detergent Powder 10Rs 60Pcs Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.9,
    "suggestedQty": 15,
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited"
  },
  {
    "id": 1793211755103131,
    "skuName": "Paper Toor dal 30Kg Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514756293,
    "skuName": "Good Day Butter Biscuits 5Rs 180Pcs Box",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1793211755096131,
    "skuName": "Moong Dal Fine 1Kg Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514896293,
    "skuName": "Parachute Coconut oil 175ml 100Pcs Box",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514887293,
    "skuName": "Karthika Shampoo 1Rs 80pcs (4 Sheet Pkt)",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514869293,
    "skuName": "Clinic Plus Shampoo 1Rs 64pcs (4 Sheet Pkt)",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514867293,
    "skuName": "Chik Shampoo 1Rs 64pcs (4 Sheet Pkt)",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.0,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1793211755090131,
    "skuName": "Gram Dal Fine 10Kg Bag",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.2,
    "suggestedQty": 15,
    "vendorId": 1794417264296131,
    "vendorName": "SHA HIRACHAND DONGARCHAND & CO"
  },
  {
    "id": 1792862514913293,
    "skuName": "Surf Excel Detergent Soap 250gm 60Pcs Box",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.2,
    "suggestedQty": 15,
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited"
  },
  {
    "id": 1792862514835293,
    "skuName": "Ruchi Gold Palm Oil 15Ltr 1Tin Tin",
    "stock": 0,
    "min": 5,
    "soldPerDay": 0.3,
    "suggestedQty": 15,
    "vendorId": 1793713846385357,
    "vendorName": "VilCart Solutions Private Limited"
  }
];
export function getStoredAutoPo(): AutoPoItem[] {
  return INITIAL_AUTO_PO;
}

// ─── API-FIRST LOADERS ────────────────────────────────────────────────────────
import { fetchPurchases as _fetchPurchases, fetchSuppliers as _fetchSuppliers } from "@/lib/api/apiService";

export async function loadPurchasesFromApi(dateFrom?: string, dateTo?: string): Promise<PurchaseRecord[]> {
  const apiData = await _fetchPurchases(dateFrom, dateTo);
  return apiData.map((p) => ({
    id: p.id as unknown as number,
    date: p.date,
    vendorId: 0,
    vendorName: p.supplier_name,
    invoiceNo: p.invoice_number,
    totalItems: p.items?.length || 0,
    totalAmount: p.total_amount,
    status: (p.status?.toLowerCase() === "approved" ? "approved" : "pending") as "approved" | "pending",
    lines: (p.items || []).map((it) => ({
      skuId: 0,
      skuName: it.product_name,
      qty: it.quantity,
      grnPrice: it.unit_cost,
      sellPrice: it.unit_cost,
      gstPercent: 0,
      lineTotal: it.total_cost,
    })),
    createdAt: p.created_at || p.date,
  }));
}

export async function loadVendorsFromApi(): Promise<VendorRecord[]> {
  const apiData = await _fetchSuppliers();
  return apiData.map((s) => ({
    id: s.id as unknown as number,
    name: s.name,
    gstin: s.gstin || "",
    ph: s.phone || "",
    state: "Karnataka",
    pan: "",
    addr: "",
    createdAt: new Date().toISOString().slice(0, 10),
  }));
}
