import * as XLSX from "xlsx";
import { normalizeProvince, type ProvinceAliasMap } from "./provinceMapper";

export type ProductSaleRow = {
  productName: string;
  variantName: string;
  variantCode: string;
  qtyConfirmed: number;
  revenueConfirmed: number;
  rowNo: number;
  orderId?: string | null;
  qtyReturned?: number;
  provinceRaw?: string | null;
  provinceNormalized?: string | null;
  raw: Record<string, unknown>;
};

export type ProductSaleSummary = {
  totalRows: number;
  totalProducts: number;
  totalVariants: number;
  totalQty: number;
  totalRevenue: number;
  totalReturned: number;
  warnings: string[];
  unmappedProvinces?: string[]; // จังหวัดที่ไม่สามารถ normalize ได้
};

export const SHOPEE_CODE_COLUMNS = {
  orderId: "หมายเลขคำสั่งซื้อ", // Order ID for deduplication
  orderStatus: "สถานะการสั่งซื้อ",
  skuCode: "เลขอ้างอิง SKU (SKU Reference No.)",
  quantity: "จำนวน",
  netPrice: "ราคาขายสุทธิ",
  sellerDiscount: "โค้ดส่วนลดชำระโดยผู้ขาย",
  refundStatus: "สถานะการคืนเงินหรือคืนสินค้า",
  refundQty: "จำนวนที่ส่งคืน",
  province: "จังหวัด" // Optional field
} as const;

const SHOPEE_COLUMN_ALIASES: Record<keyof typeof SHOPEE_CODE_COLUMNS, string[]> = {
  orderId: ["หมายเลขคำสั่งซื้อ", "Order Number", "Order ID", "เลขที่คำสั่งซื้อ"],
  orderStatus: ["สถานะการสั่งซื้อ", "Order Status"],
  skuCode: ["เลขอ้างอิง SKU (SKU Reference No.)", "SKU Reference No.", "SKU Reference"],
  quantity: ["จำนวน", "จำนวนที่ขายได้ (ยืนยันแล้ว)", "Quantity"],
  netPrice: ["ราคาขายสุทธิ", "Net Price", "ยอดขาย (ยืนยันแล้ว) (THB)"],
  sellerDiscount: ["โค้ดส่วนลดชำระโดยผู้ขาย", "Seller Voucher", "Seller Discount"],
  refundStatus: ["สถานะการคืนเงินหรือคืนสินค้า", "Refund/Return Status"],
  refundQty: ["จำนวนที่ส่งคืน", "Return Quantity", "Quantity Returned"],
  province: ["จังหวัด", "Province", "จังหวัดผู้ซื้อ", "Buyer Province"]
};

