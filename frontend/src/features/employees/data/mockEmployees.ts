// Real-time persistent data store for Employees module from wholesale backup
export interface Employee {
  id: number;
  code: string;
  name: string;
  des: string;
  ph: string;
  alt?: string;
  jd: string; // YYYY-MM-DD
  sal: number; // Monthly gross salary in INR
  bank: string;
  acn: string;
  acno: string;
  ifsc: string;
  role: string;
  docs: {
    ph?: boolean;
    adh?: boolean;
    pan?: boolean;
    pb?: boolean;
  };
  added?: string;
}

export interface AttendanceRecord {
  id: number;
  emp: number;
  date: string; // YYYY-MM-DD
  inT?: string; // HH:mm
  outT?: string; // HH:mm
  ov?: string; // 'P'
  ovWas?: string;
  ovBy?: string;
  ovDate?: string;
  ovWhy?: string;
}

export interface SalaryRecord {
  id: number;
  emp: number;
  mon: string; // YYYY-MM
  st: 'approved' | 'wait' | 'reject';
  days?: number;
  amt?: number;
  pm?: string;
  acct?: string;
  by?: string;
  date?: string;
  why?: string;
  note?: string;
}

export interface OfferLetterRecord {
  id: number;
  ref: string;
  type: 'offer' | 'join' | 'relieve' | 'exp';
  emp: number;
  name: string;
  ph: string;
  addr: string;
  des: string;
  jd: string;
  sal: number;
  date: string;
  prob: number;
  notice: number;
  hrs: string;
  off: string;
  rep: string;
  place: string;
  sign: string;
  acc?: string;
  terms?: string;
  at?: string;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    "id": 101,
    "code": "EMP-0001",
    "name": "Owner",
    "des": "Owner",
    "ph": "9880801735",
    "alt": "",
    "jd": "2026-10-23",
    "sal": 0,
    "bank": "",
    "acn": "Owner",
    "acno": "",
    "ifsc": "",
    "role": "Owner",
    "docs": {
      "ph": false,
      "adh": false,
      "pan": false,
      "pb": false
    },
    "added": "2026-10-23"
  },
  {
    "id": 1792846587239903,
    "code": "EMP-0002",
    "name": "Prashant Kalamadi",
    "des": "Admin",
    "ph": "8971098968",
    "alt": "",
    "jd": "2026-10-24",
    "sal": 0,
    "bank": "",
    "acn": "Prashant Kalamadi",
    "acno": "",
    "ifsc": "",
    "role": "Admin",
    "docs": {
      "ph": false,
      "adh": false,
      "pan": false,
      "pb": false
    },
    "added": "2026-10-24"
  },
  {
    "id": 1793045669955853,
    "code": "EMP-0003",
    "name": "Arun Patil",
    "des": "Admin",
    "ph": "9916801495",
    "alt": "",
    "jd": "2026-10-27",
    "sal": 0,
    "bank": "",
    "acn": "Arun Patil",
    "acno": "",
    "ifsc": "",
    "role": "Admin",
    "docs": {
      "ph": false,
      "adh": false,
      "pan": false,
      "pb": false
    },
    "added": "2026-10-27"
  },
  {
    "id": 1793045643265814,
    "code": "EMP-0004",
    "name": "Vijaykumar Shantagiri",
    "des": "Admin",
    "ph": "9739396236",
    "alt": "",
    "jd": "2026-10-27",
    "sal": 0,
    "bank": "",
    "acn": "Vijaykumar Shantagiri",
    "acno": "",
    "ifsc": "",
    "role": "Admin",
    "docs": {
      "ph": false,
      "adh": false,
      "pan": false,
      "pb": false
    },
    "added": "2026-10-27"
  },
  {
    "id": 1792851929338774,
    "code": "EMP-0005",
    "name": "Pushpa Patil",
    "des": "Telecaller/CRM",
    "ph": "9663447859",
    "alt": "",
    "jd": "2026-10-24",
    "sal": 0,
    "bank": "",
    "acn": "Pushpa Patil",
    "acno": "",
    "ifsc": "",
    "role": "Telecaller/CRM",
    "docs": {
      "ph": false,
      "adh": false,
      "pan": false,
      "pb": false
    },
    "added": "2026-10-24"
  },
  {
    "id": 1792858567098803,
    "code": "EMP-0006",
    "name": "Dhruthi A S",
    "des": "Telecaller/CRM",
    "ph": "8861629653",
    "alt": "",
    "jd": "2026-10-24",
    "sal": 0,
    "bank": "",
    "acn": "Dhruthi A S",
    "acno": "",
    "ifsc": "",
    "role": "Telecaller/CRM",
    "docs": {
      "ph": false,
      "adh": false,
      "pan": false,
      "pb": false
    },
    "added": "2026-10-24"
  },
  {
    "id": 1792858816957907,
    "code": "EMP-0007",
    "name": "Mahalaxmi Hiremath",
    "des": "Telecaller/CRM",
    "ph": "8197353836",
    "alt": "",
    "jd": "2026-10-24",
    "sal": 0,
    "bank": "",
    "acn": "Mahalaxmi Hiremath",
    "acno": "",
    "ifsc": "",
    "role": "Telecaller/CRM",
    "docs": {
      "ph": false,
      "adh": false,
      "pan": false,
      "pb": false
    },
    "added": "2026-10-24"
  },
  {
    "id": 1793725415702791,
    "code": "EMP-0008",
    "name": "Anand Kattimani",
    "des": "CA",
    "ph": "8904548204",
    "alt": "",
    "jd": "2026-11-03",
    "sal": 0,
    "bank": "",
    "acn": "Anand Kattimani",
    "acno": "",
    "ifsc": "",
    "role": "CA",
    "docs": {
      "ph": false,
      "adh": false,
      "pan": false,
      "pb": false
    },
    "added": "2026-11-03"
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    "id": 1795098197687136,
    "emp": 1793045643265814,
    "date": "2026-11-18",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098195834136,
    "emp": 1793045643265814,
    "date": "2026-11-17",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098194050136,
    "emp": 1793045643265814,
    "date": "2026-11-16",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098192186136,
    "emp": 1793045643265814,
    "date": "2026-11-14",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098190210136,
    "emp": 1793045643265814,
    "date": "2026-11-13",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098188378136,
    "emp": 1793045643265814,
    "date": "2026-11-12",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098184283136,
    "emp": 1793045643265814,
    "date": "2026-11-11",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098173258136,
    "emp": 1793045643265814,
    "date": "2026-11-10",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098168595136,
    "emp": 1793045643265814,
    "date": "2026-11-07",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098166554136,
    "emp": 1793045643265814,
    "date": "2026-11-05",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098164691136,
    "emp": 1793045643265814,
    "date": "2026-11-06",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098160210136,
    "emp": 1793045643265814,
    "date": "2026-11-04",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098157506136,
    "emp": 1793045643265814,
    "date": "2026-11-03",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  },
  {
    "id": 1795098150370136,
    "emp": 1793045643265814,
    "date": "2026-11-02",
    "inT": "09:30",
    "outT": "19:00",
    "ov": "P",
    "ovWas": "A",
    "ovBy": "Admin",
    "ovDate": "2026-11-19",
    "ovWhy": ""
  }
];

