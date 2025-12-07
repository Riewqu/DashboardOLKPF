import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type TopProduct = {
  name: string;
  variant: string;
  revenue: number;
  qty: number;
  returned: number;
  platforms: string[];
  latest_at: string | null;
  image_url: string | null;
};

type TopPlatformRow = {
  platform: string;
  variant: string;
  revenue: number;
  qty: number;
};

const BATCH_SIZE = 1000;

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const productsMap = new Map<string, TopProduct>();
    const provincesMap = new Map<string, { revenue: number; qty: number }>();
    const platformVariantMap = new Map<string, Map<string, { variant: string; revenue: number; qty: number }>>();

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from("product_sales")
        .select("product_name,variant_name,platform,qty_confirmed,qty_returned,revenue_confirmed_thb,province_normalized,created_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (platform && platform !== "all") {
        query = query.eq("platform", platform);
      }
      if (start) {
        query = query.gte("created_at", start);
      }
      if (end) {
        query = query.lte("created_at", end);
      }

      const { data, error } = await query;
      if (error) {
        console.error("❌ top-products query error:", error);
        return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลยอดขายสินค้าได้" }, { status: 500 });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      data.forEach((row) => {
        const name = row.product_name || row.variant_name || "ไม่ระบุสินค้า";
        const variant = row.variant_name || name;
        const key = `${name}|${variant}`;
        const revenue = Number(row.revenue_confirmed_thb ?? 0);
        const qty = Number(row.qty_confirmed ?? 0);
        const returned = Number(row.qty_returned ?? 0);
        const platformValue = row.platform || "unknown";
        const createdAt = row.created_at as string | null;

        if (!productsMap.has(key)) {
          productsMap.set(key, {
            name,
            variant,
            revenue: 0,
            qty: 0,
            returned: 0,
            platforms: [],
            latest_at: createdAt ?? null,
            image_url: null
          });
        }
        const item = productsMap.get(key)!;
        item.revenue += revenue;
        item.qty += qty;
        item.returned += returned;
        if (createdAt && (!item.latest_at || new Date(createdAt) > new Date(item.latest_at))) {
          item.latest_at = createdAt;
        }
        if (platformValue && !item.platforms.includes(platformValue)) {
          item.platforms.push(platformValue);
        }

        const province = row.province_normalized || "ไม่ระบุจังหวัด";
        if (!provincesMap.has(province)) {
          provincesMap.set(province, { revenue: 0, qty: 0 });
        }
        const p = provincesMap.get(province)!;
        p.revenue += revenue;
        p.qty += qty;

        // เก็บ top รายแพลตฟอร์มแบบไม่ปนกัน
        if (!platformVariantMap.has(platformValue)) {
          platformVariantMap.set(platformValue, new Map());
        }
        const platformMap = platformVariantMap.get(platformValue)!;
        const variantKey = variant || name;
        if (!platformMap.has(variantKey)) {
          platformMap.set(variantKey, { variant: variantKey, revenue: 0, qty: 0 });
        }
        const stat = platformMap.get(variantKey)!;
        stat.revenue += revenue;
        stat.qty += qty;
      });

      if (data.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }
    }

    const allProducts = Array.from(productsMap.values());
    const topProducts = allProducts
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Fetch images for top products from product_master
    const productNames = topProducts.map(p => p.name);
    if (productNames.length > 0) {
      const { data: images } = await supabaseAdmin
        .from("product_master")
        .select("name, image_url")
        .in("name", productNames);

      if (images) {
        const imageMap = new Map(images.map(img => [img.name, img.image_url || null]));
        topProducts.forEach(p => {
          p.image_url = imageMap.get(p.name) || null;
        });
      }
    }

    const platforms: (TopPlatformRow | null)[] = ["Shopee", "TikTok", "Lazada"].map((pf) => {
      const platformRows = platformVariantMap.get(pf);
      if (!platformRows || platformRows.size === 0) return null;
      const candidate = Array.from(platformRows.values()).sort((a, b) => b.revenue - a.revenue)[0];
      return {
        platform: pf,
        variant: candidate.variant,
        revenue: candidate.revenue,
        qty: candidate.qty
      } as TopPlatformRow;
    });

    const topProvinces = Array.from(provincesMap.entries())
      .filter(([name]) => name !== "ไม่ระบุจังหวัด")
      .map(([name, val]) => ({ name, revenue: val.revenue, qty: val.qty }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      ok: true,
      topProducts,
      topProvinces,
      platforms
    });
  } catch (err) {
    console.error("❌ top-products error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", details: message }, { status: 500 });
  }
}
