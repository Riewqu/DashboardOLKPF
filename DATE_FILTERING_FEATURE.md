# Date Filtering Feature

## Overview

Added support for filtering product sales and province data by order date. This allows users to analyze sales performance for specific date ranges.

## Implementation Summary

### 1. Database Changes

**File**: `supabase_add_order_date.sql`

- Added `order_date` column to `product_sales` table (type: DATE)
- Created performance indexes:
  - `idx_product_sales_order_date` - Single column index for date queries
  - `idx_product_sales_platform_date` - Composite index for platform + date queries
  - `idx_product_sales_province_date` - Composite index for province + date queries (filtered WHERE province_normalized IS NOT NULL)

**SQL Migration**:
```sql
ALTER TABLE product_sales ADD COLUMN IF NOT EXISTS order_date DATE;
CREATE INDEX IF NOT EXISTS idx_product_sales_order_date ON product_sales(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_product_sales_platform_date ON product_sales(platform, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_product_sales_province_date ON product_sales(province_normalized, order_date DESC) WHERE province_normalized IS NOT NULL;
```

### 2. Parser Updates

**File**: `src/lib/productSales.ts`

#### New Function: `parseOrderDate()`

Handles platform-specific date formats:
- **Shopee**: `"2025-11-29 18:00"` → YYYY-MM-DD HH:mm
- **TikTok**: `"30/11/2025 12:08:42"` → DD/MM/YYYY HH:mm:ss
- **Lazada**: `"15 Sep 2025 12:09:50"` → DD MMM YYYY HH:mm:ss

Returns ISO date string (YYYY-MM-DD) or null if parsing fails.

#### Column Definitions Updated

**Shopee**:
```typescript
export const SHOPEE_CODE_COLUMNS = {
  // ... existing columns
  createdTime: "วันที่ทำการสั่งซื้อ" // Order date
};

const SHOPEE_COLUMN_ALIASES = {
  // ... existing columns
  createdTime: ["วันที่ทำการสั่งซื้อ", "Created Time", "Order Date", "วันที่สั่งซื้อ"]
};
```

**TikTok**:
```typescript
export const TIKTOK_COLUMNS = {
  // ... existing columns
  createdTime: "Created Time" // Order date
};

const TIKTOK_COLUMN_ALIASES = {
  // ... existing columns
  createdTime: ["Created Time", "Create Time", "Order Date", "Created At"]
};
```

**Lazada**:
```typescript
export const LAZADA_COLUMNS = {
  // ... existing columns
  createTime: "createTime" // Order date
};

const LAZADA_COLUMN_ALIASES = {
  // ... existing columns
  createTime: ["createTime", "Create Time", "Created Time", "Order Date", "createtime"]
};
```

#### Type Definition Updated

```typescript
export type ProductSaleRow = {
  // ... existing fields
  orderDate?: string | null; // NEW: ISO date string (YYYY-MM-DD)
  raw: Record<string, unknown>;
};
```

#### Parser Integration

All three parser functions (`parseShopeeProductSales`, `parseTikTokProductSales`, `parseLazadaProductSales`) now:
1. Extract date from the appropriate column
2. Parse it using `parseOrderDate(platform)`
3. Add `orderDate` to the returned `ProductSaleRow` objects

### 3. Upload Route Updates

**File**: `src/app/api/product-sales/upload/route.ts`

Updated to save `order_date` to database:
```typescript
const insertRows = parsed.rows.map((row) => ({
  // ... existing fields
  order_date: row.orderDate ?? null, // NEW
  // ... rest of fields
}));
```

### 4. Database Types Updates

**File**: `src/lib/database.types.ts`

Updated `product_sales` table types:
```typescript
product_sales: {
  Row: {
    // ... existing fields
    order_date: string | null; // NEW
    // ... rest of fields
  }
  Insert: {
    // ... existing fields
    order_date?: string | null; // NEW
    // ... rest of fields
  }
  Update: {
    // ... existing fields
    order_date?: string | null; // NEW
    // ... rest of fields
  }
}
```

### 5. API Route Updates

#### Province Sales API

**File**: `src/app/api/sales-by-province/route.ts`

Added date filtering support:
```typescript
export async function GET(req: Request) {
  // Parse date filter parameters
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  // Pass to RPC function
  const { data, error } = await supabaseAdmin.rpc('get_sales_by_province_with_products', {
    p_start_date: startDate || null,
    p_end_date: endDate || null
  });

  // Fallback aggregation also filters by date
  if (error) {
    return await fallbackAggregation(startDate, endDate);
  }
  // ...
}
```

