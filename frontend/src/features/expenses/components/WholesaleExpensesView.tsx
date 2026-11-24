import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredExpenses,
  saveStoredExpenses,
  type ExpenseRecord,
} from "../data/mockExpenses";

export function WholesaleExpensesView() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-11-24");
  const [toDate, setToDate] = useState("2026-11-24");
  const [searchQuery, setSearchQuery] = useState("");

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => getStoredExpenses());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewExpense, setViewExpense] = useState<ExpenseRecord | null>(null);

  // Form State matching client Cash Ledger form
  const [cat, setCat] = useState("Office Expenses");
  const [sub, setSub] = useState("Rent");
  const [amt, setAmt] = useState("");
  const [paymentType, setPaymentType] = useState<"Cash" | "Credit">("Cash");
  const [spentDate, setSpentDate] = useState("2026-11-24");
  const [vehicleNo, setVehicleNo] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [phone, setPhone] = useState("");
  const [billNo, setBillNo] = useState("");
  const [remarks, setRemarks] = useState("");

  const vehicles = ["KA28AA6256", "KA28AC0349", "KA28B1092"];

  // Client EXC444 Categories
  const CATEGORIES: Record<string, string[]> = {
    "Office Expenses": [
      "Rent",
      "Electricity",
      "Water",
      "Internet / Phone",
      "Stationery & Printing",
      "Tea & Snacks",
      "Cleaning",
      "Repairs & Maintenance",
    ],
    Transportation: [
      "Vehicle Rent",
      "Diesel / Fuel",
      "Toll",
      "Parking",
      "Driver Bata",
      "Vehicle Repair",
      "Auto / Taxi",
    ],
    "Loading & Unloading": [
      "Sales loading",
      "Purchase Unloading",
      "Inter DC loading",
      "Inter DC Unloading",
      "Hamali / Coolie",
    ],
    Warehouse: [
      "Sales loading",
      "Inter DC loading",
      "Food expenses",
      "Inter DC Unloading",
      "Purchase Unloading",
      "Market purchase",
      "Security",
      "Maintenance",
    ],
    HR: [
      "Salary Advance",
      "Staff Welfare",
      "Food expenses",
      "Recruitment",
      "Incentive / Bonus",
    ],
    Purchase: ["Market purchase", "Local purchase", "Packing Material", "Consumables"],
    "Other Expenses": [
      "Miscellaneous",
      "Bank Charges",
      "Government Fees",
      "Donation",
      "Gifts",
    ],
  };

  // Filtered expenses based on date & search
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          e.cat.toLowerCase().includes(q) ||
          (e.sub && e.sub.toLowerCase().includes(q)) ||
          (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
          (e.remarks && e.remarks.toLowerCase().includes(q)) ||
          e.paymentType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [expenses, fromDate, toDate, searchQuery]);

  // Calculations matching client expSum3() in Screenshot 1
  const cashExpensesToday = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.paymentType === "Cash")
      .reduce((sum, e) => sum + e.amt, 0);
  }, [filteredExpenses]);

  const creditExpensesToday = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.paymentType === "Credit")
      .reduce((sum, e) => sum + e.amt, 0);
  }, [filteredExpenses]);

  // Exact client opening balance figures from reference screenshot 1
  const openingCash = 19930;
  const openingCredit = 53810;
  const totalOpening = openingCash + openingCredit;
  const totalToday = cashExpensesToday + creditExpensesToday;

  const totalCashExp = openingCash + cashExpensesToday;
  const totalCreditExp = openingCredit + creditExpensesToday;
  const grandTotalExp = totalOpening + totalToday;

  const closingCash = openingCash;
  const closingCredit = openingCredit;
  const grandClosing = totalOpening;

  const handleApprove = (id: number) => {
    const updated = expenses.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          ap: {
            by: "Vijaykumar Shantagiri (Admin)",
            date: new Date().toISOString().split("T")[0] || "2026-11-24",
            at: new Date().toISOString(),
          },
        };
      }
      return e;
    });
    setExpenses(updated);
    saveStoredExpenses(updated);
    toast.success("Expense approved successfully!");
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amt);
    if (!amountVal || amountVal <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    const newExpense: ExpenseRecord = {
      id: Date.now(),
      date: spentDate,
      cat,
      sub: sub.trim() || undefined,
      amt: amountVal,
      paymentType,
      paidTo: paidTo.trim() || undefined,
      veh: vehicleNo && vehicleNo !== "None" ? vehicleNo : undefined,
      billNo: billNo.trim() || undefined,
      remarks: remarks.trim() || undefined,
      ap: {
        by: "Vijaykumar Shantagiri (Admin)",
        date: spentDate,
        at: new Date().toISOString(),
      },
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    saveStoredExpenses(updated);

    toast.success(`Expense ₹${amountVal.toLocaleString()} logged and approved!`);

    // Reset Form
    setSub(CATEGORIES[cat]?.[0] || "");
    setAmt("");
    setPaidTo("");
    setAccountNo("");
    setBankName("");
    setIfsc("");
    setPhone("");
    setBillNo("");
    setRemarks("");
    setIsAddModalOpen(false);
  };

  const handleExport = () => {
    toast.success(`Exporting Expenses (${fromDate} to ${toDate}) to Excel...`);
  };

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Expenses loaded for ${fromDate} to ${toDate}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Top Bar with Back Button & Date Filter & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <form onSubmit={handleSubmitDate} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-600 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-600 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors shadow-sm"
            >
              Submit
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Page Title & Subtitle matching Screenshot 1 */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0d1b4c]">
          Expenses
        </h1>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Total Exp&apos;s = Opening Balance + Today&apos;s Exp&apos;s. Closing Balance = Total Exp&apos;s − approved expenses. Today&apos;s closing balance is tomorrow&apos;s opening balance.
        </p>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {/* Top Balance Summary Table matching Screenshot 1 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-[#2563eb] text-white">
                <th className="py-2.5 px-4 font-bold">Type</th>
                <th className="py-2.5 px-4 font-bold text-right">Opening Balance</th>
                <th className="py-2.5 px-4 font-bold text-right">Today&apos;s Exp&apos;s</th>
                <th className="py-2.5 px-4 font-bold text-right">Total Exp&apos;s</th>
                <th className="py-2.5 px-4 font-bold text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              <tr className="hover:bg-gray-50/80">
                <td className="py-2.5 px-4 flex items-center gap-2 font-bold text-gray-900">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Cash
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-gray-800 font-mono">
                  {openingCash.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-gray-800 font-mono">
                  {cashExpensesToday.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-gray-800 font-mono">
                  {totalCashExp.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900 font-mono">
                  {closingCash.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="hover:bg-gray-50/80">
                <td className="py-2.5 px-4 flex items-center gap-2 font-bold text-gray-900">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Credit
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-gray-800 font-mono">
                  {openingCredit.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-gray-800 font-mono">
                  {creditExpensesToday.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-gray-800 font-mono">
                  {totalCreditExp.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900 font-mono">
                  {closingCredit.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="bg-gray-50 font-bold border-t border-gray-200">
                <td className="py-2.5 px-4 text-gray-900 font-extrabold">Total</td>
                <td className="py-2.5 px-4 text-right font-extrabold text-gray-900 font-mono">
                  {totalOpening.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-extrabold text-gray-900 font-mono">
                  {totalToday.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-extrabold text-gray-900 font-mono">
                  {grandTotalExp.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-right font-extrabold text-gray-900 font-mono">
                  {grandClosing.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Button: + Add expense matching Screenshot 1 */}
      <div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add expense
        </button>
      </div>

      {/* Sub-section Title matching Screenshot 1 */}
      <div className="flex items-center gap-2 pt-1 border-l-4 border-[#2563eb] pl-2.5">
        <h2 className="text-base font-bold text-gray-900">Expenses</h2>
      </div>

      {/* Expenses Table matching Screenshot 1 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-[#2563eb] text-white font-bold">
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5 min-w-[200px]">Category / Type</th>
                <th className="py-2.5 px-3.5 text-right">Amount</th>
                <th className="py-2.5 px-3.5 text-center">Approve</th>
                <th className="py-2.5 px-3.5 text-center">Payment</th>
                <th className="py-2.5 px-3.5 min-w-[160px]">Paid to</th>
                <th className="py-2.5 px-3.5 min-w-[200px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredExpenses.length === 0 ? (
                /* Matches Screenshot 1 zero row */
                <tr className="hover:bg-gray-50/50 text-gray-500 font-mono text-center">
                  <td className="py-3 px-3.5">0</td>
                  <td className="py-3 px-3.5">0</td>
                  <td className="py-3 px-3.5 text-right">0</td>
                  <td className="py-3 px-3.5 text-center">0</td>
                  <td className="py-3 px-3.5 text-center">0</td>
                  <td className="py-3 px-3.5">0</td>
                  <td className="py-3 px-3.5">0</td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setViewExpense(e)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3.5 text-gray-700 font-medium whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-gray-900">
                      {e.cat}
                      {e.sub && <span className="text-xs font-normal text-gray-500 block"> · {e.sub}</span>}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-gray-900 font-mono">
                      ₹{e.amt.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3.5 text-center" onClick={(evt) => evt.stopPropagation()}>
                      {e.ap ? (
                        <div>
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                            Approved
                          </span>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {e.ap.by.split(" ")[0]} · {e.ap.date}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApprove(e.id)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] rounded transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                        {e.paymentType}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-gray-800 font-medium">
                      {e.paidTo || "—"}
                    </td>
                    <td className="py-3 px-3.5 text-gray-600 text-xs">
                      {e.remarks || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal matching VW.expf */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#0d1b4c] text-white">
              <h3 className="font-bold text-base">Cash Ledger · Add Expense</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={cat}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCat(newCat);
                      setSub(CATEGORIES[newCat]?.[0] || "");
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    {Object.keys(CATEGORIES).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    {cat} Type *
                  </label>
                  <select
                    value={sub}
                    onChange={(e) => setSub(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    {(CATEGORIES[cat] || []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Payment Type *
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="Cash">Cash Payment</option>
                    <option value="Credit">Credit Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={amt}
                    onChange={(e) => setAmt(e.target.value)}
                    placeholder="₹ 0.00"
                    className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Cash Spent On *
                  </label>
                  <input
                    type="date"
                    required
                    value={spentDate}
                    onChange={(e) => setSpentDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              {(cat === "Transportation" || cat === "Logistics") && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Vehicle
                  </label>
                  <select
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="None">None</option>
                    {vehicles.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 space-y-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Paid To Details</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Account Holder / Person Name
                    </label>
                    <input
                      type="text"
                      value={paidTo}
                      onChange={(e) => setPaidTo(e.target.value)}
                      placeholder="e.g. Om Sai Tea Stall / Basappa"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Contact Number (optional)
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. SBI, HDFC"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="optional"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-3 py-1.5 text-sm uppercase font-mono border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Bill / Receipt No (Optional)
                  </label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="e.g. PET-9912"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Remarks / Note
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="What was this expense for?"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-lg shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {viewExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#0d1b4c] text-white">
              <h3 className="font-bold text-base">Expense Details</h3>
              <button
                type="button"
                onClick={() => setViewExpense(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs md:text-sm">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500 text-xs">Amount:</span>
                  <div className="text-lg font-bold text-gray-900">₹{viewExpense.amt.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Payment:</span>
                  <div className="font-semibold text-blue-700">{viewExpense.paymentType}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-gray-500 text-xs">Category:</span>
                  <div className="font-bold text-gray-800">{viewExpense.cat}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Date:</span>
                  <div className="font-semibold text-gray-800">{viewExpense.date}</div>
                </div>
              </div>

              {viewExpense.sub && (
                <div>
                  <span className="text-gray-500 text-xs">Type / Description:</span>
                  <div className="font-medium text-gray-800">{viewExpense.sub}</div>
                </div>
              )}

              {viewExpense.paidTo && (
                <div>
                  <span className="text-gray-500 text-xs">Paid To:</span>
                  <div className="font-medium text-gray-800">{viewExpense.paidTo}</div>
                </div>
              )}

              {viewExpense.veh && (
                <div>
                  <span className="text-gray-500 text-xs">Vehicle:</span>
                  <div className="font-semibold text-blue-800">{viewExpense.veh}</div>
                </div>
              )}

              {viewExpense.billNo && (
                <div>
                  <span className="text-gray-500 text-xs">Bill / Receipt No:</span>
                  <div className="font-mono text-gray-800">{viewExpense.billNo}</div>
                </div>
              )}

              {viewExpense.remarks && (
                <div>
                  <span className="text-gray-500 text-xs">Remarks:</span>
                  <div className="text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-200 text-xs">
                    {viewExpense.remarks}
                  </div>
                </div>
              )}

              <div>
                <span className="text-gray-500 text-xs">Approval Status:</span>
                <div className="pt-0.5">
                  {viewExpense.ap ? (
                    <span className="text-emerald-700 font-bold">
                      Approved by {viewExpense.ap.by} on {viewExpense.ap.date}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">Pending Approval</span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewExpense(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
