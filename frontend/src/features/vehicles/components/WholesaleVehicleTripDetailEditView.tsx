import React, { useState } from "react";
import { ArrowLeft, Printer, Download, Save, Truck, Gauge } from "lucide-react";
import { VehicleTripRecord } from "../data/mockVehicles";
import { toast } from "sonner";

interface Props {
  trip: VehicleTripRecord;
  onBack: () => void;
  onSave: (updated: VehicleTripRecord) => void;
}

export const WholesaleVehicleTripDetailEditView: React.FC<Props> = ({
  trip,
  onBack,
  onSave,
}) => {
  const [endKm, setEndKm] = useState<number | string>(trip.endKm || trip.startKm);
  const [toll, setToll] = useState<number | string>(trip.otherCost || 0);
  const [status, setStatus] = useState<"in_progress" | "closed">(trip.status);

  const startKmNum = Number(trip.startKm) || 0;
  const endKmNum = Number(endKm) || startKmNum;
  const totalKmCalc = Math.max(0, endKmNum - startKmNum);
  const tollNum = Number(toll) || 0;
  // 10 km/l @ Rs 99/l = Rs 9.9 per km
  const mileageCost = Math.round(totalKmCalc * 9.9);
  const totalRentCalc = trip.fixedRent + tollNum + mileageCost;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (endKmNum < startKmNum) {
      toast.error("End KM cannot be less than Start KM");
      return;
    }
    const updated: VehicleTripRecord = {
      ...trip,
      endKm: endKmNum,
      totalKm: totalKmCalc,
      otherCost: tollNum,
      totalRent: totalRentCalc,
      status,
    };
    onSave(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Trip ID", "Vehicle No", "Date", "Driver", "Start KM", "End KM", "Total KM", "Orders", "Net Sales", "Total Rent", "Status"];
    const rows = [
      [
        trip.id,
        trip.vehNo,
        trip.date,
        `"${(trip as any).driverName || "Driver"}"`,
        trip.startKm,
        endKmNum,
        totalKmCalc,
        trip.ordersCount,
        trip.netSales,
        totalRentCalc,
        status,
      ],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Trip_${trip.vehNo}_${trip.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Trip details exported to CSV");
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto text-[#0f172a]">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Vehicle Trips
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Trip Sheet
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Header Summary */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              Trip #{trip.id} — {trip.vehNo}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                status === "closed"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {status === "closed" ? "Closed / Completed" : "In Progress"}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Vehicle: <span className="font-bold text-slate-900">{trip.vehNo}</span> ({trip.model}) · Date: {trip.date} · Driver: {(trip as any).driverName || "Basavaraj Hiremath"}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Total Trip Cost</span>
          <span className="text-2xl font-black text-blue-700 font-mono">
            ₹{totalRentCalc.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Orders Loaded</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            {trip.ordersCount} orders
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Distance Run</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            {totalKmCalc} KM
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Net Billed Value</span>
          <p className="text-xl font-black text-emerald-700 font-mono">
            ₹{trip.netSales.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Trip Vehicle Rent</span>
          <p className="text-xl font-black text-blue-700 font-mono">
            ₹{totalRentCalc.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Trip Update Form & Detailed Cost Breakdown */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Odometer & Expense Inputs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-blue-600" />
            Odometer Readings & Trip Closure Inputs
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block mb-1">Start Odometer (KM)</span>
              <span className="text-base font-black font-mono text-slate-900">{trip.startKm}</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">End Odometer (KM) *</label>
              <input
                type="number"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-700 font-semibold mb-1">Toll, Loading & Other Expenses (₹)</label>
            <input
              type="number"
              value={toll}
              onChange={(e) => setToll(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="text-xs">
            <label className="block text-slate-700 font-semibold mb-1">Trip Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "in_progress" | "closed")}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="in_progress">In Progress (Active On Delivery)</option>
              <option value="closed">Closed & Reconciled</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Trip Reconciliation
          </button>
        </div>

        {/* Right: Calculated Rent Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-blue-600" />
            Automatic Trip Cost & Rent Ledger
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Fixed Daily Rent:</span>
              <span className="font-bold font-mono text-slate-900">₹{trip.fixedRent.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Mileage Distance:</span>
              <span className="font-bold font-mono text-slate-900">{totalKmCalc} KM</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Diesel Consumption (10 km/l @ ₹99/l):</span>
              <span className="font-bold font-mono text-slate-900">₹{mileageCost.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Tolls & Incidentals:</span>
              <span className="font-bold font-mono text-slate-900">₹{tollNum.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
              <span className="font-bold text-blue-900">Total Vehicle Payout:</span>
              <span className="font-black font-mono text-blue-700 text-base">₹{totalRentCalc.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
