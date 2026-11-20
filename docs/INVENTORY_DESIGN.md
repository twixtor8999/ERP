# AI Smart Bazar ERP — Inventory & Stock Ledger Architecture

## 1. Dual-Layer Inventory Model

The system separates real-time read performance from historical audit integrity through two synchronized layers:

```
[Operational Layer]
  - stock_balances (warehouse_id, product_variant_id, location_id)
      * quantity_on_hand
      * quantity_reserved
      * quantity_available = (quantity_on_hand - quantity_reserved)
      * average_unit_cost
      * total_value

[Immutable Ledger Layer]
  - stock_movements
      * movement_type (IN, OUT, TRANSFER, ADJUSTMENT, RETURN, SPLIT)
      * quantity (+/-)
      * unit_cost
      * reference_type (GRN, INVOICE, TRANSFER, ADJUSTMENT)
      * reference_id
```

---

## 2. Inventory Movements Lifecycle

1. **Procurement (Inbound / GRN)**:
   Goods receipt note increments `quantity_on_hand` and appends an immutable `IN` movement. Moving average unit cost is updated:
   $$\text{New Avg Cost} = \frac{(\text{Current Value} + \text{Inbound Value})}{\text{New Total Quantity}}$$

2. **Sales Fulfillment (Outbound)**:
   Invoice confirmation deducts `quantity_on_hand` and appends an `OUT` movement referencing the invoice.

3. **Temporary Reservations**:
   Pending sales orders place a lock in `inventory_reservations`, increasing `quantity_reserved` and reducing `quantity_available` without altering physical count until fulfilled or expired.

4. **Bulk Unpack / Stock Breakdown**:
   Large bulk bags (e.g. 50kg Sugar Sack) unpacked into 1kg retail packets are tracked via `stock_split_batches` and `stock_split_items`.
