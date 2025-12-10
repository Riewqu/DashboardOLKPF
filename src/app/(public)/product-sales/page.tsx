import ProductSalesClient from "./productSalesClient";
import { fetchProductSales } from "../../dataClient";
import EmptyState from "../../emptyState";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ProductSalesPage({ searchParams }: PageProps) {
  if (!supabaseAdmin) {
    return <EmptyState />;
  }

  // Extract date parameters from URL
  const startDate = typeof searchParams.start_date === "string" ? searchParams.start_date : null;
  const endDate = typeof searchParams.end_date === "string" ? searchParams.end_date : null;

  const sales = await fetchProductSales({
    latestUploadsOnly: false,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

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

  return <ProductSalesClient sales={sales} initialStartDate={startDate} initialEndDate={endDate} />;
}
