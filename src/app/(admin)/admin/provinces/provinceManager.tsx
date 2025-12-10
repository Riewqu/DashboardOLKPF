"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProvinceAliasManager } from "@/components/ProvinceAliasManager";

export default function ProvinceManager() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:scale-105 transition-transform duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Province Manager
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                จัดการชื่อย่อและ aliases ของจังหวัดทั้ง 77 จังหวัด
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-6 sm:p-8">
          <ProvinceAliasManager />
        </div>
      </div>
    </div>
  );
}
