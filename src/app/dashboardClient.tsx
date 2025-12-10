"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  DollarIcon,
  ChartIcon,
  TrendUpIcon,
  TrendDownIcon,
  FilterIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
  EyeIcon,
  SunIcon,
  MoonIcon,
} from "@/components/ui/Icons";
import type { PlatformKPI } from "@/lib/mockData";
import type { GoalRecord } from "./dataClient";
import { setTheme, toggleTheme, type ThemeMode } from "@/lib/theme";
import { GlassBackdrop } from "@/components/GlassBackdrop";
import GoalsHeroPerformant from "@/components/GoalsHeroPerformant";
import MonthlyModalApple from "@/components/MonthlyModalApple";
import { AnimatedSection } from "@/components/AnimatedSection";
import { ThailandMapD3 } from "@/components/ThailandMapD3";

type Props = {
  platforms: PlatformKPI[];
  goals?: GoalRecord[];
};

type TopProductItem = {
  name: string;
  variant: string;
  revenue: number;
  qty: number;
  returned: number;
  platforms: string[];
  latest_at: string | null;
  image_url: string | null;
};

type TopProvinceItem = {
  name: string;
  revenue: number;
  qty: number;
};

type TopPlatformItem = {
  platform: "Shopee" | "TikTok" | "Lazada";
  variant: string;
  revenue: number;
  qty: number;
} | null;

const PLATFORM_META: Record<"Shopee" | "TikTok" | "Lazada", { color: string; logo: string }> = {
  Shopee: { color: "#f97316", logo: "/Shopee.png" },
  TikTok: { color: "#ef4444", logo: "/tiktok.png" },
  Lazada: { color: "#3b82f6", logo: "/Lazada.png" }
};

// Utility functions
const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// LiveClock Component with Thailand Timezone
function LiveClock({ isDarkMode }: { isDarkMode: boolean }) {
  const [time, setTime] = useState({ hours: "00", minutes: "00", seconds: "00" });
  const [prevTime, setPrevTime] = useState({ hours: "00", minutes: "00", seconds: "00" });
  const [animating, setAnimating] = useState({
    h1: false, h2: false,
    m1: false, m2: false,
    s1: false, s2: false
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Convert to Thailand timezone (UTC+7)
      const thailandTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));

      const hours = String(thailandTime.getHours()).padStart(2, "0");
      const minutes = String(thailandTime.getMinutes()).padStart(2, "0");
      const seconds = String(thailandTime.getSeconds()).padStart(2, "0");

      setTime((prev) => {
        const newAnimating = {
          h1: prev.hours[0] !== hours[0],
          h2: prev.hours[1] !== hours[1],
          m1: prev.minutes[0] !== minutes[0],
          m2: prev.minutes[1] !== minutes[1],
          s1: prev.seconds[0] !== seconds[0],
          s2: prev.seconds[1] !== seconds[1],
        };

        const hasAnyChange = Object.values(newAnimating).some(v => v);

        if (hasAnyChange) {
          setPrevTime(prev);
          setAnimating(newAnimating);
          setTimeout(() => setAnimating({ h1: false, h2: false, m1: false, m2: false, s1: false, s2: false }), 990);
        }

        return { hours, minutes, seconds };
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  const renderDigit = (currentDigit: string, prevDigit: string, isAnimating: boolean, key: string, isInfinite: boolean = false) => {
    // For infinite animation, always animate
    const shouldAnimate = isAnimating || isInfinite;

    return (
      <div
        className="clock-digit-wrapper"
        style={{
          height: "1em",
          overflow: "hidden",
          position: "relative",
          display: "inline-block",
          width: "0.6em",
        }}
      >
        <div
          className={`clock-digit-container ${shouldAnimate ? "clock-digit-animate" : ""}`}
          // Force re-render when digit changes for infinite animation
          key={isInfinite ? `${key}-${currentDigit}` : undefined}
          style={{
            position: "relative",
            display: "block",
          }}
        >
          {shouldAnimate && (
            <div className="clock-number" style={{ lineHeight: "1em", display: "block", height: "1em" }}>
              {prevDigit}
            </div>
          )}
          <div className="clock-number" style={{ lineHeight: "1em", display: "block", height: "1em" }}>
            {currentDigit}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "clamp(0.75rem, 2vw, 1.25rem)", flexWrap: "wrap", justifyContent: "center" }}>
      {/* LIVE Indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "clamp(0.375rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
          borderRadius: "clamp(20px, 3vw, 24px)",
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)"
            : "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)",
          border: `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          className="live-pulse"
          style={{
            width: "clamp(6px, 1.5vw, 8px)",
            height: "clamp(6px, 1.5vw, 8px)",
            borderRadius: "50%",
            background: "#ef4444",
            boxShadow: "0 0 12px rgba(239, 68, 68, 0.8)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
            fontWeight: "700",
            color: "#ef4444",
            letterSpacing: "0.05em",
          }}
        >
          LIVE
        </span>
      </div>

      {/* Clock Display */}
      <div
        className="live-clock"
        style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: "400",
          fontFamily: "sans-serif",
          color: isDarkMode ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.85)",
          display: "flex",
          alignItems: "center",
          gap: "clamp(0.125rem, 0.5vw, 0.25rem)",
          letterSpacing: "0.02em",
          lineHeight: "1",
        }}
      >
        {/* Hours */}
        <div style={{ display: "flex" }}>
          {renderDigit(time.hours[0], prevTime.hours[0], animating.h1, "h1")}
          {renderDigit(time.hours[1], prevTime.hours[1], animating.h2, "h2")}
        </div>
        <span style={{ opacity: 0.6 }}>:</span>
        {/* Minutes */}
        <div style={{ display: "flex" }}>
          {renderDigit(time.minutes[0], prevTime.minutes[0], animating.m1, "m1")}
          {renderDigit(time.minutes[1], prevTime.minutes[1], animating.m2, "m2")}
        </div>
        <span style={{ opacity: 0.6 }}>:</span>
        {/* Seconds */}
        <div style={{ display: "flex" }}>
          {renderDigit(time.seconds[0], prevTime.seconds[0], animating.s1, "s1")}
          {renderDigit(time.seconds[1], prevTime.seconds[1], animating.s2, "s2", true)}
        </div>
      </div>
    </div>
  );
}

// Skeleton Components
function SkeletonBox({ width = "100%", height = "20px", className = "", style }: { width?: string; height?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: "8px",
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-loading 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function SkeletonStatCard() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "clamp(16px, 3vw, 24px)",
        padding: "clamp(1rem, 2vw, 1.5rem)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <SkeletonBox width="56px" height="56px" />
        <SkeletonBox width="40px" height="40px" />
      </div>
      <SkeletonBox width="60%" height="14px" style={{ marginBottom: "0.75rem" }} />
      <SkeletonBox width="80%" height="32px" style={{ marginBottom: "0.5rem" }} />
      <SkeletonBox width="50%" height="12px" />
    </div>
  );
}

function SkeletonPlatformCard() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "clamp(16px, 3vw, 24px)",
        padding: "clamp(1rem, 2vw, 1.5rem)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <SkeletonBox width="12px" height="12px" />
          <SkeletonBox width="100px" height="20px" />
        </div>
        <SkeletonBox width="70px" height="24px" />
      </div>
      <SkeletonBox width="60%" height="14px" style={{ marginBottom: "0.5rem" }} />
      <SkeletonBox width="90%" height="32px" style={{ marginBottom: "1.5rem" }} />
      <SkeletonBox width="100%" height="60px" style={{ marginBottom: "1.5rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <div>
          <SkeletonBox width="100%" height="12px" style={{ marginBottom: "0.5rem" }} />
          <SkeletonBox width="80%" height="16px" />
        </div>
        <div>
          <SkeletonBox width="100%" height="12px" style={{ marginBottom: "0.5rem" }} />
          <SkeletonBox width="80%" height="16px" />
        </div>
        <div>
          <SkeletonBox width="100%" height="12px" style={{ marginBottom: "0.5rem" }} />
          <SkeletonBox width="80%" height="16px" />
        </div>
      </div>
    </div>
  );
}

// SVG Filters for Liquid Glass Effect
function LiquidGlassDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="lg-dist">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.005" numOctaves="3" seed="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" />
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>
    </svg>
  );
}

// Glassmorphism Card Component
function GlassCard({
  children,
  className = "",
  hover = false,
  isDarkMode = true,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  isDarkMode?: boolean;
  style?: React.CSSProperties;
}) {
  if (isDarkMode) {
    return (
      <div
        className={className}
        style={{
          background: "rgba(255, 255, 255, 0.05)", // match product-sales glass
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderRadius: "clamp(20px, 3.5vw, 28px)",
          padding: "clamp(1.5rem, 3vw, 2rem)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
          position: "relative",
          overflow: "hidden",
          ...style,
          ...(hover && { cursor: "pointer" }),
        }}
        onMouseEnter={(e) => {
          if (hover) {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 26px 55px rgba(0,0,0,0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)";
          }
        }}
        onMouseLeave={(e) => {
          if (hover) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)";
          }
        }}
      >
        {/* subtle top sheen for clarity */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
            pointerEvents: "none",
            zIndex: 0,
            borderRadius: "inherit",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
    );
  }

  // Light Mode Implementation
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)", // Crystal clear
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 1)", // Full white border
        borderRadius: "clamp(20px, 3.5vw, 28px)",
        padding: "clamp(1.5rem, 3vw, 2rem)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // Removed border-color to prevent theme switch animation
        willChange: "transform", // Optimize performance
        transform: "translateZ(0)", // Force hardware acceleration
        backfaceVisibility: "hidden", // Prevent flickering
        position: "relative",
        overflow: "hidden",
        ...(hover && {
          cursor: "pointer",
        }),
      }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 1)";
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
        }
      }}
    >
      {/* Light Mode Overlay for extra shine */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
          zIndex: 0,
          borderRadius: "inherit",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// Neon Sparkline Component
function NeonSparkline({ points, dates, color = "#3b82f6" }: { points: number[]; dates: string[]; color?: string }) {
  if (points.length === 0) return <div style={{ height: "60px" }} />;

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const normalized = points.map((p) => 50 - ((p - min) / range) * 40);
  const step = 100 / Math.max(points.length - 1, 1);
  const pathPoints = normalized.map((y, i) => `${i * step},${y}`).join(" ");

  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: "100%", height: "60px" }}>
      <defs>
        <linearGradient id={`neon-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="50%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id={`glow-${color}`}>
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polyline
        points={pathPoints}
        fill="none"
        stroke={`url(#neon-gradient-${color})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${color})`}
      />
      {normalized.map((y, i) => (
        <circle key={i} cx={i * step} cy={y} r="3" fill={color} opacity="0.9" filter={`url(#glow-${color})`}>
          <title>{`${dates[i]}: ${currency(points[i])}`}</title>
        </circle>
      ))}
    </svg>
  );
}

