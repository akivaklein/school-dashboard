# Token Store Shared Structure and Sync Plan

## Purpose

Align the standalone online Token Store (Supabase) and the offline Android tablet Token Store (SQLite) to use matching records and compatible synchronization semantics.

## Shared Core Records

### Students
- `id`
- `barcode`
- `name`
- `balance` (offline) / `token_balance` (online)
- `is_vip`
- `is_active`
- `updated_at`

### Products
- `id`
- `barcode`
- `name`
- `point_cost` (offline) / `cost` (online)
- `quantity` (offline) / `stock` (online)
- `low_stock_threshold` (offline) / `low_stock_at` (online)
- `vip_only` (offline) / `vip` (online)
- `image_url`
- `emoji`
- `category`
- `is_active`
- `updated_at`

### Purchases / Redemptions
- `transaction_uuid` (offline sync-safe id)
- `source_device_id`
- student linkage (`student_id`, `student_barcode`, `student_name`)
- product linkage (`product_id`, `product_name`)
- `point_cost`
- `points_after`
- `is_reversed`
- `reversed_at`
- `reverse_reason`
- `created_at`

### Point Adjustments (Balance History)
- `transaction_uuid`
- `source_device_id`
- `source_ref` (optional reference to originating purchase/reversal tx)
- `student_id`
- `old_balance`
- `new_balance`
- `change_amount`
- `operation_type`
- `reason`
- `created_at`

## Sync Safety Rules (Preparation)

1. Idempotency:
- Use `transaction_uuid` to dedupe purchases and point adjustments.
- Do not apply a transaction twice.

2. Conflict handling:
- For students/products, use `updated_at` with last-writer-wins only when records refer to the same logical entity (`barcode` as durable business key).
- Never overwrite a newer row with an older timestamp.

3. Reversals:
- Reverse by referencing original transaction (`source_ref` or linked event id).
- A reversal is a new transaction; do not mutate prior history rows beyond marking reversed state when applicable.

4. Inventory and balances:
- Apply transaction streams, not only snapshots, to prevent drift.
- Snapshot import/export can be used for disaster recovery, but routine sync should remain transaction-first.

## USB Manual Sync and Backup

- Backup/restore remains available for full-device recovery.
- USB sync packages should include:
  - Students and products snapshots with `updated_at`.
  - Purchases and balance history with `transaction_uuid`.
- Merge import should:
  - Upsert students/products by `barcode` if incoming `updated_at` is newer.
  - Insert purchases/adjustments only when `transaction_uuid` is not present locally.

## VIP Status Rule

VIP status must come from verified stored VIP fields or manual entry.
Preview seed data is non-authoritative and must not infer VIP from unrelated fields.
