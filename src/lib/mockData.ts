import { loadShopeeFromExcel } from "./shopeeLoader";
import { loadLazadaFromExcel } from "./lazadaLoader";
import { loadTikTokFromExcel } from "./tiktokLoader";

export type FeeBreakdown = {
  label: string;
  amount: number;
};

export type PlatformKPI = {
  platform: "TikTok" | "Shopee" | "Lazada";
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
  trend: number[];
  trendDates?: string[];
  perDay?: { date: string; revenue: number; fees: number; adjustments: number }[];
  perDayPaid?: { date: string; revenue: number; fees: number; adjustments: number }[];
  breakdown?: Record<string, number>;
  feeDetails?: {
    shipping: {
      buyerPaid: number;
      byShopee: number;
      shopeeNamed: number;
      returnShipping: number;
      shippingProgram: number;
      sellerReturn: number;
    };
    fee: {
      commissionAms: number;
      commission: number;
      service: number;
      infra: number;
      shippingProgramFee: number;
      payment: number;
    };
    vas: {
      installBuyer: number;
      installActual: number;
      tradeInBonus: number;
    };
  };
  feeGroups?: { title: string; items: { label: string; value: number }[] }[];
  revenueGroups?: { title: string; items: { label: string; value: number; children?: { label: string; value: number }[] }[] }[];
};

const shopee = loadShopeeFromExcel();
const lazada = loadLazadaFromExcel();
const tiktok = loadTikTokFromExcel();
const shopeeBreakdown = shopee?.breakdown as Record<string, number> | undefined;

// ตัวเลขจำลองจากไฟล์ Excel (คำนวณล่วงหน้า)
export const platforms: PlatformKPI[] = [
  {
    platform: "TikTok",
    revenue: tiktok?.revenue ?? 289216,
    fees: tiktok?.fees ?? -26322.36,
    adjustments: tiktok?.adjustments ?? 380,
    settlement: tiktok?.settlement ?? 263273.64,
    trend: tiktok?.trend ?? [8302.77, 10143.88, 7797.19, 4381.72, 2160.89, 911.76, 0.0],
    trendDates:
      tiktok?.trendDates ?? ["2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24", "2025-01-25", "2025-01-26", "2025-01-29"],
    perDay: tiktok?.perDay,
    breakdown: tiktok?.breakdown,
    feeGroups: tiktok?.feeGroups,
    revenueGroups: tiktok?.revenueGroups
  },
  {
    platform: "Shopee",
    revenue: shopee?.revenue ?? 28740,
    fees: shopee?.fees ?? -3034,
    adjustments: shopee?.adjustments ?? 0,
    settlement: shopee?.settlement ?? 25706,
    trend: shopee?.trend ?? [725.0, 638.0, 646.0, 627.0, 323.0, 576.0, 624.0],
    trendDates:
      shopee?.trendDates ?? ["2025-01-18", "2025-01-19", "2025-01-21", "2025-01-24", "2025-01-25", "2025-01-29", "2025-01-31"],
    perDay: shopee?.perDay,
    breakdown: shopee?.breakdown,
    feeDetails: shopee?.feeDetails,
    feeGroups:
      shopee?.feeGroups ??
      [
        {
          title: "ค่าจัดส่ง",
          items: [
            { label: "ค่าจัดส่งที่ชำระโดยผู้ซื้อ", value: shopeeBreakdown?.["ค่าจัดส่งที่ชำระโดยผู้ซื้อ (Shopee)"] ?? 4153 },
            { label: "ค่าจัดส่งสินค้าที่ออกโดย Shopee", value: shopeeBreakdown?.["ส่วนลด/ชำระค่าจัดส่งโดย Shopee"] ?? -5035 }
          ]
        },
        {
          title: "ค่าธรรมเนียม",
          items: [
            { label: "ค่าคอมมิชชั่นแพลตฟอร์ม", value: shopeeBreakdown?.["ค่าคอมมิชชั่นแพลตฟอร์ม (Shopee)"] ?? -1557 },
            { label: "ค่าธุรกรรมการชำระเงิน", value: shopeeBreakdown?.["ค่าธุรกรรมการชำระเงิน (Shopee)"] ?? -595 }
          ]
        }
      ],
    revenueGroups: shopee?.revenueGroups
  },
  {
    platform: "Lazada",
    revenue: lazada?.revenue ?? 2362.82,
    fees: lazada?.fees ?? -559.76,
    adjustments: lazada?.adjustments ?? 0,
    settlement: lazada?.settlement ?? 1803.06,
    trend: lazada?.trend ?? [35.92, 335.04, 52.14, 44.9, 268.82, 103.82, 698.62],
    trendDates:
      lazada?.trendDates ?? ["2025-02-09", "2025-02-13", "2025-02-17", "2025-02-27", "2025-03-20", "2025-09-13", "2025-09-17"],
    perDay: lazada?.perDay,
    breakdown: lazada?.breakdown,
    feeGroups: lazada?.feeGroups,
    revenueGroups: lazada?.revenueGroups
  }
];

export const feesBreakdown: FeeBreakdown[] = [
  { label: "ค่าจัดส่งที่ชำระโดยผู้ซื้อ (Shopee)", amount: shopee?.breakdown.shippingBuyer ?? 4153 },
  { label: "ส่วนลด/ชำระค่าจัดส่งโดย Shopee", amount: shopee?.breakdown.shippingShopee ?? -5035 },
  { label: "ค่าคอมมิชชั่นแพลตฟอร์ม (Shopee)", amount: shopee?.breakdown.commission ?? -1557 },
  { label: "ค่าธุรกรรมการชำระเงิน (Shopee)", amount: shopee?.breakdown.paymentFee ?? -595 },
  { label: "ค่าจัดส่งอื่นๆ/คืนสินค้า (Shopee)", amount: 0 }, // รวมคอลัมน์ขนส่งอื่น
  { label: "ค่าธรรมเนียมอื่น/บริการ (Shopee)", amount: shopee?.breakdown.other ?? 0 }
];

export const adjustmentsBreakdown: FeeBreakdown[] = [
  { label: "ไม่มีรายการปรับยอด (Shopee)", amount: 0 }
];

export const recentUploads = [
  { file: "tiktok.xlsx", rows: tiktok?.rows ?? 730, status: "สำเร็จ (ใช้ไฟล์จริง)", settlement: tiktok?.settlement ?? 263273.64 },
  { file: "Shopee.xlsx", rows: shopee?.rows ?? 32, status: "สำเร็จ (ใช้ไฟล์จริง)", settlement: shopee?.settlement ?? 22672 },
  { file: "Lazada.xlsx", rows: lazada?.rows ?? 80, status: "สำเร็จ (ใช้ไฟล์จริง)", settlement: lazada?.settlement ?? 1803.06 }
];
