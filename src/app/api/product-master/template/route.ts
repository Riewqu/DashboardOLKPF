import { NextResponse } from "next/server";

export async function GET() {
  const rows = [
    ["name", "sku", "shopee_code", "tiktok_code", "lazada_code", "is_active"],
    ["สินค้าA", "SKU-A", '="195685"', '="1234567890"', '="LZ-001"', "true"],
    ["สินค้าB", "SKU-B", '="246810"', '="9876543210"', '="LZ-002"', "true"]
  ];
  const csvBody = rows.map((r) => r.join(",")).join("\n");
  const csv = "\uFEFF" + csvBody; // BOM for UTF-8

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="product_master_template.csv"'
    }
  });
}
