import { useState, useEffect } from "react";
import { Truck, CheckCircle2, Clock, MapPin, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";

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

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/vehicles");
        setVehicles(res.data);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Vehicles & Fleet Logistics
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Active delivery fleet tracking, inter-branch transit vans, vehicle capacities, and dispatch availability.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading fleet inventory...</span>
          </div>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-sm font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {v.vehicle_number}
                  </span>
                  <div className="text-xs font-semibold text-slate-700 mt-2">{v.make} {v.model}</div>
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
                  <span className="font-semibold text-slate-800">{v.capacity}</span>
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
    </div>
  );
}

