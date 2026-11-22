// Mock and persistent data store for Employees module
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
    id: 1,
    code: 'EMP-0001',
    name: 'Vijaykumar Shantagiri',
    des: 'Owner',
    ph: '9739396236',
    alt: '9845012345',
    jd: '2023-01-01',
    sal: 50000,
    bank: 'State Bank of India',
    acn: 'Vijaykumar Shantagiri',
    acno: '38291029381',
    ifsc: 'SBIN0001234',
    role: 'Owner',
    docs: { ph: true, adh: true, pan: true, pb: true },
    added: '2023-01-01',
  },
  {
    id: 2,
    code: 'EMP-0002',
    name: 'Prashant Kalamadi',
    des: 'Admin',
    ph: '8971098968',
    alt: '9880123456',
    jd: '2024-01-01',
    sal: 30000,
    bank: 'HDFC Bank',
    acn: 'Prashant Kalamadi',
    acno: '5010023491823',
    ifsc: 'HDFC0000214',
    role: 'Admin',
    docs: { ph: true, adh: true, pan: true, pb: true },
    added: '2024-01-01',
  },
  {
    id: 3,
    code: 'EMP-0003',
    name: 'Pushpa Patil',
    des: 'Telecaller / CRM',
    ph: '8105315881',
    alt: '9448123456',
    jd: '2024-02-15',
    sal: 18000,
    bank: 'Canara Bank',
    acn: 'Pushpa Patil',
    acno: '110024918291',
    ifsc: 'CNRB0001102',
    role: 'CRM',
    docs: { ph: true, adh: true, pan: true, pb: true },
    added: '2024-02-15',
  },
  {
    id: 4,
    code: 'EMP-0004',
    name: 'Dhruthi A S',
    des: 'Billing Executive',
    ph: '8105622401',
    alt: '9900123456',
    jd: '2024-03-01',
    sal: 16000,
    bank: 'Karnataka Bank',
    acn: 'Dhruthi A S',
    acno: '492019283719',
    ifsc: 'KARB0000492',
    role: 'Billing',
    docs: { ph: true, adh: true, pan: true, pb: true },
    added: '2024-03-01',
  },
  {
    id: 5,
    code: 'EMP-0005',
    name: 'Akshata',
    des: 'Packing Assistant',
    ph: '8971091287',
    alt: '9844012345',
    jd: '2024-04-10',
    sal: 15000,
    bank: 'Union Bank of India',
    acn: 'Akshata',
    acno: '789102938471',
    ifsc: 'UBIN0547891',
    role: 'Packer',
    docs: { ph: false, adh: false, pan: false, pb: false },
    added: '2024-04-10',
  },
  {
    id: 6,
    code: 'EMP-0006',
    name: 'Anand',
    des: 'Delivery Driver',
    ph: '9902345102',
    alt: '9741012345',
    jd: '2024-05-01',
    sal: 16500,
    bank: 'State Bank of India',
    acn: 'Anand',
    acno: '201928374619',
    ifsc: 'SBIN0000981',
    role: 'Driver',
    docs: { ph: false, adh: false, pan: false, pb: false },
    added: '2024-05-01',
  },
];

// Helper to generate calendar days for a given month YYYY-MM
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

// Check if a date is a Sunday
export function isSunday(dateStr: string): boolean {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 11;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d).getDay() === 0;
}

// Holidays map (e.g. November 2026)
export const HOLIDAYS_2026: Record<string, string> = {
  '2026-11-01': 'Kannada Rajyotsava',
  '2026-11-18': 'Kanakadasa Jayanti',
  '2026-10-20': 'Vijayadashami',
  '2026-11-10': 'Diwali',
};

