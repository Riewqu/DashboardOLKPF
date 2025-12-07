import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { type ThaiProvince } from "@/lib/provinceMapper";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "ต้องแนบไฟล์" }, { status: 400 });

  const text = await file.text();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const records: { standard_th: ThaiProvince; alias: string }[] = [];

  for (const line of lines.slice(1)) { // skip header
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const std = parts[0]?.trim();
    const aliasListRaw = parts.slice(1).join(",").trim(); // support comma in alias list
    if (!std || !aliasListRaw) continue;
    const aliases = aliasListRaw.split(/[,;]+/).map((a) => a.trim()).filter(Boolean);
    aliases.forEach((alias) => {
      records.push({ standard_th: std as ThaiProvince, alias: alias.toLowerCase() });
    });
  }
  if (records.length === 0) return NextResponse.json({ error: "ไม่มีข้อมูลในไฟล์" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("province_aliases")
    .upsert(records, { onConflict: "standard_th,alias" })
    .select("id, standard_th, alias, updated_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
