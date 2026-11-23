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
    "id": 1794042584049009,
    "no": "KA28AA6256",
    "brand": "Mahindra",
    "type": "Pickup (Bolero / Dost)",
    "model": "Bolero Pickup",
    "own": "Kumar Patil",
    "addr": "Bijapur",
    "oph": "9880801735",
    "pol": "",
    "insx": "2027-05-07",
    "dr": "",
    "ph": "",
    "createdAt": "2026-10-24"
  },
  {
    "id": 1793775239830154,
    "no": "KA28AC0349",
    "brand": "Tata",
    "type": "Other",
    "model": "TATA INTRA V70",
    "own": "BASAVARAJ WALIKAR",
    "addr": "MADINA NAGAR BIJAPUR",
    "oph": "7204409255",
    "pol": "",
    "insx": "2027-03-31",
    "dr": "",
    "ph": "",
    "createdAt": "2026-10-24"
  }
];

export const INITIAL_TRIPS: VehicleTripRecord[] = [
  {
    "id": 1795236733988136,
    "date": "2026-11-21",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 28,
    "orderValue": 60200,
    "invoiceAmt": 60200,
    "returns": 2520,
    "netSales": 57190,
    "startKm": 54295,
    "endKm": 54457,
    "totalKm": 162,
    "fixedRent": 1400,
    "dieselCost": 1200,
    "tollCost": 0,
    "otherCost": 0,
    "totalRent": 1400,
    "status": "in_progress",
    "orders": []
  },
  {
    "id": 1795143890853136,
    "date": "2026-11-20",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 47,
    "orderValue": 101050,
    "invoiceAmt": 101050,
    "returns": 4230,
    "netSales": 95997,
    "startKm": 54464,
    "endKm": 54588,
    "totalKm": 124,
    "fixedRent": 1590,
    "dieselCost": 1221,
    "tollCost": 45,
    "otherCost": 1266,
    "totalRent": 2901,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1795060266790136,
    "date": "2026-11-19",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 28,
    "orderValue": 60200,
    "invoiceAmt": 60200,
    "returns": 2520,
    "netSales": 57190,
    "startKm": 54295,
    "endKm": 54457,
    "totalKm": 162,
    "fixedRent": 1254,
    "dieselCost": 1596,
    "tollCost": 0,
    "otherCost": 1596,
    "totalRent": 2850,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794978416406136,
    "date": "2026-11-18",
    "vehId": 1794042584049009,
    "vehNo": "KA28AA6256",
    "model": "Bolero Pickup",
    "ordersCount": 18,
    "orderValue": 38700,
    "invoiceAmt": 38700,
    "returns": 1620,
    "netSales": 36765,
    "startKm": 142696,
    "endKm": 142860,
    "totalKm": 164,
    "fixedRent": 1400,
    "dieselCost": 1615,
    "tollCost": 0,
    "otherCost": 1615,
    "totalRent": 3015,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794973016545136,
    "date": "2026-11-18",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 25,
    "orderValue": 53750,
    "invoiceAmt": 53750,
    "returns": 2250,
    "netSales": 51062,
    "startKm": 54175,
    "endKm": 54293,
    "totalKm": 118,
    "fixedRent": 1349,
    "dieselCost": 1162,
    "tollCost": 45,
    "otherCost": 1207,
    "totalRent": 2601,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794888988009136,
    "date": "2026-11-17",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 44,
    "orderValue": 94600,
    "invoiceAmt": 94600,
    "returns": 3960,
    "netSales": 89870,
    "startKm": 54027,
    "endKm": 54153,
    "totalKm": 126,
    "fixedRent": 1587,
    "dieselCost": 1241,
    "tollCost": 45,
    "otherCost": 1286,
    "totalRent": 2918,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794801716126136,
    "date": "2026-11-16",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 25,
    "orderValue": 53750,
    "invoiceAmt": 53750,
    "returns": 2250,
    "netSales": 51062,
    "startKm": 14330,
    "endKm": 14490,
    "totalKm": 160,
    "fixedRent": 2000,
    "dieselCost": 1576,
    "tollCost": 0,
    "otherCost": 1576,
    "totalRent": 3576,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794632364328136,
    "date": "2026-11-14",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 19,
    "orderValue": 40850,
    "invoiceAmt": 40850,
    "returns": 1710,
    "netSales": 38807,
    "startKm": 14216,
    "endKm": 14321,
    "totalKm": 105,
    "fixedRent": 2000,
    "dieselCost": 1034,
    "tollCost": 0,
    "otherCost": 1034,
    "totalRent": 3034,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794539916749490,
    "date": "2026-11-13",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 38,
    "orderValue": 81700,
    "invoiceAmt": 81700,
    "returns": 3420,
    "netSales": 77615,
    "startKm": 14083,
    "endKm": 14216,
    "totalKm": 133,
    "fixedRent": 2000,
    "dieselCost": 1310,
    "tollCost": 45,
    "otherCost": 1355,
    "totalRent": 3400,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794460210294490,
    "date": "2026-11-12",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 30,
    "orderValue": 64500,
    "invoiceAmt": 64500,
    "returns": 2700,
    "netSales": 61275,
    "startKm": 13916,
    "endKm": 14082,
    "totalKm": 166,
    "fixedRent": 1700,
    "dieselCost": 1635,
    "tollCost": 0,
    "otherCost": 1635,
    "totalRent": 3335,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794372483944490,
    "date": "2026-11-11",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 20,
    "orderValue": 43000,
    "invoiceAmt": 43000,
    "returns": 1800,
    "netSales": 40850,
    "startKm": 13822,
    "endKm": 13913,
    "totalKm": 91,
    "fixedRent": 1400,
    "dieselCost": 896,
    "tollCost": 0,
    "otherCost": 896,
    "totalRent": 2296,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794278933161490,
    "date": "2026-11-10",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 39,
    "orderValue": 83850,
    "invoiceAmt": 83850,
    "returns": 3510,
    "netSales": 79657,
    "startKm": 13696,
    "endKm": 13819,
    "totalKm": 123,
    "fixedRent": 2000,
    "dieselCost": 1212,
    "tollCost": 45,
    "otherCost": 1257,
    "totalRent": 3302,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794044208978490,
    "date": "2026-11-07",
    "vehId": 1794042584049009,
    "vehNo": "KA28AA6256",
    "model": "Bolero Pickup",
    "ordersCount": 15,
    "orderValue": 32250,
    "invoiceAmt": 32250,
    "returns": 1350,
    "netSales": 30637,
    "startKm": 142518,
    "endKm": 142680,
    "totalKm": 162,
    "fixedRent": 1000,
    "dieselCost": 1596,
    "tollCost": 0,
    "otherCost": 1596,
    "totalRent": 2596,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1794025742858154,
    "date": "2026-11-07",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 18,
    "orderValue": 38700,
    "invoiceAmt": 38700,
    "returns": 1620,
    "netSales": 36765,
    "startKm": 13572,
    "endKm": 13695,
    "totalKm": 123,
    "fixedRent": 1400,
    "dieselCost": 1212,
    "tollCost": 45,
    "otherCost": 1257,
    "totalRent": 2702,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1793936631725154,
    "date": "2026-11-06",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 37,
    "orderValue": 79550,
    "invoiceAmt": 79550,
    "returns": 3330,
    "netSales": 75572,
    "startKm": 13424,
    "endKm": 13569,
    "totalKm": 145,
    "fixedRent": 2000,
    "dieselCost": 1428,
    "tollCost": 0,
    "otherCost": 1498,
    "totalRent": 3498,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1793851583231154,
    "date": "2026-11-05",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 23,
    "orderValue": 49450,
    "invoiceAmt": 49450,
    "returns": 2070,
    "netSales": 46977,
    "startKm": 13250,
    "endKm": 13421,
    "totalKm": 171,
    "fixedRent": 1700,
    "dieselCost": 1684,
    "tollCost": 0,
    "otherCost": 1684,
    "totalRent": 3384,
    "status": "closed",
    "orders": []
  },
  {
    "id": 1793775418166154,
    "date": "2026-11-04",
    "vehId": 1793775239830154,
    "vehNo": "KA28AC0349",
    "model": "TATA INTRA V70",
    "ordersCount": 11,
    "orderValue": 23650,
    "invoiceAmt": 23650,
    "returns": 990,
    "netSales": 22467,
    "startKm": 13122,
    "endKm": 13248,
    "totalKm": 126,
    "fixedRent": 1400,
    "dieselCost": 1241,
    "tollCost": 0,
    "otherCost": 1241,
    "totalRent": 2641,
    "status": "closed",
    "orders": []
  }
];

