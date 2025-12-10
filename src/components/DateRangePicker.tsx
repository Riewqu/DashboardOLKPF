"use client";

import { useState, type CSSProperties } from "react";

type DateRange = {
  startDate: string | null; // ISO format: YYYY-MM-DD
  endDate: string | null; // ISO format: YYYY-MM-DD
};

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onApply?: () => void;
  label?: string;
  isDark?: boolean;
};

export default function DateRangePicker({
  value,
  onChange,
  onApply,
  label = "เลือกช่วงวันที่",
  isDark = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = () => {
    onChange({ startDate: null, endDate: null });
    if (onApply) onApply();
  };

  const handleApply = () => {
    if (onApply) onApply();
    setIsOpen(false);
  };

  const hasSelection = value.startDate || value.endDate;

  const themeVars: CSSProperties = {
    ["--dr-text-primary" as string]: isDark ? "#e2e8f0" : "#0f172a",
    ["--dr-text-secondary" as string]: isDark ? "#94a3b8" : "#334155",
    ["--dr-trigger-bg" as string]: isDark
      ? "linear-gradient(135deg, rgba(15, 20, 32, 0.92) 0%, rgba(10, 14, 26, 0.92) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
    ["--dr-trigger-bg-hover" as string]: isDark
      ? "linear-gradient(135deg, rgba(15, 20, 32, 0.96) 0%, rgba(10, 14, 26, 0.96) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)",
    ["--dr-border" as string]: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.1)",
    ["--dr-border-strong" as string]: isDark ? "rgba(59, 130, 246, 0.45)" : "rgba(59, 130, 246, 0.3)",
    ["--dr-panel-bg" as string]: isDark
      ? "linear-gradient(135deg, rgba(15, 20, 32, 0.98) 0%, rgba(10, 14, 26, 0.95) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)",
    ["--dr-panel-border" as string]: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    ["--dr-input-bg" as string]: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)",
    ["--dr-input-border" as string]: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
    ["--dr-input-shadow" as string]: isDark ? "0 0 0 3px rgba(59,130,246,0.25)" : "0 0 0 3px rgba(59,130,246,0.15)",
    ["--dr-badge-bg" as string]: "linear-gradient(135deg, #3b82f6, #2563eb)",
    ["--dr-overlay" as string]: isDark ? "rgba(10, 14, 26, 0.65)" : "rgba(15, 23, 42, 0.25)",
    ["--dr-panel-shadow" as string]: isDark
      ? "0 20px 60px rgba(0,0,0,0.55), 0 0 30px rgba(59,130,246,0.15)"
      : "0 20px 60px rgba(59,130,246,0.18), 0 0 30px rgba(14,165,233,0.16)",
  };

  return (
    <div className="date-range-picker" data-theme={isDark ? "dark" : "light"} style={themeVars}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="date-picker-trigger"
        aria-label="เปิดตัวเลือกวันที่"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="date-picker-label">{label}</span>
        {hasSelection && (
          <span className="date-picker-badge">
            {value.startDate && value.endDate ? "กำหนดช่วง" : "1 วัน"}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="date-picker-backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="date-picker-panel">
            <div className="date-picker-header">
              <h3>เลือกช่วงวันที่</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="date-picker-close"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <div className="date-picker-inputs">
              {/* Start Date */}
              <div className="date-input-group">
                <label htmlFor="start-date">วันที่เริ่มต้น</label>
                <input
                  id="start-date"
                  type="date"
                  value={value.startDate || ""}
                  onChange={(e) =>
                    onChange({ ...value, startDate: e.target.value || null })
                  }
                  max={value.endDate || undefined}
                  className="date-input"
                />
              </div>

              {/* End Date */}
              <div className="date-input-group">
                <label htmlFor="end-date">วันที่สิ้นสุด</label>
                <input
                  id="end-date"
                  type="date"
                  value={value.endDate || ""}
                  onChange={(e) =>
                    onChange({ ...value, endDate: e.target.value || null })
                  }
                  min={value.startDate || undefined}
                  className="date-input"
                />
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="date-picker-presets">
              <button
                onClick={() => {
                  const today = new Date();
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  onChange({
                    startDate: startOfMonth.toISOString().split("T")[0],
                    endDate: endOfMonth.toISOString().split("T")[0],
                  });
                }}
                className="preset-btn"
              >
                เดือนนี้
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                  onChange({
                    startDate: lastMonth.toISOString().split("T")[0],
                    endDate: endOfLastMonth.toISOString().split("T")[0],
                  });
                }}
                className="preset-btn"
              >
                เดือนที่แล้ว
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const last30Days = new Date(today);
                  last30Days.setDate(today.getDate() - 30);
                  onChange({
                    startDate: last30Days.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                  });
                }}
                className="preset-btn"
              >
                30 วันล่าสุด
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const last7Days = new Date(today);
                  last7Days.setDate(today.getDate() - 7);
                  onChange({
                    startDate: last7Days.toISOString().split("T")[0],
                    endDate: today.toISOString().split("T")[0],
                  });
                }}
                className="preset-btn"
              >
                7 วันล่าสุด
              </button>
            </div>

            {/* Action Buttons */}
            <div className="date-picker-actions">
              <button onClick={handleClear} className="btn-secondary">
                ล้างทั้งหมด
              </button>
              <button onClick={handleApply} className="btn-primary">
                ใช้งาน
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .date-range-picker {
          position: relative;
          z-index: 10;
        }

        .date-picker-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1rem;
          background: var(--dr-trigger-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--dr-border);
          border-radius: 12px;
          color: var(--dr-text-primary);
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
        }

        .date-picker-trigger:hover {
          background: var(--dr-trigger-bg-hover);
          border-color: var(--dr-border-strong);
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.18);
        }

        .date-picker-trigger svg {
          flex-shrink: 0;
        }

        .date-picker-label {
          white-space: nowrap;
        }

        .date-picker-badge {
          padding: 0.2rem 0.5rem;
          background: var(--dr-badge-bg);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .date-picker-backdrop {
          position: fixed;
          inset: 0;
          background: var(--dr-overlay);
          backdrop-filter: blur(8px);
          z-index: 40;
          animation: fadeIn 0.2s ease;
        }

        .date-picker-panel {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 400px;
          max-width: 90vw;
          background: var(--dr-panel-bg);
          backdrop-filter: blur(24px);
          border: 1px solid var(--dr-panel-border);
          border-radius: 16px;
          box-shadow: var(--dr-panel-shadow);
          padding: 1.5rem;
          z-index: 50;
          animation: slideDown 0.3s ease;
        }

        .date-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .date-picker-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--dr-text-primary);
          margin: 0;
        }

        .date-picker-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 8px;
          color: var(--dr-text-secondary);
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .date-picker-close:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .date-picker-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .date-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .date-input-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--dr-text-secondary);
        }

        .date-input {
          padding: 0.65rem;
          background: var(--dr-input-bg);
          border: 1px solid var(--dr-input-border);
          border-radius: 8px;
          color: var(--dr-text-primary);
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .date-input:focus {
          outline: none;
          border-color: var(--dr-border-strong);
          background: var(--dr-input-bg);
          box-shadow: var(--dr-input-shadow);
        }

        .date-picker-presets {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .preset-btn {
          padding: 0.5rem;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          color: #3b82f6;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preset-btn:hover {
          background: rgba(59, 130, 246, 0.18);
          border-color: rgba(59, 130, 246, 0.35);
          transform: translateY(-1px);
        }

        .date-picker-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-secondary,
        .btn-primary {
          flex: 1;
          padding: 0.65rem 1rem;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary {
          background: rgba(148, 163, 184, 0.12);
          color: var(--dr-text-secondary);
        }

        .btn-secondary:hover {
          background: rgba(148, 163, 184, 0.2);
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .date-picker-panel {
            right: -1rem;
            left: -1rem;
            width: auto;
          }

          .date-picker-inputs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
