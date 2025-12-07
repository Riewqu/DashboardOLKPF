import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const VALID_PLATFORMS = ["all", "TikTok", "Shopee", "Lazada"];
const VALID_TYPES = ["revenue", "profit"];

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const platform = searchParams.get("platform");
  const type = searchParams.get("type");

  let query = supabaseAdmin.from("goals").select("*");
  if (year) query = query.eq("year", Number(year));
  if (month) query = query.eq("month", Number(month));
  if (platform) query = query.eq("platform", platform);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) {
    console.error("❌ GET /api/goals error:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลเป้าหมายได้", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const { platform, year, month, type, target } = body || {};

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "platform ต้องเป็น all/TikTok/Shopee/Lazada" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "type ต้องเป็น revenue หรือ profit" }, { status: 400 });
  }
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "year/month ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!Number.isFinite(target)) {
    return NextResponse.json({ error: "target ต้องเป็นตัวเลข" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("goals")
    .upsert(
      {
        platform,
        year,
        month,
        type,
        target,
        updated_at: new Date().toISOString()
      },
      { onConflict: "platform,year,month,type" }
    )
    .select()
    .single();

  if (error) {
    console.error("❌ POST /api/goals error:", error);
    return NextResponse.json({ error: "บันทึกเป้าหมายไม่สำเร็จ", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
