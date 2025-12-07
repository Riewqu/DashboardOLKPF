import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
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
      <div
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
    </div>
  );
}
