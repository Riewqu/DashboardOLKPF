
"use client";

import { useEffect, useMemo, useRef, useState, type SVGProps } from "react";
import type { PlatformKPI } from "@/lib/mockData";
import type { GoalRecord } from "../../dataClient";
import { ProvinceAliasManager } from "@/components/ProvinceAliasManager";

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

const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CalendarIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const EyeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DatabaseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const TargetIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Types
 */
type UploadItem = { file: string; rows: number; status: string; settlement: number; platform: string; created_at?: string | null };

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

type ProductPreview = {
  summary?: {
    totalRows: number;
    totalProducts: number;
    totalVariants: number;
    totalQty: number;
    totalRevenue: number;
    totalReturned?: number;
    warnings: string[];
  };
  sample?: { productName: string; variantName: string; qtyConfirmed: number; revenueConfirmed: number; qtyReturned?: number; rowNo: number }[];
  requiredColumns?: string[];
};

type Props = {
  platforms: PlatformKPI[];
  recentUploads: UploadItem[];
  goals: GoalRecord[];
};

const currency = (value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

export default function AdminClient({ platforms, recentUploads, goals }: Props) {
  const [platform, setPlatform] = useState<"TikTok" | "Shopee" | "Lazada">("Shopee");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPlatform, setProductPlatform] = useState<"Shopee" | "TikTok" | "Lazada">("Shopee");
  const [productPreview, setProductPreview] = useState<ProductPreview | null>(null);
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [loadingProductUpload, setLoadingProductUpload] = useState(false);
  const [productMessage, setProductMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [unmappedProvinces, setUnmappedProvinces] = useState<string[]>([]);

  const now = useMemo(() => new Date(), []);
  const initialMonth = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [now]);

  const [goalMonth, setGoalMonth] = useState<string>(initialMonth);
  const [goalPlatform, setGoalPlatform] = useState<"all" | "TikTok" | "Shopee" | "Lazada">("all");
  const [goalType, setGoalType] = useState<"revenue" | "profit">("profit");
  const [goalTarget, setGoalTarget] = useState<string>("");
  const [goalStatus, setGoalStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [goalsState, setGoalsState] = useState(goals);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const fetchedGoalKeys = useRef<Set<string>>(new Set());
  const [showGoalDetail, setShowGoalDetail] = useState(false);

  // ---------- Upload logic ----------
  const handlePreview = async () => {
    if (!file) {
      setMessage({ type: "error", text: "กรุณาเลือกไฟล์" });
      return;
    }
    setLoadingUpload(true);
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
      setPreview(data as PreviewSummary);
      setShowPreview(true);
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setLoadingUpload(true);
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
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleProductPreview = async () => {
    if (!productFile) {
      setProductMessage({ type: "error", text: "กรุณาเลือกไฟล์" });
      return;
    }
    setLoadingProductUpload(true);
    setProductMessage(null);
    const formData = new FormData();
    formData.append("file", productFile);
    formData.append("platform", productPlatform);
    try {
      const res = await fetch("/api/product-sales/preview", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setProductMessage({ type: "error", text: data.error || "อ่านไฟล์ไม่สำเร็จ" });
        return;
      }
      setProductPreview(data as ProductPreview);
      setShowProductPreview(true);
    } catch {
      setProductMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setLoadingProductUpload(false);
    }
  };

  const handleProductUpload = async () => {
    if (!productFile) return;
    setLoadingProductUpload(true);
    setProductMessage(null);
    setUnmappedProvinces([]);
    const formData = new FormData();
    formData.append("file", productFile);
    formData.append("platform", productPlatform);
    try {
      const res = await fetch("/api/product-sales/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setProductMessage({ type: "error", text: data.error || "อัปโหลดไม่สำเร็จ" });
        return;
      }
      setProductMessage({ type: "success", text: data.notice || "อัปโหลดสำเร็จ" });
      setUnmappedProvinces(data.unmappedProvinces ?? []);
      setProductFile(null);
      setProductPreview(null);
      setShowProductPreview(false);
    } catch {
      setProductMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setLoadingProductUpload(false);
    }
  };

  // ---------- Goals logic ----------
  const [goalYear, goalMonthNum] = goalMonth.split("-").map((v) => Number(v));
  const getGoalRecord = (platform: "all" | "TikTok" | "Shopee" | "Lazada", type: "revenue" | "profit") =>
    goalsState.find((g) => g.platform === platform && g.type === type && g.year === goalYear && g.month === goalMonthNum);

  const computeActual = (platform: "all" | "TikTok" | "Shopee" | "Lazada") => {
    const monthKey = `${goalYear}-${String(goalMonthNum).padStart(2, "0")}`;
    const targetPlatforms = platforms.filter((p) => platform === "all" || p.platform === platform);
    return targetPlatforms.reduce(
      (acc, p) => {
        const days = p.perDay ?? [];
        const monthDays = days.filter((d) => d.date.startsWith(monthKey));
        const totals = monthDays.reduce(
          (s, d) => {
            s.revenue += d.revenue;
            s.fees += d.fees;
            s.adjustments += d.adjustments;
            return s;
          },
          { revenue: 0, fees: 0, adjustments: 0 }
        );
        acc.revenue += totals.revenue;
        acc.fees += totals.fees;
        acc.adjustments += totals.adjustments;
        return acc;
      },
      { revenue: 0, fees: 0, adjustments: 0 }
    );
  };

  const currentGoal = getGoalRecord(goalPlatform, goalType);
  const actualTotals = computeActual(goalPlatform);
  const actualValue = goalType === "revenue" ? actualTotals.revenue : actualTotals.revenue + actualTotals.fees + actualTotals.adjustments;
  const targetValue = currentGoal?.target ?? 0;
  const progressPercent = targetValue > 0 ? Math.min((actualValue / targetValue) * 100, 999) : 0;
  const totalRevenue = platforms.reduce((acc, p) => acc + p.revenue, 0);
  const totalSettlement = platforms.reduce((acc, p) => acc + p.settlement, 0);
  const lastUpload = recentUploads[0];

  useEffect(() => {
    const [y, m] = goalMonth.split("-").map((v) => Number(v));
    const key = `${y}-${m}`;
    const hasData = goalsState.some((g) => g.year === y && g.month === m);
    if (hasData) {
      fetchedGoalKeys.current.add(key);
      return;
    }
    if (fetchedGoalKeys.current.has(key)) return;
    fetchedGoalKeys.current.add(key);
    const load = async () => {
      try {
        setLoadingGoals(true);
        const res = await fetch(`/api/goals?year=${y}&month=${m}`);
        const json = await res.json();
        if (!res.ok) {
          setGoalStatus({ type: "error", message: json.error || "โหลดเป้าหมายไม่สำเร็จ" });
          return;
        }
        setGoalsState((prev) => [...prev, ...(json.data || [])]);
      } catch {
        setGoalStatus({ type: "error", message: "โหลดเป้าหมายไม่สำเร็จ" });
      } finally {
        setLoadingGoals(false);
      }
    };
    load();
  }, [goalMonth, goalsState]);

  const handleSaveGoal = async () => {
    const [y, m] = goalMonth.split("-").map((v) => Number(v));
    const numericTarget = Number(goalTarget);
    if (!Number.isFinite(numericTarget)) {
      setGoalStatus({ type: "error", message: "กรอกตัวเลขเป้าหมายให้ถูกต้อง" });
      return;
    }
    try {
      setLoadingGoals(true);
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: goalPlatform,
          year: y,
          month: m,
          type: goalType,
          target: numericTarget,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGoalStatus({ type: "error", message: json.error || "บันทึกเป้าหมายไม่สำเร็จ" });
        return;
      }
      const newGoal = json.data;
      setGoalsState((prev) => {
        const filtered = prev.filter(
          (g) => !(g.platform === newGoal.platform && g.year === newGoal.year && g.month === newGoal.month && g.type === newGoal.type)
        );
        return [...filtered, newGoal];
      });
      setGoalStatus({ type: "success", message: "บันทึกเป้าหมายแล้ว" });
    } catch {
      setGoalStatus({ type: "error", message: "บันทึกเป้าหมายไม่สำเร็จ" });
    } finally {
      setLoadingGoals(false);
    }
  };

  const goalListForMonth = goalsState.filter((g) => g.year === goalYear && g.month === goalMonthNum);
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0a1f44] via-[#0e7de5] to-[#e8f3ff] text-gray-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative flex w-full flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10 xl:px-12">
        <header className="rounded-3xl border border-white/20 bg-white/10 text-white shadow-[0_25px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
                <DatabaseIcon className="h-4 w-4" />
                Control Lab
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/70">รองรับ mobile / desktop</span>
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Admin Experience Board</h1>
                <p className="text-sm text-white/80 sm:text-base">
                  จัดการข้อมูล อัปโหลดไฟล์ ตรวจสอบความถูกต้อง และตั้งเป้าหมายได้จากที่เดียว ภายใต้โทนฟ้า-ขาวไล่เฉดสุดพรีเมียม
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    {goalListForMonth.length} เป้าหมายที่กำลังติดตาม
                  </span>
                  {lastUpload ? (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/80">
                      อัปโหลดล่าสุด {formatDate(lastUpload.created_at)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/80">ยังไม่มีประวัติอัปโหลด</span>
                  )}
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-white/60">รวมรายได้</p>
                  <p className="text-lg font-semibold">{currency(totalRevenue)}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-white/60">กำไรสุทธิ</p>
                  <p className="text-lg font-semibold">{currency(totalSettlement)}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-white/60">ไฟล์ล่าสุด</p>
                  <p className="text-lg font-semibold">{lastUpload ? lastUpload.platform : "-"}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-white/60">รายการอัปโหลด</p>
                  <p className="text-lg font-semibold">{recentUploads.length}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.65fr,1fr]">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 via-white/60 to-cyan-100/40" />
              <div className="relative flex flex-col gap-6 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Workflow 01</p>
                    <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">อัปโหลดข้อมูลแพลตฟอร์ม</h2>
                    <p className="text-sm text-gray-600">นำเข้ายอดขาย Shopee, TikTok, Lazada ด้วยขั้นตอนสามสเต็ป</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <UploadIcon className="h-4 w-4" />
                    ตรวจสอบก่อนอัปโหลด
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Step 1</p>
                    <p className="text-sm text-gray-600">เลือกแพลตฟอร์ม</p>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as "TikTok" | "Shopee" | "Lazada")}
                      className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-gray-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="Shopee">Shopee</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Lazada">Lazada</option>
                    </select>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm md:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Step 2</p>
                    <p className="text-sm text-gray-600">ดึงไฟล์ Excel (.xlsx)</p>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="mt-2 block w-full rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-3 py-3 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-4 file:py-2.5 file:font-semibold file:text-blue-700 hover:border-blue-300 focus:border-blue-400 focus:outline-none"
                    />
                    {file && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        <CheckIcon className="h-4 w-4" />
                        {file.name} ({(file.size / 1024).toFixed(0)} KB)
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handlePreview}
                    disabled={!file || loadingUpload}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:w-auto"
                  >
                    <EyeIcon className="h-5 w-5" />
                    {loadingUpload ? "กำลังพรีวิว..." : "ตรวจสอบไฟล์"}
                  </button>
                  <button
                    onClick={handleConfirmUpload}
                    disabled={!file || loadingUpload}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <UploadIcon className="h-5 w-5" />
                    อัปโหลดเข้าระบบ
                  </button>
                </div>

                {message && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                      message.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {preview?.summary && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatItem label="แถวทั้งหมด" value={`${preview.summary.totalRows}`} color="blue" />
                    <StatItem label="รายได้รวม" value={currency(preview.summary.revenue)} color="green" />
                    <StatItem label="กำไรสุทธิ" value={currency(preview.summary.settlement)} color="purple" />
                  </div>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 via-white to-blue-50" />
              <div className="relative flex flex-col gap-6 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">Workflow 02</p>
                    <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">อัปโหลดยอดขายสินค้า</h2>
                    <p className="text-sm text-gray-600">บันทึกยอดขายราย SKU พร้อมตรวจสอบจังหวัดที่ยังไม่รู้จัก</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                    <ChartIcon className="h-4 w-4" />
                    รองรับพรีวิว
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-cyan-100 bg-white/80 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700">Step 1</p>
                    <p className="text-sm text-gray-600">เลือกแพลตฟอร์ม</p>
                    <select
                      value={productPlatform}
                      onChange={(e) => setProductPlatform(e.target.value as "Shopee" | "TikTok" | "Lazada")}
                      className="mt-2 w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-gray-900 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    >
                      <option value="Shopee">Shopee</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Lazada">Lazada</option>
                    </select>
                  </div>
                  <div className="rounded-2xl border border-cyan-100 bg-white/80 p-4 shadow-sm md:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700">Step 2</p>
                    <p className="text-sm text-gray-600">แนบไฟล์ Excel (.xlsx)</p>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setProductFile(e.target.files?.[0] ?? null)}
                      className="mt-2 block w-full rounded-xl border border-dashed border-cyan-200 bg-cyan-50/50 px-3 py-3 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-100 file:px-4 file:py-2.5 file:font-semibold file:text-cyan-700 hover:border-cyan-300 focus:border-cyan-400 focus:outline-none"
                    />
                    {productFile && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                        <CheckIcon className="h-4 w-4" />
                        {productFile.name} ({(productFile.size / 1024).toFixed(0)} KB) • {productPlatform}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleProductPreview}
                    disabled={!productFile || loadingProductUpload}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:w-auto"
                  >
                    <EyeIcon className="h-5 w-5" />
                    {loadingProductUpload ? "กำลังพรีวิว..." : "ตรวจสอบไฟล์"}
                  </button>
                  <button
                    onClick={handleProductUpload}
                    disabled={!productFile || loadingProductUpload}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-white px-6 py-3 text-sm font-semibold text-cyan-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <UploadIcon className="h-5 w-5" />
                    อัปโหลดเข้าระบบ
                  </button>
                </div>

                {productMessage && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                      productMessage.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {productMessage.text}
                  </div>
                )}

                {unmappedProvinces.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">จังหวัดที่ยังไม่รู้จัก ({unmappedProvinces.length})</div>
                      <button
                        onClick={() => navigator.clipboard?.writeText(unmappedProvinces.join(", "))}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        คัดลอกรายการ
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {unmappedProvinces.map((p) => (
                        <span key={p} className="rounded-full border border-amber-200 bg-white px-2 py-1 text-xs">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <ClockIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">ประวัติการอัปโหลด</h3>
                    <p className="text-sm text-blue-50">เรียงลำดับล่าสุด • 10 รายการ</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {recentUploads.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <CalendarIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900">ยังไม่มีประวัติ</p>
                    <p className="text-sm text-gray-500">อัปโหลดไฟล์แรกเพื่อเริ่มต้นไทม์ไลน์</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:hidden">
                      {recentUploads.map((upload, i) => (
                        <div key={i} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm text-gray-500">ไฟล์</p>
                              <p className="truncate text-base font-semibold text-gray-900">{upload.file}</p>
                            </div>
                            <span
                              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                                upload.platform === "TikTok"
                                  ? "border border-red-200 bg-red-50 text-red-700"
                                  : upload.platform === "Shopee"
                                    ? "border border-orange-200 bg-orange-50 text-orange-700"
                                    : "border border-blue-200 bg-blue-50 text-blue-700"
                              }`}
                            >
                              {upload.platform}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">จำนวนแถว</p>
                              <p className="font-semibold text-gray-900">{upload.rows.toLocaleString()}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                              <p className="text-xs text-gray-500">Settlement</p>
                              <p className="font-bold text-green-600">{currency(upload.settlement)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                upload.status === "สำเร็จ"
                                  ? "border border-green-200 bg-green-50 text-green-700"
                                  : "border border-gray-200 bg-gray-100 text-gray-600"
                              }`}
                            >
                              {upload.status}
                            </span>
                            <p className="text-xs text-gray-500">{formatDate(upload.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 md:block">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">ไฟล์</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">แพลตฟอร์ม</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-700">แถว</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Settlement</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-700">สถานะ</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">วันที่</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {recentUploads.map((upload, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{upload.file}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    upload.platform === "TikTok"
                                      ? "border border-red-200 bg-red-50 text-red-700"
                                      : upload.platform === "Shopee"
                                        ? "border border-orange-200 bg-orange-50 text-orange-700"
                                        : "border border-blue-200 bg-blue-50 text-blue-700"
                                  }`}
                                >
                                  {upload.platform}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">{upload.rows.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-bold text-green-600">{currency(upload.settlement)}</td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    upload.status === "สำเร็จ"
                                      ? "border border-green-200 bg-green-50 text-green-700"
                                      : "border border-gray-200 bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {upload.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(upload.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-purple-100 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <TargetIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">เป้าหมายรายเดือน</h3>
                    <p className="text-sm text-blue-50">ติดตามความคืบหน้าพร้อมตั้งค่าใหม่ได้ทันที</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoalDetail(true)}
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30"
                >
                  ดูรายการทั้งหมด
                </button>
              </div>
              <div className="space-y-6 p-6">
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">ความคืบหน้า</p>
                      <p className="text-sm text-gray-700">{goalType === "revenue" ? "รายได้" : "กำไรสุทธิ"} เดือน {goalMonth}</p>
                    </div>
                    <div className="text-3xl font-bold text-indigo-700">{targetValue ? `${progressPercent.toFixed(1)}%` : "-"}</div>
                  </div>
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] text-gray-500">ปัจจุบัน</p>
                      <p className="text-base font-semibold text-gray-900">{currency(actualValue)}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] text-gray-500">เป้าหมาย</p>
                      <p className="text-base font-semibold text-indigo-700">{targetValue ? currency(targetValue) : "ยังไม่ตั้ง"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">เดือน</label>
                    <input
                      type="month"
                      value={goalMonth}
                      onChange={(e) => setGoalMonth(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">แพลตฟอร์ม</label>
                    <select
                      value={goalPlatform}
                      onChange={(e) => setGoalPlatform(e.target.value as "all" | "TikTok" | "Shopee" | "Lazada")}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Shopee">Shopee</option>
                      <option value="Lazada">Lazada</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">ประเภท</label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as "revenue" | "profit")}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="revenue">รายได้</option>
                      <option value="profit">กำไรสุทธิ</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">เป้าหมาย (บาท)</label>
                    <input
                      type="number"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      placeholder="เช่น 500000"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleSaveGoal}
                    disabled={loadingGoals || !goalTarget}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <CheckIcon className="h-5 w-5" />
                    {loadingGoals ? "กำลังบันทึก..." : "บันทึกเป้า"}
                  </button>
                  <button
                    onClick={() => setShowGoalDetail(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-auto"
                  >
                    ดูรายละเอียดเป้า
                  </button>
                </div>

                {goalStatus && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                      goalStatus.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {goalStatus.message}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-cyan-100 bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <TrendingIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">จัดการจังหวัด/ชื่อย่อ</h3>
                  <p className="text-sm text-blue-50">ปรับ alias จังหวัดให้ตรงกับข้อมูลล่าสุด</p>
                </div>
              </div>
              <div className="space-y-4 p-6">
                {unmappedProvinces.length === 0 ? (
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                    จังหวัดทั้งหมดถูกแมปแล้ว สามารถเพิ่ม/แก้ไขเพิ่มเติมได้ด้านล่าง
                  </div>
                ) : null}
                <ProvinceAliasManager unmappedProvinces={unmappedProvinces} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Platform Data Preview Modal */}
      {showPreview && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5">
              <h3 className="text-xl font-bold text-white">พรีวิวการอัปโหลด</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
                <StatItem label="รายการ" value={`${preview.summary?.totalRows ?? 0} แถว`} color="blue" />
                <StatItem label="รายได้รวม" value={currency(preview.summary?.revenue ?? 0)} color="green" />
                <StatItem label="ค่าธรรมเนียม" value={currency(preview.summary?.fees ?? 0)} color="orange" />
                <StatItem label="การปรับยอด" value={currency(preview.summary?.adjustments ?? 0)} color="cyan" />
                <StatItem label="กำไรสุทธิ" value={currency(preview.summary?.settlement ?? 0)} color="purple" />
              </div>

              {preview.warnings && preview.warnings.length > 0 && (
                <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="mb-2 text-sm font-bold text-orange-900">คำเตือน</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-orange-800">
                    {preview.warnings.slice(0, 5).map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col-reverse items-center justify-end gap-3 border-t border-gray-100 pt-4 sm:flex-row">
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-center font-semibold text-gray-700 transition-all hover:bg-gray-50 sm:w-auto"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={loadingUpload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  <UploadIcon className="h-5 w-5" />
                  {loadingUpload ? "กำลังอัปโหลด..." : "ยืนยันอัปโหลด"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Sales Preview Modal */}
      {showProductPreview && productPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-5">
              <h3 className="text-xl font-bold text-white">พรีวิวยอดขายสินค้า</h3>
              <button
                onClick={() => setShowProductPreview(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                <StatItem label="แถวทั้งหมด" value={`${productPreview.summary?.totalRows ?? 0}`} color="indigo" />
                <StatItem label="ผลิตภัณฑ์" value={`${productPreview.summary?.totalProducts ?? 0}`} color="purple" />
                <StatItem label="ตัวเลือก" value={`${productPreview.summary?.totalVariants ?? 0}`} color="green" />
                <StatItem label="จำนวนขาย" value={(productPreview.summary?.totalQty ?? 0).toLocaleString()} color="orange" />
                <StatItem label="ยอดขาย" value={currency(productPreview.summary?.totalRevenue ?? 0)} color="green" />
                <StatItem label="ตีกลับ" value={(productPreview.summary?.totalReturned ?? 0).toLocaleString()} color="red" />
              </div>

              {productPreview.summary?.warnings && productPreview.summary.warnings.length > 0 && (
                <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="mb-2 text-sm font-bold text-orange-900">คำเตือน</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-orange-800">
                    {productPreview.summary.warnings.slice(0, 5).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {productPreview.sample && productPreview.sample.length > 0 && (
                <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full border-collapse text-left md:min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-gray-700">ผลิตภัณฑ์</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">ตัวเลือก</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 text-right">จำนวนขาย</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 text-right">ตีกลับ</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 text-right">ยอดขาย</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 text-right">แถว</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {productPreview.sample.map((row) => (
                        <tr key={`${row.productName}-${row.variantName}-${row.rowNo}`} className="hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-900">{row.productName}</td>
                          <td className="p-3 text-sm text-gray-600">{row.variantName}</td>
                          <td className="p-3 text-sm text-gray-600 text-right">{row.qtyConfirmed.toLocaleString()}</td>
                          <td className="p-3 text-sm text-orange-600 text-right">{(row.qtyReturned ?? 0).toLocaleString()}</td>
                          <td className="p-3 text-sm text-green-600 font-bold text-right">{currency(row.revenueConfirmed)}</td>
                          <td className="p-3 text-sm text-gray-400 text-right">{row.rowNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col-reverse items-center justify-end gap-3 border-t border-gray-100 pt-4 sm:flex-row">
                <button
                  onClick={() => setShowProductPreview(false)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-center font-semibold text-gray-700 transition-all hover:bg-gray-50 sm:w-auto"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleProductUpload}
                  disabled={loadingProductUpload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  <UploadIcon className="h-5 w-5" />
                  {loadingProductUpload ? "กำลังอัปโหลด..." : "ยืนยันอัปโหลด"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Detail Modal */}
      {showGoalDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5">
              <h3 className="text-xl font-bold text-white">รายการเป้าหมายเดือนนี้</h3>
              <button
                onClick={() => setShowGoalDetail(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {goalListForMonth.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <TargetIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="mb-2 text-lg font-medium text-gray-900">ยังไม่มีเป้าหมาย</p>
                  <p className="text-sm text-gray-500">สำหรับเดือนนี้</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {goalListForMonth.map((g) => (
                    <div
                      key={`${g.platform}-${g.type}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
                          {g.platform === "all" ? "All" : g.platform.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{g.platform === "all" ? "ทุกแพลตฟอร์ม" : g.platform}</p>
                          <p className="text-sm text-gray-500">{g.type === "revenue" ? "รายได้" : "กำไรสุทธิ"}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-indigo-600">{currency(g.target)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  const textColor =
    color === "blue"
      ? "text-blue-600"
      : color === "green"
        ? "text-green-600"
        : color === "red"
          ? "text-red-600"
          : color === "orange"
            ? "text-orange-600"
            : color === "cyan"
              ? "text-cyan-600"
              : color === "purple"
                ? "text-purple-600"
                : color === "indigo"
                  ? "text-indigo-600"
                  : "text-gray-900";

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
