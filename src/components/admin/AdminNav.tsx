"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UploadIcon, CheckIcon, ChartIcon } from "@/components/ui/Icons";

const links = [
  { href: "/admin", label: "อัปโหลดไฟล์", icon: UploadIcon },
  { href: "/admin/product-map", label: "Mapping สินค้า", icon: CheckIcon },
  { href: "/product-sales", label: "ยอดขายสินค้า", icon: ChartIcon }
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        padding: "0.75rem",
        border: "1px solid rgba(37,99,235,0.18)",
        borderRadius: "16px",
        background: "linear-gradient(120deg, rgba(59,130,246,0.12), rgba(37,99,235,0.1))",
        boxShadow: "0 12px 30px rgba(37,99,235,0.14)"
      }}
    >
      {links.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.65rem 0.9rem",
              borderRadius: "12px",
              border: "1px solid",
              borderColor: active ? "rgba(37,99,235,0.5)" : "rgba(37,99,235,0.18)",
              background: active ? "linear-gradient(120deg, #2563eb, #38bdf8)" : "#ffffff",
              color: active ? "#0b1020" : "#0f172a",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: active ? "0 10px 25px rgba(37,99,235,0.22)" : "0 8px 20px rgba(15,23,42,0.05)",
              transition: "all 0.2s ease"
            }}
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
