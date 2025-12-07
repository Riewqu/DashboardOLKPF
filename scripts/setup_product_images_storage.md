# Setup Supabase Storage สำหรับรูปสินค้า

## ขั้นตอนที่ 1: สร้าง Storage Bucket

1. ไปที่ Supabase Dashboard → **Storage**
2. คลิก **New bucket**
3. ตั้งค่า:
   - **Name**: `product-images`
   - **Public bucket**: ✅ เปิด (เพื่อให้แสดงรูปได้โดยไม่ต้อง auth)
   - **File size limit**: 5 MB (หรือตามต้องการ)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

4. คลิก **Create bucket**

## ขั้นตอนที่ 2: ตั้งค่า Storage Policy (RLS)

รัน SQL ต่อไปนี้ใน Supabase SQL Editor:

```sql
-- Policy: อนุญาตให้อ่านรูปภาพได้แบบ public
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy: อนุญาตให้อัปโหลดรูปได้ (ปรับเปลี่ยนตามระบบ authentication ของคุณ)
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- Policy: อนุญาตให้อัปเดตรูปได้
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- Policy: อนุญาตให้ลบรูปได้
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
```

หมายเหตุ: ถ้าไม่ใช้ authentication ให้เปลี่ยน policies ให้อนุญาตทุกคนได้:

```sql
-- สำหรับการทดสอบ (ไม่แนะนำใน production)
CREATE POLICY "Public upload for product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');
```

## ขั้นตอนที่ 3: เพิ่มคอลัมน์ image_url

รัน SQL จากไฟล์ `add_image_url_column.sql`

## ขั้นตอนที่ 4: ทดสอบ

1. อัปโหลดรูปทดสอบผ่าน Supabase Dashboard → Storage → product-images
2. คัดลอก Public URL ของรูป
3. ลองเปิด URL ในเบราว์เซอร์ ต้องเห็นรูปภาพ

## โครงสร้างการเก็บไฟล์

```
product-images/
  ├── {product-id}-{timestamp}.jpg
  ├── {product-id}-{timestamp}.png
  └── {product-id}-{timestamp}.webp
```

ตัวอย่าง: `550e8400-e29b-41d4-a716-446655440000-1702345678.jpg`

## ลบรูปเก่าอัตโนมัติ (Optional)

เพิ่ม logic ในโค้ดให้ลบรูปเก่าออกเมื่ออัปโหลดรูปใหม่:

```typescript
// ใน API route
if (oldImageUrl) {
  const oldPath = oldImageUrl.split('/').pop();
  await supabase.storage.from('product-images').remove([oldPath]);
}
```

## สำเร็จ! ✅

ตอนนี้สามารถอัปโหลดและแสดงรูปสินค้าได้แล้ว
