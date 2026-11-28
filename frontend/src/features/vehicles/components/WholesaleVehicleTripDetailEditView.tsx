import React, { useState } from "react";
import { ArrowLeft, Printer, Download, Save, Truck, Gauge, Camera, X } from "lucide-react";
import {
  getStoredDieselRates,
  getStoredVehicles,
  type VehicleTripRecord,
} from "../data/mockVehicles";
import { toast } from "sonner";

interface Props {
  trip: VehicleTripRecord;
  onBack: () => void;
  onSave: (updated: VehicleTripRecord) => void;
}

const readImageAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

export const WholesaleVehicleTripDetailEditView: React.FC<Props> = ({
  trip,
  onBack,
  onSave,
}) => {
  const matchedVehicle = getStoredVehicles().find(
    (v) => v.no.trim().toUpperCase() === (trip.vehNo || "").trim().toUpperCase()
  );
  const resolvedDriver =
    (trip as any).driverName || (trip as any).dr || matchedVehicle?.dr || "—";
  const activeDieselRate = getStoredDieselRates()[0]?.rate || 99;
  const perKmRate = Math.round((activeDieselRate / 10) * 100) / 100;

  const [startKm, setStartKm] = useState<number | string>(trip.startKm || 0);
  const [endKm, setEndKm] = useState<number | string>(trip.endKm || trip.startKm);
  const [fixedRent, setFixedRent] = useState<number | string>(trip.fixedRent || 0);
  const [toll, setToll] = useState<number | string>(trip.otherCost || 0);
  const [status, setStatus] = useState<"in_progress" | "closed">(trip.status);
  const [startKmPhoto, setStartKmPhoto] = useState<string>(
    (trip as any).startKmPhoto || trip.kmPhotos?.[0] || ""
  );
  const [endKmPhoto, setEndKmPhoto] = useState<string>(
    (trip as any).endKmPhoto || trip.kmPhotos?.[1] || ""
  );

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "start" | "end"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      if (target === "start") {
        setStartKmPhoto(dataUrl);
      } else {
        setEndKmPhoto(dataUrl);
      }
      toast.success(`${target === "start" ? "Start" : "End"} KM photo uploaded`);
    } catch {
      toast.error("Could not read image file");
    }
  };

  const startKmNum = Number(startKm) || 0;
  const endKmNum = Number(endKm) || startKmNum;
  const totalKmCalc = Math.max(0, endKmNum - startKmNum);
  const fixedRentNum = Number(fixedRent) || 0;
  const tollNum = Number(toll) || 0;
  const mileageCost =
    trip.dieselCost > 0 && totalKmCalc === trip.totalKm
      ? trip.dieselCost
      : Math.round(totalKmCalc * perKmRate);
  const totalRentCalc = fixedRentNum + tollNum + mileageCost;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (endKmNum < startKmNum) {
      toast.error("End KM cannot be less than Start KM");
      return;
    }
    const kmPhotos = [startKmPhoto, endKmPhoto].filter(Boolean);
    const updated: VehicleTripRecord = {
      ...trip,
      startKm: startKmNum,
      endKm: endKmNum,
      totalKm: totalKmCalc,
      fixedRent: fixedRentNum,
      dieselCost: mileageCost,
      otherCost: tollNum,
      totalRent: totalRentCalc,
      status,
      kmPhotos,
      ...(startKmPhoto ? { startKmPhoto } : { startKmPhoto: undefined }),
      ...(endKmPhoto ? { endKmPhoto } : { endKmPhoto: undefined }),
    } as VehicleTripRecord;

    // When trip is closed, auto-sync / create settlement record in WholesaleSettlementView
    if (status === "closed") {
      try {
        const SETTLEMENT_KEY = "ai_smart_bazar_settlements_v5";
        const raw = localStorage.getItem(SETTLEMENT_KEY);
        const existingList = raw ? JSON.parse(raw) : [];
        if (Array.isArray(existingList)) {
          const alreadyExists = existingList.some(
            (s: any) => s.vehicleNumber === trip.vehNo && s.date === trip.date
          );
          if (!alreadyExists) {
            const netAmount = Math.max(0, trip.invoiceAmt - trip.returns);
            const currentUserName = (() => {
              try {
                const u = JSON.parse(localStorage.getItem("auth_user") || "{}");
                return u?.name || u?.full_name || localStorage.getItem("user_name") || "Admin";
              } catch {
                return "Admin";
              }
            })();
            const newSettlement = {
              sl: existingList.length + 1,
              date: trip.date,
              vehicleNumber: trip.vehNo,
              driverName: resolvedDriver !== "—" ? resolvedDriver : "",
              noOfOrders: trip.ordersCount,
              invoiceAmt: trip.invoiceAmt,
              fullReturn: 0,
              partialReturn: trip.returns,
              oldReturn: 0,
              netAmt: netAmount,
              qrPayment: 0,
              bankPayment: 0,
              cashReceived: netAmount,
              countedCash: null,
              diff: null,
              denominations: null,
              remarks: `Auto-generated from closed trip (${startKmNum} to ${endKmNum} km)`,
              enteredBy: currentUserName,
            };
            localStorage.setItem(SETTLEMENT_KEY, JSON.stringify([newSettlement, ...existingList]));
            window.dispatchEvent(new Event("settlements_updated"));
          }
        }
      } catch (err) {
        console.error("Failed to auto-sync settlement for closed trip", err);
      }
    }

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
            Vehicle: <span className="font-bold text-slate-900">{trip.vehNo}</span> ({trip.model}) · Date: {trip.date} · Driver: {resolvedDriver}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Start Odometer (KM) *</label>
              <input
                type="number"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                required
              />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Fixed Daily Rent (₹)</label>
              <input
                type="number"
                value={fixedRent}
                onChange={(e) => setFixedRent(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Toll, Loading & Other Expenses (₹)</label>
              <input
                type="number"
                value={toll}
                onChange={(e) => setToll(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
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

          {/* Start KM Photo & End KM Photo Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-blue-600" /> Start km photo
                </span>
                {startKmPhoto && (
                  <button
                    type="button"
                    onClick={() => setStartKmPhoto("")}
                    className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              {startKmPhoto ? (
                <img
                  src={startKmPhoto}
                  alt="Start km photo"
                  className="w-full h-24 object-cover rounded border border-slate-200 bg-white"
                />
              ) : (
                <div className="h-16 flex items-center justify-center rounded border border-dashed border-slate-300 bg-white text-[11px] text-slate-400">
                  No start km photo
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handlePhotoUpload(e, "start")}
                className="block w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#0d1b4c] file:text-white hover:file:bg-[#1a2d6d] cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-blue-600" /> End km photo
                </span>
                {endKmPhoto && (
                  <button
                    type="button"
                    onClick={() => setEndKmPhoto("")}
                    className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              {endKmPhoto ? (
                <img
                  src={endKmPhoto}
                  alt="End km photo"
                  className="w-full h-24 object-cover rounded border border-slate-200 bg-white"
                />
              ) : (
                <div className="h-16 flex items-center justify-center rounded border border-dashed border-slate-300 bg-white text-[11px] text-slate-400">
                  No end km photo
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handlePhotoUpload(e, "end")}
                className="block w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#0d1b4c] file:text-white hover:file:bg-[#1a2d6d] cursor-pointer"
              />
            </div>
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
              <span className="font-bold font-mono text-slate-900">₹{fixedRentNum.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Mileage Distance:</span>
              <span className="font-bold font-mono text-slate-900">{totalKmCalc} KM</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Diesel Consumption (10 km/l @ ₹{activeDieselRate}/l):</span>
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
