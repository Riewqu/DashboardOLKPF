# 🚀 Production Migration Guide

## 📋 Overview

คู่มือนี้อธิบายวิธีการ migrate ระบบไปใช้ SQL JOIN อย่างปลอดภัยใน production environment

---

## 🎯 Migration Strategy

### **เลือก 1 จาก 3 วิธี:**

---

## 🟢 วิธีที่ 1: Zero-Downtime Migration (แนะนำ! 🌟)

**เหมาะสำหรับ:** Production ที่ต้องรันตลอด 24/7

### ขั้นตอน:

#### **Phase 1: เตรียมการ (ไม่กระทบ production)**
```bash
# 1. รัน pre-production checks ก่อน
# ใน Supabase SQL Editor:
# - Run: scripts/pre_production_checks.sql
# - ตรวจสอบผลลัพธ์ทั้งหมด
# - แก้ไขปัญหา (ถ้ามี) ก่อนไป Phase 2
```

#### **Phase 2: สร้าง indexes (ในเวลาทำการน้อย)**
```sql
-- รัน: scripts/add_product_sales_indexes.sql
-- ⏱️ ใช้เวลา: 2-10 นาที (ขึ้นกับขนาด data)
-- 📊 Impact: น้อยมาก (Postgres สามารถสร้าง index แบบไม่ lock table)
-- ⚠️ แนะนำ: รันในช่วงที่ traffic น้อย (เช่น ตี 2-4)
```

#### **Phase 3: สร้าง foreign key (ในเวลาทำการน้อย)**
```sql
-- รัน: scripts/add_foreign_key_constraint.sql
-- ⏱️ ใช้เวลา: 1-5 นาที
-- 📊 Impact: น้อยมาก
-- ⚠️ แนะนำ: รันในช่วงที่ traffic น้อย
```

#### **Phase 4: Deploy code (Gradual Rollout)**
```bash
# Option A: Feature Flag (ดีที่สุด)
# - เพิ่ม environment variable: ENABLE_JOIN_QUERY=false
# - Deploy code
# - เปลี่ยน ENABLE_JOIN_QUERY=true ทีละเล็กทีละน้อย
# - Monitor errors และ performance

# Option B: Blue-Green Deployment
# - Deploy version ใหม่ไปยัง staging environment
# - Test จนแน่ใจ
# - Switch traffic ไปยัง production

# Option C: Rolling Update
# - Deploy ไปยัง server 1 ตัวก่อน
# - Monitor 5-10 นาที
# - Deploy ไปยัง server อื่นๆ ทีละตัว
```

#### **Phase 5: Monitor & Verify**
```bash
# ตรวจสอบ metrics ต่อไปนี้:
# - Query response time (ควร < 200ms)
# - Error rate (ควรเป็น 0%)
# - Database CPU usage (ไม่ควรเพิ่มขึ้น)
# - Memory usage (ไม่ควรเพิ่มขึ้น)

# ดู logs ใน Supabase Dashboard:
# - ไม่ควรมี foreign key violation errors
# - ไม่ควรมี JOIN errors
# - ควรเห็น "✅ Fetched xxx sales records" ใน application logs
```

---

## 🟡 วิธีที่ 2: Maintenance Window Migration

**เหมาะสำหรับ:** Production ที่สามารถ maintenance ได้ (เช่น กลางคืน)

### ขั้นตอน:

```bash
# 1. แจ้ง maintenance window ล่วงหน้า (เช่น เสาร์ ตี 2-4)

# 2. ระหว่าง maintenance window:
#    a. หยุด application server (optional - ถ้าต้องการความปลอดภัยสูงสุด)
#    b. รัน: scripts/pre_production_checks.sql
#    c. แก้ไขปัญหา (ถ้ามี)
#    d. รัน: scripts/add_product_sales_indexes.sql
#    e. รัน: scripts/add_foreign_key_constraint.sql
#    f. Deploy code ใหม่
#    g. รัน smoke tests
#    h. เปิด application server

# 3. Monitor เป็นเวลา 1-2 ชั่วโมง

# 4. ถ้ามีปัญหา: Rollback (ดู section ด้านล่าง)
```

