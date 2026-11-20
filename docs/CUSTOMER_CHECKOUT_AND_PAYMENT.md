# Customer Checkout and Payment — AI Smart Bazar ERP

**Client:** Siddeshwar Enterprises  
**Module:** Checkout Calculation, GST Taxation & Payment  
**Status:** Production Ready  

---

## 1. Checkout Calculation Engine

All calculations are executed server-side using Python `Decimal` and PostgreSQL `NUMERIC(12, 2)` to eliminate floating-point rounding errors.

### A. Line Items & Subtotal
For each line item in the customer's active cart:
$$\text{line\_subtotal} = \text{selling\_price} \times \text{quantity}$$
$$\text{cart\_subtotal} = \sum \text{line\_subtotal}$$

### B. Indian Goods & Services Tax (GST)
Tax calculation complies with Indian GST statutory requirements:
1. **Intra-State Supply (Customer state matches Branch state, e.g. Maharashtra):**
   - GST split equally into **CGST** (Central GST) and **SGST** (State GST).
   - Rate: $\frac{\text{GST\%}}{2}$ each.
2. **Inter-State Supply:**
   - Single **IGST** (Integrated GST) levied at the full rate.

$$\text{Tax Amount} = \frac{\text{Taxable Subtotal} \times \text{Tax Rate}}{100}$$

### C. Delivery Charges
Configurable based on order value:
- **Free Delivery:** Subtotal $\ge$ ₹499.00.
- **Standard Local Delivery Fee:** ₹40.00 for orders below ₹499.00.

### D. Grand Total
$$\text{Grand Total} = \text{Subtotal} + \text{Total GST} + \text{Delivery Fee}$$

---

## 2. Order Preview Endpoint

Before finalizing an order, the frontend calls:
```http
POST /api/v1/store/orders/preview
```
Payload:
```json
{
  "shipping_address_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "delivery_slot": "Morning 9 AM - 12 PM"
}
```
Response:
```json
{
  "subtotal": "540.00",
  "cgst": "13.50",
  "sgst": "13.50",
  "igst": "0.00",
  "total_tax": "27.00",
  "delivery_charge": "0.00",
  "grand_total": "567.00",
  "total_items": 3
}
```

---

## 3. Supported Payment Methods

1. **Cash on Delivery (COD):**
   - Immediate order confirmation.
   - Payment status set to `PENDING`.
   - Verified shop delivery staff collects cash at customer's doorstep and verifies OTP.
2. **Unified Payments Interface (UPI / Scan & Pay):**
   - Customer selects UPI at checkout.
   - Delivery staff presents dynamic QR code on delivery run, or direct intent link.
   - Transaction ID recorded on fulfillment.

---

## 4. Idempotency & Concurrency Safety

To prevent accidental double orders (e.g. repeated clicks on poor mobile connections):
- The frontend sends an optional `idempotency_key` (UUID v4) with the order placement request.
- If a subsequent request arrives with the same key for the same customer, the backend detects the duplicate and safely returns the previously created order without duplicate stock reservations or charges.

