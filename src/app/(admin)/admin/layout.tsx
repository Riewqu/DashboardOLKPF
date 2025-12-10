import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import AnimatedBackground from "@/components/AnimatedBackground";
import { getServerSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Check authentication and admin role
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/"); // Redirect viewers to home
  }

  return (
    <div
      className="relative"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f8ff 0%, #e6f0ff 35%, #f8fbff 100%)",
        color: "#0f172a",
        // Override theme vars to fit light glass UI
        ["--text-primary" as string]: "#0f172a",
        ["--text-secondary" as string]: "#334155",
        ["--text-tertiary" as string]: "#64748b",
        ["--accent-primary" as string]: "#2563eb",
        ["--border-primary" as string]: "#d9e3ff",
        ["--border-secondary" as string]: "#d9e3ff",
        ["--surface-secondary" as string]: "#f8fbff"
      }}
    >
      {/* Animated Background - Only on mobile */}
      <div className="md:hidden">
        <AnimatedBackground />
      </div>

      <div
        className="relative z-10"
        style={{
          width: "100%",
          maxWidth: "min(1600px, 96vw)",
          margin: "0 auto",
          padding: "clamp(1rem, 3vw, 2rem)",
          display: "grid",
          gap: "1.25rem",
        }}
      >
        <div>{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
