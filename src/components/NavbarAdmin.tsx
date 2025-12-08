"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type SVGProps } from "react";

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

const ShieldIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const MapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

export default function NavbarAdmin() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/admin", label: "CMS Home", icon: ShieldIcon },
    { href: "/admin/product-map", label: "Product Map", icon: MapIcon },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full overflow-visible"
      style={{ paddingTop: "var(--safe-area-top)" }}
    >
      <div className="absolute inset-0 liquid-glass border-b border-white/40 shadow-sm" />

      <div className="relative w-full px-3 sm:px-4 md:px-6 lg:px-8 overflow-visible">
        <div className="flex items-center justify-between h-16">
          <Link href="/admin" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              CMS
            </div>
            <span className="text-lg font-bold text-slate-800">
              Admin Console
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-slate-900 text-white shadow-sm ring-1 ring-indigo-200"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `}
                >
                  <link.icon className={`w-4 h-4 ${isActive ? "text-indigo-100" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 md:hidden shadow-lg animate-slide-down"
          style={{ zIndex: 60, overflow: "visible", top: "calc(64px + var(--safe-area-top))" }}
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
                      ? "bg-slate-900 text-white shadow-sm ring-1 ring-indigo-200"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? "text-indigo-100" : "text-slate-500"}`} />
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
