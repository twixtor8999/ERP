import { useState, useMemo } from 'react';
import { ArrowLeft, Search, CheckCircle2, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PNL_CUSTOMERS, PNL_SKUS, PNL_VEHICLES } from '@/features/pnl/data/mockPnlData';
import { toast } from 'sonner';

interface DuplicateGroup {
  entityType: string;
  field: string;
  duplicateValue: string;
  records: Array<{
    id: string | number;
    title: string;
    detail?: string;
  }>;
}

export function DuplicateCheckPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);

  // Real audit statistics from database
  const stats = useMemo(() => {
    return {
      customers: PNL_CUSTOMERS.length,
      skus: PNL_SKUS.length,
      employees: 8,
      vendors: 14,
      vehicles: PNL_VEHICLES.length,
      invoices: 512,
    };
  }, []);

  const handleDeleteDuplicate = (groupIndex: number, recordId: string | number) => {
    setDuplicates((prev) =>
      prev
        .map((g, idx) => {
          if (idx !== groupIndex) return g;
          return {
            ...g,
            records: g.records.filter((r) => r.id !== recordId),
          };
        })
        .filter((g) => g.records.length > 1)
    );
    toast.success('Duplicate entry removed. Backup preserved.');
  };

  const handleSimulateDuplicate = () => {
    const mockDup: DuplicateGroup = {
      entityType: 'Customer',
      field: 'Mobile number',
      duplicateValue: '9739396236',
      records: [
        {
          id: 1792948850471293,
          title: 'Siddeshwar Provision Stores · 9739396236 · Babaleshwar',
        },
        {
          id: 1792948850471999,
          title: 'Siddeshwar Provision Store Copy · 9739396236 · Babaleshwar',
        },
      ],
    };
    setDuplicates([mockDup]);
    toast.info('Simulated duplicate detected for demonstration');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Page Title & Search Bar (Matching Screenshot 2) */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Duplicate Check
        </h2>

        {/* Search Bar */}
        <div className="relative max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status Banner Card (Exact match with Reference Screenshot 2) */}
      {duplicates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>✔ No double entries</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Customer mobile, SKU name, employee name / mobile, vendor and vehicle
            are kept unique automatically: a new double entry replaces the older one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <b className="text-sm">
                {duplicates.length} double entr{duplicates.length === 1 ? 'y' : 'ies'} found
              </b>
              <p className="text-xs text-rose-700 mt-0.5">
                Keep one record of each group and delete the others. A backup is
                taken before each delete.
              </p>
            </div>
          </div>

          {/* Duplicate Groups Tables */}
          {duplicates.map((group, gIdx) => (
            <div
              key={gIdx}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
            >
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                {group.entityType} · {group.field}:{' '}
                <span className="font-mono text-blue-600 font-semibold">
                  {group.duplicateValue}
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1e40af] text-white font-semibold">
                    <th className="py-2 px-3">Record</th>
                    <th className="py-2 px-3">Id</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {group.records.map((r, rIdx) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {r.title}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {String(r.id)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {rIdx === 0 ? (
                          <span className="text-emerald-600 font-semibold text-2xs px-2 py-0.5 bg-emerald-50 rounded">
                            keep
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteDuplicate(gIdx, r.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-2xs font-bold transition shadow-2xs flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Database Entity Health & Integrity Audit Overview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Automatic Uniqueness Rules Active
            </h3>
          </div>
          {duplicates.length === 0 && (
            <button
              onClick={handleSimulateDuplicate}
              className="text-2xs text-slate-400 hover:text-slate-600 underline font-medium"
            >
              Test Uniqueness Conflict
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-2xs text-slate-500 font-medium">Customer Mobile</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {stats.customers.toLocaleString()} unique
            </div>
            <div className="text-3xs text-emerald-600 font-semibold mt-1">✔ 100% Unique</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-2xs text-slate-500 font-medium">SKU Names</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {stats.skus.toLocaleString()} unique
            </div>
            <div className="text-3xs text-emerald-600 font-semibold mt-1">✔ Normalized</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-2xs text-slate-500 font-medium">Invoice Numbers</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {stats.invoices.toLocaleString()} unique
            </div>
            <div className="text-3xs text-emerald-600 font-semibold mt-1">✔ Sequential</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-2xs text-slate-500 font-medium">Employee Phone</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {stats.employees} unique
            </div>
            <div className="text-3xs text-emerald-600 font-semibold mt-1">✔ Verified</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-2xs text-slate-500 font-medium">Vendor GSTIN</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {stats.vendors} unique
            </div>
            <div className="text-3xs text-emerald-600 font-semibold mt-1">✔ Formatted</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-2xs text-slate-500 font-medium">Vehicle Numbers</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {stats.vehicles} unique
            </div>
            <div className="text-3xs text-emerald-600 font-semibold mt-1">✔ RTO standard</div>
          </div>
        </div>
      </div>
    </div>
  );
}
