"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThailandMapD3 } from "@/components/ThailandMapD3";
import { ThailandProvinceTables } from "@/components/ThailandProvinceTables";
import { GlassBackdrop } from "@/components/GlassBackdrop";
import { AnimatedSection } from "@/components/AnimatedSection";
import DateRangePicker from "@/components/DateRangePicker";

type ProvinceProduct = {
  sku: string;
  name: string;
  qty: number;
  revenue: number;
  image_url?: string | null;
};

type ProvinceSales = {
  name: string;
  totalQty: number;
  totalRevenue: number;
  productCount: number;
  products: ProvinceProduct[];
};

type SalesByProvinceData = {
  totalProvinces: number;
  maxProvinces: number;
  coverage: number;
  provinces: ProvinceSales[];
  topProvinces: ProvinceSales[];
};

type ThailandMapClientProps = {
  salesData: SalesByProvinceData;
  initialStartDate: string | null;
  initialEndDate: string | null;
};

export function ThailandMapClient({ salesData, initialStartDate, initialEndDate }: ThailandMapClientProps) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"revenue" | "qty" | "product">("revenue");
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: initialStartDate,
    endDate: initialEndDate,
  });

  const hasTopProvinces = salesData.topProvinces.length > 0;
  const hasProvinceList = salesData.provinces.length > 0;

  // Detect dark mode and mobile
  useEffect(() => {
    const updateTheme = () => {
      const isDocDark = document.documentElement.classList.contains("dark");
      const isBodyDark = document.body.classList.contains("dark-mode") || document.body.classList.contains("dark");
      setIsDark(isDocDark || isBodyDark);
    };
    updateTheme();

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("theme-changed", updateTheme);

    // Mobile filter toggle
    const filterToggleHandler = () => setFilterExpanded((prev) => !prev);
    window.addEventListener("thailand-map-filter-toggle", filterToggleHandler as EventListener);

    return () => {
      observer.disconnect();
      window.removeEventListener("theme-changed", updateTheme);
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("thailand-map-filter-toggle", filterToggleHandler as EventListener);
    };
  }, []);

  // Toggle Dark Mode
  // Handle date range apply
  const handleDateApply = () => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.set("start_date", dateRange.startDate);
    if (dateRange.endDate) params.set("end_date", dateRange.endDate);
    router.push(`/thailand-map${params.toString() ? `?${params.toString()}` : ""}`);
  };

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
    setProvinceFilter("all");
    setSortBy("revenue");
    setDateRange({ startDate: null, endDate: null });
    router.push("/thailand-map");
  };

  const hasFilters = search || provinceFilter !== "all" || sortBy !== "revenue" || dateRange.startDate || dateRange.endDate;
  const NAV_OFFSET = 64;
  const MOBILE_NAV_HEIGHT = 64;
  const HIDE_OFFSET = 80;
  const PANEL_WIDTH = "min(460px, 92vw)";
  const overlayVisible = filterExpanded;

  // Province options for dropdown
  const provinceOptions = ["all", ...salesData.provinces.map((p) => p.name).sort()];

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent transition-colors">
      {/* Full-page animated background - same as Dashboard and Product Sales */}
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
              <svg className="w-5 h-5" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
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
                {[search ? 1 : 0, provinceFilter !== "all" ? 1 : 0, sortBy !== "revenue" ? 1 : 0, dateRange.startDate || dateRange.endDate ? 1 : 0].reduce((a, b) => a + b, 0)}
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

      {/* Slide / Drawer Filter Panel */}
      <div
        style={{
          position: "fixed",
          top: `${isMobile ? MOBILE_NAV_HEIGHT : NAV_OFFSET}px`,
          right: 0,
          left: isMobile ? 0 : "auto",
          width: isMobile ? "100%" : PANEL_WIDTH,
          height: isMobile ? "auto" : `calc(100vh - ${NAV_OFFSET}px)`,
          zIndex: 1200,
          transform: overlayVisible
            ? "translateX(0)"
            : isMobile
              ? `translateY(calc(-100% - ${HIDE_OFFSET}px))`
              : "translateX(110%)",
          opacity: overlayVisible ? 1 : 0,
          visibility: overlayVisible ? "visible" : "hidden",
          transition: "transform 0.32s cubic-bezier(0.33, 1, 0.68, 1)",
          pointerEvents: overlayVisible ? "auto" : "none",
        }}
      >
        <div style={{
          padding: "1.5rem",
          maxWidth: isMobile ? "1600px" : PANEL_WIDTH,
          margin: isMobile ? "0 auto" : "0 0 0 auto",
          minHeight: isMobile ? undefined : `calc(100vh - ${NAV_OFFSET}px)`,
          height: isMobile ? "auto" : `calc(100vh - ${NAV_OFFSET}px)`,
          background: isDark
            ? "linear-gradient(135deg, rgba(15, 20, 32, 0.98) 0%, rgba(10, 14, 26, 0.98) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)",
          backdropFilter: "blur(24px)",
          borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDark
            ? "0 20px 60px rgba(0,0,0,0.55), 0 0 30px rgba(59,130,246,0.15)"
            : "0 20px 60px rgba(59,130,246,0.18), 0 0 30px rgba(14,165,233,0.16)",
          borderRadius: isMobile ? "0 0 20px 20px" : "24px 0 0 24px",
          overflowY: "auto",
          maxHeight: isMobile ? undefined : `calc(100vh - ${NAV_OFFSET}px - 12px)`,
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

          {/* Province Filter */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "0.75rem", display: "block" }}>เลือกจังหวัด</label>
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)",
                background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)",
                color: isDark ? "#f1f5f9" : "#1e293b",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              {provinceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "all" ? "ทุกจังหวัด" : opt}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "0.75rem", display: "block" }}>ค้นหา</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาจังหวัดหรือสินค้า..."
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

          {/* Date Range Filter */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "0.75rem", display: "block" }}>ช่วงวันที่</label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              onApply={handleDateApply}
              label="เลือกช่วงวันที่"
              isDark={isDark}
            />
          </div>

          {/* Sort By */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "0.75rem", display: "block" }}>เรียงตาม</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "revenue" | "qty" | "product")}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)",
                background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)",
                color: isDark ? "#f1f5f9" : "#1e293b",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <option value="revenue">ยอดขายสูงสุด</option>
              <option value="qty">จำนวนชิ้นสูงสุด</option>
              <option value="product">จำนวนรายการสินค้า</option>
            </select>
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

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/80 dark:bg-slate-800/70 border-blue-200/50 dark:border-slate-700 text-blue-600 dark:text-blue-200 backdrop-blur-sm shadow-sm">
              <span className="text-xl">🗺️</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Sales Coverage</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-tight animated-gradient-text">
            Thailand Sales Map
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            แผนที่แสดงการกระจายยอดขายในแต่ละจังหวัดทั่วประเทศไทย
          </p>
        </div>

        {/* Coverage Stats - Modern Gradient Cards */}
        <AnimatedSection animation="fade-up" delay={100}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '0.75rem' : '1.5rem',
            marginBottom: '2.5rem'
          }}>
          {/* Card 1: จังหวัดที่ขายได้ */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 dark:from-[#0c1b33] dark:to-[#0e2747] rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">จังหวัด</div>
              </div>
              <div className="font-bold text-white mb-1" style={{ fontSize: isMobile ? 'clamp(1rem, 5vw, 1.5rem)' : '1.875rem' }}>
                {salesData.totalProvinces}/{salesData.maxProvinces}
              </div>
              <div className="text-blue-100 text-xs sm:text-sm">ครอบคลุม {salesData.coverage.toFixed(1)}%</div>
            </div>
          </div>

          {/* Card 2: ยอดขายรวม */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-[#0b2a33] dark:to-[#0e3843] rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">ยอดขายรวม</div>
              </div>
              <div className="font-bold text-white mb-1" style={{ fontSize: isMobile ? 'clamp(0.875rem, 4.5vw, 1.25rem)' : '1.875rem' }}>
                ฿{salesData.provinces.reduce((sum, p) => sum + p.totalRevenue, 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-cyan-100 text-xs sm:text-sm">ทุกจังหวัด</div>
            </div>
          </div>

          {/* Card 3: จำนวนสินค้าทั้งหมด */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-[#0d1833] dark:to-[#121f3f] rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">จำนวนสินค้า</div>
              </div>
              <div className="font-bold text-white mb-1" style={{ fontSize: isMobile ? 'clamp(1rem, 5vw, 1.5rem)' : '1.875rem' }}>
                {salesData.provinces.reduce((sum, p) => sum + p.totalQty, 0).toLocaleString('th-TH')} <span style={{ fontSize: isMobile ? '0.75rem' : '1.125rem' }}>ชิ้น</span>
              </div>
              <div className="text-indigo-100 text-xs sm:text-sm">ชิ้นทั้งหมด</div>
            </div>
          </div>

          {/* Card 4: เฉลี่ย/จังหวัด */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 dark:from-[#1a0d33] dark:to-[#2a1647] rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">เฉลี่ย/จังหวัด</div>
              </div>
              <div className="font-bold text-white mb-1" style={{ fontSize: isMobile ? 'clamp(0.875rem, 4.5vw, 1.25rem)' : '1.875rem' }}>
                ฿{salesData.totalProvinces > 0 ? (salesData.provinces.reduce((sum, p) => sum + p.totalRevenue, 0) / salesData.totalProvinces).toLocaleString('th-TH', { maximumFractionDigits: 2 }) : "0"}
              </div>
              <div className="text-purple-100 text-xs sm:text-sm">ยอดขายเฉลี่ย</div>
            </div>
          </div>
        </div>
        </AnimatedSection>

        {/* Modern D3.js Thailand Map */}
        {salesData.provinces.length > 0 && (
          <AnimatedSection animation="scale" delay={200}>
            <ThailandMapD3
              provinces={salesData.provinces
                .filter((p) => p.name !== "ไม่ระบุจังหวัด") // Exclude unmapped provinces from map
                .map((p) => ({
                  name: p.name,
                  totalRevenue: p.totalRevenue,
                  totalQty: p.totalQty,
                  productCount: p.productCount
                }))}
            />
          </AnimatedSection>
        )}

        {(hasTopProvinces || hasProvinceList) && (
          <AnimatedSection animation="fade-up" delay={300}>
            <ThailandProvinceTables
              topProvinces={salesData.topProvinces}
              provinces={salesData.provinces}
              search={search}
              provinceFilter={provinceFilter}
              sortBy={sortBy}
            />
          </AnimatedSection>
        )}

        {/* Empty State */}
        {salesData.provinces.length === 0 && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-2xl p-12 shadow-lg text-center text-slate-900 dark:text-slate-100 transition-colors">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold mb-2">ยังไม่มีข้อมูลจังหวัด</h3>
            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              อัปโหลดไฟล์ยอดขายที่มีข้อมูลจังหวัดในหน้า <a href="/admin" className="text-blue-600 dark:text-blue-300 hover:underline font-semibold">Admin</a> เพื่อดูแผนที่การขาย
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
