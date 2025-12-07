import DashboardClient from "../dashboardClient";
import EmptyState from "../emptyState";
import { fetchPlatformData, fetchGoalsByYear } from "../dataClient";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  // ✅ บังคับใช้ Supabase เท่านั้น - ไม่มี fallback
  if (!supabaseAdmin) {
    return (
      <main style={{ padding: "2rem", textAlign: "center", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️ Supabase ยังไม่ได้ตั้งค่า</h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
            กรุณาตั้งค่า environment variables ใน <code>.env.local</code>:
          </p>
          <pre style={{ background: "var(--surface-secondary)", padding: "1.5rem", borderRadius: "var(--radius-lg)", textAlign: "left", maxWidth: "600px", margin: "0 auto" }}>
            {`NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key`}
          </pre>
          <p style={{ marginTop: "2rem", fontSize: "1rem", color: "var(--text-tertiary)" }}>
            ดูคู่มือเพิ่มเติมที่: <code>SUPABASE_SETUP.md</code>
          </p>
        </div>
      </main>
    );
  }

  const platforms = await fetchPlatformData();
  const currentYear = new Date().getFullYear();
  const goals = await fetchGoalsByYear(currentYear);

  // ✅ ถ้าไม่มีข้อมูลเลย แสดง empty state
  if (platforms.length === 0) {
    return <EmptyState />;
  }

  // ✅ แสดง Dashboard ตามปกติ
  return <DashboardClient platforms={platforms} goals={goals} />;
}
