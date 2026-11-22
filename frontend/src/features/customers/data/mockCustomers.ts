export interface CustomerRecord {
  id: number;
  name: string;
  nameKn: string;
  shop: string;
  ph: string;
  adh: string;
  adhv?: string;
  gstin?: string;
  lm: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  villageKn?: string;
  villageKey?: string;
  pincode: string;
  route: string;
  beat: string;
  status: "active" | "inactive" | "unbilled";
  lastBillDate?: string;
  lastBillDays?: number;
  createdAt: string;
}

export interface RouteRecord {
  name: string;
  beatDays: string[];
  crmName?: string;
  villages: {
    name: string;
    key: string;
    customerCount: number;
  }[];
  totalCustomers: number;
}

export const INITIAL_ROUTES: RouteRecord[] = [
  {
    name: "Basavan Bagewadi",
    beatDays: ["Mon", "Thu"],
    crmName: "Pushpa Patil",
    villages: [
      { name: "Basavan Bagewadi City", key: "V1", customerCount: 42 },
      { name: "Ingaleshwar", key: "V2", customerCount: 22 },
      { name: "Huvina Hipparagi", key: "V3", customerCount: 18 },
      { name: "Telagi", key: "V4", customerCount: 12 },
      { name: "Nidagundi", key: "V5", customerCount: 9 },
    ],
    totalCustomers: 103,
  },
  {
    name: "mamadapur",
    beatDays: ["Tue", "Fri"],
    crmName: "Vijaykumar Shantagiri",
    villages: [
      { name: "Mamadapur", key: "V1", customerCount: 45 },
      { name: "Kambagi", key: "V2", customerCount: 31 },
      { name: "Honaganahalli", key: "V3", customerCount: 26 },
      { name: "Alaginal", key: "V4", customerCount: 22 },
    ],
    totalCustomers: 124,
  },
  {
    name: "Chagabhavi",
    beatDays: ["Wed", "Sat"],
    crmName: "Pushpa Patil",
    villages: [
      { name: "Chagabhavi", key: "V1", customerCount: 38 },
      { name: "Yaranal", key: "V2", customerCount: 28 },
      { name: "Donur", key: "V3", customerCount: 22 },
    ],
    totalCustomers: 88,
  },
  {
    name: "Chimalagi RC R",
    beatDays: ["Mon", "Thu"],
    crmName: "Pushpa Patil",
    villages: [
      { name: "Chimalagi", key: "V1", customerCount: 36 },
      { name: "Siddapur", key: "V2", customerCount: 29 },
      { name: "Golasangi", key: "V3", customerCount: 27 },
    ],
    totalCustomers: 92,
  },
  {
    name: "Kolhar",
    beatDays: ["Tue", "Fri"],
    crmName: "Vijaykumar Shantagiri",
    villages: [
      { name: "Kolhar", key: "V1", customerCount: 52 },
      { name: "Kukanur", key: "V2", customerCount: 24 },
      { name: "Rona", key: "V3", customerCount: 19 },
    ],
    totalCustomers: 95,
  },
  {
    name: "Tikota",
    beatDays: ["Wed", "Sat"],
    crmName: "Pushpa Patil",
    villages: [
      { name: "Tikota", key: "V1", customerCount: 48 },
      { name: "Babanagar", key: "V2", customerCount: 32 },
      { name: "Kanamadi", key: "V3", customerCount: 28 },
      { name: "Toravi", key: "V4", customerCount: 24 },
    ],
    totalCustomers: 132,
  },
  {
    name: "Indi Route",
    beatDays: ["Mon", "Thu"],
    crmName: "Pushpa Patil",
    villages: [
      { name: "Indi City", key: "V1", customerCount: 65 },
      { name: "Horti", key: "V2", customerCount: 34 },
      { name: "Zalki", key: "V3", customerCount: 28 },
      { name: "Lachyan", key: "V4", customerCount: 19 },
    ],
    totalCustomers: 146,
  },
  {
    name: "Muddebihal",
    beatDays: ["Tue", "Fri"],
    crmName: "Vijaykumar Shantagiri",
    villages: [
      { name: "Muddebihal City", key: "V1", customerCount: 58 },
      { name: "Nalatwad", key: "V2", customerCount: 33 },
      { name: "Dhavalagi", key: "V3", customerCount: 27 },
    ],
    totalCustomers: 118,
  },
  {
    name: "Sindagi Route",
    beatDays: ["Wed", "Sat"],
    crmName: "Pushpa Patil",
    villages: [
      { name: "Sindagi City", key: "V1", customerCount: 62 },
      { name: "Almel", key: "V2", customerCount: 38 },
      { name: "Devar Hippargi", key: "V3", customerCount: 31 },
    ],
    totalCustomers: 131,
  },
  {
    name: "Babaleshwar",
    beatDays: ["Thu"],
    crmName: "Vijaykumar Shantagiri",
    villages: [
      { name: "Babaleshwar", key: "V1", customerCount: 44 },
      { name: "Jainapur", key: "V2", customerCount: 26 },
      { name: "Sarwad", key: "V3", customerCount: 22 },
    ],
    totalCustomers: 92,
  },
];

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 1,
    name: "Sri Basaveshwar Stores",
    nameKn: "ಶ್ರೀ ಬಸವೇಶ್ವರ ಸ್ಟೋರ್ಸ್",
    shop: "Sri Basaveshwar Kirana",
    ph: "9845012345",
    adh: "4589 1234 5678",
    adhv: "uidai-qr",
    gstin: "29AABCS1429B1Z8",
    lm: "Near Bus Stand",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Basavan Bagewadi",
    village: "Basavan Bagewadi City",
    villageKn: "ಬಸವನ ಬಾಗೇವಾಡಿ",
    villageKey: "V1",
    pincode: "586203",
    route: "Basavan Bagewadi",
    beat: "Mon, Thu",
    status: "active",
    lastBillDate: "21-11-2026",
    lastBillDays: 1,
    createdAt: "2026-01-10",
  },
  {
    id: 2,
    name: "Lakshmi General Stores",
    nameKn: "ಲಕ್ಷ್ಮಿ ಜನರಲ್ ಸ್ಟೋರ್ಸ್",
    shop: "Lakshmi Stores",
    ph: "9845023456",
    adh: "5894 2345 6789",
    adhv: "uidai-qr",
    gstin: "29BBCCS2233C1Z2",
    lm: "Main Market Road",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Tikota",
    village: "Tikota",
    villageKn: "ಟಿಕೋಟಾ",
    villageKey: "V1",
    pincode: "586128",
    route: "Tikota",
    beat: "Wed, Sat",
    status: "active",
    lastBillDate: "20-11-2026",
    lastBillDays: 2,
    createdAt: "2026-02-14",
  },
  {
    id: 3,
    name: "Gowda Provision Stores",
    nameKn: "ಗೌಡ ಪ್ರಾವಿಷನ್ ಸ್ಟೋರ್ಸ್",
    shop: "Gowda Kirana",
    ph: "9845034567",
    adh: "6912 3456 7890",
    gstin: "",
    lm: "Opposite Gram Panchayat",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Indi",
    village: "Indi City",
    villageKn: "ಇಂಡಿ",
    villageKey: "V1",
    pincode: "586209",
    route: "Indi Route",
    beat: "Mon, Thu",
    status: "unbilled",
    lastBillDate: undefined,
    lastBillDays: undefined,
    createdAt: "2026-04-20",
  },
  {
    id: 4,
    name: "Annapurna Traders",
    nameKn: "ಅನ್ನಪೂರ್ಣ ಟ್ರೇಡರ್ಸ್",
    shop: "Annapurna Super Bazar",
    ph: "9845045678",
    adh: "7823 4567 8901",
    gstin: "29CCCDS3344D1Z5",
    lm: "APMC Yard Gate 2",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Sindagi",
    village: "Sindagi City",
    villageKn: "ಸಿಂದಗಿ",
    villageKey: "V1",
    pincode: "586128",
    route: "Sindagi Route",
    beat: "Wed, Sat",
    status: "active",
    lastBillDate: "19-11-2026",
    lastBillDays: 3,
    createdAt: "2026-03-01",
  },
  {
    id: 5,
    name: "Renuka Agencies",
    nameKn: "ರೇಣುಕಾ ಏಜೆನ್ಸೀಸ್",
    shop: "Renuka Kirana",
    ph: "9845056789",
    adh: "8934 5678 9012",
    gstin: "",
    lm: "Temple Street",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Kolhar",
    village: "Kolhar",
    villageKn: "ಕೊಲ್ಹಾರ",
    villageKey: "V1",
    pincode: "586201",
    route: "Kolhar",
    beat: "Tue, Fri",
    status: "unbilled",
    lastBillDate: undefined,
    lastBillDays: undefined,
    createdAt: "2026-05-12",
  },
  {
    id: 6,
    name: "Shree Ganesh Bazar",
    nameKn: "ಶ್ರೀ ಗಣೇಶ ಬಜಾರ್",
    shop: "Ganesh Stores",
    ph: "9845067890",
    adh: "9045 6789 0123",
    gstin: "",
    lm: "Near Govt School",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Basavan Bagewadi",
    village: "Ingaleshwar",
    villageKn: "ಇಂಗಳೇಶ್ವರ",
    villageKey: "V2",
    pincode: "586203",
    route: "Basavan Bagewadi",
    beat: "Mon, Thu",
    status: "unbilled",
    lastBillDate: undefined,
    lastBillDays: undefined,
    createdAt: "2026-06-05",
  },
  {
    id: 7,
    name: "Mamadapur Daily Mart",
    nameKn: "ಮಮದಾಪುರ ಡೈಲಿ ಮಾರ್ಟ್",
    shop: "Daily Mart",
    ph: "9845078901",
    adh: "2345 6789 0124",
    gstin: "",
    lm: "Station Road",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Vijayapura",
    village: "Mamadapur",
    villageKn: "ಮಮದಾಪುರ",
    villageKey: "V1",
    pincode: "586113",
    route: "mamadapur",
    beat: "Tue, Fri",
    status: "active",
    lastBillDate: "21-11-2026",
    lastBillDays: 1,
    createdAt: "2026-01-20",
  },
  {
    id: 8,
    name: "Kambagi Kirana Merchant",
    nameKn: "ಕಂಬಗಿ ಕಿರಾಣಾ ಮರ್ಚೆಂಟ್",
    shop: "Kambagi Stores",
    ph: "9845089012",
    adh: "3456 7890 1235",
    gstin: "",
    lm: "Old Post Office",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Vijayapura",
    village: "Kambagi",
    villageKn: "ಕಂಬಗಿ",
    villageKey: "V2",
    pincode: "586113",
    route: "mamadapur",
    beat: "Tue, Fri",
    status: "unbilled",
    lastBillDate: undefined,
    lastBillDays: undefined,
    createdAt: "2026-07-15",
  },
  {
    id: 9,
    name: "Chagabhavi Provision",
    nameKn: "ಚಾಗಭಾವಿ ಪ್ರಾವಿಷನ್",
    shop: "Chagabhavi Mart",
    ph: "9845090123",
    adh: "4567 8901 2346",
    gstin: "",
    lm: "Cross Road",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Muddebihal",
    village: "Chagabhavi",
    villageKn: "ಚಾಗಭಾವಿ",
    villageKey: "V1",
    pincode: "586212",
    route: "Chagabhavi",
    beat: "Wed, Sat",
    status: "unbilled",
    lastBillDate: undefined,
    lastBillDays: undefined,
    createdAt: "2026-08-01",
  },
  {
    id: 10,
    name: "Chimalagi Traders",
    nameKn: "ಚಿಮಲಗಿ ಟ್ರೇಡರ್ಸ್",
    shop: "Chimalagi Stores",
    ph: "9845091234",
    adh: "5678 9012 3457",
    gstin: "",
    lm: "Near Water Tank",
    state: "Karnataka",
    district: "Vijayapura",
    taluka: "Basavan Bagewadi",
    village: "Chimalagi",
    villageKn: "ಚಿಮಲಗಿ",
    villageKey: "V1",
    pincode: "586208",
    route: "Chimalagi RC R",
    beat: "Mon, Thu",
    status: "unbilled",
    lastBillDate: undefined,
    lastBillDays: undefined,
    createdAt: "2026-08-10",
  },
];

const STORAGE_KEY_CUSTOMERS = "erp_customers_data";
const STORAGE_KEY_ROUTES = "erp_routes_data";

export function getStoredCustomers(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load customers from storage", e);
  }
  return INITIAL_CUSTOMERS;
}

export function saveStoredCustomers(list: CustomerRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save customers to storage", e);
  }
}

export function getStoredRoutes(): RouteRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROUTES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load routes from storage", e);
  }
  return INITIAL_ROUTES;
}

export function saveStoredRoutes(list: RouteRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save routes to storage", e);
  }
}
