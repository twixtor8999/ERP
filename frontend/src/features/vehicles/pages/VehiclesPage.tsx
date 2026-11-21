import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Loader2,
  Plus,
  Printer,
  Navigation,
  DollarSign,
  Fuel,
  RefreshCw,
  Layers,
  Send,
  X,
  User,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface VehicleItem {
  id: string;
  vehicle_number: string;
  model: string;
  make: string;
  vehicle_type: string;
  capacity: string;
  status: string;
  branch_name: string;
  is_active: boolean;
}

interface TripStop {
  id?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  invoice_number?: string;
  amount_to_collect: number;
  amount_collected?: number;
  status?: string;
}

interface DeliveryTripItem {
  id: string;
  trip_number: string;
  branch_name: string;
  vehicle_name: string;
  driver_name: string;
  route_name: string;
  trip_date: string;
  status: "SCHEDULED" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
  total_stops: number;
  total_invoice_amount: number;
  cod_to_collect: number;
  cod_collected: number;
  fuel_expense: number;
  toll_expense: number;
  driver_allowance: number;
  start_odometer?: number;
  end_odometer?: number;
  notes?: string;
  stops: TripStop[];
}

export function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<"fleet" | "trips">("fleet");
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [trips, setTrips] = useState<DeliveryTripItem[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Trip Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [routeName, setRouteName] = useState("");
  const [tripDate, setTripDate] = useState(new Date().toISOString().split("T")[0]);
  const [startOdo, setStartOdo] = useState("");
  const [tripNotes, setTripNotes] = useState("");
  const [stops, setStops] = useState<TripStop[]>([
    {
      customer_name: "Kallappa General Stores",
      customer_phone: "9845123456",
      delivery_address: "Main Bazaar, Nagathan",
      amount_to_collect: 15400,
    },
    {
      customer_name: "Mahalaxmi Provision Stores",
      customer_phone: "9448123789",
      delivery_address: "Bus Stand Road, Mamadapur",
      amount_to_collect: 8200,
    },
  ]);
  const [submittingTrip, setSubmittingTrip] = useState(false);

  // Complete Trip Modal State
  const [completingTrip, setCompletingTrip] = useState<DeliveryTripItem | null>(null);
  const [completeFuel, setCompleteFuel] = useState("1200");
  const [completeToll, setCompleteToll] = useState("150");
  const [completeBatta, setCompleteBatta] = useState("300");
  const [completeCod, setCompleteCod] = useState("");
  const [completeOdo, setCompleteOdo] = useState("");
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  // Print Run-Sheet State
  const [printingTrip, setPrintingTrip] = useState<DeliveryTripItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vRes, tRes, eRes] = await Promise.all([
        apiClient.get<VehicleItem[]>("/api/v1/admin/vehicles"),
        apiClient.get<DeliveryTripItem[]>("/api/v1/admin/trips"),
        apiClient.get<{ id: string; full_name: string }[]>("/api/v1/admin/employees"),
      ]);
      setVehicles(vRes.data);
      setTrips(tRes.data);
      setEmployees(eRes.data);
      if (vRes.data.length > 0 && !selectedVehicleId) {
        const first = vRes.data[0];
        if (first) {
          setSelectedVehicleId(first.id);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddStop = () => {
    setStops([
      ...stops,
      {
        customer_name: "",
        customer_phone: "",
        delivery_address: "",
        amount_to_collect: 0,
      },
    ]);
  };

  const handleRemoveStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleStopChange = (index: number, field: keyof TripStop, value: string | number) => {
    const updated = [...stops];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as TripStop;
      setStops(updated);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !routeName.trim()) {
      toast.error("Validation Error", { description: "Vehicle and Route Name are required." });
      return;
    }
    try {
      setSubmittingTrip(true);
      await apiClient.post("/api/v1/admin/trips", {
        vehicle_id: selectedVehicleId,
        driver_id: selectedDriverId || null,
        route_name: routeName.trim(),
        trip_date: tripDate,
        start_odometer: startOdo ? parseInt(startOdo) : null,
        notes: tripNotes,
        stops: stops.filter((s) => s.customer_name.trim().length > 0),
      });
      toast.success("Delivery Trip Created", { description: `Route ${routeName} scheduled.` });
      setIsCreateModalOpen(false);
      setRouteName("");
      setStartOdo("");
      loadData();
    } catch {
      toast.error("Failed to create delivery trip");
    } finally {
      setSubmittingTrip(false);
    }
  };

  const handleDispatchTrip = async (tripId: string) => {
    try {
      await apiClient.post(`/api/v1/admin/trips/${tripId}/dispatch`);
      toast.success("Trip Dispatched", { description: "Delivery run is now in-transit." });
      loadData();
    } catch {
      toast.error("Failed to dispatch trip");
    }
  };

  const handleOpenCompleteModal = (trip: DeliveryTripItem) => {
    setCompletingTrip(trip);
    setCompleteCod(trip.cod_to_collect.toString());
    setCompleteFuel("1200");
    setCompleteToll("150");
    setCompleteBatta("300");
    setCompleteOdo(trip.start_odometer ? (trip.start_odometer + 65).toString() : "");
  };

  const handleConfirmCompleteTrip = async () => {
    if (!completingTrip) return;
    try {
      setIsSubmittingComplete(true);
      await apiClient.post(`/api/v1/admin/trips/${completingTrip.id}/complete`, {
        fuel_expense: parseFloat(completeFuel) || 0,
        toll_expense: parseFloat(completeToll) || 0,
        driver_allowance: parseFloat(completeBatta) || 0,
        cod_collected: parseFloat(completeCod) || 0,
        end_odometer: completeOdo ? parseInt(completeOdo) : null,
      });
      toast.success("Trip Completed & Diesel Logged", {
        description: `Collected ₹${completeCod}. Fuel expense ₹${completeFuel} recorded.`,
      });
      setCompletingTrip(null);
      loadData();
    } catch {
      toast.error("Failed to complete trip");
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Vehicles & Delivery Trips
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage local delivery vans, create route delivery runs, print driver run-sheets, and track fuel expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "trips" && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Delivery Trip
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab("fleet")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === "fleet" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          <Truck className="w-4 h-4" /> Active Fleet Vehicles ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab("trips")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === "trips" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          <Layers className="w-4 h-4" /> Delivery Trips & Run-Sheets ({trips.length})
        </button>
      </div>

      {/* Tab 1: Fleet Grid */}
      {activeTab === "fleet" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-12 text-center text-slate-400 flex flex-col items-center">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span>Loading fleet vehicles...</span>
            </div>
          ) : (
            vehicles.map((v) => (
              <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      {v.vehicle_number}
                    </span>
                    <div className="text-xs font-semibold text-slate-700 mt-2">
                      {v.make} {v.model}
                    </div>
                  </div>
                  <Badge
                    className={
                      v.status === "AVAILABLE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                    }
                  >
                    {v.status === "AVAILABLE" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                    {v.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Payload Capacity:</span>
                    <span className="font-semibold text-slate-800">{v.capacity || "1.5 Tons"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Depot:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {v.branch_name}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Trips & Run-Sheets */}
      {activeTab === "trips" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Trip #</th>
                  <th className="py-3 px-4">Route / Destination</th>
                  <th className="py-3 px-4">Vehicle & Driver</th>
                  <th className="py-3 px-3 text-center">Stops</th>
                  <th className="py-3 px-4 text-right">COD to Collect</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading delivery trips...
                    </td>
                  </tr>
                ) : trips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No delivery trips scheduled yet. Click &quot;Create Delivery Trip&quot; above.
                    </td>
                  </tr>
                ) : (
                  trips.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-blue-600">{t.trip_number}</span>
                        <div className="text-[11px] text-slate-400">{t.trip_date}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-blue-500" />
                          {t.route_name}
                        </div>
                        <div className="text-xs text-slate-400">{t.branch_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{t.vehicle_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> {t.driver_name}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-700">
                        {t.total_stops}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{t.cod_to_collect.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={
                            t.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : t.status === "DISPATCHED"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrintingTrip(t)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5" /> Run-Sheet
                        </Button>
                        {t.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            onClick={() => handleDispatchTrip(t.id)}
                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs"
                          >
                            <Send className="w-3.5 h-3.5" /> Dispatch
                          </Button>
                        )}
                        {t.status === "DISPATCHED" && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenCompleteModal(t)}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Delivery Trip Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-400" />
                  Create Local Delivery Trip & Run-Sheet
                </h3>
                <p className="text-xs text-slate-300">
                  Assign a vehicle, driver, and group retail store orders onto a route.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Delivery Vehicle *</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 px-3 text-xs focus:ring-1 focus:ring-blue-600"
                    required
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} — {v.make} {v.model} ({v.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Assign Driver / Staff</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 px-3 text-xs focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- Select Driver --</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Route / Village Name *</label>
                  <Input
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="e.g. Nagathan - Mamadapur Road"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Trip Date *</label>
                  <Input
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Start Odometer (KM)</label>
                  <Input
                    type="number"
                    value={startOdo}
                    onChange={(e) => setStartOdo(e.target.value)}
                    placeholder="e.g. 45210"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Trip Notes</label>
                  <Input
                    value={tripNotes}
                    onChange={(e) => setTripNotes(e.target.value)}
                    placeholder="e.g. Morning FMCG delivery run"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Delivery Stops Builder */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Retail Store Delivery Stops ({stops.length})
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddStop}
                    className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Plus className="w-3 h-3" /> Add Store Stop
                  </Button>
                </div>

                <div className="space-y-2">
                  {stops.map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border rounded-lg space-y-2 relative">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Stop #{idx + 1}</span>
                        {stops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(idx)}
                            className="text-slate-400 hover:text-rose-600 text-xs"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input
                          placeholder="Store / Customer Name"
                          value={s.customer_name}
                          onChange={(e) => handleStopChange(idx, "customer_name", e.target.value)}
                          className="h-8 text-xs bg-white"
                          required
                        />
                        <Input
                          placeholder="Contact Phone"
                          value={s.customer_phone}
                          onChange={(e) => handleStopChange(idx, "customer_phone", e.target.value)}
                          className="h-8 text-xs font-mono bg-white"
                          required
                        />
                        <Input
                          placeholder="Village / Address"
                          value={s.delivery_address}
                          onChange={(e) => handleStopChange(idx, "delivery_address", e.target.value)}
                          className="h-8 text-xs bg-white"
                          required
                        />
                        <Input
                          type="number"
                          placeholder="COD Amount (₹)"
                          value={s.amount_to_collect === 0 ? "" : s.amount_to_collect}
                          onChange={(e) =>
                            handleStopChange(idx, "amount_to_collect", parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-xs font-mono font-bold bg-white text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-lg flex justify-between items-center text-xs font-semibold">
                <span>Total Delivery COD:</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  ₹{stops.reduce((acc, s) => acc + (s.amount_to_collect || 0), 0).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingTrip} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {submittingTrip ? "Creating..." : "Confirm & Schedule Trip"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {completingTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Complete Trip {completingTrip.trip_number}
                </h3>
                <p className="text-xs text-slate-300">
                  Log diesel expenses, driver allowance, and reconcile COD cash collected.
                </p>
              </div>
              <button
                onClick={() => setCompletingTrip(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Actual COD Cash Collected (₹) *
                </label>
                <Input
                  type="number"
                  value={completeCod}
                  onChange={(e) => setCompleteCod(e.target.value)}
                  className="font-mono font-bold text-base text-emerald-700"
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Expected COD: ₹{completingTrip.cod_to_collect.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                    <Fuel className="w-3.5 h-3.5 text-blue-600" /> Fuel / Diesel Cost (₹)
                  </label>
                  <Input
                    type="number"
                    value={completeFuel}
                    onChange={(e) => setCompleteFuel(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Auto-logs in expenses</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-600" /> Driver Allowance (₹)
                  </label>
                  <Input
                    type="number"
                    value={completeBatta}
                    onChange={(e) => setCompleteBatta(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tolls / Parking (₹)</label>
                  <Input
                    type="number"
                    value={completeToll}
                    onChange={(e) => setCompleteToll(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">End Odometer (KM)</label>
                  <Input
                    type="number"
                    value={completeOdo}
                    onChange={(e) => setCompleteOdo(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <Button variant="outline" onClick={() => setCompletingTrip(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmCompleteTrip}
                  disabled={isSubmittingComplete}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmittingComplete ? "Completing..." : "Complete & Close Run"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Driver Run-Sheet Modal */}
      {printingTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border flex flex-col max-h-[92vh]">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-400" />
                Driver Delivery Run-Sheet Preview
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-bold"
                >
                  Print Manifest
                </Button>
                <button
                  onClick={() => setPrintingTrip(null)}
                  className="text-slate-400 hover:text-white text-base font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-4 print:p-0">
              {/* Manifest Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-black uppercase text-slate-900">SIDDESHWAR ENTERPRISES</h2>
                <p className="text-xs font-medium text-slate-500">
                  Wholesale & Retail FMCG Distribution • Vijayapura
                </p>
                <div className="mt-2 text-sm font-bold uppercase tracking-wider bg-slate-100 py-1 rounded inline-block px-4">
                  VEHICLE DELIVERY RUN-SHEET
                </div>
              </div>

              {/* Manifest Details */}
              <div className="grid grid-cols-2 text-xs gap-y-1 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="text-slate-400">Trip Number:</span>{" "}
                  <strong className="font-mono text-slate-900">{printingTrip.trip_number}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Trip Date:</span>{" "}
                  <strong className="text-slate-900">{printingTrip.trip_date}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Route / Area:</span>{" "}
                  <strong className="text-slate-900">{printingTrip.route_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Vehicle:</span>{" "}
                  <strong className="font-mono text-slate-900">{printingTrip.vehicle_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Driver / Dispatcher:</span>{" "}
                  <strong className="text-slate-900">{printingTrip.driver_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Total Stops:</span>{" "}
                  <strong className="text-slate-900">{printingTrip.stops.length} Retail Stores</strong>
                </div>
              </div>

              {/* Stops Table */}
              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="p-2 border-r border-slate-300">Store Name & Address</th>
                    <th className="p-2 border-r border-slate-300 w-28">Contact Phone</th>
                    <th className="p-2 border-r border-slate-300 w-24 text-right">COD Due (₹)</th>
                    <th className="p-2 border-r border-slate-300 w-24 text-right">Collected (₹)</th>
                    <th className="p-2 w-24 text-center">Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printingTrip.stops.map((s, idx) => (
                    <tr key={idx} className="h-14">
                      <td className="p-2 text-center border-r border-slate-200 font-mono font-bold">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{s.customer_name}</div>
                        <div className="text-[10px] text-slate-500">{s.delivery_address}</div>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono">{s.customer_phone}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">
                        ₹{s.amount_to_collect.toFixed(2)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {s.amount_collected ? `₹${s.amount_collected.toFixed(2)}` : "________"}
                      </td>
                      <td className="p-2 text-center text-slate-300">__________</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td colSpan={3} className="p-2 text-right border-r border-slate-300 uppercase">
                      Total COD to Collect:
                    </td>
                    <td className="p-2 text-right border-r border-slate-300 font-mono">
                      ₹{printingTrip.cod_to_collect.toFixed(2)}
                    </td>
                    <td colSpan={2} className="p-2"></td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                  <span>Dispatcher Signature</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                  <span>Driver Signature</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                  <span>Manager Settlement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
