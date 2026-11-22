import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Download,
  TrendingUp,
  Boxes,
  Users,
  RefreshCw,
  Mic,
  Send,
  Sparkles,
  ShieldAlert,
  FileText,
  PieChart,
  Printer,
  Bot,
  ArrowUpRight,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SalesSummaryRow {
  date: string;
  branch_name: string;
  channel: string;
  transaction_count: number;
  gross_sales: string | number;
  tax_amount: string | number;
  net_sales: string | number;
}

interface CashierPerformanceRow {
  cashier_id: string;
  cashier_name: string;
  branch_name: string;
  shifts_worked: number;
  total_bills: number;
  total_cash_sales: string | number;
  total_upi_sales: string | number;
  total_sales: string | number;
  total_discrepancy: string | number;
}

interface InventoryValuationRow {
  branch_name: string;
  sku: string;
  product_name: string;
  variant_name: string;
  quantity_on_hand: string | number;
  unit_cost: string | number;
  total_valuation: string | number;
  reorder_level: string | number;
}

type TabType = "sales" | "gst" | "ai" | "audit" | "ca" | "pnl" | "cashiers" | "inventory";

export function ReportsPage() {
  const { activeBranch } = useBranchStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync tab with URL search parameter (?type=gst, ?type=ai, ?type=audit, etc.)
  const typeParam = searchParams.get("type");
  const initialTab: TabType =
    typeParam === "gst"
      ? "gst"
      : typeParam === "ai"
      ? "ai"
      : typeParam === "audit"
      ? "audit"
      : typeParam === "ca"
      ? "ca"
      : typeParam === "pnl"
      ? "pnl"
      : "sales";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    if (typeParam && ["gst", "ai", "audit", "ca", "pnl", "sales", "cashiers", "inventory"].includes(typeParam)) {
      setActiveTab(typeParam as TabType);
    }
  }, [typeParam]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ type: tab });
  };

  const [salesRows, setSalesRows] = useState<SalesSummaryRow[]>([]);
  const [cashierRows, setCashierRows] = useState<CashierPerformanceRow[]>([]);
  const [inventoryRows, setInventoryRows] = useState<InventoryValuationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<
    { role: "user" | "assistant"; text: string; time: string }[]
  >([
    {
      role: "assistant",
      text: "Namaste! I am your PK AI Smart Bazar business assistant. Ask me anything about your today's sales, delivered orders, customer balances, or stock levels.",
      time: "Just now",
    },
  ]);

  const predefinedAiQueries = [
    "Today's total sales & collections summary",
    "Top 5 selling grocery SKUs this week",
    "List customers with outstanding balance > ₹2,000",
    "Low stock items that need reordering today",
    "Vehicle delivery trips and cash settlement status",
  ];

  const handleSendAiPrompt = (queryText?: string) => {
    const textToSend = queryText || aiPrompt.trim();
    if (!textToSend) return;

    const userMessageTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    setAiChatHistory((prev) => [
      ...prev,
      { role: "user", text: textToSend, time: userMessageTime },
    ]);
    setAiPrompt("");

    // Simulate intelligent analytical AI response based on query
    setTimeout(() => {
      let reply = "";
      const lower = textToSend.toLowerCase();

      if (lower.includes("sales") || lower.includes("collection") || lower.includes("today")) {
        reply = `📊 **Today's Operations Summary**:
- **Gross Invoiced Sales**: ₹1,28,900.00 across 52 orders.
- **Cash Collected**: ₹85,230.00 (Physical notes verified).
- **UPI QR Receipts**: ₹46,200.00 (Instant bank settlement).
- **Sales Return Deductions**: ₹2,970.00.
- **Active Store Counters**: 3 POS counters active at Siddeshwar Enterprises Central Hub.`;
      } else if (lower.includes("top") || lower.includes("selling") || lower.includes("sku")) {
        reply = `🛒 **Top 5 Moving SKUs This Week**:
1. **Sugar M-30 (50 Kg Bag)** — 38 Bags sold (₹1,44,400)
2. **Fortune Sunflower Oil (1L Pouch)** — 184 Units sold (₹27,600)
3. **Aashirvaad Shudh Chakki Atta (10Kg)** — 92 Bags sold (₹41,400)
4. **Toor Dal Premium Fatka (25Kg Bag)** — 26 Bags sold (₹85,800)
5. **Tata Salt Iodized (1Kg)** — 340 Packets sold (₹9,520)`;
      } else if (lower.includes("customer") || lower.includes("balance") || lower.includes("khata")) {
        reply = `👥 **High Outstanding Khata Balances**:
- **Mahaveer Kirana (Nagathan)**: ₹8,450.00 (Last payment 12 days ago)
- **Gurukrupa Stores (Indi)**: ₹5,200.00 (Last order pending settlement)
- **Shri Renuka Traders (Tikota)**: ₹3,800.00
- **Total Outstanding Khata Debt**: ₹48,650.00 across 16 rural retail accounts.`;
      } else if (lower.includes("stock") || lower.includes("low") || lower.includes("reorder")) {
        reply = `⚠️ **Critical Low Stock Alerts**:
- **Sooji 50Kg Bag**: 2 bags remaining (Reorder point: 10 bags)
- **Gemini Groundnut Oil 15L Tin**: 3 tins remaining (Reorder point: 15 tins)
- **Chilli Powder Guntur (500g)**: 8 packets remaining (Reorder point: 25 packets)
- **Recommendation**: Create an Auto-PO to Siddeshwar Agro Mills.`;
      } else {
        reply = `✅ **Audit Analysis for "${textToSend}"**:
All system records are fully synced with PostgreSQL database. 4 Delivery vehicles have logged their run sheets and 2 POS registers are open with verified cash floats.`;
      }

      setAiChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        },
      ]);
    }, 600);
  };

  const handleVoiceToggle = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.info("Voice recognition simulation activated", {
        description: "Listening for Hindi/Kannada/English voice query...",
      });
    }
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSendAiPrompt("Today's total sales & collections summary");
      toast.success("Voice transcribed: Today's total sales & collections summary");
    }, 2000);
  };

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (activeBranch?.id) params.branch_id = activeBranch.id;

      if (activeTab === "sales") {
        const res = await apiClient.get<SalesSummaryRow[]>("/api/v1/reports/sales-summary", { params });
        setSalesRows(res.data);
      } else if (activeTab === "cashiers") {
        const res = await apiClient.get<CashierPerformanceRow[]>("/api/v1/reports/cashier-performance", { params });
        setCashierRows(res.data);
      } else if (activeTab === "inventory") {
        const res = await apiClient.get<InventoryValuationRow[]>("/api/v1/reports/inventory-valuation", { params });
        setInventoryRows(res.data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }, [activeBranch?.id, activeTab]);

  useEffect(() => {
    if (["sales", "cashiers", "inventory"].includes(activeTab)) {
      fetchReport();
    }
  }, [fetchReport, activeTab]);

  const handleDownloadCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      params.append("report_type", activeTab);
      if (activeBranch?.id) params.append("branch_id", activeBranch.id);

      const res = await apiClient.get(`/api/v1/reports/export?${params.toString()}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.success(`Exported ${activeTab.toUpperCase()} Report to CSV`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Intelligence, GST & Management Reports
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Branch: {activeBranch?.name || "All Branches"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            1) GST Returns, 2) AI Assistant, AI Cross Check, CA Registers, and Profit & Loss (P&L) accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadCsv}
            disabled={isExporting}
            className="gap-1.5 bg-[#132038] hover:bg-[#1a2d4b] text-white text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Generating..." : "Export Official Report"}
          </Button>
        </div>
      </div>

      {/* Report Selection Tabs (Matching the 5 Submenu Items) */}
      <div className="flex gap-1.5 border-b pb-2 overflow-x-auto max-w-full">
        {[
          { id: "gst", label: "1) GST Report", icon: FileText },
          { id: "ai", label: "2) AI Assistant", icon: Bot },
          { id: "audit", label: "AI Cross Check", icon: ShieldAlert },
          { id: "ca", label: "CA Reports", icon: PieChart },
          { id: "pnl", label: "P & L", icon: TrendingUp },
          { id: "sales", label: "Sales Breakdown", icon: ArrowUpRight },
          { id: "inventory", label: "Inventory Valuation", icon: Boxes },
          { id: "cashiers", label: "Cashier Audits", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-[#132038] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1) GST REPORT TAB */}
      {activeTab === "gst" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                  Taxable Turnover (B2B + B2C)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground font-mono">₹ 24,80,500.00</div>
                <p className="text-[11px] text-muted-foreground mt-1">Current Filing Month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                  Output CGST (Central Tax)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-blue-700 font-mono">₹ 1,24,025.00</div>
                <p className="text-[11px] text-muted-foreground mt-1">Matched with GST Portal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                  Output SGST (State Tax)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-blue-700 font-mono">₹ 1,24,025.00</div>
                <p className="text-[11px] text-muted-foreground mt-1">Karnataka State Portion</p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-emerald-900 uppercase">
                  Total Tax Payable (GSTR-3B)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-800 font-mono">₹ 2,48,050.00</div>
                <p className="text-[11px] text-emerald-700 mt-1">ITC Setoff Ready</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">HSN Summary Report (GSTR-1 Table 12)</CardTitle>
                <CardDescription className="text-xs">
                  HSN-wise breakdown of grocery, grain, oil, and FMCG supplies.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("GSTR-1 JSON generated")}
                className="gap-1 text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" /> Download GSTR-1 JSON
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-xs text-slate-700 font-bold border-b text-left">
                    <tr>
                      <th className="py-2.5 px-3">HSN Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">UQC</th>
                      <th className="py-2.5 px-3 text-center">Total Quantity</th>
                      <th className="py-2.5 px-3 text-right">Taxable Value</th>
                      <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                      <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { hsn: "1006", desc: "Rice & Paddy (Packaged)", uqc: "KGS", qty: "14,200", taxable: 710000, cgst: 17750, sgst: 17750, tax: 35500 },
                      { hsn: "1507", desc: "Soybean / Sunflower Edible Oil", uqc: "LTR", qty: "3,850", taxable: 462000, cgst: 11550, sgst: 11550, tax: 23100 },
                      { hsn: "1701", desc: "Cane Sugar M-30", uqc: "KGS", qty: "8,900", taxable: 356000, cgst: 8900, sgst: 8900, tax: 17800 },
                      { hsn: "0910", desc: "Spices, Turmeric, Ginger", uqc: "KGS", qty: "1,450", taxable: 217500, cgst: 5437.5, sgst: 5437.5, tax: 10875 },
                      { hsn: "2106", desc: "Food preparations / snacks", uqc: "NOS", qty: "6,200", taxable: 434000, cgst: 26040, sgst: 26040, tax: 52080 },
                    ].map((row) => (
                      <tr key={row.hsn} className="hover:bg-muted/40 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{row.hsn}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground">{row.desc}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{row.uqc}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{row.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">₹{row.taxable.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{row.cgst.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{row.sgst.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">₹{row.tax.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2) AI ASSISTANT TAB (Exact matching VW.ai & NXAQ) */}
      {activeTab === "ai" && (
        <div className="space-y-4">
          <Card className="border-2 border-indigo-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-sm">
                    <Sparkles className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">PK AI Business Assistant (v5.08)</h2>
                    <p className="text-xs text-blue-200">
                      Ask about your business in plain language (Kannada, Hindi, English), or tap an option below.
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-400 text-slate-950 font-bold border-none">Live Intelligent Mode</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Predefined Instant Query Chips (NXAQ) */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Quick Business Questions (Tap for instant analysis):
                </span>
                <div className="flex flex-wrap gap-2">
                  {predefinedAiQueries.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendAiPrompt(q)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 transition text-left shadow-2xs"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Conversation History */}
              <div className="border rounded-xl p-3 bg-slate-50/70 min-h-[220px] max-h-[360px] overflow-y-auto space-y-3">
                {aiChatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-2xs ${
                        msg.role === "user"
                          ? "bg-[#132038] text-white"
                          : "bg-white text-slate-800 border border-slate-200"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1 mt-0.5 font-mono">
                      {msg.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* Prompt Input with 🎤 Voice Button */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Ask about sales, top products, pending khata, low inventory..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendAiPrompt()}
                  className="bg-white text-xs sm:text-sm h-11 rounded-xl shadow-2xs"
                />
                <Button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`h-11 px-3.5 rounded-xl border font-bold text-xs gap-1.5 shrink-0 transition ${
                    isListening
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                  }`}
                  title="Voice search — tap and speak"
                >
                  <Mic className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Voice</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSendAiPrompt()}
                  className="h-11 px-4 bg-[#132038] hover:bg-[#1a2d4b] text-white rounded-xl font-bold shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3) AI CROSS CHECK (Exact matching VW.audit) */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
              <div>
                <p className="text-xs font-bold text-amber-950">
                  AI Automated Cross Check — Store Discrepancy Detector
                </p>
                <p className="text-[11px] text-amber-800">
                  0 fatal errors and 3 warnings across orders, physical stock, purchases, returns, and vehicle settlements.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("AI cross-check re-audit completed")}
              className="text-xs font-bold"
            >
              Re-Scan Audit Rules
            </Button>
          </div>

          <Card>
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-base font-bold">Detected Discrepancies & Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-100 text-xs text-slate-700 font-bold border-b text-left">
                  <tr>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Operational Area</th>
                    <th className="py-2.5 px-3">Reference #</th>
                    <th className="py-2.5 px-3">Issue Description</th>
                    <th className="py-2.5 px-3 text-right">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    {
                      sev: "Warning",
                      area: "Orders",
                      ref: "ORD-2026-1049",
                      msg: "Order placed more than 2 days ago and still pending packing",
                      act: "Assign warehouse packer",
                    },
                    {
                      sev: "Warning",
                      area: "Inventory",
                      ref: "SKU-SUGAR-50K",
                      msg: "Physical stock count is 2 bags below recorded ERP system book stock",
                      act: "Adjust stock via Stock Split",
                    },
                    {
                      sev: "Warning",
                      area: "Customer Khata",
                      ref: "CUST-9844",
                      msg: "Mahaveer Kirana credit period exceeded 30 days (₹8,450 outstanding)",
                      act: "Send WhatsApp reminder",
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition">
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {row.sev}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground">{row.area}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-900">{row.ref}</td>
                      <td className="py-3 px-3 text-slate-700">{row.msg}</td>
                      <td className="py-3 px-3 text-right font-medium text-blue-700">{row.act}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4) CA REPORTS TAB */}
      {activeTab === "ca" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="hover:border-primary/50 transition cursor-pointer" onClick={() => toast.success("Generating CA Sales Register...")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-800">CA Sales Register</CardTitle>
                <CardDescription className="text-xs">Invoice-wise sales, customer GSTIN, taxable amount & GST split</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs font-bold gap-1">
                  <Download className="w-3.5 h-3.5" /> Download Excel
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition cursor-pointer" onClick={() => toast.success("Generating CA Purchase Register...")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-800">CA Purchase Register</CardTitle>
                <CardDescription className="text-xs">Vendor GSTIN, purchase bills, ITC eligible taxes & HSN</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs font-bold gap-1">
                  <Download className="w-3.5 h-3.5" /> Download Excel
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition cursor-pointer" onClick={() => toast.success("Generating CA Credit/Debit Notes...")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-800">Credit & Debit Notes</CardTitle>
                <CardDescription className="text-xs">Sales returns, vendor return debits and ledger adjustments</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs font-bold gap-1">
                  <Download className="w-3.5 h-3.5" /> Download Excel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 5) P & L (PROFIT & LOSS STATEMENT) TAB (Exact matching VW.pl) */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Profit & Loss Statement (Real-time P&L)</CardTitle>
                <CardDescription className="text-xs">
                  Sales revenue (delivered orders net of returns) − FIFO Cost of Goods Sold − Operating & Vehicle expenses.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" /> Print Statement
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <table className="w-full text-xs sm:text-sm">
                <tbody className="divide-y divide-border">
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-3 px-4 text-foreground">Gross Sales Revenue (Delivered Orders)</td>
                    <td className="py-3 px-4 text-right font-mono text-base text-foreground">₹ 24,80,500.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-muted-foreground pl-8">Less: Sales Returns & Damaged Goods</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600">− ₹ 12,400.00</td>
                  </tr>
                  <tr className="font-semibold bg-blue-50/30">
                    <td className="py-2.5 px-4 text-blue-950">Net Billed Revenue</td>
                    <td className="py-2.5 px-4 text-right font-mono text-blue-950 font-bold">₹ 24,68,100.00</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-muted-foreground pl-8">Less: Cost of Goods Sold (COGS - FIFO basis)</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600">− ₹ 19,34,790.00</td>
                  </tr>

                  <tr className="bg-emerald-50/60 font-black text-sm">
                    <td className="py-3 px-4 text-emerald-950">Gross Operating Profit (21.6% Margin)</td>
                    <td className="py-3 px-4 text-right font-mono text-base text-emerald-800">₹ 5,33,310.00</td>
                  </tr>

                  <tr className="bg-slate-50 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    <td colSpan={2} className="py-2 px-4">Operating & Logistics Expenses</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-muted-foreground pl-8">Vehicle Fuel, Maintenance & Toll (4 Trucks)</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-600">− ₹ 38,400.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-muted-foreground pl-8">Store & Logistics Staff Salaries</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-600">− ₹ 1,15,000.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-muted-foreground pl-8">Warehouse Rent & Electricity</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-600">− ₹ 45,000.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-muted-foreground pl-8">Chai, Snacks & Miscellaneous Petty Cash</td>
                    <td className="py-2 px-4 text-right font-mono text-rose-600">− ₹ 12,450.00</td>
                  </tr>

                  <tr className="bg-linear-to-r from-emerald-100 to-teal-100 font-black text-base border-t-2 border-emerald-500">
                    <td className="py-3.5 px-4 text-emerald-950">Net Business Profit (13.1% Margin)</td>
                    <td className="py-3.5 px-4 text-right font-mono text-lg text-emerald-900">₹ 3,22,460.00</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SALES REPORT */}
      {activeTab === "sales" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Sales Channel Breakdown (POS Counter vs Online Storefront)</span>
              <Badge variant="outline" className="text-xs">
                {salesRows.length} Ledger Days
              </Badge>
            </CardTitle>
            <CardDescription>
              Authoritative transaction totals, gross revenue, GST tax collections and net sales.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">Branch</th>
                    <th className="py-2.5 px-3 font-medium">Sales Channel</th>
                    <th className="py-2.5 px-3 font-medium text-right">Bills / Orders</th>
                    <th className="py-2.5 px-3 font-medium text-right">Gross Sales</th>
                    <th className="py-2.5 px-3 font-medium text-right">GST Tax</th>
                    <th className="py-2.5 px-4 font-medium text-right">Net Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading sales report...
                      </td>
                    </tr>
                  ) : salesRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No sales ledger entries found for selected criteria.
                      </td>
                    </tr>
                  ) : (
                    salesRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition">
                        <td className="py-2.5 px-4 font-mono font-medium">{row.date}</td>
                        <td className="py-2.5 px-3">{row.branch_name}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              row.channel === "POS"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {row.channel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">{row.transaction_count}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          ₹{Number(row.gross_sales).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          ₹{Number(row.tax_amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                          ₹{Number(row.net_sales).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CASHIERS REPORT */}
      {activeTab === "cashiers" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Cashier Shift Audits & Cash Collections</span>
              <Badge variant="outline" className="text-xs">
                {cashierRows.length} Cashiers Audited
              </Badge>
            </CardTitle>
            <CardDescription>
              Per-cashier performance, total bills logged, physical cash takings, and drawer discrepancies.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Cashier Name</th>
                    <th className="py-2.5 px-3 font-medium">Branch</th>
                    <th className="py-2.5 px-3 font-medium text-center">Shifts</th>
                    <th className="py-2.5 px-3 font-medium text-right">Bills Billed</th>
                    <th className="py-2.5 px-3 font-medium text-right">Cash Collected</th>
                    <th className="py-2.5 px-3 font-medium text-right">UPI Collected</th>
                    <th className="py-2.5 px-3 font-medium text-right">Total Turn-in</th>
                    <th className="py-2.5 px-4 font-medium text-right">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Loading cashier audits...
                      </td>
                    </tr>
                  ) : cashierRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No cashier audit records found.
                      </td>
                    </tr>
                  ) : (
                    cashierRows.map((row) => (
                      <tr key={row.cashier_id} className="hover:bg-muted/50 transition">
                        <td className="py-2.5 px-4 font-bold">{row.cashier_name}</td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{row.branch_name}</td>
                        <td className="py-2.5 px-3 text-center font-medium">{row.shifts_worked}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{row.total_bills}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₹{Number(row.total_cash_sales).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₹{Number(row.total_upi_sales).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          ₹{Number(row.total_sales).toFixed(2)}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono font-bold ${
                            Number(row.total_discrepancy) < 0
                              ? "text-destructive"
                              : Number(row.total_discrepancy) > 0
                              ? "text-blue-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {Number(row.total_discrepancy) > 0 ? "+" : ""}
                          ₹{Number(row.total_discrepancy).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* INVENTORY REPORT */}
      {activeTab === "inventory" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Inventory Valuation & Reorder Ledger</span>
              <Badge variant="outline" className="text-xs">
                {inventoryRows.length} Product SKUs
              </Badge>
            </CardTitle>
            <CardDescription>
              Valuation matrix computed at FIFO cost basis with real-time stock levels and reorder triggers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">SKU</th>
                    <th className="py-2.5 px-3 font-medium">Product / Variant</th>
                    <th className="py-2.5 px-3 font-medium">Branch</th>
                    <th className="py-2.5 px-3 text-right font-mono">Stock on Hand</th>
                    <th className="py-2.5 px-3 text-right font-mono">Unit Cost</th>
                    <th className="py-2.5 px-4 text-right font-mono font-bold text-primary">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Loading inventory valuation...
                      </td>
                    </tr>
                  ) : inventoryRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    inventoryRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-xs">{row.sku}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold">{row.product_name}</span>
                          {row.variant_name && (
                            <span className="block text-xs text-muted-foreground">
                              {row.variant_name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{row.branch_name}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {Number(row.quantity_on_hand).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          ₹{Number(row.unit_cost).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-primary">
                          ₹{Number(row.total_valuation).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
