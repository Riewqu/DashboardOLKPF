import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type LazadaSummary = {
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
  trend: number[];
  trendDates: string[];
  rows: number;
  breakdown: Record<string, number>;
  perDay: { date: string; revenue: number; fees: number; adjustments: number }[];
  feeGroups?: { title: string; items: { label: string; value: number }[] }[];
  revenueGroups?: { title: string; items: { label: string; value: number; children?: { label: string; value: number }[] }[] }[];
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const normalizeDate = (value: unknown): string | undefined => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.trim()) return new Date(value).toISOString().slice(0, 10);
  return undefined;
};

export function loadLazadaFromExcel(): LazadaSummary | null {
  try {
    const filePath = path.join(process.cwd(), "data", "Lazada.xlsx");
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

    const nameCol = "ชื่อรายการธุรกรรม";
    const amountCol = "จำนวนเงิน(รวมภาษี)";
    const dateCol = "วันที่สร้างคำสั่งซื้อ";

    const revenueKeys = ["ยอดรวมค่าสินค้า", "คืนส่วนลดค่าธรรมเนียมการขายสินค้า"];
    const expenseKeys = [
      "หักค่าธรรมเนียมการขายสินค้า",
      "ค่าธรรมเนียมการชำระเงิน",
      "ส่วนลดค่าขนส่ง จ่ายโดยร้านค้า",
      "ส่วนต่างค่าจัดส่ง"
    ];

  let revenue = 0;
  let fees = 0;
  const perDay = new Map<string, number>();
  const perDayMap = new Map<string, { revenue: number; fees: number; adjustments: number }>();
  const breakdown: Record<string, number> = {};
  const revenueMap = new Map<string, number>();

  for (const row of rows) {
    const name = String(row[nameCol] ?? "").trim();
    const amount = toNumber(row[amountCol]);
    if (revenueKeys.includes(name)) {
      revenue += amount;
      breakdown[name] = (breakdown[name] ?? 0) + amount;
      revenueMap.set(name, (revenueMap.get(name) ?? 0) + amount);
    }
    if (expenseKeys.includes(name)) {
      fees += amount;
      breakdown[name] = (breakdown[name] ?? 0) + amount;
    }
      const date = normalizeDate(row[dateCol]);
      if (date) {
        perDay.set(date, (perDay.get(date) ?? 0) + amount);
        const existing = perDayMap.get(date) ?? { revenue: 0, fees: 0, adjustments: 0 };
        perDayMap.set(date, {
          revenue: existing.revenue + (revenueKeys.includes(name) ? amount : 0),
          fees: existing.fees + (expenseKeys.includes(name) ? amount : 0),
          adjustments: existing.adjustments
        });
      }
    }

    const adjustments = 0;
    const settlement = revenue + fees + adjustments;

    const sortedDates = Array.from(perDay.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
    const last7 = sortedDates.slice(-7);

    return {
      revenue,
      fees,
      adjustments,
      settlement,
      trendDates: last7.map(([d]) => d),
      trend: last7.map(([, v]) => Number(v)),
      rows: rows.length,
      breakdown,
      perDay: Array.from(perDayMap.entries()).map(([date, values]) => ({
        date,
        revenue: values.revenue,
        fees: values.fees,
        adjustments: values.adjustments
      })),
      feeGroups: [
        {
          title: "ค่าธรรมเนียม (Lazada)",
          items: Object.entries(breakdown).map(([label, value]) => ({ label, value }))
        }
      ],
      revenueGroups: [
        {
          title: "รายได้ (Lazada)",
          items: [
            {
              label: "รายได้รวม",
              value: revenue,
              children: Array.from(revenueMap.entries()).map(([label, value]) => ({ label, value }))
            }
          ]
        }
      ]
    };
  } catch (err) {
    console.error("loadLazadaFromExcel error:", err);
    return null;
  }
}
