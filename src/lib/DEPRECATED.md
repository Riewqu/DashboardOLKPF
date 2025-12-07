# ⚠️ Deprecated Files

ไฟล์เหล่านี้ไม่ได้ใช้งานแล้ว (หลังจากอัปเดตเป็น Supabase-only)

## ไฟล์ที่ไม่ได้ใช้:

### 1. `mockData.ts`
- **ใช้เดิม:** สร้าง mock data สำหรับ fallback
- **แทนที่ด้วย:** ดึงข้อมูลจาก Supabase `platform_metrics` เท่านั้น
- **สามารถลบได้:** ใช่ (แต่เก็บไว้ก่อนเผื่ออ้างอิง)

### 2. `shopeeLoader.ts`
- **ใช้เดิม:** โหลดและ parse Shopee Excel จากโฟลเดอร์ `data/`
- **แทนที่ด้วย:** `transactionParser.ts` (parse จาก upload API)
- **สามารถลบได้:** ใช่

### 3. `lazadaLoader.ts`
- **ใช้เดิม:** โหลดและ parse Lazada Excel จากโฟลเดอร์ `data/`
- **แทนที่ด้วย:** `transactionParser.ts` (parse จาก upload API)
- **สามารถลบได้:** ใช่

### 4. `tiktokLoader.ts`
- **ใช้เดิม:** โหลดและ parse TikTok Excel จากโฟลเดอร์ `data/`
- **แทนที่ด้วย:** `transactionParser.ts` (parse จาก upload API)
- **สามารถลบได้:** ใช่

### 5. `ingest.ts`
- **ใช้เดิม:** Parse Excel และคำนวณ metrics แบบเก่า
- **แทนที่ด้วย:** `transactionParser.ts` (รองรับ upsert + batch tracking)
- **สามารถลบได้:** ใช่

---

## ไฟล์ที่ใช้งานอยู่:

✅ **`transactionParser.ts`** - Parse Excel และ extract Order ID + SKU
✅ **`supabaseClient.ts`** - Supabase client (typed)
✅ **`database.types.ts`** - TypeScript types จาก Supabase

---

## คำสั่งลบไฟล์ที่ไม่ใช้ (ถ้าต้องการ):

```bash
# ลบไฟล์ deprecated
rm lib/mockData.ts
rm lib/shopeeLoader.ts
rm lib/lazadaLoader.ts
rm lib/tiktokLoader.ts
rm lib/ingest.ts
```

**หมายเหตุ:** ถ้าคุณยังต้องการอ้างอิงโครงสร้างเดิม แนะนำให้เก็บไว้ก่อน
