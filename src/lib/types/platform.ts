/**
 * Platform Types
 * รวม type definitions สำหรับแพลตฟอร์มต่างๆ
 */

export type PlatformName = "TikTok" | "Shopee" | "Lazada";

export type PlatformKPI = {
  platform: PlatformName;
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
  trend: number[];
  trendDates: string[];
  perDay: DailyMetric[];
  perDayPaid?: DailyMetric[];
  breakdown: Record<string, number>;
  feeGroups?: FeeGroup[];
  revenueGroups?: RevenueGroup[];
  rows?: number;
};

export type DailyMetric = {
  date: string;
  revenue: number;
  fees: number;
  adjustments: number;
};

export type FeeGroup = {
  title: string;
  items: FeeItem[];
};

export type FeeItem = {
  label: string;
  value: number;
  children?: {
    label: string;
    value: number;
  }[];
};

export type RevenueGroup = {
  title: string;
  items: RevenueItem[];
};

export type RevenueItem = {
  label: string;
  value: number;
  children?: {
    label: string;
    value: number;
  }[];
};