Fallback aggregation updated:
```typescript
async function fallbackAggregation(startDate: string | null, endDate: string | null) {
  let query = supabaseAdmin
    .from("product_sales")
    .select("..., order_date");

  // Apply date filtering
  if (startDate) query = query.gte('order_date', startDate);
  if (endDate) query = query.lte('order_date', endDate);

  // ... rest of aggregation logic
}
```

#### Product Sales Data Client

**File**: `src/app/dataClient.tsx`

Updated `fetchProductSales` function:

```typescript
type FetchProductSalesOptions = {
  limit?: number;
  platform?: "TikTok" | "Shopee" | "Lazada" | string;
  latestUploadsOnly?: boolean;
  startDate?: string; // NEW: ISO date string (YYYY-MM-DD)
  endDate?: string; // NEW: ISO date string (YYYY-MM-DD)
};

export async function fetchProductSales(options: FetchProductSalesOptions = {}) {
  const { limit, platform, latestUploadsOnly = false, startDate, endDate } = options;

  const buildQuery = (factory) => {
    let query = factory();
    if (platform) query = query.eq("platform", platform);
    if (uploadIds.length > 0) query = query.in("upload_id", uploadIds);
    if (startDate) query = query.gte("order_date", startDate); // NEW
    if (endDate) query = query.lte("order_date", endDate); // NEW
    return query;
  };
  // ...
}
```

## Usage

### Backend API Usage

#### Filter Product Sales by Date

```typescript
// In server component or API route
const sales = await fetchProductSales({
  startDate: "2025-11-01",
  endDate: "2025-11-30",
  platform: "TikTok" // optional
});
```

#### Filter Province Sales by Date

```
GET /api/sales-by-province?start_date=2025-11-01&end_date=2025-11-30
```

Response format unchanged, but data is filtered by order_date range.

### Frontend Integration (TODO)

The following frontend work still needs to be implemented:

1. **Date Picker UI Component** - Add date range selector to:
   - Product Sales page (`/product-sales`)
   - Thailand Map page (`/thailand-map`)

2. **UI State Management** - Store selected date range in component state

3. **API Integration** - Pass date range to backend:
   ```typescript
   // Example for product sales page
   const sales = await fetchProductSales({
     startDate: selectedStartDate,
     endDate: selectedEndDate
   });

   // Example for province sales
   const response = await fetch(
     `/api/sales-by-province?start_date=${selectedStartDate}&end_date=${selectedEndDate}`
   );
   ```

## Date Formats Reference

| Platform | Excel Column | Format Example | Parsed Output |
|----------|--------------|----------------|---------------|
| Shopee | วันที่ทำการสั่งซื้อ | `2025-11-29 18:00` | `2025-11-29` |
| TikTok | Created Time | `30/11/2025 12:08:42` | `2025-11-30` |
| Lazada | createTime | `15 Sep 2025 12:09:50` | `2025-09-15` |

## Performance Considerations

1. **Database Indexes**: Three indexes created for optimal query performance
2. **RPC Function**: Province sales API uses PostgreSQL RPC function for server-side aggregation (much faster than client-side)
3. **Pagination**: Both APIs use pagination to handle large datasets efficiently (1000 rows per batch)

## Testing Checklist

Before deploying to production:

- [ ] Run database migration: `supabase_add_order_date.sql`
- [ ] Verify column exists: `SELECT order_date FROM product_sales LIMIT 1;`
- [ ] Re-upload product sales files to populate `order_date` column
- [ ] Test date filtering on product sales API
- [ ] Test date filtering on province sales API
- [ ] Update RPC function `get_sales_by_province_with_products` to accept date parameters (if not already done)
- [ ] Add date picker UI to frontend pages
- [ ] Test with all three platforms (Shopee, TikTok, Lazada)

## Notes

- **Backward Compatibility**: Existing rows without `order_date` will have NULL values. Queries will still work but won't filter those rows.
- **Date Format**: Always use ISO format (YYYY-MM-DD) for consistency across platforms
- **Timezone**: Dates are stored without timezone (DATE type). All dates are treated as local Thailand time.
- **Optional Column**: The date column is optional during upload. If missing from Excel file, `order_date` will be NULL.
