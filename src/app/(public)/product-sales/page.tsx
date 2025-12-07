import ProductSalesClient from "./productSalesClient";
import { fetchProductSales } from "../../dataClient";
import EmptyState from "../../emptyState";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function ProductSalesPage() {
  if (!supabaseAdmin) {
    return <EmptyState />;
  }

  const sales = await fetchProductSales({ latestUploadsOnly: false });

  if (!sales || sales.length === 0) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div style={{ textAlign: "center", maxWidth: "540px" }}>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>ยังไม่มีข้อมูลยอดขายสินค้า</h1>
          <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }}>อัปโหลดไฟล์ Shopee ได้ที่หน้า /admin แล้วกลับมาดูสรุปที่หน้านี้</p>
        </div>
      </main>
    );
  }

  return <ProductSalesClient sales={sales} />;
}
