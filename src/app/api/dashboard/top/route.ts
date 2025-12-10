import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { cached, getCacheKey, getCacheHeaders } from "@/lib/cache";
import { requireAuth } from "@/lib/auth/apiHelpers";

export const dynamic = "force-dynamic";

type TopProduct = {
  name: string;
  variant: string;
  variantCode: string | null;
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

export async function GET(req: Request) {
  // 🔒 Authentication required (viewer + admin can view dashboard)
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const platformParam = searchParams.get("platform")?.trim() || null;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const client = supabaseAdmin!;

  try {
    // Generate cache key based on query parameters
    const cacheKey = getCacheKey('dashboard-top', {
      platform: platformParam,
      start,
      end
    });

    // Try to get from cache (60 second TTL)
    const cachedData = await cached(
      cacheKey,
      async () => {
        // Prefer DB aggregation: use dedicated RPCs (fast + accurate)
        const [productsResult, provincesResult, platformsResult] = await Promise.all([
          (client as any).rpc("dashboard_top_products", {
            p_platform: platformParam && platformParam !== "all" ? platformParam : null,
            p_start: start || null,
            p_end: end || null
          }),
          (client as any).rpc("dashboard_top_provinces", {
            p_platform: platformParam && platformParam !== "all" ? platformParam : null,
            p_start: start || null,
            p_end: end || null
          }),
          (client as any).rpc("dashboard_top_platforms", {
            p_start: start || null,
            p_end: end || null
          })
        ]);

        return {
          topProductsRpc: productsResult.data,
          topProductsErr: productsResult.error,
          topProvincesRpc: provincesResult.data,
          topProvErr: provincesResult.error,
          topPlatformsRpc: platformsResult.data,
          topPlatErr: platformsResult.error
        };
      },
      60 * 1000 // 60 seconds cache
    );

    const { topProductsRpc, topProductsErr, topProvincesRpc, topProvErr, topPlatformsRpc, topPlatErr } = cachedData;

    const normalizePlatform = (pf: string | null | undefined) => {
      const val = (pf || "").trim().toLowerCase();
      if (!val) return null;
      if (val === "shopee") return "Shopee";
      if (val === "tiktok" || val === "tik tok") return "TikTok";
      if (val === "lazada") return "Lazada";
      return null;
    };

    const buildFromRpc = () => {
      const products: TopProduct[] = (topProductsRpc || []).map((row: any) => ({
        name: row.name || row.variant_code || "ไม่ระบุสินค้า",
        variant: row.variant || row.name || row.variant_code || "ไม่ระบุสินค้า",
        variantCode: row.variant_code || null,
        revenue: Number(row.revenue ?? 0),
        qty: Number(row.qty ?? 0),
        returned: Number(row.returned ?? 0),
        platforms: (row.platforms || []).map((p: string) => normalizePlatform(p)).filter(Boolean) as string[],
        latest_at: row.latest_at || null,
        image_url: null
      }));

      const provinces = (topProvincesRpc || []).slice(0, 5).map((p: any) => ({
        name: p.name || "ไม่ระบุจังหวัด",
        revenue: Number(p.revenue ?? 0),
        qty: Number(p.qty ?? 0)
      }));

      const platforms: (TopPlatformRow | null)[] = ["Shopee", "TikTok", "Lazada"].map((pf) => {
        const row = (topPlatformsRpc || []).find((r: any) => normalizePlatform(r.platform) === pf);
        if (!row) return null;
        return {
          platform: pf,
          variant: row.variant || "ยังไม่มีข้อมูล",
          revenue: Number(row.revenue ?? 0),
          qty: Number(row.qty ?? 0)
        };
      });

      return { products, provinces, platforms };
    };

    const useFallback = Boolean(topProductsErr || topProvErr || topPlatErr || (!topProductsRpc?.length && (start || end)));
    if (useFallback) {
      console.warn("⚠️ Using fallback aggregation for top dashboard widgets", {
        topProductsErr,
        topProvErr,
        topPlatErr,
        start,
        end,
        platform: platformParam
      });
    }
    const rpcResult = buildFromRpc();

    const finalData = useFallback
      ? await fallbackTop(client, normalizePlatform, { platformParam, start, end })
      : rpcResult;

    // Merge same product across platforms when viewing "all" (aggregate qty/revenue)
    const shouldMergePlatforms = !platformParam || platformParam === "all";
    const mergedProducts = shouldMergePlatforms
      ? mergeTopProducts(finalData.products, 5)
      : (finalData.products || []).slice(0, 5);

    // Fetch images for top products from product_master
    const productNames = mergedProducts.map(p => p.name);
    if (productNames.length > 0) {
      const { data: images } = await client
        .from("product_master")
        .select("name, image_url")
        .in("name", productNames);

      if (images) {
        const imageMap = new Map(images.map(img => [img.name, img.image_url || null]));
        mergedProducts.forEach(p => {
          p.image_url = imageMap.get(p.name) || null;
        });
      }
    }

    return NextResponse.json({
      ok: true,
      topProducts: mergedProducts,
      topProvinces: finalData.provinces,
      platforms: finalData.platforms
    }, {
      headers: getCacheHeaders({ maxAge: 60, staleWhileRevalidate: 300 })
    });
  } catch (err) {
    console.error("❌ top-products error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", details: message }, { status: 500 });
  }
}

type Normalizer = (pf: string | null | undefined) => "Shopee" | "TikTok" | "Lazada" | null;

