"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Thai month names
const TH_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type MonthlyModalGlassmorphismProps = {
  targetsByMonth: (number | null)[];
  monthlyActuals: { revenue: number; profit: number }[];
  displayType: "profit" | "revenue";
  typeLabel: string;
  currentMonth: number;
  isDarkMode: boolean;
  isMobileView: boolean;
  onClose: () => void;
};

export default function MonthlyModalGlassmorphism({
  targetsByMonth,
  monthlyActuals,
  displayType,
  typeLabel,
  currentMonth,
  isDarkMode,
  isMobileView,
  onClose,
}: MonthlyModalGlassmorphismProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted (for SSR compatibility)
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          (monthCards[currentMonth] as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        }, 300);
      }
    }
  }, [isMobileView, currentMonth]);

  // Detect scroll position for month indicator (mobile only - horizontal)
  useEffect(() => {
    if (!isMobileView || !scrollContainerRef.current) return;

    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const monthIndex = Math.round(scrollLeft / containerWidth);

      if (monthIndex >= 0 && monthIndex < 12) {
        setSelectedMonth(monthIndex);
      }
    };

    const container = scrollContainerRef.current;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMobileView]);

  if (!isMounted) return null;

  const modalContent = isMobileView ? (
    // MOBILE: Full-screen Swipe View (Instagram Reels style)
    <>
      {/* Backdrop with animated gradient */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999]"
          style={{
            background: isDarkMode
              ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
              : "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #f0f9ff 100%)",
            animation: "fadeIn 0.4s ease-out",
          }}
        />

        {/* Full Screen Timeline Container */}
        <div className="fixed inset-0 z-[10000] flex flex-col">
          {/* Top Bar with Glassmorphism */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between"
            style={{
              padding: "1.5rem 1.5rem 3rem 1.5rem",
              background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.8)" }}>
                เป้าหมาย {typeLabel}
              </p>
              <h2 className="text-2xl font-black" style={{ color: "white", letterSpacing: "-0.02em" }}>
                {TH_MONTHS[selectedMonth]} {new Date().getFullYear() + 543}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-2xl border-0 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Horizontal Scroll Container with Snap */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-hidden flex"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {Array.from({ length: 12 }).map((_, idx) => {
              const data = getMonthData(idx);
              return (
                <MobileMonthCard
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

          {/* Month Indicator Dots (Bottom) */}
          <div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10"
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const monthCards = scrollContainerRef.current?.children;
                  if (monthCards?.[idx]) {
                    (monthCards[idx] as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
                  }
                }}
                className="transition-all duration-300 rounded-full cursor-pointer border-0"
                style={{
                  width: idx === selectedMonth ? "10px" : "6px",
                  height: idx === selectedMonth ? "10px" : "6px",
                  background: idx === selectedMonth ? "#3b82f6" : "rgba(255, 255, 255, 0.4)",
                  boxShadow: idx === selectedMonth ? "0 0 12px rgba(59, 130, 246, 0.8)" : "none",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </>
  ) : (
    // DESKTOP: Modal ขนาดพอดี (Not Full Screen)
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999]"
        style={{
          background: isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(12px)",
          animation: "fadeIn 0.3s ease-out",
        }}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8">
        <div
          className="relative w-full max-w-7xl overflow-hidden rounded-3xl flex flex-col"
          style={{
            maxHeight: "90vh",
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.98) 100%)",
            backdropFilter: "blur(40px)",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.8)",
            boxShadow: isDarkMode
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b"
              style={{
                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(59, 130, 246, 0.15)",
                background: isDarkMode
                  ? "linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)"
                  : "linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)",
              }}
            >
              <div>
                <h2 className="text-3xl font-black mb-1"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-0.02em",
                  }}
                >
                  เป้าหมาย {typeLabel} รายเดือน
                </h2>
                <p className="text-sm font-medium" style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>
                  ภาพรวมทั้งปี {new Date().getFullYear() + 543}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-xl border-0 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                  background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(59, 130, 246, 0.1)",
                  color: isDarkMode ? "rgba(255,255,255,0.9)" : "#3b82f6",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Grid Container */}
            <div className="overflow-y-auto p-6">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                }}
              >
                {Array.from({ length: 12 }).map((_, idx) => {
                  const data = getMonthData(idx);
                  return (
                    <DesktopMonthCard
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
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </>
  );

  return createPortal(modalContent, document.body);
}

// Mobile Month Card Component (Full-screen Swipe Style)
function MobileMonthCard({
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
    ? { color: "#10b981", colorDark: "#22c55e", label: "บรรลุเป้าหมาย ✓", icon: "check" }
    : data.percent >= 80
      ? { color: "#3b82f6", colorDark: "#60a5fa", label: "ใกล้ถึงเป้า ↑", icon: "trending-up" }
      : data.percent >= 50
        ? { color: "#f59e0b", colorDark: "#fbbf24", label: "กำลังดำเนินการ", icon: "clock" }
        : { color: "#ef4444", colorDark: "#f87171", label: "ต้องเร่งรัด!", icon: "alert" };

  const activeColor = isDarkMode ? statusConfig.colorDark : statusConfig.color;

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{
        width: "100vw",
        minHeight: "100dvh",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        padding: "6rem 1.5rem 2rem 1.5rem",
      }}
    >
      {/* Animated Sky Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, ${activeColor}20 0%, transparent 60%),
            radial-gradient(ellipse at 70% 60%, ${activeColor}15 0%, transparent 50%),
            linear-gradient(180deg, transparent 0%, ${activeColor}08 100%)
          `,
          animation: "pulseGlow 4s ease-in-out infinite",
        }}
      />

      {/* Card Content */}
      <div
        className="relative w-full max-w-md rounded-3xl"
        style={{
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.9)",
          padding: "2.5rem 2rem",
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 80px ${activeColor}30`
            : `0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8), 0 0 60px ${activeColor}20`,
          animation: "slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Current Month Badge */}
        {isCurrent && (
          <div
            className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: "rgba(59, 130, 246, 0.2)",
              border: "1.5px solid #3b82f6",
              color: "#3b82f6",
              backdropFilter: "blur(10px)",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
            }}
          >
            เดือนปัจจุบัน
          </div>
        )}

        {/* Month Name */}
        <h3
          className="text-center text-3xl font-black mb-3"
          style={{
            color: isDarkMode ? "white" : "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          {TH_MONTHS[monthIndex]}
        </h3>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{
              background: `${activeColor}20`,
              border: `2px solid ${activeColor}`,
              color: activeColor,
            }}
          >
            {statusConfig.label}
          </div>
        </div>

        {/* Giant Percentage */}
        <div className="text-center mb-8">
          <div
            className="text-8xl font-black leading-none mb-2"
            style={{
              background: `linear-gradient(135deg, ${activeColor} 0%, ${activeColor}80 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.04em",
              textShadow: `0 0 40px ${activeColor}40`,
            }}
          >
            {Math.round(data.percent)}%
          </div>
          <div
            className="text-base font-semibold"
            style={{ color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}
          >
            ความสำเร็จ {typeLabel}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 mb-6">
          {/* Target */}
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
              border: isDarkMode ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(59, 130, 246, 0.25)",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59, 130, 246, 0.2)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 12-4-4-4 4M12 16V9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold mb-0.5" style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                เป้าหมาย
              </div>
              <div className="text-lg font-black truncate" style={{ color: "#3b82f6" }}>{currency(data.target)}</div>
            </div>
          </div>

          {/* Actual */}
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: isDarkMode ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
              border: isDarkMode ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold mb-0.5" style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                ทำได้
              </div>
              <div className="text-lg font-black truncate" style={{ color: "#10b981" }}>{currency(data.actual)}</div>
            </div>
          </div>

          {/* Remaining */}
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: data.remaining > 0
                ? isDarkMode ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)"
                : isDarkMode ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
              border: data.remaining > 0
                ? isDarkMode ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(245, 158, 11, 0.25)"
                : isDarkMode ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: data.remaining > 0 ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={data.remaining > 0 ? "#f59e0b" : "#10b981"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {data.remaining > 0 ? (
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                ) : (
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                )}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold mb-0.5" style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                {data.remaining > 0 ? "เหลืออีก" : "เกินเป้า"}
              </div>
              <div className="text-lg font-black truncate" style={{ color: data.remaining > 0 ? "#f59e0b" : "#10b981" }}>
                {currency(Math.abs(data.remaining))}
              </div>
            </div>
          </div>
        </div>

        {/* Liquid Progress Bar */}
        <LiquidProgress percent={data.percent} color={activeColor} isDarkMode={isDarkMode} />
      </div>

      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Desktop Month Card Component (Grid Style)
function DesktopMonthCard({
  monthIndex,
  data,
  isDarkMode,
  isCurrent,
}: {
  monthIndex: number;
  data: { target: number; actual: number; percent: number; remaining: number };
  typeLabel: string;
  isDarkMode: boolean;
  isCurrent: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = data.percent >= 100
    ? { color: "#10b981", label: "✓ เป้า", icon: "check" }
    : data.percent >= 80
      ? { color: "#3b82f6", label: "ใกล้เป้า", icon: "trending-up" }
      : data.percent >= 50
        ? { color: "#f59e0b", label: "กำลังทำ", icon: "clock" }
        : { color: "#ef4444", label: "ต้องเร่ง", icon: "alert" };

  return (
    <div
      className="relative p-5 rounded-2xl cursor-pointer transition-all duration-500"
      style={{
        background: isDarkMode
          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(239, 246, 255, 0.9) 100%)",
        backdropFilter: "blur(20px)",
        border: isCurrent
          ? `2px solid ${statusConfig.color}`
          : isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.12)"
            : "1px solid rgba(255, 255, 255, 0.8)",
        boxShadow: isHovered
          ? isCurrent
            ? `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px ${statusConfig.color}50, 0 0 60px ${statusConfig.color}40`
            : isDarkMode
              ? "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)"
              : "0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.3)"
          : isCurrent
            ? `0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px ${statusConfig.color}40, 0 0 40px ${statusConfig.color}30`
            : isDarkMode
              ? "0 4px 12px rgba(0, 0, 0, 0.2)"
              : "0 4px 12px rgba(0, 0, 0, 0.08)",
        transform: isHovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Current Month Badge */}
      {isCurrent && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
          style={{
            background: statusConfig.color,
            color: "white",
            boxShadow: `0 4px 12px ${statusConfig.color}60`,
            animation: "pulse 2s infinite",
          }}
        >
          ✓
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black" style={{ color: isDarkMode ? "white" : "#0f172a", letterSpacing: "-0.01em" }}>
          {TH_MONTHS_SHORT[monthIndex]}
        </h3>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: `${statusConfig.color}25`,
            color: statusConfig.color,
          }}
        >
          {statusConfig.label}
        </div>
      </div>

      {/* Percentage */}
      <div className="mb-4">
        <div
          className="text-4xl font-black leading-none mb-1"
          style={{
            background: `linear-gradient(135deg, ${statusConfig.color} 0%, ${statusConfig.color}80 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.03em",
          }}
        >
          {Math.round(data.percent)}%
        </div>
        <div className="text-xs font-semibold" style={{ color: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
          ความสำเร็จ
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-left">
          <div className="text-[10px] font-semibold mb-0.5" style={{ color: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
            เป้า
          </div>
          <div className="text-xs font-bold" style={{ color: "#3b82f6" }}>{currency(data.target)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold mb-0.5" style={{ color: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
            ทำได้
          </div>
          <div className="text-xs font-bold" style={{ color: "#10b981" }}>{currency(data.actual)}</div>
        </div>
      </div>

      {/* Liquid Progress Bar */}
      <LiquidProgress percent={data.percent} color={statusConfig.color} isDarkMode={isDarkMode} compact />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// Liquid Progress Bar Component
function LiquidProgress({
  percent,
  color,
  isDarkMode,
  compact = false,
}: {
  percent: number;
  color: string;
  isDarkMode: boolean;
  compact?: boolean;
}) {
  const height = compact ? "8px" : "12px";
  const clampedPercent = Math.min(percent, 100);

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        height,
        background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${clampedPercent}%`,
          background: `linear-gradient(90deg, ${color} 0%, ${color}cc 50%, ${color} 100%)`,
          boxShadow: `0 0 ${compact ? "8px" : "12px"} ${color}60`,
          animation: "liquidFlow 3s ease-in-out infinite",
        }}
      />

      <style jsx>{`
        @keyframes liquidFlow {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
        }
      `}</style>
    </div>
  );
}