**Downtime:** 30-60 นาที

---

## 🔴 วิธีที่ 3: Quick Migration (ไม่แนะนำสำหรับ production ใหญ่)

**เหมาะสำหรับ:** Development, Staging, หรือ production เล็กๆ

### ขั้นตอน:

```bash
# 1. รัน SQL ทั้ง 2 ไฟล์ติดกัน
# 2. Deploy code
# 3. Test
# 4. เสร็จ!
```

**⚠️ ข้อเสีย:**
- ไม่มีการ test ก่อน
- ไม่มี rollback plan ชัดเจน
- เสี่ยงต่อ production outage

---

## 🛡️ Rollback Plan

### **ถ้า Migration ไม่สำเร็จ มี 3 วิธี rollback:**

#### **Option 1: Rollback Code Only (เร็วที่สุด - 5 นาที)**
```bash
# 1. Revert code ไปเป็น version เดิม
# 2. Deploy
# 3. ระบบจะกลับไปใช้ fallback mechanism อัตโนมัติ
# 4. ยังคงมี indexes และ foreign key (ไม่เป็นอันตราย)

# Pros: เร็ว, ปลอดภัย
# Cons: ไม่ได้ประโยชน์จาก indexes
```

#### **Option 2: Remove Foreign Key (ปานกลาง - 10 นาที)**
```sql
-- ถ้า foreign key ทำให้เกิดปัญหา (เช่น constraint violation):

-- 1. ลบ foreign key constraint
ALTER TABLE product_sales
DROP CONSTRAINT IF EXISTS product_sales_product_name_fkey;

-- 2. Revert code (ถ้าจำเป็น)

-- Pros: แก้ปัญหา constraint violation
-- Cons: ยังคงมี indexes (ไม่เป็นปัญหา)
```

#### **Option 3: Full Rollback (ช้า - 30 นาที)**
```sql
-- ลบทั้ง foreign key และ indexes:

-- 1. ลบ foreign key
ALTER TABLE product_sales DROP CONSTRAINT IF EXISTS product_sales_product_name_fkey;

-- 2. ลบ UNIQUE constraint
ALTER TABLE product_master DROP CONSTRAINT IF EXISTS product_master_name_key;

-- 3. ลบ indexes (optional - ไม่จำเป็นจริงๆ เพราะไม่มีผลเสีย)
DROP INDEX IF EXISTS idx_product_sales_product_name;
DROP INDEX IF EXISTS idx_product_sales_platform;
DROP INDEX IF EXISTS idx_product_sales_upload_id;
DROP INDEX IF EXISTS idx_product_sales_created_platform;
DROP INDEX IF EXISTS idx_product_master_name;
DROP INDEX IF EXISTS idx_product_master_name_image;

-- 4. Revert code

-- Pros: กลับไปเหมือนเดิม 100%
-- Cons: ช้า, เสียเวลา
```

---

## 📊 Success Criteria

### **Migration ถือว่าสำเร็จเมื่อ:**

#### **1. Performance Metrics ✅**
```
- Average query time < 200ms (เดิม: 3-10 วินาที)
- P95 query time < 500ms
- P99 query time < 1 วินาที
- Error rate = 0%
```

#### **2. Functional Tests ✅**
```
- รูปภาพแสดงขึ้นใน /product-sales
- Platform filter ทำงานถูกต้อง
- Pagination ทำงานถูกต้อง
- Search ทำงานถูกต้อง
- Export Excel ทำงานถูกต้อง
```

#### **3. Console Logs ✅**
```
- เห็น: "🔍 Fetching product sales with JOIN..."
- เห็น: "✅ Fetched xxx sales records"
- เห็น: "📊 xx/xxx records have product images"
- ไม่เห็น: "⚠️ JOIN failed, falling back..."
- ไม่มี errors ใน console
```

