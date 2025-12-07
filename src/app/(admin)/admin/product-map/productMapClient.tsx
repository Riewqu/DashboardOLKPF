"use client";

import { useEffect, useMemo, useState, type SVGProps } from "react";
import * as XLSX from "xlsx";
import type { ProductMasterRow } from "./page";
import ProductImageUpload from "@/components/admin/ProductImageUpload";
import EditProductModal from "@/components/admin/EditProductModal";
import ProductCard from "@/components/admin/ProductCard";
import AddProductModal from "@/components/admin/AddProductModal";

// --- Icons ---
const UploadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const ChartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const DatabaseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

type Props = {
  initialRows: ProductMasterRow[];
};

const formatSku = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString("fullwide", { useGrouping: false }) : String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "-";
    const asNum = Number(trimmed);
    if (!Number.isNaN(asNum) && /^[0-9]+$/.test(trimmed)) {
      return asNum.toLocaleString("fullwide", { useGrouping: false });
    }
    return trimmed;
  }
  return String(value);
};

const normalizeExportValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString("fullwide", { useGrouping: false }) : String(value);
  }
  const str = String(value).trim();
  if (!str) return "";
  if (/^[0-9]+$/.test(str)) return str;
  return str;
};

type Message = { type: "success" | "error"; text: string } | null;
type QuickRow = { id: string; name: string; shopee: string; tiktok: string; lazada: string; sku: string };
type ImportPreview = {
  summary: {
    file: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    activeProducts: number;
    withShopee: number;
    withTiktok: number;
    withLazada: number;
    withSku: number;
    warnings: string[];
  };
  sample: Array<{
    name: string;
    shopee_code: string | null;
    tiktok_code: string | null;
    lazada_code: string | null;
    sku: string | null;
    is_active: boolean;
  }>;
  requiredColumns: string[];
  optionalColumns: string[];
};
const PAGE_SIZE = 15;

