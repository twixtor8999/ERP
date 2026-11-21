import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Banknote,
  QrCode,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Search,
  Plus,
  RefreshCw,
  Building2,
  ShieldCheck,
  Receipt,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentCollectionModal } from "../components/PaymentCollectionModal";
import type { PaymentTransaction, PaymentSummary, PaymentMethod, PaymentStatus } from "../types";

export function PaymentsManagementPage() {
  const { user } = useAuthStore();
  const { activeBranch, availableBranches } = useBranchStore();
  const queryClient = useQueryClient();

  const isOwnerOrAdmin =
    user?.role?.toLowerCase().includes("owner") ||
    user?.role?.toLowerCase().includes("admin") ||
    user?.role?.toLowerCase().includes("super");

  // Filters state
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [showCollectModal, setShowCollectModal] = useState<boolean>(false);
  const [selectedTxForVerify, setSelectedTxForVerify] = useState<PaymentTransaction | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<string>("");
  const [selectedTxForDispute, setSelectedTxForDispute] = useState<PaymentTransaction | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>("");
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<PaymentTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");

  // Fetch summary
  const { data: summary, refetch: refetchSummary } = useQuery<PaymentSummary>({
    queryKey: ["payments-summary", selectedBranchId],
    queryFn: async () => {
      const res = await apiClient.get<PaymentSummary>("/api/v1/payments/summary", {
        params: selectedBranchId ? { branch_id: selectedBranchId } : {},
      });
      return res.data;
    },
    refetchInterval: 15000,
  });

  // Fetch transactions list
  const { data: transactions, isLoading: isTxLoading, refetch: refetchTx } = useQuery<PaymentTransaction[]>({
    queryKey: ["payments-list", selectedBranchId, statusFilter, methodFilter, searchQuery],
    queryFn: async () => {
      const res = await apiClient.get<PaymentTransaction[]>("/api/v1/payments", {
        params: {
          ...(selectedBranchId ? { branch_id: selectedBranchId } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(methodFilter ? { payment_method: methodFilter } : {}),
          ...(searchQuery ? { search: searchQuery } : {}),
          limit: 100,
        },
      });
      return res.data;
    },
    refetchInterval: 10000,
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return apiClient.post(`/api/v1/payments/${id}/verify`, { reconciliation_notes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments-list"] });
      queryClient.invalidateQueries({ queryKey: ["payments-summary"] });
      setSelectedTxForVerify(null);
      setVerifyNotes("");
    },
  });

  // Dispute mutation
  const disputeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.post(`/api/v1/payments/${id}/dispute`, { dispute_reason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments-list"] });
      queryClient.invalidateQueries({ queryKey: ["payments-summary"] });
      setSelectedTxForDispute(null);
      setDisputeReason("");
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: async ({ id, amount, reason }: { id: string; amount: number; reason: string }) => {
      return apiClient.post(`/api/v1/payments/${id}/refund`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments-list"] });
      queryClient.invalidateQueries({ queryKey: ["payments-summary"] });
      setSelectedTxForRefund(null);
      setRefundAmount("");
      setRefundReason("");
    },
  });

  const getMethodBadge = (m: PaymentMethod) => {
    switch (m) {
      case "CASH":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-mono text-xs">
            <Banknote className="w-3 h-3" /> Cash
          </Badge>
        );
      case "UPI":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 font-mono text-xs">
            <QrCode className="w-3 h-3" /> UPI
          </Badge>
        );
      case "CARD":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 font-mono text-xs">
            <CreditCard className="w-3 h-3" /> Card
          </Badge>
        );
      case "COD":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 font-mono text-xs">
            <Truck className="w-3 h-3" /> COD
          </Badge>
        );
      default:
        return <Badge variant="secondary">{m}</Badge>;
    }
  };

  const getStatusBadge = (s: PaymentStatus) => {
    switch (s) {
      case "VERIFIED":
        return (
          <Badge className="bg-emerald-600 text-white gap-1 text-[11px] font-semibold">
            <ShieldCheck className="w-3 h-3" /> Verified
          </Badge>
        );
      case "REPORTED":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 text-[11px] font-medium">
            <Clock className="w-3 h-3" /> Reported (Unverified)
          </Badge>
        );
      case "DISPUTED":
        return (
          <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
            <AlertTriangle className="w-3 h-3" /> Disputed
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="secondary" className="gap-1 text-[11px]">
            <RotateCcw className="w-3 h-3" /> Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Centralized Payment Ledger & Reconciliation
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Org: Siddeshwar Enterprises
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Multi-branch collections, bank reconciliation, drawer handovers, and discrepancy audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Branch filter for Owner/Admin */}
          {isOwnerOrAdmin && (
            <select
              aria-label="Filter by Branch"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="p-2 border rounded-md text-xs font-semibold bg-background"
            >
              <option value="">All Branches Consolidated</option>
              {(availableBranches || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          )}

          <Button
            onClick={() => setShowCollectModal(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <Plus className="w-4 h-4" /> Record Collection
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Billed Sales</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ₹ {Number(summary?.total_sales || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Invoices + Store customer orders</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified Collections</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              ₹ {Number(summary?.total_verified_collections || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reconciled against bank & drawer cash
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reported (Pending Verification)</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600">
              ₹ {Number(summary?.total_pending_collections || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected by staff, awaiting audit matching
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              ₹ {Number(summary?.outstanding_receivables || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unpaid customer balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Methods Breakdown Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 border rounded-lg">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Collections:
          </div>
          <div className="font-mono font-bold text-base text-foreground">
            ₹ {Number(summary?.cash_reported || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Verified: ₹ {Number(summary?.cash_verified || 0).toFixed(2)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-blue-600" /> UPI QR Collections:
          </div>
          <div className="font-mono font-bold text-base text-foreground">
            ₹ {Number(summary?.upi_reported || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Verified: ₹ {Number(summary?.upi_verified || 0).toFixed(2)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Card Terminal:
          </div>
          <div className="font-mono font-bold text-base text-foreground">
            ₹ {Number(summary?.card_reported || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Verified: ₹ {Number(summary?.card_verified || 0).toFixed(2)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-600" /> COD Delivery Collections:
          </div>
          <div className="font-mono font-bold text-base text-foreground">
            ₹ {Number(summary?.cod_reported || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Verified: ₹ {Number(summary?.cod_verified || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <Card>
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Payment Ledger Transactions
            </CardTitle>
            <CardDescription className="text-xs">
              Every payment collection across all branches with audit history.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-3" />
              <Input
                placeholder="Search Tx #, UTR, remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <select
              aria-label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 border rounded-md text-xs font-medium bg-background h-9"
            >
              <option value="">All Statuses</option>
              <option value="REPORTED">Reported (Unverified)</option>
              <option value="VERIFIED">Verified</option>
              <option value="DISPUTED">Disputed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <select
              aria-label="Filter by Payment Method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="p-1.5 border rounded-md text-xs font-medium bg-background h-9"
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="COD">COD</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchTx();
                refetchSummary();
              }}
              className="h-9 gap-1 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-y text-muted-foreground text-left">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Tx Number & Date</th>
                  <th className="py-2.5 px-3 font-semibold">Branch</th>
                  <th className="py-2.5 px-3 font-semibold">Collector</th>
                  <th className="py-2.5 px-3 font-semibold">Method</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                  <th className="py-2.5 px-3 font-semibold">Reference / UTR</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Reconciliation / Audit</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isTxLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                      Loading centralized payment transactions...
                    </td>
                  </tr>
                ) : !transactions || transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No payment transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold text-foreground">{tx.transaction_number}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                        {tx.order_number && (
                          <div className="text-[10px] text-primary font-mono mt-0.5">
                            Order: {tx.order_number}
                          </div>
                        )}
                        {tx.invoice_number && (
                          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                            Inv: {tx.invoice_number}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-foreground">{tx.branch_name || "Main Branch"}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-foreground">{tx.collector_name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{tx.collector_role}</div>
                      </td>
                      <td className="py-2.5 px-3">{getMethodBadge(tx.payment_method)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-foreground">
                        ₹ {Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {tx.reference_number ? (
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-foreground">
                            {tx.reference_number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">None (Optional)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(tx.status)}</td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {tx.status === "VERIFIED" ? (
                          <div>
                            <span className="text-emerald-600 font-medium">Reconciled by {tx.reconciled_by_name}</span>
                            {tx.reconciliation_notes && (
                              <p className="text-muted-foreground text-[10px] truncate max-w-[180px]">
                                {tx.reconciliation_notes}
                              </p>
                            )}
                          </div>
                        ) : tx.status === "DISPUTED" ? (
                          <div className="text-destructive font-medium truncate max-w-[180px]">
                            Dispute: {tx.dispute_reason}
                          </div>
                        ) : tx.status === "REFUNDED" ? (
                          <span className="text-muted-foreground">Reversal processed</span>
                        ) : (
                          <span className="text-amber-600 italic">Pending bank/cash audit</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {tx.status === "REPORTED" && isOwnerOrAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                                onClick={() => setSelectedTxForVerify(tx)}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30"
                                onClick={() => setSelectedTxForDispute(tx)}
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" /> Dispute
                              </Button>
                            </>
                          )}
                          {tx.status === "VERIFIED" && isOwnerOrAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => {
                                setSelectedTxForRefund(tx);
                                setRefundAmount(String(tx.amount));
                              }}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" /> Refund
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Collection Modal */}
      <PaymentCollectionModal
        isOpen={showCollectModal}
        onClose={() => setShowCollectModal(false)}
        onSuccess={() => {
          refetchTx();
          refetchSummary();
        }}
        defaultBranchId={selectedBranchId || activeBranch?.id}
      />

      {/* Verify / Reconcile Modal */}
      {selectedTxForVerify && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border bg-card">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" /> Reconcile & Verify Payment
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTxForVerify(null)} className="h-6 w-6 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="text-xs">
                Confirm payment {selectedTxForVerify.transaction_number} (₹ {Number(selectedTxForVerify.amount).toFixed(2)}) against bank statement or drawer cash.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 bg-muted rounded-md text-xs space-y-1">
                <div>Branch: <span className="font-bold">{selectedTxForVerify.branch_name}</span></div>
                <div>Collector: <span className="font-bold">{selectedTxForVerify.collector_name} ({selectedTxForVerify.collector_role})</span></div>
                <div>Method: <span className="font-bold">{selectedTxForVerify.payment_method}</span></div>
                <div>Reference: <span className="font-mono">{selectedTxForVerify.reference_number || "None"}</span></div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Reconciliation Remarks (Optional):</label>
                <Input
                  placeholder="e.g. Bank statement entry matched, drawer cash physically verified..."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setSelectedTxForVerify(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={() =>
                    verifyMutation.mutate({
                      id: selectedTxForVerify.id,
                      notes: verifyNotes.trim() || undefined,
                    })
                  }
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? "Verifying..." : "Confirm Verification"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dispute Modal */}
      {selectedTxForDispute && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border bg-card">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" /> Flag Payment Discrepancy
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTxForDispute(null)} className="h-6 w-6 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="text-xs">
                Mark payment {selectedTxForDispute.transaction_number} as disputed.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Reason for Discrepancy (Required):</label>
                <Input
                  placeholder="e.g. Bank statement shows payment bounced, drawer cash shortfall..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="text-xs"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setSelectedTxForDispute(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="font-bold"
                  onClick={() =>
                    disputeMutation.mutate({
                      id: selectedTxForDispute.id,
                      reason: disputeReason.trim(),
                    })
                  }
                  disabled={disputeMutation.isPending || !disputeReason.trim()}
                >
                  {disputeMutation.isPending ? "Flagging..." : "Confirm Dispute"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refund Modal */}
      {selectedTxForRefund && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border bg-card">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <RotateCcw className="w-5 h-5 text-primary" /> Process Payment Refund
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTxForRefund(null)} className="h-6 w-6 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="text-xs">
                Issue financial refund against {selectedTxForRefund.transaction_number} (Max ₹{selectedTxForRefund.amount}).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Refund Amount (₹ INR):</label>
                <Input
                  type="number"
                  step="0.01"
                  max={Number(selectedTxForRefund.amount)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="text-xs font-mono font-bold"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Reason for Refund:</label>
                <Input
                  placeholder="e.g. Customer returned items, duplicate swipe..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setSelectedTxForRefund(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground font-bold"
                  onClick={() =>
                    refundMutation.mutate({
                      id: selectedTxForRefund.id,
                      amount: parseFloat(refundAmount),
                      reason: refundReason.trim(),
                    })
                  }
                  disabled={refundMutation.isPending || !refundReason.trim() || !refundAmount}
                >
                  {refundMutation.isPending ? "Processing..." : "Confirm Refund"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
