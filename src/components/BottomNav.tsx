"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Home,
  ShoppingBag,
  MapPin,
  Settings,
  LayoutDashboard,
  Upload,
  Target,
  Map as MapIcon,
  Package
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  section: "public" | "admin";
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminSection = pathname.startsWith("/admin");
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  // Public section navigation
  const publicLinks: NavItem[] = [
    { href: "/", label: "หน้าแรก", icon: Home, section: "public" },
    { href: "/product-sales", label: "ยอดขาย", icon: ShoppingBag, section: "public" },
    { href: "/thailand-map", label: "แผนที่", icon: MapPin, section: "public" },
    { href: "/admin", label: "จัดการ", icon: Settings, section: "public" },
  ];

  // Admin section navigation
  const adminLinks: NavItem[] = [
    { href: "/admin", label: "Admin", icon: LayoutDashboard, section: "admin" },
    { href: "/admin/uploads", label: "อัปโหลด", icon: Upload, section: "admin" },
    { href: "/admin/goals", label: "เป้าหมาย", icon: Target, section: "admin" },
    { href: "/admin/provinces", label: "จังหวัด", icon: MapIcon, section: "admin" },
    { href: "/admin/product-map", label: "สินค้า", icon: Package, section: "admin" },
  ];

  const links = isAdminSection ? adminLinks : publicLinks;

  // Find active index
  useEffect(() => {
    const index = links.findIndex((link) => {
      if (link.href === "/" || link.href === "/admin") {
        return pathname === link.href;
      }
      return pathname.startsWith(link.href);
    });
    setActiveIndex(index >= 0 ? index : 0);
  }, [pathname, links]);

  // Swipe gesture detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeIndex < links.length - 1) {
      // Swipe left -> next page
      router.push(links[activeIndex + 1].href);
    }

    if (isRightSwipe && activeIndex > 0) {
      // Swipe right -> previous page
      router.push(links[activeIndex - 1].href);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Attach swipe listeners to document
  useEffect(() => {
    const handleDocumentTouchStart = (e: TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
    };

    const handleDocumentTouchMove = (e: TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleDocumentTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 75;
      const isRightSwipe = distance < -75;

      if (isLeftSwipe && activeIndex < links.length - 1) {
        router.push(links[activeIndex + 1].href);
      }

      if (isRightSwipe && activeIndex > 0) {
        router.push(links[activeIndex - 1].href);
      }

      setTouchStart(0);
      setTouchEnd(0);
    };

    document.addEventListener('touchstart', handleDocumentTouchStart);
    document.addEventListener('touchmove', handleDocumentTouchMove);
    document.addEventListener('touchend', handleDocumentTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleDocumentTouchStart);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, [touchStart, touchEnd, activeIndex, links, router]);

  return (
    <>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation Bar - Only on mobile */}
      <nav
        ref={navRef}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient background with blur */}
        <div className="relative h-20">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/98 to-white/95 backdrop-blur-2xl" />

          {/* Animated top border */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer" />
          </div>

          {/* Floating orbs background animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-float" />
            <div className="absolute -top-10 right-20 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl animate-float-delay" />
          </div>

          <div className="relative h-full px-2">
            <div className="flex items-center justify-around h-full max-w-md mx-auto">
              {links.map((link, index) => {
                const isActive = index === activeIndex;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex flex-col items-center justify-center flex-1 h-full group relative"
                  >
                    {/* Active Indicator - Animated */}
                    {isActive && (
                      <>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full animate-pulse-slow" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full blur-sm animate-pulse-slow" />
                      </>
                    )}

                    {/* Icon Container with 3D effect */}
                    <div
                      className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 ease-out transform ${
                        isActive
                          ? "bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 shadow-2xl shadow-blue-500/50 scale-110 -translate-y-1"
                          : "bg-slate-100/80 group-hover:bg-blue-50 group-hover:scale-105 group-active:scale-95"
                      }`}
                      style={{
                        boxShadow: isActive
                          ? "0 8px 25px -5px rgba(59, 130, 246, 0.5), 0 0 20px rgba(6, 182, 212, 0.3)"
                          : "none"
                      }}
                    >
                      {/* Glow effect */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 blur-md opacity-50 animate-pulse" />
                      )}

                      <Icon
                        className={`relative z-10 transition-all duration-300 ${
                          isActive
                            ? "w-6 h-6 text-white drop-shadow-lg"
                            : "w-5 h-5 text-slate-600 group-hover:text-blue-600"
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />

                      {/* Ripple effect on active */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-ping opacity-20" />
                      )}
                    </div>

                    {/* Label with smooth transition */}
                    <span
                      className={`text-xs font-semibold mt-1.5 transition-all duration-300 ${
                        isActive
                          ? "text-blue-600 scale-105"
                          : "text-slate-600 group-hover:text-blue-600"
                      }`}
                    >
                      {link.label}
                    </span>

                    {/* Touch feedback */}
                    <span className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 bg-blue-500/10 transition-opacity duration-150" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Slide indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5">
            {links.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-6 bg-gradient-to-r from-blue-500 to-cyan-500"
                    : "w-1 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.1); }
          }
          @keyframes float-delay {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-15px) scale(1.05); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-shimmer {
            animation: shimmer 3s infinite;
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-float-delay {
            animation: float-delay 8s ease-in-out infinite;
          }
          .animate-pulse-slow {
            animation: pulse-slow 2s ease-in-out infinite;
          }
        `}</style>
      </nav>
    </>
  );
}
