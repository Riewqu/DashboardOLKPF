import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("product_id") as string;

    // Validation
    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: "ต้องระบุ product_id" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น" },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const fileName = `${productId}-${timestamp}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old image if exists
    const { data: product } = await supabaseAdmin
      .from("product_master")
      .select("image_url")
      .eq("id", productId)
      .single();

    if (product?.image_url) {
      try {
        // Extract filename from URL
        const oldFileName = product.image_url.split("/").pop();
        if (oldFileName) {
          await supabaseAdmin.storage.from("product-images").remove([oldFileName]);
        }
      } catch (err) {
        console.warn("⚠️ Failed to delete old image:", err);
        // Continue anyway
      }
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Update product_master with image_url
    const { error: updateError } = await supabaseAdmin
      .from("product_master")
      .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (updateError) {
      // Rollback: delete uploaded image
      await supabaseAdmin.storage.from("product-images").remove([fileName]);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`✅ Image uploaded successfully: ${imageUrl}`);

    return NextResponse.json({
      ok: true,
      image_url: imageUrl,
      file_name: fileName,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลด", details: String(err) },
      { status: 500 }
    );
  }
}

// DELETE: ลบรูปภาพ
export async function DELETE(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");

    if (!productId) {
      return NextResponse.json({ error: "ต้องระบุ product_id" }, { status: 400 });
    }

    // Get current image URL
    const { data: product } = await supabaseAdmin
      .from("product_master")
      .select("image_url")
      .eq("id", productId)
      .single();

    if (!product?.image_url) {
      return NextResponse.json({ error: "ไม่มีรูปภาพ" }, { status: 404 });
    }

    // Extract filename from URL
    const fileName = product.image_url.split("/").pop();
    if (!fileName) {
      return NextResponse.json({ error: "URL ไม่ถูกต้อง" }, { status: 400 });
    }

    // Delete from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from("product-images")
      .remove([fileName]);

    if (deleteError) {
      console.warn("⚠️ Failed to delete from storage:", deleteError);
      // Continue anyway
    }

    // Update database (remove image_url)
    const { error: updateError } = await supabaseAdmin
      .from("product_master")
      .update({ image_url: null, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`✅ Image deleted successfully: ${fileName}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Delete error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบ", details: String(err) },
      { status: 500 }
    );
  }
}
