import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, UserPlus, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import { WholesaleVillageCustomersDetailView } from "./WholesaleVillageCustomersDetailView";
import {
  getStoredRoutes,
  saveStoredRoutes,
  getStoredCustomers,
  saveStoredCustomers,
  type RouteRecord,
  type CustomerRecord,
} from "../data/mockCustomers";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WholesaleRoutePlannerView() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteRecord[]>(() => getStoredRoutes());
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => getStoredCustomers());

  const [activeTab, setActiveTab] = useState<"route" | "villageKey">("route");
  const [selectedRouteForVk, setSelectedRouteForVk] = useState<string>(routes[0]?.name || "Basavan Bagewadi");

  // Modals
  const [isNewRouteOpen, setIsNewRouteOpen] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [newRouteDays, setNewRouteDays] = useState<string[]>(["Mon", "Thu"]);

  const [isAssignCrmOpen, setIsAssignCrmOpen] = useState(false);
  const [assignRoute, setAssignRoute] = useState(routes[0]?.name || "");
  const [assignCrm, setAssignCrm] = useState("Pushpa Patil");
  const [assignDays, setAssignDays] = useState<string[]>(["Mon", "Thu"]);

  const [villageModal, setVillageModal] = useState<{
    routeName: string;
    villageName: string;
    list: CustomerRecord[];
  } | null>(null);

  // Update beat day of a route
  const handleBeatDayChange = (routeName: string, day: string) => {
    const updated = routes.map((r) => {
      if (r.name === routeName) {
        return { ...r, beatDays: [day] };
      }
      return r;
    });
    setRoutes(updated);
    saveStoredRoutes(updated);
    toast.success(`Beat day updated for route ${routeName}`);
  };

  // Update village key
  const handleVillageKeyChange = (routeName: string, villageName: string, newKey: string) => {
    const updated = routes.map((r) => {
      if (r.name === routeName) {
        return {
          ...r,
          villages: r.villages.map((v) => (v.name === villageName ? { ...v, key: newKey } : v)),
        };
      }
      return r;
    });
    setRoutes(updated);
    saveStoredRoutes(updated);
    toast.success(`Key updated for village ${villageName} → ${newKey || "Nil"}`);
  };

  // Create new route
  const handleSaveNewRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName.trim()) {
      toast.error("Please enter a route name");
      return;
    }

    if (routes.some((r) => r.name.toLowerCase() === newRouteName.trim().toLowerCase())) {
      toast.error("A route with this name already exists");
      return;
    }

    const created: RouteRecord = {
      name: newRouteName.trim(),
      beatDays: newRouteDays.length ? newRouteDays : ["Mon"],
      crmName: "Pushpa Patil",
      villages: [{ name: `${newRouteName.trim()} Central`, key: "V1", customerCount: 0 }],
      totalCustomers: 0,
    };

    const updated = [...routes, created];
    setRoutes(updated);
    saveStoredRoutes(updated);
    setIsNewRouteOpen(false);
    setNewRouteName("");
    toast.success(`Route "${created.name}" created!`);
  };

  // Assign CRM
  const handleSaveAssignCrm = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = routes.map((r) => {
      if (r.name === assignRoute) {
        return {
          ...r,
          crmName: assignCrm,
          beatDays: assignDays.length ? assignDays : r.beatDays,
        };
      }
      return r;
    });
    setRoutes(updated);
    saveStoredRoutes(updated);
    setIsAssignCrmOpen(false);
    toast.success(`CRM ${assignCrm} assigned to ${assignRoute}`);
  };

  // View village customers
  const handleOpenVillageCustomers = (routeName: string, villageName: string) => {
    const list = customers.filter(
      (c) =>
        c.route.toLowerCase() === routeName.toLowerCase() ||
        c.village.toLowerCase() === villageName.toLowerCase()
    );
    setVillageModal({ routeName, villageName, list });
  };

  const handleDeleteFromVillageModal = (id: number, name: string) => {
    if (confirm(`Delete customer "${name}"?`)) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      saveStoredCustomers(updated);
      if (villageModal) {
        setVillageModal({
          ...villageModal,
          list: villageModal.list.filter((c) => c.id !== id),
        });
      }
      toast.success(`Customer "${name}" deleted`);
    }
  };

  const totalAllCustomers = routes.reduce((acc, r) => acc + r.totalCustomers, 0);

  // Selected route for Village Key tab
  const curVkRoute = routes.find((r) => r.name === selectedRouteForVk) || routes[0];

  // Dedicated 2nd Page: Return full village customers page matching client website
  if (villageModal) {
    return (
      <WholesaleVillageCustomersDetailView
        routeName={villageModal.routeName}
        villageName={villageModal.villageName}
        customers={villageModal.list}
        onBack={() => setVillageModal(null)}
        onDeleteCustomer={handleDeleteFromVillageModal}
      />
    );
  }

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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Route planner</h1>
            <p className="text-xs text-slate-500">
              Route names, each customer's route, and invoiced orders grouped by route for trip planning
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewRouteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Route
          </button>

          <button
            type="button"
            onClick={() => setIsAssignCrmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-500" />
            Assign CRM
          </button>
        </div>
      </div>

      {/* Sub Tabs: Route / Village Key */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("route")}
          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
            activeTab === "route"
              ? "bg-[#0d1b4c] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          Route
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("villageKey")}
          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
            activeTab === "villageKey"
              ? "bg-[#0d1b4c] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          Village Key
        </button>
      </div>

      {/* Tab 1: Route Grouped Table */}
      {activeTab === "route" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-bold text-[11px] tracking-wide uppercase">
                  <th className="py-2.5 px-3 border-r border-blue-400/40 text-center w-12">Sl No</th>
                  <th className="py-2.5 px-3 border-r border-blue-400/40 w-36">Beat Day</th>
                  <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[200px]">Route Name</th>
                  <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[180px]">Village Name</th>
                  <th className="py-2.5 px-3 border-r border-blue-400/40 w-28">Village Key</th>
                  <th className="py-2.5 px-3 border-r border-blue-400/40 text-center w-32">
                    No of Customers
                  </th>
                  <th className="py-2.5 px-3 text-center w-28">Customers</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-200">
                {routes.map((r, rIdx) => {
                  const rowSpan = Math.max(r.villages.length, 1);
                  return r.villages.map((v, vIdx) => (
                    <tr
                      key={`${r.name}-${v.name}`}
                      className="hover:bg-slate-50/80 transition-colors border-t border-slate-100"
                    >
                      {/* Sl No (spans all villages of route) */}
                      {vIdx === 0 && (
                        <td
                          rowSpan={rowSpan}
                          className="py-2.5 px-3 text-center text-slate-500 font-bold border-r border-slate-200 bg-slate-50/40 align-middle"
                        >
                          {rIdx + 1}
                        </td>
                      )}

                      {/* Beat Day (spans all villages of route) */}
                      {vIdx === 0 && (
                        <td
                          rowSpan={rowSpan}
                          className="py-2.5 px-3 border-r border-slate-200 bg-slate-50/40 align-middle"
                        >
                          <select
                            value={r.beatDays.join(", ")}
                            onChange={(e) => handleBeatDayChange(r.name, e.target.value)}
                            className="w-full text-xs bg-white text-slate-800 font-medium rounded px-2 py-1 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                          >
                            <option value="Mon, Thu">Mon, Thu</option>
                            <option value="Tue, Fri">Tue, Fri</option>
                            <option value="Wed, Sat">Wed, Sat</option>
                            <option value="Mon">Mon</option>
                            <option value="Tue">Tue</option>
                            <option value="Wed">Wed</option>
                            <option value="Thu">Thu</option>
                            <option value="Fri">Fri</option>
                            <option value="Sat">Sat</option>
                          </select>
                        </td>
                      )}

                      {/* Route Name + Count (spans all villages of route) */}
                      {vIdx === 0 && (
                        <td
                          rowSpan={rowSpan}
                          className="py-2.5 px-4 border-r border-slate-200 bg-slate-50/40 align-middle"
                        >
                          <div className="font-bold text-slate-900 text-sm">{r.name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            {r.totalCustomers} customer(s)
                            {r.crmName && (
                              <span className="ml-1 text-blue-600 font-medium">· {r.crmName}</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Village Name */}
                      <td className="py-2.5 px-4 border-r border-slate-100 font-medium text-slate-800">
                        {v.name}
                      </td>

                      {/* Village Key Dropdown */}
                      <td className="py-2 px-3 border-r border-slate-100">
                        <select
                          value={v.key}
                          onChange={(e) => handleVillageKeyChange(r.name, v.name, e.target.value)}
                          className="w-full text-xs font-semibold bg-white text-blue-700 rounded px-2 py-1 border border-slate-200 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Nil</option>
                          {Array.from({ length: 8 }, (_, i) => `V${i + 1}`).map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* No of Customers */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 font-bold text-slate-900">
                        {v.customerCount}
                      </td>

                      {/* View Action */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenVillageCustomers(r.name, v.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          View
                        </button>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>

              {/* Total Footer */}
              <tfoot>
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={5} className="py-3 px-4 text-left">
                    Total · {routes.length} route(s)
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-black text-blue-700">
                    {totalAllCustomers.toLocaleString()}
                  </td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Village Key Configuration */}
      {activeTab === "villageKey" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-72">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Route Name
              </label>
              <select
                value={selectedRouteForVk}
                onChange={(e) => setSelectedRouteForVk(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {routes.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            Give a key only to the villages you want (V1 = first village to visit). A village without a key shows{" "}
            <b>Nil</b> in Callings and Place Order.
          </p>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-bold text-[11px] uppercase tracking-wide">
                  <th className="py-2.5 px-4 w-28">Village Key</th>
                  <th className="py-2.5 px-4">Village Name</th>
                  <th className="py-2.5 px-4 text-center w-36">Customers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {curVkRoute?.villages.map((v) => (
                  <tr key={v.name} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4">
                      {v.key ? (
                        <span className="inline-block px-2.5 py-0.5 font-bold text-xs bg-blue-100 text-blue-800 rounded font-mono">
                          {v.key}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Nil</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{v.name}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                      {v.customerCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: + New Route */}
      {isNewRouteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveNewRoute}
            className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">New Route</h3>
              <button
                type="button"
                onClick={() => setIsNewRouteOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Route Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Muddebihal South"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Beat Day(s)
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const isChecked = newRouteDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setNewRouteDays((prev) =>
                          isChecked ? prev.filter((x) => x !== d) : [...prev, d]
                        );
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 ${
                        isChecked
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewRouteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Save Route
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Assign CRM */}
      {isAssignCrmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveAssignCrm}
            className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Assign CRM to Route</h3>
              <button
                type="button"
                onClick={() => setIsAssignCrmOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Route
              </label>
              <select
                value={assignRoute}
                onChange={(e) => setAssignRoute(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {routes.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                CRM Executive
              </label>
              <select
                value={assignCrm}
                onChange={(e) => setAssignCrm(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Pushpa Patil">Pushpa Patil (CRM)</option>
                <option value="Vijaykumar Shantagiri">Vijaykumar Shantagiri (Super Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Beat Day(s)
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const isChecked = assignDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setAssignDays((prev) =>
                          isChecked ? prev.filter((x) => x !== d) : [...prev, d]
                        );
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors flex items-center gap-1 ${
                        isChecked
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignCrmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Save Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
