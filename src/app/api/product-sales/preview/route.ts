import { NextResponse } from "next/server";
import {
  parseShopeeProductSales,
  parseTikTokProductSales,
  parseLazadaProductSales,
  SHOPEE_CODE_COLUMNS,
  TIKTOK_REQUIRED_COLUMNS,
  LAZADA_COLUMNS
} from "@/lib/productSales";
import { supabaseAdmin } from "@/lib/supabaseClient";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB to avoid needing to split large spreadsheets

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const platformInput = (form.get("platform") as string | null)?.toLowerCase();
    const platform = platformInput === "tiktok" ? "TikTok" : platformInput === "lazada" ? "Lazada" : "Shopee";

    if (!file) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์ Excel" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 15MB" }, { status: 400 });
    }

    // โหลด mapping จาก Supabase ตาม platform
    let codeNameMap: Record<string, string> = {};
    if (supabaseAdmin) {
      const codeField = platform === "TikTok" ? "tiktok_code" : platform === "Shopee" ? "shopee_code" : "lazada_code";
      const { data, error } = await supabaseAdmin
        .from("product_master")
        .select(`${codeField}, name`)
        .eq("is_active", true)
        .not(codeField, "is", null);
      if (!error && data) {
        codeNameMap = Object.fromEntries(
          data
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
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed =
      platform === "TikTok"
        ? parseTikTokProductSales(buffer, { codeNameMap })
        : platform === "Lazada"
          ? parseLazadaProductSales(buffer, { codeNameMap })
          : parseShopeeProductSales(buffer, { codeNameMap });

    return NextResponse.json({
      ok: true,
      summary: parsed.summary,
      sample: parsed.rows.slice(0, 8),
      requiredColumns: platform === "TikTok"
        ? [...TIKTOK_REQUIRED_COLUMNS]
        : Object.values(platform === "Lazada" ? LAZADA_COLUMNS : SHOPEE_CODE_COLUMNS),
      missingCodes: parsed.missingCodes ?? []
    });
  } catch (err) {
    console.error("❌ Product sales preview error:", err);
    const message = err instanceof Error ? err.message : "ไม่สามารถอ่านไฟล์ได้";
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอ่านไฟล์", details: message }, { status: 500 });
  }
}
