"use client";

import Link from "next/link";
import {
  Upload,
  Target,
  MapPin,
  Package,
  ArrowRight,
  TrendingUp,
  Database,
  BarChart3
} from "lucide-react";

type AdminCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  stats?: string;
  color: string;
  gradient: string;
};

export default function AdminDashboard() {
  const cards: AdminCard[] = [
    {
      title: "Upload Center",
      description: "อัปโหลดข้อมูลแพลตฟอร์มและยอดขายสินค้า พร้อมดูประวัติการอัปโหลดทั้งหมด",
      icon: <Upload className="w-8 h-8" />,
      href: "/admin/uploads",
      stats: "Platform & Product Data",
      color: "from-blue-500 to-cyan-500",
      gradient: "bg-gradient-to-br from-blue-50 to-cyan-50"
    },
    {
      title: "Goals Management",
      description: "ตั้งและติดตามเป้าหมายรายเดือน วิเคราะห์ความคืบหน้าของแต่ละแพลตฟอร์ม",
      icon: <Target className="w-8 h-8" />,
      href: "/admin/goals",
      stats: "Revenue & Profit Targets",
      color: "from-indigo-500 to-purple-500",
      gradient: "bg-gradient-to-br from-indigo-50 to-purple-50"
    },
    {
      title: "Province Manager",
      description: "จัดการชื่อย่อและ aliases ของจังหวัดทั้ง 77 จังหวัด สำหรับการแมปข้อมูลยอดขาย",
      icon: <MapPin className="w-8 h-8" />,
      href: "/admin/provinces",
      stats: "77 Thai Provinces",
      color: "from-emerald-500 to-teal-500",
      gradient: "bg-gradient-to-br from-emerald-50 to-teal-50"
    },
    {
      title: "Product Mapping",
      description: "จัดการข้อมูลสินค้าและแมปรหัสสินค้าจากแต่ละแพลตฟอร์มเข้ากับระบบภายใน",
      icon: <Package className="w-8 h-8" />,
      href: "/admin/product-map",
      stats: "Product Master Data",
      color: "from-orange-500 to-rose-500",
      gradient: "bg-gradient-to-br from-orange-50 to-rose-50"
    }
  ];

  const quickStats = [
    { label: "Total Uploads Today", value: "0", icon: <Database className="w-5 h-5" /> },
    { label: "Active Goals", value: "0", icon: <Target className="w-5 h-5" /> },
    { label: "Products Mapped", value: "0", icon: <Package className="w-5 h-5" /> },
    { label: "Revenue This Month", value: "฿0", icon: <TrendingUp className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                จัดการระบบและข้อมูลทั้งหมดในที่เดียว
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">System Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">{stat.value}</p>
                </div>
                <div className="text-blue-500">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, index) => (
            <Link
              key={index}
              href={card.href}
              className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              {/* Gradient Background Overlay */}
              <div className={`absolute inset-0 ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

              {/* Content */}
              <div className="relative p-8">
                {/* Icon Container */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${card.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {card.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {card.description}
                </p>

                {/* Stats Badge */}
                {card.stats && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-sm text-blue-700 font-medium mb-6">
                    <BarChart3 className="w-4 h-4" />
                    <span>{card.stats}</span>
                  </div>
                )}

                {/* Arrow Button */}
                <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-4 transition-all duration-300">
                  <span>เข้าสู่หน้า</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            </Link>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">ระบบพร้อมใช้งาน</p>
                <p className="text-xs text-slate-600">เชื่อมต่อกับ Supabase สำเร็จ</p>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              <p>Version 1.0.2 • Last updated: {new Date().toLocaleDateString('th-TH')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
