import { useState, useEffect } from "react";
import { UserCheck, Plus, Search, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CustomerItem {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string | null;
}

export function CustomersCrmPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [creditLimit, setCreditLimit] = useState("5000");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/customers", { params: { search: search || undefined } });
      setCustomers(res.data);
    } catch {
      toast.error("Failed to load customer directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) {
      toast.error("Validation Error", { description: "First name and phone number are required." });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/admin/customers", {
        first_name: firstName,
        last_name: lastName || null,
        phone,
        email: email || null,
        credit_limit: parseFloat(creditLimit) || 5000,
      });
      toast.success("Customer Registered", { description: `${firstName} has been added to CRM.` });
      setIsModalOpen(false);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      loadCustomers();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        // @ts-expect-error axios response
        ? err.response?.data?.detail || "Registration failed"
        : "Failed to register customer";
      toast.error("Error", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Customer Relationship Management (CRM)
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage customer accounts, store credit balances, contact phone directory, and in-store purchase history.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Register Customer
        </Button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm relative">
        <Search className="w-4 h-4 absolute left-6 top-6 text-slate-400" />
        <Input
          placeholder="Search by customer name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-slate-50 border-slate-200 text-sm"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No customers registered yet</p>
            <p className="text-xs text-slate-400 mt-1">Register retail walk-in and credit customers using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 font-bold">
                      {c.customer_code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {c.full_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {c.phone}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      ₹{c.credit_limit.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{c.current_balance.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Register Retail Customer</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">First Name *</label>
                  <Input required placeholder="e.g. Ramesh" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Last Name</label>
                  <Input placeholder="e.g. Patil" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mobile Number (10 digits) *</label>
                <Input required placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <Input type="email" placeholder="customer@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Store Credit Limit (₹)</label>
                <Input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white" disabled={submitting}>
                  {submitting ? "Registering..." : "Register Customer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