export const INITIAL_DIESEL_RATES: DieselRateRecord[] = [
  {
    "id": 1794278787438490,
    "date": "2026-11-10",
    "rate": 98.5,
    "by": "Admin ",
    "savedOn": "2026-11-10 08:30 pm"
  },
  {
    "id": 1794278805782490,
    "date": "2026-11-01",
    "rate": 98.5,
    "by": "Admin ",
    "savedOn": "2026-11-01 08:30 pm"
  }
];

const VEHICLES_KEY = "ai_smart_bazar_vehicles_v2";
const TRIPS_KEY = "ai_smart_bazar_vehicle_trips_v2";
const DIESEL_KEY = "ai_smart_bazar_diesel_rates_v2";

export function getStoredVehicles(): VehicleRecord[] {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (!raw) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VEHICLES;
  }
}

export function saveStoredVehicles(list: VehicleRecord[]): void {
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save vehicles", err);
  }
}

export function getStoredTrips(): VehicleTripRecord[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(INITIAL_TRIPS));
      return INITIAL_TRIPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRIPS;
  }
}

export function saveStoredTrips(list: VehicleTripRecord[]): void {
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save vehicle trips", err);
  }
}

export function getStoredDieselRates(): DieselRateRecord[] {
  try {
    const raw = localStorage.getItem(DIESEL_KEY);
    if (!raw) {
      localStorage.setItem(DIESEL_KEY, JSON.stringify(INITIAL_DIESEL_RATES));
      return INITIAL_DIESEL_RATES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DIESEL_RATES;
  }
}

export function saveStoredDieselRates(list: DieselRateRecord[]): void {
  try {
    localStorage.setItem(DIESEL_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save diesel rates", err);
  }
}
