-- Align DB constraint with app upsert key to prevent silent duplicates
create unique index if not exists transactions_platform_external_sku_type_idx
  on public.transactions (platform, external_id, sku, type);
