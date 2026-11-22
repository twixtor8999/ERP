export interface VehicleRecord {
  id: number;
  no: string;          // e.g. "KA28AA6256"
  brand: string;       // e.g. "Mahindra", "Tata"
  type: string;        // e.g. "Pickup (Bolero / Dost)", "Other"
  model: string;       // e.g. "Bolero Pickup", "TATA INTRA V70"
  own: string;         // e.g. "Kumar Patil", "BASAVARAJ WALIKAR"
  addr: string;        // Owner address
  oph: string;         // Owner phone e.g. "9880801735"
  pol?: string;        // Insurance policy no
  insx: string;        // Insurance valid till e.g. "2027-05-07"
  dr?: string;         // Driver name
  ph?: string;         // Driver mobile
  createdAt: string;
}

export interface VehicleTripRecord {
  id: number;
  date: string;
  vehId: number;
  vehNo: string;
  model?: string;
  ordersCount: number;
  orderValue: number;
  invoiceAmt: number;
  returns: number;
  netSales: number;
  startKm: number;
  endKm: number;
  totalKm: number;
  fixedRent: number;
  dieselCost: number;
  tollCost: number;
  otherCost: number;
  totalRent: number;
  kmPhotos?: string[];
  status: "closed" | "in_progress";
  orders: {
    id: number;
    no: string;
    custName: string;
    amount: number;
  }[];
}

export interface DieselRateRecord {
  id: number;
  date: string;
  rate: number;
  by: string;
  savedOn: string;
}

export const INITIAL_VEHICLES: VehicleRecord[] = [
  {
    id: 1,
    no: "KA28AA6256",
    brand: "Mahindra",
    type: "Pickup (Bolero / Dost)",
    model: "Bolero Pickup",
    own: "Kumar Patil",
    addr: "Near APMC Market, Vijayapura",
    oph: "9880801735",
    pol: "POL-78291039",
    insx: "2027-05-07",
    dr: "",
    ph: "",
    createdAt: "2026-01-15",
  },
  {
    id: 2,
    no: "KA28AC0349",
    brand: "Tata",
    type: "Other",
    model: "TATA INTRA V70",
    own: "BASAVARAJ WALIKAR",
    addr: "Station Road, Vijayapura",
    oph: "7204409255",
    pol: "POL-99238102",
    insx: "2027-03-31",
    dr: "",
    ph: "",
    createdAt: "2026-02-10",
  },
];

export const INITIAL_DIESEL_RATES: DieselRateRecord[] = [
  {
    id: 1,
    date: "2026-11-22",
    rate: 99.0,
    by: "Vijaykumar Shantagiri Super Admin",
    savedOn: "22 Nov, 08:30 pm",
  },
  {
    id: 2,
    date: "2026-11-01",
    rate: 98.5,
    by: "Vijaykumar Shantagiri Super Admin",
    savedOn: "01 Nov, 09:00 am",
  },
];

export const INITIAL_TRIPS: VehicleTripRecord[] = [
  {
    id: 101,
    date: "2026-11-21",
    vehId: 2,
    vehNo: "KA28AC0349",
    model: "TATA INTRA V70",
    ordersCount: 4,
    orderValue: 34500,
    invoiceAmt: 34500,
    returns: 1200,
    netSales: 33300,
    startKm: 45210,
    endKm: 45330,
    totalKm: 120,
    fixedRent: 1400,
    dieselCost: 1188, // 120 km / 10 km/l * 99
    tollCost: 150,
    otherCost: 1338,
    totalRent: 2738,
    status: "in_progress",
    orders: [
      { id: 1, no: "ORD-2026-1101", custName: "Sri Basaveshwar Stores", amount: 14200 },
      { id: 2, no: "ORD-2026-1102", custName: "Mamadapur Daily Mart", amount: 9800 },
      { id: 3, no: "ORD-2026-1103", custName: "Kambagi Kirana Merchant", amount: 10500 },
    ],
  },
];

const STORAGE_KEY_VEHICLES = "erp_vehicles_data";
const STORAGE_KEY_DIESEL = "erp_diesel_rates_data";
const STORAGE_KEY_TRIPS = "erp_vehicle_trips_data";

export function getStoredVehicles(): VehicleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VEHICLES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load vehicles", e);
  }
  return INITIAL_VEHICLES;
}

export function saveStoredVehicles(list: VehicleRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save vehicles", e);
  }
}

export function getStoredDieselRates(): DieselRateRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIESEL);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load diesel rates", e);
  }
  return INITIAL_DIESEL_RATES;
}

export function saveStoredDieselRates(list: DieselRateRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DIESEL, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save diesel rates", e);
  }
}

export function getStoredTrips(): VehicleTripRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIPS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load trips", e);
  }
  return INITIAL_TRIPS;
}

export function saveStoredTrips(list: VehicleTripRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save trips", e);
  }
}

export function getVehicleMileage(modelOrBrand: string): number {
  const b = (modelOrBrand || "").toUpperCase();
  if (/ASHOK|LEYLAND|V30|JEETO|JITO|BOLERO.*1\.3/.test(b)) return 11;
  if (/V70|BADA\s*DOST|BOLERO.*1\.7/.test(b)) return 10;
  return 10;
}
