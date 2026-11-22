import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Calendar } from "lucide-react";

interface CrmStaffMember {
  id: string;
  name: string;
  initials: string;
  themeColor: string;
  orders: number;
  salesK: string;
  coveredVillages: number;
  callings: number;
  salesReturnK: string;
  salesReturnOrders: number;
  salesReturnDate: string;
  obSalesK: string;
  targetK: string;
  targetPercent: number;
}

const DEFAULT_STAFF: CrmStaffMember[] = [
  {
    id: "1",
    name: "Pushpa Patil",
    initials: "PP",
    themeColor: "#2563eb", // Royal blue
    orders: 3,
    salesK: "₹17.1k",
    coveredVillages: 2,
    callings: 0,
    salesReturnK: "₹11.0k",
    salesReturnOrders: 6,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "2",
    name: "Dhruthi A S",
    initials: "DA",
    themeColor: "#db2777", // Pink
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹21.7k",
    salesReturnOrders: 10,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "3",
    name: "Mahalaxmi Hiremath",
    initials: "MH",
    themeColor: "#ea580c", // Orange
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹0",
    salesReturnOrders: 0,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "4",
    name: "Vijaykumar Shantagiri",
    initials: "VS",
    themeColor: "#059669", // Emerald green
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹0",
    salesReturnOrders: 0,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "5",
    name: "Prashant Kalamadi",
    initials: "PK",
    themeColor: "#7c3aed", // Purple
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹0",
    salesReturnOrders: 0,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "6",
    name: "Arun Patil",
    initials: "AP",
    themeColor: "#0891b2", // Cyan
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹0",
    salesReturnOrders: 0,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
];

export function BusinessDashboardView() {
  const navigate = useNavigate();
  const todayStr = "22-11-2026";
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [currentTime] = useState("07:27 pm");

  const [staffList] = useState<CrmStaffMember[]>(DEFAULT_STAFF);

  // Top 5 Villages Data
  const topVillages = [
    { rank: 1, name: "Rugi", orders: 1, sales: "₹10.4k" },
    { rank: 2, name: "Devara Hippargi", orders: 2, sales: "₹6.7k" },
  ];

  // Top 5 Customers Data
  const topCustomers = [
    { rank: 1, name: "Ramesh M Genni · Rugi", orders: 1, sales: "₹10.4k" },
    { rank: 2, name: "Ashok Hadagali · Devara Hippargi", orders: 1, sales: "₹6.2k" },
    { rank: 3, name: "Shankargouda Biradar · Devara Hippargi", orders: 1, sales: "₹410" },
  ];

  // Top 5 Routes Data
  const topRoutes = [
    { rank: 1, name: "Tamba", orders: 1, sales: "₹10.4k" },
    { rank: 2, name: "DEVARHIPARAGI", orders: 2, sales: "₹6.7k" },
  ];

  return (
    <div className="space-y-4 max-w-full font-sans antialiased">
      {/* Top Action Bar: Back button & Date Range Selector matching Screenshot 1 */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-600">
            <span className="font-medium text-slate-500">From</span>
            <input
              type="text"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-24 text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-600 border-l border-slate-200">
            <span className="font-medium text-slate-500">To</span>
            <input
              type="text"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-24 text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button
            onClick={() => {}}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-4 py-1 rounded-md text-xs font-bold transition-colors shadow-2xs"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Main Business Dashboard Card Container matching .nxcb */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Header: Title, Subtitle & Live Time Pill matching .nxd-hd */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
              Business Dashboard
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Today</p>
          </div>

          <div className="bg-[#0f172a] text-white px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide shadow-2xs">
            {currentTime}
          </div>
        </div>

        {/* 1. Horizontal Scrolling CRM Staff Performance Deck matching .nxd-crm */}
        <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className="w-[270px] min-w-[270px] bg-white rounded-2xl border border-slate-200/85 p-3.5 shadow-sm space-y-3 shrink-0 transition-transform hover:-translate-y-0.5"
              style={{ borderTop: `4px solid ${staff.themeColor}` }}
            >
              {/* Staff Header with Initials Badge & View link */}
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => navigate(`/crm?staff=${staff.id}`)}
                >
                  <div
                    className="w-9 h-9 rounded-xl text-white font-extrabold text-sm flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: staff.themeColor }}
                  >
                    {staff.initials}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-[13px] text-slate-900 leading-tight">
                      {staff.name}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      CRM
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/crm?staff=${staff.id}`)}
                  className="text-xs font-extrabold text-[#e11d48] hover:underline"
                >
                  View ›
                </button>
              </div>

              {/* 2x2 Performance Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className="bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 cursor-pointer transition-colors"
                  onClick={() => navigate(`/orders?staff=${staff.id}`)}
                >
                  <span className="block text-[11px] font-semibold text-slate-500">
                    No of Orders
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-base">{staff.orders}</span>
                    <span className="text-slate-400 font-bold text-xs">›</span>
                  </div>
                </div>

                <div
                  className="bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 cursor-pointer transition-colors"
                  onClick={() => navigate(`/reports?staff=${staff.id}`)}
                >
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Total Sales
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-base">{staff.salesK}</span>
                    <span className="text-slate-400 font-bold text-xs">›</span>
                  </div>
                </div>

                <div
                  className="bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 cursor-pointer transition-colors"
                  onClick={() => navigate(`/crm?view=villages&staff=${staff.id}`)}
                >
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Covered Villages
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-base">
                      {staff.coveredVillages}
                    </span>
                    <span className="text-slate-400 font-bold text-xs">›</span>
                  </div>
                </div>

                <div
                  className="bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 cursor-pointer transition-colors"
                  onClick={() => navigate(`/crm?view=callings&staff=${staff.id}`)}
                >
                  <span className="block text-[11px] font-semibold text-slate-500">
                    No of Callings
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-base">{staff.callings}</span>
                    <span className="text-slate-400 font-bold text-xs">›</span>
                  </div>
                </div>
              </div>

              {/* Sales Return Peach Box */}
              <div
                className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-2.5 cursor-pointer hover:bg-orange-100/60 transition-colors"
                onClick={() => navigate(`/settlements`)}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-orange-900">Sales Return</span>
                  <span className="text-[11px] font-extrabold text-[#ea580c] hover:underline">
                    View ›
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-black text-sm text-slate-900">
                    {staff.salesReturnK}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {staff.salesReturnOrders} order(s)
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                  {staff.salesReturnDate}
                </div>
              </div>

              {/* OB Sales Soft Blue Box */}
              <div
                className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-2 cursor-pointer hover:bg-blue-100/60 transition-colors"
                onClick={() => navigate(`/orders?type=ob`)}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-blue-900">OB Sales</span>
                  <span className="text-blue-500 font-bold text-xs">›</span>
                </div>
                <div className="font-black text-sm text-slate-900 mt-0.5">{staff.obSalesK}</div>
              </div>

              {/* Target Progress Bar */}
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-slate-600">{staff.targetK}</span>
                  <span className="text-emerald-600">{staff.targetPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, staff.targetPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Middle Row: 5 Operational KPI Stat Cards matching Screenshot 1 & 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* Card 1: Route Wise Sales */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => navigate("/crm?view=routes")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">🗺️</span>
                <span>Route Wise Sales</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">₹17,077</div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              2 routes · Top: Tamba
            </div>
          </div>

          {/* Card 2: Collections */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => navigate("/settlements")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">💼</span>
                <span>Collections</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">₹0</div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              Cash ₹0 · QR ₹0
            </div>
          </div>

          {/* Card 3: Avg order value */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => navigate("/orders")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">📈</span>
                <span>Avg order value</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">₹5,692</div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              3 customers
            </div>
          </div>

          {/* Card 4: Sales returns */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => navigate("/settlements")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">📦</span>
                <span>Sales returns</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">₹0</div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              0.0% of sales
            </div>
          </div>

          {/* Card 5: Village Wise Sales */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors col-span-2 sm:col-span-1"
            onClick={() => navigate("/crm?view=villages")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">🏘️</span>
                <span>Village Wise Sales</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">₹17.1k</div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              2 village(s)
            </div>
          </div>
        </div>

        {/* 3. Bottom Section: 3 Analytical Top 5 Tables matching Screenshot 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Table 1: Top 5 Villages */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🏘️</span>
                <span>Top 5 Villages</span>
              </h2>
              <button
                onClick={() => navigate("/crm?view=villages")}
                className="bg-[#eef2ff] hover:bg-blue-100 text-[#1d4ed8] text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
              >
                View all ›
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-500 font-bold">
                    <th className="text-left pb-2 w-7">#</th>
                    <th className="text-left pb-2">Village</th>
                    <th className="text-center pb-2">Orders</th>
                    <th className="text-right pb-2">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topVillages.map((v) => (
                    <tr
                      key={v.rank}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      onClick={() => navigate(`/orders?village=${encodeURIComponent(v.name)}`)}
                    >
                      <td className="py-2.5">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-extrabold text-[11px] ${
                            v.rank === 1
                              ? "bg-[#fef3c7] text-[#92400e]"
                              : "bg-[#f1f5f9] text-[#334155]"
                          }`}
                        >
                          {v.rank}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-900">{v.name}</td>
                      <td className="py-2.5 text-center font-semibold text-slate-600">{v.orders}</td>
                      <td className="py-2.5 text-right font-black text-[#059669]">{v.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Top 5 Customers */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🏆</span>
                <span>Top 5 Customers</span>
              </h2>
              <button
                onClick={() => navigate("/customers")}
                className="bg-[#eef2ff] hover:bg-blue-100 text-[#1d4ed8] text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
              >
                View all ›
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-500 font-bold">
                    <th className="text-left pb-2 w-7">#</th>
                    <th className="text-left pb-2">Customer</th>
                    <th className="text-center pb-2">Orders</th>
                    <th className="text-right pb-2">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topCustomers.map((c) => (
                    <tr
                      key={c.rank}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      onClick={() => navigate(`/customers`)}
                    >
                      <td className="py-2.5">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-extrabold text-[11px] ${
                            c.rank === 1
                              ? "bg-[#fef3c7] text-[#92400e]"
                              : "bg-[#f1f5f9] text-[#334155]"
                          }`}
                        >
                          {c.rank}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-900 truncate max-w-[140px]">
                        {c.name}
                      </td>
                      <td className="py-2.5 text-center font-semibold text-slate-600">{c.orders}</td>
                      <td className="py-2.5 text-right font-black text-[#059669]">{c.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Top 5 Routes */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🗺️</span>
                <span>Top 5 Routes</span>
              </h2>
              <button
                onClick={() => navigate("/crm?view=routes")}
                className="bg-[#eef2ff] hover:bg-blue-100 text-[#1d4ed8] text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
              >
                View all ›
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-500 font-bold">
                    <th className="text-left pb-2 w-7">#</th>
                    <th className="text-left pb-2">Route Name</th>
                    <th className="text-center pb-2">No of Orders</th>
                    <th className="text-right pb-2">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topRoutes.map((r) => (
                    <tr
                      key={r.rank}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      onClick={() => navigate(`/crm?view=routes`)}
                    >
                      <td className="py-2.5">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-extrabold text-[11px] ${
                            r.rank === 1
                              ? "bg-[#fef3c7] text-[#92400e]"
                              : "bg-[#f1f5f9] text-[#334155]"
                          }`}
                        >
                          {r.rank}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-900">{r.name}</td>
                      <td className="py-2.5 text-center font-semibold text-slate-600">{r.orders}</td>
                      <td className="py-2.5 text-right font-black text-[#059669]">{r.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
