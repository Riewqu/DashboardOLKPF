/**
 * Currency Utilities
 * ฟังก์ชันสำหรับจัดการการแสดงผลสกุลเงิน
 */

export function currency(value: number, options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? 2;
  return `฿${value.toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function currencyCompact(value: number): string {
  if (value >= 1000000) {
    return `฿${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `฿${(value / 1000).toFixed(1)}K`;
  }
  return currency(value);
}
