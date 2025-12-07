-- Add payment_date to transactions and paid aggregates to platform_metrics
alter table if exists public.transactions
  add column if not exists payment_date date;

alter table if exists public.platform_metrics
  add column if not exists per_day_paid jsonb,
  add column if not exists total_transactions_paid int8;
