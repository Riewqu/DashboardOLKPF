"use client";

import { useMemo, useState, useEffect, type SVGProps } from "react";
import Image from "next/image";
import type { ProductSaleView } from "../../dataClient";
import { GlassBackdrop } from "@/components/GlassBackdrop";
import { AnimatedSection } from "@/components/AnimatedSection";
import * as XLSX from "xlsx";

type Props = {
  sales: ProductSaleView[];
};

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAGE_SIZE = 20;

// --- Icons ---
const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);


const ChevronLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const BoxIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);


const CartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const MoneyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SparkleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const FilterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const TrendUpIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);


export default function ProductSalesClient({ sales }: Props) {
  const [search, setSearch] = useState("");
  const [hideZero, setHideZero] = useState(false);
  const [sortBy, setSortBy] = useState<"revenue" | "qty">("revenue");
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<"all" | "Shopee" | "TikTok" | "Lazada">("all");
  const [isMobile, setIsMobile] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const syncTheme = () => {
      const dark = document.body.classList.contains("dark-mode");
      setIsDark(dark);
    };
    syncTheme();

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      if (detail) setIsDark(detail === "dark");
      else syncTheme();
    };
    window.addEventListener("theme-changed", handler as EventListener);

    // Mobile filter toggle
    const filterToggleHandler = () => setFilterExpanded((prev) => !prev);
    window.addEventListener("product-sales-filter-toggle", filterToggleHandler as EventListener);

    return () => {
      window.removeEventListener("theme-changed", handler as EventListener);
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("product-sales-filter-toggle", filterToggleHandler as EventListener);
    };
  }, []);

  const displaySales = useMemo(() => {
    return sales.filter((r) => {
      const name = (r.variant || "").trim();
      return name !== "-" && name.length > 0;
    });
  }, [sales]);

  // Platform filtered data with aggregation
  const platformFiltered = useMemo(() => {
    // First filter by platform if not "all"
    const filtered = platformFilter === "all"
      ? displaySales
      : displaySales.filter((r) => r.platform === platformFilter);

    // Then aggregate by product name
    const grouped = new Map<string, ProductSaleView>();
    for (const row of filtered) {
      const key = row.product; // Group by product_name
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          ...row,
          platforms: row.platform ? [row.platform] : []
        });
        continue;
      }

      // Add platform to array if not already there
      if (row.platform && !existing.platforms?.includes(row.platform)) {
        existing.platforms = [...(existing.platforms ?? []), row.platform];
      }

      // Aggregate quantities and revenue
      existing.qty += row.qty;
      existing.qty_returned = (existing.qty_returned ?? 0) + (row.qty_returned ?? 0);
      existing.revenue += row.revenue;

      // Keep the latest variant info
      const prevDate = existing.created_at ? new Date(existing.created_at).getTime() : 0;
      const newDate = row.created_at ? new Date(row.created_at).getTime() : 0;
      if (newDate > prevDate) {
        existing.variant = row.variant;
        existing.created_at = row.created_at;
        existing.upload_id = row.upload_id;
        existing.image_url = row.image_url; // เก็บ image_url ด้วย
      }

      // Always keep image_url from any row (since product_name is the same, image should be the same)
      if (!existing.image_url && row.image_url) {
        existing.image_url = row.image_url;
      }
    }

    return Array.from(grouped.values());
  }, [displaySales, platformFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return platformFiltered.filter((row) => {
      if (hideZero && row.qty === 0 && row.revenue === 0) return false;
      if (!term) return true;
      return row.product.toLowerCase().includes(term) || row.variant.toLowerCase().includes(term);
    });
  }, [platformFiltered, search, hideZero]);

  const totals = useMemo(
    () => ({
      products: new Set(filtered.map((r) => r.product)).size,
      variants: filtered.length,
      qty: filtered.reduce((s, r) => s + r.qty, 0),
      returned: filtered.reduce((s, r) => s + (r.qty_returned ?? 0), 0),
      revenue: filtered.reduce((s, r) => s + r.revenue, 0)
    }),
    [filtered]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    return arr.sort((a, b) => (sortBy === "revenue" ? b.revenue - a.revenue : b.qty - a.qty));
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const visiblePages = useMemo(() => {
    const maxToShow = 5;
    if (totalPages <= maxToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.min(
      Math.max(1, currentPage - Math.floor(maxToShow / 2)),
      totalPages - maxToShow + 1
    );
    return Array.from({ length: maxToShow }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    document.body.classList.toggle("dark-mode", newMode);
    const event = new CustomEvent("theme-changed", { detail: newMode ? "dark" : "light" });
    window.dispatchEvent(event);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setHideZero(false);
    setSortBy("revenue");
    setPlatformFilter("all");
    setPage(1);
  };

  const hasFilters = platformFilter !== "all" || search || hideZero || sortBy !== "revenue";

  // Export to Excel
  const handleExport = () => {
    const exportData = sorted.map((row, idx) => ({
      "#": idx + 1,
      "Platform": row.platform || "-",
      "Product": row.product,
      "Variant": row.variant,
      "Quantity Sold": row.qty,
      "Quantity Returned": row.qty_returned ?? 0,
      "Revenue (THB)": row.revenue
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product Sales");

    // Auto-size columns
    const maxWidth = exportData.reduce((w, r) => {
      return Math.max(w, String(r.Product).length, String(r.Variant).length);
    }, 10);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 10 },
      { wch: Math.min(maxWidth, 50) },
      { wch: Math.min(maxWidth, 50) },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 }
    ];

    XLSX.writeFile(wb, `product-sales-${platformFilter}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!mounted) return null;

  const glassPanel = isDark
    ? "bg-white/5 backdrop-blur-2xl border border-white/10 text-slate-100"
    : "bg-white/80 backdrop-blur-xl border border-white/50";
  const glassHeader = isDark
    ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white"
    : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
  const textMuted = isDark ? "text-slate-300" : "text-gray-600";
  const textStrong = isDark ? "text-slate-50" : "text-gray-900";

  const NAV_OFFSET = 64;
  const MOBILE_NAV_HEIGHT = 64;
  const HIDE_OFFSET = 80;
  const overlayVisible = filterExpanded;

  return (
    <div className="min-h-screen">
      <GlassBackdrop isDark={isDark} />

      {/* Floating Filter Button (Desktop only) */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            top: `${NAV_OFFSET + 12}px`,
            right: "16px",
            zIndex: 1300,
          }}
        >
          <button
            onClick={() => setFilterExpanded(!filterExpanded)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.7rem 1rem",
              borderRadius: "14px",
              border: isDark ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(59,130,246,0.2)",
              background: isDark
                ? "linear-gradient(135deg, rgba(15, 20, 32, 0.92) 0%, rgba(10, 14, 26, 0.92) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
              boxShadow: isDark ? "0 10px 28px rgba(0,0,0,0.35)" : "0 8px 24px rgba(59,130,246,0.12)",
              color: isDark ? "#f1f5f9" : "#1e293b",
              cursor: "pointer",
              transition: "all 0.2s ease",
              minWidth: "140px",
              justifyContent: "space-between",
            }}
            title="กรองข้อมูล"
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.95rem" }}>
              <FilterIcon className="w-5 h-5" style={{ color: "#3b82f6" }} />
              ตัวกรอง
            </span>
            {hasFilters && (
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "999px",
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#3b82f6",
                  fontWeight: 700,
                }}
              >
                {[platformFilter !== "all" ? 1 : 0, search ? 1 : 0, hideZero ? 1 : 0, sortBy !== "revenue" ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
            {filterExpanded ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Backdrop */}
      {overlayVisible && (
        <div
          onClick={() => setFilterExpanded(false)}
          style={{
            position: "fixed",
            top: `${isMobile ? MOBILE_NAV_HEIGHT : NAV_OFFSET}px`,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark ? "rgba(10, 14, 26, 0.6)" : "rgba(15, 23, 42, 0.25)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 1100,
          }}
        />
      )}

      {/* Slide-down Filter Panel */}
      <div
        style={{
          position: "fixed",
          top: `${isMobile ? MOBILE_NAV_HEIGHT : NAV_OFFSET}px`,
          left: 0,
          right: 0,
          zIndex: 1200,
          transform: overlayVisible ? "translateY(0)" : `translateY(calc(-100% - ${HIDE_OFFSET}px))`,
          opacity: overlayVisible ? 1 : 0,
          visibility: overlayVisible ? "visible" : "hidden",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: overlayVisible ? "auto" : "none",
        }}
      >
        <div style={{
          padding: "1.5rem",
          maxWidth: "1600px",
          margin: "0 auto",
          background: isDark
            ? "linear-gradient(135deg, rgba(15, 20, 32, 0.98) 0%, rgba(10, 14, 26, 0.98) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDark ? "0 12px 32px rgba(0, 0, 0, 0.35)" : "0 12px 32px rgba(0, 0, 0, 0.12)",
          borderRadius: "0 0 20px 20px",
        }}>
          {/* Header with Theme Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.9rem" }}>ตั้งค่าตัวกรอง</p>
              <h3 style={{ margin: 0, color: isDark ? "#f1f5f9" : "#1e293b", fontWeight: 700 }}>ตัวกรองข้อมูล</h3>
            </div>
            <button
              onClick={toggleDarkMode}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                border: isDark ? "1px solid rgba(251, 191, 36, 0.4)" : "1px solid rgba(99, 102, 241, 0.4)",
                background: isDark ? "rgba(251, 191, 36, 0.12)" : "rgba(99, 102, 241, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: isDark ? "0 0 12px rgba(251, 191, 36, 0.35)" : "0 0 12px rgba(99, 102, 241, 0.35)",
              }}
              title={isDark ? "สลับเป็น Light Mode" : "สลับเป็น Dark Mode"}
            >
              {isDark ? (
                <svg className="w-5 h-5" style={{ color: "#fbbf24" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" style={{ color: "#6366f1" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          {/* Platform Filter */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "0.75rem", display: "block" }}>แพลตฟอร์ม</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(["all", "Shopee", "TikTok", "Lazada"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setPlatformFilter(filter); setPage(1); }}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "12px",
                    border: platformFilter === filter
                      ? "2px solid #3b82f6"
                      : (isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)"),
                    background: platformFilter === filter
                      ? "rgba(59, 130, 246, 0.15)"
                      : (isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)"),
                    color: platformFilter === filter ? "#3b82f6" : (isDark ? "#f1f5f9" : "#1e293b"),
                    fontSize: "0.875rem",
                    fontWeight: platformFilter === filter ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {filter === "all" ? (
                    "ทั้งหมด"
                  ) : (
                    (() => {
                      const logoMap: Record<"Shopee" | "TikTok" | "Lazada", string> = {
                        Shopee: "/Shopee.png",
                        TikTok: "/tiktok.png",
                        Lazada: "/Lazada.png"
                      };
                      return (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Image
                            src={logoMap[filter]}
                            alt={filter}
                            width={16}
                            height={16}
                            className="object-contain"
                            unoptimized
                          />
                          {filter}
                        </span>
                      );
                    })()
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "0.75rem", display: "block" }}>ค้นหา</label>
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหาชื่อสินค้า, SKU, หรือ Variant..."
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)",
                background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)",
                color: isDark ? "#f1f5f9" : "#1e293b",
                fontSize: "0.875rem",
              }}
            />
          </div>

          {/* Options */}
          <div style={{ marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)",
              background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                checked={hideZero}
                onChange={(e) => { setHideZero(e.target.checked); setPage(1); }}
                style={{ width: "18px", height: "18px" }}
              />
              <span style={{ fontSize: "0.875rem", color: isDark ? "#f1f5f9" : "#1e293b", fontWeight: "500" }}>ซ่อนยอด 0</span>
            </label>

            <div>
              <label style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "0.75rem", display: "block" }}>เรียงตาม</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => { setSortBy("revenue"); setPage(1); }}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    border: sortBy === "revenue"
                      ? "2px solid #3b82f6"
                      : (isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)"),
                    background: sortBy === "revenue"
                      ? "rgba(59, 130, 246, 0.15)"
                      : (isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)"),
                    color: sortBy === "revenue" ? "#3b82f6" : (isDark ? "#f1f5f9" : "#1e293b"),
                    fontSize: "0.875rem",
                    fontWeight: sortBy === "revenue" ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <TrendUpIcon className="w-4 h-4" />
                  <span>ยอดขายสูงสุด</span>
                </button>
                <button
                  onClick={() => { setSortBy("qty"); setPage(1); }}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    border: sortBy === "qty"
                      ? "2px solid #3b82f6"
                      : (isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)"),
                    background: sortBy === "qty"
                      ? "rgba(59, 130, 246, 0.15)"
                      : (isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)"),
                    color: sortBy === "qty" ? "#3b82f6" : (isDark ? "#f1f5f9" : "#1e293b"),
                    fontSize: "0.875rem",
                    fontWeight: sortBy === "qty" ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <BoxIcon className="w-4 h-4" />
                  <span>จำนวนสูงสุด</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              onClick={clearFilters}
              disabled={!hasFilters}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                color: hasFilters ? (isDark ? "#f1f5f9" : "#1e293b") : "#94a3b8",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: hasFilters ? "pointer" : "not-allowed",
                opacity: hasFilters ? 1 : 0.5,
                transition: "all 0.2s",
              }}
            >
              ล้างตัวกรอง
            </button>
            <button
              onClick={() => setFilterExpanded(false)}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(59, 130, 246, 0.4)",
                transition: "all 0.2s",
              }}
            >
              ใช้งาน
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDark ? "bg-white/10 border-white/20 text-slate-100" : "bg-white/80 border-blue-200/50 text-blue-600"} backdrop-blur-sm shadow-sm`}>
              <SparkleIcon className={`w-4 h-4 ${isDark ? "text-blue-300" : "text-blue-500"}`} />
              <span className="text-xs font-semibold uppercase tracking-wider">Analytics Dashboard</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-tight animated-gradient-text">
            Product Sales Analytics
          </h1>
          <p className={`text-base sm:text-lg ${textMuted} max-w-2xl`}>
            วิเคราะห์ยอดขายและประสิทธิภาพสินค้าแบบเรียลไทม์จากทุกแพลตฟอร์ม
          </p>
        </div>

        {/* Stats Grid */}
        <AnimatedSection animation="fade-up" delay={100}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '0.75rem' : '1.5rem',
            marginBottom: '2rem'
          }}>
            <StatCard
              icon={<BoxIcon className="w-6 h-6" />}
              label="ผลิตภัณฑ์"
              value={totals.products.toLocaleString()}
              unit="รายการ"
              color="blue"
              isDark={isDark}
            />
            <StatCard
              icon={<CartIcon className="w-6 h-6" />}
              label="จำนวนขาย"
              value={totals.qty.toLocaleString()}
              unit="ชิ้น"
              color="cyan"
              highlight
              isDark={isDark}
            />
            <StatCard
              icon={<MoneyIcon className="w-6 h-6" />}
              label="ยอดขาย"
              value={currency(totals.revenue)}
              unit=""
              color="indigo"
              highlight
              isDark={isDark}
            />
            <StatCard
              icon={<TrendUpIcon className="w-6 h-6" />}
              label="ตีกลับ"
              value={totals.returned.toLocaleString()}
              unit="ชิ้น"
              color="orange"
              isDark={isDark}
            />
          </div>
        </AnimatedSection>

        {/* Main Content */}
        <AnimatedSection animation="fade-up" delay={200}>
          <div className={`${glassPanel} rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden`}>
          {/* Panel Header */}
          <div className={`${glassHeader} px-4 sm:px-6 py-4 sm:py-5`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`rounded-xl ${isDark ? "bg-white/20" : "bg-white/20"} backdrop-blur-sm flex items-center justify-center`}
                  style={{
                    width: 'clamp(32px, 8vw, 40px)',
                    height: 'clamp(32px, 8vw, 40px)'
                  }}
                >
                  <BoxIcon style={{ width: 'clamp(18px, 5vw, 24px)', height: 'clamp(18px, 5vw, 24px)' }} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white" style={{ fontSize: 'clamp(0.9rem, 3vw, 1.25rem)' }}>รายการสินค้า</h2>
                  <p className="text-blue-50" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}>
                    {platformFilter === "all" ? "ทุกแพลตฟอร์ม" : platformFilter} • {totals.variants.toLocaleString()} รายการ
                  </p>
                </div>
              </div>
              <button
                onClick={handleExport}
                disabled={sorted.length === 0}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-white/30 hover:bg-white/40 text-white"
                }`}
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                <DownloadIcon style={{ width: 'clamp(16px, 4vw, 20px)', height: 'clamp(16px, 4vw, 20px)' }} />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
            </div>
          </div>

          {/* Table / List */}
          <div className="p-6 sm:p-8">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg"
                  style={{
                    width: 'clamp(48px, 12vw, 64px)',
                    height: 'clamp(48px, 12vw, 64px)'
                  }}
                >
                  <SearchIcon style={{ width: 'clamp(24px, 6vw, 32px)', height: 'clamp(24px, 6vw, 32px)' }} />
                </div>
                <p className={`font-semibold ${textStrong} mb-2`} style={{ fontSize: 'clamp(0.9rem, 3vw, 1.125rem)' }}>ไม่พบรายการที่ค้นหา</p>
                <p className={`${textMuted} max-w-md mx-auto`} style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)' }}>
                  ลองเปลี่ยนคำค้นหรือยกเลิกตัวกรองเพื่อดูข้อมูลทั้งหมดอีกครั้ง
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${isDark ? "bg-white/[0.06] border-b border-white/10" : "bg-gray-50 border-b border-gray-200"}`}>
                        <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>#</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>รูปภาพ</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Platform</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>สินค้า / ยอดขาย</th>
                        <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${textMuted}`}>จำนวนขาย / ตีกลับ</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? "divide-y divide-white/10" : "divide-y divide-gray-100"}`}>
                      {pagedRows.map((row, idx) => (
                        <tr
                          key={`${row.variant}-${idx}`}
                          className={`${isDark ? "hover:bg-white/[0.04]" : "hover:bg-blue-50/50"} transition-colors`}
                        >
                          <td className="px-4 py-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {idx + 1 + (currentPage - 1) * PAGE_SIZE}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {row.image_url ? (
                              <img
                                src={row.image_url}
                                alt={row.product}
                                className="w-16 h-16 object-contain"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  boxShadow: "none",
                                }}
                              />
                            ) : (
                              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDark ? "bg-white/[0.04] text-slate-500" : "bg-gray-100 text-gray-400"}`}>
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <PlatformBadges platforms={row.platforms ?? (row.platform ? [row.platform] : [])} isDark={isDark} size="sm" />
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <div className={`font-semibold ${textStrong} mb-0.5`}>{row.variant}</div>
                              {row.product !== row.variant && (
                                <div className={`text-sm ${textMuted} mb-1`}>{row.product}</div>
                              )}
                              <div className={`text-lg font-bold ${isDark ? "text-blue-300" : "text-blue-600"} mt-1`}>
                                {currency(row.revenue)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-4">
                              <div>
                                <div className={`text-lg font-semibold ${textStrong}`}>{row.qty.toLocaleString()}</div>
                                <div className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>จำนวนขาย</div>
                              </div>
                              <div className={`pl-4 ${isDark ? "border-l border-white/10" : "border-l border-gray-100"}`}>
                                <div className={`text-lg font-semibold ${isDark ? "text-orange-300" : "text-orange-600"}`}>
                                  {(row.qty_returned ?? 0).toLocaleString()}
                                </div>
                                <div className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>ตีกลับ</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Cards */}
                <div className="lg:hidden space-y-3">
                  {pagedRows.map((row, idx) => (
                    <div
                      key={`${row.variant}-${idx}`}
                      className={`${isDark ? "bg-white/[0.04] border border-white/10 hover:border-blue-300/40" : "bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 hover:border-blue-200"} rounded-xl p-3 hover:shadow-lg transition-all duration-200`}
                    >
                      {/* Header with Index and Platform */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div style={{
                          width: 'clamp(28px, 8vw, 36px)',
                          height: 'clamp(28px, 8vw, 36px)'
                        }} className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                          <span style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}>
                            {idx + 1 + (currentPage - 1) * PAGE_SIZE}
                          </span>
                        </div>
                        <PlatformBadges platforms={row.platforms ?? (row.platform ? [row.platform] : [])} isDark={isDark} size="sm" />
                      </div>

                      {/* Product Info + Image in Row */}
                      <div className="flex gap-3 mb-2">
                        {/* Product Image - Compact */}
                        <div className="flex-shrink-0">
                          {row.image_url ? (
                            <img
                              src={row.image_url}
                              alt={row.product}
                              style={{
                                width: 'clamp(56px, 15vw, 72px)',
                                height: 'clamp(56px, 15vw, 72px)',
                                background: "transparent",
                                border: "none",
                                boxShadow: "none",
                              }}
                              className="object-contain"
                            />
                          ) : (
                            <div
                              className={`rounded-lg flex items-center justify-center ${isDark ? "bg-white/[0.04] text-slate-500" : "bg-gray-100 text-gray-400"}`}
                              style={{
                                width: 'clamp(56px, 15vw, 72px)',
                                height: 'clamp(56px, 15vw, 72px)'
                              }}
                            >
                              <svg style={{ width: 'clamp(24px, 8vw, 32px)', height: 'clamp(24px, 8vw, 32px)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Name */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold ${textStrong} break-words`} style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', lineHeight: '1.3' }}>
                            {row.variant}
                          </h3>
                          {row.product !== row.variant && (
                            <p className={`${textMuted} mt-0.5`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.75rem)', lineHeight: '1.3' }}>
                              {row.product}
                            </p>
                          )}
                          <div className={`font-bold ${isDark ? "text-blue-300" : "text-blue-600"} mt-1.5`} style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)' }}>
                            {currency(row.revenue)}
                          </div>
                        </div>
                      </div>

                      {/* Stats - Horizontal Layout */}
                      <div className={`flex items-center gap-4 pt-2 ${isDark ? "border-t border-white/10" : "border-t border-gray-100"}`}>
                        <div>
                          <div className={`${isDark ? "text-slate-400" : "text-gray-500"} mb-1`} style={{ fontSize: 'clamp(0.65rem, 1.8vw, 0.7rem)' }}>
                            จำนวนขาย
                          </div>
                          <div className={`font-semibold ${textStrong}`} style={{ fontSize: 'clamp(0.85rem, 2.8vw, 1rem)' }}>
                            {row.qty.toLocaleString()}{' '}
                            <span className={`font-normal ${isDark ? "text-slate-400" : "text-gray-500"}`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.75rem)' }}>
                              ชิ้น
                            </span>
                          </div>
                        </div>
                        <div className={`pl-4 ${isDark ? "border-l border-white/10" : "border-l border-gray-100"}`}>
                          <div className={`${isDark ? "text-slate-400" : "text-gray-500"} mb-1`} style={{ fontSize: 'clamp(0.65rem, 1.8vw, 0.7rem)' }}>
                            ตีกลับ
                          </div>
                          <div className={`font-semibold ${isDark ? "text-orange-300" : "text-orange-600"}`} style={{ fontSize: 'clamp(0.85rem, 2.8vw, 1rem)' }}>
                            {(row.qty_returned ?? 0).toLocaleString()}{' '}
                            <span className={`font-normal ${isDark ? "text-slate-400" : "text-gray-500"}`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.75rem)' }}>
                              ชิ้น
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 ${isDark ? "border-t border-white/10" : "border-t border-gray-100"}`}>
                  <div className={textMuted} style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                    แสดง <span className={`font-semibold ${textStrong}`}>{pagedRows.length}</span> จาก <span className={`font-semibold ${textStrong}`}>{sorted.length.toLocaleString()}</span> รายการ
                    {platformFilter !== "all" && ` (${platformFilter})`}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        width: 'clamp(32px, 8vw, 40px)',
                        height: 'clamp(32px, 8vw, 40px)'
                      }}
                      className={`rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark
                          ? "bg-white/[0.06] border border-white/10 text-slate-100 hover:bg-white/[0.1] hover:border-blue-300/40 disabled:hover:bg-white/[0.06] disabled:hover:border-white/10"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300 disabled:hover:bg-white disabled:hover:border-gray-200"
                      }`}
                    >
                      <ChevronLeft style={{ width: 'clamp(16px, 4vw, 20px)', height: 'clamp(16px, 4vw, 20px)' }} />
                    </button>

                    <div className="flex gap-1">
                      {visiblePages.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{
                            width: 'clamp(32px, 8vw, 40px)',
                            height: 'clamp(32px, 8vw, 40px)',
                            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                          }}
                          className={`rounded-lg flex items-center justify-center font-semibold transition-all ${
                            currentPage === p
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md'
                              : isDark
                                ? 'bg-white/[0.06] border border-white/10 text-slate-100 hover:bg-white/[0.1] hover:border-blue-300/40'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        width: 'clamp(32px, 8vw, 40px)',
                        height: 'clamp(32px, 8vw, 40px)'
                      }}
                      className={`rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark
                          ? "bg-white/[0.06] border border-white/10 text-slate-100 hover:bg-white/[0.1] hover:border-blue-300/40 disabled:hover:bg-white/[0.06] disabled:hover:border-white/10"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300 disabled:hover:bg-white disabled:hover:border-gray-200"
                      }`}
                    >
                      <ChevronRight style={{ width: 'clamp(16px, 4vw, 20px)', height: 'clamp(16px, 4vw, 20px)' }} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

