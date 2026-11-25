import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Download,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredTrips,
  saveStoredTrips,
  type VehicleTripRecord,
} from "../data/mockVehicles";
import { WholesaleCreateTripModal } from "./WholesaleCreateTripModal";
import { WholesaleVehicleTripDetailEditView } from "./WholesaleVehicleTripDetailEditView";

export function WholesaleVehicleTripsView() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<VehicleTripRecord[]>(() => getStoredTrips());

  const todayStr = "2026-11-22";
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [selectedTripToEdit, setSelectedTripToEdit] = useState<VehicleTripRecord | null>(null);

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // Date filter
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          t.vehNo.toLowerCase().includes(q) ||
          (t.model && t.model.toLowerCase().includes(q)) ||
          t.status.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [trips, fromDate, toDate, searchQuery]);

  // Check for in-progress trips
  const inProgressTrips = trips.filter((t) => t.status === "in_progress");

  // Summary totals
  const totals = useMemo(() => {
    return filteredTrips.reduce(
      (acc, t) => {
        acc.orders += t.ordersCount;
        acc.orderValue += t.orderValue;
        acc.invoiceAmt += t.invoiceAmt;
        acc.returns += t.returns;
        acc.netSales += t.netSales;
        acc.totalKm += t.totalKm;
        acc.fixedRent += t.fixedRent;
        acc.otherCost += t.otherCost;
        acc.totalRent += t.totalRent;
        return acc;
      },
      {
        orders: 0,
        orderValue: 0,
        invoiceAmt: 0,
        returns: 0,
        netSales: 0,
        totalKm: 0,
        fixedRent: 0,
        otherCost: 0,
        totalRent: 0,
      }
    );
  }, [filteredTrips]);



  const handleExport = () => {
    toast.success(`Exporting Vehicle Trips (${fromDate} to ${toDate}) to Excel...`);
  };

  // Dedicated 2nd Page: Return full detail & edit view when a trip is selected
  if (selectedTripToEdit) {
    return (
      <WholesaleVehicleTripDetailEditView
        trip={selectedTripToEdit}
        onBack={() => setSelectedTripToEdit(null)}
        onSave={(updatedTrip) => {
          const updated = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
          setTrips(updated);
          saveStoredTrips(updated);
          setSelectedTripToEdit(null);
          toast.success(`Trip for ${updatedTrip.vehNo} updated successfully!`);
        }}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1700px] mx-auto">
      {/* Top Header Row with Date Range Filter */}
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

          {/* Date Range Strip */}
          <div className="flex items-center gap-2 text-xs bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 font-semibold pl-2">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded font-medium focus:outline-none"
            />
            <span className="text-slate-500 font-semibold">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded font-medium focus:outline-none"
            />
            <button
              type="button"
              onClick={() => toast.success("Filtered vehicle trips")}
              className="px-3 py-1 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Top Export Button */}
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vehicle trips</h1>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
      </div>

      {/* Ongoing Trips Alert Banner */}
      {inProgressTrips.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <b>Trip in Progress:</b>{" "}
              {inProgressTrips.map((t) => `${t.vehNo} (${t.date})`).join(", ")} – Close these trips to bill these vehicles again.
            </span>
          </div>
        </div>
      )}

      {/* Action Button: + Create trip */}
      <div>
        <button
          type="button"
          onClick={() => setIsCreateTripOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create trip
        </button>
      </div>

      {/* Royal Blue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-bold text-[11px] tracking-wide uppercase whitespace-nowrap">
                <th className="py-2.5 px-3 border-r border-blue-400/40">Date</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40">Vehicle</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center">Orders</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-right">Value</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-right">Invoice Amt</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-right">Returns</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-right">Net Sales</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center">Start Km</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center">End Km</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center">Total Km</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-right">Fixed Rent</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-right">Diesel + Toll + Other</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-right">Total Rent</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center">Km photos</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 whitespace-nowrap">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-400 italic">
                    No trips recorded in this date range.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 border-r border-slate-100 font-semibold">{t.date}</td>
                    <td className="py-2 px-3 border-r border-slate-100">
                      <div className="font-bold text-slate-900 font-mono">{t.vehNo}</div>
                      {t.model && <div className="text-[10px] text-slate-500">{t.model}</div>}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-center font-bold">
                      {t.ordersCount}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-semibold">
                      ₹{t.orderValue.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-semibold">
                      ₹{t.invoiceAmt.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right text-rose-600 font-medium">
                      ₹{t.returns.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-slate-900">
                      ₹{t.netSales.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-center font-mono">
                      {t.startKm}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-center font-mono">
                      {t.status === "closed" ? t.endKm : "—"}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-center font-bold font-mono">
                      {t.totalKm || "—"}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-semibold">
                      ₹{t.fixedRent.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right text-slate-600">
                      ₹{t.otherCost.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-blue-700">
                      ₹{t.totalRent.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-center text-slate-400">
                      —
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-center">
                      {t.status === "closed" ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded">
                          Closed
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 rounded">
                          Trip in Progress
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTripToEdit(t)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        {t.status === "closed" ? "View" : "Update / Close"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Footer */}
            <tfoot>
              <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300 whitespace-nowrap">
                <td colSpan={2} className="py-3 px-3">
                  Total
                </td>
                <td className="py-3 px-3 text-center font-black">{totals.orders}</td>
                <td className="py-3 px-3 text-right">₹{totals.orderValue.toLocaleString()}</td>
                <td className="py-3 px-3 text-right">₹{totals.invoiceAmt.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-rose-600">₹{totals.returns.toLocaleString()}</td>
                <td className="py-3 px-3 text-right">₹{totals.netSales.toLocaleString()}</td>
                <td colSpan={2} className="py-3 px-3"></td>
                <td className="py-3 px-3 text-center font-black">{totals.totalKm}</td>
                <td className="py-3 px-3 text-right">₹{totals.fixedRent.toLocaleString()}</td>
                <td className="py-3 px-3 text-right">₹{totals.otherCost.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-blue-700 font-black">
                  ₹{totals.totalRent.toLocaleString()}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Create Trip Modal */}
      <WholesaleCreateTripModal
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        onTripCreated={() => setTrips(getStoredTrips())}
      />
    </div>
  );
}
