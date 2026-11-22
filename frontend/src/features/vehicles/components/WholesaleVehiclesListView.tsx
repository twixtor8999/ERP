import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Eye, Trash2, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredVehicles,
  saveStoredVehicles,
  type VehicleRecord,
} from "../data/mockVehicles";

export function WholesaleVehiclesListView() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(() => getStoredVehicles());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);

  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase().trim();
    return vehicles.filter(
      (v) =>
        v.no.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.own.toLowerCase().includes(q) ||
        v.oph.includes(q) ||
        (v.dr && v.dr.toLowerCase().includes(q))
    );
  }, [vehicles, searchQuery]);

  const handleDelete = (id: number, no: string) => {
    if (confirm(`Delete vehicle ${no}? A copy is kept in Owner Module → Deleted records.`)) {
      const updated = vehicles.filter((v) => v.id !== id);
      setVehicles(updated);
      saveStoredVehicles(updated);
      if (selectedVehicle?.id === id) setSelectedVehicle(null);
      toast.success(`Vehicle ${no} deleted`);
    }
  };

  const formatExpiry = (dateStr: string) => {
    if (!dateStr) return "—";
    const expDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dmy = dateStr.split("-").reverse().join("-");

    if (diffDays < 0) {
      return (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 rounded">
          Expired {dmy}
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded">
          {dmy} ({diffDays} days)
        </span>
      );
    }
    return <span>{dmy}</span>;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vehicles List</h1>
            <p className="text-xs text-slate-500">Manage delivery vehicles, driver assignments, and insurance</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/vehicles?tab=new")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New vehicle
        </button>
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

      {/* Royal Blue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-bold text-[11px] tracking-wide uppercase">
                <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[140px]">Vehicle</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[150px]">Type</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[150px]">Owner</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[120px]">Owner contact</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[130px]">Insurance till</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[120px]">Driver</th>
                <th className="py-2.5 px-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      <div className="font-bold text-slate-900 font-mono tracking-wide">
                        {v.no}
                      </div>
                      {v.model && (
                        <div className="text-[11px] text-slate-500 font-normal">
                          {v.model}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 text-slate-800">
                      {v.type || "—"}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-semibold text-slate-800">
                      {v.own || "—"}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-mono text-slate-600">
                      {v.oph ? (
                        <a
                          href={`tel:${v.oph}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Phone className="w-3 h-3 text-blue-500" />
                          {v.oph}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-medium text-slate-700">
                      {formatExpiry(v.insx)}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 text-slate-600">
                      {v.dr ? (
                        <div>
                          <div className="font-bold text-slate-800">{v.dr}</div>
                          {v.ph && <div className="text-[10px] text-slate-400 font-mono">{v.ph}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedVehicle(v)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View / Edit Vehicle Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedVehicle.no}</h3>
                <div className="text-xs text-slate-500">{selectedVehicle.model}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Vehicle Type</span>
                <span className="font-bold text-slate-800">{selectedVehicle.type}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Brand</span>
                <span className="font-bold text-slate-800">{selectedVehicle.brand}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Owner Name</span>
                <span className="font-bold text-slate-800">{selectedVehicle.own}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Owner Contact</span>
                <span className="font-bold text-slate-800 font-mono">{selectedVehicle.oph}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg col-span-2">
                <span className="text-slate-400 block mb-0.5">Owner Address</span>
                <span className="font-medium text-slate-800">{selectedVehicle.addr}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Policy Number</span>
                <span className="font-mono text-slate-800">{selectedVehicle.pol || "—"}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Insurance Valid Till</span>
                <span className="font-medium text-slate-800">{selectedVehicle.insx || "—"}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDelete(selectedVehicle.id, selectedVehicle.no)}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Vehicle
              </button>

              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
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
