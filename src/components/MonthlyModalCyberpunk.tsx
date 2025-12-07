"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Thai month names
const TH_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type MonthlyModalCyberpunkProps = {
  targetsByMonth: (number | null)[];
  monthlyActuals: { revenue: number; profit: number }[];
  displayType: "profit" | "revenue";
  typeLabel: string;
  currentMonth: number;
  isDarkMode: boolean;
  isMobileView: boolean;
  onClose: () => void;
};

export default function MonthlyModalCyberpunk({
  targetsByMonth,
  monthlyActuals,
  displayType,
  typeLabel,
  currentMonth,
  isDarkMode,
  isMobileView,
  onClose,
}: MonthlyModalCyberpunkProps) {
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
    // MOBILE: Neon Cyberpunk Stack Cards (Tinder Style Swipe)
    <>
      {/* Cyberpunk Background with Animated Particles */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[9999]"
        style={{
          background: "radial-gradient(ellipse at center, #0a0e27 0%, #000000 100%)",
        }}
      >
        {/* Animated Grid Lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite",
          }}
        />

        {/* Animated Particles */}
        <ParticleField />

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)",
            animation: "scanlines 8s linear infinite",
          }}
        />
      </div>

      {/* Full Screen Horizontal Swipe Container */}
      <div className="fixed inset-0 z-[10000] flex flex-col">
        {/* Cyberpunk Top Bar */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-5"
          style={{
            background: "linear-gradient(180deg, rgba(10, 14, 39, 0.95) 0%, transparent 100%)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: "0 0 10px #22d3ee" }} />
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#22d3ee", letterSpacing: "0.2em" }}>
                {typeLabel}
              </p>
            </div>
            <h2 className="text-xl font-black" style={{ color: "white", textShadow: "0 0 20px rgba(59, 130, 246, 0.8)" }}>
              {TH_MONTHS[selectedMonth]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg border-0 flex items-center justify-center cursor-pointer transition-all duration-300"
            style={{
              background: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.5)",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Horizontal Scroll Container for Stack Cards */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden flex px-4"
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
              <CyberpunkStackCard
                key={idx}
                monthIndex={idx}
                data={data}
                typeLabel={typeLabel}
                isCurrent={idx === currentMonth}
              />
            );
          })}
        </div>

        {/* Neon Progress Dots (Bottom) */}
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10 px-4 py-2 rounded-full"
          style={{
            background: "rgba(10, 14, 39, 0.8)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
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
                width: idx === selectedMonth ? "8px" : "6px",
                height: idx === selectedMonth ? "8px" : "6px",
                background: idx === selectedMonth ? "#3b82f6" : "rgba(59, 130, 246, 0.4)",
                boxShadow: idx === selectedMonth ? "0 0 12px #3b82f6" : "none",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </>
  ) : (
    // DESKTOP: Minimalist (Same as before)
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
            background: isDarkMode ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)",
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

// Animated Particle Field Component
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#22d3ee" : "#06b6d4",
            boxShadow: `0 0 ${4 + (i % 3) * 2}px currentColor`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particleFloat ${10 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particleFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.5);
            opacity: 0.8;
          }
          50% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1);
            opacity: 0.4;
          }
          75% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.2);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}

