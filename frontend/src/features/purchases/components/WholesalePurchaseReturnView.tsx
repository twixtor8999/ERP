import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Eye,
  CheckCircle2,
  Printer,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredPurchases,
  getStoredDebitNotes,
  saveStoredDebitNotes,
  type PurchaseRecord,
  type DebitNoteRecord,
} from "../data/mockPurchases";
import { WholesaleDebitNoteDetailView } from "./WholesaleDebitNoteDetailView";

export function WholesalePurchaseReturnView() {
  const navigate = useNavigate();
  const [debitNotes, setDebitNotes] = useState<DebitNoteRecord[]>(() => getStoredDebitNotes());

  // Search input state
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [searchedInv, setSearchedInv] = useState("");
  const [matchedPurchase, setMatchedPurchase] = useState<PurchaseRecord | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "found" | "not_found" | "pending">("idle");

  // Return quantities & reasons per SKU ID
  const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<number, string>>({});

  // View modal for Debit Note
  const [selectedNote, setSelectedNote] = useState<DebitNoteRecord | null>(null);

  const REASONS = [
    "Damaged",
    "Expired / near expiry",
    "Wrong item supplied",
    "Excess supply",
    "Quality issue",
    "Rate difference",
  ];

  const handleSearchInvoice = () => {
    const q = invoiceQuery.trim();
    if (!q) {
      toast.error("Please enter an Invoice Number");
      return;
    }
    setSearchedInv(q);

    // Refresh purchases from storage so newly created purchases are included
    const allPurchases = getStoredPurchases();
    const cleanQ = q.toLowerCase().replace(/[\s\-_/]/g, "");

    const found = allPurchases.find((p) => {
      const cleanInv = p.invoiceNo.toLowerCase().replace(/[\s\-_/]/g, "");
      return cleanInv === cleanQ || p.invoiceNo.toLowerCase() === q.toLowerCase();
    });

    if (!found) {
      setMatchedPurchase(null);
      setSearchStatus("not_found");
      return;
    }

    if (found.status === "pending") {
      setMatchedPurchase(found);
      setSearchStatus("pending");
      return;
    }

    setMatchedPurchase(found);
    setSearchStatus("found");

    // Pre-initialize return inputs
    const initialQtys: Record<number, number> = {};
    const initialReasons: Record<number, string> = {};
    found.lines.forEach((l) => {
      initialQtys[l.skuId] = 0;
      initialReasons[l.skuId] = "";
    });
    setReturnQtys(initialQtys);
    setReturnReasons(initialReasons);
  };

  // Calculate return details for matched purchase
  const returnRows = useMemo(() => {
    if (!matchedPurchase) return [];

    return matchedPurchase.lines.map((l) => {
      // Find earlier returns for this invoice and SKU
      const returnedEarlier = debitNotes
        .filter((d) => d.invoiceNo === matchedPurchase.invoiceNo)
        .reduce((sum, d) => {
          const dl = d.lines.find((line) => line.skuId === l.skuId);
          return sum + (dl ? dl.returnQty : 0);
        }, 0);

      const inStock = Math.max(0, l.qty - returnedEarlier);
      const canReturn = inStock;
      const retQty = returnQtys[l.skuId] || 0;
      const reason = returnReasons[l.skuId] || "";
      const amount = retQty * l.grnPrice;

      return {
        skuId: l.skuId,
        skuName: l.skuName,
        purchasedQty: l.qty,
        returnedEarlier,
        inStock,
        canReturn,
        grnPrice: l.grnPrice,
        returnQty: retQty,
        reason,
        amount,
      };
    });
  }, [matchedPurchase, debitNotes, returnQtys, returnReasons]);

  const totalReturnAmount = useMemo(() => {
    return returnRows.reduce((sum, r) => sum + r.amount, 0);
  }, [returnRows]);

  const handleSubmitReturn = () => {
    if (!matchedPurchase) return;

    const activeLines = returnRows.filter((r) => r.returnQty > 0);

    if (activeLines.length === 0) {
      toast.error("Please enter a return quantity for at least one item.");
      return;
    }

    // Check if reason is chosen for all active lines
    const missingReason = activeLines.some((r) => !r.reason);
    if (missingReason) {
      toast.error("Please select a return reason for every returned item.");
      return;
    }

    const newNoteId = Date.now();
    const count = debitNotes.length + 1;
    const noteNo = `DN-2026-${String(count).padStart(3, "0")}`;

    const newDebitNote: DebitNoteRecord = {
      id: newNoteId,
      date: new Date().toISOString().split("T")[0] || "2026-11-22",
      debitNoteNo: noteNo,
      vendorId: matchedPurchase.vendorId,
      vendorName: matchedPurchase.vendorName,
      invoiceNo: matchedPurchase.invoiceNo,
      totalItems: activeLines.length,
      amount: totalReturnAmount,
      status: "pending",
      lines: activeLines.map((r) => ({
        skuId: r.skuId,
        skuName: r.skuName,
        purchasedQty: r.purchasedQty,
        returnedEarlier: r.returnedEarlier,
        inStock: r.inStock,
        canReturn: r.canReturn,
        grnPrice: r.grnPrice,
        returnQty: r.returnQty,
        reason: r.reason,
        amount: r.amount,
      })),
    };

    const updatedNotes = [newDebitNote, ...debitNotes];
    setDebitNotes(updatedNotes);
    saveStoredDebitNotes(updatedNotes);

    toast.success(`Purchase return submitted for approval! Debit Note ${noteNo} created.`);

    // Reset return form
    setMatchedPurchase(null);
    setSearchStatus("idle");
    setInvoiceQuery("");
  };

  const handleApproveDebitNote = (id: number) => {
    const updated = debitNotes.map((d) => {
      if (d.id === id) {
        return { ...d, status: "approved" as const };
      }
      return d;
    });
    setDebitNotes(updated);
    saveStoredDebitNotes(updated);
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, status: "approved" });
    }
    toast.success("Debit Note approved! Stock deducted and vendor credit updated.");
  };

  const handlePrint = (note: DebitNoteRecord) => {
    toast.info(`Preparing print for Debit Note ${note.debitNoteNo}...`);
    window.print();
  };

  const pendingCount = useMemo(() => {
    return debitNotes.filter((d) => d.status === "pending").length;
  }, [debitNotes]);

  // Dedicated 2nd Page: When a debit note is clicked for View
  if (selectedNote) {
    return (
      <WholesaleDebitNoteDetailView
        note={selectedNote}
        onBack={() => setSelectedNote(null)}
        onApprove={handleApproveDebitNote}
      />
    );
  }

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
          Purchase Return
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Enter the Invoice No. The SKUs of that invoice show here. Set Return Qty and reason. Owner / Admin approves, then the Debit Note is generated and Inventory is corrected automatically.
        </p>
      </div>

      {/* Invoice Search & Return Form Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-end gap-3 max-w-xl">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Invoice No
            </label>
            <div className="relative">
              <input
                type="text"
                value={invoiceQuery}
                onChange={(e) => setInvoiceQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchInvoice()}
                placeholder="Enter the purchase invoice number (e.g. INV-SH-9921)"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearchInvoice}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-lg shadow-sm transition-colors"
          >
            Show items
          </button>
        </div>

        {/* State Display: Idle / Not Found / Pending / Found */}
        {searchStatus === "idle" && (
          <p className="text-xs md:text-sm text-gray-400 italic pt-1">
            Enter the invoice number of the purchase, then tap Show items. The SKUs of that invoice appear here. Set the Return Qty and the reason.
          </p>
        )}

        {searchStatus === "not_found" && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-800 text-xs md:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">AI: invoice not found</div>
              <div className="text-xs text-rose-700 mt-0.5">
                No approved purchase has the invoice number "{searchedInv}". Check the number in Purchase List.
              </div>
            </div>
          </div>
        )}

        {searchStatus === "pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-xs md:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">AI: invoice is not approved yet</div>
              <div className="text-xs text-amber-700 mt-0.5">
                Invoice "{searchedInv}" is waiting for approval, so its stock is not in Inventory yet. Approve the purchase first, then return.
              </div>
            </div>
          </div>
        )}

        {searchStatus === "found" && matchedPurchase && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs md:text-sm text-blue-900 font-medium">
              Invoice <b className="font-bold">{matchedPurchase.invoiceNo}</b> · {matchedPurchase.vendorName} · {matchedPurchase.date} · Total ₹{matchedPurchase.totalAmount.toLocaleString()}
            </div>

            {/* Line items table */}
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1e40af] text-white">
                    <th className="py-2.5 px-3 font-semibold text-center w-12">Sl</th>
                    <th className="py-2.5 px-3 font-semibold min-w-[200px]">SKU</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Purchased</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Returned earlier</th>
                    <th className="py-2.5 px-3 font-semibold text-center">In stock now</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Can return</th>
                    <th className="py-2.5 px-3 font-semibold text-right">GRN price (incl. GST)</th>
                    <th className="py-2.5 px-3 font-semibold text-center min-w-[110px]">Return Qty</th>
                    <th className="py-2.5 px-3 font-semibold min-w-[180px]">Reason</th>
                    <th className="py-2.5 px-3 font-semibold text-right min-w-[100px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {returnRows.map((row, idx) => (
                    <tr key={row.skuId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">{row.skuName}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600">{row.purchasedQty}</td>
                      <td className="py-2.5 px-3 text-center text-gray-500">{row.returnedEarlier}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600">{row.inStock}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-800">{row.canReturn}</td>
                      <td className="py-2.5 px-3 text-right text-gray-700">₹{row.grnPrice.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={row.canReturn}
                          step={1}
                          disabled={row.canReturn === 0}
                          value={returnQtys[row.skuId] || ""}
                          onChange={(e) => {
                            const val = Math.min(row.canReturn, Math.max(0, parseInt(e.target.value) || 0));
                            setReturnQtys((prev) => ({ ...prev, [row.skuId]: val }));
                          }}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          disabled={row.canReturn === 0}
                          value={returnReasons[row.skuId] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReturnReasons((prev) => ({ ...prev, [row.skuId]: val }));
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                        >
                          <option value="">Select reason</option>
                          {REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                        ₹{row.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Total & Submit Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-semibold text-gray-600">
                  Return amount (incl GST):
                </span>
                <span className="text-base md:text-lg font-bold text-[#0d1b4c]">
                  ₹{totalReturnAmount.toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubmitReturn}
                className="px-5 py-2 text-sm font-bold text-white bg-[#10b981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Submit for approval
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Debit Notes Table Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg md:text-xl font-bold text-[#0d1b4c]">
            Purchase returns · Debit Notes
          </h2>
          {pendingCount > 0 && (
            <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <span>⏳ {pendingCount} purchase return{pendingCount > 1 ? "s" : ""} waiting for approval. Owner / Admin will approve.</span>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead className="sticky top-0 z-10 shadow-2xs">
                <tr className="bg-[#1e40af] text-white whitespace-nowrap">
                  <th className="py-3 px-3.5 font-semibold text-center w-12">Sl</th>
                  <th className="py-3 px-3.5 font-semibold">Date</th>
                  <th className="py-3 px-3.5 font-semibold">Debit Note No</th>
                  <th className="py-3 px-3.5 font-semibold min-w-[200px]">Vendor</th>
                  <th className="py-3 px-3.5 font-semibold">Invoice No</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Total Items</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Amount</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {debitNotes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      No purchase returns or debit notes yet.
                    </td>
                  </tr>
                ) : (
                  debitNotes.map((note, idx) => (
                    <tr key={note.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 text-gray-700 font-medium">
                        {note.date}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-700">
                        {note.status === "approved" ? (
                          note.debitNoteNo
                        ) : (
                          <span className="text-gray-400 font-normal">On approval</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-gray-900">
                        {note.vendorName}
                      </td>
                      <td className="py-3 px-3.5 text-gray-700 font-mono">
                        {note.invoiceNo}
                      </td>
                      <td className="py-3 px-3.5 text-center font-medium text-gray-700">
                        {note.totalItems}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-gray-900">
                        ₹{note.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {note.status === "approved" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Waiting for approval
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedNote(note)}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          {note.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleApproveDebitNote(note.id)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] rounded transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          {note.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => handlePrint(note)}
                              className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
