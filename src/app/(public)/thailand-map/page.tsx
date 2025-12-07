import { Metadata } from "next";
import { ThailandMapClient } from "./thailandMapClient";

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

async function fetchSalesByProvince(): Promise<SalesByProvinceData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/sales-by-province`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch sales by province:", res.statusText);
      return {
        totalProvinces: 0,
        maxProvinces: 77,
        coverage: 0,
        provinces: [],
        topProvinces: []
      };
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching sales by province:", error);
    return {
      totalProvinces: 0,
      maxProvinces: 77,
      coverage: 0,
      provinces: [],
      topProvinces: []
    };
  }
}

export default async function ThailandMapPage() {
  const salesData = await fetchSalesByProvince();

  return (
    <ThailandMapClient salesData={salesData} />
  );
}