// Cyberpunk Stack Card Component (Mobile - Tinder Style)
function CyberpunkStackCard({
  monthIndex,
  data,
  typeLabel,
  isCurrent,
}: {
  monthIndex: number;
  data: { target: number; actual: number; percent: number; remaining: number };
  typeLabel: string;
  isCurrent: boolean;
}) {
  const statusColor = data.percent >= 100 ? "#10b981" : data.percent >= 80 ? "#3b82f6" : data.percent >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{
        width: "100vw",
        minHeight: "100dvh",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        padding: "6rem 1.5rem 5rem 1.5rem",
      }}
    >
      {/* Neon Card */}
      <div
        className="relative w-full max-w-md"
        style={{
          animation: "cardGlitch 0.6s ease-out",
        }}
      >
        {/* Hexagon Background Pattern */}
        <div
          className="absolute inset-0 rounded-3xl opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='%233b82f6' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: "30px 30px",
          }}
        />

        {/* Main Card Content */}
        <div
          className="relative rounded-3xl p-8"
          style={{
            background: "linear-gradient(135deg, rgba(10, 14, 39, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
            backdropFilter: "blur(20px)",
            border: `2px solid ${statusColor}`,
            boxShadow: `
              0 0 40px ${statusColor}40,
              0 0 80px ${statusColor}20,
              inset 0 0 60px ${statusColor}10
            `,
          }}
        >
          {/* Current Badge */}
          {isCurrent && (
            <div
              className="absolute -top-3 -right-3 px-4 py-2 rounded-full font-bold text-xs"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                boxShadow: "0 0 20px #3b82f6",
                color: "white",
                animation: "pulse 2s infinite",
              }}
            >
              CURRENT
            </div>
          )}

          {/* Month Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)` }} />
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#22d3ee", letterSpacing: "0.3em" }}>
                {typeLabel}
              </p>
              <div className="w-8 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)` }} />
            </div>
            <h3 className="text-5xl font-black mb-2" style={{
              color: "white",
              textShadow: `0 0 30px ${statusColor}, 0 0 60px ${statusColor}40`,
              letterSpacing: "-0.02em",
            }}>
              {TH_MONTHS[monthIndex]}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
              <p className="text-sm font-semibold" style={{ color: "#22d3ee" }}>
                {new Date().getFullYear() + 543}
              </p>
            </div>
          </div>

          {/* Holographic Percentage Display */}
          <div className="mb-8">
            <div
              className="relative mx-auto rounded-2xl p-6"
              style={{
                width: "fit-content",
                background: `linear-gradient(135deg, ${statusColor}20 0%, ${statusColor}10 100%)`,
                border: `2px solid ${statusColor}`,
                boxShadow: `
                  0 0 40px ${statusColor}40,
                  inset 0 0 40px ${statusColor}20
                `,
              }}
            >
              {/* Animated Ring Progress */}
              <svg width="140" height="140" viewBox="0 0 140 140" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <defs>
                  <linearGradient id={`ringGrad${monthIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={statusColor} />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.2)"
                  strokeWidth="4"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={`url(#ringGrad${monthIndex})`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 60 * Math.min(data.percent, 100) / 100} ${2 * Math.PI * 60}`}
                  transform="rotate(-90 70 70)"
                  style={{
                    filter: `drop-shadow(0 0 8px ${statusColor})`,
                    transition: "stroke-dasharray 1s ease-out",
                  }}
                />
              </svg>
              <div className="relative text-center">
                <div className="text-6xl font-black" style={{
                  background: `linear-gradient(135deg, ${statusColor} 0%, #22d3ee 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: `0 0 40px ${statusColor}60`,
                }}>
                  {Math.round(data.percent)}%
                </div>
                <p className="text-xs font-bold mt-2 tracking-wider uppercase" style={{ color: "#22d3ee" }}>
                  ACHIEVEMENT
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid with Neon Borders */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.5)",
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
              }}
            >
              <p className="text-xs font-bold uppercase mb-2" style={{ color: "#22d3ee", letterSpacing: "0.15em" }}>
                TARGET
              </p>
              <p className="text-xl font-black" style={{ color: "white" }}>
                {(data.target / 1000000).toFixed(1)}M
              </p>
            </div>
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.5)",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)",
              }}
            >
              <p className="text-xs font-bold uppercase mb-2" style={{ color: "#10b981", letterSpacing: "0.15em" }}>
                ACTUAL
              </p>
              <p className="text-xl font-black" style={{ color: "#10b981" }}>
                {(data.actual / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>

          {/* Detailed Amount */}
          <div className="space-y-2">
            <div
              className="flex justify-between items-center p-3 rounded-lg"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <span className="text-xs font-bold uppercase" style={{ color: "#22d3ee", letterSpacing: "0.1em" }}>
                เป้าหมาย
              </span>
              <span className="text-sm font-black" style={{ color: "white" }}>{currency(data.target)}</span>
            </div>
            <div
              className="flex justify-between items-center p-3 rounded-lg"
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <span className="text-xs font-bold uppercase" style={{ color: "#10b981", letterSpacing: "0.1em" }}>
                ทำได้
              </span>
              <span className="text-sm font-black" style={{ color: "#10b981" }}>{currency(data.actual)}</span>
            </div>
            <div
              className="flex justify-between items-center p-3 rounded-lg"
              style={{
                background: data.remaining > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                border: data.remaining > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <span className="text-xs font-bold uppercase" style={{
                color: data.remaining > 0 ? "#f59e0b" : "#10b981",
                letterSpacing: "0.1em"
              }}>
                {data.remaining > 0 ? "เหลืออีก" : "เกินเป้า"}
              </span>
              <span className="text-sm font-black" style={{ color: data.remaining > 0 ? "#f59e0b" : "#10b981" }}>
                {currency(Math.abs(data.remaining))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes cardGlitch {
          0% {
            opacity: 0;
            transform: translate(0, 30px) scale(0.95);
          }
          20% {
            opacity: 0.8;
            transform: translate(-2px, 20px) scale(0.98);
          }
          40% {
            opacity: 1;
            transform: translate(2px, 10px) scale(1);
          }
          60% {
            opacity: 1;
            transform: translate(-1px, 5px) scale(1);
          }
          80% {
            opacity: 1;
            transform: translate(1px, 2px) scale(1);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

// Desktop Minimalist Card (Same as before)
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
