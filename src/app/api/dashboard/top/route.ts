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

    if (topProductsErr) {
      console.error("❌ dashboard_top_products RPC error:", topProductsErr);
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลสินค้าขายดีได้" }, { status: 500 });
    }
    if (topProvErr) {
      console.error("❌ dashboard_top_provinces RPC error:", topProvErr);
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลจังหวัดได้" }, { status: 500 });
    }
    if (topPlatErr) {
      console.error("❌ dashboard_top_platforms RPC error:", topPlatErr);
      // continue without per-platform cards
    }

    const normalizePlatform = (pf: string | null | undefined) => {
      const val = (pf || "").trim().toLowerCase();
      if (!val) return null;
      if (val === "shopee") return "Shopee";
      if (val === "tiktok" || val === "tik tok") return "TikTok";
      if (val === "lazada") return "Lazada";
      return null;
    };

    const topProducts: TopProduct[] = (topProductsRpc || []).slice(0, 5).map((row: any) => ({
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

    // Fetch images for top products from product_master
    const productNames = topProducts.map(p => p.name);
    if (productNames.length > 0) {
      const { data: images } = await client
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

    const topProvinces = (topProvincesRpc || []).slice(0, 5).map((p: any) => ({
      name: p.name || "ไม่ระบุจังหวัด",
      revenue: Number(p.revenue ?? 0),
      qty: Number(p.qty ?? 0)
    }));

    const topPlatforms: (TopPlatformRow | null)[] = ["Shopee", "TikTok", "Lazada"].map((pf) => {
      const row = (topPlatformsRpc || []).find((r: any) => normalizePlatform(r.platform) === pf);
      if (!row) return null;
      return {
        platform: pf,
        variant: row.variant || "ยังไม่มีข้อมูล",
        revenue: Number(row.revenue ?? 0),
        qty: Number(row.qty ?? 0)
      };
    });

    return NextResponse.json({
      ok: true,
      topProducts,
      topProvinces,
      platforms: topPlatforms
    }, {
      headers: getCacheHeaders({ maxAge: 60, staleWhileRevalidate: 300 })
    });
  } catch (err) {
    console.error("❌ top-products error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", details: message }, { status: 500 });
  }
}
