-- ============================================
-- Foreign Key Constraint for Product Sales JOIN
-- ============================================
-- วัตถุประสงค์: สร้าง foreign key ระหว่าง product_sales.product_name -> product_master.name
-- เพื่อให้ Supabase รู้จัก relationship และสามารถทำ JOIN ได้
-- รันไฟล์นี้ใน Supabase SQL Editor
-- ============================================

-- Step 1: ตรวจสอบว่ามี foreign key อยู่แล้วหรือไม่
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
  AND c.conrelid = 'product_sales'::regclass;

-- Step 2: ลบ constraint เก่า (ถ้ามี) เพื่อป้องกัน conflict
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'product_sales_product_name_fkey'
    ) THEN
        ALTER TABLE product_sales DROP CONSTRAINT product_sales_product_name_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- Step 3: สร้าง foreign key constraint (แบบ ON DELETE SET NULL เพื่อความปลอดภัย)
-- แบบนี้ถ้าลบสินค้าใน product_master จะไม่ทำให้ product_sales ลำบาก
ALTER TABLE product_sales
ADD CONSTRAINT product_sales_product_name_fkey
FOREIGN KEY (product_name)
REFERENCES product_master(name)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Note: ถ้า product_master.name ยังไม่ได้เป็น UNIQUE หรือ PRIMARY KEY
-- จะต้องสร้าง UNIQUE constraint ก่อน:

-- Step 4: ตรวจสอบว่า product_master.name เป็น UNIQUE หรือยัง
DO $$
BEGIN
    -- ตรวจสอบว่ามี UNIQUE constraint อยู่แล้วหรือไม่
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'product_master_name_key'
          AND contype = 'u'
    ) THEN
        -- ถ้ายังไม่มี ให้สร้าง UNIQUE constraint
        ALTER TABLE product_master
        ADD CONSTRAINT product_master_name_key UNIQUE (name);
        RAISE NOTICE 'Created UNIQUE constraint on product_master.name';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists on product_master.name';
    END IF;
END $$;

-- Step 5: Verify constraint ถูกสร้างสำเร็จ
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'product_sales_product_name_fkey';

-- ============================================
-- Expected Output:
-- ============================================
-- constraint_name: product_sales_product_name_fkey
-- table_name: product_sales
-- referenced_table: product_master
-- constraint_definition: FOREIGN KEY (product_name) REFERENCES product_master(name) ON UPDATE CASCADE ON DELETE SET NULL
-- ============================================

-- ============================================
-- หมายเหตุสำคัญ:
-- ============================================
-- 1. Foreign key constraint ช่วยให้ database รู้ relationship
-- 2. Supabase จะใช้ข้อมูลนี้เพื่อ optimize JOIN query
-- 3. ON DELETE SET NULL หมายถึง ถ้าลบสินค้าใน product_master
--    product_sales.product_name จะกลายเป็น NULL (ไม่ลบ record)
-- 4. ON UPDATE CASCADE หมายถึง ถ้าเปลี่ยนชื่อสินค้าใน product_master
--    product_sales.product_name จะอัปเดตตามอัตโนมัติ
-- ============================================
