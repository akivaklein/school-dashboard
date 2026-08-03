alter table if exists public.store_items
  add column if not exists sku text not null default '',
  add column if not exists barcode text not null default '';

create index if not exists store_items_sku_idx
  on public.store_items (sku)
  where sku <> '';

create index if not exists store_items_barcode_idx
  on public.store_items (barcode)
  where barcode <> '';

comment on column public.store_items.sku is
  'Optional internal stock-keeping unit used for scanner/lookup workflows.';

comment on column public.store_items.barcode is
  'Optional barcode string for scanner-ready redemption lookups.';
