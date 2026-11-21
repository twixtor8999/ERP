import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  Truck,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Plus,
  Building2,
  Users,
  Radio,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentCollectionModal } from "@/features/payments/components/PaymentCollectionModal";
import type { PaymentSummary } from "@/features/payments/types";
import type { RealtimeActivityEvent } from "@/lib/realtime/useRealtimeStream";

interface BusinessOwnerDashboardProps {
  branchId?: string;
  liveEvents: RealtimeActivityEvent[];
}

export function BusinessOwnerDashboard({ branchId, liveEvents }: BusinessOwnerDashboardProps) {
  const navigate = useNavigate();
  const { activeBranch } = useBranchStore();

  const [showCollectModal, setShowCollectModal] = useState<boolean>(false);

  // Fetch Consolidated Payment Summary
  const { data: summary, refetch } = useQuery<PaymentSummary>({
    queryKey: ["payments-summary", branchId],
    queryFn: async () => {
      const res = await apiClient.get<PaymentSummary>("/api/v1/payments/summary", {
        params: branchId ? { branch_id: branchId } : {},
      });
      return res.data;
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar for Owner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600/10 via-primary/5 to-transparent border border-emerald-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">
              Business Owner Direct Financial Authority
            </h2>
            <Badge className="bg-emerald-600 text-white font-mono text-xs">OWNER CLEARANCE</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            You can record collections directly for any branch in your organization, review unverified payments, and reconcile cash/UPI receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setShowCollectModal(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
          >
            <Plus className="w-4 h-4" /> Record Direct Collection
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/payments")}
            className="gap-1.5 text-xs font-semibold"
          >
            <Receipt className="w-4 h-4" /> Open Full Ledger
          </Button>
        </div>
      </div>

      {/* Primary Financial Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Billed Revenue */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Billed Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ₹ {Number(summary?.total_sales || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">POS Invoices + Online Store Orders</p>
          </CardContent>
        </Card>

        {/* Verified Collections */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Verified Collections
            </CardTitle>
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

        {/* Reported Unverified Collections */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Reported (Unverified)
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600">
              ₹ {Number(summary?.total_pending_collections || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recorded by staff, pending reconciliation
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outstanding Receivables
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              ₹ {Number(summary?.outstanding_receivables || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Customer balance uncollected</p>
          </CardContent>
        </Card>
      </div>

      {/* Method-Wise Breakdown Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Cash */}
        <Card className="p-3 bg-card border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Collections
            </span>
          </div>
          <div className="font-mono font-bold text-lg text-foreground">
            ₹ {Number(summary?.cash_reported || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground flex justify-between mt-1 pt-1 border-t">
            <span>Verified:</span>
            <span className="font-mono text-emerald-600 font-semibold">
              ₹ {Number(summary?.cash_verified || 0).toFixed(2)}
            </span>
          </div>
        </Card>

        {/* UPI */}
        <Card className="p-3 bg-card border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-600" /> UPI QR Collections
            </span>
          </div>
          <div className="font-mono font-bold text-lg text-foreground">
            ₹ {Number(summary?.upi_reported || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground flex justify-between mt-1 pt-1 border-t">
            <span>Bank Verified:</span>
            <span className="font-mono text-blue-600 font-semibold">
              ₹ {Number(summary?.upi_verified || 0).toFixed(2)}
            </span>
          </div>
        </Card>

        {/* Card */}
        <Card className="p-3 bg-card border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Physical Card Terminal
            </span>
          </div>
          <div className="font-mono font-bold text-lg text-foreground">
            ₹ {Number(summary?.card_reported || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground flex justify-between mt-1 pt-1 border-t">
            <span>Verified:</span>
            <span className="font-mono text-purple-600 font-semibold">
              ₹ {Number(summary?.card_verified || 0).toFixed(2)}
            </span>
          </div>
        </Card>

        {/* COD */}
        <Card className="p-3 bg-card border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-600" /> COD Delivery
            </span>
          </div>
          <div className="font-mono font-bold text-lg text-foreground">
            ₹ {Number(summary?.cod_reported || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground flex justify-between mt-1 pt-1 border-t">
            <span>Verified Handover:</span>
            <span className="font-mono text-amber-600 font-semibold">
              ₹ {Number(summary?.cod_verified || 0).toFixed(2)}
            </span>
          </div>
        </Card>
      </div>

      {/* Discrepancies & Audit Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Discrepancy & Dispute Card */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Disputed Collections & Shortfalls
            </CardTitle>
            <CardDescription className="text-xs">
              Flagged payments with mismatched bank records or cashier drawer discrepancies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Total Disputed Amount:</span>
              <span className="text-xl font-mono font-bold text-destructive">
                ₹ {Number(summary?.total_disputed || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t pt-2">
              <span className="text-xs text-muted-foreground">Refunds & Reversals:</span>
              <span className="text-sm font-mono font-semibold text-foreground">
                ₹ {Number(summary?.total_refunds || 0).toFixed(2)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/payments")}
              className="w-full mt-2 text-xs"
            >
              Audit Disputed Transactions
            </Button>
          </CardContent>
        </Card>

        {/* Quick Shift Discrepancies */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cashier Drawer Settlements
            </CardTitle>
            <CardDescription className="text-xs">
              Physical cash reconciliation across all branch active cashier shifts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Review register closing cash floats, shift notes, and manager sign-offs for all counters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settlements")}
              className="w-full text-xs gap-1.5"
            >
              Open Shift Drawer Settlements <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Branch-Wise Payment Comparison */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Branch-Wise Payment Collection Comparison
            </CardTitle>
            <CardDescription className="text-xs">
              Compare sales vs verified collections and unverified pipeline per branch.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")} className="text-xs gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Report
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-y text-muted-foreground text-left">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Branch Name & Code</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total Billed</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Reported</th>
                  <th className="py-2.5 px-3 font-semibold text-right text-emerald-600">Verified</th>
                  <th className="py-2.5 px-3 font-semibold text-right text-amber-600">Pending</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cash</th>
                  <th className="py-2.5 px-3 font-semibold text-right">UPI QR</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Card</th>
                  <th className="py-2.5 px-3 font-semibold text-right">COD</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!summary?.branch_summaries || summary.branch_summaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-muted-foreground">
                      No branch data found.
                    </td>
                  </tr>
                ) : (
                  summary.branch_summaries.map((b) => (
                    <tr key={b.branch_id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-foreground">{b.branch_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{b.branch_code}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        ₹ {Number(b.total_sales).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹ {Number(b.reported_collections).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">
                        ₹ {Number(b.verified_collections).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                        ₹ {Number(b.pending_collections).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹ {Number(b.cash_total).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹ {Number(b.upi_total).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹ {Number(b.card_total).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹ {Number(b.cod_total).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Collector / Cashier Performance Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Staff & Collector Performance
          </CardTitle>
          <CardDescription className="text-xs">
            Collections recorded by cashiers, branch managers, delivery employees, and business owners.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-y text-muted-foreground text-left">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Collector Name</th>
                  <th className="py-2.5 px-3 font-semibold">Role</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Transactions</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total Collected</th>
                  <th className="py-2.5 px-3 font-semibold text-right text-emerald-600">Verified</th>
                  <th className="py-2.5 px-3 font-semibold text-right text-amber-600">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!summary?.collector_summaries || summary.collector_summaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      No collector data recorded yet.
                    </td>
                  </tr>
                ) : (
                  summary.collector_summaries.map((c) => (
                    <tr key={c.collector_id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-4 font-semibold text-foreground">{c.collector_name}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {c.collector_role}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{c.transaction_count}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                        ₹ {Number(c.total_collected).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                        ₹ {Number(c.verified_amount).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                        ₹ {Number(c.pending_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Real-time System Event Feed */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <CardTitle className="text-base">Live Activity & Financial Event Feed</CardTitle>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {liveEvents.length} events logged
          </Badge>
        </CardHeader>
        <CardContent>
          {liveEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Awaiting real-time payment and order events from WebSocket stream...
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {liveEvents.slice(0, 10).map((ev) => (
                <div
                  key={ev.event_id}
                  className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-foreground font-mono">{ev.type || "ACTIVITY"}</span>
                    <span className="text-muted-foreground">{ev.title}: {ev.message}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Collection Modal */}
      <PaymentCollectionModal
        isOpen={showCollectModal}
        onClose={() => setShowCollectModal(false)}
        onSuccess={() => refetch()}
        defaultBranchId={branchId || activeBranch?.id}
      />
    </div>
  );
}