export const INITIAL_SALARY_SLIPS: SalaryRecord[] = [
  {
    id: 1,
    emp: 1793045643265814,
    mon: '2026-11',
    st: 'approved',
    days: 30,
    amt: 45000,
    pm: 'Bank Transfer',
    acct: 'State Bank of India',
    by: 'Admin',
    date: '2026-11-20',
    why: 'Monthly Payroll',
  },
  {
    id: 2,
    emp: 1792846587239903,
    mon: '2026-11',
    st: 'approved',
    days: 30,
    amt: 30000,
    pm: 'Bank Transfer',
    acct: 'HDFC Bank',
    by: 'Admin',
    date: '2026-11-20',
    why: 'Monthly Payroll',
  },
  {
    id: 3,
    emp: 1792851929338774,
    mon: '2026-11',
    st: 'approved',
    days: 28,
    amt: 18000,
    pm: 'Cash',
    acct: 'Cash Drawer',
    by: 'Admin',
    date: '2026-11-20',
    why: 'Monthly Payroll',
  },
  {
    id: 4,
    emp: 1792858567098803,
    mon: '2026-11',
    st: 'approved',
    days: 28,
    amt: 16000,
    pm: 'Cash',
    acct: 'Cash Drawer',
    by: 'Admin',
    date: '2026-11-20',
    why: 'Monthly Payroll',
  },
];