type ParseOptions = {
  codeNameMap?: Record<string, string>;
  strictMapping?: boolean; // ถ้า true และหา mapping ไม่เจอ จะไม่บันทึกแถว
  provinceAliases?: Partial<ProvinceAliasMap>;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[,\s฿$€£¥]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Normalize variant codes for flexible matching
 * Examples:
 *   "KL0-4010, 4008" -> "KL0-4008,KL0-4010" (sorted)
 *   "KL0-4010,\nKL0-4008" -> "KL0-4008,KL0-4010"
 *   "KL0-4008,KL0-4010" -> "KL0-4008,KL0-4010"
 */
function normalizeVariantCode(code: string): string {
  if (!code) return "";

  // Split by comma or newline
  const parts = code
    .split(/[,\n\r]+/)
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  // Extract prefix from first code (e.g., "KL0-" from "KL0-4010")
  const firstCode = parts[0];
  const prefixMatch = firstCode.match(/^([A-Z]+\d*-)/);
  const prefix = prefixMatch ? prefixMatch[1] : "";

  // Normalize each part: add prefix if missing
  const normalized = parts.map(part => {
    // If part doesn't have prefix but starts with digits, add prefix
    if (prefix && /^\d/.test(part) && !part.includes("-")) {
      return prefix + part;
    }
    return part;
  });

  // Sort alphabetically for consistent ordering
  normalized.sort();

  return normalized.join(",");
}

/**
 * Build flexible code mapping that supports multiple variations
 */
function buildFlexibleMapping(codeNameMap: Record<string, string>): {
  exact: Map<string, string>;
  normalized: Map<string, string>;
  individual: Map<string, string>;
} {
  const exact = new Map<string, string>();
  const normalized = new Map<string, string>();
  const individual = new Map<string, string>();

  for (const [code, name] of Object.entries(codeNameMap)) {
    // Exact match
    exact.set(code, name);

    // Normalized match
    const normalizedCode = normalizeVariantCode(code);
    if (normalizedCode) {
      normalized.set(normalizedCode, name);
    }

    // Individual code matches (for multi-code products)
    const parts = code.split(/[,\n\r]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      parts.forEach(part => {
        if (!individual.has(part)) {
          individual.set(part, name);
        }
      });
    }
  }

  return { exact, normalized, individual };
}

/**
 * Smart matching: try multiple strategies to find product name
 */
function findProductName(
  sku: string,
  mapping: { exact: Map<string, string>; normalized: Map<string, string>; individual: Map<string, string> }
): string | null {
  // Strategy 1: Exact match
  if (mapping.exact.has(sku)) {
    return mapping.exact.get(sku)!;
  }

  // Strategy 2: Normalized match
  const normalizedSku = normalizeVariantCode(sku);
  if (normalizedSku && mapping.normalized.has(normalizedSku)) {
    return mapping.normalized.get(normalizedSku)!;
  }

  // Strategy 3: Individual code match (for single codes in multi-code products)
  if (mapping.individual.has(sku)) {
    return mapping.individual.get(sku)!;
  }

  return null;
}

export function parseShopeeProductSales(
  buffer: Buffer,
  options: ParseOptions = {}
): { rows: ProductSaleRow[]; summary: ProductSaleSummary; missingCodes?: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const firstRowKeys = Object.keys(jsonRows[0] ?? {});
  const headerMap = new Map<string, string>();
  firstRowKeys.forEach((key) => headerMap.set(normalizeHeader(key), key));

  const resolvedHeaders: Record<keyof typeof SHOPEE_CODE_COLUMNS, string> = {} as Record<keyof typeof SHOPEE_CODE_COLUMNS, string>;
  const missing: string[] = [];
  const optionalColumns = ["province", "orderId"]; // Optional columns that won't cause errors if missing

  (Object.keys(SHOPEE_COLUMN_ALIASES) as Array<keyof typeof SHOPEE_CODE_COLUMNS>).forEach((col) => {
    const found = SHOPEE_COLUMN_ALIASES[col].find((name) => headerMap.has(normalizeHeader(name)));
    if (found) {
      resolvedHeaders[col] = headerMap.get(normalizeHeader(found)) as string;
    } else if (!optionalColumns.includes(col)) {
      missing.push(SHOPEE_COLUMN_ALIASES[col][0]);
    }
  });

  if (missing.length > 0) {
    throw new Error(`ไฟล์ขาดคอลัมน์ที่จำเป็น: ${missing.join(", ")}`);
  }

  // Build flexible mapping for smart matching
  const flexibleMapping = options.codeNameMap
    ? buildFlexibleMapping(options.codeNameMap)
    : { exact: new Map(), normalized: new Map(), individual: new Map() };

  const warnings: string[] = [];
  const rows: ProductSaleRow[] = [];
  const products = new Set<string>();
  const variants = new Set<string>();
  const missingCodes = new Set<string>();
  const unmappedProvinces = new Set<string>();

  jsonRows.forEach((row, idx) => {
    const rowNo = idx + 2;
    const status = String(row[resolvedHeaders.orderStatus] ?? "").trim();
    // skip shipping / cancelled states
    if (status.includes("การจัดส่ง") || status.includes("ยกเลิกแล้ว")) return;

    const skuRaw = row[resolvedHeaders.skuCode];
    const sku = typeof skuRaw === "number" ? String(skuRaw) : String(skuRaw ?? "").trim();
    if (!sku) {
      warnings.push(`แถวที่ ${rowNo}: ไม่มี SKU Reference No. ข้ามแถวนี้`);
      return;
    }

    // Extract Order ID (optional)
    const orderIdRaw = resolvedHeaders.orderId ? row[resolvedHeaders.orderId] : null;
    const orderId = orderIdRaw ? String(orderIdRaw).trim() : null;

    // Smart matching with multiple strategies
    const mappedName = findProductName(sku, flexibleMapping);
    if (!mappedName) {
      missingCodes.add(sku);
      if (options.strictMapping) {
        warnings.push(`แถวที่ ${rowNo}: ไม่พบ mapping สำหรับรหัส ${sku} (ข้ามแถว)`);
        return;
      }
    }

    const productName = mappedName ?? sku;
    const variantName = productName;

    const quantity = toNumber(row[resolvedHeaders.quantity]);
    const netPrice = toNumber(row[resolvedHeaders.netPrice]);
    const sellerDiscount = toNumber(row[resolvedHeaders.sellerDiscount]);
    const refundStatus = String(row[resolvedHeaders.refundStatus] ?? "").trim();
    const refundQty = toNumber(row[resolvedHeaders.refundQty]);

    const isReturn = refundStatus === "คำขอได้รับการยอมรับแล้ว";
    const qtyConfirmed = isReturn ? 0 : quantity;
    const qtyReturned = isReturn ? refundQty : 0;
    const revenueConfirmed = isReturn ? 0 : netPrice - sellerDiscount;

    // Extract and normalize province
    const provinceRaw = resolvedHeaders.province ? String(row[resolvedHeaders.province] ?? "").trim() : null;
    const provinceNormalized = provinceRaw ? normalizeProvince(provinceRaw, options.provinceAliases) : null;

    // Track unmapped provinces
    if (provinceRaw && !provinceNormalized) {
      unmappedProvinces.add(provinceRaw);
    }

    products.add(productName);
    variants.add(variantName);

    rows.push({
      productName,
      variantName,
      variantCode: sku,
      orderId: orderId || null,
      qtyConfirmed,
      qtyReturned,
      revenueConfirmed,
      rowNo,
      provinceRaw: provinceRaw || null,
      provinceNormalized: provinceNormalized || null,
      raw: row
    });
  });

  const summary: ProductSaleSummary = {
    totalRows: rows.length,
    totalProducts: products.size,
    totalVariants: variants.size,
    totalQty: rows.reduce((s, r) => s + r.qtyConfirmed, 0),
    totalRevenue: rows.reduce((s, r) => s + r.revenueConfirmed, 0),
    totalReturned: rows.reduce((s, r) => s + (r.qtyReturned ?? 0), 0),
    warnings: [...warnings, ...Array.from(missingCodes).map((c) => `ไม่พบ mapping สำหรับรหัส ${c}`)],
    unmappedProvinces: Array.from(unmappedProvinces)
  };

  return { rows, summary, missingCodes: Array.from(missingCodes) };
}

export const TIKTOK_COLUMNS = {
  orderStatus: "Order Status",
  orderSubstatus: "Order Substatus",
  cancelType: "Cancelation/Return Type",
  orderId: "Order ID",
  skuId: "SKU ID",
  quantity: "Quantity",
  returnedQty: "Sku Quantity of return",
  province: "Province" // Optional field
} as const;

export const TIKTOK_REQUIRED_COLUMNS = [
  "Order Status",
  "Order Substatus",
  "Cancelation/Return Type",
  "Order ID",
  "SKU ID",
  "Quantity",
  "SKU Subtotal Before Discount",
  "SKU Seller Discount",
  "Sku Quantity of return",
  "Province"
] as const;

const TIKTOK_COLUMN_ALIASES: Record<keyof typeof TIKTOK_COLUMNS, string[]> = {
  orderStatus: ["Order Status"],
  orderSubstatus: ["Order Substatus"],
  cancelType: ["Cancelation/Return Type", "Cancellation/Return Type", "Cancellation / Return Type"],
  orderId: ["Order ID", "OrderID"],
  skuId: ["SKU ID", "Sku Id", "SkuID"],
  quantity: ["Quantity", "Qty"],
  returnedQty: ["Sku Quantity of return", "SKU Quantity of return", "Quantity of return", "Return Quantity"],
  province: ["Province", "จังหวัด", "Buyer Province", "Delivery Province"]
};

const TIKTOK_SUBTOTAL_ALIASES = [
  "SKU Subtotal Before Discount",
  "SKU Subtotal Before Discount (THB)",
  "SKU Subtotal",
  "Subtotal",
  "Sku Subtotal Before Discount"
];

const TIKTOK_SELLER_DISCOUNT_ALIASES = [
  "SKU Seller Discount",
  "Seller Discount",
  "Sku Seller Discount"
];

const normalizeHeader = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

// Lazada columns
export const LAZADA_COLUMNS = {
  status: "status",
  unitPrice: "unitPrice",
  orderItemId: "orderItemId",
  sellerSku: "sellerSku"
} as const;

const LAZADA_COLUMN_ALIASES: Record<keyof typeof LAZADA_COLUMNS, string[]> = {
  status: ["status", "Status"],
  unitPrice: ["unitPrice", "Unit Price", "Unit price"],
  orderItemId: ["orderItemId", "Order Item Id", "OrderItemId", "Order Item ID"],
  sellerSku: ["sellerSku", "Seller SKU", "seller_sku", "SellerSku"]
};

export function parseTikTokProductSales(
  buffer: Buffer,
  options: ParseOptions = {}
): { rows: ProductSaleRow[]; summary: ProductSaleSummary; missingCodes?: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const firstRowKeys = Object.keys(jsonRows[0] ?? {});
  const headerMap = new Map<string, string>();
  firstRowKeys.forEach((key) => headerMap.set(normalizeHeader(key), key));

  const resolvedHeaders: Record<keyof typeof TIKTOK_COLUMNS, string> = {} as Record<keyof typeof TIKTOK_COLUMNS, string>;
  const missing: string[] = [];

  const resolveAlias = (aliases: string[]) => aliases.find((name) => headerMap.has(normalizeHeader(name)));

  const optionalTikTokColumns = ["province"]; // Optional columns

  (Object.keys(TIKTOK_COLUMN_ALIASES) as Array<keyof typeof TIKTOK_COLUMNS>).forEach((col) => {
    const aliases = TIKTOK_COLUMN_ALIASES[col];
    const found = resolveAlias(aliases);
    if (found) {
      resolvedHeaders[col] = headerMap.get(normalizeHeader(found)) as string;
    } else if (!optionalTikTokColumns.includes(col)) {
      missing.push(aliases[0]);
    }
  });

  const resolvedSubtotal = resolveAlias(TIKTOK_SUBTOTAL_ALIASES);
  const resolvedSellerDiscount = resolveAlias(TIKTOK_SELLER_DISCOUNT_ALIASES);

  const hasSubtotalAndDiscount = Boolean(resolvedSubtotal && resolvedSellerDiscount);
  if (!hasSubtotalAndDiscount) {
    missing.push(TIKTOK_SUBTOTAL_ALIASES[0], TIKTOK_SELLER_DISCOUNT_ALIASES[0]);
  }

  if (missing.length > 0) {
    throw new Error(`ไฟล์ขาดคอลัมน์ที่จำเป็น: ${missing.join(", ")}`);
  }

  // Build flexible mapping for smart matching
  const flexibleMapping = options.codeNameMap
    ? buildFlexibleMapping(options.codeNameMap)
    : { exact: new Map(), normalized: new Map(), individual: new Map() };

  const warnings: string[] = [];
  const rows: ProductSaleRow[] = [];
  const products = new Set<string>();
  const variants = new Set<string>();
  const missingCodes = new Set<string>();
  const unmappedProvinces = new Set<string>();

  jsonRows.forEach((row, idx) => {
    const rowNo = idx + 2;
    const status = String(row[resolvedHeaders.orderStatus] ?? "").trim();
    const substatus = String(row[resolvedHeaders.orderSubstatus] ?? "").trim();
    const cancelType = String(row[resolvedHeaders.cancelType] ?? "").trim();
    const skuIdRaw = row[resolvedHeaders.skuId];
    const orderIdRaw = row[resolvedHeaders.orderId];
    const skuId = typeof skuIdRaw === "number" ? String(skuIdRaw) : String(skuIdRaw ?? "").trim();
    const orderId = typeof orderIdRaw === "number" ? String(orderIdRaw) : String(orderIdRaw ?? "").trim() || null;

    if (status !== "เสร็จสมบูรณ์" || substatus !== "เสร็จสมบูรณ์") return;
    if (!skuId) {
      warnings.push(`แถวที่ ${rowNo}: ไม่มี SKU ID ข้ามแถวนี้`);
      return;
    }

    // Smart matching with multiple strategies
    const mappedName = findProductName(skuId, flexibleMapping);
    if (!mappedName) {
      missingCodes.add(skuId);
      if (options.strictMapping) {
        warnings.push(`แถวที่ ${rowNo}: ไม่พบ mapping สำหรับรหัส ${skuId} (ข้ามแถว)`);
        return;
      }
    }

    const productName = mappedName ?? skuId;
    const variantName = productName;
    const qtyConfirmed = toNumber(row[resolvedHeaders.quantity]);
    const revenueConfirmed = toNumber(row[resolvedSubtotal!]) - toNumber(row[resolvedSellerDiscount!]);
    const qtyReturned = toNumber(row[resolvedHeaders.returnedQty]);

    const isNormalSale = cancelType === "";
    const isReturn = cancelType === "Return/Refund";
    if (!isNormalSale && !isReturn) {
      // skip other statuses
      return;
    }

    // Extract and normalize province
    const provinceRaw = resolvedHeaders.province ? String(row[resolvedHeaders.province] ?? "").trim() : null;
    const provinceNormalized = provinceRaw ? normalizeProvince(provinceRaw, options.provinceAliases) : null;

    // Track unmapped provinces
    if (provinceRaw && !provinceNormalized) {
      unmappedProvinces.add(provinceRaw);
    }

    products.add(productName);
    variants.add(variantName);

    rows.push({
      productName,
      variantName,
      variantCode: skuId,
      orderId,
      qtyConfirmed: isReturn ? 0 : qtyConfirmed,
      revenueConfirmed: isReturn ? 0 : revenueConfirmed,
      qtyReturned: isReturn ? qtyReturned : 0,
      rowNo,
      provinceRaw: provinceRaw || null,
      provinceNormalized: provinceNormalized || null,
      raw: row
    });
  });

  const summary: ProductSaleSummary = {
    totalRows: rows.length,
    totalProducts: products.size,
    totalVariants: variants.size,
    totalQty: rows.reduce((s, r) => s + r.qtyConfirmed, 0),
    totalRevenue: rows.reduce((s, r) => s + r.revenueConfirmed, 0),
    totalReturned: rows.reduce((s, r) => s + (r.qtyReturned ?? 0), 0),
    warnings: [...warnings, ...Array.from(missingCodes).map((c) => `ไม่พบ mapping สำหรับรหัส ${c}`)],
    unmappedProvinces: Array.from(unmappedProvinces)
  };

  return { rows, summary };
}

export function parseLazadaProductSales(
  buffer: Buffer,
  options: ParseOptions = {}
): { rows: ProductSaleRow[]; summary: ProductSaleSummary; missingCodes?: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const firstRowKeys = Object.keys(jsonRows[0] ?? {});
  const headerMap = new Map<string, string>();
  firstRowKeys.forEach((key) => headerMap.set(normalizeHeader(key), key));

  const resolvedHeaders: Record<keyof typeof LAZADA_COLUMNS, string> = {} as Record<keyof typeof LAZADA_COLUMNS, string>;
  const missing: string[] = [];

  (Object.keys(LAZADA_COLUMN_ALIASES) as Array<keyof typeof LAZADA_COLUMNS>).forEach((col) => {
    const aliases = LAZADA_COLUMN_ALIASES[col];
    const found = aliases.find((name) => headerMap.has(normalizeHeader(name)));
    if (found) {
      resolvedHeaders[col] = headerMap.get(normalizeHeader(found)) as string;
    } else {
      missing.push(aliases[0]);
    }
  });

  if (missing.length > 0) {
    throw new Error(`ไฟล์ขาดคอลัมน์ที่จำเป็น: ${missing.join(", ")}`);
  }

  const flexibleMapping = options.codeNameMap
    ? buildFlexibleMapping(options.codeNameMap)
    : { exact: new Map(), normalized: new Map(), individual: new Map() };

  const warnings: string[] = [];
  const missingCodes = new Set<string>();
  const products = new Set<string>();
  const variants = new Set<string>();

  type Group = {
    productName: string;
    variantName: string;
    variantCode: string;
    orderId: string | null;
    revenue: number;
    confirmedCount: number;
    returnedCount: number;
    rowNo: number;
    raw: Record<string, unknown>;
  };

  const groups = new Map<string, Group>();

  jsonRows.forEach((row, idx) => {
    const rowNo = idx + 2;
    const statusRaw = String(row[resolvedHeaders.status] ?? "").trim().toLowerCase();
    if (statusRaw !== "confirmed" && statusRaw !== "returned") return;

    const orderItemIdRaw = row[resolvedHeaders.orderItemId];
    const orderItemId = typeof orderItemIdRaw === "number" ? String(orderItemIdRaw) : String(orderItemIdRaw ?? "").trim();
    const sellerSkuRaw = row[resolvedHeaders.sellerSku];
    const sellerSku = typeof sellerSkuRaw === "number" ? String(sellerSkuRaw) : String(sellerSkuRaw ?? "").trim();
    const unitPrice = toNumber(row[resolvedHeaders.unitPrice]);

    if (!sellerSku) {
      warnings.push(`แถวที่ ${rowNo}: ไม่มี sellerSku ข้ามแถวนี้`);
      return;
    }
    if (!orderItemId) {
      warnings.push(`แถวที่ ${rowNo}: ไม่มี orderItemId ข้ามแถวนี้`);
      return;
    }

    const mappedName = findProductName(sellerSku, flexibleMapping);
    if (!mappedName) {
      missingCodes.add(sellerSku);
      if (options.strictMapping) {
        warnings.push(`แถวที่ ${rowNo}: ไม่พบ mapping สำหรับรหัส ${sellerSku} (ข้ามแถว)`);
        return;
      }
    }

    const productName = mappedName ?? sellerSku;
    const variantName = productName;

    const key = `${orderItemId}::${sellerSku}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        productName,
        variantName,
        variantCode: sellerSku,
        orderId: orderItemId,
        revenue: statusRaw === "confirmed" ? unitPrice : 0,
        confirmedCount: statusRaw === "confirmed" ? 1 : 0,
        returnedCount: statusRaw === "returned" ? 1 : 0,
        rowNo,
        raw: row
      });
    } else {
      if (statusRaw === "confirmed") {
        existing.confirmedCount += 1;
        existing.revenue += unitPrice;
      } else if (statusRaw === "returned") {
        existing.returnedCount += 1;
      }
      // keep earliest row number as representative
      existing.rowNo = Math.min(existing.rowNo, rowNo);
    }

    products.add(productName);
    variants.add(variantName);
  });

  const rows: ProductSaleRow[] = Array.from(groups.values()).map((g) => ({
    productName: g.productName,
    variantName: g.variantName,
    variantCode: g.variantCode,
    orderId: g.orderId,
    qtyConfirmed: g.confirmedCount,
    qtyReturned: g.returnedCount,
    revenueConfirmed: g.revenue,
    rowNo: g.rowNo,
    provinceRaw: null,
    provinceNormalized: null,
    raw: g.raw
  }));

  const summary: ProductSaleSummary = {
    totalRows: rows.length,
    totalProducts: products.size,
    totalVariants: variants.size,
    totalQty: rows.reduce((s, r) => s + r.qtyConfirmed, 0),
    totalRevenue: rows.reduce((s, r) => s + r.revenueConfirmed, 0),
    totalReturned: rows.reduce((s, r) => s + (r.qtyReturned ?? 0), 0),
    warnings: [
      ...warnings,
      ...Array.from(missingCodes).map((c) => `ไม่พบ mapping สำหรับรหัส ${c}`)
    ],
    unmappedProvinces: []
  };

  return { rows, summary, missingCodes: Array.from(missingCodes) };
}
