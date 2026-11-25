import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Truck,
  Package,
  Calendar,
  CheckSquare,
  Square,
  IndianRupee,
  MapPin,
  CheckCircle2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredVehicles,
  getStoredTrips,
  saveStoredTrips,
  type VehicleTripRecord,
} from "../data/mockVehicles";

interface LoadableOrder {
  id: string | number;
  no: string;
  custName: string;
  village: string;
  amount: number;
  itemsCount: number;
  checked: boolean;
}

export function WholesaleCreateTripView() {
  const navigate = useNavigate();
  const vehicles = getStoredVehicles();

  const [selectedVehId, setSelectedVehId] = useState<string>(
    vehicles[0]?.id ? String(vehicles[0].id) : ""
  );

  const [searchOrderQuery, setSearchOrderQuery] = useState("");

  // Invoiced orders loaded from live pipeline
  const [invoicedOrders, setInvoicedOrders] = useState<LoadableOrder[]>(() => {
    try {
      const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
      const list = storedPipeline ? JSON.parse(storedPipeline) : [];
      if (Array.isArray(list) && list.length > 0) {
        // Collect orders that are invoiced or ready for dispatch and not already on an active trip
        const filtered = list.filter(
          (o: any) => o.stage === "invoice" || o.stage === "dispatch"
        );
        if (filtered.length > 0) {
          return filtered.map((o: any, idx: number) => ({
            id: o.id || o.orderNo,
            no: o.invoiceNo || o.orderNo,
            custName: o.customerName || o.shopName || "Customer",
            village: o.village || "Bijapur",
            amount: Number(o.total) || 0,
            itemsCount: Array.isArray(o.items) ? o.items.length : 1,
            checked: idx < 2, // pre-check first 2 for convenient loading
          }));
        }
      }
    } catch {}

    // Fallback verified invoiced orders if pipeline has no active invoiced orders yet
    return [
      {
        id: 201,
        no: "INV-2026-1045",
        custName: "Sri Basaveshwar Stores",
        village: "Basavan Bagewadi",
        amount: 14200,
        itemsCount: 8,
        checked: true,
      },
      {
        id: 202,
        no: "INV-2026-1046",
        custName: "Mamadapur Daily Mart",
        village: "Mamadapur",
        amount: 9800,
        itemsCount: 5,
        checked: true,
      },
      {
        id: 203,
        no: "INV-2026-1047",
        custName: "Lakshmi General Stores",
        village: "Tikota",
        amount: 11400,
        itemsCount: 6,
        checked: false,
      },
      {
        id: 204,
        no: "INV-2026-1048",
        custName: "Om Sai Supermarket",
        village: "Atharga",
        amount: 18650,
        itemsCount: 11,
        checked: false,
      },
      {
        id: 205,
        no: "INV-2026-1049",
        custName: "Shree Ganesh Kirana",
        village: "Yarnal",
        amount: 7300,
        itemsCount: 4,
        checked: false,
      },
    ];
  });

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => String(v.id) === selectedVehId) || vehicles[0];
  }, [vehicles, selectedVehId]);

  const filteredOrders = useMemo(() => {
    if (!searchOrderQuery.trim()) return invoicedOrders;
    const q = searchOrderQuery.toLowerCase().trim();
    return invoicedOrders.filter(
      (o) =>
        o.no.toLowerCase().includes(q) ||
        o.custName.toLowerCase().includes(q) ||
        o.village.toLowerCase().includes(q)
    );
  }, [invoicedOrders, searchOrderQuery]);

  const selectedOrders = useMemo(() => {
    return invoicedOrders.filter((o) => o.checked);
  }, [invoicedOrders]);

  const totalLoadedValue = useMemo(() => {
    return selectedOrders.reduce((sum, o) => sum + o.amount, 0);
  }, [selectedOrders]);

  const handleToggleOrder = (id: string | number) => {
    setInvoicedOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, checked: !o.checked } : o))
    );
  };

  const handleSelectAll = (check: boolean) => {
    setInvoicedOrders((prev) => prev.map((o) => ({ ...o, checked: check })));
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) {
      toast.error("Please select a vehicle");
      return;
    }

    if (selectedOrders.length === 0) {
      toast.error("Please select at least one invoiced order to load");
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const newTrip: VehicleTripRecord = {
      id: Date.now(),
      date: todayIso,
      vehId: selectedVehicle.id,
      vehNo: selectedVehicle.no,
      model: selectedVehicle.model,
      ordersCount: selectedOrders.length,
      orderValue: totalLoadedValue,
      invoiceAmt: totalLoadedValue,
      returns: 0,
      netSales: totalLoadedValue,
      startKm: 46100,
      endKm: 46100,
      totalKm: 0,
      fixedRent: 1400,
      dieselCost: 0,
      tollCost: 0,
      otherCost: 0,
      totalRent: 1400,
      status: "in_progress",
      orders: selectedOrders.map((o) => ({
        id: typeof o.id === "number" ? o.id : 0,
        no: o.no,
        custName: o.custName,
        amount: o.amount,
      })),
    };

    // 1. Save new trip
    const currentTrips = getStoredTrips();
    saveStoredTrips([newTrip, ...currentTrips]);

    // 2. Advance pipeline orders to "dispatch" with assigned vehicle
    try {
      const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
      if (storedPipeline) {
        const pOrders = JSON.parse(storedPipeline);
        const selectedOrderNos = new Set(selectedOrders.map((o) => o.no));
        const updated = pOrders.map((po: any) => {
          if (selectedOrderNos.has(po.invoiceNo) || selectedOrderNos.has(po.orderNo)) {
            return {
              ...po,
              stage: "dispatch",
              vehicleNo: selectedVehicle.no,
              dispatchedAt: new Date().toISOString(),
            };
          }
          return po;
        });
        localStorage.setItem("crm_wholesale_pipeline_orders", JSON.stringify(updated));
        window.dispatchEvent(new Event("pipeline_orders_updated"));
      }
    } catch {}

    window.dispatchEvent(new Event("vehicle_trips_updated"));

    toast.success(
      `Trip successfully created for ${selectedVehicle.no} with ${selectedOrders.length} orders loaded!`
    );
    navigate("/vehicles?tab=trips");
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans antialiased text-slate-800 animate-in fade-in duration-150 pb-16">
      {/* Top Header Row with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/vehicles?tab=trips")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1b4c] text-white hover:bg-[#152a70] text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trips</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Vehicle</span>
          <span>/</span>
          <span className="text-slate-800 font-bold">Create Trip</span>
        </div>
      </div>

      {/* Main Page Title Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Truck className="w-6 h-6 text-blue-600" />
              <span>Create Delivery Trip</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Load invoiced orders on a vehicle. Selected orders move to <b>Dispatch → Delivery</b> pipeline.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-blue-50/70 border border-blue-200/80 px-4 py-2.5 rounded-xl text-right min-w-[160px]">
              <span className="text-2xs font-bold text-blue-900 uppercase tracking-wider block">
                Total Loaded Value
              </span>
              <div className="text-xl font-black text-[#0d1b4c] mt-0.5 flex items-center justify-end">
                <IndianRupee className="w-4 h-4 mr-0.5" />
                {totalLoadedValue.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 px-4 py-2.5 rounded-xl text-right min-w-[140px]">
              <span className="text-2xs font-bold text-emerald-900 uppercase tracking-wider block">
                Orders Loaded
              </span>
              <div className="text-xl font-black text-emerald-800 mt-0.5">
                {selectedOrders.length} / {invoicedOrders.length}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Step Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Select Vehicle</span>
              <span className="text-2xs text-slate-500">Pick active delivery truck / tempo</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Select Invoiced Orders</span>
              <span className="text-2xs text-slate-500">Tick boxes of orders to load</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Confirm & Dispatch</span>
              <span className="text-2xs text-slate-500">Dispatches trip and generates run sheet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Creation Form Grid */}
      <form onSubmit={handleCreateTrip} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Vehicle Selection & Specs */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Vehicle Information</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Select Delivery Vehicle *
                </label>
                <select
                  value={selectedVehId}
                  onChange={(e) => setSelectedVehId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-white text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.no} – {v.model || v.type}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVehicle && (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Vehicle No:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {selectedVehicle.no}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Model / Type:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedVehicle.model || selectedVehicle.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Driver:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedVehicle.dr || "Basavaraj Hiremath"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Owner:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedVehicle.own || "Siddeshwar Enterprises"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-900 font-semibold">Standard Fixed Rent:</span>
                      <b className="text-blue-900">₹1,400</b>
                    </div>
                    <div className="flex justify-between items-center text-blue-700 text-2xs">
                      <span>Diesel reimbursement:</span>
                      <span>10 km/l @ ₹99/l</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trip Parameters */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Trip Dispatch Date</span>
              </h3>
              <div>
                <span className="text-xs text-slate-500 block mb-1 font-medium">Date</span>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Right Column: Invoiced Orders to Load */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Invoiced Orders to Load</span>
                  </h3>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Select verified orders to assign to this vehicle trip
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 cursor-pointer"
                  >
                    <CheckSquare className="w-3 h-3" />
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    <Square className="w-3 h-3" />
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Order Search Filter */}
              <div className="p-3 border-b border-slate-100 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by invoice number, customer or village..."
                    value={searchOrderQuery}
                    onChange={(e) => setSearchOrderQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Orders List Table with internal scroll (7-8 visible) */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-[#155dfc] text-white font-semibold uppercase text-[11px] tracking-wider whitespace-nowrap shadow-2xs">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">Load</th>
                      <th className="py-2.5 px-4">Invoice No</th>
                      <th className="py-2.5 px-4">Customer Store</th>
                      <th className="py-2.5 px-4">Village / Route</th>
                      <th className="py-2.5 px-4 text-center">Items</th>
                      <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                          No matching invoiced orders found to load.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => handleToggleOrder(o.id)}
                          className={`cursor-pointer transition-colors ${
                            o.checked
                              ? "bg-blue-50/60 hover:bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={o.checked}
                              onChange={() => handleToggleOrder(o.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-900">
                            {o.no}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {o.custName}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {o.village}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">
                            {o.itemsCount} items
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-700">
                            ₹{o.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-slate-600">
                        Total {selectedOrders.length} orders selected for dispatch
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right text-emerald-800 font-black text-sm">
                        ₹{totalLoadedValue.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bottom Submit Action Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Clicking <b>Create Trip</b> will record the dispatch and allocate orders to driver run sheet.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/vehicles?tab=trips")}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Trip &amp; Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
