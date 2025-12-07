"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChartIcon, UploadIcon, CheckIcon, InfoIcon } from "@/components/ui/Icons";

export default function EmptyState() {
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<"TikTok" | "Shopee" | "Lazada">("Shopee");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpload = async () => {
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
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "อัปโหลดไม่สำเร็จ" });
      } else {
        setMessage({
          type: "success",
          text: `อัปโหลดสำเร็จ! ${data.summary?.newRows || 0} แถวใหม่, ${data.summary?.updatedRows || 0} แถวอัปเดต`,
        });
        setFile(null);
        // Reload page after 2 seconds
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "2rem",
        paddingBottom: "2rem",
      }}
    >
      <div style={{ maxWidth: "600px", width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <ChartIcon className="w-12 h-12" style={{ color: "var(--accent-primary)" }} />
            <h1 style={{ margin: 0 }}>Dashboard OL</h1>
          </div>
          <p className="text-secondary" style={{ fontSize: "1.125rem" }}>
            ยินดีต้อนรับสู่ระบบจัดการข้อมูลยอดขาย
          </p>
        </div>

        {/* Info Card */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Card>
            <CardHeader
              title="เริ่มต้นใช้งาน"
              subtitle="อัปโหลดไฟล์ Excel เพื่อดูข้อมูล"
              icon={<InfoIcon className="w-6 h-6" style={{ color: "var(--info-500)" }} />}
            />
            <CardBody>
              <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.9375rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--accent-primary)", fontWeight: "600" }}>1.</span>
                  <span className="text-secondary">เตรียมไฟล์ Excel จาก Shopee, TikTok หรือ Lazada</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--accent-primary)", fontWeight: "600" }}>2.</span>
                  <span className="text-secondary">เลือกแพลตฟอร์มและไฟล์ในแบบฟอร์มด้านล่าง</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--accent-primary)", fontWeight: "600" }}>3.</span>
                  <span className="text-secondary">คลิก &quot;อัปโหลดข้อมูล&quot; และรอสักครู่</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--accent-primary)", fontWeight: "600" }}>4.</span>
                  <span className="text-secondary">ระบบจะแสดงผลข้อมูลและป้องกันการซ้ำอัตโนมัติ</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader
            title="อัปโหลดไฟล์ Excel"
            subtitle="เลือกแพลตฟอร์มและไฟล์ของคุณ"
            icon={
              <span style={{ color: "var(--accent-primary)" }}>
                <UploadIcon className="w-6 h-6" />
              </span>
            }
          />
          <CardBody>
            <div style={{ display: "grid", gap: "1rem" }}>
              {/* Platform Select */}
              <div>
                <label className="text-sm text-secondary" style={{ display: "block", marginBottom: "0.5rem" }}>
                  เลือกแพลตฟอร์ม
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as "TikTok" | "Shopee" | "Lazada")}
                  className="btn btn-secondary"
                  style={{ width: "100%", textAlign: "left" }}
                >
                  <option value="Shopee">Shopee</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Lazada">Lazada</option>
                </select>
              </div>

              {/* File Input */}
              <div>
                <label className="text-sm text-secondary" style={{ display: "block", marginBottom: "0.5rem" }}>
                  เลือกไฟล์ Excel (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    background: "var(--surface-secondary)",
                    border: "1px solid var(--border-secondary)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                />
                {file && (
                  <p className="text-sm text-tertiary" style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <CheckIcon className="w-4 h-4" style={{ color: "var(--success-500)" }} />
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              {/* Upload Button */}
              <Button onClick={handleUpload} loading={loading} disabled={!file || loading} icon={<UploadIcon className="w-5 h-5" />}>
                {loading ? "กำลังอัปโหลด..." : "อัปโหลดข้อมูล"}
              </Button>

              {/* Message */}
              {message && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    background: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${message.type === "success" ? "var(--success-500)" : "var(--error-500)"}`,
                    color: message.type === "success" ? "var(--success-500)" : "var(--error-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  {message.text}
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Footer Note */}
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <p className="text-tertiary" style={{ fontSize: "0.875rem" }}>
            ข้อมูลจะถูกบันทึกใน Supabase และมีระบบป้องกันการซ้ำซ้อนอัตโนมัติ
          </p>
        </div>
      </div>
    </main>
  );
}
