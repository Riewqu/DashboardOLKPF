"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Target, ArrowLeft, Calendar, TrendingUp, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { PlatformKPI } from "@/lib/mockData";
import type { GoalRecord } from "../../../dataClient";

type Props = {
  platforms: PlatformKPI[];
  initialGoals: GoalRecord[];
};

const currency = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GoalsManagement({ platforms, initialGoals }: Props) {
  const now = useMemo(() => new Date(), []);
  const initialMonth = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [now]);

  const [goalMonth, setGoalMonth] = useState(initialMonth);
  const [goalPlatform, setGoalPlatform] = useState<"all" | "TikTok" | "Shopee" | "Lazada">("all");
  const [goalType, setGoalType] = useState<"revenue" | "profit">("profit");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalsState, setGoalsState] = useState(initialGoals);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fetchedGoalKeys = useRef<Set<string>>(new Set());

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
        setLoading(true);
        const res = await fetch(`/api/goals?year=${y}&month=${m}`);
        const json = await res.json();
        if (!res.ok) {
          setMessage({ type: "error", text: json.error || "โหลดเป้าหมายไม่สำเร็จ" });
          return;
        }
        setGoalsState((prev) => [...prev, ...(json.data || [])]);
      } catch {
        setMessage({ type: "error", text: "โหลดเป้าหมายไม่สำเร็จ" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [goalMonth, goalsState]);

  const handleSaveGoal = async () => {
    const [y, m] = goalMonth.split("-").map((v) => Number(v));
    const numericTarget = Number(goalTarget);
    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      setMessage({ type: "error", text: "กรอกตัวเลขเป้าหมายให้ถูกต้อง" });
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
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
        setMessage({ type: "error", text: json.error || "บันทึกเป้าหมายไม่สำเร็จ" });
        return;
      }
      const newGoal = json.data;
      setGoalsState((prev) => {
        const filtered = prev.filter(
          (g) => !(g.platform === newGoal.platform && g.year === newGoal.year && g.month === newGoal.month && g.type === newGoal.type)
        );
        return [...filtered, newGoal];
      });
      setMessage({ type: "success", text: "บันทึกเป้าหมายสำเร็จ" });
      setGoalTarget("");
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาด" });
    } finally {
      setLoading(false);
    }
  };

  const platformOptions = [
    { value: "all" as const, label: "ทุกแพลตฟอร์ม", color: "from-slate-500 to-slate-600" },
    { value: "TikTok" as const, label: "TikTok", color: "from-pink-500 to-purple-500" },
    { value: "Shopee" as const, label: "Shopee", color: "from-orange-500 to-red-500" },
    { value: "Lazada" as const, label: "Lazada", color: "from-blue-500 to-indigo-500" }
  ];

  const typeOptions = [
    { value: "revenue" as const, label: "รายได้", icon: <TrendingUp className="w-4 h-4" /> },
    { value: "profit" as const, label: "กำไร", icon: <DollarSign className="w-4 h-4" /> }
  ];

  const monthGoals = goalsState.filter((g) => g.year === goalYear && g.month === goalMonthNum);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:scale-105 transition-transform duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Goals Management
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                ตั้งและติดตามเป้าหมายรายเดือน
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Goal Form */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">ตั้งเป้าหมาย</h2>
                  <p className="text-sm text-slate-600">เลือกเดือนและแพลตฟอร์ม</p>
                </div>
              </div>

              {/* Month Picker */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">เลือกเดือน</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                  <input
                    type="month"
                    value={goalMonth}
                    onChange={(e) => setGoalMonth(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none bg-white transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Platform Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">แพลตฟอร์ม</label>
                <div className="grid grid-cols-2 gap-2">
                  {platformOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGoalPlatform(opt.value)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 text-sm font-semibold ${
                        goalPlatform === opt.value
                          ? `border-transparent bg-gradient-to-br ${opt.color} text-white shadow-lg`
                          : "border-blue-100 bg-white hover:border-blue-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">ประเภท</label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGoalType(opt.value)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 ${
                        goalType === opt.value
                          ? "border-transparent bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg"
                          : "border-blue-100 bg-white hover:border-blue-300"
                      }`}
                    >
                      {opt.icon}
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Amount */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">เป้าหมาย (บาท)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none bg-white transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveGoal}
                disabled={loading || !goalTarget}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {loading ? "กำลังบันทึก..." : "บันทึกเป้าหมาย"}
              </button>

              {/* Message */}
              {message && (
                <div
                  className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Progress & Goals List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Goal Progress */}
            {currentGoal && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-6 sm:p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">ความคืบหน้าปัจจุบัน</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">เป้าหมาย:</span>
                    <span className="text-2xl font-bold text-blue-600">{currency(targetValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">ปัจจุบัน:</span>
                    <span className="text-2xl font-bold text-green-600">{currency(actualValue)}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-600">ความคืบหน้า</span>
                      <span className="text-sm font-bold text-blue-600">{progressPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Goals for Selected Month */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 shadow-lg p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">
                เป้าหมายทั้งหมด ({goalMonthNum}/{goalYear})
              </h3>
              {monthGoals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <Target className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">ยังไม่มีเป้าหมายในเดือนนี้</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthGoals.map((goal, index) => {
                    const actual = computeActual(goal.platform);
                    const actualVal = goal.type === "revenue" ? actual.revenue : actual.revenue + actual.fees + actual.adjustments;
                    const progress = goal.target > 0 ? Math.min((actualVal / goal.target) * 100, 999) : 0;
                    const platformColor = platformOptions.find((p) => p.value === goal.platform)?.color || "from-slate-500 to-slate-600";

                    return (
                      <div key={index} className="p-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${platformColor} text-white text-sm font-semibold shadow-sm`}>
                            {goal.platform}
                          </div>
                          <span className="text-sm font-semibold text-slate-600">
                            {goal.type === "revenue" ? "รายได้" : "กำไร"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">เป้าหมาย:</span>
                            <span className="font-semibold text-slate-800">{currency(goal.target)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">ปัจจุบัน:</span>
                            <span className="font-semibold text-green-600">{currency(actualVal)}</span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-600">ความคืบหน้า</span>
                              <span className="text-xs font-bold text-blue-600">{progress.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
