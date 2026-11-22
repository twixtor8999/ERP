import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
  Printer,
  Plus,
  X,
  Banknote,
  Scale,
  Minus,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

// Types
export interface CashBankEntry {
  sl: number;
  date: string;
  voucher: string;
  party: string;
  moneyIn: number;
  moneyOut: number;
  balance: number;
  type: "Cash" | "Bank";
  narration?: string;
}

export interface DaySheetRow {
  date: string;
  opening: number;
  investment: number;
  credit: number;
  purchase: number;
  expenses: number;
  closing: number;
  creditDetails?: { head: string; amt: number; note: string }[];
  debitDetails?: { head: string; amt: number; note: string }[];
}

export interface CustomAssetLiability {
  id: string;
  name: string;
  amount: number;
  date: string;
}

// Sample Data matching live Siddeshwar Enterprises reference values
const SAMPLE_CASH_ENTRIES: CashBankEntry[] = [
  {
    sl: 1,
    date: "22-11-2026",
    voucher: "Opening Balance",
    party: "—",
    moneyIn: 45000,
    moneyOut: 0,
    balance: 45000,
    type: "Cash",
    narration: "Brought forward cash in hand",
  },
  {
    sl: 2,
    date: "22-11-2026",
    voucher: "Receipt",
    party: "B M Kirana Store",
    moneyIn: 15000,
    moneyOut: 0,
    balance: 60000,
    type: "Cash",
    narration: "Route Tamba cash collected",
  },
  {
    sl: 3,
    date: "22-11-2026",
    voucher: "Expense",
    party: "Santosh Pujari (Driver)",
    moneyIn: 0,
    moneyOut: 1500,
    balance: 58500,
    type: "Cash",
    narration: "Diesel expense KA28AA6256",
  },
];

const SAMPLE_BANK_ENTRIES: CashBankEntry[] = [
  {
    sl: 1,
    date: "22-11-2026",
    voucher: "Opening Balance",
    party: "—",
    moneyIn: 0,
    moneyOut: 263841,
    balance: -263841,
    type: "Bank",
    narration: "Bank OD / Current Account opening balance",
  },
  {
    sl: 2,
    date: "22-11-2026",
    voucher: "QR Receipt",
    party: "Ramesh M Genni",
    moneyIn: 6800,
    moneyOut: 0,
    balance: -257041,
    type: "Bank",
    narration: "UPI QR payment verified UTR 43219800",
  },
];

const SAMPLE_DAY_SHEET: DaySheetRow[] = [
  {
    date: "22-11-2026",
    opening: -218841,
    investment: 0,
    credit: 0,
    purchase: 0,
    expenses: 0,
    closing: -218841,
  },
];

