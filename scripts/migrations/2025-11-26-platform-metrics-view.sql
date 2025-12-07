-- Materialized view friendly statement for aggregating platform metrics in SQL
create or replace view public.platform_metrics_view as
select
  platform,
  coalesce(sum(revenue), 0) as revenue,
  coalesce(sum(fees), 0) as fees,
  coalesce(sum(adjustments), 0) as adjustments,
  coalesce(sum(revenue + fees + adjustments), 0) as settlement,
  count(*) as total_transactions
from public.transactions
group by platform;
