"use client";

import { useState } from "react";
import {
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  TrendingUp,
  DollarSign
} from "lucide-react";

type PreviewSummary = {
  summary?: {
    totalRows: number;
    revenue: number;
    fees: number;
    adjustments: number;
    settlement: number;
  };
  warnings?: string[];
  notice?: string;
  ok?: boolean;
};

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PlatformUpload() {
  const [platform, setPlatform] = useState<"TikTok" | "Shopee" | "Lazada">("Shopee");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const platforms = [
    { value: "Shopee" as const, label: "Shopee", color: "from-orange-500 to-red-500", bg: "bg-orange-50" },
    { value: "TikTok" as const, label: "TikTok", color: "from-pink-500 to-purple-500", bg: "bg-pink-50" },
    { value: "Lazada" as const, label: "Lazada", color: "from-blue-500 to-indigo-500", bg: "bg-blue-50" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setShowPreview(false);
      setMessage(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setMessage({ type: "error", text: "กรุณาเลือกไฟล์" });
      return;
    }
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", platform);
    try {
      const res = await fetch("/api/upload/preview", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "อ่านไฟล์ไม่สำเร็จ" });
        return;
      }
      setPreview(data);
      setShowPreview(true);
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", platform);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "อัปโหลดไม่สำเร็จ" });
        return;
      }
      setMessage({ type: "success", text: data.notice || "อัปโหลดสำเร็จ" });
      setFile(null);
      setPreview(null);
      setShowPreview(false);
      // Reload page after 1.5s to show new upload
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Platform Data Upload</h2>
          <p className="text-sm text-slate-600">อัปโหลดข้อมูลธุรกรรมจากแพลตฟอร์ม</p>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          เลือกแพลตฟอร์ม
        </label>
        <div className="grid grid-cols-3 gap-3">
          {platforms.map((p) => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                platform === p.value
                  ? `border-transparent bg-gradient-to-br ${p.color} text-white shadow-lg`
                  : `border-blue-100 ${p.bg} hover:border-blue-300`
              }`}
            >
              <span className="font-semibold">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          เลือกไฟล์ Excel (.xlsx)
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
            id="platform-file"
          />
          <label
            htmlFor="platform-file"
            className="flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer transition-all duration-300"
          >
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span className="text-blue-700 font-medium">
              {file ? file.name : "คลิกเพื่อเลือกไฟล์"}
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePreview}
          disabled={!file || loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Eye className="w-5 h-5" />
          {loading ? "กำลังอ่าน..." : "ดูตัวอย่าง"}
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Upload className="w-5 h-5" />
          {loading ? "กำลังอัปโหลด..." : "อัปโหลดเลย"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <span className={message.type === "success" ? "text-green-700" : "text-red-700"}>
            {message.text}
          </span>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && preview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-t-3xl flex items-center justify-between">
              <h3 className="text-2xl font-bold">ตัวอย่างข้อมูล</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {preview.summary && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-slate-600">แถวทั้งหมด</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {preview.summary.totalRows.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-slate-600">ยอดโอน</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {currency(preview.summary.settlement)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-slate-600">รายได้</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {currency(preview.summary.revenue)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-slate-600">ค่าธรรมเนียม</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {currency(preview.summary.fees)}
                    </p>
                  </div>
                </div>
              )}
              {preview.warnings && preview.warnings.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">คำเตือน</h4>
                  <ul className="space-y-1">
                    {preview.warnings.map((w, i) => (
                      <li key={i} className="text-sm text-yellow-700">
                        • {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {loading ? "กำลังอัปโหลด..." : "ยืนยันอัปโหลด"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
