"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  isDarkMode?: boolean;
};

export function Modal({ isOpen, onClose, title, children, size = "md", footer, isDarkMode = true }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    (
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
        }}
      >
        <div
          className={`modal-content modal-${size}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: isDarkMode
              ? "var(--surface-primary)"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
            backdropFilter: isDarkMode ? "none" : "blur(20px)",
            WebkitBackdropFilter: isDarkMode ? "none" : "blur(20px)",
            border: isDarkMode ? "none" : "1px solid rgba(255, 255, 255, 0.8)",
            borderRadius: "clamp(0px, 2vw, 24px)",
            maxWidth: size === "sm" ? "400px" : size === "lg" ? "800px" : size === "xl" ? "1200px" : "600px",
            width: "100%",
            maxHeight: "90vh",
            height: "auto",
            margin: "0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: isDarkMode
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
          }}
        >
          <style>{`
            @media (max-width: 768px) {
              .modal-overlay {
                padding: 0 !important;
                align-items: flex-start !important;
                justify-content: flex-start !important;
              }
              .modal-content {
                max-width: 100% !important;
                width: 100% !important;
                min-height: 100vh !important;
                height: 100vh !important;
                max-height: 100vh !important;
                border-radius: 0 !important;
                margin: 0 !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                padding-top: var(--safe-area-top, 0px);
                padding-bottom: var(--safe-area-bottom, 0px);
              }
              .modal-header {
                padding: calc(1rem + var(--safe-area-top, 0px)) 1rem 1rem 1rem !important;
                flex-shrink: 0 !important;
              }
              .modal-body {
                padding: 1rem 1rem calc(1rem + var(--safe-area-bottom, 0px)) 1rem !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                min-height: 0 !important;
              }
              .modal-footer {
                padding: 1rem !important;
                flex-shrink: 0 !important;
              }
            }
          `}</style>
          <div
            className="modal-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "clamp(1rem, 3vw, 1.5rem)",
              borderBottom: "1px solid var(--border-primary)",
              flexShrink: 0,
            }}
          >
            <h2
              className="modal-title"
              style={{
                margin: 0,
                fontSize: "clamp(1.125rem, 3vw, 1.5rem)",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >{title}</h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ color: "var(--text-tertiary)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            </button>
          </div>
          <div
            className="modal-body"
            style={{
              padding: "clamp(1rem, 3vw, 1.5rem)",
              overflowY: "auto",
              flex: 1,
            }}
          >{children}</div>
          {footer && (
            <div
              className="modal-footer"
              style={{
                padding: "clamp(1rem, 3vw, 1.5rem)",
                borderTop: "1px solid var(--border-primary)",
                flexShrink: 0,
              }}
            >{footer}</div>
          )}
        </div>
      </div>
    ),
    document.body
  );
}
