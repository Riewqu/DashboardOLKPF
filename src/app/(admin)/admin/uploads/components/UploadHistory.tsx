"use client";

import { Clock, CheckCircle2, AlertCircle, Database, FileSpreadsheet } from "lucide-react";

type UploadItem = {
  file: string;
  rows: number;
  status: string;
  settlement: number;
  platform: string;
  created_at?: string | null;
};

type Props = {
  recentUploads: UploadItem[];
};

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const getPlatformColor = (platform: string) => {
  const lower = platform.toLowerCase();
  if (lower.includes("shopee")) return "from-orange-500 to-red-500";
  if (lower.includes("tiktok")) return "from-pink-500 to-purple-500";
  if (lower.includes("lazada")) return "from-blue-500 to-indigo-500";
  return "from-slate-500 to-slate-600";
};

export default function UploadHistory({ recentUploads }: Props) {
  if (recentUploads.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Upload History</h2>
            <p className="text-sm text-slate-600">ประวัติการอัปโหลดข้อมูลทั้งหมด</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Database className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">ยังไม่มีประวัติการอัปโหลด</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Upload History</h2>
            <p className="text-sm text-slate-600">ประวัติการอัปโหลดล่าสุด {recentUploads.length} รายการ</p>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-blue-100">
              <th className="text-left py-4 px-4 font-semibold text-slate-700">Platform</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-700">File</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-700">Rows</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-700">Settlement</th>
              <th className="text-center py-4 px-4 font-semibold text-slate-700">Status</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentUploads.map((item, index) => (
              <tr
                key={index}
                className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors duration-200"
              >
                <td className="py-4 px-4">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getPlatformColor(
                      item.platform
                    )} text-white text-sm font-semibold shadow-sm`}
                  >
                    {item.platform}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-slate-700 text-sm truncate max-w-xs">{item.file}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-slate-700 font-medium">{item.rows.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-slate-700 font-medium">{currency(item.settlement)}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    {item.status === "completed" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">สำเร็จ</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">{item.status}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm text-slate-600">{formatDate(item.created_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {recentUploads.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getPlatformColor(
                  item.platform
                )} text-white text-sm font-semibold shadow-sm`}
              >
                {item.platform}
              </div>
              {item.status === "completed" ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">สำเร็จ</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700">{item.status}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 truncate">{item.file}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">จำนวนแถว:</span>
                <span className="font-medium text-slate-800">{item.rows.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">ยอดโอน:</span>
                <span className="font-medium text-slate-800">{currency(item.settlement)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-blue-100">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(item.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