export const INITIAL_OFFER_LETTERS: OfferLetterRecord[] = [
  {
    id: 1,
    ref: 'SE/OFF/2026/001',
    type: 'offer',
    emp: 1792851929338774,
    name: 'Pushpa Patil',
    ph: '9663447859',
    addr: 'Bijapur, Karnataka',
    des: 'Telecaller / CRM',
    jd: '2026-10-24',
    sal: 18000,
    date: '2026-10-20',
    prob: 3,
    notice: 30,
    hrs: '9:30 AM to 7:00 PM',
    off: 'Sunday',
    rep: 'Branch Admin',
    place: 'Bijapur Hub',
    sign: 'Siddeshwar Enterprises',
    terms: 'Standard wholesale trading company employment terms and confidentiality agreement.',
  },
  {
    id: 2,
    ref: 'SE/OFF/2026/002',
    type: 'offer',
    emp: 1792858567098803,
    name: 'Dhruthi A S',
    ph: '8861629653',
    addr: 'Bijapur, Karnataka',
    des: 'Telecaller / CRM',
    jd: '2026-10-24',
    sal: 16000,
    date: '2026-10-20',
    prob: 3,
    notice: 30,
    hrs: '9:30 AM to 7:00 PM',
    off: 'Sunday',
    rep: 'Branch Admin',
    place: 'Bijapur Hub',
    sign: 'Siddeshwar Enterprises',
    terms: 'Standard wholesale trading company employment terms and confidentiality agreement.',
  },
];

const EMP_STORAGE_KEY = 'ai_smart_bazar_employees_v2';
const ATT_STORAGE_KEY = 'ai_smart_bazar_attendance_v2';
const SAL_STORAGE_KEY = 'ai_smart_bazar_salary_v2';
const OFF_STORAGE_KEY = 'ai_smart_bazar_offers_v2';

export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMP_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EMP_STORAGE_KEY, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EMPLOYEES;
  }
}

export function saveStoredEmployees(emps: Employee[]): void {
  try {
    localStorage.setItem(EMP_STORAGE_KEY, JSON.stringify(emps));
  } catch (err) {
    console.error('Failed to save employees', err);
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ATT_STORAGE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
      return INITIAL_ATTENDANCE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ATTENDANCE;
  }
}

export function saveStoredAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATT_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save attendance', err);
  }
}

export function getStoredSalarySlips(): SalaryRecord[] {
  try {
    const raw = localStorage.getItem(SAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SAL_STORAGE_KEY, JSON.stringify(INITIAL_SALARY_SLIPS));
      return INITIAL_SALARY_SLIPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SALARY_SLIPS;
  }
}

export function saveStoredSalarySlips(records: SalaryRecord[]): void {
  try {
    localStorage.setItem(SAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save salary slips', err);
  }
}

export function getStoredOfferLetters(): OfferLetterRecord[] {
  try {
    const raw = localStorage.getItem(OFF_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OFF_STORAGE_KEY, JSON.stringify(INITIAL_OFFER_LETTERS));
      return INITIAL_OFFER_LETTERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_OFFER_LETTERS;
  }
}

export function saveStoredOfferLetters(records: OfferLetterRecord[]): void {
  try {
    localStorage.setItem(OFF_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save offer letters', err);
  }
}

export function getMonthDays(monthStr: string): string[] {
  const parts = monthStr.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 11;
  const totalDays = new Date(y, m, 0).getDate();
  return Array.from({ length: totalDays }, (_, i) => {
    const d = String(i + 1).padStart(2, '0');
    return `${monthStr}-${d}`;
  });
}

export function isSunday(dateStr: string): boolean {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 11;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d).getDay() === 0;
}

export const HOLIDAYS_2026: Record<string, string> = {
  '2026-11-01': 'Kannada Rajyotsava',
  '2026-11-18': 'Kanakadasa Jayanti',
  '2026-10-20': 'Vijayadashami',
  '2026-11-10': 'Diwali',
};

export function getStoredSalaries(): SalaryRecord[] {
  return getStoredSalarySlips();
}

export function saveStoredSalaries(records: SalaryRecord[]): void {
  saveStoredSalarySlips(records);
}

export function getStoredOffers(): OfferLetterRecord[] {
  return getStoredOfferLetters();
}

export function saveStoredOffers(records: OfferLetterRecord[]): void {
  saveStoredOfferLetters(records);
}

export function numberToIndianWords(n: number): string {
  n = Math.round(+n || 0);
  if (!n) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(num: number): string {
    if (num < 20) return a[num] || '';
    const digit = num % 10;
    return b[Math.floor(num / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let str = '';
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rem = n % 100;

  if (crore) str += inWords(crore) + ' Crore ';
  if (lakh) str += inWords(lakh) + ' Lakh ';
  if (thousand) str += inWords(thousand) + ' Thousand ';
  if (hundred) str += inWords(hundred) + ' Hundred ';
  if (rem) str += (str ? 'and ' : '') + inWords(rem);
  return str.trim() + ' Rupees Only';
}
