import { useState } from "react";
import { toast } from "sonner";
import {
  getStoredVehicles,
  getStoredTrips,
  saveStoredTrips,
  type VehicleTripRecord,
} from "../data/mockVehicles";

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated?: () => void;
}

export function WholesaleCreateTripModal({
  isOpen,
  onClose,
  onTripCreated,
}: CreateTripModalProps) {
  const vehicles = getStoredVehicles();
  const [selectedVehId, setSelectedVehId] = useState<string>(
    vehicles[0]?.id ? String(vehicles[0].id) : ""
  );
  const [startKm, setStartKm] = useState<string>("");
  const [fixedRent, setFixedRent] = useState<string>("");

  // Load live invoiced/dispatched orders from pipeline
  const [invoicedOrders, setInvoicedOrders] = useState(() => {
    try {
      const raw = localStorage.getItem("crm_wholesale_pipeline_orders");
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list)) {
        return list
          .filter((o: any) => o.stage === "invoice" || o.stage === "dispatch")
          .map((o: any) => ({
            id: Number(o.id) || Date.now(),
            no: o.invoiceNo || o.orderNo,
            custName: o.customerName || o.shopName || "Customer",
            village: o.village || "—",
            amount: Number(o.total) || 0,
            checked: false,
          }));
      }
    } catch {}
    return [];
  });

  if (!isOpen) return null;

  const handleToggleOrder = (id: number) => {
    setInvoicedOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, checked: !o.checked } : o))
    );
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const selVeh = vehicles.find((v) => String(v.id) === selectedVehId);
    if (!selVeh) {
      toast.error("Please select a vehicle");
      return;
    }

    const selectedOrders = invoicedOrders.filter((o) => o.checked);
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one invoiced order to load");
      return;
    }

    const orderValue = selectedOrders.reduce((sum, o) => sum + o.amount, 0);

    const startKmNum = Number(startKm) || 0;
    const fixedRentNum = Number(fixedRent) || 0;
    const newTrip: VehicleTripRecord = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      vehId: selVeh.id,
      vehNo: selVeh.no,
      model: selVeh.model,
      ordersCount: selectedOrders.length,
      orderValue,
      invoiceAmt: orderValue,
      returns: 0,
      netSales: orderValue,
      startKm: startKmNum,
      endKm: startKmNum,
      totalKm: 0,
      fixedRent: fixedRentNum,
      dieselCost: 0,
      tollCost: 0,
      otherCost: 0,
      totalRent: fixedRentNum,
      status: "in_progress",
      orders: selectedOrders.map((o) => ({
        id: o.id,
        no: o.no,
        custName: o.custName,
        amount: o.amount,
      })),
    };

    const currentTrips = getStoredTrips();
    saveStoredTrips([newTrip, ...currentTrips]);

    toast.success(`Trip created for ${selVeh.no} with ${selectedOrders.length} orders loaded!`);
    if (onTripCreated) onTripCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#132038] text-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 max-h-[92dvh] overflow-y-auto my-auto">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create trip</h2>
          <p className="text-xs text-slate-300 mt-1">
            Load invoiced orders on a vehicle. They move to Dispatch → Delivery.
          </p>
        </div>

        <form onSubmit={handleCreateTrip} className="space-y-4">
          {/* Vehicle selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vehicle
            </label>
            <select
              value={selectedVehId}
              onChange={(e) => setSelectedVehId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.no} – {v.model || v.type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Start KM
              </label>
              <input
                type="number"
                min="0"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                placeholder="e.g. 54500"
                className="w-full px-3 py-2 text-xs font-mono font-semibold bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fixed Rent (₹)
              </label>
              <input
                type="number"
                min="0"
                value={fixedRent}
                onChange={(e) => setFixedRent(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 text-xs font-mono font-semibold bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Invoiced orders to load */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Invoiced orders to load
            </label>

            {invoicedOrders.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3">No invoiced orders waiting.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {invoicedOrders.map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={o.checked}
                        onChange={() => handleToggleOrder(o.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-white">{o.no}</div>
                        <div className="text-[11px] text-slate-400">
                          {o.custName} · {o.village}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-400">₹{o.amount.toLocaleString()}</div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
            >
              Create trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
