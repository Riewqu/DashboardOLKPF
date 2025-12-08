import type { ReactNode } from "react";
import NavbarPublic from "@/components/NavbarPublic";
import { ThemeBridge } from "@/components/ThemeBridge";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <ThemeBridge />
      <NavbarPublic />
      <div style={{ paddingTop: "calc(64px + var(--safe-area-top))" }}>
        {children}
      </div>
    </div>
  );
}
