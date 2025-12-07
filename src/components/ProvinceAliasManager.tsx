"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, Upload, Download, Trash2, AlertTriangle, Copy } from "lucide-react";
import { type ThaiProvince, PROVINCE_ALIASES } from "@/lib/provinceMapper";

type AliasItem = { id: string; standard_th: ThaiProvince; alias: string; updated_at?: string | null };

type Props = {
  unmappedProvinces?: string[];
};

const thaiProvinces: ThaiProvince[] = Object.keys(PROVINCE_ALIASES) as ThaiProvince[];

export function ProvinceAliasManager({ unmappedProvinces = [] }: Props) {
  const [items, setItems] = useState<AliasItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ id?: string; standard_th: ThaiProvince | ""; alias: string }>({
    standard_th: "",
    alias: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/province-aliases", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
      setItems(data.items || []);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const handleSubmit = async () => {
    if (!form.standard_th || !form.alias.trim()) {
      setMessage({ type: "error", text: "กรุณากรอกจังหวัดและ alias" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/province-aliases${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standard_th: form.standard_th, alias: form.alias }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setMessage({ type: "success", text: "บันทึก alias สำเร็จ" });
      setForm({ standard_th: "", alias: "", id: undefined });
      load();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบ alias นี้?")) return;
    await fetch(`/api/province-aliases/${id}`, { method: "DELETE" });
    load();
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/province-aliases/import", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "นำเข้าไม่สำเร็จ" });
      return;
    }
    setMessage({ type: "success", text: "นำเข้าสำเร็จ" });
    load();
  };

  const handleExport = () => {
    window.open("/api/province-aliases/export?format=csv", "_blank");
  };

  const grouped = useMemo(() => {
    const map = new Map<ThaiProvince, { standard: ThaiProvince; aliases: AliasItem[] }>();
    items.forEach((it) => {
      const std = it.standard_th;
      if (!map.has(std)) map.set(std, { standard: std, aliases: [] });
      map.get(std)!.aliases.push(it);
    });
    return Array.from(map.values()).sort((a, b) => a.standard.localeCompare(b.standard));
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(grouped.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedGroups = grouped.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-blue-100 dark:border-slate-800 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-[#0d1528] dark:via-[#0f1b32] dark:to-[#0a1324] shadow-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Province Alias</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" /> จัดการจังหวัด
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-200 bg-white/70 dark:bg-[#0f1a2e] cursor-pointer hover:shadow">
              <Upload className="w-4 h-4" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                }}
              />
            </label>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-200 bg-white/70 dark:bg-[#0f1a2e] hover:shadow"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {unmappedProvinces && unmappedProvinces.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4" /> จังหวัดที่ยังไม่รู้จัก ({unmappedProvinces.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {unmappedProvinces.map((p) => (
                <span key={p} className="px-2 py-1 rounded-full bg-white border border-amber-200 text-xs">{p}</span>
              ))}
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(unmappedProvinces.join(", "))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-amber-300 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition"
            >
              <Copy className="w-3.5 h-3.5" /> คัดลอกรายการ
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={form.standard_th}
            onChange={(e) => setForm((f) => ({ ...f, standard_th: e.target.value as ThaiProvince }))}
            className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-white/80 dark:bg-[#0f1a2e] px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="">เลือกจังหวัดมาตรฐาน</option>
            {thaiProvinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            value={form.alias}
            onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
            placeholder="สะกด/ย่อ/ชื่อภาษาอังกฤษ"
            className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-white/80 dark:bg-[#0f1a2e] px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow hover:shadow-lg disabled:opacity-60"
            >
              <Plus className="w-4 h-4" /> {form.id ? "อัปเดต" : "เพิ่ม"} alias
            </button>
            {form.id && (
              <button
                onClick={() => setForm({ standard_th: "", alias: "", id: undefined })}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-semibold ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-blue-100 dark:border-slate-800 bg-white/90 dark:bg-[#0d1528]/95 shadow-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
          Alias ทั้งหมด ({grouped.length})
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-900 dark:text-slate-100">
            <thead className="bg-white/70 dark:bg-[#0f1a2e] text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">จังหวัด</th>
                <th className="px-4 py-3 text-left">Alias</th>
                <th className="px-4 py-3 text-right">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
              {paginatedGroups.map((group) => (
                <tr key={group.standard} className="hover:bg-blue-50/70 dark:hover:bg-[#101a2b] transition-colors align-top">
                  <td className="px-4 py-3 whitespace-nowrap font-semibold">{group.standard}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {group.aliases.map((alias) => (
                        <span
                          key={alias.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-200 border border-blue-100 dark:border-slate-700"
                        >
                          {alias.alias}
                          <button
                            onClick={() => handleDelete(alias.id)}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`ลบ ${alias.alias}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500 dark:text-slate-300">
                    {group.aliases.length}
                  </td>
                </tr>
              ))}
              {grouped.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">ยังไม่มี alias</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {grouped.length > PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-t border-blue-50 dark:border-slate-800 bg-white/70 dark:bg-[#0f1a2e] text-sm">
            <div className="text-slate-600 dark:text-slate-300">
              หน้า {currentPage} / {totalPages} • แสดงจังหวัด {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, grouped.length)} จาก {grouped.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-xl border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-200 bg-white/90 dark:bg-[#0f1a2e] disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-xl border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-200 bg-white/90 dark:bg-[#0f1a2e] disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
