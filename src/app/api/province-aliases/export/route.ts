import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";

  const { data, error } = await supabaseAdmin
    .from("province_aliases")
    .select("standard_th, alias")
    .order("standard_th", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group aliases by standard_th
  const grouped = new Map<string, Set<string>>();
  (data ?? []).forEach((row) => {
    const std = row.standard_th;
    const alias = String(row.alias).trim();
    if (!std || !alias) return;
    if (!grouped.has(std)) grouped.set(std, new Set());
    grouped.get(std)!.add(alias);
  });

  if (format === "csv") {
    const header = "standard_th,aliases";
    const body = Array.from(grouped.entries())
      .map(([std, aliases]) => `${std},"${Array.from(aliases).join(",")}"`)
      .join("\n");
    // UTF-8 with BOM for Thai compatibility in Excel
    const csv = "\uFEFF" + [header, body].join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="province_aliases.csv"',
      },
    });
  }

  if (format === "xlsx") {
    const rows = Array.from(grouped.entries()).map(([standard_th, aliases]) => ({
      standard_th,
      aliases: Array.from(aliases).join(","),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "province_aliases");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="province_aliases.xlsx"',
      },
    });
  }

  const jsonItems = Array.from(grouped.entries()).map(([standard_th, aliases]) => ({
    standard_th,
    aliases: Array.from(aliases),
  }));
  return NextResponse.json({ items: jsonItems });
}
