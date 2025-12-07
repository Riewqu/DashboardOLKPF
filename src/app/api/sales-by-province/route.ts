import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { TOTAL_PROVINCES } from "@/lib/provinceMapper";

export const dynamic = "force-dynamic";

type ProvinceProduct = {
  sku: string;
  name: string;
  qty: number;
  revenue: number;
  image_url?: string | null;
};

type ProvinceSales = {
  name: string;
  totalQty: number;
  totalRevenue: number;
  productCount: number;
  products: ProvinceProduct[];
};

type SalesByProvinceResponse = {
  totalProvinces: number;
  maxProvinces: number;
  coverage: number;
  provinces: ProvinceSales[];
  topProvinces: ProvinceSales[];
};

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  try {
    // Use SQL aggregation with products for best performance (< 1s for millions of rows)
    const { data: aggregatedData, error } = await supabaseAdmin.rpc('get_sales_by_province_with_products');

    if (error) {
      console.error("❌ Error calling get_sales_by_province_with_products RPC:", error);
      console.log("⚠️ Falling back to row-by-row aggregation...");
      return await fallbackAggregation();
    }

    if (!aggregatedData || aggregatedData.length === 0) {
      return NextResponse.json({
        totalProvinces: 0,
        maxProvinces: TOTAL_PROVINCES,
        coverage: 0,
        provinces: [],
        topProvinces: []
      });
    }

    // Transform RPC result to expected format
    const provincesRaw: ProvinceSales[] = aggregatedData.map((row: any) => ({
      name: row.province || "ไม่ระบุจังหวัด",
      totalQty: row.total_qty || 0,
      totalRevenue: row.total_revenue || 0,
      productCount: row.product_count || 0,
      products: row.products || [] // JSONB array from SQL
    })).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    // Debug: ดู structure ของ products array จาก RPC
    console.log(`📊 Sample RPC row:`, JSON.stringify(aggregatedData[0], null, 2));
    if (provincesRaw.length > 0 && provincesRaw[0].products.length > 0) {
      console.log(`🔬 Sample product from RPC:`, JSON.stringify(provincesRaw[0].products[0], null, 2));
    }

    // Fetch product images from product_master (ดึงทั้งหมดแล้วกรองใน memory เพื่อหลีกเลี่ยง Bad Request)
    const allProductNames = provincesRaw.flatMap(p =>
      p.products.map((prod: ProvinceProduct) => prod.name)
    ).filter(Boolean);
    const uniqueProductNames = [...new Set(allProductNames)];
    const imageMap = new Map<string, string | null>();

    console.log(`🔍 Unique product names to fetch images for: ${uniqueProductNames.length}`);
    console.log(`📦 Product names:`, uniqueProductNames.slice(0, 10)); // แสดง 10 ตัวแรก

    if (uniqueProductNames.length > 0) {
      // ดึงทั้งหมดที่มี image_url แล้วกรองใน memory (หลีกเลี่ยง .in() ที่มีปัญหากับ array ใหญ่)
      const { data: allProducts, error: pmError } = await supabaseAdmin
        .from("product_master")
        .select("name, image_url")
        .not("image_url", "is", null)
        .limit(10000);

      if (pmError) {
        console.error("❌ Error fetching product_master:", pmError);
      } else if (allProducts) {
        const productSet = new Set(uniqueProductNames);
        for (const p of allProducts) {
          if (productSet.has(p.name)) {
            imageMap.set(p.name, p.image_url);
          }
        }
        console.log(`✅ Matched ${imageMap.size} out of ${uniqueProductNames.length} products with images`);
        console.log(`📸 Sample products with images:`, Array.from(imageMap.entries()).slice(0, 5));
      }
    }

    // Add image_url to products
    const provinces: ProvinceSales[] = provincesRaw.map(province => ({
      ...province,
      products: province.products.map((product: ProvinceProduct) => ({
        ...product,
        image_url: imageMap.get(product.name) ?? null
      }))
    }));

    const totalProvinces = provinces.filter(p => p.name !== "ไม่ระบุจังหวัด").length;
    const coverage = (totalProvinces / TOTAL_PROVINCES) * 100;
    const topProvinces = provinces.filter(p => p.name !== "ไม่ระบุจังหวัด").slice(0, 5);

    console.log(`📊 Total provinces: ${provinces.length}`);
    console.log(`💰 Total revenue: ${provinces.reduce((sum, p) => sum + p.totalRevenue, 0).toFixed(2)}`);

    return NextResponse.json({
      totalProvinces,
      maxProvinces: TOTAL_PROVINCES,
      coverage: parseFloat(coverage.toFixed(2)),
      provinces,
      topProvinces
    });
  } catch (err) {
    console.error("❌ Unexpected error in sales-by-province:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
  }
}

