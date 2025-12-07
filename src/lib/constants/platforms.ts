/**
 * Platform Constants
 * ค่าคงที่สำหรับแพลตฟอร์มต่างๆ
 */

import { PlatformName } from "../types";

export const PLATFORMS: PlatformName[] = ["TikTok", "Shopee", "Lazada"];

export const PLATFORM_COLORS: Record<PlatformName, string> = {
  TikTok: "#ef4444",   // Red
  Shopee: "#f59e0b",   // Orange
  Lazada: "#3b82f6",   // Blue
};

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const ALLOWED_FILE_TYPES = [".xlsx", ".xls"];

export const PLATFORM_LABELS: Record<PlatformName, string> = {
  TikTok: "TikTok Shop",
  Shopee: "Shopee",
  Lazada: "Lazada",
};
