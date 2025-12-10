"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type SVGProps } from "react";
import Image from "next/image";
import { toggleTheme } from "@/lib/theme";
import { SunIcon, MoonIcon, FilterIcon } from "@/components/ui/Icons";

const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ChartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

export default function NavbarPublic() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  const links = [
    { href: "/", label: "Dashboard", icon: HomeIcon },
    { href: "/product-sales", label: "ยอดขายสินค้า", icon: ChartIcon },
    { href: "/thailand-map", label: "ยอดขายรายจังหวัด", icon: MapIcon },
  ];

  useEffect(() => {
    const syncTheme = () => {
      const dark = document.body.classList.contains("dark-mode");
      setIsDark(dark);
    };
    syncTheme();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      if (detail) setIsDark(detail === "dark");
      else syncTheme();
    };
    window.addEventListener("theme-changed", handler as EventListener);
    return () => window.removeEventListener("theme-changed", handler as EventListener);
  }, []);

  return (
    <nav
      className="block fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ paddingTop: "var(--safe-area-top)" }}
    >
      <div
        className="absolute inset-0 border-b shadow-sm"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(15, 20, 32, 0.85) 0%, rgba(10, 14, 26, 0.85) 100%)"
            : "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.4)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-10 w-auto sm:h-12">
                <Image
                  src="/logokpf.png"
                  alt="KPF Logo"
                  width={120}
                  height={80}
                  className="h-10 w-auto sm:h-12 object-contain drop-shadow-lg transition-transform duration-200 group-hover:scale-105"
                  priority
                />
              </div>
              <span className="text-base sm:text-lg font-bold truncate">
                <span className="text-gradient-premium">Dashboard OL</span>
              </span>
            </Link>
            {/* Theme Toggle (matches filter design) */}
            <button
              onClick={() => {
                const next = toggleTheme();
                setIsDark(next === "dark");
              }}
              className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-xl border border-blue-100 bg-white/70 shadow-sm hover:shadow-md transition-all"
              title="สลับโหมดแสง/มืด"
              aria-label="Toggle theme"
              style={{
                boxShadow: isDark ? "0 0 12px rgba(251, 191, 36, 0.45)" : "0 0 12px rgba(99,102,241,0.35)",
                borderColor: isDark ? "rgba(251,191,36,0.5)" : "rgba(99,102,241,0.35)",
                background: isDark ? "rgba(251,191,36,0.12)" : "rgba(99,102,241,0.12)",
              }}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5" style={{ color: "#fbbf24", filter: "drop-shadow(0 0 4px rgba(251,191,36,0.7))" }} />
              ) : (
                <MoonIcon className="w-5 h-5" style={{ color: "#6366f1", filter: "drop-shadow(0 0 4px rgba(99,102,241,0.7))" }} />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100"
                      : isDark
                        ? "text-slate-100 hover:bg-white/10 hover:text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `}
                >
                  <link.icon className={`w-4 h-4 ${isActive ? "text-blue-500" : isDark ? "text-slate-400" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {(pathname === "/" || pathname === "/product-sales" || pathname === "/thailand-map") && (
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const eventName = pathname === "/"
                    ? "dashboard-filter-toggle"
                    : pathname === "/product-sales"
                    ? "product-sales-filter-toggle"
                    : "thailand-map-filter-toggle";
                  window.dispatchEvent(new Event(eventName));
                }
              }}
              className="p-2 rounded-lg border border-blue-100 text-slate-600 bg-white/70 hover:bg-blue-50 transition-all"
              title="ตัวกรอง"
              aria-label="Toggle filters"
              style={{ boxShadow: isDark ? "0 0 10px rgba(59,130,246,0.25)" : "0 0 10px rgba(59,130,246,0.2)" }}
            >
              <FilterIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              const next = toggleTheme();
              setIsDark(next === "dark");
            }}
              className="p-2 rounded-lg border border-blue-100 text-slate-600 bg-white/70 hover:bg-blue-50 transition-all"
              title="สลับโหมดแสง/มืด"
              aria-label="Toggle theme"
              style={{ boxShadow: isDark ? "0 0 10px rgba(251,191,36,0.4)" : "0 0 10px rgba(99,102,241,0.3)" }}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5" style={{ color: "#fbbf24", filter: "drop-shadow(0 0 4px rgba(251,191,36,0.7))" }} />
              ) : (
                <MoonIcon className="w-5 h-5" style={{ color: "#6366f1", filter: "drop-shadow(0 0 4px rgba(99,102,241,0.7))" }} />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 md:hidden shadow-lg animate-slide-down backdrop-blur-xl border-b"
          style={{
            top: "calc(64px + var(--safe-area-top))",
            background: isDark ? "rgba(10, 14, 26, 0.95)" : "rgba(255,255,255,0.95)",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(226, 232, 240, 1)"
          }}
        >
          <div className="px-4 py-3 space-y-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all
                    ${isActive
                      ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100"
                      : isDark
                        ? "text-slate-100 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? "text-blue-500" : isDark ? "text-slate-400" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