// --- Sub-components ---

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: "blue" | "sky" | "cyan" | "indigo" | "orange";
  highlight?: boolean;
  isDark?: boolean;
};

function StatCard({ icon, label, value, unit, color, highlight, isDark = false }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    sky: 'from-sky-500 to-sky-600',
    cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600',
    orange: 'from-orange-500 to-amber-500',
  };

  const bgColorClasses = {
    blue: isDark ? 'bg-white/[0.04] border border-white/10' : 'bg-blue-50',
    sky: isDark ? 'bg-white/[0.04] border border-white/10' : 'bg-sky-50',
    cyan: isDark ? 'bg-white/[0.04] border border-white/10' : 'bg-cyan-50',
    indigo: isDark ? 'bg-white/[0.04] border border-white/10' : 'bg-indigo-50',
    orange: isDark ? 'bg-white/[0.04] border border-white/10' : 'bg-orange-50',
  };

  return (
    <div className={`relative overflow-hidden ${bgColorClasses[color]} rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      {/* Decorative Gradient */}
      <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${colorClasses[color]} ${isDark ? "opacity-20" : "opacity-10"} rounded-full -mr-8 -mt-8`}></div>

      <div className="relative">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-md`}>
            {icon}
          </div>
          {highlight && (
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse"></div>
          )}
        </div>

        <div>
          <p className={`font-medium ${isDark ? "text-slate-300" : "text-gray-600"} mb-1`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}>{label}</p>
          <div className="flex items-baseline gap-1">
            <h3 className={`font-bold ${highlight ? 'text-blue-400' : isDark ? "text-slate-50" : "text-gray-900"}`} style={{ fontSize: 'clamp(1rem, 4.5vw, 1.875rem)' }}>
              {value}
            </h3>
            {unit && <span className={`font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}>{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

type PlatformBadgeProps = {
  platform: "Shopee" | "TikTok" | "Lazada";
  isDark: boolean;
  size?: "sm" | "md";
};

function PlatformBadge({ platform, isDark, size = "md" }: PlatformBadgeProps) {
  const logoMap = {
    Shopee: "/Shopee.png",
    TikTok: "/tiktok.png",
    Lazada: "/Lazada.png"
  };

  const styles =
    platform === "Shopee"
      ? {
          bg: isDark ? "bg-orange-500/20 border-orange-500/30" : "bg-orange-50 border-orange-200",
          text: isDark ? "text-orange-300" : "text-orange-700"
        }
      : platform === "TikTok"
        ? {
            bg: isDark ? "bg-red-500/20 border-red-500/30" : "bg-red-50 border-red-200",
            text: isDark ? "text-red-300" : "text-red-700"
          }
        : {
            bg: isDark ? "bg-blue-500/20 border-blue-500/30" : "bg-blue-50 border-blue-200",
            text: isDark ? "text-blue-300" : "text-blue-700"
          };

  // Responsive sizing
  const imgSize = size === "sm"
    ? { width: 'clamp(12px, 3vw, 14px)', height: 'clamp(12px, 3vw, 14px)' }
    : { width: '16px', height: '16px' };
  const paddingStyle = size === "sm"
    ? { padding: 'clamp(2px, 1vw, 4px) clamp(6px, 2vw, 8px)' }
    : { padding: '4px 12px' };
  const textSize = size === "sm"
    ? { fontSize: 'clamp(9px, 2vw, 10px)' }
    : { fontSize: '0.75rem' };

  return (
    <div
      className={`inline-flex items-center rounded-full font-bold border ${styles.bg} ${styles.text}`}
      style={{
        gap: 'clamp(4px, 1vw, 6px)',
        ...paddingStyle
      }}
    >
      <img
        src={logoMap[platform]}
        alt={platform}
        style={imgSize}
        className="object-contain flex-shrink-0"
      />
      <span style={textSize}>{platform}</span>
    </div>
  );
}

type PlatformBadgesProps = {
  platforms: string[];
  isDark: boolean;
  size?: "sm" | "md";
};

function PlatformBadges({ platforms, isDark, size = "md" }: PlatformBadgesProps) {
  const validPlatforms = platforms.filter((p): p is "Shopee" | "TikTok" | "Lazada" =>
    p === "Shopee" || p === "TikTok" || p === "Lazada"
  );

  if (validPlatforms.length === 0) return null;

  return (
    <div className="flex flex-wrap" style={{ gap: 'clamp(4px, 1vw, 6px)' }}>
      {validPlatforms.map((platform) => (
        <PlatformBadge key={platform} platform={platform} isDark={isDark} size={size} />
      ))}
    </div>
  );
}
