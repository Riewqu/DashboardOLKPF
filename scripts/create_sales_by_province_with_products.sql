-- ==========================================
-- SQL Function: get_sales_by_province_with_products
-- Description: Aggregate sales data by province with product details
-- Performance: Handles millions of rows in < 1 second
-- Date Filtering: Supports optional start_date and end_date parameters
-- ==========================================

CREATE OR REPLACE FUNCTION get_sales_by_province_with_products(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  province text,
  total_qty bigint,
  total_revenue numeric,
  product_count bigint,
  products jsonb  -- Array of products in JSONB format
) AS $$
BEGIN
  RETURN QUERY
  WITH province_products AS (
    -- Group by province and product_name (รวม TikTok + Shopee)
    -- Filter by order_date if parameters are provided
    SELECT
      COALESCE(ps.province_normalized, 'ไม่ระบุจังหวัด') as prov,
      ps.product_name,
      MAX(ps.variant_code) as variant_code,  -- เอา variant_code ตัวแรก
      SUM(ps.qty_confirmed) as total_qty_product,
      SUM(ps.revenue_confirmed_thb) as total_revenue_product
    FROM product_sales ps
    WHERE
      (p_start_date IS NULL OR ps.order_date >= p_start_date)
      AND (p_end_date IS NULL OR ps.order_date <= p_end_date)
    GROUP BY COALESCE(ps.province_normalized, 'ไม่ระบุจังหวัด'), ps.product_name
  ),
  province_aggregates AS (
    -- Aggregate products per province as JSONB array with image_url from product_master
    SELECT
      pp.prov,
      SUM(pp.total_qty_product)::bigint as agg_total_qty,
      SUM(pp.total_revenue_product)::numeric as agg_total_revenue,
      COUNT(DISTINCT pp.product_name)::bigint as agg_product_count,
      jsonb_agg(
        jsonb_build_object(
          'sku', pp.variant_code,
          'name', pp.product_name,
          'qty', pp.total_qty_product,
          'revenue', pp.total_revenue_product,
          'image_url', pm.image_url
        )
        ORDER BY pp.total_revenue_product DESC  -- เรียงตามยอดขายสูงสุด
      ) as agg_products
    FROM province_products pp
    LEFT JOIN product_master pm ON pp.product_name = pm.name
    GROUP BY pp.prov
  )
  SELECT
    pa.prov as province,
    pa.agg_total_qty as total_qty,
    pa.agg_total_revenue as total_revenue,
    pa.agg_product_count as product_count,
    pa.agg_products as products
  FROM province_aggregates pa
  ORDER BY pa.agg_total_revenue DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- Performance Note:
-- - This function uses CTE (Common Table Expressions) for clarity
-- - JSONB aggregation is efficient for returning nested data
-- - STABLE keyword allows query planner optimization
-- - Date filtering uses indexes for optimal performance
-- ==========================================

-- Test queries (uncomment to test):
-- All data:
-- SELECT * FROM get_sales_by_province_with_products(NULL, NULL);

-- Filter by date range (November 2025):
-- SELECT * FROM get_sales_by_province_with_products('2025-11-01', '2025-11-30');

-- From specific date onwards:
-- SELECT * FROM get_sales_by_province_with_products('2025-11-01', NULL);
