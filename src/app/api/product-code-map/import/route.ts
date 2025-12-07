import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabaseClient";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

type ParsedRow = {
  platform: string;
  external_code: string;
  name: string;
  is_active?: boolean;
  sku?: string | null;
};

const normalizeBool = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(v)) return true;
    if (["false", "0", "no", "n", "off"].includes(v)) return false;
  }
  return undefined;
};

const pick = (row: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const v = row[key];
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
};

const PLATFORM_VALUES = ["Shopee", "TikTok", "Lazada"];

function readWorkbook(buffer: Buffer, isCsv: boolean) {
  if (!isCsv) {
    return XLSX.read(buffer, { type: "buffer" });
  }
  const candidates: Array<["utf-8" | "windows-874" | "tis-620", string]> = [
    ["utf-8", new TextDecoder("utf-8").decode(buffer)],
    ["windows-874", new TextDecoder("windows-874").decode(buffer)],
    ["tis-620", new TextDecoder("windows-874").decode(buffer)] // fallback Thai
  ];
  for (const [, text] of candidates) {
    try {
      const wb = XLSX.read(text, { type: "string" });
      if (wb.SheetNames.length > 0) return wb;
    } catch {
      // try next
    }
  }
  return XLSX.read(buffer, { type: "buffer" });
}

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "กรุณาเลือกไฟล์" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 5MB" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const isCsv = file.name?.toLowerCase().endsWith(".csv") || (file.type || "").includes("csv");
    const workbook = readWorkbook(buffer, Boolean(isCsv));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const errors: string[] = [];

    const parsed: ParsedRow[] = rows.map((row, idx) => {
      const platform = pick(row, ["platform", "Platform", "แพลตฟอร์ม"]);
      const external_code = pick(row, ["code", "external_code", "product_id", "รหัสตัวเลือกสินค้า", "sku"]);
      const name = pick(row, ["name", "title", "product_name", "ชื่อสินค้า"]);
      const sku = pick(row, ["sku", "SKU", "Sku", "รหัสสินค้า"]).trim() || null;
      const is_active = normalizeBool(row["is_active"]);
      if (!platform || !PLATFORM_VALUES.includes(platform)) {
        errors.push(`แถว ${idx + 2}: platform ไม่ถูกต้อง (ต้องเป็น Shopee/TikTok/Lazada)`);
      }
      if (!external_code) {
        errors.push(`แถว ${idx + 2}: ไม่มี code`);
      }
      if (!name) {
        errors.push(`แถว ${idx + 2}: ไม่มีชื่อสินค้า`);
      }
      return { platform, external_code, name, sku, is_active };
    });

    const valid = parsed.filter((p) => p.platform && p.external_code && p.name && PLATFORM_VALUES.includes(p.platform));
    if (valid.length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่ใช้ได้", errors: errors.slice(0, 20) }, { status: 400 });
    }

    // ตรวจสอบใหม่/อัปเดต
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("product_code_map")
      .select("platform, external_code")
      .in(
        "platform",
        Array.from(new Set(valid.map((v) => v.platform)))
      );
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingSet = new Set((existing ?? []).map((e) => `${e.platform}:${e.external_code}`));
    let newCount = 0;
    let updateCount = 0;
    valid.forEach((v) => {
      if (existingSet.has(`${v.platform}:${v.external_code}`)) updateCount += 1;
      else newCount += 1;
    });

    const upsertPayload = valid.map((v) => ({
      platform: v.platform,
      external_code: v.external_code,
      name: v.name,
      sku: v.sku ?? null,
      is_active: v.is_active ?? true,
      updated_at: new Date().toISOString()
    }));

    const { error: upsertError } = await supabaseAdmin.from("product_code_map").upsert(upsertPayload, { onConflict: "platform,external_code" });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      summary: {
        file: file.name,
        totalRows: rows.length,
        validRows: valid.length,
        newCount,
        updateCount,
        errors: errors.slice(0, 20)
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "นำเข้าไม่สำเร็จ", details: String(err) }, { status: 500 });
  }
}
