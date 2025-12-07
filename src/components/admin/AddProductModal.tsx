"use client";

import { useState, type SVGProps } from "react";

// Icons
const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

type QuickRow = { id: string; name: string; shopee: string; tiktok: string; lazada: string; sku: string };

type Props = {
  onClose: () => void;
  onSave: (rows: QuickRow[]) => Promise<void>;
};

export default function AddProductModal({ onClose, onSave }: Props) {
  const [quickRows, setQuickRows] = useState<QuickRow[]>([
    { id: "qr-1", name: "", shopee: "", tiktok: "", lazada: "", sku: "" },
    { id: "qr-2", name: "", shopee: "", tiktok: "", lazada: "", sku: "" },
    { id: "qr-3", name: "", shopee: "", tiktok: "", lazada: "", sku: "" }
  ]);
  const [saving, setSaving] = useState(false);

  const updateQuickRow = (id: string, field: "name" | "shopee" | "tiktok" | "lazada" | "sku", value: string) => {
    setQuickRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addQuickRow = () => {
    setQuickRows((prev) => [...prev, { id: `qr-${Date.now()}-${Math.random()}`, name: "", shopee: "", tiktok: "", lazada: "", sku: "" }]);
  };

  const removeQuickRow = (id: string) => {
    setQuickRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const handleSave = async () => {
    const filledRows = quickRows.filter((r) => r.name.trim());
    if (filledRows.length === 0) {
      alert("กรุณากรอกชื่อสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    setSaving(true);
    try {
      await onSave(filledRows);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn overflow-y-auto flex items-center justify-center p-0 md:p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] md:rounded-2xl bg-white shadow-2xl animate-scaleIn flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300 px-4 md:px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">เพิ่มสินค้าใหม่</h2>
                <p className="text-sm text-blue-50">กรอกข้อมูลสินค้าและรหัสแต่ละแพลตฟอร์ม</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
            >
              <CloseIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="space-y-4">
              {/* Header row - แสดงเฉพาะบนหน้าจอใหญ่ */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <div className="col-span-3 text-sm font-bold text-gray-700">ชื่อสินค้า *</div>
                <div className="col-span-2 text-sm font-bold text-orange-700 flex items-center gap-1">
                  <img src="/Shopee.png" alt="Shopee" className="w-4 h-4" />
                  Shopee Code
                </div>
                <div className="col-span-2 text-sm font-bold text-red-700 flex items-center gap-1">
                  <img src="/Tiktok.png" alt="TikTok" className="w-4 h-4" />
                  TikTok Code
                </div>
                <div className="col-span-2 text-sm font-bold text-blue-700 flex items-center gap-1">
                  <img src="/Lazada.png" alt="Lazada" className="w-4 h-4" />
                  Lazada Code
                </div>
                <div className="col-span-2 text-sm font-bold text-gray-700">SKU</div>
                <div className="col-span-1 text-sm font-bold text-gray-700 text-center">ลบ</div>
              </div>

              {/* Rows */}
              {quickRows.map((row) => (
                <div key={row.id} className="bg-gradient-to-br from-white to-gray-50/50 p-4 rounded-xl border-2 border-gray-200/50 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    {/* ชื่อสินค้า */}
                    <div className="lg:col-span-3">
                      <label className="block lg:hidden text-xs font-bold text-gray-700 mb-1">ชื่อสินค้า *</label>
                      <input
                        value={row.name}
                        onChange={(e) => updateQuickRow(row.id, "name", e.target.value)}
                        placeholder="ชื่อสินค้า *"
                        className="w-full px-3 py-2.5 rounded-lg bg-white border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all text-sm text-gray-900 font-medium"
                      />
                    </div>

                    {/* Shopee Code */}
                    <div className="lg:col-span-2">
                      <label className="block lg:hidden text-xs font-bold text-orange-700 mb-1 flex items-center gap-1">
                        <img src="/Shopee.png" alt="Shopee" className="w-4 h-4" />
                        Shopee Code
                      </label>
                      <input
                        value={row.shopee}
                        onChange={(e) => updateQuickRow(row.id, "shopee", e.target.value)}
                        placeholder="Shopee"
                        className="w-full px-3 py-2.5 rounded-lg bg-orange-50 border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-sm text-gray-900 font-mono"
                      />
                    </div>

                    {/* TikTok Code */}
                    <div className="lg:col-span-2">
                      <label className="block lg:hidden text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                        <img src="/Tiktok.png" alt="TikTok" className="w-4 h-4" />
                        TikTok Code
                      </label>
                      <input
                        value={row.tiktok}
                        onChange={(e) => updateQuickRow(row.id, "tiktok", e.target.value)}
                        placeholder="TikTok"
                        className="w-full px-3 py-2.5 rounded-lg bg-red-50 border-2 border-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all text-sm text-gray-900 font-mono"
                      />
                    </div>

                    {/* Lazada Code */}
                    <div className="lg:col-span-2">
                      <label className="block lg:hidden text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
                        <img src="/Lazada.png" alt="Lazada" className="w-4 h-4" />
                        Lazada Code
                      </label>
                      <input
                        value={row.lazada}
                        onChange={(e) => updateQuickRow(row.id, "lazada", e.target.value)}
                        placeholder="Lazada"
                        className="w-full px-3 py-2.5 rounded-lg bg-blue-50 border-2 border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm text-gray-900 font-mono"
                      />
                    </div>

                    {/* SKU */}
                    <div className="lg:col-span-2">
                      <label className="block lg:hidden text-xs font-bold text-gray-700 mb-1">SKU</label>
                      <input
                        value={row.sku}
                        onChange={(e) => updateQuickRow(row.id, "sku", e.target.value)}
                        placeholder="SKU"
                        className="w-full px-3 py-2.5 rounded-lg bg-white border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all text-sm text-gray-900 font-mono"
                      />
                    </div>

                    {/* Delete button */}
                    <div className="lg:col-span-1 flex items-end lg:items-center justify-end lg:justify-center">
                      <button
                        onClick={() => removeQuickRow(row.id)}
                        className="p-2.5 rounded-lg text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-400 transition-all shadow-sm hover:shadow-md hover:scale-110"
                        title="ลบแถว"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Row Button */}
              <button
                onClick={addQuickRow}
                className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                เพิ่มแถว
              </button>
            </div>
          </div>

          {/* Footer - ปุ่มยืนยัน/ยกเลิก */}
          <div className="flex-shrink-0 px-4 md:px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 shadow-lg"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  บันทึกทั้งหมด ({quickRows.filter(r => r.name.trim()).length} รายการ)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
