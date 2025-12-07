-- ============================================
-- Performance Indexes for Product Sales
-- ============================================
-- วัตถุประสงค์: Optimize JOIN query ระหว่าง product_sales และ product_master
-- รันไฟล์นี้ใน Supabase SQL Editor
-- ============================================

-- 1. Index สำหรับ product_sales.product_name (ใช้ใน JOIN)
CREATE INDEX IF NOT EXISTS idx_product_sales_product_name
ON product_sales(product_name);

-- 2. Index สำหรับ product_master.name (Primary key สำหรับ JOIN)
CREATE INDEX IF NOT EXISTS idx_product_master_name
ON product_master(name);

-- 3. Composite index สำหรับ product_master (optimize SELECT name, image_url)
-- WHERE image_url IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_product_master_name_image
ON product_master(name, image_url)
WHERE image_url IS NOT NULL;

-- 4. Index สำหรับ product_sales.platform (ใช้ตอน filter)
CREATE INDEX IF NOT EXISTS idx_product_sales_platform
ON product_sales(platform);

-- 5. Index สำหรับ product_sales.upload_id (ใช้ตอน filter latest uploads)
CREATE INDEX IF NOT EXISTS idx_product_sales_upload_id
ON product_sales(upload_id);

-- 6. Composite index สำหรับ query ที่ใช้บ่อย
CREATE INDEX IF NOT EXISTS idx_product_sales_created_platform
ON product_sales(created_at DESC, platform);

-- ============================================
-- ตรวจสอบว่า indexes ถูกสร้างแล้ว
-- ============================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('product_sales', 'product_master')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- Expected Output:
-- ============================================
-- idx_product_sales_product_name
-- idx_product_sales_platform
-- idx_product_sales_upload_id
-- idx_product_sales_created_platform
-- idx_product_master_name
-- idx_product_master_name_image
-- ============================================
