"use client";

import { useState, useRef, type SVGProps } from "react";

const ImageIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// ไอคอนกากบาท (X) สวยๆ โทนน้ำเงิน
const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ไอคอนถังขยะสวยๆ
const TrashIconGradient = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// ไอคอนเช็คสวยๆ
const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

type Props = {
  productId: string;
  productName: string;
  currentImageUrl?: string | null;
  onUploadSuccess: (imageUrl: string) => void;
  onDeleteSuccess: () => void;
  compact?: boolean;
};

export default function ProductImageUpload({
  productId,
  productName,
  currentImageUrl,
  onUploadSuccess,
  onDeleteSuccess,
  compact = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป (สูงสุด 5MB)");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("product_id", productId);

      const res = await fetch("/api/product-master/upload-image", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "อัปโหลดไม่สำเร็จ");
      }

      onUploadSuccess(json.image_url);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/product-master/upload-image?product_id=${productId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "ลบไม่สำเร็จ");
      }

      onDeleteSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  const handleImageClick = () => {
    if (!uploading && !deleting) {
      fileInputRef.current?.click();
    }
  };

  if (compact) {
    // Compact mode - คลิกที่รูปเพื่อเปลี่ยน
    return (
      <>
        <div className="flex items-center gap-2">
          {currentImageUrl || preview ? (
            <div className="relative group">
              {/* รูปภาพ - คลิกเพื่อเปลี่ยน */}
              <div
                onClick={handleImageClick}
                className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all bg-white/50 backdrop-blur-sm flex items-center justify-center"
                title="คลิกเพื่อเปลี่ยนรูป"
              >
                <img
                  src={preview || currentImageUrl || ""}
                  alt={productName}
                  className="w-full h-full object-contain p-1"
                />
              </div>

              {/* ปุ่มลบมุมขวาบน - โทนน้ำเงิน-ขาว */}
              {!uploading && !deleting && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:scale-110 hover:shadow-xl"
                  title="ลบรูป"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Loading overlay */}
              {(uploading || deleting) && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-cyan-400/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ) : (
            /* ไม่มีรูป - แสดงกล่องอัปโหลด */
            <div
              onClick={handleImageClick}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center text-gray-400 hover:text-blue-500 cursor-pointer transition-all hover:bg-blue-50/50"
              title="คลิกเพื่อเพิ่มรูป"
            >
              <ImageIcon className="w-8 h-8" />
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading || deleting}
            className="hidden"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmModal
            productName={productName}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </>
    );
  }

  // Full mode - แสดงรูปใหญ่พร้อม UI สวยๆ
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">รูปภาพสินค้า</h4>
        </div>

        {currentImageUrl || preview ? (
          <div className="relative rounded-xl overflow-hidden bg-white p-4 border border-gray-200 group">
            {/* รูปภาพ - คลิกเพื่อเปลี่ยน */}
            <div
              onClick={handleImageClick}
              className="cursor-pointer"
              title="คลิกเพื่อเปลี่ยนรูป"
            >
              <img
                src={preview || currentImageUrl || ""}
                alt={productName}
                className="w-full h-48 object-contain"
                style={{
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                }}
              />
            </div>

            {/* ปุ่มลบมุมขวาบน - โทนน้ำเงิน-ขาว */}
            {!uploading && !deleting && currentImageUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:scale-110 hover:shadow-xl"
                title="ลบรูป"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}

            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-cyan-400/80 flex items-center justify-center backdrop-blur-sm">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={handleImageClick}
            className="rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 p-8 text-center cursor-pointer transition-all hover:bg-blue-50/50"
            title="คลิกเพื่อเพิ่มรูป"
          >
            <ImageIcon className="w-12 h-12 text-gray-400 hover:text-blue-500 mx-auto mb-3 transition-colors" />
            <p className="text-sm text-gray-500 mb-4">คลิกเพื่อเพิ่มรูปภาพสินค้า</p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading || deleting}
          className="hidden"
        />

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500">
          รองรับ JPG, PNG, WebP | สูงสุด 5MB
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          productName={productName}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmModal({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        {/* Header - โทนน้ำเงินไล่ขาว */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrashIconGradient className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ยืนยันการลบรูปภาพ</h3>
              <p className="text-sm text-blue-50">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-sm leading-relaxed">
            คุณต้องการลบรูปภาพของสินค้า
            <span className="font-semibold text-gray-900 block mt-1">&quot;{productName}&quot;</span>
            ใช่หรือไม่?
          </p>
        </div>

        {/* Footer - ปุ่มสวยๆ */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all hover:border-gray-400"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  );
}
