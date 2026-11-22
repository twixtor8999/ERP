import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredVendors,
  saveStoredVendors,
  getStoredPurchases,
  STATE_CODE_MAP,
  type VendorRecord,
} from "../data/mockPurchases";

export function WholesaleVendorsView() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorRecord[]>(() => getStoredVendors());
  const purchases = getStoredPurchases();

  // Create form state
  const [vendorName, setVendorName] = useState("");
  const [gstin, setGstin] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [viewVendor, setViewVendor] = useState<VendorRecord | null>(null);
  const [editVendor, setEditVendor] = useState<VendorRecord | null>(null);

  // Auto-derived State and PAN from GST No
  const derivedState = useMemo(() => {
    const cleanGst = gstin.trim().toUpperCase();
    if (cleanGst.length >= 2) {
      const code = cleanGst.slice(0, 2);
      return STATE_CODE_MAP[code] || "Other / Union Territory";
    }
    return "";
  }, [gstin]);

  const derivedPan = useMemo(() => {
    const cleanGst = gstin.trim().toUpperCase();
    if (cleanGst.length >= 12) {
      return cleanGst.slice(2, 12);
    }
    return "";
  }, [gstin]);

  // Edit modal auto-derived
  const editDerivedState = useMemo(() => {
    if (!editVendor) return "";
    const cleanGst = editVendor.gstin.trim().toUpperCase();
    if (cleanGst.length >= 2) {
      const code = cleanGst.slice(0, 2);
      return STATE_CODE_MAP[code] || "Other / Union Territory";
    }
    return "";
  }, [editVendor]);

  const editDerivedPan = useMemo(() => {
    if (!editVendor) return "";
    const cleanGst = editVendor.gstin.trim().toUpperCase();
    if (cleanGst.length >= 12) {
      return cleanGst.slice(2, 12);
    }
    return "";
  }, [editVendor]);

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorName.trim()) {
      toast.error("Vendor name is required.");
      return;
    }

    const cleanGst = gstin.trim().toUpperCase();
    if (!cleanGst || cleanGst.length !== 15) {
      toast.error("GST No must have exactly 15 alphanumeric characters.");
      return;
    }

    const cleanPhone = contactNo.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Contact number must be at least 10 digits.");
      return;
    }

    if (!address.trim()) {
      toast.error("Address is required.");
      return;
    }

    // Check duplicate
    const exists = vendors.some(
      (v) => v.gstin.toUpperCase() === cleanGst || v.name.toLowerCase() === vendorName.trim().toLowerCase()
    );
    if (exists) {
      toast.error("A vendor with this GST No or Name already exists.");
      return;
    }

    const newVendor: VendorRecord = {
      id: Date.now(),
      name: vendorName.trim(),
      gstin: cleanGst,
      ph: cleanPhone,
      state: derivedState || "Karnataka",
      pan: derivedPan || cleanGst.slice(2, 12),
      addr: address.trim(),
      createdAt: new Date().toISOString().split("T")[0] || "2026-11-22",
    };

    const updated = [newVendor, ...vendors];
    setVendors(updated);
    saveStoredVendors(updated);

    toast.success(`Vendor "${newVendor.name}" saved successfully!`);

    // Reset form
    setVendorName("");
    setGstin("");
    setContactNo("");
    setAddress("");
  };

  const handleUpdateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVendor) return;

    if (!editVendor.name.trim()) {
      toast.error("Vendor name is required.");
      return;
    }

    const cleanGst = editVendor.gstin.trim().toUpperCase();
    if (cleanGst.length !== 15) {
      toast.error("GST No must have 15 characters.");
      return;
    }

    const updated = vendors.map((v) => {
      if (v.id === editVendor.id) {
        return {
          ...editVendor,
          gstin: cleanGst,
          state: editDerivedState || editVendor.state,
          pan: editDerivedPan || editVendor.pan,
        };
      }
      return v;
    });

    setVendors(updated);
    saveStoredVendors(updated);
    setEditVendor(null);
    toast.success("Vendor details updated!");
  };

  const handleDeleteVendor = (id: number, name: string) => {
    const hasPurchases = purchases.some((p) => p.vendorId === id);
    if (hasPurchases) {
      toast.error(`Cannot delete "${name}" because purchase invoices are linked to this vendor.`);
      return;
    }

    if (confirm(`Are you sure you want to delete vendor "${name}"?`)) {
      const updated = vendors.filter((v) => v.id !== id);
      setVendors(updated);
      saveStoredVendors(updated);
      toast.success(`Vendor "${name}" deleted.`);
    }
  };

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase().trim();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.gstin.toLowerCase().includes(q) ||
        v.ph.includes(q) ||
        v.addr.toLowerCase().includes(q) ||
        v.state.toLowerCase().includes(q)
    );
  }, [vendors, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      {/* Header Info */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0d1b4c]">
          Vendor
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Create vendors for purchase entry. All fields are compulsory. Type the GST No first: State and PAN fill by themselves.
        </p>
      </div>

      {/* Create Vendor Form Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
          Create vendor
        </h2>

        <form onSubmit={handleSaveVendor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Vendor name *
              </label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. SHA HIRACHAND DONGARCHAND & CO"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                GST No *
              </label>
              <input
                type="text"
                required
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="15-digit GSTIN (e.g. 29AAAFS1234F1Z5)"
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Contact No *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                State (from GST No)
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={derivedState}
                placeholder="Auto-detected from first 2 digits of GST"
                className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 text-gray-600 rounded-lg cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                PAN (from GST No)
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={derivedPan}
                placeholder="Auto-detected from digits 3-12 of GST"
                className="w-full px-3 py-2 text-sm font-mono border border-gray-200 bg-gray-50 text-gray-600 rounded-lg cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Address *
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. KIRANA BAZAR VIJAYAPUR 586101 Karnataka - 586101, India"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2 text-sm font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-lg shadow-sm transition-colors"
            >
              Save vendor
            </button>
          </div>
        </form>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold text-center w-12">Sl</th>
                <th className="py-3 px-3.5 font-semibold min-w-[200px]">Vendor name</th>
                <th className="py-3 px-3.5 font-semibold min-w-[260px]">Address</th>
                <th className="py-3 px-3.5 font-semibold">GST No</th>
                <th className="py-3 px-3.5 font-semibold">Contact No</th>
                <th className="py-3 px-3.5 font-semibold text-center">Purchases</th>
                <th className="py-3 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No vendors match your search.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v, idx) => {
                  const purchaseCount = purchases.filter((p) => p.vendorId === v.id).length;
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-gray-900">
                        {v.name}
                      </td>
                      <td className="py-3 px-3.5 text-gray-600 text-xs">
                        {v.addr}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-gray-700">
                        {v.gstin || "—"}
                      </td>
                      <td className="py-3 px-3.5 text-gray-700 font-medium">
                        {v.ph || "—"}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-blue-600">
                        {purchaseCount}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewVendor(v)}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditVendor(v)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVendor(v.id, v.name)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Vendor Modal */}
      {viewVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#0d1b4c] text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-300" />
                Vendor Details
              </h3>
              <button
                type="button"
                onClick={() => setViewVendor(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Vendor Name</span>
                <div className="font-bold text-gray-900 text-base">{viewVendor.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase">GSTIN</span>
                  <div className="font-mono font-semibold text-gray-800">{viewVendor.gstin}</div>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Contact No</span>
                  <div className="font-semibold text-gray-800">{viewVendor.ph}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase">State</span>
                  <div className="font-semibold text-gray-800">{viewVendor.state}</div>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase">PAN</span>
                  <div className="font-mono font-semibold text-gray-800">{viewVendor.pan}</div>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Address</span>
                <div className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                  {viewVendor.addr}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewVendor(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {editVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base">Edit vendor</h3>
              <button
                type="button"
                onClick={() => setEditVendor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateVendor} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Vendor name *
                </label>
                <input
                  type="text"
                  required
                  value={editVendor.name}
                  onChange={(e) => setEditVendor({ ...editVendor, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    GST No *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={editVendor.gstin}
                    onChange={(e) => setEditVendor({ ...editVendor, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Contact No *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editVendor.ph}
                    onChange={(e) => setEditVendor({ ...editVendor, ph: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    State (from GST No)
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={editDerivedState}
                    className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 text-gray-600 rounded-lg cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    PAN (from GST No)
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={editDerivedPan}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 bg-gray-50 text-gray-600 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editVendor.addr}
                  onChange={(e) => setEditVendor({ ...editVendor, addr: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditVendor(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-lg shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