#### **4. Database Health ✅**
```
- CPU usage ไม่เพิ่มขึ้น (หรือลดลง)
- Memory usage ไม่เพิ่มขึ้น
- Connections ไม่เพิ่มขึ้น
- Query queue ไม่มีการสะสม
```

---

## 🔍 Monitoring Checklist

### **ช่วง 1 ชั่วโมงแรก (Critical):**
- [ ] ตรวจสอบ application logs ทุก 5 นาที
- [ ] ตรวจสอบ Supabase metrics ทุก 5 นาที
- [ ] ทดสอบ UI ด้วยตนเอง 2-3 ครั้ง
- [ ] เช็ค error tracking service (Sentry, etc.)

### **วันแรก (Important):**
- [ ] ตรวจสอบ logs ทุก 30 นาที
- [ ] Review query performance metrics
- [ ] ตรวจสอบ user feedback/complaints
- [ ] เช็ค database slow query logs

### **สัปดาห์แรก (Maintenance):**
- [ ] Daily performance review
- [ ] Weekly database optimization check
- [ ] User feedback monitoring
- [ ] Plan for further optimization (ถ้าจำเป็น)

---

## 🧪 Testing Checklist

### **ก่อน Migration (Staging):**
- [ ] รัน pre_production_checks.sql บน staging
- [ ] Test load โดย simulate production traffic
- [ ] Test upload ไฟล์ใหม่
- [ ] Test แก้ไข product_master
- [ ] Test ลบ product_master (ควร set NULL ใน product_sales)
- [ ] Test query performance ด้วย EXPLAIN ANALYZE
- [ ] Test แต่ละ platform filter (Shopee, TikTok, Lazada)
- [ ] Test pagination (หน้า 1, 10, 100)
- [ ] Test search functionality
- [ ] Test export Excel

### **หลัง Migration (Production):**
- [ ] Smoke tests ทันที (< 5 นาที)
- [ ] Full regression tests (30 นาที)
- [ ] User acceptance tests (ถ้าจำเป็น)
- [ ] Load testing (optional)

---

## 📞 Emergency Contacts

### **ในกรณีฉุกเฉิน:**

1. **Immediate Actions:**
   - Check application logs
   - Check Supabase logs/metrics
   - Check error tracking service

2. **Quick Rollback:**
   ```bash
   # Deploy เวอร์ชันเก่า
   git revert [commit_hash]
   git push
   # หรือ
   # Deploy from previous stable tag
   ```

3. **Database Rollback:**
   ```sql
   -- ลบ foreign key (ถ้าจำเป็น)
   ALTER TABLE product_sales
   DROP CONSTRAINT IF EXISTS product_sales_product_name_fkey;
   ```

4. **Communication:**
   - แจ้งทีมทันที
   - Update status page (ถ้ามี)
   - Document incident

---

## 🎓 Best Practices

### **DO ✅**
- รัน pre-production checks ก่อนเสมอ
- Test บน staging ก่อน production
- มี rollback plan พร้อมใช้
- Monitor อย่างใกล้ชิดหลัง deploy
- Document ทุกขั้นตอน
- Backup database ก่อน migration (ถ้าจำเป็น)

### **DON'T ❌**
- อย่า deploy ตรงๆ โดยไม่ test
- อย่า run SQL ที่ไม่เข้าใจใน production
- อย่าลืม monitor หลัง deploy
- อย่า panic ถ้าเจอปัญหา (มี rollback plan)
- อย่าทำ migration ในช่วง peak hours

---

## 📚 Additional Resources

- **Pre-Production Checks:** `scripts/pre_production_checks.sql`
- **Indexes Setup:** `scripts/add_product_sales_indexes.sql`
- **Foreign Key Setup:** `scripts/add_foreign_key_constraint.sql`
- **Setup Guide:** `PRODUCT_SALES_JOIN_SETUP.md`
- **Project Docs:** `CLAUDE.md`

---

**Version:** 1.0
**Last Updated:** 2025-12-06
**Status:** ✅ Production Ready