// Generate realistic mock attendance records for November 2026
function generateMockAttendance(): AttendanceRecord[] {
  const list: AttendanceRecord[] = [];
  const days = getMonthDays('2026-11');
  let idCounter = 1;

  INITIAL_EMPLOYEES.forEach((emp) => {
    days.forEach((dayStr, idx) => {
      const dayNum = idx + 1;
      // Skip future dates (e.g. assuming today is Nov 22, 2026)
      if (dayNum > 22) return;

      const sunday = isSunday(dayStr);
      const isHoliday = !!HOLIDAYS_2026[dayStr];

      if (sunday || isHoliday) {
        // Week off or Holiday
        return;
      }

      // Check-in patterns
      let inT = '09:30';
      let outT = '18:30';
      let ov: string | undefined = undefined;
      let ovWas: string | undefined = undefined;

      if (emp.id === 2 && dayNum === 14) {
        // Half day
        outT = '13:30';
      } else if (emp.id === 3 && dayNum === 9) {
        // Absent
        return;
      } else if (emp.id === 5 && dayNum === 12) {
        // Marked Absent, then overridden to Present by Owner
        ov = 'P';
        ovWas = 'A';
      }

      // Today (Nov 22) - Sunday (Week off)
      if (dayNum === 22) {
        return;
      }

      list.push({
        id: idCounter++,
        emp: emp.id,
        date: dayStr,
        inT,
        outT,
        ov,
        ovWas,
        ovBy: ov ? 'Vijaykumar Shantagiri' : undefined,
        ovDate: ov ? '2026-11-12' : undefined,
        ovWhy: ov ? 'Permission for delivery clearance' : undefined,
      });
    });
  });

  return list;
}

export const INITIAL_SALARIES: SalaryRecord[] = [
  {
    id: 1,
    emp: 2, // Prashant Kalamadi
    mon: '2026-11',
    st: 'approved',
    days: 28,
    amt: 28000,
    pm: 'Bank Transfer',
    acct: 'HDFC Bank · A/C 5010023491823 · IFSC HDFC0000214',
    by: 'Vijaykumar Shantagiri',
    date: '2026-11-22',
    why: '',
    note: 'Performance bonus included',
  },
  {
    id: 2,
    emp: 1, // Vijaykumar Shantagiri
    mon: '2026-11',
    st: 'approved',
    days: 28,
    amt: 46667,
    pm: 'Bank Transfer',
    acct: 'State Bank of India · A/C 38291029381 · IFSC SBIN0001234',
    by: 'Vijaykumar Shantagiri',
    date: '2026-11-22',
    why: '',
    note: 'Director remuneration',
  },
  {
    id: 3,
    emp: 3, // Pushpa Patil
    mon: '2026-11',
    st: 'wait',
    by: 'Vijaykumar Shantagiri',
    date: '2026-11-22',
    why: 'CRM incentive reconciliation pending',
  },
];

export const INITIAL_OFFERS: OfferLetterRecord[] = [
  {
    id: 1,
    ref: 'SE/OL/2024/001',
    type: 'offer',
    emp: 3,
    name: 'Pushpa Patil',
    ph: '8105315881',
    addr: 'Plot No. 12, Adarsh Nagar, Ashram Road, Vijayapura - 586103',
    des: 'Telecaller / CRM Executive',
    jd: '2024-02-15',
    sal: 18000,
    date: '2024-02-01',
    prob: 3,
    notice: 15,
    hrs: '9:30 AM – 7:30 PM',
    off: 'Sunday',
    rep: 'Owner / Admin',
    place: 'Vijayapura',
    sign: 'Vijaykumar Shantagiri',
    acc: '2024-02-10',
    terms: 'Responsible for B2B retailer sales calls, orders booking, and route coordination.',
    at: '2024-02-01T10:00:00Z',
  },
  {
    id: 2,
    ref: 'SE/OL/2024/002',
    type: 'offer',
    emp: 2,
    name: 'Prashant Kalamadi',
    ph: '8971098968',
    addr: 'Ward 4, Near APMC Market, Vijayapura - 586101',
    des: 'Admin & Operations Manager',
    jd: '2024-01-01',
    sal: 30000,
    date: '2023-12-20',
    prob: 3,
    notice: 30,
    hrs: '9:30 AM – 7:30 PM',
    off: 'Sunday',
    rep: 'Owner',
    place: 'Vijayapura',
    sign: 'Vijaykumar Shantagiri',
    acc: '2023-12-28',
    terms: 'Full responsibility of store operations, purchase entries, and staff supervision.',
    at: '2023-12-20T11:00:00Z',
  },
  {
    id: 3,
    ref: 'SE/OL/2024/003',
    type: 'offer',
    emp: 4,
    name: 'Dhruthi A S',
    ph: '8105622401',
    addr: 'Jal Nagar, Behind Court Complex, Vijayapura - 586101',
    des: 'Billing Executive',
    jd: '2024-03-01',
    sal: 16000,
    date: '2024-02-25',
    prob: 3,
    notice: 15,
    hrs: '9:30 AM – 7:30 PM',
    off: 'Sunday',
    rep: 'Admin',
    place: 'Vijayapura',
    sign: 'Vijaykumar Shantagiri',
    acc: '2024-02-28',
    terms: 'Managing daily GST billing, POS counter operations, and cash reconciliation.',
    at: '2024-02-25T14:30:00Z',
  },
];