async function fallbackTop(
  client: NonNullable<typeof supabaseAdmin>,
  normalizePlatform: Normalizer,
  {
    platformParam,
    start,
    end
  }: { platformParam: string | null; start: string | null; end: string | null }
) {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const rows: {
    platform: string | null;
    product_name: string | null;
    variant_name: string | null;
    variant_code: string | null;
    qty_confirmed: number | null;
    qty_returned: number | null;
    revenue_confirmed_thb: number | null;
    order_date: string | null;
    province_normalized?: string | null;
  }[] = [];

  while (true) {
    let query = client
      .from("product_sales")
      .select("platform, product_name, variant_name, variant_code, qty_confirmed, qty_returned, revenue_confirmed_thb, order_date, province_normalized");

    if (platformParam && platformParam !== "all") query = query.eq("platform", platformParam);
    if (start) query = query.gte("order_date", start);
    if (end) query = query.lte("order_date", end);

    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error("❌ fallbackTop query error:", error);
      break;
    }
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  if (rows.length === 0) {
    return {
      products: [] as TopProduct[],
      provinces: [] as { name: string; revenue: number; qty: number }[],
      platforms: [null, null, null] as (TopPlatformRow | null)[]
    };
  }

  // Aggregate products
  const productMap = new Map<string, TopProduct>();
  for (const row of rows) {
    const key = `${row.product_name || "UNKNOWN"}|${row.variant_code || row.variant_name || ""}`;
    const existing = productMap.get(key) || {
      name: row.product_name || row.variant_code || "ไม่ระบุสินค้า",
      variant: row.variant_name || row.product_name || row.variant_code || "ไม่ระบุสินค้า",
      variantCode: row.variant_code || null,
      revenue: 0,
      qty: 0,
      returned: 0,
      platforms: [] as string[],
      latest_at: row.order_date,
      image_url: null as string | null
    };

    existing.revenue += Number(row.revenue_confirmed_thb || 0);
    existing.qty += Number(row.qty_confirmed || 0);
    existing.returned += Number(row.qty_returned || 0);
    if (row.order_date && (!existing.latest_at || row.order_date > existing.latest_at)) {
      existing.latest_at = row.order_date;
    }
    const normalized = normalizePlatform(row.platform);
    if (normalized && !existing.platforms.includes(normalized)) {
      existing.platforms.push(normalized);
    }

    productMap.set(key, existing);
  }

  const products = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Aggregate provinces
  const provinceMap = new Map<string, { revenue: number; qty: number }>();
  for (const row of rows) {
    const province = row.province_normalized || "ไม่ระบุจังหวัด";
    const entry = provinceMap.get(province) || { revenue: 0, qty: 0 };
    entry.revenue += Number(row.revenue_confirmed_thb || 0);
    entry.qty += Number(row.qty_confirmed || 0);
    provinceMap.set(province, entry);
  }

  const provinces = Array.from(provinceMap.entries())
    .map(([name, data]) => ({
      name,
      revenue: data.revenue,
      qty: data.qty
    }))
    .filter((p) => p.name !== "ไม่ระบุจังหวัด")
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Aggregate per platform
  const platformMap = new Map<string, { variant: string; revenue: number; qty: number }>();
  for (const row of rows) {
    const pf = normalizePlatform(row.platform);
    if (!pf) continue;
    const key = `${pf}|${row.variant_code || row.variant_name || row.product_name || "-"}`;
    const entry = platformMap.get(key) || {
      variant: row.variant_name || row.product_name || row.variant_code || "ยังไม่มีข้อมูล",
      revenue: 0,
      qty: 0
    };
    entry.revenue += Number(row.revenue_confirmed_thb || 0);
    entry.qty += Number(row.qty_confirmed || 0);
    platformMap.set(key, entry);
  }

  const platforms: (TopPlatformRow | null)[] = ["Shopee", "TikTok", "Lazada"].map((pf) => {
    const candidates = Array.from(platformMap.entries())
      .filter(([key]) => key.startsWith(`${pf}|`))
      .map(([, val]) => val)
      .sort((a, b) => b.revenue - a.revenue);
    if (candidates.length === 0) return null;
    const best = candidates[0];
    return {
      platform: pf as TopPlatformRow["platform"],
      variant: best.variant || "ยังไม่มีข้อมูล",
      revenue: Number(best.revenue || 0),
      qty: Number(best.qty || 0)
    };
  });

  return { products, provinces, platforms };
}

function mergeTopProducts(products: TopProduct[], limit: number): TopProduct[] {
  const map = new Map<string, TopProduct>();

  for (const p of products) {
    const key = (p.name || p.variant || p.variantCode || "").toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...p, platforms: [...new Set(p.platforms)] });
      continue;
    }

    existing.revenue += p.revenue;
    existing.qty += p.qty;
    existing.returned += p.returned;
    existing.platforms = Array.from(new Set([...(existing.platforms || []), ...(p.platforms || [])]));

    // Keep the latest date
    if (p.latest_at && (!existing.latest_at || p.latest_at > existing.latest_at)) {
      existing.latest_at = p.latest_at;
    }

    // Prefer image if missing
    if (!existing.image_url && p.image_url) {
      existing.image_url = p.image_url;
    }

    // Keep a representative variantCode/name
    if (!existing.variantCode && p.variantCode) {
      existing.variantCode = p.variantCode;
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
