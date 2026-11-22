import { useState, useEffect, useCallback, useId, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PlaceOrderWholesaleView } from "../components/PlaceOrderWholesaleView";
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ShoppingBag,
  RefreshCw,
  X,
  CreditCard,
  Banknote,
  BookOpen,
  Calculator,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ProductLookupItem {
  variant_id: string;
  sku: string;
  barcode?: string;
  product_name: string;
  variant_name: string;
  price: string | number;
  available_quantity: string | number;
  tax_rate: string | number;
}

interface CartItem extends ProductLookupItem {
  qty: number;
}

interface CashierShift {
  id: string;
  shift_number: string;
  status: string;
  opened_at: string;
  closed_at?: string;
  opening_float: string | number;
  cash_sales: string | number;
  upi_sales: string | number;
  total_sales: string | number;
  expected_cash: string | number;
  closing_cash?: string | number;
  discrepancy?: string | number;
}

interface InvoiceResult {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  branch_id: string;
  branch_name?: string;
  cashier_name: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: string | number;
  tax_amount: string | number;
  cash_paid: string | number;
  upi_paid: string | number;
  card_paid?: string | number;
  khata_amount?: string | number;
  balance_amount?: string | number;
  customer_current_balance?: string | number;
  payment_method?: string;
  items: Array<{
    variant_id: string;
    product_name: string;
    sku: string;
    quantity: string | number;
    unit_price: string | number;
    tax_rate: string | number;
    total: string | number;
  }>;
}

