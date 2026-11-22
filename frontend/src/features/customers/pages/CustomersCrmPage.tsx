import { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Loader2,
  DollarSign,
  CheckCircle2,
  Phone,
  AlertTriangle,
  ArrowDownCircle,
  RefreshCw,
  Wallet,
  Printer,
  FileText,
  Copy,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface PaymentSuccessInfo {
  customer_name: string;
  customer_phone: string;
  amount_paid: number;
  remaining_balance: number;
  transaction_number: string;
}

export function CustomersCrmPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "DUES" | "CLEAR">("ALL");

  // Registration modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [creditLimit, setCreditLimit] = useState("5000");

  // Receive Payment Modal
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<"CASH" | "UPI">("CASH");
  const [payNotes, setPayNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Payment Confirmation Success Modal
  const [successPayment, setSuccessPayment] = useState<PaymentSuccessInfo | null>(null);

  // Statement / Reminder Slip Modal
  const [statementCustomer, setStatementCustomer] = useState<CustomerItem | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<CustomerItem[]>("/admin/customers", {
        params: { search: search || undefined },
      });
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

  // Aggregate KPIs
  const totalOutstandingKhata = useMemo(() => {
    return customers.reduce((sum, c) => (c.current_balance > 0 ? sum + c.current_balance : sum), 0);
  }, [customers]);

  const debtorsCount = useMemo(() => {
    return customers.filter((c) => c.current_balance > 0).length;
  }, [customers]);

  const clearAccountsCount = useMemo(() => {
    return customers.filter((c) => c.current_balance <= 0).length;
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (filterTab === "DUES") {
      return customers.filter((c) => c.current_balance > 0);
    }
    if (filterTab === "CLEAR") {
      return customers.filter((c) => c.current_balance <= 0);
    }
    return customers;
  }, [customers, filterTab]);

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
      setIsRegisterModalOpen(false);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      loadCustomers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Registration failed"
          : "Failed to register customer";
      toast.error("Error", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const openReceivePaymentModal = (c: CustomerItem) => {
    setPaymentCustomer(c);
    setPayAmount(String(c.current_balance > 0 ? c.current_balance.toFixed(2) : ""));
    setPayMode("CASH");
    setPayNotes("");
  };

  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid payment amount greater than zero.");
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await apiClient.post(`/admin/customers/${paymentCustomer.id}/receive-payment`, {
        amount: amt,
        payment_method: payMode,
        notes: payNotes.trim() || undefined,
      });

      const data = res.data;
      setPaymentCustomer(null);
      setSuccessPayment({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        amount_paid: data.amount_paid,
        remaining_balance: data.remaining_balance,
        transaction_number: data.transaction_number,
      });

      toast.success("Payment Received", {
        description: `₹${amt.toFixed(2)} credited to ${paymentCustomer.full_name}'s Khata.`,
      });
      loadCustomers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Payment failed"
          : "Failed to record payment";
      toast.error("Payment Error", { description: msg });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCopyReminderNotice = (c: CustomerItem) => {
    const text = `Siddeshwar Enterprises • Khata Due Notice\nCustomer: ${c.full_name} (${c.phone})\nAccount Code: ${c.customer_code}\nOutstanding Khata Balance: ₹${c.current_balance.toFixed(2)}\nDate: ${new Date().toLocaleDateString("en-IN")}\nKindly clear the pending balance via Cash or UPI.\nThank you!`;
    navigator.clipboard.writeText(text);
    toast.success("Notice Copied to Clipboard", { description: `Khata statement summary for ${c.full_name} copied.` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            Customer Khata & Udhaar Collection
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Live customer credit balances, 1-click Udhaar payment collection, and WhatsApp payment reminders.
          </p>
        </div>
        <Button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Register Customer
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-200 bg-rose-50/40 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Total Outstanding Khata</p>
              <h3 className="text-2xl font-bold font-mono text-rose-900 mt-0.5">
                ₹ {totalOutstandingKhata.toFixed(2)}
              </h3>
              <p className="text-[11px] text-rose-600 font-medium mt-0.5">{debtorsCount} customer(s) owe money</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Pending Debtors</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{debtorsCount}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Requires collection follow-up</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Clear Accounts</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">{clearAccountsCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Zero pending dues</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
          <Input
            placeholder="Search by customer name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-slate-50 border-slate-200 text-xs h-8"
          />
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <Button
            size="sm"
            variant={filterTab === "ALL" ? "default" : "ghost"}
            onClick={() => setFilterTab("ALL")}
            className="h-7 text-xs font-semibold px-2.5"
          >
            All ({customers.length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === "DUES" ? "default" : "ghost"}
            onClick={() => setFilterTab("DUES")}
            className={`h-7 text-xs font-semibold px-2.5 ${
              filterTab === "DUES" ? "bg-rose-600 hover:bg-rose-700 text-white" : "text-rose-700"
            }`}
          >
            🔴 Pending Udhaar ({debtorsCount})
          </Button>
          <Button
            size="sm"
            variant={filterTab === "CLEAR" ? "default" : "ghost"}
            onClick={() => setFilterTab("CLEAR")}
            className={`h-7 text-xs font-semibold px-2.5 ${
              filterTab === "CLEAR" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-700"
            }`}
          >
            🟢 Clear ({clearAccountsCount})
          </Button>
        </div>
      </div>

      {/* Customer Khata Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>Loading customer Khata directory...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No customers found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search filter or add a new customer.</p>
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
                  <th className="py-3 px-4 text-right">Pending Khata (Udhaar)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCustomers.map((c) => {
                  const hasDues = c.current_balance > 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 font-bold">{c.customer_code}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.full_name}</div>
                        {c.email && <div className="text-[11px] text-slate-400">{c.email}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono text-xs">
                        ₹ {c.credit_limit.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasDues ? (
                          <Badge variant="destructive" className="font-mono text-xs font-bold py-0.5 px-2">
                            ₹ {c.current_balance.toFixed(2)}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs text-emerald-700 bg-emerald-50 border-emerald-200 py-0.5 px-2"
                          >
                            ₹ 0.00
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasDues ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openReceivePaymentModal(c)}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 px-2.5 shadow-xs"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Receive Payment
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStatementCustomer(c)}
                                className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold gap-1 px-2 shadow-xs"
                                title="Customer Khata Statement & Dues Notice"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" /> Statement Slip
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReceivePaymentModal(c)}
                              className="h-7 text-xs text-slate-500 hover:text-slate-800"
                            >
                              Add Advance
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Receive Payment */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Receive Khata Payment</h2>
                  <p className="text-xs text-slate-500">Record customer settlement towards old bill balance</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">{paymentCustomer.full_name}</div>
                  <div className="text-slate-500 font-mono">{paymentCustomer.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">Current Balance</div>
                  <div className="font-mono font-bold text-sm text-rose-600">
                    ₹ {paymentCustomer.current_balance.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Amount Received (₹) *</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="font-mono text-base font-bold"
                  autoFocus
                />
                <div className="flex gap-1.5 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setPayAmount(paymentCustomer.current_balance.toFixed(2))}
                  >
                    Full Balance (₹{paymentCustomer.current_balance.toFixed(2)})
                  </Button>
                  {[500, 1000, 2000].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setPayAmount(String(v))}
                    >
                      ₹{v}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tender Mode *</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={payMode === "CASH" ? "default" : "outline"}
                    onClick={() => setPayMode("CASH")}
                    className={`h-9 font-semibold text-xs ${
                      payMode === "CASH" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                    }`}
                  >
                    💵 Cash Received
                  </Button>
                  <Button
                    type="button"
                    variant={payMode === "UPI" ? "default" : "outline"}
                    onClick={() => setPayMode("UPI")}
                    className={`h-9 font-semibold text-xs ${
                      payMode === "UPI" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                    }`}
                  >
                    📱 UPI (GPay/PhonePe)
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Payment Notes / Remarks (Optional)</label>
                <Input
                  placeholder="e.g. Cleared bill of 14/11 / Handed cash to cashier"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setPaymentCustomer(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  disabled={isSubmittingPayment}
                >
                  {isSubmittingPayment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Recording...
                    </>
                  ) : (
                    "Confirm Payment Receipt"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Payment Success & WhatsApp Receipt */}
      {successPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Recorded!</h3>
              <p className="text-xs text-slate-500 mt-0.5">Receipt #{successPayment.transaction_number}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{successPayment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Received:</span>
                <span className="font-bold text-emerald-600">₹ {successPayment.amount_paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-slate-500">Remaining Khata:</span>
                <span className="font-bold text-slate-900">₹ {successPayment.remaining_balance.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs h-9"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" /> Print Payment Receipt Slip
              </Button>
              <Button variant="outline" className="w-full text-xs h-8" onClick={() => setSuccessPayment(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Customer Khata Statement & Dues Slip */}
      {statementCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Customer Khata Statement</h3>
                  <p className="text-xs text-slate-500">Official Udhaar summary & dues notice</p>
                </div>
              </div>
              <button
                onClick={() => setStatementCustomer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border rounded-xl space-y-3 font-mono text-xs">
              <div className="text-center pb-2 border-b">
                <div className="font-bold text-sm text-slate-900">Siddeshwar Enterprises</div>
                <div className="text-[11px] text-slate-500">Retail & Wholesale Merchants</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Date: {new Date().toLocaleDateString("en-IN")}</div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-900">{statementCustomer.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Code:</span>
                  <span className="font-bold text-slate-900">{statementCustomer.customer_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered Phone:</span>
                  <span className="font-bold text-slate-900">{statementCustomer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credit Limit:</span>
                  <span className="text-slate-700">₹ {statementCustomer.credit_limit.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex justify-between items-center text-xs">
                <span className="font-bold text-rose-800">Total Outstanding Udhaar:</span>
                <span className="font-black text-sm text-rose-900">
                  ₹ {statementCustomer.current_balance.toFixed(2)}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 text-center pt-1 font-sans">
                Kindly clear this pending balance via Cash or UPI at the store counter.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs gap-1.5 h-9"
                onClick={() => handleCopyReminderNotice(statementCustomer)}
              >
                <Copy className="w-3.5 h-3.5" /> Copy Notice
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 h-9"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5" /> Print Statement
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Register Customer Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Register Retail Customer</h2>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">First Name *</label>
                  <Input
                    required
                    placeholder="e.g. Ramesh"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Last Name</label>
                  <Input placeholder="e.g. Patil" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mobile Number (10 digits) *</label>
                <Input
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <Input
                  type="email"
                  placeholder="customer@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Store Credit Limit (₹)</label>
                <Input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsRegisterModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white font-bold" disabled={submitting}>
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
