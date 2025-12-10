-- ========================================
-- 📅 Add Order Date Column to Product Sales
-- ========================================
-- This migration adds order_date column to product_sales table
-- to enable date-based filtering and analysis

-- Add order_date column
ALTER TABLE product_sales
ADD COLUMN IF NOT EXISTS order_date DATE;

-- Add comment
COMMENT ON COLUMN product_sales.order_date IS 'Order date extracted from Excel file (Created Time column)';

-- Create index for date-based queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_product_sales_order_date
ON product_sales(order_date DESC);

-- Create composite index for platform + date queries
CREATE INDEX IF NOT EXISTS idx_product_sales_platform_date
ON product_sales(platform, order_date DESC);

-- Create composite index for province + date queries
CREATE INDEX IF NOT EXISTS idx_product_sales_province_date
ON product_sales(province_normalized, order_date DESC)
WHERE province_normalized IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'product_sales'
  AND column_name = 'order_date';

-- ========================================
-- ✅ Migration Complete!
-- ========================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update TypeScript types: npm run gen:types
-- 3. Deploy the updated parser code
-- 4. Re-upload product sales files to populate order_date
