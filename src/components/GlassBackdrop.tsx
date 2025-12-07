"use client";

export function GlassBackdrop({ isDark }: { isDark: boolean }) {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(6,9,16,0.9) 0%, rgba(8,12,22,0.86) 50%, rgba(5,8,14,0.9) 100%)"
            : "linear-gradient(to bottom right, #e0f2fe, #ffffff)",
          zIndex: -2,
        }}
      />
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ opacity: isDark ? 0.15 : 0.2 }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ opacity: isDark ? 0.15 : 0.2, animationDelay: "2s" }} />
        {!isDark && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ opacity: 0.08, animationDelay: "4s" }} />
        )}
      </div>
    </>
  );
}
