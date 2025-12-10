import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import NavbarPublic from "@/components/NavbarPublic";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ThemeBridge } from "@/components/ThemeBridge";
import { getServerSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // Check authentication (allow both viewer and admin)
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative">
      <ThemeBridge />

      {/* Animated Background - Only on mobile */}
      <div className="md:hidden">
        <AnimatedBackground />
      </div>

      <NavbarPublic />
      <div
        className="relative z-10"
        style={{ paddingTop: "calc(64px + var(--safe-area-top))" }}
      >
        {children}
      </div>
    </div>
  );
}