// Fallback function for row-by-row aggregation (used if RPC doesn't exist)
async function fallbackAggregation() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  try {
    // Fetch all product sales in batches
    const BATCH_SIZE = 1000;
    let allData: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from("product_sales")
        .select("province_normalized, province_raw, product_name, variant_code, qty_confirmed, revenue_confirmed_thb")
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error("❌ Error fetching sales by province:", error);
        return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allData = [...allData, ...data];

      if (data.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }
    }

    const data = allData;

    if (!data || data.length === 0) {
      return NextResponse.json({
        totalProvinces: 0,
        maxProvinces: TOTAL_PROVINCES,
        coverage: 0,
        provinces: [],
        topProvinces: []
      });
    }

    // Debug logging
    console.log(`📊 Total rows fetched: ${data.length}`);
    const totalRevenueFromDB = data.reduce((sum, row) => sum + (row.revenue_confirmed_thb || 0), 0);
    console.log(`💰 Total revenue from DB: ${totalRevenueFromDB.toFixed(2)}`);
    const rowsWithProvince = data.filter(row => row.province_normalized).length;
    const rowsWithoutProvince = data.filter(row => !row.province_normalized).length;
    console.log(`🗺️ Rows with province: ${rowsWithProvince}, without: ${rowsWithoutProvince}`);

    // Group by province
    const provinceMap = new Map<string, {
      totalQty: number;
      totalRevenue: number;
      products: Map<string, ProvinceProduct>;
    }>();

    for (const row of data) {
      // Use "ไม่ระบุจังหวัด" for unmapped provinces
      const province = row.province_normalized || "ไม่ระบุจังหวัด";

      if (!provinceMap.has(province)) {
        provinceMap.set(province, {
          totalQty: 0,
          totalRevenue: 0,
          products: new Map()
        });
      }

      const provinceData = provinceMap.get(province)!;
      provinceData.totalQty += row.qty_confirmed || 0;
      provinceData.totalRevenue += row.revenue_confirmed_thb || 0;

      // Aggregate by product_name (รวม platform - TikTok + Shopee ที่ map เป็นสินค้าเดียวกัน)
      const productKey = row.product_name || "UNKNOWN";
      if (!provinceData.products.has(productKey)) {
        provinceData.products.set(productKey, {
          sku: row.variant_code || "-", // เก็บ variant_code ตัวแรกสำหรับแสดง
          name: row.product_name || "-",
          qty: 0,
          revenue: 0
        });
      }

      const product = provinceData.products.get(productKey)!;
      product.qty += row.qty_confirmed || 0;
      product.revenue += row.revenue_confirmed_thb || 0;
    }

    // Fetch product images from product_master
    const productNames = [...new Set(data.map(row => row.product_name).filter(Boolean))];
    const imageMap = new Map<string, string | null>();

    if (productNames.length > 0) {
      const { data: productMaster, error: pmError } = await supabaseAdmin
        .from("product_master")
        .select("name, image_url")
        .in("name", productNames);

      if (!pmError && productMaster) {
        for (const pm of productMaster) {
          if (pm.name) {
            imageMap.set(pm.name, pm.image_url);
          }
        }
      }
    }

    // Convert to array and sort
    const provinces: ProvinceSales[] = Array.from(provinceMap.entries())
      .map(([name, data]) => ({
        name,
        totalQty: data.totalQty,
        totalRevenue: data.totalRevenue,
        productCount: data.products.size,
        products: Array.from(data.products.values())
          .map(product => ({
            ...product,
            image_url: imageMap.get(product.name) ?? null
          }))
          .sort((a, b) => b.revenue - a.revenue) // Sort products by revenue (ส่งทั้งหมดสำหรับ modal)
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort provinces by revenue

    // Count only real provinces (exclude "ไม่ระบุจังหวัด")
    const totalProvinces = provinces.filter(p => p.name !== "ไม่ระบุจังหวัด").length;
    const coverage = (totalProvinces / TOTAL_PROVINCES) * 100;
    // Top provinces should only include real provinces for ranking
    const topProvinces = provinces.filter(p => p.name !== "ไม่ระบุจังหวัด").slice(0, 5);

    const response: SalesByProvinceResponse = {
      totalProvinces,
      maxProvinces: TOTAL_PROVINCES,
      coverage: parseFloat(coverage.toFixed(2)),
      provinces,
      topProvinces
    };

    // Debug logging - total revenue in response
    const totalRevenueInResponse = provinces.reduce((sum, p) => sum + p.totalRevenue, 0);
    console.log(`💵 Total revenue in response: ${totalRevenueInResponse.toFixed(2)}`);
    console.log(`📍 Provinces in response: ${provinces.map(p => p.name).join(', ')}`);

    return NextResponse.json(response);
  } catch (err) {
    console.error("❌ Unexpected error in sales-by-province:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 });
  }
}
