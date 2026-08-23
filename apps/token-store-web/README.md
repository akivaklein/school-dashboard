# Token Store Web (Standalone)

Standalone Supabase-backed Token Store website for Vercel.

## Scope

This app intentionally contains only store functionality:
- Student lookup
- Product checkout
- Inventory visibility
- Return/exchange

It does not include the rest of the school dashboard portal.

## Data Source

All reads/writes are through Supabase tables/RPCs.
No browser localStorage is used for store state.

## Local Development

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run:

```bash
npm install
npm run dev
```

## Deploy to Vercel

- Create a Vercel project from this repository.
- Set project root directory to `apps/token-store-web`.
- Add environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Shared Record Structure Notes

This app and the offline tablet app are aligned around the same core records:
- Students: `id`, `name`, `balance/token_balance`, `is_vip`, `is_active`
- Products: `id`, `name`, `sku`, `barcode`, `category`, `cost/point_cost`, `stock/quantity`, `low_stock_at/low_stock_threshold`, `vip`, `image_url`
- Purchases/redemptions: transaction IDs, points event links, reversal status and timestamps
- Point adjustments: history records with operation type and timestamps

## Future Sync Preparation

The offline app now stores per-transaction metadata (`transaction_uuid`, `source_device_id`, timestamps), which is required for safe future two-way sync and USB package merge without duplicate transactions.
