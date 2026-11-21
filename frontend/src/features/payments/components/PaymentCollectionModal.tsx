import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import type { PaymentMethod, PaymentTransaction } from "../types";
import {
  Banknote,
  QrCode,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Receipt,
  X,
} from "lucide-react";

interface PaymentCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transaction: PaymentTransaction) => void;
  defaultBranchId?: string;
  defaultOrderId?: string;
  defaultInvoiceId?: string;
  defaultAmount?: number;
}

export function PaymentCollectionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBranchId,
  defaultOrderId,
  defaultInvoiceId,
  defaultAmount,
}: PaymentCollectionModalProps) {
  const { user } = useAuthStore();
  const { activeBranch, availableBranches } = useBranchStore();

  const isOwnerOrAdmin =
    user?.role?.toLowerCase().includes("owner") ||
    user?.role?.toLowerCase().includes("admin") ||
    user?.role?.toLowerCase().includes("super");

  const [branchId, setBranchId] = useState<string>(
    defaultBranchId || activeBranch?.id || (availableBranches?.[0]?.id ?? "")
  );
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState<string>(defaultAmount ? String(defaultAmount) : "");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [orderId, setOrderId] = useState<string>(defaultOrderId || "");
  const [invoiceId, setInvoiceId] = useState<string>(defaultInvoiceId || "");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (!branchId) {
      setError("Please select a target branch for this collection.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post<PaymentTransaction>("/api/v1/payments/collect", {
        branch_id: branchId,
        amount: numAmount,
        payment_method: method,
        payment_type: "RECEIPT",
        order_id: orderId.trim() || undefined,
        invoice_id: invoiceId.trim() || undefined,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        idempotency_key: `manual_col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = errorObj?.response?.data?.detail || errorObj?.message || "Failed to record payment collection.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border bg-card">
        <CardHeader className="space-y-1 pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Record Payment Collection
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                Collector: {user?.fullName || "Staff"} ({user?.role || "Staff"})
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Multi-branch direct payment ledger entry. Manually reported collections require physical or bank reconciliation.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Branch Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Target Branch:
              </label>
              {isOwnerOrAdmin ? (
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                >
                  <option value="" disabled>Select Branch...</option>
                  {(availableBranches || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 border rounded-md text-sm bg-muted/40 font-mono text-foreground flex items-center justify-between">
                  <span>{activeBranch?.name || "Assigned Branch"}</span>
                  <Badge variant="secondary" className="text-[10px]">Locked to My Branch</Badge>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Payment Method:
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("CASH")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    method === "CASH"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-600 font-bold ring-2 ring-emerald-500/30"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Banknote className="w-4 h-4 mb-1 text-emerald-600" />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("UPI")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    method === "UPI"
                      ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold ring-2 ring-blue-500/30"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <QrCode className="w-4 h-4 mb-1 text-blue-600" />
                  UPI QR
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("CARD")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    method === "CARD"
                      ? "border-purple-600 bg-purple-500/10 text-purple-600 font-bold ring-2 ring-purple-500/30"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1 text-purple-600" />
                  POS Card
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("COD")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    method === "COD"
                      ? "border-amber-600 bg-amber-500/10 text-amber-600 font-bold ring-2 ring-amber-500/30"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Truck className="w-4 h-4 mb-1 text-amber-600" />
                  COD Delivery
                </button>
              </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Amount Collected (₹ INR):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 font-mono text-base font-bold"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Optional Reference / UTR Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  {method === "UPI" ? "UPI UTR / Ref Number" : method === "CARD" ? "Card Approval Code" : "Reference Details"}
                </label>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Optional
                </span>
              </div>
              <Input
                placeholder={
                  method === "UPI"
                    ? "e.g. 402819284719 (Leave blank if busy, can add later)"
                    : method === "CARD"
                    ? "e.g. Auth Code #9182"
                    : "Optional payment receipt or voucher #"
                }
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="text-xs font-mono"
              />
              {method === "UPI" && (
                <p className="text-[11px] text-muted-foreground">
                  * UTR is never mandatory. Employees or accountants can verify and match transactions during bank reconciliation.
                </p>
              )}
            </div>

            {/* Optional Linked Order or Invoice */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Linked Order ID (Optional):
                </label>
                <Input
                  placeholder="UUID or Order Number"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Linked Invoice ID (Optional):
                </label>
                <Input
                  placeholder="UUID or Invoice Number"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Internal Notes (Optional):
              </label>
              <Input
                placeholder="e.g. Walk-in customer counter payment, delivery cash handover..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                disabled={isLoading}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLoading ? "Recording Collection..." : `Confirm Collection (₹ ${amount || "0.00"})`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
