import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { type ThaiProvince } from "@/lib/provinceMapper";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data, error } = await supabaseAdmin
    .from("province_aliases")
    .select("id, standard_th, alias, updated_at")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const body = await req.json().catch(() => null);
  const standard_th = body?.standard_th as ThaiProvince | undefined;
  const alias = (body?.alias as string | undefined)?.trim();
  if (!standard_th || !alias) {
    return NextResponse.json({ error: "standard_th and alias required" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("province_aliases")
    .upsert({ standard_th, alias: alias.toLowerCase() })
    .select("id, standard_th, alias, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