export function PosBillingPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  // Default to wholesale Place Order view matching Siddeshwar Enterprises reference app
  if (mode !== "counter" && mode !== "cashier") {
    return <PlaceOrderWholesaleView />;
  }

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeSearchId = useId();
  const customerNameId = useId();
  const customerPhoneId = useId();
  const cashAmountId = useId();
  const openingFloatId = useId();
  const countedCashId = useId();
  const shiftNotesId = useId();

  const { activeBranch } = useBranchStore();

  const [currentShift, setCurrentShift] = useState<CashierShift | null>(null);
  const [isShiftLoading, setIsShiftLoading] = useState(true);

  // Modals
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState("2000.00");
  const [closingCashInput, setClosingCashInput] = useState("");
  const [closingNotesInput, setClosingNotesInput] = useState("");
  const [useDenominations, setUseDenominations] = useState(true);
  const [denominations, setDenominations] = useState<Record<string, number>>({
    "500": 0,
    "200": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
    "5": 0,
    "2": 0,
    "1": 0,
  });

  // Thermal Print Width (58mm 2-inch vs 80mm 3-inch)
  const [thermalWidth, setThermalWidth] = useState<"58mm" | "80mm">("80mm");

  // Product search & Cart
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductLookupItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer & Khata lookup
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerKhataBalance, setCustomerKhataBalance] = useState<number | null>(null);
  const [isCustomerSearching, setIsCustomerSearching] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD" | "KHATA" | "SPLIT">("CASH");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [upiAmount, setUpiAmount] = useState<string>("");
  const [cardAmount, setCardAmount] = useState<string>("");
  const [khataAmount, setKhataAmount] = useState<string>("");
  const [upiReference, setUpiReference] = useState<string>("");
  const [cardReference, setCardReference] = useState<string>("");

  // Invoice output modal
  const [completedInvoice, setCompletedInvoice] = useState<InvoiceResult | null>(null);
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCurrentShift = useCallback(async () => {
    try {
      setIsShiftLoading(true);
      const res = await apiClient.get<CashierShift | null>("/api/v1/pos/shifts/current");
      setCurrentShift(res.data);
    } catch {
      setCurrentShift(null);
    } finally {
      setIsShiftLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  // Fast barcode lookup
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await apiClient.get<ProductLookupItem[]>("/api/v1/pos/products/lookup", {
        params: {
          q: query.trim(),
          branch_id: activeBranch?.id,
        },
      });
      setSearchResults(res.data);

      // Auto add if exact 1 result barcode match
      const first = res.data[0];
      if (res.data.length === 1 && first && (first.barcode === query.trim() || first.sku === query.trim())) {
        addToCart(first);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-focus barcode input on load, cart update, and modal dismiss
  useEffect(() => {
    if (!showOpenShiftModal && !showCloseShiftModal && !completedInvoice) {
      const timer = setTimeout(() => barcodeInputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [showOpenShiftModal, showCloseShiftModal, completedInvoice, cart.length]);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        addToCart(searchResults[0]!);
      } else if (searchQuery.trim()) {
        handleSearch(searchQuery);
      }
    }
  };

  const addToCart = (product: ProductLookupItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variant_id === product.variant_id);
      if (existing) {
        return prev.map((i) =>
          i.variant_id === product.variant_id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setSearchQuery("");
    setSearchResults([]);
    setTimeout(() => barcodeInputRef.current?.focus(), 40);
  };

  const updateCartQty = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id === variantId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variant_id !== variantId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const price = Number(item.price);
    const taxRate = Number(item.tax_rate) / 100;
    const itemSubtotal = (price / (1 + taxRate)) * item.qty;
    return acc + itemSubtotal;
  }, 0);

  const total = cart.reduce((acc, item) => acc + Number(item.price) * item.qty, 0);
  const taxAmount = total - subtotal;

  // Auto-fill cash when cart changes if no manual input yet
  useEffect(() => {
    if (cart.length > 0 && !cashAmount && !upiAmount) {
      setCashAmount(total.toFixed(2));
    } else if (cart.length === 0) {
      setCashAmount("");
      setUpiAmount("");
    }
  }, [total, cart.length, cashAmount, upiAmount]);

  const handleOpenShift = async () => {
    try {
      setErrorMessage(null);
      await apiClient.post("/api/v1/pos/shifts/open", {
        opening_float: parseFloat(openingFloatInput) || 0,
        branch_id: activeBranch?.id,
      });
      setShowOpenShiftModal(false);
      fetchCurrentShift();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(errorObj?.response?.data?.detail || "Failed to open shift.");
    }
  };

  const calculatedCountedCash = useDenominations
    ? (denominations["500"] || 0) * 500 +
      (denominations["200"] || 0) * 200 +
      (denominations["100"] || 0) * 100 +
      (denominations["50"] || 0) * 50 +
      (denominations["20"] || 0) * 20 +
      (denominations["10"] || 0) * 10 +
      (denominations["5"] || 0) * 5 +
      (denominations["2"] || 0) * 2 +
      (denominations["1"] || 0) * 1
    : parseFloat(closingCashInput) || 0;

  const handleCloseShift = async () => {
    if (!currentShift) return;
    try {
      setErrorMessage(null);
      await apiClient.post("/api/v1/pos/shifts/close", {
        closing_cash: calculatedCountedCash,
        actual_counted_cash: calculatedCountedCash,
        notes: closingNotesInput,
        denominations: useDenominations ? denominations : undefined,
      });
      setShowCloseShiftModal(false);
      setCurrentShift(null);
      fetchCurrentShift();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(errorObj?.response?.data?.detail || "Failed to close shift.");
    }
  };

  const lookupCustomerByPhone = async (phone: string) => {
    setCustomerPhone(phone);
    const cleaned = phone.trim();
    if (cleaned.length >= 4) {
      try {
        setIsCustomerSearching(true);
        const res = await apiClient.get<Array<{
          id: string;
          name: string;
          phone: string;
          current_balance: string | number;
        }>>("/api/v1/pos/customers/lookup", {
          params: { q: cleaned },
        });
        const match = res.data?.[0];
        if (match) {
          if (!customerName || customerName === "Walk-in Customer") {
            setCustomerName(match.name);
          }
          setCustomerKhataBalance(Number(match.current_balance));
        } else {
          setCustomerKhataBalance(0);
        }
      } catch {
        setCustomerKhataBalance(null);
      } finally {
        setIsCustomerSearching(false);
      }
    } else {
      setCustomerKhataBalance(null);
    }
  };

  const handleCheckoutInvoice = async () => {
    if (cart.length === 0) {
      setErrorMessage("Cart is empty.");
      return;
    }

    let cash = 0;
    let upi = 0;
    let card = 0;
    let khata = 0;

    if (paymentMode === "CASH") {
      cash = parseFloat(cashAmount) || total;
      if (cash < total) {
        setErrorMessage(`Cash tendered (₹${cash.toFixed(2)}) cannot be less than bill total (₹${total.toFixed(2)})`);
        return;
      }
    } else if (paymentMode === "UPI") {
      upi = total;
    } else if (paymentMode === "CARD") {
      card = total;
    } else if (paymentMode === "KHATA") {
      if (!customerPhone.trim() && !customerName.trim()) {
        setErrorMessage("Customer name or mobile number is required for Khata (Udhaar) billing.");
        return;
      }
      khata = total;
    } else {
      cash = parseFloat(cashAmount) || 0;
      upi = parseFloat(upiAmount) || 0;
      card = parseFloat(cardAmount) || 0;
      khata = parseFloat(khataAmount) || 0;
      if (khata > 0 && !customerPhone.trim() && !customerName.trim()) {
        setErrorMessage("Customer mobile number is required when allocating amount to Khata (Udhaar).");
        return;
      }
      if (Math.abs(cash + upi + card + khata - total) > 0.05) {
        setErrorMessage(
          `Total split payment (₹${(cash + upi + card + khata).toFixed(2)}) must equal bill total (₹${total.toFixed(2)})`
        );
        return;
      }
    }

    try {
      setIsSubmittingBill(true);
      setErrorMessage(null);
      const res = await apiClient.post<InvoiceResult>("/api/v1/pos/invoices", {
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        cash_paid: cash,
        cash_tendered: cash,
        upi_paid: upi,
        upi_reference: upiReference.trim() || undefined,
        card_paid: card,
        card_reference: cardReference.trim() || undefined,
        khata_amount: khata,
        payment_method: paymentMode,
        items: cart.map((i) => ({
          variant_id: i.variant_id,
          quantity: i.qty,
        })),
      });

      setCompletedInvoice(res.data);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerKhataBalance(null);
      setCashAmount("");
      setUpiAmount("");
      setCardAmount("");
      setKhataAmount("");
      setUpiReference("");
      setCardReference("");
      fetchCurrentShift();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(errorObj?.response?.data?.detail || "Failed to submit invoice.");
    } finally {
      setIsSubmittingBill(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Shift Status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">POS Counter Billing Terminal</h1>
            <Badge variant="outline" className="font-mono text-xs">
              Branch: {activeBranch?.name || "Main Branch"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Fast barcode scanning, cashier drawer management & instant receipt printing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isShiftLoading ? (
            <Badge variant="secondary" className="gap-1.5 py-1">
              <Clock className="w-3.5 h-3.5 animate-spin" /> Checking shift...
            </Badge>
          ) : currentShift ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1.5 py-1 px-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> Shift: {currentShift.shift_number} (Active)
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setClosingCashInput(String(currentShift.expected_cash));
                  setShowCloseShiftModal(true);
                }}
              >
                Close Drawer / Shift
              </Button>
            </div>
          ) : (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowOpenShiftModal(true)}
            >
              <DollarSign className="w-4 h-4" /> Open Cashier Shift
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Main POS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Barcode scan & Cart (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Barcode & SKU Fast Search
              </CardTitle>
              <CardDescription>
                Scan product barcode or type SKU / product name to instantly add to cart.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <label htmlFor={barcodeSearchId} className="sr-only">Barcode or SKU Search</label>
                <Input
                  ref={barcodeInputRef}
                  id={barcodeSearchId}
                  placeholder="Scan barcode or type SKU (e.g. DAL-TUR-1KG)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  className="font-mono text-base pr-10"
                  autoFocus
                />
                {isSearching && (
                  <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground absolute right-3 top-3" />
                )}
              </div>

              {/* Live search dropdown results */}
              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-56 overflow-y-auto bg-card shadow-sm">
                  {searchResults.map((p) => (
                    <div
                      key={p.variant_id}
                      onClick={() => addToCart(p)}
                      className="p-2.5 hover:bg-muted/50 cursor-pointer flex items-center justify-between text-sm transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {p.product_name} <span className="text-xs text-muted-foreground">({p.variant_name})</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          SKU: {p.sku} | Barcode: {p.barcode || "N/A"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">₹ {Number(p.price).toFixed(2)}</div>
                        <div className="text-xs text-emerald-600">Stock: {p.available_quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart Table */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" /> Active Cart ({cart.length} items)
                </CardTitle>
                <CardDescription>Review quantities and pricing before billing.</CardDescription>
              </div>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-destructive h-8 px-2 text-xs">
                  Clear Cart
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No products in counter cart. Scan a barcode above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                      <tr>
                        <th className="py-2.5 px-4 font-medium">Item & SKU</th>
                        <th className="py-2.5 px-3 font-medium text-center">Qty</th>
                        <th className="py-2.5 px-3 font-medium text-right">Price</th>
                        <th className="py-2.5 px-3 font-medium text-right">Total</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cart.map((item) => (
                        <tr key={item.variant_id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-foreground">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => updateCartQty(item.variant_id, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="font-bold w-6 text-center">{item.qty}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => updateCartQty(item.variant_id, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">₹ {Number(item.price).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            ₹ {(Number(item.price) * item.qty).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(item.variant_id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Payment & Summary (5 cols - Compact & Sticky) */}
        <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="py-2.5 px-4 bg-muted/20 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Bill Summary</span>
                <span className="text-xl font-bold font-mono text-primary">₹ {total.toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {/* Financial Breakup */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono">₹ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST Amount (CGST+SGST):</span>
                  <span className="font-mono">₹ {taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t pt-1.5 text-foreground">
                  <span>Total Payable:</span>
                  <span className="font-mono text-primary">₹ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Info & Live Khata Lookup */}
              <div className="border-t pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Customer & Khata (Udhaar)
                  </span>
                  {isCustomerSearching ? (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Checking Khata...
                    </span>
                  ) : customerKhataBalance !== null ? (
                    customerKhataBalance > 0 ? (
                      <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-mono font-bold animate-pulse">
                        🔴 Pending Udhaar: ₹ {customerKhataBalance.toFixed(2)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono text-emerald-600 bg-emerald-50 border-emerald-200">
                        🟢 Khata Clear: ₹ 0.00
                      </Badge>
                    )
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id={customerNameId}
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Input
                    id={customerPhoneId}
                    placeholder="Mobile (10 digits)"
                    value={customerPhone}
                    onChange={(e) => lookupCustomerByPhone(e.target.value)}
                    className="text-xs font-mono h-8"
                  />
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="border-t pt-2 space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Select Tender Mode
                </span>
                <div className="grid grid-cols-5 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMode === "CASH" ? "default" : "outline"}
                    className={`h-8 text-[11px] px-1 gap-1 font-semibold ${
                      paymentMode === "CASH" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                    }`}
                    onClick={() => {
                      setPaymentMode("CASH");
                      setCashAmount(total.toFixed(2));
                      setUpiAmount("");
                      setCardAmount("");
                      setKhataAmount("");
                    }}
                  >
                    <Banknote className="w-3 h-3" /> Cash
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMode === "UPI" ? "default" : "outline"}
                    className={`h-8 text-[11px] px-1 gap-1 font-semibold ${
                      paymentMode === "UPI" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                    }`}
                    onClick={() => {
                      setPaymentMode("UPI");
                      setUpiAmount(total.toFixed(2));
                      setCashAmount("");
                      setCardAmount("");
                      setKhataAmount("");
                    }}
                  >
                    <Smartphone className="w-3 h-3" /> UPI QR
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMode === "CARD" ? "default" : "outline"}
                    className={`h-8 text-[11px] px-1 gap-1 font-semibold ${
                      paymentMode === "CARD" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                    }`}
                    onClick={() => {
                      setPaymentMode("CARD");
                      setCardAmount(total.toFixed(2));
                      setCashAmount("");
                      setUpiAmount("");
                      setKhataAmount("");
                    }}
                  >
                    <CreditCard className="w-3 h-3" /> Card
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMode === "KHATA" ? "default" : "outline"}
                    className={`h-8 text-[11px] px-1 gap-1 font-semibold ${
                      paymentMode === "KHATA" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                    }`}
                    onClick={() => {
                      setPaymentMode("KHATA");
                      setKhataAmount(total.toFixed(2));
                      setCashAmount("");
                      setUpiAmount("");
                      setCardAmount("");
                    }}
                  >
                    <BookOpen className="w-3 h-3" /> Khata
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMode === "SPLIT" ? "default" : "outline"}
                    className={`h-8 text-[11px] px-1 gap-1 font-semibold ${
                      paymentMode === "SPLIT" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                    }`}
                    onClick={() => {
                      setPaymentMode("SPLIT");
                      setCashAmount((total / 2).toFixed(2));
                      setUpiAmount((total / 2).toFixed(2));
                      setCardAmount("");
                      setKhataAmount("");
                    }}
                  >
                    Split
                  </Button>
                </div>

                {/* Cash Mode View */}
                {paymentMode === "CASH" && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <label htmlFor={cashAmountId} className="w-24 text-xs font-medium text-muted-foreground">
                        Cash Tendered:
                      </label>
                      <Input
                        id={cashAmountId}
                        type="number"
                        step="0.01"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="font-mono text-sm h-8 font-bold"
                        placeholder={total.toFixed(2)}
                      />
                    </div>
                    {/* Quick Cash Tender Presets */}
                    <div className="flex gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setCashAmount(total.toFixed(2))}
                      >
                        Exact ₹{total.toFixed(2)}
                      </Button>
                      {[100, 200, 500, 2000].map((denom) => (
                        <Button
                          key={denom}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => setCashAmount(String(denom))}
                        >
                          ₹{denom}
                        </Button>
                      ))}
                    </div>
                    {parseFloat(cashAmount) > total && (
                      <div className="p-2 rounded bg-emerald-500/10 text-emerald-600 text-xs font-mono font-bold flex justify-between">
                        <span>Change to Return:</span>
                        <span>₹ {(parseFloat(cashAmount) - total).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* UPI Mode View */}
                {paymentMode === "UPI" && (
                  <div className="space-y-2 pt-1 bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-600 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5" /> Scan Dynamic QR on Terminal
                      </span>
                      <span className="font-mono font-bold text-foreground">₹ {total.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-muted-foreground font-medium">
                          UPI UTR / Reference Number:
                        </label>
                        <span className="text-[10px] text-emerald-600 font-semibold">(Optional)</span>
                      </div>
                      <Input
                        placeholder="UTR reference (Optional - never compulsory)"
                        value={upiReference}
                        onChange={(e) => setUpiReference(e.target.value)}
                        className="text-xs font-mono h-7"
                      />
                    </div>
                  </div>
                )}

                {/* Card Mode View */}
                {paymentMode === "CARD" && (
                  <div className="space-y-2 pt-1 bg-purple-500/5 p-2.5 rounded-lg border border-purple-500/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-purple-600 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> In-Store EDC Card Swipe/Chip
                      </span>
                      <span className="font-mono font-bold text-foreground">₹ {total.toFixed(2)}</span>
                    </div>
                    <Input
                      placeholder="Card Approval Code (Optional)"
                      value={cardReference}
                      onChange={(e) => setCardReference(e.target.value)}
                      className="text-xs font-mono h-7"
                    />
                  </div>
                )}

                {/* Khata (Udhaar) Mode View */}
                {paymentMode === "KHATA" && (
                  <div className="space-y-2 pt-1 bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-rose-600 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> 100% Khata (Customer Credit / Udhaar)
                      </span>
                      <span className="font-mono font-bold text-foreground">₹ {total.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Full amount of <b>₹{total.toFixed(2)}</b> will be debited to{" "}
                      <b>{customerName || "Customer"}</b>'s Khata ledger.
                    </p>
                    {(!customerPhone.trim() && !customerName.trim()) && (
                      <p className="text-[10px] text-rose-600 font-medium">
                        ⚠️ Please enter Customer Name or Mobile Number above before checkout.
                      </p>
                    )}
                  </div>
                )}

                {/* Split Mode View */}
                {paymentMode === "SPLIT" && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-0.5">Cash:</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="font-mono text-xs h-7 px-1.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-0.5">UPI QR:</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={upiAmount}
                          onChange={(e) => setUpiAmount(e.target.value)}
                          className="font-mono text-xs h-7 px-1.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-0.5">Card:</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(e.target.value)}
                          className="font-mono text-xs h-7 px-1.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 font-medium block mb-0.5">Khata:</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={khataAmount}
                          onChange={(e) => setKhataAmount(e.target.value)}
                          className="font-mono text-xs h-7 px-1.5 border-rose-300"
                        />
                      </div>
                    </div>
                    {/* Remaining allocation indicator */}
                    <div className="text-[11px] font-mono flex justify-between items-center">
                      <span className="text-muted-foreground">Allocated:</span>
                      <span
                        className={
                          Math.abs(
                            (parseFloat(cashAmount) || 0) +
                              (parseFloat(upiAmount) || 0) +
                              (parseFloat(cardAmount) || 0) +
                              (parseFloat(khataAmount) || 0) -
                              total
                          ) < 0.05
                            ? "text-emerald-600 font-bold"
                            : "text-destructive font-bold"
                        }
                      >
                        ₹{" "}
                        {(
                          (parseFloat(cashAmount) || 0) +
                          (parseFloat(upiAmount) || 0) +
                          (parseFloat(cardAmount) || 0) +
                          (parseFloat(khataAmount) || 0)
                        ).toFixed(2)}{" "}
                        / ₹ {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout Action Button */}
              <Button
                className="w-full h-11 text-sm font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md mt-2"
                disabled={cart.length === 0 || isSubmittingBill || !currentShift}
                onClick={handleCheckoutInvoice}
              >
                {isSubmittingBill ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing Invoice...
                  </>
                ) : (
                  <>
                    <Receipt className="w-5 h-5" /> Complete Bill & Print (₹ {total.toFixed(2)})
                  </>
                )}
              </Button>
              {!currentShift && (
                <p className="text-[11px] text-amber-600 text-center font-medium">
                  Please open a cashier shift drawer before processing invoices.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL: Open Shift */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Open Cashier Register Shift
              </CardTitle>
              <CardDescription>
                Record your starting drawer cash float to begin processing counter invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor={openingFloatId} className="text-xs font-semibold text-muted-foreground">
                  Opening Float Amount (₹ INR)
                </label>
                <Input
                  id={openingFloatId}
                  type="number"
                  step="0.01"
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(e.target.value)}
                  className="font-mono text-lg font-bold"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Standard petty float is ₹ 2,000.00 for counter change.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowOpenShiftModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleOpenShift}>
                  Confirm & Open Shift
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: Close Shift & End-of-Day Register Reconciliation */}
      {showCloseShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-xl shadow-2xl border my-auto">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" /> Close Shift & Cash Drawer Reconciliation
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  Shift: {currentShift.shift_number}
                </Badge>
              </CardTitle>
              <CardDescription>
                Tally physical currency notes in the counter register to calculate discrepancy against recorded sales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-muted/40 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Opening Float:</span>
                  <span className="font-mono font-bold text-foreground">₹{Number(currentShift.opening_float).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Cash Sales:</span>
                  <span className="font-mono font-bold text-emerald-600">₹{Number(currentShift.cash_sales).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">UPI Sales:</span>
                  <span className="font-mono font-bold text-blue-600">₹{Number(currentShift.upi_sales).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Expected Cash:</span>
                  <span className="font-mono font-bold text-primary">₹{Number(currentShift.expected_cash).toFixed(2)}</span>
                </div>
              </div>

              {/* Mode Toggle: Denomination Counter vs Direct Input */}
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-semibold text-muted-foreground">Count Method:</span>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={useDenominations ? "default" : "outline"}
                    onClick={() => setUseDenominations(true)}
                    className="h-7 text-xs font-bold"
                  >
                    Denomination Counter (₹500, ₹200...)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!useDenominations ? "default" : "outline"}
                    onClick={() => {
                      setUseDenominations(false);
                      setClosingCashInput(String(currentShift.expected_cash));
                    }}
                    className="h-7 text-xs"
                  >
                    Direct Lump Sum
                  </Button>
                </div>
              </div>

              {useDenominations ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground flex justify-between">
                    <span>Currency Denominations Breakdown:</span>
                    <span className="text-muted-foreground font-mono">Count × Value</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border text-xs">
                    {(["500", "200", "100", "50", "20", "10", "5", "2", "1"] as const).map((denom) => {
                      const count = denominations[denom] || 0;
                      const val = parseInt(denom);
                      const subtotal = count * val;
                      return (
                        <div key={denom} className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200">
                          <span className="w-10 font-bold font-mono text-slate-700">₹{denom}</span>
                          <span className="text-slate-400 text-[10px]">×</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={count === 0 ? "" : count}
                            onChange={(e) => {
                              const qty = Math.max(0, parseInt(e.target.value) || 0);
                              setDenominations((prev) => ({ ...prev, [denom]: qty }));
                            }}
                            className="h-7 text-xs font-mono font-bold text-center bg-slate-50"
                          />
                          <span className="w-14 text-right font-mono text-[11px] text-slate-600 font-semibold truncate">
                            ₹{subtotal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor={countedCashId} className="text-xs font-semibold text-muted-foreground">
                    Actual Physical Counted Cash (₹ INR)
                  </label>
                  <Input
                    id={countedCashId}
                    type="number"
                    step="0.01"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    className="font-mono text-lg font-bold"
                    autoFocus
                  />
                </div>
              )}

              {/* Total Counted & Discrepancy Alert */}
              <div className="p-3 bg-muted/60 rounded-lg flex items-center justify-between text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Total Physical Counted Cash:</span>
                  <span className="font-mono text-lg font-extrabold text-foreground">
                    ₹ {calculatedCountedCash.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Drawer Discrepancy:</span>
                  {calculatedCountedCash - Number(currentShift.expected_cash) === 0 ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ₹0.00 (Balanced)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-mono text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      {calculatedCountedCash - Number(currentShift.expected_cash) > 0 ? "+" : ""}
                      ₹{(calculatedCountedCash - Number(currentShift.expected_cash)).toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={shiftNotesId} className="text-xs font-semibold text-muted-foreground">
                  Shift Notes / Handover Remarks
                </label>
                <Input
                  id={shiftNotesId}
                  placeholder="Optional register closing remarks or discrepancy explanation..."
                  value={closingNotesInput}
                  onChange={(e) => setClosingNotesInput(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowCloseShiftModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-destructive hover:bg-destructive/90 text-white font-bold" onClick={handleCloseShift}>
                  Reconcile & Close Shift
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: Invoice Receipt Thermal Printout (2-inch / 3-inch) */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <Card
            className={`shadow-2xl border bg-card my-auto transition-all ${
              thermalWidth === "58mm" ? "w-full max-w-xs" : "w-full max-w-sm"
            }`}
          >
            {/* Header / Paper Width Switch */}
            <div className="p-3 bg-muted/40 border-b flex items-center justify-between text-xs print:hidden">
              <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-primary" /> Thermal Print Memo
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={thermalWidth === "58mm" ? "default" : "outline"}
                  onClick={() => setThermalWidth("58mm")}
                  className="h-6 text-[10px] px-2 font-bold"
                >
                  2&quot; (58mm)
                </Button>
                <Button
                  size="sm"
                  variant={thermalWidth === "80mm" ? "default" : "outline"}
                  onClick={() => setThermalWidth("80mm")}
                  className="h-6 text-[10px] px-2 font-bold"
                >
                  3&quot; (80mm)
                </Button>
              </div>
            </div>

            {/* Thermal Print Slip Area */}
            <div className="p-4 space-y-3 text-xs font-mono bg-white text-black thermal-print-slip">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2">
                <div className="font-extrabold text-sm uppercase tracking-wide">Siddeshwar Enterprises</div>
                <div className="text-[10px] text-gray-700">Retail & Wholesale Superstore</div>
                <div className="text-[10px] text-gray-600">GSTIN: 29ABCDE1234F1Z5</div>
                <div className="text-[10px] text-gray-600">{activeBranch?.name || "Main Branch • Vijayapura"}</div>
              </div>

              <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>BILL #{completedInvoice.invoice_number}</span>
                  <span>{completedInvoice.payment_method || "CASH"}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Date: {new Date(completedInvoice.invoice_date).toLocaleDateString("en-IN")}</span>
                  <span>Time: {new Date(completedInvoice.invoice_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="text-[10px] text-gray-700">Cashier: {completedInvoice.cashier_name}</div>
                {completedInvoice.customer_name && (
                  <div className="font-bold pt-0.5 text-[11px]">
                    Customer: {completedInvoice.customer_name} {completedInvoice.customer_phone ? `(${completedInvoice.customer_phone})` : ""}
                  </div>
                )}
              </div>

              {/* Itemized Table */}
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-dashed border-black text-left">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-gray-300">
                  {(completedInvoice.items || []).map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-1 pr-1 leading-tight font-medium">{i.product_name}</td>
                      <td className="py-1 text-center font-bold">{i.quantity}</td>
                      <td className="py-1 text-right">₹{Number(i.unit_price).toFixed(2)}</td>
                      <td className="py-1 text-right font-bold">₹{Number(i.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Split Tender */}
              <div className="border-t border-dashed border-black pt-2 space-y-1">
                <div className="flex justify-between font-extrabold text-sm border-b border-black pb-1">
                  <span>NET TOTAL:</span>
                  <span>₹ {Number(completedInvoice.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>GST Breakdown:</span>
                  <span>₹ {Number(completedInvoice.tax_amount).toFixed(2)}</span>
                </div>

                <div className="pt-1 space-y-0.5 text-[11px]">
                  {Number(completedInvoice.cash_paid) > 0 && (
                    <div className="flex justify-between text-gray-800">
                      <span>Paid Cash:</span>
                      <span className="font-bold">₹ {Number(completedInvoice.cash_paid).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(completedInvoice.upi_paid) > 0 && (
                    <div className="flex justify-between text-gray-800">
                      <span>Paid UPI QR:</span>
                      <span className="font-bold">₹ {Number(completedInvoice.upi_paid).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(completedInvoice.card_paid) > 0 && (
                    <div className="flex justify-between text-gray-800">
                      <span>Paid Card:</span>
                      <span className="font-bold">₹ {Number(completedInvoice.card_paid).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(completedInvoice.khata_amount || completedInvoice.balance_amount || 0) > 0 && (
                    <div className="flex justify-between font-bold text-red-700 bg-red-50 p-1 border border-red-200 rounded">
                      <span>Added to Khata (Udhaar):</span>
                      <span>₹ {Number(completedInvoice.khata_amount || completedInvoice.balance_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {completedInvoice.customer_current_balance !== undefined && (
                    <div className="flex justify-between text-[10px] text-gray-700 pt-0.5">
                      <span>Total Pending Khata Balance:</span>
                      <span className="font-bold font-mono">₹ {Number(completedInvoice.customer_current_balance).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thermal Memo Footer */}
              <div className="border-t border-dashed border-black pt-2 text-center space-y-0.5 text-[10px] text-gray-600">
                <div className="font-bold text-black">Thank you for shopping with us! 🙏</div>
                <div>Goods once sold can be exchanged within 48 hours.</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-muted/40 border-t flex gap-2 print:hidden">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 text-xs font-bold"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5" /> Thermal Print ({thermalWidth})
              </Button>
              <Button
                className="flex-1 text-xs font-bold bg-primary text-primary-foreground"
                onClick={() => {
                  setCompletedInvoice(null);
                  setTimeout(() => barcodeInputRef.current?.focus(), 60);
                }}
              >
                Next Bill (Enter)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* PRINT-ONLY CSS FOR CLEAN THERMAL PRINTER SLIPS (2-inch 58mm / 3-inch 80mm) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .thermal-print-slip, .thermal-print-slip * {
            visibility: visible;
          }
          .thermal-print-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: ${thermalWidth === "58mm" ? "54mm" : "76mm"} !important;
            padding: 2mm !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            font-size: ${thermalWidth === "58mm" ? "10px" : "11px"} !important;
          }
        }
      `}</style>
    </div>
  );
}