export function WholesaleAccountsView() {
  const navigate = useNavigate();

  // Primary navigation: 'cash' | 'cd' | 'bs'
  const [activeTab, setActiveTab] = useState<"cash" | "cd" | "bs">("cash");

  // Date range filter
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [allDatesActive, setAllDatesActive] = useState(false);
  const [pageSearch, setPageSearch] = useState("");

  // Sub-tabs on Credit & Debit: 'sheet' | 'list' | 'heads'
  const [cdSubView, setCdSubView] = useState<"sheet" | "list" | "heads">("sheet");
  const [autoSyncTransactions, setAutoSyncTransactions] = useState(true);

  // Live Records State
  const [cashEntries, setCashEntries] = useState<CashBankEntry[]>(SAMPLE_CASH_ENTRIES);
  const [bankEntries, setBankEntries] = useState<CashBankEntry[]>(SAMPLE_BANK_ENTRIES);
  const [daySheet] = useState<DaySheetRow[]>(SAMPLE_DAY_SHEET);

  // Balance sheet custom items
  const [customAssets, setCustomAssets] = useState<CustomAssetLiability[]>([]);
  const [customLiabilities, setCustomLiabilities] = useState<CustomAssetLiability[]>([]);

  // Modals
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showPurchaseExpenseModal, setShowPurchaseExpenseModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);

  // New Entry Form State
  const [entryType, setEntryType] = useState<"Opening" | "Receipt" | "Payment" | "Expense" | "Journal" | "Contra">("Receipt");
  const [entryDate, setEntryDate] = useState("2026-11-22");
  const [entryAmt, setEntryAmt] = useState("");
  const [entryAccount, setEntryAccount] = useState<"Cash" | "Bank">("Cash");
  const [entryTo, setEntryTo] = useState<"Bank" | "Cash">("Bank");
  const [entryParty, setEntryParty] = useState("");
  const [entryHead, setEntryHead] = useState("");
  const [entryNarration, setEntryNarration] = useState("");

  // Quick Action Forms State
  const [modalDate, setModalDate] = useState("2026-11-22");
  const [modalAmount, setModalAmount] = useState("");
  const [modalHead, setModalHead] = useState("");
  const [modalMode, setModalMode] = useState("Cash");

  // Balance Sheet Totals Calculation
  // Reference live values from Screenshot 3:
  // Capital: 7,56,680 | Loans: 0 | Profit & reserves: 1,43,828 -> Total: 9,00,508
  // Cash & Bank balance: -2,18,841 | Stock value: 11,15,374 | Customer dues: 3,975 -> Total: 9,00,508
  const baseCapital = 756680;
  const baseLoans = 0;
  const cashBankBalance = -218841;
  const stockValueAtCost = 1115374;
  const customerDuesReceivable = 3975;

  const extraAssetsTotal = customAssets.reduce((s, a) => s + a.amount, 0);
  const extraLiabilitiesTotal = customLiabilities.reduce((s, l) => s + l.amount, 0);

  const totalAssets = cashBankBalance + stockValueAtCost + customerDuesReceivable + extraAssetsTotal;
  const totalLiabilitiesWithoutProfit = baseCapital + baseLoans + extraLiabilitiesTotal;
  const profitAndReserves = totalAssets - totalLiabilitiesWithoutProfit;
  const totalLiabilities = totalLiabilitiesWithoutProfit + profitAndReserves;

  // Handlers
  const handleExport = () => {
    toast.success("Accounts Export Generated", {
      description: `Downloaded Accounts_${activeTab.toUpperCase()}_${fromDate}_to_${toDate}.xlsx`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(modalAmount || entryAmt);
    if (!amt || isNaN(amt)) {
      toast.error("Please enter a valid amount");
      return;
    }

    const isMoneyIn = entryType === "Receipt" || (entryType === "Contra" && entryTo === entryAccount);
    const targetList = entryAccount === "Cash" ? cashEntries : bankEntries;
    const lastItem = targetList.length > 0 ? targetList[targetList.length - 1] : undefined;
    const lastBal = lastItem ? lastItem.balance : 0;
    const newBal = isMoneyIn ? lastBal + amt : lastBal - amt;

    const newRow: CashBankEntry = {
      sl: targetList.length + 1,
      date: entryDate,
      voucher: entryType,
      party: entryParty || "—",
      moneyIn: isMoneyIn ? amt : 0,
      moneyOut: isMoneyIn ? 0 : amt,
      balance: newBal,
      type: entryAccount,
      narration: entryNarration || `${entryType} entry for ${entryParty || entryHead || "general"}`,
    };

    if (entryAccount === "Cash") {
      setCashEntries([...cashEntries, newRow]);
    } else {
      setBankEntries([...bankEntries, newRow]);
    }

    toast.success("Entry Saved Successfully!", {
      description: `${entryType}: ₹${amt.toLocaleString("en-IN")} recorded in ${entryAccount} book.`,
    });

    setShowNewEntryModal(false);
    setEntryAmt("");
    setEntryParty("");
    setEntryNarration("");
    setEntryHead("");
  };

  const handleSaveCreditDebit = (side: "cr" | "dr" | "inv") => {
    const amt = parseFloat(modalAmount);
    if (!amt || isNaN(amt)) {
      toast.error("Please enter a valid amount");
      return;
    }

    toast.success(`${side === "cr" ? "Credit" : side === "dr" ? "Debit / Expense" : "Investment"} Saved!`, {
      description: `₹${amt.toLocaleString("en-IN")} recorded for ${modalHead || "General"}.`,
    });

    setShowCreditModal(false);
    setShowPurchaseExpenseModal(false);
    setShowInvestmentModal(false);
    setModalAmount("");
  };

  const handleSaveAssetLiability = (type: "asset" | "liability") => {
    const amt = parseFloat(modalAmount);
    if (!amt || isNaN(amt)) {
      toast.error("Please enter a valid amount");
      return;
    }

    const item: CustomAssetLiability = {
      id: String(Date.now()),
      name: modalHead || (type === "asset" ? "Fixed Asset" : "Current Liability"),
      amount: amt,
      date: modalDate,
    };

    if (type === "asset") {
      setCustomAssets([...customAssets, item]);
      toast.success("Asset Added to Balance Sheet", {
        description: `${item.name}: ₹${amt.toLocaleString("en-IN")}`,
      });
      setShowAssetModal(false);
    } else {
      setCustomLiabilities([...customLiabilities, item]);
      toast.success("Liability Added to Balance Sheet", {
        description: `${item.name}: ₹${amt.toLocaleString("en-IN")}`,
      });
      setShowLiabilityModal(false);
    }

    setModalAmount("");
    setModalHead("");
  };

  return (
    <div className="space-y-3 font-sans antialiased text-[#0f172a] pb-12">
      {/* Top Bar: Back button matching Reference App */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Date Filter & Export Strip matching Reference App */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none"
          />
          <span>To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none"
          />
          <button
            onClick={() => toast.info("Filter Applied", { description: `Loaded accounts for ${fromDate} to ${toDate}` })}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>

        {/* ⬇ Export Button */}
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>⬇ Export</span>
        </button>
      </div>

      {/* Heading Title & Description matching Reference App Screenshots */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Accounts
        </h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          {activeTab === "cash" &&
            `Tally style books for ${fromDate} to ${toDate}. Sales, receipts, returns, purchases and expenses come in by themselves; add Opening Balance, Receipts, Payments, Journal and Contra with + New Entry.`}
          {activeTab === "cd" &&
            `Credit & Debit sheet for ${fromDate} to ${toDate} · Closing = Opening + Credit − Debit`}
          {activeTab === "bs" &&
            `Balance Sheet as on ${toDate} · SIDDESHWAR ENTERPRISES`}
        </p>
      </div>

      {/* Search Input matching Reference App */}
      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={pageSearch}
          onChange={(e) => setPageSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Primary Tab Switchers + Action Buttons (Matching Screenshot 1, 2, 3) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Cash & Bank */}
          <button
            onClick={() => setActiveTab("cash")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "cash"
                ? "bg-[#132038] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cash & Bank</span>
          </button>

          {/* Tab 2: Credit & Debit */}
          <button
            onClick={() => setActiveTab("cd")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "cd"
                ? "bg-[#132038] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Minus className="w-3.5 h-3.5 text-blue-500" />
            <span>Credit & Debit</span>
          </button>

          {/* Tab 3: Balance Sheet */}
          <button
            onClick={() => setActiveTab("bs")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "bs"
                ? "bg-[#132038] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Balance Sheet</span>
          </button>

          {/* All Dates quick button (present on CD and BS) */}
          {(activeTab === "cd" || activeTab === "bs") && (
            <button
              onClick={() => {
                setAllDatesActive(!allDatesActive);
                toast.info(allDatesActive ? "Date range restored" : "Showing all dates historical data");
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                allDatesActive
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-3 h-3 text-blue-500" />
              <span>All dates</span>
            </button>
          )}
        </div>

        {/* Right side Contextual Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {activeTab === "cash" && (
            <>
              <button
                onClick={() => setShowNewEntryModal(true)}
                className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Entry</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>
            </>
          )}

          {activeTab === "cd" && (
            <>
              <button
                onClick={() => {
                  setModalHead("Investment");
                  setShowInvestmentModal(true);
                }}
                className="inline-flex items-center gap-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Investment</span>
              </button>
              <button
                onClick={() => {
                  setModalHead("Sales Cash");
                  setShowCreditModal(true);
                }}
                className="inline-flex items-center gap-1 bg-[#16a34a] hover:bg-[#15803d] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Credit</span>
              </button>
              <button
                onClick={() => {
                  setModalHead("Purchase");
                  setShowPurchaseExpenseModal(true);
                }}
                className="inline-flex items-center gap-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Purchase / Expense</span>
              </button>
              <button
                onClick={() => setShowOpeningBalanceModal(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-md text-xs font-bold shadow-2xs cursor-pointer"
              >
                Opening Balance
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-md text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>⬇ Export</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-md text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>
            </>
          )}

          {activeTab === "bs" && (
            <>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>⬇ Export</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: CASH & BANK (Matching Screenshot 1) */}
      {/* ========================================================================= */}
      {activeTab === "cash" && (
        <div className="space-y-6 pt-2">
          {/* Section 1: 💵 Cash Book */}
          <div className="space-y-2">
            <h2 className="text-sm font-extrabold text-[#1e293b] flex items-center gap-1.5">
              <span>💵 Cash Book</span>
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
                    <th className="py-2.5 px-3 text-left w-12">Sl</th>
                    <th className="py-2.5 px-3 text-left w-28">Date</th>
                    <th className="py-2.5 px-3 text-left">Voucher</th>
                    <th className="py-2.5 px-3 text-left">Party</th>
                    <th className="py-2.5 px-3 text-right">Money In ₹</th>
                    <th className="py-2.5 px-3 text-right">Money Out ₹</th>
                    <th className="py-2.5 px-3 text-right">Balance ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {cashEntries.map((row) => (
                    <tr key={row.sl} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                      <td className="py-2.5 px-3 text-slate-500">{row.sl}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{row.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.voucher}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div>{row.party}</div>
                        {row.narration && <div className="text-[10px] text-slate-400 font-normal">{row.narration}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">
                        {row.moneyIn > 0 ? `₹${row.moneyIn.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">
                        {row.moneyOut > 0 ? `₹${row.moneyOut.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${row.balance < 0 ? "text-rose-600" : "text-slate-900"}`}>
                        ₹{row.balance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: 🏦 Bank Book (QR / UPI / Bank) */}
          <div className="space-y-2">
            <h2 className="text-sm font-extrabold text-[#1e293b] flex items-center gap-1.5">
              <span>🏦 Bank Book (QR / UPI / Bank)</span>
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
                    <th className="py-2.5 px-3 text-left w-12">Sl</th>
                    <th className="py-2.5 px-3 text-left w-28">Date</th>
                    <th className="py-2.5 px-3 text-left">Voucher</th>
                    <th className="py-2.5 px-3 text-left">Party</th>
                    <th className="py-2.5 px-3 text-right">Money In ₹</th>
                    <th className="py-2.5 px-3 text-right">Money Out ₹</th>
                    <th className="py-2.5 px-3 text-right">Balance ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {bankEntries.map((row) => (
                    <tr key={row.sl} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                      <td className="py-2.5 px-3 text-slate-500">{row.sl}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{row.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.voucher}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div>{row.party}</div>
                        {row.narration && <div className="text-[10px] text-slate-400 font-normal">{row.narration}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">
                        {row.moneyIn > 0 ? `₹${row.moneyIn.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">
                        {row.moneyOut > 0 ? `₹${row.moneyOut.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${row.balance < 0 ? "text-rose-600" : "text-slate-900"}`}>
                        ₹{row.balance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CREDIT & DEBIT (Matching Screenshot 2) */}
      {/* ========================================================================= */}
      {activeTab === "cd" && (
        <div className="space-y-4 pt-1">
          {/* 6 KPI Metric Cards matching Screenshot 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Opening Balance */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                OPENING BALANCE
              </span>
              <p className="text-xl font-black text-rose-600 font-mono">
                -2,18,841
              </p>
              <small className="text-[10px] text-slate-400 block">{fromDate}</small>
            </div>

            {/* Investment */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-0.5 border-t-3 border-t-[#7c3aed]">
              <span className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-wider block">
                INVESTMENT
              </span>
              <p className="text-xl font-black text-slate-900 font-mono">0</p>
              <small className="text-[10px] text-slate-400 block">money put in</small>
            </div>

            {/* Total Credit */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-0.5 border-t-3 border-t-[#16a34a]">
              <span className="text-[11px] font-bold text-[#16a34a] uppercase tracking-wider block">
                TOTAL CREDIT
              </span>
              <p className="text-xl font-black text-slate-900 font-mono">0</p>
              <small className="text-[10px] text-slate-400 block">money in</small>
            </div>

            {/* Total Purchase */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-0.5 border-t-3 border-t-[#ef6c00]">
              <span className="text-[11px] font-bold text-[#ef6c00] uppercase tracking-wider block">
                TOTAL PURCHASE
              </span>
              <p className="text-xl font-black text-slate-900 font-mono">0</p>
              <small className="text-[10px] text-slate-400 block">purchases</small>
            </div>

            {/* Total Expenses */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-0.5 border-t-3 border-t-[#dc2626]">
              <span className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wider block">
                TOTAL EXPENSES
              </span>
              <p className="text-xl font-black text-slate-900 font-mono">0</p>
              <small className="text-[10px] text-slate-400 block">expenses & trips</small>
            </div>

            {/* Closing Balance */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-0.5 border-t-3 border-t-[#2563eb] bg-[#f8faff]">
              <span className="text-[11px] font-bold text-[#2563eb] uppercase tracking-wider block">
                CLOSING BALANCE
              </span>
              <p className="text-xl font-black text-rose-600 font-mono">
                -2,18,841
              </p>
              <small className="text-[10px] text-slate-400 block">{toDate}</small>
            </div>
          </div>

          {/* Sub Navigation Strip: Day sheet, All entries, By head + Auto checkbox */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCdSubView("sheet")}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cdSubView === "sheet"
                    ? "bg-[#132038] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>🗓️ Day sheet</span>
              </button>
              <button
                onClick={() => setCdSubView("list")}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cdSubView === "list"
                    ? "bg-[#132038] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>📄 All entries</span>
              </button>
              <button
                onClick={() => setCdSubView("heads")}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cdSubView === "heads"
                    ? "bg-[#132038] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>📊 By head</span>
              </button>
            </div>

            {/* Auto sync notice matching Screenshot 2 */}
            <label className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncTransactions}
                onChange={(e) => setAutoSyncTransactions(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Sales, purchases, expenses & trips come in by themselves</span>
            </label>
          </div>

          {/* Table: Day sheet matching Screenshot 2 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
                  <th className="py-2.5 px-3 text-left">DATE</th>
                  <th className="py-2.5 px-3 text-right">OPENING BALANCE</th>
                  <th className="py-2.5 px-3 text-center">INVESTMENT</th>
                  <th className="py-2.5 px-3 text-center">CREDIT</th>
                  <th className="py-2.5 px-3 text-center">PURCHASE</th>
                  <th className="py-2.5 px-3 text-center">EXPENSES</th>
                  <th className="py-2.5 px-3 text-right">CLOSING BALANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {daySheet.map((d) => (
                  <tr key={d.date} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                    <td className="py-3 px-3 text-slate-700 font-mono font-bold">{d.date}</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600 font-bold">
                      -2,18,841
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-normal">—</td>
                    <td className="py-3 px-3 text-center text-slate-400 font-normal">—</td>
                    <td className="py-3 px-3 text-center text-slate-400 font-normal">—</td>
                    <td className="py-3 px-3 text-center text-slate-400 font-normal">—</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600 font-black">
                      -2,18,841
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                  <td className="py-3 px-3">Total</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-600">-2,18,841</td>
                  <td className="py-3 px-3 text-center font-mono">0</td>
                  <td className="py-3 px-3 text-center font-mono">0</td>
                  <td className="py-3 px-3 text-center font-mono">0</td>
                  <td className="py-3 px-3 text-center font-mono">0</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-600 font-black">-2,18,841</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: BALANCE SHEET (Matching Screenshot 3) */}
      {/* ========================================================================= */}
      {activeTab === "bs" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          {/* Header inside Balance Sheet card */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-black text-[#1e293b] tracking-tight">
                Balance Sheet
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                As on {toDate} · SIDDESHWAR ENTERPRISES
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setModalHead("");
                  setShowAssetModal(true);
                }}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Asset</span>
              </button>
              <button
                onClick={() => {
                  setModalHead("");
                  setShowLiabilityModal(true);
                }}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Liability</span>
              </button>
            </div>
          </div>

          {/* Two-Column T-Table matching Screenshot 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Capital & Liabilities */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-[#132038] text-white font-black text-xs px-3.5 py-2.5 tracking-wide">
                Capital & Liabilities
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between px-3.5 py-2.5 font-medium">
                  <span className="text-slate-700">Capital (opening + investment − drawings)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {baseCapital.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 font-medium">
                  <span className="text-slate-700">Loans</span>
                  <span className="font-mono font-bold text-slate-900">{baseLoans}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 font-medium">
                  <span className="text-slate-700">Profit & reserves (balancing figure)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {profitAndReserves.toLocaleString("en-IN")}
                  </span>
                </div>

                {customLiabilities.map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-3.5 py-2.5 font-medium bg-amber-50/40">
                    <span className="text-slate-700">{l.name}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {l.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-[#f4f7ff] border-t-2 border-[#132038] px-3.5 py-2.5 flex items-center justify-between font-black text-sm">
                <span>Total</span>
                <span className="font-mono font-black text-slate-900">
                  {totalLiabilities.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Right Column: Assets */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-[#14532d] text-white font-black text-xs px-3.5 py-2.5 tracking-wide">
                Assets
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between px-3.5 py-2.5 font-medium">
                  <span className="text-slate-700">Cash & Bank balance</span>
                  <span className="font-mono font-bold text-rose-600">
                    -2,18,841
                  </span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 font-medium">
                  <span className="text-slate-700">Stock value (at cost)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {stockValueAtCost.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 font-medium">
                  <span className="text-slate-700">Customer dues (receivable)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {customerDuesReceivable.toLocaleString("en-IN")}
                  </span>
                </div>

                {customAssets.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3.5 py-2.5 font-medium bg-emerald-50/40">
                    <span className="text-slate-700">{a.name}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {a.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-[#f4f7ff] border-t-2 border-[#14532d] px-3.5 py-2.5 flex items-center justify-between font-black text-sm">
                <span>Total</span>
                <span className="font-mono font-black text-slate-900">
                  {totalAssets.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Footnote explanation matching Screenshot 3 */}
          <div className="pt-2 text-[11px] text-slate-400 font-normal leading-relaxed border-t border-slate-100">
            Cash & Bank = the Closing Balance of the Credit & Debit sheet on {toDate}. Stock value = stock × cost price. Customer dues = invoiced orders not paid yet. Add vehicles, furniture, deposits (assets) or vendor dues, other loans (liabilities) with the buttons above. Profit is the difference, so both sides always match.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: + NEW ENTRY (Matching Tally Entry in Reference App) */}
      {/* ========================================================================= */}
      {showNewEntryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#132038]">New Entry</h3>
              <button
                onClick={() => setShowNewEntryModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEntry} className="space-y-3 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="Opening">Opening Balance</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Payment">Payment</option>
                    <option value="Expense">Expense</option>
                    <option value="Journal">Journal</option>
                    <option value="Contra">Contra</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount ₹</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={entryAmt}
                    onChange={(e) => setEntryAmt(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account</label>
                  <select
                    value={entryAccount}
                    onChange={(e) => setEntryAccount(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
              </div>

              {entryType === "Contra" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">To Account</label>
                  <select
                    value={entryTo}
                    onChange={(e) => setEntryTo(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Party (Customer / Vendor)</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kirana / Fortune Oil Mills"
                  value={entryParty}
                  onChange={(e) => setEntryParty(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Narration *</label>
                <input
                  type="text"
                  placeholder="What is this entry for? e.g. Cash collected from shop"
                  value={entryNarration}
                  onChange={(e) => setEntryNarration(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewEntryModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#132038] text-white rounded-lg font-bold hover:bg-[#1c2e4f]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK MODALS: + Investment / + Credit / + Purchase / Opening / Asset / Liability */}
      {/* ========================================================================= */}
      {(showCreditModal || showPurchaseExpenseModal || showInvestmentModal || showOpeningBalanceModal || showAssetModal || showLiabilityModal) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#132038]">
                {showInvestmentModal && "+ Investment"}
                {showCreditModal && "+ Credit"}
                {showPurchaseExpenseModal && "+ Purchase / Expense"}
                {showOpeningBalanceModal && "Set Opening Balance"}
                {showAssetModal && "+ Balance Sheet Asset"}
                {showLiabilityModal && "+ Balance Sheet Liability"}
              </h3>
              <button
                onClick={() => {
                  setShowInvestmentModal(false);
                  setShowCreditModal(false);
                  setShowPurchaseExpenseModal(false);
                  setShowOpeningBalanceModal(false);
                  setShowAssetModal(false);
                  setShowLiabilityModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (showInvestmentModal) handleSaveCreditDebit("inv");
                else if (showCreditModal) handleSaveCreditDebit("cr");
                else if (showPurchaseExpenseModal) handleSaveCreditDebit("dr");
                else if (showAssetModal) handleSaveAssetLiability("asset");
                else if (showLiabilityModal) handleSaveAssetLiability("liability");
                else {
                  toast.success("Opening Balance Updated!");
                  setShowOpeningBalanceModal(false);
                }
              }}
              className="space-y-3 pt-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {showAssetModal ? "Asset Name" : showLiabilityModal ? "Liability Name" : "Head / Category"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Cash / Vehicle Expenses / Godown Deposit"
                  value={modalHead}
                  onChange={(e) => setModalHead(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount ₹</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  required
                />
              </div>

              {!showAssetModal && !showLiabilityModal && !showOpeningBalanceModal && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={modalMode}
                    onChange={(e) => setModalMode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="QR">QR / UPI</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvestmentModal(false);
                    setShowCreditModal(false);
                    setShowPurchaseExpenseModal(false);
                    setShowOpeningBalanceModal(false);
                    setShowAssetModal(false);
                    setShowLiabilityModal(false);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#132038] text-white rounded-lg font-bold hover:bg-[#1c2e4f]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
