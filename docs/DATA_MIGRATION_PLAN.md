# AI Smart Bazar ERP — Legacy Data Migration Architecture

## 1. Multi-Stage Ingestion Pipeline

To migrate Siddeshwar Enterprises' legacy business data from unknown formats (Excel, CSV, legacy databases, or paper records), the system utilizes a staging workflow:

```
[Phase 1: Upload] -> data_import_files
       |
[Phase 2: Raw Ingestion] -> data_import_records (raw_data JSONB)
       |
[Phase 3: Schema Validation] -> data_import_errors (Row & Column level errors)
       |
[Phase 4: Transformation] -> data_import_records (parsed_data JSONB)
       |
[Phase 5: Entity Insertion & ID Mapping] -> legacy_id_mappings + Master Tables
```

---

## 2. Ingestion Batch Management (`data_import_batches`)

Each import run is tracked with state progress:
- `import_type`: `CUSTOMERS`, `PRODUCTS`, `SUPPLIERS`, `INVENTORY`, `COA`
- `status`: `PENDING` -> `PROCESSING` -> `COMPLETED` / `FAILED`
- `total_records`, `successful_records`, `failed_records`

### Legacy ID Translation (`legacy_id_mappings`)
Every migrated record stores a cross-reference:
```
(organization_id, entity_type, legacy_id) -> new_postgresql_uuid
```
This guarantees that historical customer account numbers, old item codes, and old bill numbers can be queried or matched back to the legacy system.
