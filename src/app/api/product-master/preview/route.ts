import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

type ProductRow = {
  name: string;
  shopee_code: string | null;
  tiktok_code: string | null;
  lazada_code: string | null;
  sku: string | null;
  is_active: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    // อ่านไฟล์ Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (data.length === 0) {
      return NextResponse.json({ error: "ไฟล์ว่างเปล่า" }, { status: 400 });
    }

    // ตรวจสอบคอลัมน์ที่จำเป็น
    const requiredColumns = ["name"];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `ขาดคอลัมน์: ${missingColumns.join(", ")}` },
        { status: 400 }
      );
    }

    // ประมวลผลข้อมูล
    const rows: ProductRow[] = [];
    const warnings: string[] = [];
    const existingNames = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row (header = 1)

      const name = String(row.name || "").trim();
      if (!name) {
        warnings.push(`แถว ${rowNum}: ไม่มีชื่อสินค้า`);
        continue;
      }

      // ตรวจสอบชื่อซ้ำในไฟล์
      if (existingNames.has(name)) {
        warnings.push(`แถว ${rowNum}: ชื่อ "${name}" ซ้ำในไฟล์`);
      }
      existingNames.add(name);

      rows.push({
        name,
        shopee_code: row.shopee_code ? String(row.shopee_code).trim() : null,
        tiktok_code: row.tiktok_code ? String(row.tiktok_code).trim() : null,
        lazada_code: row.lazada_code ? String(row.lazada_code).trim() : null,
        sku: row.sku ? String(row.sku).trim() : null,
        is_active: row.is_active !== false && row.is_active !== "false" && row.is_active !== 0,
      });
    }

    // สรุปข้อมูล
    const summary = {
      file: file.name,
      totalRows: data.length,
      validRows: rows.length,
      invalidRows: data.length - rows.length,
      activeProducts: rows.filter((r) => r.is_active).length,
      withShopee: rows.filter((r) => r.shopee_code).length,
      withTiktok: rows.filter((r) => r.tiktok_code).length,
      withLazada: rows.filter((r) => r.lazada_code).length,
      withSku: rows.filter((r) => r.sku).length,
      warnings,
    };

    // ตัวอย่างข้อมูล 5 แถวแรก
    const sample = rows.slice(0, 5);

    return NextResponse.json({
      summary,
      sample,
      requiredColumns: ["name"],
      optionalColumns: ["shopee_code", "tiktok_code", "lazada_code", "sku", "is_active"],
    });
  } catch (error) {
    console.error("❌ Preview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
