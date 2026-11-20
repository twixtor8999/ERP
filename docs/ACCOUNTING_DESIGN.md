# AI Smart Bazar ERP — Double-Entry Accounting Engine

## 1. General Ledger & Chart of Accounts Architecture

Accounting in AI Smart Bazar implements standard Indian accounting standards and GST compliance via a 5-tier classification:
1. **Assets** (Code 1000 series): Cash, Bank accounts, Debtors, Inventory, Capital equipment.
2. **Liabilities** (Code 2000 series): Creditors, GST Payable, Loans, Outstanding expenses.
3. **Equity** (Code 3000 series): Owner's capital, Retained earnings, Reserves.
4. **Revenue** (Code 4000 series): Direct product sales, Service fees, Other income.
5. **Expenses** (Code 5000 series): Cost of Goods Sold (COGS), Rent, Salaries, Electricity, Freight.

---

## 2. Double-Entry Balance Equation

Every posting to the general ledger is executed via `JournalEntry` and `JournalEntryLine`.
For every entry:
$$\sum \text{debit\_amount} = \sum \text{credit\_amount}$$

### Transaction Accounting Posting Flow (Example: Cash Sale with 18% GST)

| Line # | Account | Debit (₹) | Credit (₹) | Narration |
| :---: | :--- | :---: | :---: | :--- |
| **1** | `1100 Cash-in-Hand` | 118.00 | 0.00 | Cash received at counter |
| **2** | `4000 Direct Sales Revenue` | 0.00 | 100.00 | Taxable item revenue |
| **3** | `2200 GST Output Tax Payable` | 0.00 | 18.00 | CGST 9% (₹9) + SGST 9% (₹9) |

---

## 3. Financial Year & Period Closing

- Financial years span 12 months (e.g. April 1 to March 31).
- `accounting_periods` track monthly books. Once closed (`is_closed = True`), back-dated vouchers cannot be posted without administrator reopening.
- Bank accounts link directly to General Ledger accounts, supporting statement imports and reconciliation tracking (`bank_reconciliations`).

