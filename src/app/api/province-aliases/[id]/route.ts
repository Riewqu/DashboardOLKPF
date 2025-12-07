import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { type ThaiProvince } from "@/lib/provinceMapper";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const id = params.id;
  const body = await req.json().catch(() => null);
  const standard_th = body?.standard_th as ThaiProvince | undefined;
  const alias = (body?.alias as string | undefined)?.trim();
  if (!standard_th || !alias) {
    return NextResponse.json({ error: "standard_th and alias required" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("province_aliases")
    .update({ standard_th, alias: alias.toLowerCase() })
    .eq("id", id)
    .select("id, standard_th, alias, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const id = params.id;
  const { error } = await supabaseAdmin.from("province_aliases").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
