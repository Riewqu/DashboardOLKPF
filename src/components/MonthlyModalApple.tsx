"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Thai month names
const TH_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type MonthlyModalAppleProps = {
  targetsByMonth: (number | null)[];
  monthlyActuals: { revenue: number; profit: number }[];
  displayType: "profit" | "revenue";
  typeLabel: string;
  currentMonth: number;
  isDarkMode: boolean;
  isMobileView: boolean;
  onClose: () => void;
};

export default function MonthlyModalApple({
  targetsByMonth,
  monthlyActuals,
  displayType,
  typeLabel,
  currentMonth,
  isDarkMode,
  isMobileView,
  onClose,
}: MonthlyModalAppleProps) {
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

  if (!isMounted) return null;

  const modalContent = isMobileView ? (
    // MOBILE: Carousel Card Stack
    <CarouselMonthView
      currentMonth={currentMonth}
      isDarkMode={isDarkMode}
      onClose={onClose}
      getMonthData={getMonthData}
    />
  ) : (
    // DESKTOP: Grid View
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

// Fullscreen Vertical Stories with Liquid Glass (Mobile)
function CarouselMonthView({
  currentMonth,
  isDarkMode,
  onClose,
  getMonthData,
}: {
  currentMonth: number;
  isDarkMode: boolean;
  onClose: () => void;
  getMonthData: (idx: number) => { target: number; actual: number; percent: number; remaining: number };
}) {
  const [selectedIndex, setSelectedIndex] = useState(currentMonth);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current month on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const monthCards = scrollContainerRef.current.children;
      if (monthCards[currentMonth]) {
        setTimeout(() => {
          (monthCards[currentMonth] as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, [currentMonth]);

  // Detect scroll position for progress indicators
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollTop = scrollContainerRef.current.scrollTop;
      const containerHeight = scrollContainerRef.current.clientHeight;
      const monthIndex = Math.round(scrollTop / containerHeight);

      if (monthIndex >= 0 && monthIndex < 12) {
        setSelectedIndex(monthIndex);
      }
    };

    const container = scrollContainerRef.current;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Liquid Glass Background */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          background: isDarkMode
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          overflow: "hidden",
        }}
      >
        {/* Animated Liquid Blobs */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: isDarkMode
              ? "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: isDarkMode
              ? "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: isDarkMode
              ? "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
            filter: "blur(70px)",
            animation: "float 30s ease-in-out infinite",
          }}
        />
      </div>

      {/* Progress Bars */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          right: "1rem",
          zIndex: 10001,
          display: "flex",
          gap: "0.25rem",
        }}
      >
        {Array.from({ length: 12 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "999px",
              background: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: idx < selectedIndex ? "100%" : idx === selectedIndex ? "100%" : "0%",
                background: isDarkMode ? "#fff" : "#0f172a",
                borderRadius: "999px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        ))}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 10002,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: isDarkMode ? "#fff" : "#0f172a",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 10000,
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
            <LiquidGlassStoryCard
              key={idx}
              monthIndex={idx}
              data={data}
              isCurrent={idx === currentMonth}
              isActive={idx === selectedIndex}
              isDarkMode={isDarkMode}
            />
          );
        })}
      </div>

      {/* Month Indicator Dots */}
      <div
        style={{
          position: "fixed",
          right: "1rem",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 10001,
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
              width: idx === selectedIndex ? "8px" : "6px",
              height: idx === selectedIndex ? "8px" : "6px",
              borderRadius: "50%",
              background: idx === selectedIndex
                ? isDarkMode ? "#3b82f6" : "#2563eb"
                : isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
              boxShadow: idx === selectedIndex ? "0 0 8px rgba(59, 130, 246, 0.8)" : "none",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(30px, -30px);
          }
          50% {
            transform: translate(-20px, 20px);
          }
          75% {
            transform: translate(20px, 10px);
          }
        }
      `}</style>
    </>
  );
}

// Liquid Glass Story Card Component
function LiquidGlassStoryCard({
  monthIndex,
  data,
  isCurrent,
  isActive,
  isDarkMode,
}: {
  monthIndex: number;
  data: { target: number; actual: number; percent: number; remaining: number };
  isCurrent: boolean;
  isActive: boolean;
  isDarkMode: boolean;
}) {
  const statusColor = data.percent >= 100 ? "#10b981" : data.percent >= 80 ? "#3b82f6" : data.percent >= 50 ? "#f59e0b" : "#ef4444";

  // Animated counter states
  const [displayTarget, setDisplayTarget] = useState(0);
  const [displayActual, setDisplayActual] = useState(0);
  const [displayRemaining, setDisplayRemaining] = useState(0);
  const [tick, setTick] = useState(0); // bump to re-trigger CSS-only keyframes

  // Animate numbers when card becomes active
  useEffect(() => {
    if (!isActive) return;
    // Set values immediately (avoid JS timers) and let CSS handle the pop-in keyframes
    setDisplayTarget(data.target);
    setDisplayActual(data.actual);
    setDisplayRemaining(data.remaining);
    setTick((t) => t + 1);
  }, [isActive, data.target, data.actual, data.remaining]);

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        width: "100vw",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "max(5rem, env(safe-area-inset-top, 5rem))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
        paddingLeft: "max(1.5rem, env(safe-area-inset-left, 1.5rem))",
        paddingRight: "max(1.5rem, env(safe-area-inset-right, 1.5rem))",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >

      {/* Current Month Badge */}
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            top: "5rem",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "0.5rem 1.25rem",
            borderRadius: "999px",
            background: isDarkMode
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
            border: isDarkMode
              ? "1px solid rgba(255, 255, 255, 0.25)"
              : "1px solid rgba(255, 255, 255, 1)",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: isDarkMode ? "#fff" : "#0f172a",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          }}
        >
          เดือนปัจจุบัน
        </div>
      )}

      {/* Liquid Glass Content Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          animation: isActive ? "fadeSlideIn 0.6s ease-out" : "none",
          background: isDarkMode
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderRadius: "32px",
          padding: "2rem 1.5rem",
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.15)"
            : "1px solid rgba(255, 255, 255, 1)",
          boxShadow: isDarkMode
            ? "0 24px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "0 24px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)",
        }}
      >
        {/* Month Name */}
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "3rem",
              fontWeight: 900,
              color: isDarkMode ? "#fff" : "#0f172a",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
              textShadow: isDarkMode
                ? "0 4px 20px rgba(0, 0, 0, 0.3)"
                : "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            {TH_MONTHS[monthIndex]}
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.7)",
              fontWeight: 600,
            }}
          >
            {new Date().getFullYear() + 543}
          </p>
        </div>

        {/* Giant Percentage Circle */}
          <div
            style={{
              position: "relative",
              width: "240px",
              height: "240px",
              display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Background Circle */}
          <svg
            width="240"
            height="240"
            style={{
              position: "absolute",
              transform: "rotate(-90deg)",
            }}
          >
            <circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke={isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}
              strokeWidth="8"
            />
            <circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke={statusColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={isActive
                ? `${2 * Math.PI * 110 * Math.min(data.percent, 100) / 100} ${2 * Math.PI * 110}`
                : `0 ${2 * Math.PI * 110}`
              }
              style={{
                filter: `drop-shadow(0 0 12px ${statusColor}80)`,
                transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </svg>

          {/* Percentage Text */}
          <div
            style={{
              textAlign: "center",
              zIndex: 1,
            }}
          >
            <div
              key={tick}
              style={{
                fontSize: "4.5rem",
                fontWeight: 900,
                color: statusColor,
                lineHeight: 1,
                textShadow: `0 4px 20px ${statusColor}40`,
                animation: isActive ? `countUp 0.9s cubic-bezier(0.4, 0, 0.2, 1)` : "none",
                willChange: "transform, opacity",
              }}
            >
              {Math.round(data.percent)}%
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.6)",
                fontWeight: 600,
                marginTop: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              ACHIEVEMENT
            </div>
          </div>
        </div>

        {/* Liquid Glass Stats Cards */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Target */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderRadius: "16px",
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(20px)",
              border: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.12)"
                : "1px solid rgba(255, 255, 255, 1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.6)",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                เป้าหมาย
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: isDarkMode ? "#fff" : "#0f172a",
                }}
              >
                {currency(displayTarget)}
              </div>
            </div>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(15, 23, 42, 0.4)"} strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>

          {/* Actual */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderRadius: "16px",
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(20px)",
              border: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.12)"
                : "1px solid rgba(255, 255, 255, 1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.6)",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                ทำได้
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: statusColor,
                }}
              >
                {currency(displayActual)}
              </div>
            </div>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(15, 23, 42, 0.4)"} strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Remaining */}
          {data.remaining > 0 && (
            <div
              style={{
                padding: "1rem 1.5rem",
                borderRadius: "16px",
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(20px)",
                border: isDarkMode
                  ? "1px solid rgba(255, 255, 255, 0.08)"
                  : "1px solid rgba(255, 255, 255, 0.9)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.7)",
                  fontWeight: 600,
                }}
              >
                เหลืออีก
              </div>
              <div
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: isDarkMode ? "#fff" : "#0f172a",
                }}
              >
                {currency(displayRemaining)}
              </div>
            </div>
          )}
        </div>

        {/* Swipe Hint (only show on first card) */}
        {monthIndex === 0 && (
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              opacity: 0.6,
              animation: "bounce 2s ease-in-out infinite",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "#fff" : "#0f172a"} strokeWidth="2">
              <polyline points="7 13 12 18 17 13" />
              <polyline points="7 6 12 11 17 6" />
            </svg>
            <span
              style={{
                fontSize: "0.75rem",
                color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.7)",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              Swipe สำหรับดูเดือนถัดไป
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes countUp {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

// Desktop Minimalist Card
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

  // Animated counter states
  const [displayTarget, setDisplayTarget] = useState(0);
  const [displayActual, setDisplayActual] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animate numbers on mount with stagger
  useEffect(() => {
    if (hasAnimated) return;

    const delay = monthIndex * 50; // Stagger by 50ms per card
    const animationTimer = setTimeout(() => {
      const duration = 1200;
      const steps = 60;
      const interval = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        setDisplayTarget(Math.round(data.target * eased));
        setDisplayActual(Math.round(data.actual * eased));
        setDisplayPercent(data.percent * eased);

        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayTarget(data.target);
          setDisplayActual(data.actual);
          setDisplayPercent(data.percent);
          setHasAnimated(true);
        }
      }, interval);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(animationTimer);
  }, [monthIndex, data.target, data.actual, data.percent, hasAnimated]);

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
          {Math.round(displayPercent)}%
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>เป้าหมาย</span>
          <span className="font-bold" style={{ color: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)" }}>
            {currency(displayTarget)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>ทำได้</span>
          <span className="font-bold" style={{ color: "#10b981" }}>
            {currency(displayActual)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          height: "8px",
          background: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.25)",
          border: isDarkMode ? "none" : "1.5px solid rgba(0, 0, 0, 0.25)",
          boxShadow: isDarkMode ? "none" : "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${Math.min(displayPercent, 100)}%`,
            background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}cc 50%, ${statusColor} 100%)`,
            backgroundSize: "200% 100%",
            boxShadow: `0 0 8px ${statusColor}60`,
            transition: "width 0.05s linear",
          }}
        />
      </div>
    </div>
  );
}
