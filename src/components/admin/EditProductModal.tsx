"use client";

import { useState, type SVGProps } from "react";
import type { ProductMasterRow } from "@/app/(admin)/admin/product-map/page";
import ProductImageUpload from "./ProductImageUpload";

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

const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

type Props = {
  product: ProductMasterRow;
  onClose: () => void;
  onSave: (updated: Partial<ProductMasterRow>) => Promise<void>;
  onImageUpdate: (imageUrl: string | null) => void;
};

export default function EditProductModal({ product, onClose, onSave, onImageUpdate }: Props) {
  const [shopeeCode, setShopeeCode] = useState(product.shopee_code || "");
  const [tiktokCode, setTiktokCode] = useState(product.tiktok_code || "");
  const [lazadaCode, setLazadaCode] = useState(product.lazada_code || "");
  const [sku, setSku] = useState(product.sku || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        shopee_code: shopeeCode || null,
        tiktok_code: tiktokCode || null,
        lazada_code: lazadaCode || null,
        sku: sku || null,
      });
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn overflow-y-auto flex items-center justify-center p-0 md:p-4"
        onClick={onClose}
      >
        {/* Modal - เต็มหน้าจอบนมือถือ, กลางจอบน desktop */}
        <div
          className="w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] md:rounded-2xl bg-white shadow-2xl animate-scaleIn flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header - Gradient น้ำเงิน-ฟ้า-ขาว */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300 px-4 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">แก้ไขรายการสินค้า</h2>
              <p className="text-sm text-blue-50">{product.name}</p>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* รูปภาพสินค้า */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
            <ProductImageUpload
              productId={product.id}
              productName={product.name}
              currentImageUrl={product.image_url}
              onUploadSuccess={onImageUpdate}
              onDeleteSuccess={() => onImageUpdate(null)}
              compact={false}
            />
          </div>

          {/* รหัสสินค้าแต่ละแพลตฟอร์ม */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              รหัสสินค้าตามแพลตฟอร์ม
            </h3>

            {/* Shopee */}
            <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-orange-700 mb-2">
                <img src="/Shopee.png" alt="Shopee" className="w-5 h-5" />
                Shopee Code
              </label>
              <input
                type="text"
                value={shopeeCode}
                onChange={(e) => setShopeeCode(e.target.value)}
                placeholder="ใส่รหัสสินค้า Shopee"
                className="w-full px-4 py-3 rounded-lg bg-white border-2 border-orange-200 text-gray-900 font-mono text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
              />
            </div>

            {/* TikTok */}
            <div className="bg-red-50/50 rounded-xl p-4 border border-red-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-2">
                <img src="/Tiktok.png" alt="TikTok" className="w-5 h-5" />
                TikTok Code
              </label>
              <input
                type="text"
                value={tiktokCode}
                onChange={(e) => setTiktokCode(e.target.value)}
                placeholder="ใส่รหัสสินค้า TikTok"
                className="w-full px-4 py-3 rounded-lg bg-white border-2 border-red-200 text-gray-900 font-mono text-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all"
              />
            </div>

            {/* Lazada */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200">
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-2">
                <img src="/Lazada.png" alt="Lazada" className="w-5 h-5" />
                Lazada Code
              </label>
              <input
                type="text"
                value={lazadaCode}
                onChange={(e) => setLazadaCode(e.target.value)}
                placeholder="ใส่รหัสสินค้า Lazada"
                className="w-full px-4 py-3 rounded-lg bg-white border-2 border-blue-200 text-gray-900 font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* SKU */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                SKU (Internal)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ใส่รหัส SKU ภายใน"
                className="w-full px-4 py-3 rounded-lg bg-white border-2 border-gray-200 text-gray-900 font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* อัปเดตล่าสุด */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockIcon className="w-5 h-5 text-blue-500" />
              <span>อัปเดตล่าสุด:</span>
              <span className="font-semibold text-gray-900">{formatDate(product.updated_at ?? undefined)}</span>
            </div>
          </div>
        </div>

        {/* Footer - ปุ่มยืนยัน/ยกเลิก */}
        <div className="flex-shrink-0 px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5" />
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