// Sticky Filter Bar Component
function StickyFilterBar({
  platformFilter,
  setPlatformFilter,
  dateBasis,
  setDateBasis,
  dateStart,
  setDateStart,
  dateEnd,
  setDateEnd,
  isHidden,
  isDarkMode,
  toggleDarkMode,
}: {
  platformFilter: "all" | "TikTok" | "Shopee" | "Lazada";
  setPlatformFilter: (filter: "all" | "TikTok" | "Shopee" | "Lazada") => void;
  dateBasis: "order" | "payment";
  setDateBasis: (basis: "order" | "payment") => void;
  dateStart: string;
  setDateStart: (date: string) => void;
  dateEnd: string;
  setDateEnd: (date: string) => void;
  isHidden: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const clearFilters = () => {
    setPlatformFilter("all");
    setDateStart("");
    setDateEnd("");
    setDateBasis("order");
  };

  const hasFilters = platformFilter !== "all" || dateStart || dateEnd || dateBasis !== "order";
  const NAV_OFFSET = "calc(64px + var(--safe-area-top))";
  const MOBILE_NAV_HEIGHT = NAV_OFFSET;

  useEffect(() => {
    if (isHidden && isExpanded) setIsExpanded(false);
  }, [isHidden, isExpanded]);

  const overlayVisible = isExpanded && !isHidden;
  const PANEL_WIDTH = "min(460px, 92vw)";
  const HIDE_OFFSET = 80; // extra offset to fully hide panel when collapsed

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handler = () => setIsExpanded((prev) => !prev);
    window.addEventListener("dashboard-filter-toggle", handler as EventListener);
    return () => window.removeEventListener("dashboard-filter-toggle", handler as EventListener);
  }, []);

  return (
    <>
      {/* Floating filter button (desktop) / nav icon (mobile) */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            top: `calc(${NAV_OFFSET} + 12px)`,
            right: "16px",
            zIndex: 1300,
          }}
        >
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.7rem 1rem",
              borderRadius: "14px",
              border: isDarkMode ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(59,130,246,0.2)",
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(15, 20, 32, 0.92) 0%, rgba(10, 14, 26, 0.92) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
              boxShadow: isDarkMode ? "0 10px 28px rgba(0,0,0,0.35)" : "0 8px 24px rgba(59,130,246,0.12)",
              color: "var(--text-primary)",
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
                {[platformFilter !== "all" ? 1 : 0, dateStart ? 1 : 0, dateEnd ? 1 : 0, dateBasis !== "order" ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
            ) : (
              <ChevronDownIcon className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
            )}
          </button>
        </div>
      )}

      {/* Backdrop (does not cover navbar) */}
      {overlayVisible && (
        <div
          onClick={() => setIsExpanded(false)}
          style={{
            position: "fixed",
            top: isMobile ? MOBILE_NAV_HEIGHT : NAV_OFFSET,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode ? "rgba(10, 14, 26, 0.6)" : "rgba(15, 23, 42, 0.25)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 1100,
          }}
        />
      )}

      {/* Slide-down / Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: isMobile ? MOBILE_NAV_HEIGHT : NAV_OFFSET,
          right: 0,
          left: isMobile ? 0 : "auto",
          width: isMobile ? "100%" : PANEL_WIDTH,
          height: isMobile ? "auto" : `calc(100% - ${NAV_OFFSET}px)`,
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
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(15, 20, 32, 0.98) 0%, rgba(10, 14, 26, 0.98) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)",
          backdropFilter: "blur(24px)",
          borderBottom: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDarkMode
            ? "0 20px 60px rgba(0, 0, 0, 0.55), 0 0 30px rgba(59,130,246,0.15)"
            : "0 20px 60px rgba(59,130,246,0.18), 0 0 30px rgba(14,165,233,0.16)",
          borderRadius: isMobile ? "0 0 20px 20px" : "24px 0 0 24px",
          overflowY: "auto",
          maxHeight: isMobile ? undefined : `calc(100vh - ${NAV_OFFSET}px - 12px)`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "0.9rem" }}>ตั้งค่าตัวกรอง</p>
              <h3 style={{ margin: 0, color: "var(--text-primary)", fontWeight: 700 }}>ตัวกรองข้อมูล</h3>
            </div>
            <button
              onClick={() => toggleDarkMode()}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                border: isDarkMode ? "1px solid rgba(251, 191, 36, 0.4)" : "1px solid rgba(99, 102, 241, 0.4)",
                background: isDarkMode ? "rgba(251, 191, 36, 0.12)" : "rgba(99, 102, 241, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: isDarkMode ? "0 0 12px rgba(251, 191, 36, 0.35)" : "0 0 12px rgba(99, 102, 241, 0.35)",
              }}
              title={isDarkMode ? "สลับเป็น Light Mode" : "สลับเป็น Dark Mode"}
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5" style={{ color: "#fbbf24" }} />
              ) : (
                <MoonIcon className="w-5 h-5" style={{ color: "#6366f1" }} />
              )}
            </button>
          </div>

          {/* Platform Filters */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem", display: "block" }}>แพลตฟอร์ม</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(["all", "TikTok", "Shopee", "Lazada"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlatformFilter(filter);
                  }}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "12px",
                    border: platformFilter === filter
                      ? "2px solid #3b82f6"
                      : (isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)"),
                    background: platformFilter === filter
                      ? "rgba(59, 130, 246, 0.15)"
                      : (isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)"),
                    color: platformFilter === filter ? "#3b82f6" : "var(--text-primary)",
                    fontSize: "0.875rem",
                    fontWeight: platformFilter === filter ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (platformFilter !== filter) {
                      e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(59, 130, 246, 0.08)";
                      e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(59, 130, 246, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (platformFilter !== filter) {
                      e.currentTarget.style.background = isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)";
                      e.currentTarget.style.borderColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.15)";
                    }
                  }}
                >
                  {filter === "all" ? (
                    "ทั้งหมด"
                  ) : (
                    (() => {
                      const logoMap: Record<"TikTok" | "Shopee" | "Lazada", string> = {
                        TikTok: "/tiktok.png",
                        Shopee: "/Shopee.png",
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

          {/* Date Basis */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarIcon className="w-4 h-4" />
              เลือกฐานวันที่
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {[
                { value: "order", label: "วันที่สั่งซื้อ" },
                { value: "payment", label: "วันที่ชำระเงิน" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateBasis(opt.value as "order" | "payment");
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "10px",
                    border: dateBasis === opt.value ? "1px solid #3b82f6" : (isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.15)"),
                    background: dateBasis === opt.value
                      ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.25) 100%)"
                      : (isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.85)"),
                    color: dateBasis === opt.value ? "#3b82f6" : "var(--text-primary)",
                    fontSize: "0.875rem",
                    fontWeight: dateBasis === opt.value ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarIcon className="w-4 h-4" />
              ช่วงวันที่
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", display: "block" }}>จาก</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => {
                    e.stopPropagation();
                    setDateStart(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.6)" : "1px solid rgba(0, 0, 0, 0.15)",
                    background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)",
                    color: "var(--text-primary)",
                    fontSize: "0.875rem",
                    width: "100%",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", display: "block" }}>ถึง</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => {
                    e.stopPropagation();
                    setDateEnd(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.6)" : "1px solid rgba(0, 0, 0, 0.15)",
                    background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.8)",
                    color: "var(--text-primary)",
                    fontSize: "0.875rem",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              disabled={!hasFilters}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                color: hasFilters ? "var(--text-primary)" : "var(--text-tertiary)",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: hasFilters ? "pointer" : "not-allowed",
                opacity: hasFilters ? 1 : 0.5,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (hasFilters) {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.color = "#ef4444";
                }
              }}
              onMouseLeave={(e) => {
                if (hasFilters) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
            >
              ล้างตัวกรอง
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(59, 130, 246, 0.4)";
              }}
            >
              ใช้งาน
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Neon StatCard
function NeonStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  onDetailClick,
  gradient = "from-blue-500 to-purple-600",
  isDarkMode = true,
  isMobile = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  onDetailClick?: () => void;
  gradient?: string;
  isDarkMode?: boolean;
  isMobile?: boolean;
}) {
  const gradientColors = {
    "from-blue-500 to-purple-600": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    "from-amber-500 to-orange-600": "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
    "from-emerald-500 to-teal-600": "linear-gradient(135deg, #10b981 0%, #0d9488 100%)",
    "from-pink-500 to-rose-600": "linear-gradient(135deg, #ec4899 0%, #e11d48 100%)",
  };

  return (
    <GlassCard hover isDarkMode={isDarkMode}>
      <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "center" : "stretch", gap: isMobile ? "1rem" : "0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? "0" : "1rem", flexShrink: 0 }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: gradientColors[gradient as keyof typeof gradientColors],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 8px 24px ${gradient.includes("blue") ? "rgba(59, 130, 246, 0.4)" : gradient.includes("amber") ? "rgba(245, 158, 11, 0.4)" : gradient.includes("emerald") ? "rgba(16, 185, 129, 0.4)" : "rgba(236, 72, 153, 0.4)"}`,
            }}
          >
            {icon}
          </div>
          {!isMobile && onDetailClick && (
            <button
              onClick={onDetailClick}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <EyeIcon className="w-5 h-5" style={{ color: "#3b82f6" }} />
            </button>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>{title}</p>
              <h3 style={{ fontSize: "1.875rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.25rem" }}>{value}</h3>
              {subtitle && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{subtitle}</p>}
              {trend && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.5rem" }}>
                  {trend === "up" && <TrendUpIcon className="w-4 h-4" style={{ color: "var(--success-500)" }} />}
                  {trend === "down" && <TrendDownIcon className="w-4 h-4" style={{ color: "var(--error-500)" }} />}
                  <span style={{ fontSize: "0.875rem", color: trend === "up" ? "var(--success-500)" : trend === "down" ? "var(--error-500)" : "var(--text-tertiary)" }}>
                    {trend === "up" ? "เพิ่มขึ้น" : trend === "down" ? "ลดลง" : "คงที่"}
                  </span>
                </div>
              )}
            </div>
            {isMobile && onDetailClick && (
              <button
                onClick={onDetailClick}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                }}
              >
                <EyeIcon className="w-5 h-5" style={{ color: "#3b82f6" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProgressBadge({ percent }: { percent: number }) {
  const color =
    percent >= 100 ? "#22c55e" : percent >= 80 ? "#f59e0b" : "#f97316";
  const bg =
    percent >= 100 ? "rgba(34,197,94,0.12)" : percent >= 80 ? "rgba(245,158,11,0.12)" : "rgba(249,115,22,0.12)";
  return (
    <span style={{ background: bg, color, padding: "0.28rem 0.48rem", borderRadius: "999px", fontWeight: 700, fontSize: "0.72rem" }}>
      {percent >= 100 ? "ถึงเป้า" : `${percent.toFixed(1)}%`}
    </span>
  );
}

function GoalSection({
  goalYear,
  goalYears,
  onYearChange,
  displayType,
  targetsByMonth,
  monthlyActuals,
  focusMonth,
  todayYear,
  isDarkMode,
  showMonthlyModal,
  onToggleMonthlyModal,
}: {
  goalYear: number;
  goalYears: number[];
  onYearChange: (year: number) => void;
  displayType: "profit" | "revenue";
  targetsByMonth: (number | null)[];
  monthlyActuals: { revenue: number; profit: number }[];
  focusMonth: number;
  todayYear: number;
  isDarkMode: boolean;
  showMonthlyModal: boolean;
  onToggleMonthlyModal: (show: boolean) => void;
}) {
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const typeLabel = displayType === "profit" ? "กำไรสุทธิ" : "รายได้";
  const currentMonth = Math.min(Math.max(focusMonth, 0), 11);
  const targetMonth = targetsByMonth[currentMonth] ?? 0;
  const actualMonth = displayType === "profit" ? monthlyActuals[currentMonth].profit : monthlyActuals[currentMonth].revenue;
  const percentMonth = targetMonth > 0 ? Math.min((actualMonth / targetMonth) * 100, 999) : 0;

  const endMonth = goalYear === todayYear ? new Date().getMonth() : 11;
  const safeEndMonth = Math.min(Math.max(endMonth, 0), 11);
  const targetYtd = targetsByMonth.slice(0, safeEndMonth + 1).reduce((s: number, v) => s + (v ?? 0), 0);
  const actualYtd = monthlyActuals
    .slice(0, safeEndMonth + 1)
    .reduce((s, v) => s + (displayType === "profit" ? v.profit : v.revenue), 0);
  const percentYtd = targetYtd && targetYtd > 0 ? Math.min((actualYtd / targetYtd) * 100, 999) : 0;

  const hasAnyTarget = targetsByMonth.some((v) => v !== null);

  return (
    <GlassCard hover>
      {/* Header Section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div>
          <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>ภาพรวมเป้าหมาย (รวมทุกแพลตฟอร์ม)</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "clamp(1.25rem, 3vw, 1.75rem)", fontWeight: 800, color: "var(--text-primary)" }}>
              เป้า {typeLabel} ปี {goalYear}
            </h3>
            <Badge variant="info">{typeLabel}</Badge>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>ปี</span>
          <select
            value={goalYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            style={{ padding: "0.625rem 1rem", borderRadius: "12px", border: "1px solid var(--border-primary)", background: "var(--surface-secondary)", color: "var(--text-primary)", fontSize: "0.9375rem", fontWeight: 600 }}
          >
            {goalYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasAnyTarget ? (
        <>
          {/* Hero Cards - Performance Optimized Side by Side */}
          <GoalsHeroPerformant
            monthName={`${TH_MONTHS[currentMonth]} ${goalYear}`}
            monthTarget={targetMonth}
            monthActual={actualMonth}
            monthPercent={percentMonth}
            monthLastYear={actualMonth * 0.85}
            ytdLabel={goalYear === todayYear ? `ถึง ${TH_MONTHS[safeEndMonth]}` : "ทั้งปี"}
            ytdTarget={targetYtd}
            ytdActual={actualYtd}
            ytdPercent={percentYtd}
            ytdLastYear={actualYtd * 0.80}
            trend={Array.from({ length: 7 }, (_, i) => actualMonth * (0.7 + i * 0.05))}
            typeLabel={typeLabel}
          />

          {/* View All Months Button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => onToggleMonthlyModal(true)}
              className="view-months-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 2rem",
                borderRadius: "16px",
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.7)",
                backdropFilter: isDarkMode ? "blur(40px) saturate(180%)" : "blur(30px) saturate(150%)",
                WebkitBackdropFilter: isDarkMode ? "blur(40px) saturate(180%)" : "blur(30px) saturate(150%)",
                border: isDarkMode
                  ? "1px solid rgba(255, 255, 255, 0.18)"
                  : "1px solid rgba(255, 255, 255, 0.9)",
                color: "var(--text-primary)",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isDarkMode
                  ? "0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)"
                  : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                backgroundImage: isDarkMode
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                if (isDarkMode) {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08)";
                } else {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 1)";
                  e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                if (isDarkMode) {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)";
                } else {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.9)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 -1px 0 rgba(0, 0, 0, 0.05)";
                }
              }}
            >
              <EyeIcon className="w-6 h-6" style={{ color: "#3b82f6" }} />
              <span>ดูรายละเอียดทั้ง 12 เดือน</span>
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: "1rem 0", color: "var(--text-tertiary)", textAlign: "center" }}>
          ยังไม่มีการตั้งเป้าหมายสำหรับปีนี้ (platform = all)
        </div>
      )}

      {/* Monthly Modal */}
      {showMonthlyModal && (
        <MonthlyModalApple
          targetsByMonth={targetsByMonth}
          monthlyActuals={monthlyActuals}
          displayType={displayType}
          typeLabel={typeLabel}
          currentMonth={currentMonth}
          isDarkMode={isDarkMode}
          isMobileView={isMobileView}
          onClose={() => onToggleMonthlyModal(false)}
        />
      )}
    </GlassCard>
  );
}

// Monthly Modal Component - Hybrid: Timeline Scroll (Mobile) + Bento Grid (Desktop)
// NOTE: This function is replaced by MonthlyModalGlassmorphism - will be removed later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MonthlyModal({
  targetsByMonth,
  monthlyActuals,
  displayType,
  typeLabel,
  currentMonth,
  isDarkMode,
  isMobileView,
  onClose,
}: {
  targetsByMonth: (number | null)[];
  monthlyActuals: { revenue: number; profit: number }[];
  displayType: "profit" | "revenue";
  typeLabel: string;
  currentMonth: number;
  isDarkMode: boolean;
  isMobileView: boolean;
  onClose: () => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const getMonthData = (monthIndex: number) => {
    const target = targetsByMonth[monthIndex] ?? 0;
    const actual = displayType === "profit" ? monthlyActuals[monthIndex].profit : monthlyActuals[monthIndex].revenue;
    const percent = target > 0 ? Math.min((actual / target) * 100, 999) : 0;
    const remaining = Math.max(0, target - actual);
    return { target, actual, percent, remaining };
  };

  // Auto-scroll to current month on mount (mobile only)
  useEffect(() => {
    if (isMobileView && scrollContainerRef.current) {
      const monthCards = scrollContainerRef.current.children;
      if (monthCards[currentMonth]) {
        setTimeout(() => {
          (monthCards[currentMonth] as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, [isMobileView, currentMonth]);

  // Detect scroll position for month indicator (mobile only)
  useEffect(() => {
    if (!isMobileView || !scrollContainerRef.current) return;

    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollTop = scrollContainerRef.current.scrollTop;
      const containerHeight = scrollContainerRef.current.clientHeight;
      const monthIndex = Math.round(scrollTop / containerHeight);

      if (monthIndex >= 0 && monthIndex < 12) {
        setSelectedMonth(monthIndex);
      }
    };

    const container = scrollContainerRef.current;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMobileView]);

  if (isMobileView) {
    // MOBILE: Timeline Scroll View (Instagram Stories style)
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            animation: "fadeIn 0.3s ease-out",
          }}
        />

        {/* Full Screen Timeline Container */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            background: "transparent",
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 10,
              background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", marginBottom: "0.25rem" }}>
                เป้าหมาย {typeLabel}
              </p>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "white" }}>
                {TH_MONTHS[selectedMonth]} {new Date().getFullYear() + 543}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Scroll Container with Snap */}
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              scrollSnapType: "y mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {Array.from({ length: 12 }).map((_, idx) => {
              const data = getMonthData(idx);
              return (
                <TimelineMonthCard
                  key={idx}
                  monthIndex={idx}
                  data={data}
                  typeLabel={typeLabel}
                  isDarkMode={isDarkMode}
                  isCurrent={idx === currentMonth}
                />
              );
            })}
          </div>

          {/* Month Indicator Dots (Right Side) */}
          <div
            style={{
              position: "absolute",
              right: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              zIndex: 10,
            }}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => {
                  const monthCards = scrollContainerRef.current?.children;
                  if (monthCards?.[idx]) {
                    (monthCards[idx] as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                style={{
                  width: idx === selectedMonth ? "8px" : "6px",
                  height: idx === selectedMonth ? "8px" : "6px",
                  borderRadius: "50%",
                  background: idx === selectedMonth ? "#3b82f6" : "rgba(255, 255, 255, 0.3)",
                  boxShadow: idx === selectedMonth ? "0 0 8px rgba(59, 130, 246, 0.8)" : "none",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </>
    );
  } else {
    // DESKTOP: Bento Grid Gallery (iOS Widgets style)
    return (
      <Modal
        isOpen
        onClose={onClose}
        title={`เป้าหมาย ${typeLabel} รายเดือน`}
        size="xl"
        isDarkMode={isDarkMode}
      >
        <BentoGridGallery
          targetsByMonth={targetsByMonth}
          monthlyActuals={monthlyActuals}
          displayType={displayType}
          typeLabel={typeLabel}
          currentMonth={currentMonth}
          isDarkMode={isDarkMode}
          getMonthData={getMonthData}
          expandedCard={expandedCard}
          setExpandedCard={setExpandedCard}
        />
      </Modal>
    );
  }
}

// Timeline Month Card Component (Mobile - Instagram Stories Style)
function TimelineMonthCard({
  monthIndex,
  data,
  typeLabel,
  isDarkMode,
  isCurrent,
}: {
  monthIndex: number;
  data: { target: number; actual: number; percent: number; remaining: number };
  typeLabel: string;
  isDarkMode: boolean;
  isCurrent: boolean;
}) {
  const statusConfig = data.percent >= 100
    ? { color: "#10b981", label: "บรรลุเป้าหมาย", icon: "check" }
    : data.percent >= 80
      ? { color: "#3b82f6", label: "ใกล้ถึงเป้า", icon: "trending-up" }
      : data.percent >= 50
        ? { color: "#f59e0b", label: "กำลังดำเนินการ", icon: "clock" }
        : { color: "#ef4444", label: "ต้องเร่งรัด", icon: "alert" };

  return (
    <div
      style={{
        minHeight: "100dvh",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        position: "relative",
      }}
    >
      {/* Background Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${statusConfig.color}15 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Card Content */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(255, 255, 255, 0.9)",
          borderRadius: "32px",
          padding: "2.5rem 2rem",
          boxShadow: isDarkMode
            ? "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            : "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Current Month Badge */}
        {isCurrent && (
          <div
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "999px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid #3b82f6",
              fontSize: "0.75rem",
              fontWeight: "700",
              color: "#3b82f6",
            }}
          >
            เดือนปัจจุบัน
          </div>
        )}

        {/* Month Name */}
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: "900",
            color: isDarkMode ? "white" : "#0f172a",
            marginBottom: "0.5rem",
            textAlign: "center",
          }}
        >
          {TH_MONTHS[monthIndex]} {new Date().getFullYear() + 543}
        </h3>

        {/* Status Badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              background: `${statusConfig.color}25`,
              border: `1.5px solid ${statusConfig.color}`,
            }}
          >
            {statusConfig.icon === "check" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {statusConfig.icon === "trending-up" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            )}
            {statusConfig.icon === "clock" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )}
            {statusConfig.icon === "alert" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span style={{ fontSize: "0.875rem", fontWeight: "700", color: statusConfig.color }}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Giant Percentage */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "6rem",
              fontWeight: "900",
              background: `linear-gradient(135deg, ${statusConfig.color} 0%, ${statusConfig.color}80 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1,
              marginBottom: "0.75rem",
              letterSpacing: "-0.04em",
            }}
          >
            {Math.round(data.percent)}%
          </div>
          <div style={{ fontSize: "1rem", color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", fontWeight: "600" }}>
            ความสำเร็จ {typeLabel}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Target */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.25rem",
              borderRadius: "20px",
              background: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
              border: isDarkMode ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(59, 130, 246, 0.25)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.8125rem", color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", marginBottom: "0.25rem", fontWeight: "600" }}>
                เป้าหมาย
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#3b82f6" }}>{currency(data.target)}</div>
            </div>
          </div>

          {/* Actual */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.25rem",
              borderRadius: "20px",
              background: isDarkMode ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
              border: isDarkMode ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.8125rem", color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", marginBottom: "0.25rem", fontWeight: "600" }}>
                ทำได้
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#10b981" }}>{currency(data.actual)}</div>
            </div>
          </div>

          {/* Remaining */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1.25rem",
              borderRadius: "20px",
              background: data.remaining > 0
                ? isDarkMode
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(245, 158, 11, 0.1)"
                : isDarkMode
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(16, 185, 129, 0.1)",
              border: data.remaining > 0
                ? isDarkMode
                  ? "1px solid rgba(245, 158, 11, 0.3)"
                  : "1px solid rgba(245, 158, 11, 0.25)"
                : isDarkMode
                  ? "1px solid rgba(16, 185, 129, 0.3)"
                  : "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={data.remaining > 0 ? "#f59e0b" : "#10b981"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {data.remaining > 0 ? <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> : <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />}
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.8125rem", color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", marginBottom: "0.25rem", fontWeight: "600" }}>
                {data.remaining > 0 ? "เหลืออีก" : "เกินเป้า"}
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: data.remaining > 0 ? "#f59e0b" : "#10b981" }}>{currency(Math.abs(data.remaining))}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: "10px",
            borderRadius: "999px",
            background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${Math.min(data.percent, 100)}%`,
              background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.color}80 100%)`,
              borderRadius: "999px",
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: `0 0 20px ${statusConfig.color}50`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Bento Grid Gallery Component (Desktop - iOS Widgets Style)
// NOTE: This function is replaced by MonthlyModalGlassmorphism - will be removed later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BentoGridGallery({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  targetsByMonth,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  monthlyActuals,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  displayType,
  typeLabel,
  currentMonth,
  isDarkMode,
  getMonthData,
  expandedCard,
  setExpandedCard,
}: {
  targetsByMonth: (number | null)[];
  monthlyActuals: { revenue: number; profit: number }[];
  displayType: "profit" | "revenue";
  typeLabel: string;
  currentMonth: number;
  isDarkMode: boolean;
  getMonthData: (idx: number) => { target: number; actual: number; percent: number; remaining: number };
  expandedCard: number | null;
  setExpandedCard: (idx: number | null) => void;
}) {
  return (
    <>
      {/* Bento Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1rem",
          gridAutoRows: "minmax(180px, auto)",
        }}
      >
        {Array.from({ length: 12 }).map((_, idx) => {
          const data = getMonthData(idx);
          const isCurrent = idx === currentMonth;

          // Adaptive sizing based on percentage
          const gridRowSpan = data.percent >= 100 ? 2 : data.percent >= 80 ? 1 : 1;

          return (
            <BentoCard
              key={idx}
              monthIndex={idx}
              data={data}
              typeLabel={typeLabel}
              isDarkMode={isDarkMode}
              isCurrent={isCurrent}
              gridRowSpan={gridRowSpan}
              onClick={() => setExpandedCard(idx)}
            />
          );
        })}
      </div>

      {/* Expanded Card Modal */}
      {expandedCard !== null && (
        <div
          onClick={() => setExpandedCard(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "600px",
              width: "100%",
              animation: "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* <TabBarMonthCard monthIndex={expandedCard} data={getMonthData(expandedCard)} typeLabel={typeLabel} isDarkMode={isDarkMode} /> */}
            <div>Expanded Card View (Old - Not Used)</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

// Bento Card Component
// NOTE: This function is replaced by MonthlyModalGlassmorphism - will be removed later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BentoCard({
  monthIndex,
  data,
  typeLabel,
  isDarkMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isCurrent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gridRowSpan,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClick,
}: {
  monthIndex: number;
  data: { target: number; actual: number; percent: number; remaining: number };
  typeLabel: string;
  isDarkMode: boolean;
  isCurrent: boolean;
  gridRowSpan: number;
  onClick: () => void;
}) {
  const statusConfig = data.percent >= 100
    ? { color: "#10b981", label: "บรรลุเป้าหมาย", icon: "check" }
    : data.percent >= 80
      ? { color: "#3b82f6", label: "ใกล้ถึงเป้า", icon: "trending-up" }
      : data.percent >= 50
        ? { color: "#f59e0b", label: "กำลังดำเนินการ", icon: "clock" }
        : { color: "#ef4444", label: "ต้องเร่งรัด", icon: "alert" };

  return (
    <div style={{
      background: isDarkMode
        ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
        : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.8)",
      borderRadius: "20px",
      padding: "2rem",
      boxShadow: isDarkMode
        ? "0 8px 32px rgba(0, 0, 0, 0.3)"
        : "0 8px 32px rgba(0, 0, 0, 0.1)",
    }}>
      {/* Header with Month Name and Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h3 style={{
          fontSize: "1.75rem",
          fontWeight: "800",
          color: "var(--text-primary)",
          margin: 0,
        }}>
          {TH_MONTHS[monthIndex]} {new Date().getFullYear() + 543}
        </h3>

        {/* Status Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "999px",
          background: `${statusConfig.color}20`,
          border: `1.5px solid ${statusConfig.color}`,
        }}>
          {statusConfig.icon === "check" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {statusConfig.icon === "trending-up" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          )}
          {statusConfig.icon === "clock" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          )}
          {statusConfig.icon === "alert" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          <span style={{
            fontSize: "0.9375rem",
            fontWeight: "700",
            color: statusConfig.color,
          }}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Giant Percentage Display */}
      <div style={{
        textAlign: "center",
        marginBottom: "2.5rem",
      }}>
        <div style={{
          fontSize: "5.5rem",
          fontWeight: "900",
          background: `linear-gradient(135deg, ${statusConfig.color} 0%, ${statusConfig.color}80 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
          marginBottom: "0.75rem",
          letterSpacing: "-0.02em",
        }}>
          {Math.round(data.percent)}%
        </div>
        <div style={{
          fontSize: "1rem",
          color: "var(--text-tertiary)",
          fontWeight: "600",
        }}>
          ความสำเร็จ {typeLabel}
        </div>
      </div>

      {/* Stats Grid - 3 Columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1.25rem",
        marginBottom: "2rem",
      }}>
        {/* Target */}
        <div style={{
          textAlign: "center",
          padding: "1.5rem",
          borderRadius: "16px",
          background: isDarkMode ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.1)",
          border: isDarkMode ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(59, 130, 246, 0.25)",
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: "600" }}>
            เป้าหมาย
          </div>
          <div style={{ fontSize: "1.375rem", fontWeight: "800", color: "#3b82f6" }}>
            {currency(data.target)}
          </div>
        </div>

        {/* Actual */}
        <div style={{
          textAlign: "center",
          padding: "1.5rem",
          borderRadius: "16px",
          background: isDarkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.1)",
          border: isDarkMode ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.25)",
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: "600" }}>
            ทำได้
          </div>
          <div style={{ fontSize: "1.375rem", fontWeight: "800", color: "#10b981" }}>
            {currency(data.actual)}
          </div>
        </div>

        {/* Remaining */}
        <div style={{
          textAlign: "center",
          padding: "1.5rem",
          borderRadius: "16px",
          background: data.remaining > 0
            ? (isDarkMode ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.1)")
            : (isDarkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.1)"),
          border: data.remaining > 0
            ? (isDarkMode ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(245, 158, 11, 0.25)")
            : (isDarkMode ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.25)"),
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={data.remaining > 0 ? "#f59e0b" : "#10b981"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
              {data.remaining > 0 ? (
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              ) : (
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/>
              )}
            </svg>
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", marginBottom: "0.5rem", fontWeight: "600" }}>
            {data.remaining > 0 ? "เหลืออีก" : "เกินเป้า"}
          </div>
          <div style={{ fontSize: "1.375rem", fontWeight: "800", color: data.remaining > 0 ? "#f59e0b" : "#10b981" }}>
            {currency(Math.abs(data.remaining))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: "12px",
        borderRadius: "999px",
        background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${Math.min(data.percent, 100)}%`,
          background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.color}80 100%)`,
          borderRadius: "999px",
          transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: `0 0 16px ${statusConfig.color}50`,
        }} />
      </div>
    </div>
  );
}

// Slide-Over Panel Month Card Component (Legacy - kept for reference)
// NOTE: This function is replaced by MonthlyModalGlassmorphism - will be removed later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SlideOverMonthCard({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  monthIndex,
  data,
  typeLabel,
  isDarkMode,
}: {
  monthIndex: number;
  data: { target: number; actual: number; percent: number; remaining: number };
  typeLabel: string;
  isDarkMode: boolean;
}) {
  const statusConfig = data.percent >= 100
    ? { color: "#10b981", label: "บรรลุเป้าหมาย", icon: "check" }
    : data.percent >= 80
      ? { color: "#3b82f6", label: "ใกล้ถึงเป้า", icon: "trending-up" }
      : data.percent >= 50
        ? { color: "#f59e0b", label: "กำลังดำเนินการ", icon: "clock" }
        : { color: "#ef4444", label: "ต้องเร่งรัด", icon: "alert" };

  return (
    <div style={{
      background: isDarkMode
        ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
        : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.8)",
      borderRadius: "16px",
      padding: "1.5rem",
      boxShadow: isDarkMode
        ? "0 8px 32px rgba(0, 0, 0, 0.3)"
        : "0 8px 32px rgba(0, 0, 0, 0.1)",
    }}>
      {/* Status Badge at Top */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "1.5rem",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "999px",
          background: `${statusConfig.color}20`,
          border: `1px solid ${statusConfig.color}`,
        }}>
          {statusConfig.icon === "check" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {statusConfig.icon === "trending-up" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          )}
          {statusConfig.icon === "clock" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          )}
          {statusConfig.icon === "alert" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusConfig.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          <span style={{
            fontSize: "0.875rem",
            fontWeight: "700",
            color: statusConfig.color,
          }}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Giant Percentage */}
      <div style={{
        textAlign: "center",
        marginBottom: "1.5rem",
      }}>
        <div style={{
          fontSize: "4rem",
          fontWeight: "900",
          background: `linear-gradient(135deg, ${statusConfig.color} 0%, ${statusConfig.color}80 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
          marginBottom: "0.5rem",
        }}>
          {Math.round(data.percent)}%
        </div>
        <div style={{
          fontSize: "0.875rem",
          color: "var(--text-tertiary)",
          fontWeight: "500",
        }}>
          ความสำเร็จ {typeLabel}
        </div>
      </div>

      {/* Stats Grid - Vertical Layout for Slide-Over */}
      <div style={{
        display: "grid",
        gap: "0.75rem",
        marginBottom: "1.25rem",
      }}>
        {/* Target */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          borderRadius: "12px",
          background: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
          border: isDarkMode ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(59, 130, 246, 0.2)",
        }}>
          <div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", fontWeight: "600" }}>
              เป้าหมาย
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: "800", color: "#3b82f6" }}>
              {currency(data.target)}
            </div>
          </div>
        </div>

        {/* Actual */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          borderRadius: "12px",
          background: isDarkMode ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
          border: isDarkMode ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.2)",
        }}>
          <div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", fontWeight: "600" }}>
              ทำได้
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: "800", color: "#10b981" }}>
              {currency(data.actual)}
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          borderRadius: "12px",
          background: data.remaining > 0
            ? (isDarkMode ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)")
            : (isDarkMode ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)"),
          border: data.remaining > 0
            ? (isDarkMode ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(245, 158, 11, 0.2)")
            : (isDarkMode ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.2)"),
        }}>
          <div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={data.remaining > 0 ? "#f59e0b" : "#10b981"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {data.remaining > 0 ? (
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              ) : (
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/>
              )}
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", fontWeight: "600" }}>
              {data.remaining > 0 ? "เหลืออีก" : "เกินเป้า"}
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: "800", color: data.remaining > 0 ? "#f59e0b" : "#10b981" }}>
              {currency(Math.abs(data.remaining))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: "8px",
        borderRadius: "999px",
        background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${Math.min(data.percent, 100)}%`,
          background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.color}80 100%)`,
          borderRadius: "999px",
          transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: `0 0 12px ${statusConfig.color}60`,
        }} />
      </div>
    </div>
  );
}


// Platform Card with Neon Effects
function PlatformCard({ platform, isDarkMode }: { platform: PlatformKPI; isDarkMode: boolean }) {
  const platformColors = {
    TikTok: { main: "#ef4444", gradient: "from-red-500 to-pink-600", shadow: "rgba(239, 68, 68, 0.4)" },
    Shopee: { main: "#f59e0b", gradient: "from-amber-500 to-orange-600", shadow: "rgba(245, 158, 11, 0.4)" },
    Lazada: { main: "#3b82f6", gradient: "from-blue-500 to-indigo-600", shadow: "rgba(59, 130, 246, 0.4)" },
  };

  const color = platformColors[platform.platform as keyof typeof platformColors] || platformColors.TikTok;

  return (
    <GlassCard hover isDarkMode={isDarkMode}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: color.main,
              boxShadow: `0 0 12px ${color.shadow}`,
            }}
          />
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>{platform.platform}</h3>
        </div>
        <Badge variant="info" size="sm">
          ล่าสุด 7 วัน
        </Badge>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>ยอดชำระเงิน</p>
        <p style={{ fontSize: "2rem", fontWeight: "800", color: color.main }}>{currency(platform.settlement)}</p>
      </div>

      <NeonSparkline points={platform.trend} dates={platform.trendDates ?? []} color={color.main} />

      <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>รายได้</p>
          <p style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#10b981" }}>{currency(platform.revenue)}</p>
        </div>
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>ค่าใช้จ่าย</p>
          <p style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#f59e0b" }}>{currency(platform.fees)}</p>
        </div>
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>ปรับยอด</p>
          <p style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#06b6d4" }}>{currency(platform.adjustments)}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// Month Comparison Types

// Month names in Thai (escaped to avoid encoding issues in source)
const thaiMonths = [
  "\u0e21\u0e01\u0e23\u0e32\u0e04\u0e21",
  "\u0e01\u0e38\u0e21\u0e20\u0e32\u0e1e\u0e31\u0e19\u0e18",
  "\u0e21\u0e35\u0e19\u0e32\u0e04\u0e21",
  "\u0e40\u0e21\u0e29\u0e32\u0e22\u0e19",
  "\u0e1e\u0e24\u0e29\u0e20\u0e32\u0e04\u0e21",
  "\u0e21\u0e34\u0e16\u0e38\u0e19\u0e32\u0e22\u0e19",
  "\u0e01\u0e23\u0e01\u0e0e\u0e32\u0e04\u0e21",
  "\u0e2a\u0e34\u0e07\u0e2b\u0e32\u0e04\u0e21",
  "\u0e01\u0e31\u0e19\u0e22\u0e32\u0e22\u0e19",
  "\u0e15\u0e38\u0e25\u0e32\u0e04\u0e21",
  "\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19",
  "\u0e18\u0e31\u0e19\u0e27\u0e32\u0e04\u0e21"
];

const formatMonthLabel = (monthKey: string) => {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  const name = thaiMonths[monthIdx] ?? monthKey;
  return Number.isFinite(year) ? `${name} ${year + 543}` : monthKey;
};

type MonthData = {
  month: string; // YYYY-MM
  monthName: string; // "มกราคม 2025"
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
};

type MonthComparison = {
  platform: string;
  months: MonthData[];
  comparisons: {
    month: string;
    monthName: string;
    current: number;
    previous: number | null;
    previousMonthName: string | null;
    changePercent: number | null;
    changeAmount: number | null;
  }[];
};

// Helper function to calculate month-over-month comparison
function calculateMonthComparison(platforms: PlatformKPI[]): MonthComparison[] {

  return platforms.map(platform => {
    // Group data by month
    const monthlyData: Record<string, MonthData> = {};

    (platform.perDay ?? []).forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = formatMonthLabel(monthKey);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          monthName,
          revenue: 0,
          fees: 0,
          adjustments: 0,
          settlement: 0,
        };
      }

      monthlyData[monthKey].revenue += day.revenue;
      monthlyData[monthKey].fees += day.fees;
      monthlyData[monthKey].adjustments += day.adjustments;
      monthlyData[monthKey].settlement += day.revenue + day.fees + day.adjustments;
    });

    // Sort months chronologically
    const sortedMonths = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // Calculate comparisons
    const comparisons = sortedMonths.map((month, index) => {
      const previous = index > 0 ? sortedMonths[index - 1] : null;
      const changeAmount = previous ? month.settlement - previous.settlement : null;
      const changePercent = previous && previous.settlement !== 0
        ? (changeAmount! / previous.settlement) * 100
        : null;

      return {
        month: month.month,
        monthName: month.monthName,
        current: month.settlement,
        previous: previous?.settlement || null,
        previousMonthName: previous?.monthName || null,
        changePercent,
        changeAmount,
      };
    });

    return {
      platform: platform.platform,
      months: sortedMonths,
      comparisons,
    };
  });
}

// Instagram Stories Style Mobile Component - removed (unused)
// Legacy Mobile Component (kept for reference, not used)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MonthComparisonMobileLegacy({ comparisonData, isDarkMode }: { comparisonData: MonthComparison[]; isDarkMode: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const platformColors: Record<string, { main: string; gradient: string; bg: string }> = {
    TikTok: { main: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #ec4899 100%)", bg: "rgba(239, 68, 68, 0.1)" },
    Shopee: { main: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)", bg: "rgba(245, 158, 11, 0.1)" },
    Lazada: { main: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)", bg: "rgba(59, 130, 246, 0.1)" },
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left
      setCurrentIndex(prev => Math.min(prev + 1, comparisonData.length - 1));
    }
    if (touchStart - touchEnd < -75) {
      // Swipe right
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const currentPlatform = comparisonData[currentIndex];
  const color = platformColors[currentPlatform.platform] || platformColors.TikTok;

  return (
    <GlassCard className="mobile-comparison-card" isDarkMode={isDarkMode}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <RefreshIcon className="w-5 h-5" style={{ color: color.main }} />
          <span style={{ fontSize: "1rem", fontWeight: "600" }}>เปรียบเทียบรายเดือน</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: currentIndex === 0 ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentIndex === 0 ? 0.3 : 1,
            }}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", minWidth: "60px", textAlign: "center" }}>
            {currentIndex + 1}/{comparisonData.length}
          </span>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(prev + 1, comparisonData.length - 1))}
            disabled={currentIndex === comparisonData.length - 1}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: currentIndex === comparisonData.length - 1 ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: currentIndex === comparisonData.length - 1 ? "not-allowed" : "pointer",
              opacity: currentIndex === comparisonData.length - 1 ? 0.3 : 1,
            }}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Platform Badge */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "12px",
          background: color.bg,
          border: `1px solid ${color.main}40`,
        }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color.main,
            boxShadow: `0 0 12px ${color.main}80`,
          }} />
          <span style={{ fontSize: "1.125rem", fontWeight: "700", color: color.main }}>
            {currentPlatform.platform}
          </span>
        </div>
      </div>

      {/* Swipeable Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        {currentPlatform.comparisons.map((comp, idx) => (
          <div
            key={comp.month}
            style={{
              marginBottom: "1.25rem",
              padding: "1.25rem",
              borderRadius: "16px",
              background: idx === 0 ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--text-primary)" }}>
                {comp.monthName}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: "800", color: color.main }}>
                {currency(comp.current)}
              </span>
            </div>

            {comp.changePercent !== null && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {comp.changePercent >= 0 ? (
                    <TrendUpIcon className="w-5 h-5" style={{ color: "var(--success-500)" }} />
                  ) : (
                    <TrendDownIcon className="w-5 h-5" style={{ color: "var(--error-500)" }} />
                  )}
                  <span style={{
                    fontSize: "1.125rem",
                    fontWeight: "700",
                    color: comp.changePercent >= 0 ? "var(--success-500)" : "var(--error-500)",
                  }}>
                    {comp.changePercent >= 0 ? "+" : ""}{comp.changePercent?.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>
                    จาก {comp.previousMonthName}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    {comp.changeAmount! >= 0 ? "+" : ""}{currency(comp.changeAmount!)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{
                  marginTop: "0.75rem",
                  height: "8px",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.05)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(Math.abs(comp.changePercent), 100)}%`,
                    background: comp.changePercent >= 0 ? "var(--success-500)" : "var(--error-500)",
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </>
            )}

            {comp.changePercent === null && (
              <div style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                (เดือนฐาน)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
        {comparisonData.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: idx === currentIndex ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: idx === currentIndex ? color.main : "rgba(255, 255, 255, 0.2)",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </GlassCard>
  );
}

// Month Comparison Chart Component
function MonthComparisonChart({
  comparisonData,
  allMonths,
  platformColors,
  isDarkMode,
  goals,
}: {
  comparisonData: MonthComparison[];
  allMonths: string[];
  platformColors: Record<string, string>;
  isDarkMode: boolean;
  goals?: GoalRecord[];
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{ platform: string; month: string; value: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);

  // Calculate target values for each month
  const targetData = useMemo(() => {
    if (!goals || goals.length === 0) {
      return null;
    }

    const targets: Record<string, number> = {};

    allMonths.forEach(monthKey => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);

      // Get all goals for this month (both revenue and profit types)
      const monthGoals = goals.filter(g => g.year === year && g.month === month);

      if (monthGoals.length > 0) {
        // If there's an "all" platform goal, use that (prefer profit, fallback to revenue)
        const allProfitGoal = monthGoals.find(g => g.platform === "all" && g.type === "profit");
        const allRevenueGoal = monthGoals.find(g => g.platform === "all" && g.type === "revenue");

        if (allProfitGoal) {
          targets[monthKey] = allProfitGoal.target;
        } else if (allRevenueGoal) {
          targets[monthKey] = allRevenueGoal.target;
        } else {
          // Otherwise sum individual platform goals (prefer profit, fallback to revenue)
          const platformGoals = monthGoals.filter(g => g.type === "profit");
          if (platformGoals.length > 0) {
            targets[monthKey] = platformGoals.reduce((sum, g) => sum + g.target, 0);
          } else {
            const revenueGoals = monthGoals.filter(g => g.type === "revenue");
            targets[monthKey] = revenueGoals.reduce((sum, g) => sum + g.target, 0);
          }
        }
      }
    });

    return Object.keys(targets).length > 0 ? targets : null;
  }, [goals, allMonths]);

  // Prepare data for chart
  const chartData = useMemo(() => {
    const data: Record<string, { month: string; monthName: string; values: Record<string, number> }> = {};

    allMonths.forEach(month => {
      const monthName = formatMonthLabel(month);
      data[month] = {
        month,
        monthName,
        values: {},
      };

      comparisonData.forEach(platform => {
        const comp = platform.comparisons.find(c => c.month === month);
        data[month].values[platform.platform] = comp?.current || 0;
      });
    });

    return Object.values(data);
  }, [allMonths, comparisonData]);

  // Calculate scales
  const maxValue = useMemo(() => {
    let max = 0;
    chartData.forEach(d => {
      Object.values(d.values).forEach(v => {
        if (v > max) max = v;
      });
    });
    // Include target values in scale calculation
    if (targetData) {
      Object.values(targetData).forEach(v => {
        if (v > max) max = v;
      });
    }
    return max;
  }, [chartData, targetData]);

  const padding = { top: 40, right: 40, bottom: 60, left: 80 };
  const chartWidth = 1000;
  const chartHeight = 500;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate path for each platform
  const generatePath = (platformName: string) => {
    const platform = comparisonData.find(p => p.platform === platformName);

    const points = chartData.map((d, i) => {
      const x = padding.left + (i / (chartData.length - 1)) * innerWidth;
      const value = d.values[platformName] || 0;
      const y = padding.top + innerHeight - (value / maxValue) * innerHeight;

      // Get change percentage
      const comp = platform?.comparisons.find(c => c.month === d.month);
      const changePercent = comp?.changePercent ?? null;

      return { x, y, value, month: d.month, monthName: d.monthName, changePercent };
    });

    const path = points.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;

      // Smooth curve using cubic bezier
      const prevPoint = points[i - 1];
      const cpX1 = prevPoint.x + (p.x - prevPoint.x) / 3;
      const cpX2 = p.x - (p.x - prevPoint.x) / 3;
      return `C ${cpX1} ${prevPoint.y}, ${cpX2} ${p.y}, ${p.x} ${p.y}`;
    }).join(" ");

    // Generate area path (same as line but closing to bottom)
    const areaPath = points.map((p, i) => {
      if (i === 0) return `M ${p.x} ${chartHeight - padding.bottom} L ${p.x} ${p.y}`;

      const prevPoint = points[i - 1];
      const cpX1 = prevPoint.x + (p.x - prevPoint.x) / 3;
      const cpX2 = p.x - (p.x - prevPoint.x) / 3;
      return `C ${cpX1} ${prevPoint.y}, ${cpX2} ${p.y}, ${p.x} ${p.y}`;
    }).join(" ") + ` L ${points[points.length - 1].x} ${chartHeight - padding.bottom} Z`;

    return { path, areaPath, points };
  };

  // Generate path for target line
  const generateTargetPath = () => {
    if (!targetData) return null;

    const points = chartData.map((d, i) => {
      const x = padding.left + (i / (chartData.length - 1)) * innerWidth;
      const value = targetData[d.month] || 0;
      const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
      return { x, y, value, month: d.month, monthName: d.monthName };
    });

    const path = points.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;

      // Smooth curve using cubic bezier
      const prevPoint = points[i - 1];
      const cpX1 = prevPoint.x + (p.x - prevPoint.x) / 3;
      const cpX2 = p.x - (p.x - prevPoint.x) / 3;
      return `C ${cpX1} ${prevPoint.y}, ${cpX2} ${p.y}, ${p.x} ${p.y}`;
    }).join(" ");

    return { path, points };
  };

  // Format axis labels
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const value = (maxValue / tickCount) * i;
      const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
      ticks.push({ value, y });
    }
    return ticks;
  }, [maxValue, innerHeight, padding.top]);

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto", padding: "1rem 0" }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{
          width: "100%",
          minWidth: "800px",
          height: "auto",
          filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.15))",
        }}
      >
        {/* Grid lines */}
        <defs>
          {/* Gradient fills for area under lines */}
          {Object.entries(platformColors).map(([platform, color]) => (
            <linearGradient key={`area-gradient-${platform}`} id={`area-gradient-${platform}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="50%" stopColor={color} stopOpacity="0.1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          ))}

          {/* Glow filters for lines */}
          {Object.entries(platformColors).map(([platform]) => (
            <filter key={`glow-${platform}`} id={`glow-${platform}`}>
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}

          {/* Strong shadow filter */}
          <filter id="strong-shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Y-axis grid lines */}
        {yAxisTicks.map((tick, i) => (
          <line
            key={`grid-y-${i}`}
            x1={padding.left}
            y1={tick.y}
            x2={chartWidth - padding.right}
            y2={tick.y}
            stroke={isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* X-axis grid lines */}
        {chartData.map((d, i) => {
          const x = padding.left + (i / (chartData.length - 1)) * innerWidth;
          return (
            <line
              key={`grid-x-${i}`}
              x1={x}
              y1={padding.top}
              x2={x}
              y2={chartHeight - padding.bottom}
              stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
          strokeWidth="2"
        />

        {/* Y-axis labels */}
        {yAxisTicks.map((tick, i) => (
          <text
            key={`y-label-${i}`}
            x={padding.left - 12}
            y={tick.y}
            textAnchor="end"
            alignmentBaseline="middle"
            style={{
              fontSize: "12px",
              fill: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
              fontWeight: 600,
            }}
          >
            {formatYAxis(tick.value)}
          </text>
        ))}

        {/* X-axis labels */}
        {chartData.map((d, i) => {
          const x = padding.left + (i / (chartData.length - 1)) * innerWidth;
          return (
            <text
              key={`x-label-${i}`}
              x={x}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              style={{
                fontSize: "11px",
                fill: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                fontWeight: 600,
              }}
            >
              {d.monthName.split(" ")[0]}
            </text>
          );
        })}

        {/* Platform lines */}
        {comparisonData.map((platform, platformIndex) => {
          const { path, areaPath, points } = generatePath(platform.platform);
          const color = platformColors[platform.platform];

          const staggerDelay = platformIndex * 0.3; // 0s, 0.3s, 0.6s

          return (
            <g key={platform.platform}>
              {/* Area fill under line */}
              <path
                d={areaPath}
                fill={`url(#area-gradient-${platform.platform})`}
                style={{
                  opacity: 0.6,
                  animation: `fadeIn 2s cubic-bezier(0.25, 0.1, 0.25, 1) ${staggerDelay}s backwards`,
                }}
              />

              {/* Line shadow */}
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.15"
                style={{
                  filter: `drop-shadow(0 4px 8px ${color}80)`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  animation: `drawLine 3s cubic-bezier(0.25, 0.1, 0.25, 1) ${staggerDelay}s both`,
                }}
              />
              {/* Main line */}
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: `url(#glow-${platform.platform})`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  animation: `drawLine 3s cubic-bezier(0.25, 0.1, 0.25, 1) ${staggerDelay}s both`,
                }}
              />
              {/* Data points */}
              {points.map((point, i) => (
                <g key={`${platform.platform}-${i}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4.5"
                    fill={color}
                    stroke={isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)"}
                    strokeWidth="2"
                    style={{
                      cursor: "pointer",
                      filter: `drop-shadow(0 2px 4px ${color}70)`,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      animation: `luxuryPointPop 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) ${staggerDelay + 0.8 + i * 0.08}s backwards`,
                    }}
                    onMouseEnter={(e) => {
                      setHoveredPoint({
                        platform: platform.platform,
                        month: point.month,
                        value: point.value,
                      });
                      setHoveredPosition({ x: point.x, y: point.y });
                      e.currentTarget.setAttribute("r", "7");
                    }}
                    onMouseLeave={(e) => {
                      setHoveredPoint(null);
                      setHoveredPosition(null);
                      e.currentTarget.setAttribute("r", "4.5");
                    }}
                  />
                </g>
              ))}
            </g>
          );
        })}

        {/* Target line (if goals exist) - Render AFTER platform lines so it's on top */}
        {(() => {
          const targetPathData = generateTargetPath();
          if (!targetPathData) return null;

          const { path, points } = targetPathData;
          const targetStaggerDelay = comparisonData.length * 0.3; // After all platform lines

          return (
            <g key="target-line" style={{ pointerEvents: "all" }}>
              {/* Target line - dashed gray line */}
              <path
                d={path}
                fill="none"
                stroke={isDarkMode ? "rgba(156, 163, 175, 0.8)" : "rgba(107, 114, 128, 0.8)"}
                strokeWidth="2"
                strokeDasharray="6 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                  animation: `drawLine 3s cubic-bezier(0.25, 0.1, 0.25, 1) ${targetStaggerDelay}s both`,
                }}
              />
              {/* Target points */}
              {points.map((point, i) => (
                <g key={`target-${i}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    fill={isDarkMode ? "rgba(156, 163, 175, 0.9)" : "rgba(107, 114, 128, 0.9)"}
                    stroke={isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)"}
                    strokeWidth="1.5"
                    style={{
                      cursor: "pointer",
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      animation: `luxuryPointPop 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) ${targetStaggerDelay + 0.8 + i * 0.08}s backwards`,
                      pointerEvents: "all",
                    }}
                    onMouseEnter={(e) => {
                      setHoveredPoint({
                        platform: "เป้าหมาย",
                        month: point.month,
                        value: point.value,
                      });
                      setHoveredPosition({ x: point.x, y: point.y });
                      e.currentTarget.setAttribute("r", "5.5");
                    }}
                    onMouseLeave={(e) => {
                      setHoveredPoint(null);
                      setHoveredPosition(null);
                      e.currentTarget.setAttribute("r", "3.5");
                    }}
                  />
                </g>
              ))}
            </g>
          );
        })()}

        {/* Enhanced Tooltip with Smart Positioning */}
        {hoveredPoint && hoveredPosition && (() => {
          // Find the point data to get changePercent
          const isTargetLine = hoveredPoint.platform === "เป้าหมาย";
          const platform = comparisonData.find(p => p.platform === hoveredPoint.platform);
          const comp = platform?.comparisons.find(c => c.month === hoveredPoint.month);
          const changePercent = comp?.changePercent ?? null;
          const monthName = formatMonthLabel(hoveredPoint.month);
          const tooltipColor = isTargetLine
            ? (isDarkMode ? "rgba(156, 163, 175, 0.9)" : "rgba(107, 114, 128, 0.9)")
            : platformColors[hoveredPoint.platform];

          // Smart positioning to prevent overflow
          const tooltipWidth = 200;
          const tooltipHeight = changePercent !== null ? 85 : 70;
          const offsetMargin = 10; // margin from edge

          // Calculate X position (prevent left/right overflow)
          let tooltipX = hoveredPosition.x - tooltipWidth / 2;
          if (tooltipX < padding.left + offsetMargin) {
            // Too close to left edge
            tooltipX = padding.left + offsetMargin;
          } else if (tooltipX + tooltipWidth > chartWidth - padding.right - offsetMargin) {
            // Too close to right edge
            tooltipX = chartWidth - padding.right - tooltipWidth - offsetMargin;
          }

          // Calculate Y position (prevent top/bottom overflow)
          let tooltipY = hoveredPosition.y - tooltipHeight - 10; // 10px gap above point
          if (tooltipY < padding.top + offsetMargin) {
            // Too close to top, show below instead
            tooltipY = hoveredPosition.y + 15; // 15px gap below point
          }

          // Text X position (always centered in tooltip)
          const textX = tooltipX + tooltipWidth / 2;

          return (
            <g style={{ animation: "tooltipFadeIn 0.2s ease-out", pointerEvents: "none" }}>
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="12"
                fill={isDarkMode ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)"}
                stroke={tooltipColor}
                strokeWidth="2.5"
                style={{
                  filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3))",
                  pointerEvents: "none",
                }}
              />
              {/* Platform name */}
              <text
                x={textX}
                y={tooltipY + 25}
                textAnchor="middle"
                style={{
                  fontSize: "13px",
                  fill: tooltipColor,
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                }}
              >
                {hoveredPoint.platform}
              </text>
              {/* Month name */}
              <text
                x={textX}
                y={tooltipY + 43}
                textAnchor="middle"
                style={{
                  fontSize: "10px",
                  fill: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  fontWeight: 600,
                }}
              >
                {monthName}
              </text>
              {/* Value */}
              <text
                x={textX}
                y={tooltipY + 63}
                textAnchor="middle"
                style={{
                  fontSize: "16px",
                  fill: isDarkMode ? "white" : "#0f172a",
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                }}
              >
                {currency(hoveredPoint.value)}
              </text>
              {/* Change percent */}
              {changePercent !== null && (
                <g>
                  <rect
                    x={textX - 40}
                    y={tooltipY + 67}
                    width="80"
                    height="20"
                    rx="10"
                    fill={changePercent >= 0 ? "#10b981" : "#ef4444"}
                    opacity="0.95"
                  />
                  <text
                    x={textX}
                    y={tooltipY + 79}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    style={{
                      fontSize: "11px",
                      fill: "white",
                      fontWeight: 800,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {changePercent >= 0 ? "▲ +" : "▼ "}{changePercent?.toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
          );
        })()}
      </svg>

      {/* Enhanced Legend */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "1.5rem",
        marginTop: "2rem",
        flexWrap: "wrap",
        padding: "1rem",
        borderRadius: "16px",
        background: isDarkMode
          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
          : "linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 100%)",
        backdropFilter: "blur(10px)",
        border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
      }}>
        {comparisonData.map((platform, idx) => (
          <div
            key={platform.platform}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "12px",
              background: isDarkMode
                ? `linear-gradient(135deg, ${platformColors[platform.platform]}15 0%, ${platformColors[platform.platform]}08 100%)`
                : `linear-gradient(135deg, ${platformColors[platform.platform]}10 0%, ${platformColors[platform.platform]}05 100%)`,
              border: `2px solid ${platformColors[platform.platform]}40`,
              boxShadow: `0 4px 12px ${platformColors[platform.platform]}20`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              animation: `legendFadeIn 0.5s ease-out ${idx * 0.1}s backwards`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${platformColors[platform.platform]}40`;
              e.currentTarget.style.borderColor = platformColors[platform.platform];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${platformColors[platform.platform]}20`;
              e.currentTarget.style.borderColor = `${platformColors[platform.platform]}40`;
            }}
          >
            <div
              style={{
                width: "32px",
                height: "4px",
                borderRadius: "2px",
                background: platformColors[platform.platform],
                boxShadow: `0 0 12px ${platformColors[platform.platform]}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Image
                src={
                  platform.platform === "Shopee" ? "/Shopee.png" :
                  platform.platform === "TikTok" ? "/tiktok.png" :
                  "/Lazada.png"
                }
                alt={platform.platform}
                width={18}
                height={18}
                className="object-contain"
                unoptimized
              />
              <span style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: platformColors[platform.platform],
                letterSpacing: "0.02em",
              }}>
                {platform.platform}
              </span>
            </div>
          </div>
        ))}

        {/* Target legend item (if goals exist) */}
        {targetData && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "12px",
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(156, 163, 175, 0.15) 0%, rgba(156, 163, 175, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(107, 114, 128, 0.10) 0%, rgba(107, 114, 128, 0.05) 100%)",
              border: `2px solid ${isDarkMode ? "rgba(156, 163, 175, 0.4)" : "rgba(107, 114, 128, 0.4)"}`,
              boxShadow: `0 4px 12px ${isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(107, 114, 128, 0.2)"}`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              animation: `legendFadeIn 0.5s ease-out ${comparisonData.length * 0.1}s backwards`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${isDarkMode ? "rgba(156, 163, 175, 0.4)" : "rgba(107, 114, 128, 0.4)"}`;
              e.currentTarget.style.borderColor = isDarkMode ? "rgba(156, 163, 175, 0.8)" : "rgba(107, 114, 128, 0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(107, 114, 128, 0.2)"}`;
              e.currentTarget.style.borderColor = isDarkMode ? "rgba(156, 163, 175, 0.4)" : "rgba(107, 114, 128, 0.4)";
            }}
          >
            <svg width="32" height="4" viewBox="0 0 32 4" style={{ flexShrink: 0 }}>
              <line
                x1="0"
                y1="2"
                x2="32"
                y2="2"
                stroke={isDarkMode ? "rgba(156, 163, 175, 0.9)" : "rgba(107, 114, 128, 0.9)"}
                strokeWidth="3"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isDarkMode ? "rgba(156, 163, 175, 0.9)" : "rgba(107, 114, 128, 0.9)"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: isDarkMode ? "rgba(156, 163, 175, 0.9)" : "rgba(107, 114, 128, 0.9)",
                letterSpacing: "0.02em",
              }}>
                เป้าหมาย
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.6;
          }
        }

        @keyframes pointPop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes luxuryPointPop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          60% {
            transform: scale(1.15);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes textFadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes legendFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes drawLine {
          from {
            stroke-dasharray: 2000;
            stroke-dashoffset: 2000;
          }
          to {
            stroke-dasharray: 2000;
            stroke-dashoffset: 0;
          }
        }

        @keyframes drawTargetLine {
          0% {
            stroke-dasharray: 2000;
            stroke-dashoffset: 2000;
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            stroke-dasharray: 2000;
            stroke-dashoffset: 0;
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

// Mobile Chart - Horizontal Bar Chart (พอดีหน้าจอ ไม่ต้อง scroll)
function MonthComparisonMobileChart({
  comparisonData,
  allMonths,
  platformColors,
  isDarkMode,
}: {
  comparisonData: MonthComparison[];
  allMonths: string[];
  platformColors: Record<string, string>;
  isDarkMode: boolean;
}) {
  // Find max value for scaling
  const maxValue = useMemo(() => {
    let max = 0;
    comparisonData.forEach(platform => {
      platform.comparisons.forEach(comp => {
        if (comp.current > max) max = comp.current;
      });
    });
    return max;
  }, [comparisonData]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {allMonths.map(monthKey => {
        const monthName = formatMonthLabel(monthKey);
        return (
          <div
            key={monthKey}
            style={{
              background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.6)",
              border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "16px",
              padding: "1rem",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Month Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <CalendarIcon style={{ width: "clamp(14px, 3vw, 16px)", height: "clamp(14px, 3vw, 16px)", color: "#3b82f6" }} />
              <h3 style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.875rem)", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                {monthName}
              </h3>
            </div>

            {/* Bars for each platform */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {comparisonData.map(platform => {
                const comp = platform.comparisons.find(c => c.month === monthKey);
                if (!comp) return null;

                const percentage = maxValue > 0 ? (comp.current / maxValue) * 100 : 0;

                return (
                  <div key={platform.platform} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {/* Platform name & value */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: platformColors[platform.platform],
                            boxShadow: `0 0 8px ${platformColors[platform.platform]}60`,
                          }}
                        />
                        <span style={{ fontSize: "clamp(0.7rem, 2vw, 0.75rem)", fontWeight: "600", color: "var(--text-secondary)" }}>
                          {platform.platform}
                        </span>
                      </div>
                      <span style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.875rem)", fontWeight: "700", color: platformColors[platform.platform] }}>
                        {currency(comp.current)}
                      </span>
                    </div>

                    {/* Horizontal bar */}
                    <div
                      style={{
                        height: "24px",
                        borderRadius: "8px",
                        background: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(percentage, 2)}%`,
                          background: `linear-gradient(90deg, ${platformColors[platform.platform]}E6 0%, ${platformColors[platform.platform]} 100%)`,
                          borderRadius: "8px",
                          transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingRight: "0.5rem",
                        }}
                      >
                        {comp.changePercent !== null && percentage > 15 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            {comp.changePercent >= 0 ? (
                              <TrendUpIcon style={{ width: "clamp(10px, 2vw, 12px)", height: "clamp(10px, 2vw, 12px)", color: "white" }} />
                            ) : (
                              <TrendDownIcon style={{ width: "clamp(10px, 2vw, 12px)", height: "clamp(10px, 2vw, 12px)", color: "white" }} />
                            )}
                            <span style={{ fontSize: "clamp(0.55rem, 1.5vw, 0.625rem)", fontWeight: "700", color: "white" }}>
                              {comp.changePercent >= 0 ? "+" : ""}{comp.changePercent.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mobile Table - Card-Based Layout
function MonthComparisonMobileTable({
  comparisonData,
  allMonths,
  platformColors,
  isDarkMode,
}: {
  comparisonData: MonthComparison[];
  allMonths: string[];
  platformColors: Record<string, string>;
  isDarkMode: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {allMonths.map(monthKey => {
        const monthName = formatMonthLabel(monthKey);
        return (
          <div
            key={monthKey}
            style={{
              background: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.6)",
              border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "16px",
              padding: "1rem",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Month Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              paddingBottom: "0.75rem",
              borderBottom: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CalendarIcon style={{ width: "clamp(14px, 3vw, 16px)", height: "clamp(14px, 3vw, 16px)", color: "#3b82f6" }} />
                <h3 style={{ fontSize: "clamp(0.8rem, 2.5vw, 0.875rem)", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                  {monthName}
                </h3>
              </div>
            </div>

            {/* Platform cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {comparisonData.map(platform => {
                const comp = platform.comparisons.find(c => c.month === monthKey);
                if (!comp) return null;

                return (
                  <div
                    key={platform.platform}
                    style={{
                      background: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.5)",
                      borderRadius: "12px",
                      padding: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {/* Left: Platform info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "clamp(28px, 7vw, 32px)",
                          height: "clamp(28px, 7vw, 32px)",
                          borderRadius: "10px",
                          background: `${platformColors[platform.platform]}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "clamp(8px, 2vw, 10px)",
                            height: "clamp(8px, 2vw, 10px)",
                            borderRadius: "50%",
                            background: platformColors[platform.platform],
                            boxShadow: `0 0 10px ${platformColors[platform.platform]}80`,
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: "clamp(0.7rem, 2vw, 0.75rem)", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.125rem" }}>
                          {platform.platform}
                        </div>
                        <div style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)", fontWeight: "700", color: platformColors[platform.platform] }}>
                          {currency(comp.current)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Change percentage */}
                    {comp.changePercent !== null && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "clamp(0.25rem, 1vw, 0.375rem)",
                          padding: "clamp(0.3rem, 1.5vw, 0.375rem) clamp(0.5rem, 2vw, 0.625rem)",
                          borderRadius: "8px",
                          background: comp.changePercent >= 0
                            ? isDarkMode ? "rgba(34, 197, 94, 0.15)" : "rgba(34, 197, 94, 0.1)"
                            : isDarkMode ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
                        }}
                      >
                        {comp.changePercent >= 0 ? (
                          <TrendUpIcon style={{ width: "clamp(12px, 3vw, 14px)", height: "clamp(12px, 3vw, 14px)", color: "#22c55e" }} />
                        ) : (
                          <TrendDownIcon style={{ width: "clamp(12px, 3vw, 14px)", height: "clamp(12px, 3vw, 14px)", color: "#ef4444" }} />
                        )}
                        <span
                          style={{
                            fontSize: "clamp(0.7rem, 2vw, 0.75rem)",
                            fontWeight: "700",
                            color: comp.changePercent >= 0 ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {comp.changePercent >= 0 ? "+" : ""}{comp.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Month Comparison Component - Desktop Table View
function MonthComparisonDesktop({ comparisonData, isDarkMode, goals }: { comparisonData: MonthComparison[]; isDarkMode: boolean; goals?: GoalRecord[] }) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Mobile if width < 768px
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Default to table on mobile, chart on desktop
  const [viewMode, setViewMode] = useState<"table" | "chart">("chart");

  // Update viewMode when device type changes
  useEffect(() => {
    setViewMode(isMobile ? "table" : "chart");
  }, [isMobile]);

  const platformColors: Record<string, string> = {
    TikTok: "#ef4444",
    Shopee: "#f59e0b",
    Lazada: "#3b82f6",
  };

  // Get all unique months across all platforms
  const allMonths = Array.from(
    new Set(comparisonData.flatMap(p => p.comparisons.map(c => c.month)))
  ).sort();

  // If mobile, use mobile-optimized components
  if (isMobile) {
    return (
      <GlassCard isDarkMode={isDarkMode}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <RefreshIcon style={{ width: "clamp(18px, 4vw, 20px)", height: "clamp(18px, 4vw, 20px)", color: "#3b82f6" }} />
            <h2 style={{ fontSize: "clamp(0.9rem, 3vw, 1rem)", fontWeight: "700", margin: 0 }}>เปรียบเทียบรายเดือน</h2>
          </div>

          {/* View Toggle Buttons - Mobile */}
          <div style={{ display: "flex", gap: "0.5rem", background: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)", padding: "0.25rem", borderRadius: "12px" }}>
            <button
              onClick={() => setViewMode("table")}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "10px",
                border: "none",
                background: viewMode === "table" ? (isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)") : "transparent",
                color: viewMode === "table" ? "#3b82f6" : "var(--text-secondary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              ตาราง
            </button>
            <button
              onClick={() => setViewMode("chart")}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "10px",
                border: "none",
                background: viewMode === "chart" ? (isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)") : "transparent",
                color: viewMode === "chart" ? "#3b82f6" : "var(--text-secondary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              กราฟ
            </button>
          </div>
        </div>

        {viewMode === "table" ? (
          <MonthComparisonMobileTable
            comparisonData={comparisonData}
            allMonths={allMonths}
            platformColors={platformColors}
            isDarkMode={isDarkMode}
          />
        ) : (
          <MonthComparisonMobileChart
            comparisonData={comparisonData}
            allMonths={allMonths}
            platformColors={platformColors}
            isDarkMode={isDarkMode}
          />
        )}
      </GlassCard>
    );
  }

  // Desktop version
  return (
    <GlassCard isDarkMode={isDarkMode}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <RefreshIcon style={{ width: "clamp(20px, 4vw, 24px)", height: "clamp(20px, 4vw, 24px)", color: "#3b82f6" }} />
          <h2 style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)", fontWeight: "700", margin: 0 }}>เปรียบเทียบรายเดือน</h2>
        </div>

        {/* View Toggle Buttons - Responsive */}
        <div style={{ display: "flex", gap: "0.5rem", background: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)", padding: "0.25rem", borderRadius: "12px" }}>
          <button
            onClick={() => setViewMode("table")}
            style={{
              padding: "clamp(0.4rem, 2vw, 0.5rem) clamp(0.75rem, 3vw, 1rem)",
              borderRadius: "10px",
              border: "none",
              background: viewMode === "table" ? (isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)") : "transparent",
              color: viewMode === "table" ? "#3b82f6" : "var(--text-secondary)",
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: "14px" }}>
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span style={{ display: "inline" }}>ตาราง</span>
          </button>
          <button
            onClick={() => setViewMode("chart")}
            style={{
              padding: "clamp(0.4rem, 2vw, 0.5rem) clamp(0.75rem, 3vw, 1rem)",
              borderRadius: "10px",
              border: "none",
              background: viewMode === "chart" ? (isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)") : "transparent",
              color: viewMode === "chart" ? "#3b82f6" : "var(--text-secondary)",
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: "14px" }}>
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span style={{ display: "inline" }}>กราฟ</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(255, 255, 255, 0.1)" }}>
                <th style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "var(--text-tertiary)",
                  position: "sticky",
                  left: 0,
                  background: "var(--bg-secondary)",
                  zIndex: 2,
                }}>
                  เดือน
                </th>
                {comparisonData.map(platform => (
                  <th
                    key={platform.platform}
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      minWidth: "180px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: platformColors[platform.platform],
                        boxShadow: `0 0 8px ${platformColors[platform.platform]}80`,
                      }} />
                      <span style={{ color: platformColors[platform.platform] }}>{platform.platform}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allMonths.map((month, idx) => {
                const monthName = formatMonthLabel(month);

                return (
                  <tr
                    key={month}
                    style={{
                      borderBottom: idx < allMonths.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{
                      padding: "1rem",
                      fontSize: "0.9375rem",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      position: "sticky",
                      left: 0,
                      background: "inherit",
                      zIndex: 1,
                    }}>
                      {monthName}
                    </td>
                    {comparisonData.map(platform => {
                      const comp = platform.comparisons.find(c => c.month === month);
                      if (!comp) return <td key={platform.platform} style={{ padding: "1rem" }}>-</td>;

                      return (
                        <td key={platform.platform} style={{ padding: "1rem", textAlign: "right" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                            <span style={{ fontSize: "1.125rem", fontWeight: "700", color: platformColors[platform.platform] }}>
                              {currency(comp.current)}
                            </span>
                            {comp.changePercent !== null ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {comp.changePercent >= 0 ? (
                                  <TrendUpIcon className="w-4 h-4" style={{ color: "var(--success-500)" }} />
                                ) : (
                                  <TrendDownIcon className="w-4 h-4" style={{ color: "var(--error-500)" }} />
                                )}
                                <span style={{
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                  color: comp.changePercent >= 0 ? "var(--success-500)" : "var(--error-500)",
                                }}>
                                  {comp.changePercent >= 0 ? "+" : ""}{comp.changePercent?.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                                (ฐาน)
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <MonthComparisonChart
          comparisonData={comparisonData}
          allMonths={allMonths}
          platformColors={platformColors}
          isDarkMode={isDarkMode}
          goals={goals}
        />
      )}
    </GlassCard>
  );
}

// Main Component
export default function DashboardClient({ platforms, goals }: Props) {
  const [platformFilter, setPlatformFilter] = useState<"all" | "TikTok" | "Shopee" | "Lazada">("all");
  const [dateBasis, setDateBasis] = useState<"order" | "payment">("order");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [showFeeModal, setShowFeeModal] = useState<boolean>(false);
  const [showRevenueModal, setShowRevenueModal] = useState<boolean>(false);
  const [showNetModal, setShowNetModal] = useState<boolean>(false);
  const [showMonthlyGoalModal, setShowMonthlyGoalModal] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to Light Mode
  const [isLoading, setIsLoading] = useState(true);
  const [netDisplay, setNetDisplay] = useState(0);
  const netTargetRef = useRef<number | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [topProvinces, setTopProvinces] = useState<TopProvinceItem[]>([]);
  const [topPlatform, setTopPlatform] = useState<(TopPlatformItem)[]>([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const topProductsCardRef = useRef<HTMLDivElement | null>(null);
  const [mapHeight, setMapHeight] = useState<number>(480);
  const [goalYear, setGoalYear] = useState<number>(() => {
    if (goals && goals.length > 0) {
      return Math.max(...goals.map((g) => g.year));
    }
    return new Date().getFullYear();
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync map height with Top 5 block so visuals align
  useEffect(() => {
    const el = topProductsCardRef.current;
    if (!el) return;

    const updateHeight = () => {
      const h = el.offsetHeight;
      if (isMobile) {
        // Keep map compact on small screens so the goals section sits closer
        const compactHeight = h > 0 ? Math.max(320, Math.min(h, 420)) : 360;
        setMapHeight(compactHeight);
        return;
      }
      setMapHeight(h > 0 ? h : 480);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [isMobile, topProducts.length]);



  // Sync theme with body and navbar toggle
  useEffect(() => {
    const current = document.body.classList.contains("dark-mode") ? "dark" : "light";
    setIsDarkMode(current === "dark");

    const handler = (e: Event) => {
      const mode = (e as CustomEvent<ThemeMode>).detail;
      setIsDarkMode(mode === "dark");
    };
    window.addEventListener("theme-changed", handler as EventListener);
    return () => window.removeEventListener("theme-changed", handler as EventListener);
  }, []);

  useEffect(() => {
    setTheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const next = toggleTheme();
    setIsDarkMode(next === "dark");
  };

  // Simulate initial loading (remove after first render)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Show skeleton for 800ms
    return () => clearTimeout(timer);
  }, []);

  // Load top products / provinces with filters
  useEffect(() => {
    const fetchTop = async () => {
      setTopLoading(true);
      setTopError(null);
      try {
        const params = new URLSearchParams();
        if (platformFilter !== "all") params.set("platform", platformFilter);
        if (dateStart) params.set("start", dateStart);
        if (dateEnd) params.set("end", dateEnd);

        const res = await fetch(`/api/dashboard/top?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "ไม่สามารถดึงข้อมูลได้");
        setTopProducts(json.topProducts || []);
        setTopProvinces(json.topProvinces || []);
        setTopPlatform((json.platforms || []).filter(Boolean));
      } catch (err) {
        setTopError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setTopLoading(false);
      }
    };
    fetchTop();
  }, [platformFilter, dateStart, dateEnd]);

  // Control filter bar visibility when modals are open
  const isModalOpen = showFeeModal || showRevenueModal || showNetModal || showMonthlyGoalModal;

  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  useEffect(() => {
    if (goals && goals.length > 0) {
      const latestYear = Math.max(...goals.map((g) => g.year));
      setGoalYear((prev) => (goals.some((g) => g.year === prev) ? prev : latestYear));
    }
  }, [goals]);

  const goalYears = useMemo(() => {
    const set = new Set<number>();
    (goals ?? []).forEach((g) => set.add(g.year));
    if (set.size === 0) set.add(goalYear);
    return Array.from(set).sort((a, b) => a - b);
  }, [goals, goalYear]);

  const goalsForYear = useMemo(() => (goals ?? []).filter((g) => g.year === goalYear && g.platform === "all"), [goals, goalYear]);
  const displayType: "profit" | "revenue" = goalsForYear.some((g) => g.type === "profit") ? "profit" : "revenue";

  const targetsByMonth = useMemo(() => {
    const arr = Array(12).fill(null) as (number | null)[];
    goalsForYear.forEach((g) => {
      if (g.type !== displayType) return;
      if (g.month >= 1 && g.month <= 12) {
        arr[g.month - 1] = g.target;
      }
    });
    return arr;
  }, [goalsForYear, displayType]);

  const monthlyActuals = useMemo(() => {
    const base = Array.from({ length: 12 }, () => ({ revenue: 0, profit: 0 }));
    const relevant = platforms.filter((p) => platformFilter === "all" || p.platform === platformFilter);
    relevant.forEach((p) => {
      const baseDays =
        (dateBasis === "payment"
          ? p.perDayPaid && p.perDayPaid.length > 0
            ? p.perDayPaid
            : p.perDay
          : p.perDay) || [];
      baseDays.forEach((d) => {
        const dt = new Date(d.date);
        if (Number.isNaN(dt.getTime())) return;
        if (dt.getFullYear() !== goalYear) return;
        const month = dt.getMonth();
        base[month].revenue += Number(d.revenue ?? 0);
        base[month].profit += Number(d.revenue ?? 0) + Number(d.fees ?? 0) + Number(d.adjustments ?? 0);
      });
    });
    return base;
  }, [platforms, platformFilter, dateBasis, goalYear]);

  const focusMonth = useMemo(() => {
    if (dateStart) {
      const dt = new Date(dateStart);
      if (!Number.isNaN(dt.getTime()) && dt.getFullYear() === goalYear) {
        return dt.getMonth();
      }
    }
    return goalYear === todayYear ? todayMonth : 0;
  }, [dateStart, goalYear, todayMonth, todayYear]);

  const filteredPlatforms = useMemo(() => {
    const inRange = (date: string) => {
      if (!date) return true;
      if (dateStart && date < dateStart) return false;
      if (dateEnd && date > dateEnd) return false;
      return true;
    };

    return platforms
      .filter((p) => platformFilter === "all" || p.platform === platformFilter)
      .map((p) => {
        const baseDays = (dateBasis === "payment"
          ? (p.perDayPaid && p.perDayPaid.length > 0 ? p.perDayPaid : p.perDay)
          : p.perDay) || [];
        const filteredDays = dateStart || dateEnd ? baseDays.filter((d) => inRange(d.date)) : baseDays;

        const agg = filteredDays.reduce(
          (acc, d) => {
            acc.revenue += d.revenue;
            acc.fees += d.fees;
            acc.adjustments += d.adjustments;
            return acc;
          },
          { revenue: 0, fees: 0, adjustments: 0 }
        );

        const trendWindow = filteredDays.slice(-7);

        return {
          ...p,
          perDay: filteredDays,
          revenue: agg.revenue,
          fees: agg.fees,
          adjustments: agg.adjustments,
          settlement: agg.revenue + agg.fees + agg.adjustments,
          trend: trendWindow.map((d) => d.revenue + d.fees + d.adjustments),
          trendDates: trendWindow.map((d) => d.date),
        };
      });
  }, [platformFilter, dateStart, dateEnd, dateBasis, platforms]);

  const totals = filteredPlatforms.reduce(
    (acc, p) => {
      acc.revenue += p.revenue;
      acc.fees += p.fees;
      acc.adjustments += p.adjustments;
      acc.settlement += p.settlement;
      return acc;
    },
    { revenue: 0, fees: 0, adjustments: 0, settlement: 0 }
  );

  const topProvinceData = useMemo(
    () =>
      topProvinces.map((p) => ({
        name: p.name,
        totalRevenue: p.revenue,
        totalQty: p.qty,
        productCount: 0
      })),
    [topProvinces]
  );

  const topPlatformRows = useMemo(
    () => (topPlatform || []).filter((p): p is Exclude<TopPlatformItem, null> => Boolean(p)),
    [topPlatform]
  );
  const maxPlatformRevenue = useMemo(
    () => Math.max(...topPlatformRows.map((p) => p.revenue), 1),
    [topPlatformRows]
  );

  useEffect(() => {
    const target = totals.settlement || 0;
    const from = netTargetRef.current === null ? 0 : netDisplay;
    netTargetRef.current = target;
    const duration = 1200;
    const start = performance.now();
    let frame: number;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setNetDisplay(from + (target - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.settlement]);

  const feeRate = Math.abs(totals.fees) / Math.max(totals.revenue, 1);

  const monthComparison = useMemo(() => calculateMonthComparison(filteredPlatforms), [filteredPlatforms]);

  return (
    <main style={{ minHeight: "100vh" }}>
      <GlassBackdrop isDark={isDarkMode} />
      <LiquidGlassDefs />

      {/* Sticky Filter Bar */}
      <StickyFilterBar
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
        dateBasis={dateBasis}
        setDateBasis={setDateBasis}
        dateStart={dateStart}
        setDateStart={setDateStart}
        dateEnd={dateEnd}
        setDateEnd={setDateEnd}
        isHidden={isModalOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div
        className="container"
        style={{
          position: "relative",
          paddingTop: "clamp(64px, 4vw, 70px)",
          paddingBottom: "clamp(2rem, 5vw, 4rem)",
          paddingLeft: "clamp(0.5rem, 1.5vw, 1rem)",
          paddingRight: "clamp(0.5rem, 1.5vw, 1rem)",
          width: "100%",
          maxWidth: "min(1600px, 96vw)",
          margin: "0 auto",
        }}
      >
        {/* Hero Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(0.75rem, 2vw, 1.25rem)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "clamp(0.5rem, 2vw, 1rem)", marginBottom: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            <div
              style={{
                width: "clamp(40px, 10vw, 56px)",
                height: "clamp(40px, 10vw, 56px)",
                borderRadius: "clamp(12px, 3vw, 16px)",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 32px rgba(59, 130, 246, 0.4)",
                flexShrink: 0,
              }}
            >
              <ChartIcon className="w-8 h-8" style={{ color: "white", width: "clamp(1.25rem, 5vw, 2rem)", height: "clamp(1.25rem, 5vw, 2rem)" }} />
            </div>
            <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: "800", background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>Dashboard OL</h1>
        </div>

        {/* Live Clock */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(0.75rem, 2vw, 1rem)" }}>
          <LiveClock isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Net Profit Highlight */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "clamp(1.5rem, 4vw, 2.5rem)" }}>
        <div
          aria-label="กำไรสุทธิ"
          className="net-hero modern"
          style={{
            position: "relative",
            width: "min(92vw, 820px)",
            padding: "clamp(0.25rem, 1vw, 0.5rem)",
            textAlign: "center",
            background: "transparent",
            border: "none",
            boxShadow: "none",
            overflow: "visible",
          }}
        >
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "center", padding: "0 clamp(0.5rem, 2vw, 1rem)" }}>
            <div
              style={{
                fontSize: "clamp(2rem, 8vw, 5.4rem)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                position: "relative",
                display: "inline-block",
                transform: "translateZ(0)",
                lineHeight: "1.1",
                wordBreak: "break-word",
                maxWidth: "100%",
              }}
              className="net-figure"
              data-text={currency(netDisplay)}
            >
              {currency(netDisplay)}
            </div>
          </div>
        </div>
      </div>

        {/* KPI Cards */}
        <div
          className="kpi-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
            marginBottom: isMobile ? "1.25rem" : "2rem",
          }}
        >
          {isLoading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <NeonStatCard title="รายได้รวม" value={currency(totals.revenue)} subtitle={`${filteredPlatforms.length} แพลตฟอร์ม`} icon={<DollarIcon className="w-7 h-7" style={{ color: "white" }} />} gradient="from-emerald-500 to-teal-600" onDetailClick={() => setShowRevenueModal(true)} isDarkMode={isDarkMode} isMobile={isMobile} />
              <NeonStatCard title="ค่าธรรมเนียม" value={currency(totals.fees)} subtitle={`${(feeRate * 100).toFixed(2)}% ของรายได้`} icon={<ChartIcon className="w-7 h-7" style={{ color: "white" }} />} gradient="from-amber-500 to-orange-600" onDetailClick={() => setShowFeeModal(true)} isDarkMode={isDarkMode} isMobile={isMobile} />
              <NeonStatCard title="การปรับยอด" value={currency(totals.adjustments)} subtitle="ปรับปรุงรายได้" icon={<InfoIcon className="w-7 h-7" style={{ color: "white" }} />} gradient="from-blue-500 to-purple-600" isDarkMode={isDarkMode} isMobile={isMobile} />
            </>
          )}
        </div>
        <style suppressHydrationWarning>{`
          @media (max-width: 900px) {
            .kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 640px) {
            .kpi-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 1200px) {
            .goal-mini-card {
              padding: 0.64rem;
            }
          }

          .net-hero {
            position: relative;
          }
          .net-hero.modern {
            isolation: isolate;
            border-radius: 0;
            background: transparent;
            border: none;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }
          .net-figure {
            position: relative;
            z-index: 1;
            font-family: "Poppins", "Inter", "Lato", sans-serif;
            text-transform: uppercase;
            line-height: 1;
            letter-spacing: 0.04em;
            color: #0f172a;
            text-shadow:
              0 1px 0 rgba(0,0,0,0.35),
              0 3px 8px rgba(0,0,0,0.28);
            filter: drop-shadow(0 14px 24px rgba(0,0,0,0.24));
            animation: net-fade-in 0.8s ease both;
          }
          .dark-mode .net-figure {
            color: #e2e8f0;
            text-shadow:
              0 1px 0 #0f172a,
              0 3px 8px rgba(0,0,0,0.45);
            filter: drop-shadow(0 14px 24px rgba(0,0,0,0.28));
          }
          .net-figure--shadow::before {
            content: none !important;
          }
          @keyframes net-fade-in {
            0% { opacity: 0; transform: translateY(12px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Top Insights */}
        <div style={{ marginBottom: isMobile ? "0.2rem" : "1.5rem" }}>
          <h2 style={{ fontSize: "clamp(1.125rem, 3vw, 1.5rem)", fontWeight: "700", marginBottom: isMobile ? "0.75rem" : "clamp(1rem, 2vw, 1.5rem)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "4px", height: "clamp(20px, 4vw, 24px)", borderRadius: "2px", background: "linear-gradient(180deg, #3b82f6 0%, #0ea5e9 100%)" }} />
            <span style={{ color: "var(--text-primary)" }}>Top Insights</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: isMobile ? "0.5rem" : "1.25rem" }}>
            <div ref={topProductsCardRef} style={{ height: "100%" }}>
            <GlassCard hover isDarkMode={isDarkMode}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMobile ? "0.6rem" : "0.75rem", marginBottom: isMobile ? "0.75rem" : "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.6rem" : "0.75rem" }}>
                  <div style={{ width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 14, background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 28px rgba(14,165,233,0.3)" }}>
                    <ChartIcon className="w-5 h-5" style={{ color: "white" }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: isMobile ? "0.8rem" : "0.85rem", color: "var(--text-tertiary)" }}>Top 5 สินค้าขายดี</p>
                    <h3 style={{ margin: 0, fontSize: isMobile ? "0.98rem" : "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>ทุกแพลตฟอร์ม</h3>
                  </div>
                </div>
                <a
                  href="/product-sales"
                  style={{
                    padding: isMobile ? "0.55rem 0.8rem" : "0.65rem 0.9rem",
                    borderRadius: "12px",
                    border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(59,130,246,0.2)",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
                    boxShadow: isDarkMode ? "0 12px 32px rgba(0,0,0,0.28)" : "0 10px 24px rgba(59,130,246,0.15)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <EyeIcon className="w-4 h-4" />
                  <span style={{ fontWeight: 600 }}>ดูทั้งหมด</span>
                </a>
              </div>
              {topLoading ? (
                <div style={{ display: "grid", gap: isMobile ? "0.55rem" : "0.75rem" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonBox key={i} height={isMobile ? "24px" : "32px"} />
                  ))}
                </div>
              ) : topError ? (
                <div style={{ color: "var(--text-tertiary)", fontSize: "0.95rem" }}>{topError}</div>
              ) : topProducts.length === 0 ? (
                <div style={{ color: "var(--text-tertiary)", fontSize: "0.95rem" }}>ยังไม่มีข้อมูลยอดขายสินค้า</div>
              ) : (
                <div style={{ display: "grid", gap: isMobile ? "0.65rem" : "0.85rem" }}>
                  {(() => {
                    const maxRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);
                    return topProducts.map((item, idx) => {
                      const width = Math.max(8, Math.min(100, (item.revenue / maxRevenue) * 100));
                      const badgeColor =
                        item.platforms.includes("TikTok") && item.platforms.length === 1
                          ? "#ef4444"
                          : item.platforms.includes("Shopee") && item.platforms.length === 1
                            ? "#f97316"
                            : item.platforms.includes("Lazada") && item.platforms.length === 1
                              ? "#3b82f6"
                              : "#10b981";
                      return (
                        <div
                          key={`${item.name}-${idx}`}
                          style={{
                            display: "flex",
                            flexDirection: isMobile ? "column" : "row",
                            gap: isMobile ? "0.75rem" : "0.85rem",
                            alignItems: isMobile ? "stretch" : "center",
                            padding: isMobile ? "0.85rem" : "0.95rem",
                            borderRadius: isMobile ? "18px" : "20px",
                            background: isDarkMode
                              ? "rgba(255, 255, 255, 0.03)"
                              : "rgba(255, 255, 255, 0.9)",
                            border: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.08)"
                              : "1px solid rgba(59, 130, 246, 0.1)",
                            boxShadow: isDarkMode
                              ? "0 8px 20px rgba(0, 0, 0, 0.2)"
                              : "0 8px 24px rgba(59, 130, 246, 0.08)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = isDarkMode
                              ? "0 12px 28px rgba(0, 0, 0, 0.3)"
                              : "0 12px 32px rgba(59, 130, 246, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = isDarkMode
                              ? "0 8px 20px rgba(0, 0, 0, 0.2)"
                              : "0 8px 24px rgba(59, 130, 246, 0.08)";
                          }}
                        >
                          {/* Subtle gradient overlay */}
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: "100%",
                              background: isDarkMode
                                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%)"
                                : "linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(99, 102, 241, 0.01) 100%)",
                              pointerEvents: "none",
                              zIndex: 0
                            }}
                          />

                          {/* Header Section: Rank + Image + Title (Mobile: Horizontal, Desktop: Same) */}
                          <div style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: isMobile ? "0.75rem" : "0.85rem",
                            width: isMobile ? "100%" : "auto",
                            flexShrink: 0
                          }}>
                            {/* Rank Badge */}
                            <div style={{
                              width: isMobile ? 40 : 42,
                              height: isMobile ? 40 : 42,
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
                              color: "white",
                              fontWeight: 700,
                              fontSize: isMobile ? "1.05rem" : "1.15rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 8px 20px rgba(14, 165, 233, 0.4)",
                              flexShrink: 0
                            }}>
                              {idx + 1}
                            </div>

                            {/* Product Image */}
                            <div style={{
                              width: isMobile ? 72 : 68,
                              height: isMobile ? 72 : 68,
                              borderRadius: "14px",
                              overflow: "hidden",
                              background: isDarkMode
                                ? "rgba(255, 255, 255, 0.04)"
                                : "rgba(59, 130, 246, 0.05)",
                              border: isDarkMode
                                ? "2px solid rgba(255, 255, 255, 0.08)"
                                : "2px solid rgba(59, 130, 246, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: isDarkMode
                                ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                                : "0 4px 12px rgba(59, 130, 246, 0.1)"
                            }}>
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.variant}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    padding: isMobile ? "6px" : "5px"
                                  }}
                                />
                              ) : (
                                <svg
                                  style={{
                                    width: isMobile ? "32px" : "36px",
                                    height: isMobile ? "32px" : "36px",
                                    color: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(59, 130, 246, 0.3)"
                                  }}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                            </div>

                            {/* Product Name + Badge (Mobile Only - shown here) */}
                            {isMobile && (
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontWeight: 700,
                                  color: "var(--text-primary)",
                                  fontSize: "0.95rem",
                                  lineHeight: 1.3,
                                  marginBottom: "0.35rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical"
                                }}>
                                  {item.variant}
                                </div>
                                <span style={{
                                  display: "inline-block",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "999px",
                                  background: badgeColor + "1a",
                                  border: `1px solid ${badgeColor}33`,
                                  color: badgeColor,
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                  boxShadow: `0 2px 8px ${badgeColor}20`
                                }}>
                                  {item.platforms.length === 1 ? item.platforms[0] : "Multi"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Info - Desktop Only (mobile shows in header) */}
                          <div style={{ position: "relative", zIndex: 1, minWidth: 0, flex: 1 }}>
                            {!isMobile && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                marginBottom: "0.5rem",
                                flexWrap: "wrap"
                              }}>
                                <span style={{
                                  fontWeight: 700,
                                  color: "var(--text-primary)",
                                  fontSize: "1.05rem",
                                  lineHeight: 1.3,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical"
                                }}>
                                  {item.variant}
                                </span>
                                <span style={{
                                  padding: "0.25rem 0.65rem",
                                  borderRadius: "999px",
                                  background: badgeColor + "1a",
                                  border: `1px solid ${badgeColor}33`,
                                  color: badgeColor,
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                  boxShadow: `0 2px 8px ${badgeColor}20`
                                }}>
                                  {item.platforms.length === 1 ? item.platforms[0] : "Multi"}
                                </span>
                              </div>
                            )}

                            {/* Progress Bar */}
                            <div style={{
                              position: "relative",
                              width: "100%",
                              height: isMobile ? 12 : 14,
                              borderRadius: 999,
                              background: isDarkMode
                                ? "rgba(255, 255, 255, 0.06)"
                                : "rgba(15, 23, 42, 0.08)",
                              overflow: "hidden",
                              marginBottom: isMobile ? "0.5rem" : "0.5rem",
                              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)"
                            }}>
                              <div style={{
                                width: `${width}%`,
                                height: "100%",
                                borderRadius: 999,
                                background: "linear-gradient(90deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)",
                                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.5)",
                                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                              }} />
                            </div>

                            {/* Stats */}
                            <div style={{
                              display: "flex",
                              flexDirection: isMobile ? "column" : "row",
                              justifyContent: "space-between",
                              alignItems: isMobile ? "stretch" : "center",
                              color: "var(--text-tertiary)",
                              gap: isMobile ? "0.4rem" : "0.6rem"
                            }}>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                fontSize: isMobile ? "0.8rem" : "0.88rem",
                                flexWrap: "wrap"
                              }}>
                                <span style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: isMobile ? "0.3rem 0.6rem" : "0.25rem 0.5rem",
                                  borderRadius: "8px",
                                  background: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                                  border: isDarkMode ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid rgba(59, 130, 246, 0.15)"
                                }}>
                                  <span style={{ fontWeight: 700, color: isDarkMode ? "#60a5fa" : "#2563eb" }}>
                                    {item.qty.toLocaleString()}
                                  </span>
                                  <span style={{ opacity: 0.7, fontSize: "0.85em" }}>ชิ้น</span>
                                </span>
                                {item.returned > 0 && (
                                  <span style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    padding: isMobile ? "0.3rem 0.6rem" : "0.25rem 0.5rem",
                                    borderRadius: "8px",
                                    background: isDarkMode ? "rgba(251, 146, 60, 0.1)" : "rgba(249, 115, 22, 0.08)",
                                    border: isDarkMode ? "1px solid rgba(251, 146, 60, 0.2)" : "1px solid rgba(249, 115, 22, 0.15)"
                                  }}>
                                    <span style={{ fontSize: "0.9em" }}>↩</span>
                                    <span style={{ color: isDarkMode ? "#fb923c" : "#f97316", fontWeight: 700 }}>
                                      {item.returned.toLocaleString()}
                                    </span>
                                  </span>
                                )}
                              </div>
                              <div style={{
                                fontWeight: 700,
                                color: isDarkMode ? "#60a5fa" : "#2563eb",
                                fontSize: isMobile ? "1.05rem" : "1.1rem",
                                whiteSpace: "nowrap",
                                padding: isMobile ? "0.35rem 0.7rem" : "0.3rem 0.65rem",
                                borderRadius: "10px",
                                background: isDarkMode
                                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)"
                                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)",
                                border: isDarkMode ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid rgba(59, 130, 246, 0.2)",
                                textAlign: isMobile ? "center" : "right"
                              }}>
                                {currency(item.revenue)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Top per platform */}
              {topPlatform && topPlatform.length > 0 ? (
                <div
                  style={{
                    marginTop: isMobile ? "0.75rem" : "1rem",
                    padding: isMobile ? "0.65rem" : "0.85rem",
                    borderRadius: 14,
                    border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,23,42,0.06)",
                    background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.9)",
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(auto-fit, minmax(180px, 1fr))" : "1fr",
                    gap: isMobile ? "0.5rem" : "0.75rem"
                  }}
                >
                  {(["Shopee", "TikTok", "Lazada"] as const).map((pf) => {
                    const row = topPlatform.find((p) => p?.platform === pf) || null;
                    const meta = PLATFORM_META[pf];
                    const barWidth = row ? Math.max(8, Math.min(100, (row.revenue / maxPlatformRevenue) * 100)) : 0;
                    return (
                      <div
                        key={pf}
                        style={{
                          borderRadius: 12,
                          padding: isMobile ? "0.65rem" : "0.75rem",
                          background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.95)",
                          border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,23,42,0.06)",
                          display: "grid",
                          gap: isMobile ? "0.35rem" : "0.55rem",
                          minHeight: isMobile ? "130px" : "140px",
                          boxShadow: isDarkMode ? "0 8px 20px rgba(0,0,0,0.18)" : "0 10px 24px rgba(15,23,42,0.06)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.55rem", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", minWidth: 0 }}>
                          <div
                            style={{
                              width: isMobile ? 38 : 42,
                              height: isMobile ? 38 : 42,
                              borderRadius: 12,
                              background: `${meta.color}12`,
                              border: `1px solid ${meta.color}33`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              boxShadow: "0 8px 22px rgba(0,0,0,0.12)"
                            }}
                          >
                            <Image src={meta.logo} alt={pf} width={isMobile ? 24 : 28} height={isMobile ? 24 : 28} style={{ objectFit: "contain" }} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{pf}</p>
                            <p style={{ margin: 0, fontSize: isMobile ? "0.92rem" : "1rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25 }}>
                              {row ? row.variant : "ยังไม่มีข้อมูล"}
                            </p>
                          </div>
                          </div>
                          {row && (
                            <span
                              className="select-none badge badge-default badge-sm"
                              style={{
                                background: `${meta.color}1f`,
                                color: meta.color,
                                border: `1px solid ${meta.color}33`
                              }}
                            >
                              อันดับ 1
                            </span>
                          )}
                        </div>
                        {row ? (
                          <>
                            <div style={{ position: "relative", width: "100%", height: 9, borderRadius: 999, background: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${barWidth}%`,
                                  height: "100%",
                                  borderRadius: 999,
                                  background: meta.color,
                                  opacity: 0.85,
                                  boxShadow: `0 8px 18px ${meta.color}55`,
                                  transition: "width 0.35s ease"
                                }}
                              />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: isMobile ? "0.82rem" : "0.9rem", color: "var(--text-tertiary)", gap: "0.5rem" }}>
                              <span style={{ whiteSpace: "nowrap" }}>{row.qty.toLocaleString()} ชิ้น</span>
                              <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{currency(row.revenue)}</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>ไม่มีข้อมูล</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </GlassCard>
            </div>

          {/* Thailand Map - Full Width */}
          <div style={{ width: "100%", marginBottom: 0 }}>
            {topLoading ? (
              <SkeletonBox height={`${mapHeight}px`} />
            ) : topError ? (
              <div style={{ color: "var(--text-tertiary)", fontSize: "0.95rem" }}>{topError}</div>
            ) : topProvinces.length === 0 ? (
              <div style={{ color: "var(--text-tertiary)", fontSize: "0.95rem" }}>ยังไม่มีข้อมูลจังหวัด</div>
            ) : (
              <div style={{ minHeight: `${mapHeight}px`, height: `${mapHeight}px`, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ThailandMapD3
                    provinces={topProvinceData}
                    annotations={topProvinces.map((p, idx) => ({
                      name: p.name,
                      qty: p.qty,
                      value: p.revenue,
                      rank: idx + 1
                    }))}
                    compact
                  />
                </div>
              </div>
            )}
          </div>

          </div>
        </div>

        {/* Goal Overview */}
        {(goals?.length ?? 0) > 0 && (
          <AnimatedSection animation="fade-up" delay={100}>
            <div style={{ marginTop: isMobile ? "15rem" : "3.5rem", marginBottom: "2rem" }}>
              <GoalSection
                goalYear={goalYear}
                goalYears={goalYears}
                onYearChange={setGoalYear}
                displayType={displayType}
                targetsByMonth={targetsByMonth}
                monthlyActuals={monthlyActuals}
                focusMonth={focusMonth}
                todayYear={todayYear}
                isDarkMode={isDarkMode}
                showMonthlyModal={showMonthlyGoalModal}
                onToggleMonthlyModal={setShowMonthlyGoalModal}
              />
            </div>
          </AnimatedSection>
        )}

        {/* Platform Cards */}
        <AnimatedSection animation="fade-up" delay={200}>
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "clamp(1.125rem, 3vw, 1.5rem)", fontWeight: "700", marginBottom: "clamp(1rem, 2vw, 1.5rem)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "4px", height: "clamp(20px, 4vw, 24px)", borderRadius: "2px", background: "linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%)" }} />
              <span style={{ color: "var(--text-primary)" }}>ภาพรวมแพลตฟอร์ม</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "1rem" }}>
              {isLoading ? (
                <>
                  <SkeletonPlatformCard />
                  <SkeletonPlatformCard />
                  <SkeletonPlatformCard />
                </>
              ) : (
                filteredPlatforms.map((p) => (
                  <PlatformCard key={p.platform} platform={p} isDarkMode={isDarkMode} />
                ))
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Month Comparison */}
        {monthComparison.length > 0 && monthComparison.some(p => p.comparisons.length > 0) && (
          <AnimatedSection animation="fade-up" delay={300}>
            <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "clamp(1.125rem, 3vw, 1.5rem)", fontWeight: "700", marginBottom: "clamp(1rem, 2vw, 1.5rem)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "4px", height: "clamp(20px, 4vw, 24px)", borderRadius: "2px", background: "linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%)" }} />
              <span style={{ color: "var(--text-primary)" }}>เปรียบเทียบรายเดือน</span>
            </h2>
              {/* แสดงกราฟเต็มทั้ง Mobile และ Desktop */}
              <MonthComparisonDesktop comparisonData={monthComparison} isDarkMode={isDarkMode} goals={goals} />
            </div>
          </AnimatedSection>
        )}

      </div>

      {/* Fee Modal */}
      {showFeeModal && (
        <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title="รายละเอียดค่าธรรมเนียม" size="lg" isDarkMode={isDarkMode}>
          <div style={{ padding: "1.5rem" }}>
            {(() => {
              const feePlatforms = filteredPlatforms
                .map((p) => {
                  if (!p.feeGroups || p.feeGroups.length === 0) {
                    const feeItems = Object.entries(p.breakdown || {})
                      .filter(([, v]) => Number(v) < 0)
                      .map(([label, value]) => ({ label, value }));
                    return {
                      ...p,
                      feeGroups: feeItems.length
                        ? [{ title: "ค่าธรรมเนียมทั้งหมด", items: feeItems }]
                        : []
                    };
                  }
                  return p;
                })
                .filter((p) => p.feeGroups && p.feeGroups.length > 0);

              if (feePlatforms.length === 0) {
                return <p style={{ textAlign: "center", color: "var(--text-tertiary)" }}>ไม่มีข้อมูลค่าธรรมเนียมแบบละเอียด</p>;
              }

              return feePlatforms.map((p) => (
                <div key={p.platform} style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Badge variant={p.platform === "TikTok" ? "error" : p.platform === "Shopee" ? "warning" : "info"}>{p.platform}</Badge>
                  </h3>
                  {p.feeGroups?.map((group, gi) => (
                    <div key={gi} style={{ marginBottom: "1.5rem" }}>
                      <p style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>{group.title}</p>
                      {group.items.map((item, ii) => (
                        <div key={ii} style={{ marginBottom: "0.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
                            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{item.label}</span>
                            <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#f59e0b" }}>{currency(item.value)}</span>
                          </div>
                          {(item as { label: string; value: number; children?: { label: string; value: number }[] }).children?.map((child: { label: string; value: number }, ci: number) => (
                            <div key={ci} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "1.5rem", padding: "0.25rem 0 0.25rem 1.5rem" }}>
                              <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>• {child.label}</span>
                              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{currency(child.value)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </Modal>
      )}

      {/* Revenue Modal */}
      {showRevenueModal && (
        <Modal isOpen={showRevenueModal} onClose={() => setShowRevenueModal(false)} title="รายละเอียดรายได้" size="lg" isDarkMode={isDarkMode}>
          <div style={{ padding: "1.5rem" }}>
            {(() => {
              const revenuePlatforms = filteredPlatforms
                .map((p) => {
                  if (!p.revenueGroups || p.revenueGroups.length === 0) {
                    const revenueItems = Object.entries(p.breakdown || {})
                      .filter(([, v]) => Number(v) > 0)
                      .map(([label, value]) => ({ label, value }));
                    return {
                      ...p,
                      revenueGroups: revenueItems.length
                        ? [{ title: "รายได้ทั้งหมด", items: revenueItems }]
                        : []
                    };
                  }
                  return p;
                })
                .filter((p) => p.revenueGroups && p.revenueGroups.length > 0);

              if (revenuePlatforms.length === 0) {
                return <p style={{ textAlign: "center", color: "var(--text-tertiary)" }}>ไม่มีข้อมูลรายได้แบบละเอียด</p>;
              }

              return revenuePlatforms.map((p) => (
                <div key={p.platform} style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Badge variant={p.platform === "TikTok" ? "error" : p.platform === "Shopee" ? "warning" : "info"}>{p.platform}</Badge>
                  </h3>
                  {p.revenueGroups?.map((group, gi) => (
                    <div key={gi} style={{ marginBottom: "1.5rem" }}>
                      <p style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>{group.title}</p>
                      {group.items.map((item, ii) => (
                        <div key={ii} style={{ marginBottom: "0.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
                            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{item.label}</span>
                            <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#10b981" }}>{currency(item.value)}</span>
                          </div>
                          {(item as { label: string; value: number; children?: { label: string; value: number }[] }).children?.map((child: { label: string; value: number }, ci: number) => (
                            <div key={ci} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "1.5rem", padding: "0.25rem 0 0.25rem 1.5rem" }}>
                              <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>• {child.label}</span>
                              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{currency(child.value)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </Modal>
      )}

      {/* Net Profit Modal */}
      {showNetModal && (
        <Modal isOpen={showNetModal} onClose={() => setShowNetModal(false)} title="รายละเอียดกำไรสุทธิ" size="lg" isDarkMode={isDarkMode}>
          <div style={{ padding: "1.5rem" }}>
            {filteredPlatforms.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-tertiary)" }}>ไม่มีข้อมูลกำไรสุทธิ</p>
            ) : (
              filteredPlatforms.map((p) => (
                <div key={p.platform} style={{ marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Badge variant={p.platform === "TikTok" ? "error" : p.platform === "Shopee" ? "warning" : "info"}>{p.platform}</Badge>
                    <span style={{ fontSize: "0.9375rem", color: "var(--text-tertiary)", fontWeight: 500 }}>รายได้รวม + ค่าธรรมเนียม + การปรับยอด</span>
                  </h3>
                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>รายได้รวม</span>
                      <span style={{ fontWeight: 600 }}>{currency(p.revenue)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>ค่าธรรมเนียม</span>
                      <span style={{ fontWeight: 600 }}>{currency(p.fees)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>การปรับยอด</span>
                      <span style={{ fontWeight: 600 }}>{currency(p.adjustments)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>กำไรสุทธิ</span>
                      <span style={{ fontWeight: 800, color: "#10b981" }}>{currency(p.settlement)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }

        @keyframes monthCardFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes platformCardSlide {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        * {
          box-sizing: border-box;
        }

        html, body {
          overflow-x: hidden;
          width: 100%;
        }

        @media (max-width: 640px) {
          .container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            padding-top: 1.5rem !important;
            max-width: 100% !important;
          }
          h1 {
            font-size: 1.5rem !important;
          }
          h2 {
            font-size: 1.125rem !important;
          }
          h3 {
            font-size: 1rem !important;
          }
        }

        @media (max-width: 768px) {
          body {
            font-size: 14px;
          }
          table {
            font-size: 0.75rem;
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }
          table th, table td {
            padding: 0.5rem !important;
            white-space: nowrap;
          }
          .grid {
            gap: 1rem !important;
          }
          input[type="date"] {
            font-size: 14px !important;
            min-height: 40px;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            opacity: 0.7;
          }
        }

        @media (min-width: 641px) {
          .date-range-container {
            flex-direction: row !important;
            gap: 1.5rem !important;
          }
          .date-range-container > div {
            flex: 1;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .container {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
          }
        }

        @media (min-width: 1920px) {
          .container {
            max-width: 1600px !important;
          }
        }
      `}} />
    </main>
  );
}
