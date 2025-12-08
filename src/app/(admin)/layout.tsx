import type { ReactNode } from "react";
import NavbarAdmin from "@/components/NavbarAdmin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <NavbarAdmin />
      <div style={{ paddingTop: "calc(64px + var(--safe-area-top))", width: "100%", overflowX: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
