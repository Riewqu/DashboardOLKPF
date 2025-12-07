import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseClient";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

type ParsedRow = {
  name: string;
  sku?: string | null;
  shopee_code?: string | null;
  tiktok_code?: string | null;
  lazada_code?: string | null;
  is_active?: boolean;
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

function readWorkbook(buffer: Buffer, isCsv: boolean) {
  if (!isCsv) {
    return XLSX.read(buffer, { type: "buffer" });
  }
  const candidates: Array<["utf-8" | "windows-874" | "tis-620", string]> = [
    ["utf-8", new TextDecoder("utf-8").decode(buffer)],
    ["windows-874", new TextDecoder("windows-874").decode(buffer)],
    ["tis-620", new TextDecoder("windows-874").decode(buffer)]
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
      const name = pick(row, ["name", "ชื่อสินค้า"]);
      const sku = pick(row, ["sku", "SKU", "รหัสสินค้า"]) || null;
      const shopee = pick(row, ["shopee_code", "Shopee", "shopee", "รหัส shopee", "shopee code"]) || null;
      const tiktok = pick(row, ["tiktok_code", "tiktok", "TikTok", "product_id", "Product ID", "รหัส tiktok"]) || null;
      const lazada = pick(row, ["lazada_code", "lazada", "Lazada", "รหัส lazada"]) || null;
      const is_active = normalizeBool(row["is_active"]);
      if (!name) errors.push(`แถว ${idx + 2}: ไม่มีชื่อสินค้า`);
      return { name, sku, shopee_code: shopee, tiktok_code: tiktok, lazada_code: lazada, is_active };
    });

    const valid = parsed.filter((p) => p.name);
    if (valid.length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่ใช้ได้", errors: errors.slice(0, 20) }, { status: 400 });
    }

    // ตรวจซ้ำในไฟล์สำหรับ shopee_code เพื่อตัดตอนก่อนชน constraint
    const dupShopeeInFile: string[] = [];
    const shopeeMap = new Map<string, string[]>();
    for (const row of valid) {
      if (!row.shopee_code) continue;
      const key = row.shopee_code.trim();
      const list = shopeeMap.get(key) ?? [];
      list.push(row.name);
      shopeeMap.set(key, list);
    }
    for (const [code, names] of shopeeMap.entries()) {
      if (names.length > 1) {
        dupShopeeInFile.push(`${code} -> ${names.join(", ")}`);
      }
    }
    if (dupShopeeInFile.length > 0) {
      return NextResponse.json(
        {
          error: "พบ Shopee Code ซ้ำกันภายในไฟล์",
          duplicates: dupShopeeInFile.slice(0, 20)
        },
        { status: 400 }
      );
    }

    // 1. Collect all codes to check
    const shopeeCodes = valid.map((v) => v.shopee_code).filter(Boolean) as string[];
    const tiktokCodes = valid.map((v) => v.tiktok_code).filter(Boolean) as string[];
    const lazadaCodes = valid.map((v) => v.lazada_code).filter(Boolean) as string[];

    // 2. Query existing products with these codes
    const { data: existingProducts, error: queryError } = await supabaseAdmin
      .from("product_master")
      .select("name, shopee_code, tiktok_code, lazada_code")
      .or(`shopee_code.in.(${JSON.stringify(shopeeCodes)}),tiktok_code.in.(${JSON.stringify(tiktokCodes)}),lazada_code.in.(${JSON.stringify(lazadaCodes)})`);

    if (queryError) {
      console.error("Error checking duplicates:", queryError);
      // Proceed cautiously or fail? Let's fail safe.
      return NextResponse.json({ error: "ตรวจสอบข้อมูลซ้ำไม่สำเร็จ: " + queryError.message }, { status: 500 });
    }

    // 3. Check for conflicts
    const conflicts: string[] = [];
    if (existingProducts && existingProducts.length > 0) {
      for (const item of valid) {
        // Find if any existing product has the same code BUT is not this product (by name)
        // Note: 'name' is our unique key for upsert, so if name matches, it's an update (allowed).
        // If name is different, it's a conflict.

        if (item.shopee_code) {
          const conflict = existingProducts.find(e => e.shopee_code === item.shopee_code && e.name !== item.name);
          if (conflict) conflicts.push(`Shopee Code '${item.shopee_code}' (สินค้า: ${item.name}) ซ้ำกับที่มีอยู่แล้ว (สินค้า: ${conflict.name})`);
        }
        if (item.tiktok_code) {
          const conflict = existingProducts.find(e => e.tiktok_code === item.tiktok_code && e.name !== item.name);
          if (conflict) conflicts.push(`TikTok Code '${item.tiktok_code}' (สินค้า: ${item.name}) ซ้ำกับที่มีอยู่แล้ว (สินค้า: ${conflict.name})`);
        }
        if (item.lazada_code) {
          const conflict = existingProducts.find(e => e.lazada_code === item.lazada_code && e.name !== item.name);
          if (conflict) conflicts.push(`Lazada Code '${item.lazada_code}' (สินค้า: ${item.name}) ซ้ำกับที่มีอยู่แล้ว (สินค้า: ${conflict.name})`);
        }
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json({ 
        error: "พบข้อมูลรหัสสินค้าซ้ำกับที่มีอยู่แล้ว", 
        errors: conflicts.slice(0, 20) 
      }, { status: 400 });
    }

    const payload = valid.map((v) => ({
      id: randomUUID(),
      name: v.name,
      sku: v.sku || null,
      shopee_code: v.shopee_code || null,
      tiktok_code: v.tiktok_code || null,
      lazada_code: v.lazada_code || null,
      is_active: v.is_active ?? true,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin.from("product_master").upsert(payload, { onConflict: "name" });
    if (error) {
      const code = String(error.code || "").toUpperCase();
      if (code === "23505" && error.message?.includes("product_master_shopee_uniq")) {
        // หาแถวที่ซ้ำใน payload เพื่อระบุบรรทัด/สินค้า
        const dupShopee = shopeeCodes.find((c) => c && error.message?.includes(String(c)));
        const dupNames = payload.filter((p) => p.shopee_code && p.shopee_code === dupShopee).map((p) => p.name);
        return NextResponse.json(
          {
            error: "พบ Shopee Code ซ้ำกับข้อมูลที่มีอยู่แล้ว",
            duplicate_code: dupShopee || null,
            duplicate_products: dupNames,
            details: error.message
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      summary: {
        file: file.name,
        totalRows: rows.length,
        validRows: valid.length,
        inserted: payload.length,
        errors: errors.slice(0, 20)
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "นำเข้าไม่สำเร็จ", details: String(err) }, { status: 500 });
  }
}
