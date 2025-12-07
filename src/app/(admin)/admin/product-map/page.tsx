import ProductMapClient from "./productMapClient";
import { supabaseAdmin } from "@/lib/supabaseClient";
import EmptyState from "@/app/emptyState";

export const dynamic = "force-dynamic";

export type ProductMasterRow = {
  id: string;
  name: string;
  sku: string | null;
  shopee_code: string | null;
  tiktok_code: string | null;
  lazada_code: string | null;
  is_active: boolean | null;
  image_url: string | null;
  updated_at: string | null;
};

export default async function ProductMapPage() {
  if (!supabaseAdmin) {
    return <EmptyState />;
  }

  const { data, error } = await supabaseAdmin.from("product_master").select("*").order("updated_at", { ascending: false }).limit(500);
  const rows: ProductMasterRow[] = (data ?? []) as ProductMasterRow[];

  return <ProductMapClient initialRows={error ? [] : rows} />;
}
