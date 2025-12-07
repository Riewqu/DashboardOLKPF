/**
 * Number Utilities
 * ฟังก์ชันสำหรับจัดการตัวเลข
 */

export function toNumber(value: unknown): number {
  // ถ้าเป็น number อยู่แล้ว
  if (typeof value === "number") return value;

  // ถ้าเป็น null/undefined
  if (value === null || value === undefined) return 0;

  // แปลงเป็น string แล้วทำความสะอาด
  let str = String(value).trim();

  // ลบ comma, space, currency symbols (฿, $, etc.)
  str = str.replace(/[,\s฿$€£¥]/g, "");

  // ลบ quotes ถ้ามี
  str = str.replace(/["']/g, "");

  // แปลงเป็นตัวเลข
  const n = Number(str);

  // ถ้าแปลงไม่ได้ ให้ return 0
  return Number.isFinite(n) ? n : 0;
}

export function getString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}
