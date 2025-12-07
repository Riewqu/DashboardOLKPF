import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { randomUUID } from "crypto";

type MasterInput = {
  id?: string;
  name: string;
  sku?: string;
  shopee_code?: string;
  tiktok_code?: string;
  lazada_code?: string;
  is_active?: boolean;
  image_url?: string;
};

type MasterRow = {
  id: string;
  name: string;
  sku: string | null;
  shopee_code: string | null;
  tiktok_code: string | null;
  lazada_code: string | null;
  is_active: boolean;
  image_url: string | null;
  updated_at: string;
};

const cleanInput = (entry: MasterInput): MasterRow | null => {
  const name = entry.name?.trim();
  if (!name) return null;
  return {
    id: entry.id?.trim() || randomUUID(),
    name,
    sku: entry.sku?.trim() || null,
    shopee_code: entry.shopee_code?.trim() || null,
    tiktok_code: entry.tiktok_code?.trim() || null,
    lazada_code: entry.lazada_code?.trim() || null,
    is_active: entry.is_active ?? true,
    image_url: entry.image_url?.trim() || null,
    updated_at: new Date().toISOString()
  };
};

export async function GET(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const active = searchParams.get("active");

  let query = supabaseAdmin.from("product_master").select("*").order("updated_at", { ascending: false });
  if (active === "true") query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered =
    search.length === 0
      ? data
      : data?.filter((row) => {
          const hay = `${row.name} ${row.sku ?? ""} ${row.shopee_code ?? ""} ${row.tiktok_code ?? ""} ${row.lazada_code ?? ""}`.toLowerCase();
          return hay.includes(search);
        }) ?? [];

  return NextResponse.json({ data: filtered });
}

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  try {
    const body = await req.json();
    const entries: MasterInput[] = body?.entries ?? [];
    const clean = entries
      .map(cleanInput)
      .filter((v): v is MasterRow => Boolean(v));
    if (clean.length === 0) return NextResponse.json({ error: "ไม่มีรายการที่ถูกต้อง" }, { status: 400 });

    const { error } = await supabaseAdmin.from("product_master").upsert(clean, { onConflict: "name" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, upserted: clean.length });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", details: String(err) }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  try {
    const body = await req.json();
    const { id, name, sku, shopee_code, tiktok_code, lazada_code, is_active, image_url } = body ?? {};
    if (!id) return NextResponse.json({ error: "ต้องมี id" }, { status: 400 });
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof name === "string") payload.name = name.trim();
    if (typeof sku === "string") payload.sku = sku.trim() || null;
    if (typeof shopee_code === "string") payload.shopee_code = shopee_code.trim() || null;
    if (typeof tiktok_code === "string") payload.tiktok_code = tiktok_code.trim() || null;
    if (typeof lazada_code === "string") payload.lazada_code = lazada_code.trim() || null;
    if (typeof is_active === "boolean") payload.is_active = is_active;
    if (typeof image_url === "string") payload.image_url = image_url.trim() || null;

    const { error } = await supabaseAdmin.from("product_master").update(payload).eq("id", id);
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
    const { error } = await supabaseAdmin.from("product_master").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload", details: String(err) }, { status: 400 });
  }
}
