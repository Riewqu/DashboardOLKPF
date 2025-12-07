import { NextResponse } from "next/server";

export async function GET() {
  // ใช้ BOM + ใส่ ="..." เพื่อกัน Excel แปลงเป็นวิทยาศาสตร์/ตัวเลข
  const rows = [
    ["platform", "code", "name", "is_active"],
    ["Shopee", '="195685"', "สินค้าA", "true"],
    ["TikTok", '="1234567890"', "สินค้าB", "true"],
    ["Lazada", '="SKU-001"', "สินค้าC", "false"]
  ];
  const csvBody = rows.map((r) => r.join(",")).join("\n");
  const csv = "\uFEFF" + csvBody; // BOM for UTF-8

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="product_code_map_template.csv"'
    }
  });
}
