/**
 * Transaction Types
 * รวม type definitions สำหรับ transactions
 */

import { PlatformName } from "./platform";
import type { PlatformMetrics } from "../transactionParser";

export type TransactionRow = {
  platform: PlatformName;
  external_id: string; // Order ID / หมายเลขคำสั่งซื้อ
  sku: string; // SKU ร้านค้า
  type: string; // Order/Adjustment (สำหรับ TikTok)
  order_date: string | null; // ISO date string (YYYY-MM-DD)
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
  raw_data: Record<string, unknown>; // เก็บแถวดิบทั้งหมด
};

export type ParseResult = {
  transactions: TransactionRow[];
  metrics: PlatformMetrics;
  warnings: string[];
};

export type UploadSummary = {
  totalRows: number;
  newRows?: number;
  updatedRows?: number;
  errorRows?: number;
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
};

export type UploadRecord = {
  file: string;
  rows: number;
  status: string;
  settlement: number;
  platform: string;
  created_at?: string;
};
