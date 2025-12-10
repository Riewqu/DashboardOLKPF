import { Metadata } from "next";
import { ThailandMapClient } from "./thailandMapClient";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { TOTAL_PROVINCES } from "@/lib/provinceMapper";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thailand Sales Map | Dashboard",
  description: "แผนที่แสดงยอดขายแบ่งตามจังหวัดทั่วประเทศไทย",
};

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

type SalesByProvinceData = {
  totalProvinces: number;
  maxProvinces: number;
  coverage: number;
  provinces: ProvinceSales[];
  topProvinces: ProvinceSales[];
};

async function fetchSalesByProvince(startDate: string | null, endDate: string | null): Promise<SalesByProvinceData> {
  if (!supabaseAdmin) {
    console.error("Supabase admin client is not configured");
    return { totalProvinces: 0, maxProvinces: TOTAL_PROVINCES, coverage: 0, provinces: [], topProvinces: [] };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("get_sales_by_province_with_products", {
      p_start_date: startDate ?? undefined,
      p_end_date: endDate ?? undefined
    });
    if (error) {
      console.error("RPC get_sales_by_province_with_products failed:", error);
      return { totalProvinces: 0, maxProvinces: TOTAL_PROVINCES, coverage: 0, provinces: [], topProvinces: [] };
    }

    const provinces = (data || [])
      .map((row: any) => ({
        name: row.province || "ไม่ระบุจังหวัด",
        totalQty: row.total_qty || 0,
        totalRevenue: row.total_revenue || 0,
        productCount: row.product_count || 0,
        products: row.products || []
      }))
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    // Enrich product images (pull once, then map)
    const productNames = [
      ...new Set(
        provinces.flatMap((p) => p.products?.map((prod: any) => prod?.name).filter(Boolean) || [])
      )
    ];
    const imageMap = new Map<string, string | null>();

    if (productNames.length > 0) {
      const { data: allProducts, error: imgError } = await supabaseAdmin
        .from("product_master")
        .select("name, image_url")
        .not("image_url", "is", null)
        .limit(10000);

      if (imgError) {
        console.error("Error fetching product images:", imgError);
      } else if (allProducts) {
        const namesSet = new Set(productNames);
        for (const p of allProducts) {
          if (p.name && namesSet.has(p.name)) {
            imageMap.set(p.name, p.image_url);
          }
        }
      }
    }

    const provincesWithImages = provinces.map((province) => ({
      ...province,
      products: province.products.map((product: any) => ({
        ...product,
        image_url: imageMap.get(product.name) ?? null
      }))
    }));

    const totalProvinces = provincesWithImages.filter((p) => p.name !== "ไม่ระบุจังหวัด").length;
    const topProvinces = provincesWithImages.filter((p) => p.name !== "ไม่ระบุจังหวัด").slice(0, 5);
    const coverage = totalProvinces > 0 ? (totalProvinces / TOTAL_PROVINCES) * 100 : 0;

    return {
      totalProvinces,
      maxProvinces: TOTAL_PROVINCES,
      coverage: parseFloat(coverage.toFixed(2)),
      provinces: provincesWithImages,
      topProvinces
    };
  } catch (error) {
    console.error("Error fetching sales by province:", error);
    return { totalProvinces: 0, maxProvinces: TOTAL_PROVINCES, coverage: 0, provinces: [], topProvinces: [] };
  }
}

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ThailandMapPage({ searchParams }: PageProps) {
  // Extract date parameters from URL
  const startDate = typeof searchParams.start_date === "string" ? searchParams.start_date : null;
  const endDate = typeof searchParams.end_date === "string" ? searchParams.end_date : null;

  const salesData = await fetchSalesByProvince(startDate, endDate);

  return (
    <ThailandMapClient salesData={salesData} initialStartDate={startDate} initialEndDate={endDate} />
  );
}
