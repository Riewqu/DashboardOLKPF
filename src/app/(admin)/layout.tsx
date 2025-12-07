import type { ReactNode } from "react";
import NavbarAdmin from "@/components/NavbarAdmin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <NavbarAdmin />
      <div style={{ paddingTop: "64px", width: "100%", overflowX: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
