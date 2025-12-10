import { supabaseAdmin } from "@/lib/supabaseClient";
import { PlatformKPI } from "@/lib/mockData";

export type GoalRecord = {
  id?: string;
  platform: "all" | "TikTok" | "Shopee" | "Lazada";
  year: number;
  month: number;
  type: "revenue" | "profit";
  target: number;
  updated_at?: string;
};

export type ProductSaleView = {
  id?: string;
  product: string;
  variant: string;
  variant_code?: string;
  order_id?: string | null;
  qty: number;
  qty_returned?: number;
  revenue: number;
  platform?: string; // Legacy: single platform (kept for backward compat)
  platforms?: string[]; // New: array of platforms this product is sold on
  upload_id?: string;
  created_at?: string | null;
  order_date?: string | null;
  image_url?: string | null; // Product image from product_master
};

export async function fetchPlatformData(): Promise<PlatformKPI[]> {
  // ✅ บังคับใช้ Supabase เท่านั้น
  if (!supabaseAdmin) {
    console.error("❌ Supabase is not configured");
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("platform_metrics")
    .select("*")
    .order("platform", { ascending: true });

  if (error) {
    console.error("❌ fetchPlatformData error:", error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn("⚠️ No platform data found in Supabase");
    return [];
  }

  return data.map((row) => ({
    platform: row.platform,
    revenue: Number(row.revenue ?? 0),
    fees: Number(row.fees ?? 0),
    adjustments: Number(row.adjustments ?? 0),
    settlement: Number(row.settlement ?? 0),
    trend: row.trend ?? [],
    trendDates: row.trend_dates ?? [],
    perDay: row.per_day ?? [],
    // fall back to perDay when per_day_paid is missing
    perDayPaid: row.per_day_paid ?? row.per_day ?? [],
    breakdown: row.breakdown ?? {},
    feeGroups: row.fee_groups ?? [],
    revenueGroups: row.revenue_groups ?? []
  })) as PlatformKPI[];
}

export async function fetchRecentUploads() {
  // ✅ บังคับใช้ Supabase เท่านั้น
  if (!supabaseAdmin) {
    console.error("❌ Supabase is not configured");
    return [];
  }

  // ดึงจาก upload_batches เท่านั้น (ไม่มี fallback)
  const { data, error } = await supabaseAdmin
    .from("upload_batches")
    .select("id, file_name, file_path, platform, total_rows, new_rows, updated_rows, settlement, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("❌ fetchRecentUploads error:", error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn("⚠️ No upload history found in Supabase");
    return [];
  }

  return data.map((d) => ({
    file: d.file_name || d.file_path || "",
    platform: d.platform ?? "",
    rows: d.total_rows ?? 0,
    settlement: Number(d.settlement ?? 0),
    status: d.status === "completed" ? "สำเร็จ" : d.status === "failed" ? "ล้มเหลว" : "กำลังประมวลผล",
    created_at: d.created_at
  }));
}

export async function fetchGoals(year: number, month: number): Promise<GoalRecord[]> {
  if (!supabaseAdmin) {
    console.error("❌ Supabase is not configured");
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("goals")
    .select("*")
    .eq("year", year)
    .eq("month", month);

  if (error) {
    console.error("❌ fetchGoals error:", error);
    return [];
  }

  return (data ?? []) as GoalRecord[];
}

export async function fetchGoalsByYear(year: number): Promise<GoalRecord[]> {
  if (!supabaseAdmin) {
    console.error("❌ Supabase is not configured");
    return [];
  }

  const { data, error } = await supabaseAdmin.from("goals").select("*").eq("year", year);

  if (error) {
    console.error("❌ fetchGoalsByYear error:", error);
    return [];
  }

  return (data ?? []) as GoalRecord[];
}

type FetchProductSalesOptions = {
  limit?: number;
  platform?: "TikTok" | "Shopee" | "Lazada" | string;
  latestUploadsOnly?: boolean;
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD)
};

export async function fetchProductSales(options: FetchProductSalesOptions = {}): Promise<ProductSaleView[]> {
  if (!supabaseAdmin) {
    console.error("❌ Supabase is not configured");
    return [];
  }

  const { limit, platform, latestUploadsOnly = false, startDate, endDate } = options;
  const effectiveLimit = typeof limit === "number" && limit > 0 ? limit : undefined;
  const PAGE_SIZE = 1000; // Supabase returns max 1000 rows per request

  // Pull the latest upload id per platform so the UI can optionally scope to the newest batch
  let uploadIds: string[] = [];
  if (latestUploadsOnly) {
    const { data: uploads, error: uploadsError } = await supabaseAdmin
      .from("product_sales_uploads")
      .select("id, platform, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (uploadsError) {
      console.warn("⚠️ fetchProductSales: unable to load latest upload ids", uploadsError);
    } else if (uploads && uploads.length > 0) {
      const latestPerPlatform = new Map<string, string>();
      for (const row of uploads) {
        const platformKey = row.platform ?? "unknown";
        if (platform && row.platform !== platform) continue;
        if (!latestPerPlatform.has(platformKey)) {
          latestPerPlatform.set(platformKey, row.id);
        }
      }
      uploadIds = Array.from(latestPerPlatform.values());
    }
  }

  type ProductSaleRowWithJoin = {
    id: string;
    platform: string | null;
    product_name: string | null;
    variant_name: string | null;
    variant_code: string | null;
    order_id?: string | null;
    order_date?: string | null;
    qty_confirmed: number;
    qty_returned?: number;
    revenue_confirmed_thb: number;
    upload_id: string | null;
    created_at: string | null;
    product_master?: {
      name: string;
      image_url: string | null;
    } | null;
  };

  let data: ProductSaleRowWithJoin[] = [];
  let error: any = null;

  // ✨ ใช้ LEFT JOIN กับ product_master เพื่อดึง image_url มาพร้อมกัน
  const baseQuery = () =>
    supabaseAdmin!
      .from("product_sales")
      .select(`
        id,
        platform,
        product_name,
        variant_name,
        variant_code,
        order_id,
        order_date,
        qty_confirmed,
        qty_returned,
        revenue_confirmed_thb,
        upload_id,
        created_at,
        product_master!product_sales_product_name_fkey(name, image_url)
      `)
      .order("created_at", { ascending: false });

  // Fallback query without JOIN (ถ้า foreign key ยังไม่มี)
  const queryFallback = () =>
    supabaseAdmin!
      .from("product_sales")
      .select("id, platform, product_name, variant_name, variant_code, order_id, order_date, qty_confirmed, qty_returned, revenue_confirmed_thb, upload_id, created_at")
      .order("created_at", { ascending: false });

  const buildQuery = (factory: typeof baseQuery, applyDateFilters = true) => {
    let query = factory();
    if (platform) query = query.eq("platform", platform);
    if (uploadIds.length > 0) query = query.in("upload_id", uploadIds);
    if (applyDateFilters) {
      if (startDate) query = query.gte("order_date", startDate);
      if (endDate) query = query.lte("order_date", endDate);
    }
    return query;
  };

  const fetchPaged = async (factory: typeof baseQuery, applyDateFilters = true) => {
    const rows: ProductSaleRowWithJoin[] = [];
    let offset = 0;
    while (true) {
      const pageSize = effectiveLimit ? Math.min(PAGE_SIZE, Math.max(0, effectiveLimit - offset)) : PAGE_SIZE;
      if (pageSize === 0) break;
      const res = await buildQuery(factory, applyDateFilters).range(offset, offset + pageSize - 1);
      if (res.error) return { data: rows, error: res.error };
      rows.push(...(res.data ?? []));
      if (!res.data || res.data.length < pageSize) break;
      offset += pageSize;
    }
    return { data: rows, error: null };
  };

  // ลอง query แบบมี JOIN ก่อน
  console.log("🔍 Fetching product sales with JOIN to product_master...");
  const res = await fetchPaged(baseQuery);
  data = res.data;
  error = res.error;

  // If a date filter was applied and we got nothing (Shopee exports sometimes miss parsed order_date), retry without DB date filter then filter in memory
  if ((startDate || endDate) && !error && data.length === 0) {
    console.warn("⚠️ fetchProductSales: no rows after DB date filter, retrying without date filter and filtering in app", {
      platform,
      startDate,
      endDate
    });
    const resNoDate = await fetchPaged(baseQuery, false);
    data = resNoDate.data;
    error = resNoDate.error;

    if (!error && (startDate || endDate)) {
      data = data.filter((row) => {
        if (!row.order_date) return false;
        const d = row.order_date;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }
  }

  // ถ้า JOIN ไม่ได้ (foreign key ไม่มี) ให้ fallback แบบเดิม
  if (error && (String(error.message || "").includes("foreign key") || String(error.message || "").includes("column"))) {
    console.warn("⚠️ JOIN failed, falling back to separate query method");
    const resFallback = await fetchPaged(queryFallback as any);
    const dataWithoutJoin = resFallback.data;
    error = resFallback.error;

    if (error) {
      console.error("❌ fetchProductSales error:", error);
      return [];
    }

    // Fallback: ดึง images แยก (แบบเดิม แต่ optimize ด้วย filter in memory)
    const productNames = [...new Set(dataWithoutJoin.map((row) => row.product_name).filter(Boolean))];
    const imageMap = new Map<string, string | null>();

    if (productNames.length > 0) {
      const { data: allProducts, error: pmError } = await supabaseAdmin
        .from("product_master")
        .select("name, image_url")
        .not("image_url", "is", null)
        .limit(50000);

      if (!pmError && allProducts) {
        const productSet = new Set(productNames);
        for (const p of allProducts) {
          if (productSet.has(p.name)) {
            imageMap.set(p.name, p.image_url);
          }
        }
        console.log(`✅ Fallback matched ${imageMap.size} out of ${productNames.length} products`);
      }
    }

    // Map data with fallback images
    data = dataWithoutJoin.map((row) => ({
      ...row,
      product_master: row.product_name ? { name: row.product_name, image_url: imageMap.get(row.product_name) ?? null } : null
    }));
  }

  if (error) {
    console.error("❌ fetchProductSales error:", error);
    return [];
  }

  // If we retried without DB date filter and still got data, ensure in-memory date filtering applied consistently
  if ((startDate || endDate) && data.length > 0) {
    data = data.filter((row) => {
      if (!row.order_date) return true; // keep rows without order_date to avoid dropping older data unexpectedly
      if (startDate && row.order_date < startDate) return false;
      if (endDate && row.order_date > endDate) return false;
      return true;
    });
  }

  // Log statistics
  const withImages = data.filter((row) => row.product_master?.image_url).length;
  const totalProducts = new Set(data.map((row) => row.product_name).filter(Boolean)).size;
  console.log(`✅ Fetched ${data.length} sales records`);
  console.log(`📊 ${withImages}/${data.length} records have product images`);
  console.log(`📦 ${totalProducts} unique products`);

  // Return mapped data
  const result = data.map((row) => ({
    id: row.id ?? undefined,
    product: row.product_name ?? "-",
    variant: row.variant_name ?? "-",
    variant_code: row.variant_code ?? undefined,
    order_id: row.order_id ?? undefined,
    qty: Number(row.qty_confirmed ?? 0),
    qty_returned: Number(row.qty_returned ?? 0),
    revenue: Number(row.revenue_confirmed_thb ?? 0),
    platform: row.platform ?? undefined,
    platforms: row.platform ? [row.platform] : [],
    upload_id: row.upload_id ?? undefined,
    created_at: row.created_at ?? null,
    order_date: (row as any).order_date ?? null,
    image_url: row.product_master?.image_url ?? null
  }));

  console.log("✅ Sample result with image_url:", result.slice(0, 3));
  return result;
}