// LocalStorage Persistence Helpers
const EMP_KEY = 'erp_employees_list_v1';
const ATT_KEY = 'erp_employees_attendance_v1';
const SAL_KEY = 'erp_employees_salaries_v1';
const OFF_KEY = 'erp_employees_offers_v1';

export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMP_KEY);
    if (!raw) {
      localStorage.setItem(EMP_KEY, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EMPLOYEES;
  }
}

export function saveStoredEmployees(list: Employee[]) {
  try {
    localStorage.setItem(EMP_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving employees:', e);
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATT_KEY);
    if (!raw) {
      const initial = generateMockAttendance();
      localStorage.setItem(ATT_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return generateMockAttendance();
  }
}

export function saveStoredAttendance(list: AttendanceRecord[]) {
  try {
    localStorage.setItem(ATT_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving attendance:', e);
  }
}

export function getStoredSalaries(): SalaryRecord[] {
  try {
    const raw = localStorage.getItem(SAL_KEY);
    if (!raw) {
      localStorage.setItem(SAL_KEY, JSON.stringify(INITIAL_SALARIES));
      return INITIAL_SALARIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SALARIES;
  }
}

export function saveStoredSalaries(list: SalaryRecord[]) {
  try {
    localStorage.setItem(SAL_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving salaries:', e);
  }
}

export function getStoredOffers(): OfferLetterRecord[] {
  try {
    const raw = localStorage.getItem(OFF_KEY);
    if (!raw) {
      localStorage.setItem(OFF_KEY, JSON.stringify(INITIAL_OFFERS));
      return INITIAL_OFFERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_OFFERS;
  }
}

export function saveStoredOffers(list: OfferLetterRecord[]) {
  try {
    localStorage.setItem(OFF_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving offers:', e);
  }
}

// Convert number to Indian currency words
export function numberToIndianWords(n: number): string {
  n = Math.round(+n || 0);
  if (!n) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const two = (x: number) => (x < 20 ? (a[x] ?? '') : (b[Math.floor(x / 10)] ?? '') + (x % 10 ? ' ' + (a[x % 10] ?? '') : ''));
  const three = (x: number) =>
    (x >= 100 ? (a[Math.floor(x / 100)] ?? '') + ' Hundred' + (x % 100 ? ' ' : '') : '') +
    (x % 100 ? two(x % 100) : '');

  const p: string[] = [];
  const cr = Math.floor(n / 1e7);
  n %= 1e7;
  const la = Math.floor(n / 1e5);
  n %= 1e5;
  const th = Math.floor(n / 1e3);
  n %= 1e3;

  if (cr) p.push(numberToIndianWords(cr) + ' Crore');
  if (la) p.push(two(la) + ' Lakh');
  if (th) p.push(two(th) + ' Thousand');
  if (n) p.push(three(n));
  return p.join(' ');
}