export default function ProductMapClient({ initialRows }: Props) {
  const [rows, setRows] = useState<ProductMasterRow[]>(initialRows);
  const [search, setSearch] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    file: string;
    totalRows: number;
    validRows: number;
    newCount: number;
    updateCount: number;
    errors?: string[];
  } | null>(null);
  const [page, setPage] = useState(1);
  const [editingRow, setEditingRow] = useState<{ id: string; shopee: string; tiktok: string; lazada: string; sku: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<ProductMasterRow | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = rows
      .filter((r) => {
        if (!term) return true;
        const hay = `${r.name} ${r.sku ?? ""} ${r.shopee_code ?? ""} ${r.tiktok_code ?? ""} ${r.lazada_code ?? ""}`.toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => {
        const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tB - tA;
      });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
    return filtered;
  }, [rows, search, page]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRows, currentPage]
  );

  const stats = useMemo(() => {
    return {
      total: filteredRows.length,
      active: filteredRows.filter((r) => r.is_active !== false).length
    };
  }, [filteredRows]);

  const buildExportRows = () => {
    // ใช้ชื่อคอลัมน์เดียวกับที่ API import รองรับ เพื่อให้ export->import ได้ทันที
    const headers = ["name", "shopee_code", "tiktok_code", "lazada_code", "sku", "is_active"];
    const data = filteredRows.map((r) => [
      r.name ?? "",
      normalizeExportValue(r.shopee_code),
      normalizeExportValue(r.tiktok_code),
      normalizeExportValue(r.lazada_code),
      normalizeExportValue(r.sku),
      r.is_active === false ? "false" : "true"
    ]);
    return { headers, data };
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const { headers, data } = buildExportRows();
    const rows = [headers, ...data].map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "\uFEFF" + rows.join("\n"); // BOM for Thai in Excel
    downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), `product-map-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportExcel = () => {
    const { headers, data } = buildExportRows();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ProductMap");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `product-map-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const reloadRows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/product-master");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "โหลดข้อมูลไม่สำเร็จ");
      setRows(json.data || []);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const entries: Array<{
      name: string;
      shopee_code: string | null;
      tiktok_code: string | null;
      lazada_code: string | null;
      sku: string | null;
      is_active: boolean;
    }> = lines
      .map((line) => {
        const parts = line.split(/[\t,]/).map((p) => p.trim());
        if (parts.length < 2) return null;
        const [name, shopee, tiktok, lazada, sku, active] = parts;
        return {
          name,
          shopee_code: shopee || null,
          tiktok_code: tiktok || null,
          lazada_code: lazada || null,
          sku: sku || null,
          is_active: active ? active.toLowerCase() !== "false" && active !== "0" : true
        };
      })
      .filter((v): v is {
        name: string;
        shopee_code: string | null;
        tiktok_code: string | null;
        lazada_code: string | null;
        sku: string | null;
        is_active: boolean;
      } => Boolean(v));

    if (entries.length === 0) {
      setMessage({ type: "error", text: "รูปแบบไม่ถูกต้อง ใส่เป็น name,shopee_code,tiktok_code,lazada_code,sku,is_active" });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/product-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เพิ่มรายการไม่สำเร็จ");
      setMessage({ type: "success", text: `บันทึก ${entries.length} รายการ` });
      setBulkText("");
      await reloadRows();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "เพิ่มรายการไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  const handleFilePreview = async () => {
    if (!importFile) {
      setMessage({ type: "error", text: "กรุณาเลือกไฟล์ CSV/Excel" });
      return;
    }
    setUploadingFile(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", importFile);
      const res = await fetch("/api/product-master/preview", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "อ่านไฟล์ไม่สำเร็จ");
      setImportPreview(json as ImportPreview);
      setShowImportPreview(true);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "อ่านไฟล์ไม่สำเร็จ" });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) return;
    setUploadingFile(true);
    setMessage(null);
    setImportSummary(null);
    try {
      const form = new FormData();
      form.append("file", importFile);
      const res = await fetch("/api/product-master/import", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "นำเข้าไม่สำเร็จ");
      setImportSummary(json.summary ?? null);
      setMessage({ type: "success", text: "นำเข้าข้อมูลสำเร็จ" });
      setImportFile(null);
      setImportPreview(null);
      setShowImportPreview(false);
      await reloadRows();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ" });
    } finally {
      setUploadingFile(false);
    }
  };

  const applyLocalUpdate = (id: string, patch: Partial<ProductMasterRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r)));
  };

  const patchProduct = async (row: ProductMasterRow, payload: Record<string, unknown>, successMessage?: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/product-master", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, ...payload })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "อัปเดตไม่สำเร็จ");
      applyLocalUpdate(row.id, payload as Partial<ProductMasterRow>);
      if (successMessage) setMessage({ type: "success", text: successMessage });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (row: ProductMasterRow) => {
    await patchProduct(row, { is_active: !(row.is_active !== false) }, "อัปเดตสถานะแล้ว");
  };

  const updateName = async (row: ProductMasterRow, name: string) => {
    if (!name.trim() || name.trim() === row.name) return;
    await patchProduct(row, { name: name.trim() }, "อัปเดตชื่อแล้ว");
  };

  const updateCodes = async (row: ProductMasterRow, payload: Partial<Pick<ProductMasterRow, "shopee_code" | "tiktok_code" | "lazada_code" | "sku">>) => {
    const cleanPayload: Record<string, unknown> = {};
    if ("shopee_code" in payload) cleanPayload.shopee_code = payload.shopee_code?.trim() || null;
    if ("tiktok_code" in payload) cleanPayload.tiktok_code = payload.tiktok_code?.trim() || null;
    if ("lazada_code" in payload) cleanPayload.lazada_code = payload.lazada_code?.trim() || null;
    if ("sku" in payload) cleanPayload.sku = payload.sku?.trim() || null;
    await patchProduct(row, cleanPayload, "บันทึกรหัสแล้ว");
  };

  const startEditRow = (row: ProductMasterRow) => {
    setEditingRow({
      id: row.id,
      shopee: row.shopee_code || "",
      tiktok: row.tiktok_code || "",
      lazada: row.lazada_code || "",
      sku: row.sku || ""
    });
  };

  const cancelEditRow = () => setEditingRow(null);

  const saveEditRow = async (row: ProductMasterRow) => {
    if (!editingRow || editingRow.id !== row.id) return;
    await updateCodes(row, {
      shopee_code: editingRow.shopee,
      tiktok_code: editingRow.tiktok,
      lazada_code: editingRow.lazada,
      sku: editingRow.sku
    });
    setEditingRow(null);
  };

  const deleteRow = async (row: ProductMasterRow) => {
    if (!confirm(`ต้องการลบ ${row.name} ?`)) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/product-master", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ลบไม่สำเร็จ");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "ลบไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  // Modal Handlers
  const openEditModal = (row: ProductMasterRow) => {
    setEditModalData(row);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditModalData(null);
  };

  const handleModalSave = async (updated: Partial<ProductMasterRow>) => {
    if (!editModalData) return;
    await updateCodes(editModalData, updated);
  };

  const handleImageUpdate = (rowId: string, imageUrl: string | null) => {
    applyLocalUpdate(rowId, { image_url: imageUrl });
  };

  const handleAddModalSave = async (quickRows: QuickRow[]) => {
    const entries = quickRows
      .map((r) => ({
        name: r.name.trim(),
        shopee_code: r.shopee.trim() || null,
        tiktok_code: r.tiktok.trim() || null,
        lazada_code: r.lazada.trim() || null,
        sku: r.sku.trim() || null
      }))
      .filter((r) => r.name);

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/product-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เพิ่มรายการไม่สำเร็จ");
      setMessage({ type: "success", text: `บันทึก ${entries.length} รายการ` });
      setPage(1);
      await reloadRows();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "เพิ่มรายการไม่สำเร็จ" });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white" style={{ overflowX: "hidden" }}>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div
        className="relative w-full px-4 sm:px-6 md:px-8 py-6"
        style={{
          maxWidth: "1600px",
          width: "100%",
          margin: "0 auto",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg">
              <DatabaseIcon className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Admin Console</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Product Master
          </h1>
        </div>

        {/* Stats */}
        <div className="flex gap-2 sm:gap-6 mb-8 w-full">
          <div className="flex-1 relative overflow-hidden bg-blue-50 rounded-lg sm:rounded-2xl p-2 sm:p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md mb-2 sm:mb-4">
                <ChartIcon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">ทั้งหมด</p>
                <div className="flex items-baseline gap-0.5">
                  <h3 className="text-lg sm:text-3xl font-bold text-gray-900">{stats.total.toLocaleString()}</h3>
                  <span className="text-[10px] sm:text-sm font-medium text-gray-500">รายการ</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-cyan-50 rounded-lg sm:rounded-2xl p-2 sm:p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-cyan-500 to-cyan-600 opacity-10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
                  <DatabaseIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse"></div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">เปิดใช้งาน</p>
                <div className="flex items-baseline gap-0.5">
                  <h3 className="text-lg sm:text-3xl font-bold text-blue-600">{stats.active.toLocaleString()}</h3>
                  <span className="text-[10px] sm:text-sm font-medium text-gray-500">รายการ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Upload Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UploadIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">เพิ่ม/อัปโหลดสินค้า</h2>
                <p className="text-sm text-blue-50">เพิ่มทีละรายการ หรืออัปโหลดไฟล์ CSV/Excel</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Message */}
            {message && (
              <div className={`px-4 py-3 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            {/* Bulk Text Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">เพิ่มแบบ Bulk (Copy & Paste)</label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="ตัวอย่าง: สินค้าA,195685,1234567890,LZ-001,SKU-A,true"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 resize-y"
              />
              <div className="flex flex-wrap gap-3 items-center mt-4">
                <button
                  onClick={() => { setPage(1); handleBulkAdd(); }}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
                <button
                  onClick={reloadRows}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  รีโหลด
                </button>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            {/* File Import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  อัปโหลดไฟล์
                  <a href="/api/product-master/template" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 border border-blue-200" download>
                    <DownloadIcon className="w-3 h-3" /> Template
                  </a>
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  รองรับ .csv, .xlsx (คอลัมน์: name, shopee_code, tiktok_code, lazada_code, sku, is_active)
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-700
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gray-100 file:text-gray-700
                        hover:file:bg-gray-200 transition-all"
                    />
                  </label>
                  <button
                    onClick={handleFilePreview}
                    disabled={!importFile || uploadingFile}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 whitespace-nowrap"
                  >
                    {uploadingFile ? "กำลังอ่านไฟล์..." : "พรีวิวไฟล์"}
                  </button>
                </div>
              </div>

              {importSummary && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    สรุปการนำเข้า: {importSummary.file}
                  </h4>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-600 font-medium">ทั้งหมด</div>
                      <div className="text-lg font-bold text-gray-900">{importSummary.totalRows}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-600 font-medium">สำเร็จ</div>
                      <div className="text-lg font-bold text-gray-900">{importSummary.validRows}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-600 font-medium">เพิ่ม/อัปเดต</div>
                      <div className="text-lg font-bold text-gray-900">{importSummary.newCount + importSummary.updateCount}</div>
                    </div>
                  </div>
                  {importSummary.errors && importSummary.errors.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="text-xs font-bold text-red-900 mb-1">ข้อผิดพลาด:</div>
                      <ul className="text-xs text-red-800 list-disc pl-4 space-y-1 max-h-20 overflow-y-auto">
                        {importSummary.errors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                        {importSummary.errors.length > 3 && <li>...และอีก {importSummary.errors.length - 3} รายการ</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Section with mobile cards */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ChartIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">รายการสินค้า</h2>
                <p className="text-sm text-blue-50">จัดการข้อมูลและสถานะสินค้าทั้งหมด</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Search + Export */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-lg w-full">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="ค้นหาชื่อสินค้า, SKU, รหัสสินค้า..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md font-medium"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={filteredRows.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-400 hover:scale-105 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold"
                >
                  <DownloadIcon className="w-5 h-5" />
                  Export CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={filteredRows.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold"
                >
                  <DownloadIcon className="w-5 h-5" />
                  Export Excel
                </button>
              </div>
            </div>

            {/* Mobile Cards - Grid สวยๆ */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 md:hidden">
              {pagedRows.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    <SearchIcon className="w-10 h-10 text-blue-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-700">ไม่พบข้อมูลสินค้า</p>
                  <p className="text-sm text-gray-500 mt-1">ลองค้นหาด้วยคำอื่น หรือเพิ่มสินค้าใหม่</p>
                </div>
              ) : (
                pagedRows.map((row) => (
                  <ProductCard
                    key={row.id}
                    product={row}
                    onEdit={() => openEditModal(row)}
                    onDelete={() => deleteRow(row)}
                    onToggleActive={() => toggleActive(row)}
                  />
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200/50 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
                  <tr>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide">รูปภาพ</th>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide">ชื่อสินค้า</th>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide hidden md:table-cell">SKU</th>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide hidden lg:table-cell">Shopee</th>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide hidden lg:table-cell">TikTok</th>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide hidden lg:table-cell">Lazada</th>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide text-center">สถานะ</th>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide hidden xl:table-cell text-right">อัปเดตล่าสุด</th>
                    <th className="px-6 py-5 font-bold text-white text-sm tracking-wide text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                            <SearchIcon className="w-10 h-10 text-blue-400" />
                          </div>
                          <p className="text-xl font-bold text-gray-800">ไม่พบข้อมูลสินค้า</p>
                          <p className="text-sm text-gray-500">ลองค้นหาด้วยคำอื่น หรือเพิ่มสินค้าใหม่</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((row) => {
                      const isEditing = editingRow?.id === row.id;
                      return (
                        <tr key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50/30 transition-all duration-200 group hover:shadow-md">
                          <td className="px-6 py-5">
                            <ProductImageUpload
                              productId={row.id}
                              productName={row.name}
                              currentImageUrl={row.image_url}
                              onUploadSuccess={(imageUrl) => applyLocalUpdate(row.id, { image_url: imageUrl })}
                              onDeleteSuccess={() => applyLocalUpdate(row.id, { image_url: null })}
                              compact
                            />
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-semibold text-gray-900 text-base">
                              <EditableName value={row.name} onSave={(name) => updateName(row, name)} />
                            </div>
                          </td>
                          <td className="px-6 py-5 hidden md:table-cell">
                            {isEditing ? (
                              <InlineCodeEditor
                                value={editingRow?.sku || ""}
                                placeholder="SKU"
                                onChange={(val) => setEditingRow((prev) => (prev && prev.id === row.id ? { ...prev, sku: val } : prev))}
                                onSave={() => {}}
                                compact
                                immediate={false}
                              />
                            ) : (
                              <span className="font-mono text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">{formatSku(row.sku)}</span>
                            )}
                          </td>
                          <td className="px-6 py-5 hidden lg:table-cell">
                            {isEditing ? (
                              <InlineCodeEditor
                                value={editingRow?.shopee || ""}
                                placeholder="Shopee"
                                onChange={(val) => setEditingRow((prev) => (prev && prev.id === row.id ? { ...prev, shopee: val } : prev))}
                                onSave={() => {}}
                                compact
                                color="orange"
                                immediate={false}
                              />
                            ) : (
                              <span className="font-mono text-sm text-gray-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">{row.shopee_code || "-"}</span>
                            )}
                          </td>
                          <td className="px-6 py-5 hidden lg:table-cell">
                            {isEditing ? (
                              <InlineCodeEditor
                                value={editingRow?.tiktok || ""}
                                placeholder="TikTok"
                                onChange={(val) => setEditingRow((prev) => (prev && prev.id === row.id ? { ...prev, tiktok: val } : prev))}
                                onSave={() => {}}
                                compact
                                color="red"
                                immediate={false}
                              />
                            ) : (
                              <span className="font-mono text-sm text-gray-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">{row.tiktok_code || "-"}</span>
                            )}
                          </td>
                          <td className="px-6 py-5 hidden lg:table-cell">
                            {isEditing ? (
                              <InlineCodeEditor
                                value={editingRow?.lazada || ""}
                                placeholder="Lazada"
                                onChange={(val) => setEditingRow((prev) => (prev && prev.id === row.id ? { ...prev, lazada: val } : prev))}
                                onSave={() => {}}
                                compact
                                color="blue"
                                immediate={false}
                              />
                            ) : (
                              <span className="font-mono text-sm text-gray-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{row.lazada_code || "-"}</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {isEditing ? (
                              <span className="text-xs text-gray-500">กำลังแก้ไข...</span>
                            ) : (
                              <button
                                onClick={() => toggleActive(row)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                  row.is_active !== false ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                                title={row.is_active !== false ? "เปิดใช้งาน - คลิกเพื่อปิด" : "ปิดใช้งาน - คลิกเพื่อเปิด"}
                              >
                                <span
                                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                                    row.is_active !== false ? 'translate-x-7' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-5 hidden xl:table-cell text-right">
                            <span className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1.5 rounded-lg">
                              {row.updated_at ? new Date(row.updated_at).toLocaleDateString("th-TH", { year: '2-digit', month: 'short', day: 'numeric' }) : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => saveEditRow(row)}
                                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                >
                                  บันทึก
                                </button>
                                <button
                                  onClick={cancelEditRow}
                                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:scale-105 transition-all"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => startEditRow(row)}
                                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                >
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() => deleteRow(row)}
                                  className="p-2.5 rounded-xl text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 shadow-sm hover:shadow-md"
                                  title="ลบรายการ"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t-2 border-gray-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                  <span className="text-base text-gray-700 font-bold">
                    หน้า <span className="text-blue-600">{currentPage}</span> / <span className="text-gray-500">{totalPages}</span>
                  </span>
                </div>
                <span className="text-sm text-gray-500">({filteredRows.length.toLocaleString()} รายการ)</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-700 font-bold hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-400 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
                >
                  ← ก่อนหน้า
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:shadow-xl hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      {showImportPreview && importPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">พรีวิวการนำเข้าข้อมูล</h3>
                <p className="text-sm text-blue-50">{importPreview.summary.file}</p>
              </div>
              <button
                onClick={() => setShowImportPreview(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-gray-500 mb-1">แถวทั้งหมด</p>
                  <p className="text-2xl font-bold text-blue-600">{importPreview.summary.totalRows}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-gray-500 mb-1">แถวถูกต้อง</p>
                  <p className="text-2xl font-bold text-green-600">{importPreview.summary.validRows}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-200">
                  <p className="text-xs text-gray-500 mb-1">เปิดใช้งาน</p>
                  <p className="text-2xl font-bold text-purple-600">{importPreview.summary.activeProducts}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-200">
                  <p className="text-xs text-gray-500 mb-1">มี Shopee</p>
                  <p className="text-2xl font-bold text-orange-600">{importPreview.summary.withShopee}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl p-4 border border-cyan-200">
                  <p className="text-xs text-gray-500 mb-1">มี SKU</p>
                  <p className="text-2xl font-bold text-cyan-600">{importPreview.summary.withSku}</p>
                </div>
              </div>

              {/* Platform Coverage */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <p className="text-sm font-semibold text-gray-700">Shopee Code</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">
                    {importPreview.summary.withShopee} / {importPreview.summary.validRows}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((importPreview.summary.withShopee / importPreview.summary.validRows) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <p className="text-sm font-semibold text-gray-700">TikTok Code</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">
                    {importPreview.summary.withTiktok} / {importPreview.summary.validRows}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((importPreview.summary.withTiktok / importPreview.summary.validRows) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-semibold text-gray-700">Lazada Code</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {importPreview.summary.withLazada} / {importPreview.summary.validRows}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((importPreview.summary.withLazada / importPreview.summary.validRows) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {importPreview.summary.warnings && importPreview.summary.warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <p className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    คำเตือน ({importPreview.summary.warnings.length} รายการ)
                  </p>
                  <ul className="text-sm text-orange-800 list-disc pl-5 space-y-1 max-h-32 overflow-y-auto">
                    {importPreview.summary.warnings.slice(0, 10).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                    {importPreview.summary.warnings.length > 10 && (
                      <li className="font-semibold">...และอีก {importPreview.summary.warnings.length - 10} รายการ</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Sample Data */}
              {importPreview.sample && importPreview.sample.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ตัวอย่างข้อมูล (5 แถวแรก)
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse sm:min-w-[800px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-sm font-semibold text-gray-700">ชื่อสินค้า</th>
                          <th className="p-3 text-sm font-semibold text-gray-700">Shopee</th>
                          <th className="p-3 text-sm font-semibold text-gray-700">TikTok</th>
                          <th className="p-3 text-sm font-semibold text-gray-700">Lazada</th>
                          <th className="p-3 text-sm font-semibold text-gray-700">SKU</th>
                          <th className="p-3 text-sm font-semibold text-gray-700 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {importPreview.sample.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 text-sm text-gray-900 font-medium">{row.name}</td>
                            <td className="p-3 text-sm text-gray-600 font-mono">{row.shopee_code || "-"}</td>
                            <td className="p-3 text-sm text-gray-600 font-mono">{row.tiktok_code || "-"}</td>
                            <td className="p-3 text-sm text-gray-600 font-mono">{row.lazada_code || "-"}</td>
                            <td className="p-3 text-sm text-gray-600 font-mono">{formatSku(row.sku)}</td>
                            <td className="p-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                row.is_active
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
                              }`}>
                                {row.is_active ? "เปิด" : "ปิด"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Required/Optional Columns Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-2">คอลัมน์ที่จำเป็น:</p>
                    <div className="flex flex-wrap gap-2">
                      {importPreview.requiredColumns.map((col) => (
                        <span key={col} className="px-3 py-1 bg-blue-100 rounded-lg text-xs font-medium text-blue-700 border border-blue-300">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2">คอลัมน์เสริม:</p>
                    <div className="flex flex-wrap gap-2">
                      {importPreview.optionalColumns.map((col) => (
                        <span key={col} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-200">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowImportPreview(false)}
                  className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={uploadingFile}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <UploadIcon className="w-5 h-5" />
                  {uploadingFile ? "กำลังบันทึก..." : "ยืนยันและบันทึก"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all z-40 flex items-center justify-center group"
        title="เพิ่มสินค้าใหม่"
      >
        <PlusIcon className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddModalSave}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && editModalData && (
        <EditProductModal
          product={editModalData}
          onClose={closeEditModal}
          onSave={handleModalSave}
          onImageUpdate={(imageUrl) => handleImageUpdate(editModalData.id, imageUrl)}
        />
      )}
    </div>
  );
}

function EditableName({ value, onSave }: { value: string; onSave: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    if (!draft.trim() || draft.trim() === value) {
      setEditing(false);
      return;
    }
    onSave(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="w-full px-2 py-1 rounded bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:text-blue-600 hover:underline decoration-blue-400 underline-offset-2 transition-all"
      title="คลิกเพื่อแก้ไข"
    >
      {value}
    </div>
  );
}

function InlineCodeEditor({
  label,
  value,
  placeholder,
  onSave,
  onChange,
  color,
  compact,
  immediate = true
}: {
  label?: string;
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
  onChange?: (val: string) => void;
  color?: "orange" | "red" | "blue";
  compact?: boolean;
  immediate?: boolean;
}) {
  const [draft, setDraft] = useState(value || "");
  useEffect(() => setDraft(value || ""), [value]);

  const commit = () => {
    if (!immediate) return;
    if (draft === value) return;
    onSave(draft);
  };

  const baseBorder =
    color === "orange" ? "focus:ring-orange-400/60 border-orange-200" :
    color === "red" ? "focus:ring-red-400/60 border-red-200" :
    color === "blue" ? "focus:ring-blue-400/60 border-blue-200" :
    "focus:ring-blue-400/60 border-gray-200";

  return (
    <div className={`flex flex-col ${compact ? "" : "bg-gray-50 border border-gray-200 rounded-xl p-3"}`}>
      {label && !compact && <p className="text-xs text-gray-500 mb-1">{label}</p>}
      <input
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange?.(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        placeholder={placeholder || "-"}
        className={`w-full px-3 py-2 rounded-lg bg-white text-sm font-mono text-gray-800 border ${baseBorder} focus:outline-none focus:ring-2 transition`}
      />
    </div>
  );
}
