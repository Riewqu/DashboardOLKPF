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

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const platformParam = searchParams.get("platform")?.trim() || null;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const client = supabaseAdmin!;

  const applyFilters = <T>(query: T) => {
    let q = query as any;
    if (platformParam && platformParam !== "all") {
      const variants = [
        platformParam,
        platformParam.toLowerCase(),
        platformParam.toUpperCase()
      ];
      q = q.in("platform", variants);
    }
    if (start) {
      q = q.gte("created_at", start);
    }
    if (end) {
      q = q.lte("created_at", end);
    }
    return q as typeof query;
  };

  try {
    // Top 5 products (server-side aggregate to avoid timeouts)
    const productQuery = applyFilters(
      client
        .from("product_sales")
        .select<any>(`
          name:product_name,
          variant:variant_name,
          revenue:sum.revenue_confirmed_thb,
          qty:sum.qty_confirmed,
          returned:sum.qty_returned,
          latest_at:max.created_at
        `)
        .order("revenue", { ascending: false })
        .limit(5)
    );

    const { data: productAgg, error: productError } = await productQuery;
    if (productError) {
      console.error("❌ top-products aggregate error:", productError);
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลยอดขายสินค้าได้" }, { status: 500 });
    }

    const topProducts: TopProduct[] = (productAgg ?? []).map((row: any) => ({
      name: row.name || row.variant || "ไม่ระบุสินค้า",
      variant: row.variant || row.name || "ไม่ระบุสินค้า",
      revenue: Number(row.revenue ?? 0),
      qty: Number(row.qty ?? 0),
      returned: Number(row.returned ?? 0),
      platforms: [],
      latest_at: row.latest_at ?? null,
      image_url: null
    }));

    // collect platforms per top product
    if (topProducts.length > 0) {
      const platformRowsQuery = applyFilters(
        client
          .from("product_sales")
          .select<any>("product_name,variant_name,platform")
          .in("product_name", topProducts.map((p) => p.name))
      );
      const { data: platformRows, error: platformRowsError } = await platformRowsQuery;
      if (platformRowsError) {
        console.error("❌ top-products platform aggregation error:", platformRowsError);
      } else if (platformRows) {
        const platformMap = new Map<string, Set<string>>();
        platformRows.forEach((row: any) => {
          const name = row.product_name || row.variant_name || "ไม่ระบุสินค้า";
          const variant = row.variant_name || name;
          const key = `${name}|${variant}`;
          const platform = row.platform || "unknown";
          if (!platformMap.has(key)) platformMap.set(key, new Set());
          platformMap.get(key)!.add(platform);
        });
        topProducts.forEach((p) => {
          const key = `${p.name}|${p.variant}`;
          p.platforms = Array.from(platformMap.get(key) ?? []);
        });
      }
    }

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

    // Top variant per platform
    const platforms: (TopPlatformRow | null)[] = await Promise.all(
      ["Shopee", "TikTok", "Lazada"].map(async (pf) => {
        const q = applyFilters(
          client
            .from("product_sales")
            .select<any>(`
              variant:variant_name,
              revenue:sum.revenue_confirmed_thb,
              qty:sum.qty_confirmed
            `)
            .in("platform", [pf, pf.toLowerCase(), pf.toUpperCase()])
            .order("revenue", { ascending: false })
            .limit(1)
        );
        const { data, error } = await q;
        if (error) {
          console.error(`❌ top-platform ${pf} aggregate error:`, error);
          return null;
        }
        if (!data || data.length === 0) return null;
        const row = data[0] as any;
        return {
          platform: pf,
          variant: row.variant || "ยังไม่มีข้อมูล",
          revenue: Number(row.revenue ?? 0),
          qty: Number(row.qty ?? 0)
        } as TopPlatformRow;
      })
    );

    // Top provinces
    const provinceQuery = applyFilters(
      client
        .from("product_sales")
        .select<any>(`
          name:province_normalized,
          revenue:sum.revenue_confirmed_thb,
          qty:sum.qty_confirmed
        `)
        .neq("province_normalized", "ไม่ระบุจังหวัด")
        .order("revenue", { ascending: false })
        .limit(5)
    );

    const { data: provinceAgg, error: provinceError } = await provinceQuery;
    if (provinceError) {
      console.error("❌ top-province aggregate error:", provinceError);
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลจังหวัดได้" }, { status: 500 });
    }

    const topProvinces = (provinceAgg ?? []).map((p: any) => ({
      name: p.name || "ไม่ระบุจังหวัด",
      revenue: Number(p.revenue ?? 0),
      qty: Number(p.qty ?? 0)
    }));

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
