"use client";

import { useState } from "react";
import {
  Database,
  ShoppingBag,
  ArrowLeft,
  FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import PlatformUpload from "./components/PlatformUpload";
import ProductSalesUpload from "./components/ProductSalesUpload";
import UploadHistory from "./components/UploadHistory";

type UploadItem = {
  file: string;
  rows: number;
  status: string;
  settlement: number;
  platform: string;
  created_at?: string | null
};

type Props = {
  recentUploads: UploadItem[];
};

export default function UploadCenter({ recentUploads }: Props) {
  const [activeTab, setActiveTab] = useState<"platform" | "product">("platform");

  const tabs = [
    {
      id: "platform" as const,
      label: "Platform Data",
      icon: <Database className="w-5 h-5" />,
      description: "TikTok, Shopee, Lazada"
    },
    {
      id: "product" as const,
      label: "Product Sales",
      icon: <ShoppingBag className="w-5 h-5" />,
      description: "ยอดขายสินค้า"
    }
  ];

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
                Upload Center
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                อัปโหลดข้อมูลแพลตฟอร์มและยอดขายสินค้า
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Excel Only</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg"
                  : "border-blue-100 bg-white/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl transition-colors duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                      : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                  }`}>
                    {tab.icon}
                  </div>
                  <div className="text-left">
                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                      activeTab === tab.id ? "text-blue-600" : "text-slate-800 group-hover:text-blue-600"
                    }`}>
                      {tab.label}
                    </h3>
                    <p className="text-sm text-slate-600">{tab.description}</p>
                  </div>
                </div>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Upload Forms */}
        <div className="mb-8">
          {activeTab === "platform" && <PlatformUpload />}
          {activeTab === "product" && <ProductSalesUpload />}
        </div>

        {/* Upload History */}
        <UploadHistory recentUploads={recentUploads} />
      </div>
    </div>
  );
}
