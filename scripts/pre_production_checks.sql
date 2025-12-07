-- ============================================
-- Pre-Production Data Integrity Checks
-- ============================================
-- รัน SQL นี้เพื่อตรวจสอบ data ก่อนขึ้น production
-- ============================================

-- 1. ตรวจสอบว่ามีชื่อสินค้าซ้ำใน product_master หรือไม่
SELECT
    name,
    COUNT(*) as duplicate_count
FROM product_master
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Expected: 0 rows (ไม่ควรมีชื่อซ้ำ)
-- ถ้ามี: ต้องแก้ไขก่อน (เปลี่ยนชื่อหรือลบของซ้ำ)

-- ============================================

-- 2. ตรวจสอบสินค้าใน product_sales ที่ไม่มีใน product_master
SELECT
    ps.product_name,
    COUNT(*) as sales_count,
    SUM(ps.revenue_confirmed_thb) as total_revenue
FROM product_sales ps
LEFT JOIN product_master pm ON ps.product_name = pm.name
WHERE pm.name IS NULL
  AND ps.product_name IS NOT NULL
GROUP BY ps.product_name
ORDER BY sales_count DESC
LIMIT 20;

-- Expected: น้อยที่สุดเท่าที่จะเป็นไปได้
-- ถ้ามีเยอะ: ต้องเพิ่มสินค้าใน product_master ก่อน

-- ============================================

-- 3. ตรวจสอบว่ามี product_sales ที่ product_name เป็น NULL
SELECT COUNT(*) as null_product_count
FROM product_sales
WHERE product_name IS NULL;

-- Expected: 0 หรือน้อยมาก
-- ถ้ามี: ต้องตรวจสอบว่าทำไม (อาจเป็นข้อมูลที่ไม่ได้ map)

-- ============================================

-- 4. ตรวจสอบจำนวนสินค้าที่มีรูป vs ไม่มีรูป
SELECT
    'Has Image' as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM product_master), 2) as percentage
FROM product_master
WHERE image_url IS NOT NULL
UNION ALL
SELECT
    'No Image' as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM product_master), 2) as percentage
FROM product_master
WHERE image_url IS NULL;

-- Expected: สัดส่วนที่พอใจได้
-- Note: ถ้าสินค้าส่วนใหญ่ไม่มีรูป ผลลัพธ์ใน UI ก็จะไม่มีรูปเยอะ (แต่ไม่ใช่ bug)

-- ============================================

-- 5. ตรวจสอบ performance ของ JOIN query
EXPLAIN ANALYZE
SELECT
    ps.id,
    ps.product_name,
    ps.variant_name,
    ps.qty_confirmed,
    ps.revenue_confirmed_thb,
    pm.image_url
FROM product_sales ps
LEFT JOIN product_master pm ON ps.product_name = pm.name
ORDER BY ps.created_at DESC
LIMIT 1000;

-- Expected:
-- - Planning Time: < 1 ms
-- - Execution Time: < 100 ms สำหรับ 1000 rows
-- - ควรเห็น "Index Scan" ไม่ใช่ "Seq Scan"
-- - Join cost ควรต่ำ (< 1000)

-- ============================================

-- 6. ตรวจสอบว่า indexes ถูกสร้างครบ
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('product_sales', 'product_master')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected: ควรเห็น indexes อย่างน้อย 6 ตัว:
-- - idx_product_sales_product_name
-- - idx_product_sales_platform
-- - idx_product_sales_upload_id
-- - idx_product_sales_created_platform
-- - idx_product_master_name
-- - idx_product_master_name_image

-- ============================================

-- 7. ตรวจสอบ foreign key constraint
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'product_sales_product_name_fkey';

-- Expected: 1 row
-- definition ควรมี:
-- - FOREIGN KEY (product_name) REFERENCES product_master(name)
-- - ON UPDATE CASCADE
-- - ON DELETE SET NULL

-- ============================================

-- 8. ตรวจสอบ table sizes (เพื่อประเมิน performance)
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE tablename IN ('product_sales', 'product_master')
ORDER BY size_bytes DESC;

-- Note: ขนาดตาราง
-- - < 100 MB: เร็วมาก
-- - 100-500 MB: เร็ว (ต้องมี indexes)
-- - 500 MB - 5 GB: ปานกลาง (ต้องมี indexes และ optimize queries)
-- - > 5 GB: ควรพิจารณา partitioning

-- ============================================

-- 9. สร้าง test query เพื่อทดสอบ performance
-- Query แบบที่ UI จะใช้จริง
EXPLAIN ANALYZE
SELECT
    ps.id,
    ps.platform,
    ps.product_name,
    ps.variant_name,
    ps.qty_confirmed,
    ps.qty_returned,
    ps.revenue_confirmed_thb,
    ps.created_at,
    pm.image_url
FROM product_sales ps
LEFT JOIN product_master pm ON ps.product_name = pm.name
WHERE ps.platform = 'Shopee'
ORDER BY ps.created_at DESC
LIMIT 1000;

-- Expected Execution Time: < 200ms

-- ============================================

-- 10. ทดสอบ INSERT performance (สำหรับการ upload ข้อมูลใหม่)
-- Note: อันนี้ไม่ต้อง run ใน production, แค่ดูว่า constraint ไม่ทำให้ช้า
EXPLAIN
INSERT INTO product_sales (
    id, platform, product_name, variant_name,
    qty_confirmed, revenue_confirmed_thb, created_at
) VALUES (
    gen_random_uuid(), 'Shopee', 'Test Product', 'Test Variant',
    10, 1000, NOW()
);

-- Expected:
-- - Foreign key check should be fast (< 1ms)
-- - Index updates should be included

-- ============================================
-- สรุปผลการตรวจสอบ
-- ============================================
-- ถ้าทุกอย่างผ่าน:
-- ✅ ไม่มีชื่อสินค้าซ้ำ
-- ✅ Foreign key constraint ถูกสร้าง
-- ✅ Indexes ครบทั้ง 6 ตัว
-- ✅ Query performance < 200ms
-- ✅ ข้อมูลส่วนใหญ่มี product_master ที่ match
--
-- = พร้อมขึ้น Production แล้ว! 🚀
-- ============================================
