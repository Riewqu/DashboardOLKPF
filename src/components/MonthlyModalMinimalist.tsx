"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Thai month names
const TH_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type MonthlyModalMinimalistProps = {
  targetsByMonth: (number | null)[];
  monthlyActuals: { revenue: number; profit: number }[];
  displayType: "profit" | "revenue";
  typeLabel: string;
  currentMonth: number;
  isDarkMode: boolean;
  isMobileView: boolean;
  onClose: () => void;
};

export default function MonthlyModalMinimalist({
  targetsByMonth,
  monthlyActuals,
  displayType,
  typeLabel,
  currentMonth,
  isDarkMode,
  isMobileView,
  onClose,
}: MonthlyModalMinimalistProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

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
          (monthCards[currentMonth] as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, [isMobileView, currentMonth]);

  // Detect scroll position for month indicator (mobile only - vertical)
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

  if (!isMounted) return null;

  const modalContent = isMobileView ? (
    // MOBILE: Clean Vertical Swipe with Wave Background
    <>
      {/* Animated Gradient Mesh Background */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999]"
        style={{
          background: isDarkMode
            ? "linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)"
            : "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)",
          animation: "gradientShift 8s ease infinite",
        }}
      />

      {/* Full Screen Vertical Swipe Container */}
      <div className="fixed inset-0 z-[10000] flex flex-col">
        {/* Clean Top Bar */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-5"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)",
          }}
        >
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "0.1em" }}>
              {typeLabel}
            </p>
            <h2 className="text-xl font-black" style={{ color: "white" }}>
              {TH_MONTHS[selectedMonth]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border-0 flex items-center justify-center cursor-pointer transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Vertical Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            scrollSnapType: "y mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {Array.from({ length: 12 }).map((_, idx) => {
            const data = getMonthData(idx);
            return (
              <MobileMinimalistCard
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

        {/* Progress Indicator (Right Side) */}
        <div
          className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-1.5 z-10"
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
              className="transition-all duration-300 rounded-full cursor-pointer"
              style={{
                width: idx === selectedMonth ? "4px" : "3px",
                height: idx === selectedMonth ? "32px" : "16px",
                background: idx === selectedMonth ? "white" : "rgba(255, 255, 255, 0.5)",
                boxShadow: idx === selectedMonth ? "0 0 8px rgba(255, 255, 255, 0.8)" : "none",
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(20deg); }
        }
      `}</style>
    </>
  ) : (
    // DESKTOP: Clean Grid with Float Cards
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999]"
        style={{
          background: isDarkMode ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.3s ease-out",
        }}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8">
        <div
          className="relative w-full max-w-7xl rounded-3xl flex flex-col"
          style={{
            maxHeight: "90vh",
            background: isDarkMode
              ? "rgba(15, 23, 42, 0.98)"
              : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            boxShadow: isDarkMode
              ? "0 20px 60px rgba(0, 0, 0, 0.5)"
              : "0 20px 60px rgba(0, 0, 0, 0.2)",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
            animation: "modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b"
            style={{
              borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
            }}
          >
            <div>
              <h2 className="text-2xl font-black mb-1"
                style={{
                  color: isDarkMode ? "white" : "#0f172a",
                  letterSpacing: "-0.01em",
                }}
              >
                เป้าหมาย{typeLabel}รายเดือน
              </h2>
              <p className="text-sm font-medium" style={{ color: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                ปี {new Date().getFullYear() + 543}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
              style={{
                background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                color: isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Grid Container */}
          <div className="overflow-y-auto p-8">
            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              {Array.from({ length: 12 }).map((_, idx) => {
                const data = getMonthData(idx);
                return (
                  <DesktopMinimalistCard
                    key={idx}
                    monthIndex={idx}
                    data={data}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );

  return createPortal(modalContent, document.body);
}

// Mobile Minimalist Card Component
function MobileMinimalistCard({
  monthIndex,
  data,
  typeLabel,
  isCurrent,
}: {
  monthIndex: number;
  data: { target: number; actual: number; percent: number; remaining: number };
  typeLabel: string;
  isDarkMode: boolean;
  isCurrent: boolean;
}) {
  const statusColor = data.percent >= 100 ? "#10b981" : data.percent >= 80 ? "#3b82f6" : data.percent >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        minHeight: "100dvh",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        padding: "5rem 1.5rem 2rem 1.5rem",
      }}
    >
      {/* Animated Wave SVG Background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ opacity: 0.15 }}
      >
        <defs>
          <linearGradient id={`waveGrad${monthIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={statusColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={statusColor} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d="M0,30 Q25,25 50,30 T100,30 L100,100 L0,100 Z"
          fill={`url(#waveGrad${monthIndex})`}
          style={{
            animation: "waveFlow 4s ease-in-out infinite",
          }}
        />
        <path
          d="M0,40 Q25,35 50,40 T100,40 L100,100 L0,100 Z"
          fill={`url(#waveGrad${monthIndex})`}
          opacity="0.5"
          style={{
            animation: "waveFlow 6s ease-in-out infinite reverse",
          }}
        />
      </svg>

      {/* Content Card */}
      <div
        className="relative w-full max-w-lg"
        style={{
          animation: "cardSlideIn 0.6s ease-out",
        }}
      >
        {/* Month Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.8)", letterSpacing: "0.2em" }}>
            {isCurrent ? "● เดือนปัจจุบัน" : TH_MONTHS_SHORT[monthIndex]}
          </p>
          <h3 className="text-5xl font-black mb-3" style={{ color: "white", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            {TH_MONTHS[monthIndex]}
          </h3>
          <p className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
            {typeLabel} {new Date().getFullYear() + 543}
          </p>
        </div>

        {/* Giant Percentage Circle */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="10"
              />
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke={statusColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 75 * Math.min(data.percent, 100) / 100} ${2 * Math.PI * 75}`}
                transform="rotate(-90 90 90)"
                style={{
                  filter: `drop-shadow(0 0 12px ${statusColor}80)`,
                  transition: "stroke-dasharray 1s ease-out",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-5xl font-black" style={{ color: statusColor, textShadow: `0 0 20px ${statusColor}80` }}>
                {Math.round(data.percent)}%
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-2xl" style={{ background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)" }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>
              เป้าหมาย
            </p>
            <p className="text-lg font-black" style={{ color: "white" }}>
              {(data.target / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center p-4 rounded-2xl" style={{ background: "rgba(16, 185, 129, 0.25)", backdropFilter: "blur(10px)" }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "0.1em" }}>
              ทำได้
            </p>
            <p className="text-lg font-black" style={{ color: "#10b981" }}>
              {(data.actual / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center p-4 rounded-2xl" style={{ background: data.remaining > 0 ? "rgba(245, 158, 11, 0.25)" : "rgba(16, 185, 129, 0.25)", backdropFilter: "blur(10px)" }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "0.1em" }}>
              {data.remaining > 0 ? "เหลือ" : "เกิน"}
            </p>
            <p className="text-lg font-black" style={{ color: data.remaining > 0 ? "#f59e0b" : "#10b981" }}>
              {(Math.abs(data.remaining) / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid gap-3">
          <div className="flex justify-between items-center p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(10px)" }}>
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>เป้าหมาย</span>
            <span className="text-base font-black" style={{ color: "white" }}>{currency(data.target)}</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-xl" style={{ background: "rgba(16, 185, 129, 0.2)", backdropFilter: "blur(10px)" }}>
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>ทำได้จริง</span>
            <span className="text-base font-black" style={{ color: "#10b981" }}>{currency(data.actual)}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes waveFlow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-5%); }
        }
        @keyframes cardSlideIn {
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

// Desktop Minimalist Card Component
function DesktopMinimalistCard({
  monthIndex,
  data,
  isDarkMode,
  isCurrent,
}: {
  monthIndex: number;
  data: { target: number; actual: number; percent: number; remaining: number };
  isDarkMode: boolean;
  isCurrent: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const statusColor = data.percent >= 100 ? "#10b981" : data.percent >= 80 ? "#3b82f6" : data.percent >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="relative p-6 rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        background: isDarkMode
          ? isHovered ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.04)"
          : isHovered ? "rgba(0, 0, 0, 0.04)" : "rgba(0, 0, 0, 0.02)",
        border: isCurrent
          ? `2px solid ${statusColor}`
          : isDarkMode ? "2px solid rgba(255, 255, 255, 0.06)" : "2px solid rgba(0, 0, 0, 0.06)",
        boxShadow: isHovered
          ? isDarkMode
            ? "0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)"
            : "0 8px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)"
          : "0 2px 8px rgba(0, 0, 0, 0.08)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-black" style={{ color: isDarkMode ? "white" : "#0f172a" }}>
            {TH_MONTHS_SHORT[monthIndex]}
          </h3>
          {isCurrent && (
            <span className="text-xs font-bold" style={{ color: statusColor }}>● ปัจจุบัน</span>
          )}
        </div>
        <div
          className="text-3xl font-black"
          style={{
            color: statusColor,
            textShadow: `0 0 20px ${statusColor}40`,
          }}
        >
          {Math.round(data.percent)}%
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>เป้าหมาย</span>
          <span className="font-bold" style={{ color: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)" }}>
            {(data.target / 1000000).toFixed(1)}M
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>ทำได้</span>
          <span className="font-bold" style={{ color: "#10b981" }}>
            {(data.actual / 1000000).toFixed(1)}M
          </span>
        </div>
      </div>

      {/* Wave Progress Bar */}
      <WaveProgressBar percent={data.percent} color={statusColor} isDarkMode={isDarkMode} />
    </div>
  );
}

// Wave Progress Bar Component
function WaveProgressBar({ percent, color, isDarkMode }: { percent: number; color: string; isDarkMode: boolean }) {
  const clampedPercent = Math.min(percent, 100);

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        height: "8px",
        background: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{
          width: `${clampedPercent}%`,
          background: `linear-gradient(90deg, ${color} 0%, ${color}cc 50%, ${color} 100%)`,
          backgroundSize: "200% 100%",
          boxShadow: `0 0 8px ${color}60`,
          animation: "waveShimmer 2s ease-in-out infinite",
        }}
      />

      <style jsx>{`
        @keyframes waveShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
