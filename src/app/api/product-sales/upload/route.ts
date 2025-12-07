import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  parseShopeeProductSales,
  parseTikTokProductSales,
  parseLazadaProductSales,
  SHOPEE_CODE_COLUMNS,
  TIKTOK_REQUIRED_COLUMNS,
  LAZADA_COLUMNS
} from "@/lib/productSales";
import { type ProvinceAliasMap, type ThaiProvince } from "@/lib/provinceMapper";
import { supabaseAdmin } from "@/lib/supabaseClient";
import type { Json } from "@/lib/database.types";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB to support large TikTok spreadsheets without splitting
const INSERT_BATCH = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase ยังไม่ถูกตั้งค่า" }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const platformInput = (form.get("platform") as string | null)?.toLowerCase();
    const platform = platformInput === "tiktok" ? "TikTok" : platformInput === "shopee" ? "Shopee" : platformInput === "lazada" ? "Lazada" : null;

    if (!file) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์ Excel" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 15MB" }, { status: 400 });
    }

    if (!platform) {
      return NextResponse.json({ error: "กรุณาเลือกแพลตฟอร์ม (Shopee หรือ TikTok)" }, { status: 400 });
    }

    // โหลด mapping จาก product_master ตาม platform
    let codeNameMap: Record<string, string> = {};
    const codeField = platform === "TikTok" ? "tiktok_code" : platform === "Shopee" ? "shopee_code" : "lazada_code";
    const { data: mapData, error: mapError } = await supabaseAdmin
      .from("product_master")
      .select(`${codeField}, name`)
      .eq("is_active", true)
      .not(codeField, "is", null);
    if (!mapError && mapData) {
      codeNameMap = Object.fromEntries(
        mapData
          .filter((d) => {
            const value = (d as Record<string, unknown>)[codeField];
            return value !== null && value !== undefined && String(value).trim() !== "";
          })
          .map((d) => {
            const value = (d as Record<string, unknown>)[codeField];
            return [String(value), d.name];
          })
      );
    }

    // โหลด province aliases จาก DB
    let provinceAliases: Partial<ProvinceAliasMap> = {};
    const { data: aliasRows } = await supabaseAdmin
      .from("province_aliases")
      .select("standard_th, alias");
    if (aliasRows) {
      provinceAliases = aliasRows.reduce((acc, row) => {
        const std = row.standard_th as ThaiProvince;
        if (!std) return acc;
        acc[std] = acc[std] || [];
        acc[std]!.push(String(row.alias).toLowerCase());
        return acc;
      }, {} as Partial<ProvinceAliasMap>);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed =
      platform === "TikTok"
        ? parseTikTokProductSales(buffer, { codeNameMap, provinceAliases })
        : platform === "Lazada"
          ? parseLazadaProductSales(buffer, { codeNameMap, provinceAliases })
          : parseShopeeProductSales(buffer, { codeNameMap, provinceAliases });

    const uploadId = randomUUID();

    // Insert every row (ไม่ลบ order_id เดิม) แล้วให้หน้าดึงไป aggregate ตาม SKU
    const insertRows = parsed.rows.map((row) => ({
      id: randomUUID(),
      platform,
      product_name: row.productName,
      variant_name: row.variantName,
      variant_code: row.variantCode,
      qty_confirmed: row.qtyConfirmed,
      qty_returned: row.qtyReturned ?? 0,
      revenue_confirmed_thb: row.revenueConfirmed,
      row_no: row.rowNo,
      order_id: row.orderId ?? null,
      province_raw: row.provinceRaw ?? null,
      province_normalized: row.provinceNormalized ?? null,
      upload_id: uploadId,
      raw_data: row.raw as unknown as Json,
      created_at: new Date().toISOString()
    }));

    // Dedup ในไฟล์เดียวกัน
    const dedupedMap = new Map<string, typeof insertRows[number]>();
    for (const row of insertRows) {
      const key = `${platform}::${row.order_id ?? "NO_ORDER"}::${row.variant_code ?? "NO_CODE"}`;
      const existing = dedupedMap.get(key);
      if (!existing) {
        dedupedMap.set(key, { ...row });
      } else {
        existing.qty_confirmed += row.qty_confirmed;
        existing.qty_returned += row.qty_returned;
        existing.revenue_confirmed_thb += row.revenue_confirmed_thb;
        const prevDate = existing.created_at ? new Date(existing.created_at).getTime() : 0;
        const newDate = row.created_at ? new Date(row.created_at).getTime() : 0;
        if (newDate > prevDate) {
          existing.created_at = row.created_at;
          existing.row_no = row.row_no;
          existing.upload_id = row.upload_id;
          existing.raw_data = row.raw_data;
        }
      }
    }
    const dedupedRows = Array.from(dedupedMap.values());

    // Insert/upsert batch; ถ้ามี constraint จะ ignore duplicates เพื่อไม่ล้มทั้งไฟล์
    const batches = chunk(dedupedRows, INSERT_BATCH);
    for (const batch of batches) {
      let { error: insertError } = await supabaseAdmin
        .from("product_sales")
        .upsert(batch, { onConflict: "platform,order_id,variant_code", ignoreDuplicates: true });

      if (insertError && insertError.code === "42P10") {
        const retry = await supabaseAdmin.from("product_sales").insert(batch);
        insertError = retry.error;
      }

      if (insertError) {
        console.error("❌ Insert product_sales failed:", insertError);
        return NextResponse.json({ error: "บันทึกข้อมูลยอดขายไม่สำเร็จ", details: insertError.message }, { status: 500 });
      }
    }

    const metaPayload = {
      id: uploadId,
      platform,
      file_name: file.name,
      total_rows: parsed.summary.totalRows,
      total_products: parsed.summary.totalProducts,
      total_variants: parsed.summary.totalVariants,
      total_qty: parsed.summary.totalQty,
      total_revenue: parsed.summary.totalRevenue,
      total_returned: parsed.summary.totalReturned ?? 0,
      status: "completed",
      created_at: new Date().toISOString()
    };

    const { error: metaError } = await supabaseAdmin.from("product_sales_uploads").insert(metaPayload);
    if (metaError) {
      console.error("⚠️ Insert product_sales_uploads failed:", metaError);
    }

    const responseRows = insertRows.map((row) => ({
      id: row.id,
      product: row.product_name,
      variant: row.variant_name,
      qty: row.qty_confirmed,
      qty_returned: row.qty_returned,
      revenue: row.revenue_confirmed_thb,
      created_at: row.created_at,
      upload_id: uploadId
    }));

    return NextResponse.json({
      ok: true,
      notice: "อัปโหลดสำเร็จ",
      summary: {
        ...parsed.summary,
        requiredColumns: platform === "TikTok"
          ? [...TIKTOK_REQUIRED_COLUMNS]
          : Object.values(platform === "Lazada" ? LAZADA_COLUMNS : SHOPEE_CODE_COLUMNS)
      },
      rows: responseRows,
      missingCodes: parsed.missingCodes ?? [],
      unmappedProvinces: parsed.summary.unmappedProvinces ?? []
    });
  } catch (err) {
    console.error("❌ Product sales upload error:", err);
    const message = err instanceof Error ? err.message : "ไม่สามารถอ่านไฟล์ได้";
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ", details: message }, { status: 500 });
  }
}
