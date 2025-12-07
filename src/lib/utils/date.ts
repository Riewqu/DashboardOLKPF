/**
 * Date Utilities
 * ฟังก์ชันสำหรับจัดการวันที่
 */

export function formatDate(dateString?: string): string {
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
}

export function normalizeDate(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

export function isDateInRange(date: string, start?: string, end?: string): boolean {
  if (!date) return true;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}
