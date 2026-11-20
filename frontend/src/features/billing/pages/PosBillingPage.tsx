import { useState, useEffect, useCallback, useId } from "react";
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
  cashier_name: string;
  total_amount: string | number;
  tax_amount: string | number;
  cash_paid: string | number;
  upi_paid: string | number;
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
  const barcodeSearchId = useId();
  const customerNameId = useId();
  const customerPhoneId = useId();
  const cashAmountId = useId();
  const upiAmountId = useId();
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

  // Product search & Cart
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductLookupItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer & Payment
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [upiAmount, setUpiAmount] = useState<string>("");

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

  const handleCloseShift = async () => {
    if (!currentShift) return;
    try {
      setErrorMessage(null);
      await apiClient.post("/api/v1/pos/shifts/close", {
        closing_cash: parseFloat(closingCashInput) || 0,
        notes: closingNotesInput,
      });
      setShowCloseShiftModal(false);
      setCurrentShift(null);
      fetchCurrentShift();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(errorObj?.response?.data?.detail || "Failed to close shift.");
    }
  };

  const handleCheckoutInvoice = async () => {
    if (cart.length === 0) {
      setErrorMessage("Cart is empty.");
      return;
    }
    const cash = parseFloat(cashAmount) || 0;
    const upi = parseFloat(upiAmount) || 0;
    if (Math.abs(cash + upi - total) > 0.05) {
      setErrorMessage(`Total payment (₹${(cash + upi).toFixed(2)}) must match bill total (₹${total.toFixed(2)})`);
      return;
    }

    try {
      setIsSubmittingBill(true);
      setErrorMessage(null);
      const res = await apiClient.post<InvoiceResult>("/api/v1/pos/invoices", {
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        cash_paid: cash,
        upi_paid: upi,
        items: cart.map((i) => ({
          variant_id: i.variant_id,
          quantity: i.qty,
        })),
      });

      setCompletedInvoice(res.data);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCashAmount("");
      setUpiAmount("");
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
                  id={barcodeSearchId}
                  placeholder="Scan barcode or type SKU (e.g. DAL-TUR-1KG)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
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

        {/* Right: Payment & Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Bill Summary</span>
                <span className="text-2xl font-bold font-mono text-primary">₹ {total.toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Financial Breakup */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono">₹ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST Amount (CGST+SGST):</span>
                  <span className="font-mono">₹ {taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2 text-foreground">
                  <span>Total Payable:</span>
                  <span className="font-mono text-primary">₹ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Info (Optional) */}
              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Customer Details (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={customerNameId} className="sr-only">Customer Name</label>
                    <Input
                      id={customerNameId}
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor={customerPhoneId} className="sr-only">Mobile Number</label>
                    <Input
                      id={customerPhoneId}
                      placeholder="Mobile (10 digits)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Split */}
              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  In-Store Payment Mode Split
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 flex items-center gap-1.5 text-xs font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Cash (INR)
                    </div>
                    <label htmlFor={cashAmountId} className="sr-only">Cash Tendered</label>
                    <Input
                      id={cashAmountId}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cashAmount}
                      onChange={(e) => {
                        setCashAmount(e.target.value);
                        const c = parseFloat(e.target.value) || 0;
                        setUpiAmount(Math.max(0, total - c).toFixed(2));
                      }}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24 flex items-center gap-1.5 text-xs font-medium">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" /> UPI QR (INR)
                    </div>
                    <label htmlFor={upiAmountId} className="sr-only">UPI Tendered</label>
                    <Input
                      id={upiAmountId}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={upiAmount}
                      onChange={(e) => {
                        setUpiAmount(e.target.value);
                        const u = parseFloat(e.target.value) || 0;
                        setCashAmount(Math.max(0, total - u).toFixed(2));
                      }}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Quick Split Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setCashAmount(total.toFixed(2));
                      setUpiAmount("0.00");
                    }}
                  >
                    100% Cash
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setCashAmount("0.00");
                      setUpiAmount(total.toFixed(2));
                    }}
                  >
                    100% UPI QR
                  </Button>
                </div>
              </div>

              {/* Checkout Action Button */}
              <Button
                className="w-full h-11 text-base font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
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
                <p className="text-xs text-amber-600 text-center font-medium">
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

      {/* MODAL: Close Shift */}
      {showCloseShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Close Shift & Reconcile Drawer
              </CardTitle>
              <CardDescription>
                Reconcile physical cash drawer tally for shift {currentShift.shift_number}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Opening Float:</span>
                  <span className="font-mono font-bold">₹ {Number(currentShift.opening_float).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Cash Sales Today:</span>
                  <span className="font-mono font-bold text-emerald-600">₹ {Number(currentShift.cash_sales).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">UPI Sales (Digital):</span>
                  <span className="font-mono font-bold text-blue-600">₹ {Number(currentShift.upi_sales).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Expected Cash Drawer:</span>
                  <span className="font-mono font-bold text-primary">₹ {Number(currentShift.expected_cash).toFixed(2)}</span>
                </div>
              </div>

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
                {closingCashInput && (
                  <div className="text-xs font-medium flex items-center gap-1.5">
                    {parseFloat(closingCashInput) - Number(currentShift.expected_cash) === 0 ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Perfect drawer balance (₹ 0.00 discrepancy)
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Drawer Discrepancy: ₹{" "}
                        {(parseFloat(closingCashInput) - Number(currentShift.expected_cash)).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor={shiftNotesId} className="text-xs font-semibold text-muted-foreground">
                  Shift Notes / Discrepancy Explanation
                </label>
                <Input
                  id={shiftNotesId}
                  placeholder="Optional handover remarks..."
                  value={closingNotesInput}
                  onChange={(e) => setClosingNotesInput(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCloseShiftModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-destructive hover:bg-destructive/90 text-white" onClick={handleCloseShift}>
                  Reconcile & Close Shift
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: Invoice Receipt Printout */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border bg-card">
            <CardHeader className="text-center pb-2 border-b">
              <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Siddeshwar Enterprises</CardTitle>
              <CardDescription className="text-xs">
                GSTIN: 27AAAAA0000A1Z5 | {activeBranch?.name || "Main Branch"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 text-xs font-mono">
              <div className="flex justify-between border-b pb-2">
                <div>
                  <div className="font-bold text-foreground">INV: #{completedInvoice.invoice_number}</div>
                  <div className="text-muted-foreground">Date: {new Date(completedInvoice.invoice_date).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Cashier: {completedInvoice.cashier_name}</div>
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {completedInvoice.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{i.product_name}</td>
                      <td className="py-1 text-center">{i.quantity}</td>
                      <td className="py-1 text-right">₹{Number(i.unit_price).toFixed(2)}</td>
                      <td className="py-1 text-right">₹{Number(i.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-2 space-y-1 font-bold text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>₹ {Number(completedInvoice.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-normal text-muted-foreground">
                  <span>Tax Breakdown (GST):</span>
                  <span>₹ {Number(completedInvoice.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-normal text-emerald-600">
                  <span>Paid Cash: ₹ {Number(completedInvoice.cash_paid).toFixed(2)}</span>
                  <span>Paid UPI: ₹ {Number(completedInvoice.upi_paid).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </Button>
                <Button
                  className="flex-1 text-xs bg-primary text-primary-foreground"
                  onClick={() => setCompletedInvoice(null)}
                >
                  Next Bill
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
