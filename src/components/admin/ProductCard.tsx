"use client";

import { type SVGProps } from "react";
import type { ProductMasterRow } from "@/app/(admin)/admin/product-map/page";

// Icons
const EditIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

type Props = {
  product: ProductMasterRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
};

export default function ProductCard({ product, onEdit, onDelete, onToggleActive }: Props) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border-2 border-gray-200/50 hover:border-blue-300 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
      {/* รูปภาพ + สถานะ */}
      <div className="relative p-4 bg-white">
        {/* Toggle Switch มุมขวาบน */}
        <button
          onClick={onToggleActive}
          className={`absolute top-2 right-2 z-10 relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 shadow-lg ${
            product.is_active !== false ? 'bg-green-500' : 'bg-gray-300'
          }`}
          title={product.is_active !== false ? "เปิดใช้งาน - คลิกเพื่อปิด" : "ปิดใช้งาน - คลิกเพื่อเปิด"}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
              product.is_active !== false ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>

        {/* รูปภาพสินค้า - ตรงกลาง */}
        <div className="flex items-center justify-center mb-3">
          {product.image_url ? (
            <div className="relative group">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-32 h-32 object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center border-2 border-dashed border-blue-200">
              <svg className="w-16 h-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ชื่อสินค้า */}
      <div className="px-4 py-3 border-t border-gray-100">
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
      </div>

      {/* ปุ่มแก้ไข/ลบ */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg"
        >
          <EditIcon className="w-5 h-5" />
          <span>แก้ไข</span>
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-400 text-white hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          title="ลบรายการ"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
