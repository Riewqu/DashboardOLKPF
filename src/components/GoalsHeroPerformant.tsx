"use client";

import { useEffect, useState, useRef, memo, useMemo } from "react";

type Props = {
  monthName: string;
  monthTarget: number;
  monthActual: number;
  monthPercent: number;
  monthLastYear: number;
  ytdLabel: string;
  ytdTarget: number;
  ytdActual: number;
  ytdPercent: number;
  ytdLastYear: number;
  trend: number[];
  typeLabel: string;
};

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// Memoized Number Counter - Pure CSS animations only
const AnimatedNumber = memo(({ value, decimals = 0, prefix = "", suffix = "" }: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    const duration = 1500;
    const start = 0;
    const end = value;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      if (!cancelled) {
        setDisplay(current);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString("th-TH");

  return <>{prefix}{formatted}{suffix}</>;
});

AnimatedNumber.displayName = "AnimatedNumber";

// Status Badge - Pure CSS
const StatusBadge = memo(({ percent }: { percent: number }) => {
  const config = useMemo(() => {
    if (percent >= 100) return { label: "✓ บรรลุเป้า", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
    if (percent >= 80) return { label: "ใกล้เป้า", color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" };
    if (percent >= 50) return { label: "กำลังดำเนินการ", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
    return { label: "ต้องเร่งรัด", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
  }, [percent]);

  return (
    <span className="status-badge" style={{
      "--badge-color": config.color,
      "--badge-bg": config.bg
    } as React.CSSProperties}>
      {config.label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

// Comparison Indicator
const ComparisonIndicator = memo(({ current, previous }: { current: number; previous: number }) => {
  const { percentChange, isPositive } = useMemo(() => {
    const diff = current - previous;
    const percentChange = previous > 0 ? (diff / previous) * 100 : 0;
    const isPositive = diff >= 0;
    return { percentChange, isPositive };
  }, [current, previous]);

  return (
    <div className="comparison-indicator" data-positive={isPositive}>
      <span className="arrow">{isPositive ? "↑" : "↓"}</span>
      <AnimatedNumber value={Math.abs(percentChange)} decimals={1} suffix="%" />
      <span className="label">vs ปีก่อน</span>
    </div>
  );
});

ComparisonIndicator.displayName = "ComparisonIndicator";

// Sparkline - Pure SVG, no animations
const Sparkline = memo(({ data, color }: { data: number[]; color: string }) => {
  const points = useMemo(() => {
    if (!data?.length) return "";

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(" ");
  }, [data]);

  if (!data?.length) return null;

  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 100,100`} fill={`url(#gradient-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
});

Sparkline.displayName = "Sparkline";

// Main Component
export default function GoalsHeroPerformant({
  monthName,
  monthTarget,
  monthActual,
  monthPercent,
  monthLastYear,
  ytdLabel,
  ytdTarget,
  ytdActual,
  ytdPercent,
  ytdLastYear,
  trend,
  typeLabel
}: Props) {
  const monthRemaining = useMemo(() => Math.max(0, monthTarget - monthActual), [monthTarget, monthActual]);
  const ytdRemaining = useMemo(() => Math.max(0, ytdTarget - ytdActual), [ytdTarget, ytdActual]);

  return (
    <>
      <div className="goals-hero-performant">
        {/* Month Card */}
        <div className="goal-card month-card">
          <div className="card-glow" />
          <div className="card-content">
            {/* Pulsing Indicator */}
            <div className="pulse-indicator" />

            {/* Header */}
            <div className="card-header">
              <div>
                <p className="card-label">เดือนนี้</p>
                <h3 className="card-title month-title">
                  {monthName} • {typeLabel}
                </h3>
              </div>
              <StatusBadge percent={monthPercent} />
            </div>

            <ComparisonIndicator current={monthActual} previous={monthLastYear} />

            {/* Metrics Grid */}
            <div className="metrics-grid">
              <div className="metric">
                <p className="metric-label">เป้าหมาย</p>
                <p className="metric-value">{currency(monthTarget)}</p>
              </div>
              <div className="metric">
                <p className="metric-label">ทำได้</p>
                <p className="metric-value success">{currency(monthActual)}</p>
              </div>
              <div className="metric">
                <p className="metric-label">เหลืออีก</p>
                <p className="metric-value" style={{ color: monthRemaining > 0 ? "#f59e0b" : "#10b981" }}>
                  {currency(monthRemaining)}
                </p>
              </div>
            </div>

            {/* Progress Bar - Holographic Glass Segments */}
            <div className="progress-container">
              <div className="progress-label">
                <AnimatedNumber value={monthPercent} decimals={1} suffix="%" />
              </div>
              <div className="progress-segments">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const segmentThreshold = (idx + 1) * 10;
                  const isFilled = monthPercent >= segmentThreshold;
                  const isPartial = monthPercent > idx * 10 && monthPercent < segmentThreshold;
                  const partialWidth = isPartial ? ((monthPercent % 10) / 10) * 100 : 100;

                  return (
                    <div key={idx} className="segment-wrapper">
                      <div
                        className={`segment ${isFilled ? 'filled' : ''} ${isPartial ? 'partial' : ''} month-segment`}
                        style={{
                          "--segment-delay": `${idx * 0.08}s`,
                          "--partial-width": `${partialWidth}%`
                        } as React.CSSProperties}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* YTD Card */}
        <div className="goal-card ytd-card">
          <div className="card-glow" />
          <div className="card-content">
            {/* Header */}
            <div className="card-header">
              <div>
                <p className="card-label">{ytdLabel}</p>
                <h3 className="card-title ytd-title">
                  {typeLabel} สะสมปีนี้
                </h3>
              </div>
              <StatusBadge percent={ytdPercent} />
            </div>

            <ComparisonIndicator current={ytdActual} previous={ytdLastYear} />

            {/* Metrics Grid */}
            <div className="metrics-grid">
              <div className="metric">
                <p className="metric-label">เป้าหมาย</p>
                <p className="metric-value">{currency(ytdTarget)}</p>
              </div>
              <div className="metric">
                <p className="metric-label">ทำได้</p>
                <p className="metric-value success">{currency(ytdActual)}</p>
              </div>
              <div className="metric">
                <p className="metric-label">เหลืออีก</p>
                <p className="metric-value" style={{ color: ytdRemaining > 0 ? "#f59e0b" : "#22c55e" }}>
                  {currency(ytdRemaining)}
                </p>
              </div>
            </div>

            {/* Progress Bar - Holographic Glass Segments */}
            <div className="progress-container">
              <div className="progress-label">
                <AnimatedNumber value={ytdPercent} decimals={1} suffix="%" />
              </div>
              <div className="progress-segments">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const segmentThreshold = (idx + 1) * 10;
                  const isFilled = ytdPercent >= segmentThreshold;
                  const isPartial = ytdPercent > idx * 10 && ytdPercent < segmentThreshold;
                  const partialWidth = isPartial ? ((ytdPercent % 10) / 10) * 100 : 100;

                  return (
                    <div key={idx} className="segment-wrapper">
                      <div
                        className={`segment ${isFilled ? 'filled' : ''} ${isPartial ? 'partial' : ''} ytd-segment`}
                        style={{
                          "--segment-delay": `${idx * 0.08}s`,
                          "--partial-width": `${partialWidth}%`
                        } as React.CSSProperties}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sparkline */}
            <div className="sparkline-container">
              <p className="sparkline-label">แนวโน้ม 7 วันล่าสุด</p>
              <Sparkline data={trend} color="#06b6d4" />
            </div>
          </div>
        </div>
      </div>

      {/* Ultra-optimized CSS - Hardware accelerated */}
      <style jsx>{`
        .goals-hero-performant {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
          animation: fadeInUp 0.4s ease-out forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .goal-card {
          position: relative;
          padding: clamp(1.5rem, 3vw, 2.5rem);
          border-radius: 24px;
          overflow: hidden;
          will-change: transform;
          contain: layout style paint;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      border-color 0.3s ease;
        }

        /* Dark Mode - iPhone Glass Liquid */
        :global(.dark-mode) .goal-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.37),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(255, 255, 255, 0.05);
        }

        :global(.dark-mode) .goal-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(255, 255, 255, 0.08);
        }

        /* Light Mode - iPhone Glass Liquid */
        :global(.light-mode) .goal-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(30px) saturate(150%);
          -webkit-backdrop-filter: blur(30px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.05);
        }

        :global(.light-mode) .goal-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 1);
          box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.08);
        }

        /* Card-specific accents (subtle color tints) */
        .month-card {
          background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
        }

        .ytd-card {
          background-image: linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
        }

        :global(.light-mode) .month-card {
          background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
        }

        :global(.light-mode) .ytd-card {
          background-image: linear-gradient(135deg, rgba(30, 64, 175, 0.06) 0%, rgba(6, 182, 212, 0.06) 100%);
        }

        .card-glow {
          position: absolute;
          top: -50%;
          left: -30%;
          width: 100%;
          height: 150%;
          opacity: 0.3;
          pointer-events: none;
          transition: opacity 0.3s;
        }

        .month-card .card-glow {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
        }

        .ytd-card .card-glow {
          background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
        }

        .goal-card:hover .card-glow {
          opacity: 0.5;
        }

        .card-content {
          position: relative;
          z-index: 1;
        }

        .pulse-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.6);
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .card-label {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .card-title {
          margin: 0;
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 900;
          line-height: 1.2;
          color: var(--text-primary);
        }

        .month-title {
          color: #3b82f6;
        }

        .ytd-title {
          color: #06b6d4;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.75rem;
          border-radius: 999px;
          background: var(--badge-bg);
          border: 1px solid var(--badge-color);
          color: var(--badge-color);
          font-size: 0.8125rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .comparison-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .comparison-indicator[data-positive="true"] {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .comparison-indicator[data-positive="false"] {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .comparison-indicator .arrow {
          font-size: 0.875rem;
        }

        .comparison-indicator .label {
          color: var(--text-tertiary);
          margin-left: 0.125rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .metric {
          min-width: 0;
        }

        .metric-label {
          margin: 0 0 0.5rem 0;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .metric-value {
          margin: 0;
          font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .metric-value.success {
          color: #10b981;
        }

        .progress-container {
          position: relative;
          margin-bottom: 1rem;
        }

        .progress-label {
          position: absolute;
          top: -24px;
          right: 0;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        /* Holographic Glass Segments */
        .progress-segments {
          display: flex;
          gap: 4px;
          height: 14px;
          width: 100%;
        }

        .segment-wrapper {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .segment {
          width: 100%;
          height: 100%;
          border-radius: 3px;
          position: relative;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }

        /* Holographic rainbow shimmer effect */
        .segment::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 0, 255, 0.1) 25%,
            rgba(0, 255, 255, 0.1) 50%,
            rgba(255, 255, 0, 0.1) 75%,
            transparent 100%
          );
          opacity: 0;
          transition: opacity 0.3s;
        }

        .segment:hover::before {
          opacity: 1;
          animation: holographicShimmer 2s linear infinite;
        }

        @keyframes holographicShimmer {
          0% { transform: translateX(-100%) rotate(0deg); }
          100% { transform: translateX(200%) rotate(360deg); }
        }

        /* Filled segments */
        .segment.filled {
          animation: segmentFillIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--segment-delay);
          opacity: 0;
        }

        @keyframes segmentFillIn {
          0% {
            opacity: 0;
            transform: scale(0.8) rotateY(-90deg);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
          }
        }

        /* Month segment colors - Blue/Purple holographic (Dark Mode) */
        :global(.dark-mode) .month-segment.filled {
          background: linear-gradient(135deg,
            rgba(59, 130, 246, 0.6) 0%,
            rgba(139, 92, 246, 0.6) 50%,
            rgba(59, 130, 246, 0.6) 100%
          );
          background-size: 200% 200%;
          border-color: rgba(59, 130, 246, 0.8);
          box-shadow:
            0 0 12px rgba(59, 130, 246, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(139, 92, 246, 0.4);
          animation: segmentFillIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     holographicPulse 3s ease-in-out infinite;
          animation-delay: var(--segment-delay), calc(var(--segment-delay) + 0.6s);
        }

        /* Month segment colors - Blue/Purple (Light Mode) */
        :global(.light-mode) .month-segment.filled {
          background: linear-gradient(135deg,
            rgba(59, 130, 246, 0.9) 0%,
            rgba(139, 92, 246, 0.85) 50%,
            rgba(59, 130, 246, 0.9) 100%
          );
          background-size: 200% 200%;
          border-color: rgba(59, 130, 246, 1);
          box-shadow:
            0 0 8px rgba(59, 130, 246, 0.4),
            0 2px 4px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 0 rgba(59, 130, 246, 0.5);
          animation: segmentFillIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     holographicPulse 3s ease-in-out infinite;
          animation-delay: var(--segment-delay), calc(var(--segment-delay) + 0.6s);
        }

        /* YTD segment colors - Deep Blue/Cyan holographic (Dark Mode) */
        :global(.dark-mode) .ytd-segment.filled {
          background: linear-gradient(135deg,
            rgba(30, 64, 175, 0.6) 0%,
            rgba(6, 182, 212, 0.6) 50%,
            rgba(30, 64, 175, 0.6) 100%
          );
          background-size: 200% 200%;
          border-color: rgba(6, 182, 212, 0.8);
          box-shadow:
            0 0 12px rgba(6, 182, 212, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(30, 64, 175, 0.4);
          animation: segmentFillIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     holographicPulse 3s ease-in-out infinite;
          animation-delay: var(--segment-delay), calc(var(--segment-delay) + 0.6s);
        }

        /* YTD segment colors - Deep Blue/Cyan (Light Mode) */
        :global(.light-mode) .ytd-segment.filled {
          background: linear-gradient(135deg,
            rgba(30, 64, 175, 0.85) 0%,
            rgba(6, 182, 212, 0.85) 50%,
            rgba(30, 64, 175, 0.85) 100%
          );
          background-size: 200% 200%;
          border-color: rgba(6, 182, 212, 1);
          box-shadow:
            0 0 8px rgba(6, 182, 212, 0.4),
            0 2px 4px rgba(6, 182, 212, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 0 rgba(30, 64, 175, 0.5);
          animation: segmentFillIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     holographicPulse 3s ease-in-out infinite;
          animation-delay: var(--segment-delay), calc(var(--segment-delay) + 0.6s);
        }

        @keyframes holographicPulse {
          0%, 100% {
            background-position: 0% 50%;
            filter: brightness(1);
          }
          50% {
            background-position: 100% 50%;
            filter: brightness(1.2);
          }
        }

        /* Partial segment (in-progress segment) */
        .segment.partial {
          animation: segmentFillIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--segment-delay);
          opacity: 0;
        }

        .segment.partial::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--partial-width);
          border-radius: 3px 0 0 3px;
          animation: partialFill 0.8s ease-out forwards;
          animation-delay: calc(var(--segment-delay) + 0.3s);
        }

        /* Partial segments - Dark Mode */
        :global(.dark-mode) .month-segment.partial::after {
          background: linear-gradient(90deg,
            rgba(59, 130, 246, 0.6) 0%,
            rgba(139, 92, 246, 0.6) 100%
          );
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
        }

        :global(.dark-mode) .ytd-segment.partial::after {
          background: linear-gradient(90deg,
            rgba(30, 64, 175, 0.6) 0%,
            rgba(6, 182, 212, 0.6) 100%
          );
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
        }

        /* Partial segments - Light Mode */
        :global(.light-mode) .month-segment.partial::after {
          background: linear-gradient(90deg,
            rgba(59, 130, 246, 0.9) 0%,
            rgba(139, 92, 246, 0.85) 100%
          );
          box-shadow: 0 0 6px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        :global(.light-mode) .ytd-segment.partial::after {
          background: linear-gradient(90deg,
            rgba(30, 64, 175, 0.85) 0%,
            rgba(6, 182, 212, 0.85) 100%
          );
          box-shadow: 0 0 6px rgba(6, 182, 212, 0.4), 0 2px 4px rgba(6, 182, 212, 0.3);
        }

        @keyframes partialFill {
          from { width: 0; opacity: 0; }
          to { width: var(--partial-width); opacity: 1; }
        }

        .sparkline-container {
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          margin-top: 1rem;
        }

        .sparkline-label {
          margin: 0 0 0.5rem 0;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .sparkline {
          display: block;
          width: 100%;
          height: 40px;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .card-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
