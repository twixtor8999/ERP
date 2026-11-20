# AI Smart Bazar ERP — Multi-Branch & Multi-Tenant Architecture

## 1. Multi-Tenant Tenancy Model

The system utilizes a pooled database model with strict row-level discriminator tenancy:
- `OrganizationScopedMixin`: Enforces `organization_id` on all enterprise-level data.
- `BranchScopedMixin`: Enforces both `organization_id` and `branch_id` on all operational point-of-presence records.

### Composite Foreign Keys & Constraint Enforcement
To mathematically prevent data leakage (such as Branch A accidentally referencing an invoice or warehouse belonging to another organization), composite constraints and index barriers are placed across all child tables:
```sql
UNIQUE (organization_id, branch_code)
UNIQUE (organization_id, customer_code)
UNIQUE (organization_id, supplier_code)
UNIQUE (organization_id, product_code)
UNIQUE (organization_id, invoice_number)
UNIQUE (organization_id, branch_id, sequence_type, financial_year)
```

---

## 2. Branch Autonomy vs Centralized Consolidation

| Operational Dimension | Local Branch Autonomy | Centralized Organization Consolidation |
| :--- | :--- | :--- |
| **Catalog & Products** | Uses central product catalog and global price lists. | Centrally managed SKUs, barcodes, HSN codes, and tax configurations. |
| **Stock & Warehouses**| Real-time branch stock balances; cycle counts and bin tracking. | Organization-wide stock valuation, consolidated low-stock reporting. |
| **Sales & Billing** | Independent sequential invoice counters (`INV-PUNE-0001`). | Central GST reporting, consolidated turnover, and B2B client ledgers. |
| **Cash Settlements** | Daily cashier drawer settlement and discrepancy reconciliation. | Centralized treasury management and multi-bank account transfers. |
| **Staff & Shifts** | Branch check-in/out attendance and vehicle assignments. | Centralized employee designations, payroll structures, and incentives. |

---

## 3. Inter-Branch Stock Transfers

Inter-branch inventory movement requires atomic state tracking to guarantee zero ghost stock:
1. **Creation**: Source branch initiates `StockTransfer` (`status = DRAFT` -> `IN_TRANSIT`).
2. **Dispatch**: Outbound `StockMovement` recorded at source warehouse; stock deducted from source `StockBalance`.
3. **Transit**: Quantities recorded as in-transit between locations.
4. **Receipt**: Destination branch inspects goods and records `StockTransferItem.quantity_received`.
5. **Inbound Booking**: Inbound `StockMovement` recorded at destination warehouse; balance credited to destination `StockBalance`.
