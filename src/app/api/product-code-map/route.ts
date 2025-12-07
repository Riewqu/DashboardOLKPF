import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

type EntryInput = {
  platform: string;
  external_code: string;
  name: string;
  is_active?: boolean;
  sku?: string;
};

const validateEntry = (e: EntryInput) =>
  e &&
  typeof e.platform === "string" &&
  typeof e.external_code === "string" &&
  typeof e.name === "string" &&
  e.platform.trim() &&
  e.external_code.trim() &&
  e.name.trim();

export async function GET(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") || undefined;
  const search = searchParams.get("search") || undefined;

  const query = supabaseAdmin.from("product_code_map").select("*").order("updated_at", { ascending: false });
  if (platform && platform !== "all") query.eq("platform", platform);
  if (search && search.trim()) {
    query.ilike("name", `%${search.trim()}%`);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  try {
    const body = await req.json();
    const entries: EntryInput[] = body?.entries ?? [];
    const clean = entries
      .filter(validateEntry)
      .map((e) => ({
        platform: e.platform.trim(),
        external_code: e.external_code.trim(),
        name: e.name.trim(),
        sku: e.sku?.trim() || null,
        is_active: e.is_active ?? true,
        updated_at: new Date().toISOString()
      }));
    if (clean.length === 0) return NextResponse.json({ error: "ไม่มีรายการที่ถูกต้อง" }, { status: 400 });
    const { error } = await supabaseAdmin.from("product_code_map").upsert(clean, { onConflict: "platform,external_code" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, inserted: clean.length });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", details: String(err) }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  try {
    const body = await req.json();
    const { id, name, is_active, sku } = body ?? {};
    if (!id) return NextResponse.json({ error: "ต้องมี id" }, { status: 400 });
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof name === "string") payload.name = name.trim();
    if (typeof is_active === "boolean") payload.is_active = is_active;
    if (typeof sku === "string") payload.sku = sku.trim();
    const { error } = await supabaseAdmin.from("product_code_map").update(payload).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", details: String(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  try {
    const body = await req.json();
    const { id } = body ?? {};
    if (!id) return NextResponse.json({ error: "ต้องมี id" }, { status: 400 });
    const { error } = await supabaseAdmin.from("product_code_map").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", details: String(err) }, { status: 400 });
  }
}
