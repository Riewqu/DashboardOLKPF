# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 PWA (Progressive Web App) dashboard for tracking multi-platform e-commerce sales from TikTok, Shopee, and Lazada. The application is primarily in Thai language and uses Supabase as the backend for data storage. The dashboard displays revenue, fees, adjustments, and settlement data with detailed breakdowns and trends.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Production build (type-checks and lints)
- `npm start` - Serve production build locally
- `npm run lint` - Run ESLint checks
- `npm test` - Run Jest test suite
- `npm run upload` - Alternative dev command (same as `npm run dev`)
- `npm run gen:types` - Generate TypeScript types from Supabase schema (requires Supabase CLI)

## Project Structure

The project uses the `src/` folder convention with TypeScript path aliases for cleaner imports:

```
src/
├── app/                      # Next.js App Router pages and API routes
│   ├── (public)/            # Public route group (main dashboard)
│   │   ├── layout.tsx       # Public section layout
│   │   ├── page.tsx         # Main dashboard page (server component)
│   │   ├── product-sales/
│   │   │   ├── page.tsx     # Product sales page (server component)
│   │   │   └── productSalesClient.tsx # Product sales UI
│   │   └── thailand-map/
│   │       └── page.tsx     # Geographic sales visualization (D3.js)
│   ├── (admin)/             # Admin route group (protected pages)
│   │   ├── layout.tsx       # Admin section layout with authentication
│   │   └── admin/
│   │       ├── page.tsx     # Admin dashboard (upload UI, recent uploads, goals)
│   │       ├── adminClient.tsx  # Admin client component
│   │       ├── layout.tsx   # Admin page layout with navigation
│   │       └── product-map/
│   │           ├── page.tsx # Product code mapping UI (server component)
│   │           └── productMapClient.tsx # Product mapping client UI
│   ├── dashboardClient.tsx  # Client-side dashboard UI
│   ├── dataClient.tsx       # Data fetching functions
│   ├── emptyState.tsx       # Empty state UI when no data
│   ├── layout.tsx           # Root layout with PWA manifest
│   ├── globals.css          # Global CSS with theme variables
│   └── api/
│       ├── upload/
│       │   ├── route.ts     # Main upload endpoint (platform transactions)
│       │   └── preview/
│       │       └── route.ts # Preview endpoint (parse without saving)
│       ├── product-sales/
│       │   ├── upload/route.ts  # Upload Shopee/TikTok product sales
│       │   └── preview/route.ts # Preview product sales
│       ├── product-code-map/
│       │   ├── route.ts     # CRUD for product code mappings
│       │   ├── import/route.ts # Bulk import mappings from Excel
│       │   └── template/route.ts # Download Excel template
│       ├── product-master/
│       │   ├── route.ts     # CRUD for product master data
│       │   ├── import/route.ts # Bulk import products from Excel
│       │   ├── preview/route.ts # Preview product master import
│       │   └── template/route.ts # Download Excel template
│       ├── province-aliases/
│       │   ├── route.ts     # CRUD for province name aliases
│       │   ├── [id]/route.ts # Single alias operations
│       │   ├── import/route.ts # Bulk import aliases
│       │   └── export/route.ts # Export aliases to Excel
│       ├── sales-by-province/
│       │   └── route.ts     # Geographic sales data aggregation
│       └── goals/
│           └── route.ts     # Goals CRUD (revenue/profit targets)
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   └── Icons.tsx
│   ├── admin/
│   │   ├── AdminNav.tsx     # Admin navigation component
│   │   ├── ProductCard.tsx  # Product card with image display
│   │   ├── ProductImageUpload.tsx # Product image upload UI
│   │   ├── AddProductModal.tsx    # Add new product modal
│   │   └── EditProductModal.tsx   # Edit product modal
│   ├── Navbar.tsx           # Main navigation component
│   ├── NavbarPublic.tsx     # Public section navbar
│   ├── NavbarAdmin.tsx      # Admin section navbar
│   ├── AnimatedSection.tsx  # Scroll animation wrapper component
│   ├── GlassBackdrop.tsx    # Glass morphism backdrop component
│   ├── ThailandMapD3.tsx    # D3.js Thailand map visualization
│   ├── ThailandProvinceTables.tsx # Province sales tables
│   ├── ProvinceAliasManager.tsx # Province alias management UI
│   ├── ThemeBridge.tsx      # Theme context bridge
│   ├── GoalsHeroPerformant.tsx
│   ├── MonthlyModalGlassmorphism.tsx
│   ├── MonthlyModalMinimalist.tsx
│   ├── MonthlyModalCyberpunk.tsx
│   └── MonthlyModalApple.tsx
├── lib/                     # Business logic and utilities
│   ├── supabaseClient.ts   # Supabase admin client
│   ├── transactionParser.ts # Excel parsing logic for all platforms
│   ├── productSales.ts     # Shopee/TikTok product sales parser
│   ├── metrics.ts          # Metrics aggregation functions
│   ├── cache.ts            # In-memory API response cache (use Redis/Vercel KV in production)
│   ├── mockData.ts         # Mock data for development/fallback
│   ├── database.types.ts   # Generated Supabase types
│   ├── theme.ts            # Theme management (light/dark mode)
│   ├── thailandGeoData.ts  # GeoJSON loader for Thailand map
│   ├── provinceNameMap.ts  # English↔Thai province name mapping (77 provinces)
│   ├── provinceMapper.ts   # Province name normalization logic
│   ├── ingest.ts           # Legacy aggregation parser
│   ├── shopeeLoader.ts     # Legacy Shopee loader (reads from data/)
│   ├── lazadaLoader.ts     # Legacy Lazada loader (reads from data/)
│   ├── tiktokLoader.ts     # Legacy TikTok loader (reads from data/)
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── platform.ts
│   │   └── transaction.ts
│   ├── constants/
│   │   └── platforms.ts    # Platform constants
│   └── utils/              # Utility functions
│       ├── currency.ts     # Currency formatting
│       ├── date.ts         # Date formatting and normalization
│       └── number.ts       # Number parsing and calculations
├── hooks/
│   └── useScrollAnimation.ts # Scroll animation hook for AnimatedSection
└── tests/                  # Jest test files
    ├── metrics.test.ts     # Metrics aggregation tests
    └── transactionParser.test.ts # Parser tests
```

**Path Aliases**: All imports use the `@/` alias (configured in `tsconfig.json`):
```typescript
import { supabaseAdmin } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
```

## Architecture

### Data Flow

1. **Platform Transactions: File Upload → Processing → Storage**
   - Excel files (.xlsx) are uploaded via `src/app/api/upload/route.ts`
   - Files are processed by `src/lib/transactionParser.ts` which parses row-level transactions
   - Raw files stored in Supabase Storage (`uploads` bucket)
   - Parsed data stored in three Supabase tables:
     - `upload_batches` - Upload metadata and summary statistics
     - `transactions` - Individual transaction rows (unique constraint on platform+external_id+sku+type)
     - `platform_metrics` - Aggregated metrics per platform (recalculated from all transactions on each upload)

2. **Product Sales: Multi-Platform Sales Analysis**
   - Shopee and TikTok product sales Excel files uploaded via `src/app/api/product-sales/upload/route.ts`
   - Files processed by `src/lib/productSales.ts` which parses product/variant sales data
   - Supports both Shopee (Thai columns) and TikTok (English columns) format auto-detection
   - Uses flexible variant code matching (exact, normalized, individual code matches)
   - Maps platform variant codes to internal product names using `product_code_map` table
   - Extracts and normalizes province data for geographic analysis
   - Aggregates sales by internal product code and stores in `product_sales_summary` table
   - Displayed on `/product-sales` page with sorting and filtering

3. **Geographic Sales Analysis**
   - Province data extracted from product sales files (Shopee/TikTok)
   - Province names normalized using `provinceMapper.ts` and `province_aliases` table
   - Aggregated sales data viewable on `/thailand-map` page with D3.js visualization
   - Interactive Thailand map with hover tooltips and clickable provinces
   - Province alias system handles variant spellings (e.g., "กทม." → "กรุงเทพมหานคร")

4. **Product Master Data Management**
   - Product master data (internal codes, names, categories) managed via `/admin/product-map`
   - CRUD operations via `src/app/api/product-master/route.ts`
   - Bulk import from Excel via `src/app/api/product-master/import/route.ts`
   - Template download via `src/app/api/product-master/template/route.ts`
   - Stored in `product_master` table

5. **Product Code Mapping**
   - Maps external platform variant codes (Shopee, TikTok, Lazada) to internal product codes
   - Managed via `/admin/product-map` page
   - CRUD operations via `src/app/api/product-code-map/route.ts`
   - Bulk import from Excel via `src/app/api/product-code-map/import/route.ts`
   - Template download via `src/app/api/product-code-map/template/route.ts`
   - Stored in `product_code_map` table with unique constraint on (platform, external_code)
   - Supports flexible matching for multi-code products (e.g., "KL0-4010, 4008" matches both "KL0-4010" and "KL0-4008")

6. **Goals System**
   - Monthly revenue/profit goals per platform or "all" platforms
   - CRUD operations via `src/app/api/goals/route.ts`
   - Displayed on `/admin` page with progress tracking
   - Stored in `goals` table

7. **Data Retrieval → Display**
   - Main dashboard: Server component (`src/app/(public)/page.tsx`) fetches from Supabase via `src/app/dataClient.tsx`
   - Admin dashboard: `/admin` shows upload UI, recent uploads, and goals management
   - Product sales: `/product-sales` shows aggregated product sales by internal product code
   - Thailand map: `/thailand-map` shows geographic sales distribution with D3.js visualization
   - Shows empty state if no data exists; requires Supabase (no mock fallback in production)
   - Client components (`dashboardClient.tsx`, `adminClient.tsx`, `productSalesClient.tsx`) render the UI
   - Route groups `(public)` and `(admin)` organize pages without affecting URL structure

### Platform-Specific Processing

The main parser is in `src/lib/transactionParser.ts` with platform-specific logic:

- **Shopee**: Processes Thai-language columns like "วันที่ทำการสั่งซื้อ" (order date), "หมายเลขคำสั่งซื้อ" (order ID), "ชื่อผลิตภัณฑ์" (product name). Handles shipping, fees, and VAS (value-added services).
- **Lazada**: Uses transaction name column ("ชื่อรายการธุรกรรม") to categorize revenue/expenses. Order ID from "หมายเลขคำสั่งซื้อ", SKU from "SKU ร้านค้า". Each row represents a separate transaction type, so row index is appended to ensure uniqueness.
- **TikTok**: English columns. Order ID from "Order/adjustment ID", SKU from "Seller SKU". Extensive fee breakdown including affiliate commissions. Supports both "Order" and "Adjustment" transaction types. Row index appended to type for uniqueness.

Each row is converted to a `TransactionRow` with fields: `platform`, `external_id`, `sku`, `type`, `order_date`, `payment_date`, `revenue`, `fees`, `adjustments`, `settlement`, and `raw_data`.

**Critical for TikTok/Lazada**: Since one order can have multiple transaction rows (e.g., order + adjustment, or multiple fee types), the `type` field includes row index (e.g., `"Order-ROW2"`) to satisfy the unique constraint `(platform, external_id, sku, type)`.

Legacy loaders exist in `src/lib/shopeeLoader.ts`, `src/lib/lazadaLoader.ts`, `src/lib/tiktokLoader.ts` that read from `data/*.xlsx` files (used for development/fallback). The legacy `src/lib/ingest.ts` provides the old aggregation-only approach.

### Product Sales Processing

The product sales parser is in `src/lib/productSales.ts`:

- **Shopee Product Sales**: Parses Thai-language Shopee sales reports
  - Required columns: "เลขอ้างอิง SKU (SKU Reference No.)", "จำนวน" (quantity), "ราคาขายสุทธิ" (net price)
  - Uses flexible column matching with aliases (e.g., "จำนวนที่ขายได้ (ยืนยันแล้ว)" also works)
  - Optional province column: "จังหวัด" or similar aliases
  - Filters out cancelled/shipping orders based on "สถานะการสั่งซื้อ"
  - Handles returns via "สถานะการคืนเงินหรือคืนสินค้า" and "จำนวนที่ส่งคืน"

- **TikTok Product Sales**: Parses English TikTok sales reports
  - Required columns: "Order Status", "Order Substatus", "SKU ID", "Quantity", revenue columns
  - Uses flexible column matching for revenue (tries combined column first, falls back to separate columns)
  - Optional province column: "Province" or similar aliases
  - Only processes completed orders (status = "เสร็จสมบูรณ์", substatus = "เสร็จสมบูรณ์")
  - Handles returns via "Cancelation/Return Type" = "Return/Refund"

- **Flexible Variant Code Matching**: The parser uses smart matching strategies:
  1. **Exact match**: Direct lookup (e.g., "KL0-4010")
  2. **Normalized match**: Handles variations in ordering and formatting (e.g., "KL0-4010, 4008" = "KL0-4008,KL0-4010")
  3. **Individual code match**: Matches single codes from multi-code products (e.g., "KL0-4010" matches a product mapped as "KL0-4010, 4008")

- **Province Extraction and Normalization**:
  - Extracts province names from optional province column
  - Normalizes Thai province names using `provinceMapper.ts` (handles abbreviations, typos, English names)
  - Tracks unmapped provinces for manual review
  - Supports custom province aliases via `province_aliases` table

- **Options**:
  - `codeNameMap`: Provide mapping during parsing
  - `strictMapping`: Reject unmapped variant codes
  - `provinceAliases`: Custom province name mappings
  - Returns `ProductSaleRow[]` with parsed data and `ProductSaleSummary` with aggregated stats

### Geographic Visualization (Thailand Map)

The Thailand map visualization (`/thailand-map`) uses:

- **D3.js** (not amCharts) for 100% open-source, license-free mapping
- **Real GeoJSON data** (`public/thailand.json`) with accurate boundaries for all 77 provinces
- **Modern enterprise design** with glass morphism, gradients, and smooth animations
- **Interactive features**: Hover tooltips, clickable provinces, auto-scroll to details
- **Color scale**: Blue gradient based on revenue (light blue = low, dark blue = high, gray = no data)
- **Responsive design**: Adapts to mobile, tablet, and desktop screens
- **Province name handling**: GeoJSON uses English names, converted to Thai using `provinceNameMap.ts`
- **Data flow**: Fetches sales data from `/api/sales-by-province` which aggregates from `product_sales` table

Key files:
- `src/components/ThailandMapD3.tsx` - Main D3.js map component
- `src/lib/thailandGeoData.ts` - GeoJSON loader
- `src/lib/provinceNameMap.ts` - English↔Thai mapping (77 provinces)
- `src/lib/provinceMapper.ts` - Province name normalization
- `public/thailand.json` - GeoJSON data (1.2 MB, cached by browser)

See `D3_THAILAND_MAP.md` for detailed documentation on the map implementation.

### Key Data Structures

**TransactionRow** (from `src/lib/transactionParser.ts`):
- `platform`, `external_id`, `sku`, `type` - Composite unique key
- `order_date` - ISO date string (YYYY-MM-DD)
- `payment_date` - ISO date string (YYYY-MM-DD), falls back to order_date
- `revenue`, `fees`, `adjustments`, `settlement` - Financial metrics per transaction
- `raw_data` - Original Excel row stored as JSONB

**PlatformMetrics** (from `src/lib/transactionParser.ts`):
- `revenue`, `fees`, `adjustments`, `settlement` - Aggregated financial metrics
- `trend` - Last 7 days of settlement values for sparkline charts
- `trendDates` - Corresponding ISO date strings
- `perDay` - Full daily breakdown array
- `breakdown` - Key-value pairs for dashboard summary cards
- `feeGroups` - Hierarchical fee breakdown (with optional children) for detailed views
- `revenueGroups` - Hierarchical revenue breakdown
- `rows` - Total transaction count

**ProductSaleRow** (from `src/lib/productSales.ts`):
- `productName` - Internal product name (from product_master via code mapping)
- `variantName` - Original variant name from platform
- `variantCode` - Platform variant code (maps to internal product code)
- `qtyConfirmed` - Confirmed quantity sold
- `qtyReturned` - Quantity returned/refunded
- `revenueConfirmed` - Confirmed revenue in THB
- `rowNo` - Row number in Excel file
- `orderId` - Optional order ID (for TikTok)
- `provinceRaw` - Raw province name from file
- `provinceNormalized` - Normalized Thai province name
- `raw` - Original Excel row

**ProductSaleSummary** (from `src/lib/productSales.ts`):
- `totalRows` - Total rows processed
- `totalProducts` - Unique internal product codes
- `totalVariants` - Unique platform variant codes
- `totalQty` - Total quantity sold
- `totalRevenue` - Total revenue
- `totalReturned` - Total quantity returned
- `warnings` - Array of warning messages (e.g., unmapped codes)
- `unmappedProvinces` - Array of province names that couldn't be normalized

## Configuration

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side operations

The app requires Supabase configuration to function; it will show an error screen if these are not configured.

### Next.js Configuration

- PWA enabled via `next-pwa` (disabled in development, outputs to `public/`)
- App Router enabled (stable in Next.js 14)
- React Strict Mode enabled

### Styling and UI

- CSS Variables: All styling uses CSS custom properties defined in `src/app/globals.css`
- Theme Modes: Supports light/dark themes via `src/lib/theme.ts` with `setTheme()` and `toggleTheme()` functions
- Glass Morphism: Uses backdrop blur effects for modern UI (`GlassBackdrop.tsx`)
- Scroll Animations: GPU-accelerated scroll animations using Intersection Observer (`AnimatedSection.tsx` + `useScrollAnimation.ts` hook)
- Responsive Design: Mobile-first approach with responsive breakpoints
- Component Library: Custom UI components in `src/components/ui/` (Card, Button, Badge, Modal, Icons)
- Icons: Uses Lucide React for consistent icon set

### Supabase Schema

**Table: `upload_batches`**
- Primary key: `id` (UUID)
- Columns: `platform`, `file_path`, `file_name`, `file_size`, `total_rows`, `new_rows`, `updated_rows`, `error_rows`, `status` (processing/completed/failed), `revenue`, `fees`, `adjustments`, `settlement`, `error_message`, `created_at`, `completed_at`
- Stores upload metadata and processing results for platform transaction uploads

**Table: `transactions`**
- Unique constraint: `(platform, external_id, sku, type)`
- Columns: `id`, `upload_id` (FK to upload_batches), `uploaded_at`, `platform`, `external_id`, `sku`, `type`, `order_date`, `payment_date`, `revenue`, `fees`, `adjustments`, `settlement`, `raw_data` (JSONB)
- Stores individual transaction rows; uses upsert to handle duplicates (last upload wins)

**Table: `platform_metrics`**
- Primary key: `platform` (unique)
- Columns: `platform`, `revenue`, `fees`, `adjustments`, `settlement`, `trend`, `trend_dates`, `per_day`, `per_day_paid`, `breakdown`, `fee_groups`, `revenue_groups`, `total_transactions`, `total_transactions_paid`, `updated_at`
- Stores aggregated metrics per platform (recalculated from all transactions on each upload)
- `per_day` aggregates by `order_date`, `per_day_paid` aggregates by `payment_date`

**Table: `product_master`**
- Primary key: `id` (UUID)
- Columns: `product_code` (unique), `product_name` (alias: `name`), `category`, `is_active`, `image_url`, `created_at`, `updated_at`
- Stores internal product master data with product codes, names, categories, and product images
- Product images stored in Supabase Storage `product-images` bucket (max 5MB, formats: JPG, PNG, WebP)

**Table: `product_code_map`**
- Primary key: `id` (UUID)
- Unique constraint: `(platform, external_code)`
- Columns: `platform`, `external_code`, `product_code` (FK to product_master.product_code), `notes`, `created_at`, `updated_at`
- Maps platform-specific variant codes to internal product codes
- Supports multi-code products via comma-separated or newline-separated codes

**Table: `product_sales`**
- Primary key: `id` (UUID)
- Columns: `upload_id` (FK to product_sales_uploads), `platform`, `product_name`, `variant_name`, `variant_code`, `order_id`, `qty_confirmed`, `qty_returned`, `revenue_confirmed`, `province_raw`, `province_normalized`, `row_no`, `raw_data` (JSONB), `created_at`
- Stores individual product sale rows with optional province data

**Table: `product_sales_summary`**
- Primary key: `id` (UUID)
- Unique constraint: `(product_code, upload_date)`
- Columns: `product_code`, `product_name`, `total_qty`, `total_revenue`, `upload_date`, `created_at`, `updated_at`
- Stores aggregated product sales by internal product code

**Table: `product_sales_uploads`**
- Primary key: `id` (UUID)
- Columns: `platform`, `file_name`, `file_path`, `file_size`, `total_rows`, `status`, `error_message`, `created_at`, `completed_at`
- Tracks product sales upload metadata

**Table: `province_aliases`**
- Primary key: `id` (UUID)
- Columns: `alias` (unique), `normalized_province`, `notes`, `created_at`, `updated_at`
- Maps province name variations to normalized Thai province names (e.g., "กทม." → "กรุงเทพมหานคร")
- Used for province name normalization in product sales

**Table: `goals`**
- Primary key: `id` (UUID)
- Columns: `year`, `month`, `platform` ("all", "TikTok", "Shopee", "Lazada"), `type` ("revenue", "profit"), `target_amount`, `created_at`, `updated_at`
- Stores monthly revenue/profit goals per platform

**Table: `column_mappings`**
- Columns: `id`, `platform`, `column_name`, `category`, `subcategory`, `description`, `is_active`, `created_at`
- Stores column mapping configuration for dynamic parser updates (legacy/future use)

**Storage Buckets:**
- `uploads` bucket:
  - File path format: `{platform}/{timestamp}-{filename}`
  - Stores raw Excel transaction files for audit trail
- `product-images` bucket:
  - File path format: `{product_id}-{timestamp}.{ext}`
  - Stores product images (max 5MB per file)
  - Allowed formats: JPG, PNG, WebP
  - Public access with cache control (3600s)

**Supabase RPC Functions:**
The application uses Postgres RPC (Remote Procedure Calls) for optimized dashboard queries:
- `dashboard_top_products(p_platform, p_start, p_end)` - Aggregates top products by revenue/quantity
- `dashboard_top_provinces(p_platform, p_start, p_end)` - Aggregates top provinces by revenue/quantity
- `dashboard_top_platforms(p_start, p_end)` - Aggregates top product per platform

These RPC functions provide significant performance improvements over client-side aggregation, especially with large datasets.

For performance optimization, see `SUPABASE_INDEXES.md` which provides recommended indexes for common query patterns.

## Pages and Routes

**Main Pages:**
- `/` - Main dashboard showing platform metrics, revenue, fees, trends
- `/product-sales` - Product sales analysis by internal product code (multi-platform)
- `/thailand-map` - Geographic sales visualization with D3.js Thailand map
- `/admin` - Admin dashboard with card navigation to all admin features
- `/admin/uploads` - Upload Center (Platform Data + Product Sales + Upload History)
- `/admin/goals` - Goals Management (set and track monthly revenue/profit goals)
- `/admin/provinces` - Province Alias Manager (manage 77 Thai province name aliases)
- `/admin/product-map` - Product master data and code mapping management

**API Endpoints:**
- Platform Transactions:
  - `POST /api/upload` - Upload platform transaction file
  - `POST /api/upload/preview` - Preview parsed data without saving
- Product Sales:
  - `POST /api/product-sales/upload` - Upload Shopee/TikTok product sales file
  - `POST /api/product-sales/preview` - Preview product sales data
- Product Master:
  - `GET/POST/PUT/DELETE /api/product-master` - CRUD operations
  - `POST /api/product-master/import` - Bulk import from Excel
  - `POST /api/product-master/upload-image` - Upload product image to Supabase Storage
  - `DELETE /api/product-master/upload-image` - Delete product image
  - `POST /api/product-master/preview` - Preview product master import
  - `GET /api/product-master/template` - Download Excel template
- Product Code Map:
  - `GET/POST/PUT/DELETE /api/product-code-map` - CRUD operations
  - `POST /api/product-code-map/import` - Bulk import from Excel
  - `GET /api/product-code-map/template` - Download Excel template
- Province Aliases:
  - `GET/POST /api/province-aliases` - List/create aliases
  - `GET/PUT/DELETE /api/province-aliases/[id]` - Single alias operations
  - `POST /api/province-aliases/import` - Bulk import from Excel
  - `GET /api/province-aliases/export` - Export aliases to Excel
- Geographic Data:
  - `GET /api/sales-by-province` - Aggregate sales data by province
- Dashboard Analytics:
  - `GET /api/dashboard/top` - Get top products, provinces, and platforms (uses Supabase RPC for performance)
- Goals:
  - `GET/POST/PUT/DELETE /api/goals` - CRUD operations with query params (year, month, platform, type)

## File Upload Constraints

**Platform Transactions:**
- Max file size: 15MB
- Allowed platforms: "TikTok", "Shopee", "Lazada"
- Supported format: Excel (.xlsx)
- Upload endpoint: `POST /api/upload` with form data (`file`, `platform`)

**Product Sales:**
- Max file size: 15MB
- Platforms: Shopee (Thai columns) or TikTok (English columns) - auto-detected
- Required columns vary by platform (see `src/lib/productSales.ts` for column mappings)
- Supported format: Excel (.xlsx)
- Upload endpoint: `POST /api/product-sales/upload` with form data (`file`)

## Testing

- Test framework: Jest with ts-jest preset
- Test location: `tests/` directory
- Run all tests: `npm test`
- Run specific test file: `npm test -- tests/metrics.test.ts`
- Run tests matching pattern: `npm test -- <pattern>` (e.g., `npm test -- parser`)
- Test file pattern: `*.test.ts` (configured in `jest.config.js`)
- Path aliases: Tests can use `@/` imports (configured via `moduleNameMapper` in `jest.config.js`)
- Test environment: Node.js (not jsdom) - suitable for testing parsers and utilities

Sample data files in `data/`:
- `Shopee*.xlsx` - Thai column names (multiple files for different periods)
- `Lazada.xlsx` - Thai transaction names
- `tiktok.xlsx` - English column names
- Various other Excel files for testing different scenarios

When modifying parsing logic in `src/lib/transactionParser.ts` or `src/lib/productSales.ts`, verify against these files to ensure backward compatibility with existing data formats.

### Duplicate Handling

The upload process handles duplicates at two levels:

**Platform Transactions:**
1. **Intra-file deduplication**: If the same transaction appears multiple times in a single upload, the last occurrence wins
2. **Database-level deduplication**: Uses upsert with unique constraint `(platform, external_id, sku, type)`. If a transaction already exists in the database, it's updated with new values from the latest upload

After uploading, `platform_metrics` are recalculated from ALL transactions in the database (not just the latest upload), ensuring accurate aggregated totals.

**Product Sales:**
- No automatic deduplication (each upload creates new rows)
- Uploads are tracked separately via `product_sales_uploads` table
- Query results can be filtered by latest upload only using `latestUploadsOnly` parameter

## Common Patterns

- **Route Groups**: Uses `(public)` and `(admin)` route groups to organize pages without affecting URLs; allows separate layouts per section
- **Server Components by Default**: Page components fetch data server-side with `dynamic = "force-dynamic"` to prevent caching
- **Client Components for Interactivity**: Components with `"use client"` directive handle user interactions (e.g., `dashboardClient.tsx`, `adminClient.tsx`)
- **No Mock Fallback**: Production requires Supabase; shows empty state when no data exists (legacy `src/lib/mockData.ts` exists but is not used)
- **Type Safety**: Use TypeScript types (e.g., `TransactionRow`, `PlatformMetrics`, `Database` types from `src/lib/database.types.ts`) consistently
- **Error Handling**: Log errors to console with emoji prefixes (✅ success, ❌ error, ⚠️ warning, 📊 info), return structured error responses
- **Path Aliases**: Always use `@/` imports instead of relative paths for better maintainability
- **Theme System**: Uses CSS variables and class-based theming (`light-mode`/`dark-mode`) managed via `src/lib/theme.ts`
- **Batch Processing**: When querying large datasets from Supabase, use pagination (e.g., `.range(offset, offset + pageSize - 1)`) to avoid REST API limits (1000 rows per request)

## Coding Conventions

- **TypeScript-first**: All code uses TypeScript with strict mode enabled
- **Naming conventions**:
  - Components: `PascalCase` (e.g., `ThailandMapD3.tsx`)
  - Hooks/utilities: `camelCase` (e.g., `normalizeDate()`)
  - Files: Generally match component/utility name; route params use Next.js convention `[id].ts`
- **Exports**: Prefer named exports for components, hooks, and utilities
- **Component patterns**: Favor server components by default; use `"use client"` directive only when needed for interactivity
- **Data access**: Keep all data fetching logic in `src/lib` or server components; pass typed props to client components
- **Async patterns**: Prefer `async/await` over promise chains for readability

## Important Notes

### General
- The app is designed for Thai language users (metadata, error messages, column names)
- TypeScript strict mode is enabled - all code must pass type checks before build succeeds
- All code lives in the `src/` folder with `@/` path aliases

### Data Handling
- Numbers may be negative (fees, adjustments) - handle signed arithmetic correctly
- Date normalization is critical - use `normalizeDate()` utility in `src/lib/transactionParser.ts` to handle Excel dates and convert to ISO strings
- All platform transaction uploads use **upsert** semantics - latest upload wins for duplicate keys
- Transactions: composite unique key `(platform, external_id, sku, type)`
- Product code map: composite unique key `(platform, external_code)`
- Product sales summary: composite unique key `(product_code, upload_date)`
- Province aliases: unique key `alias`

### Platform Metrics
- Platform metrics are **recalculated** from ALL transactions on each upload, not just new data
- Each transaction's `raw_data` field stores the complete original Excel row as JSONB for audit purposes
- Metrics aggregated by both `order_date` and `payment_date` (stored in separate fields)
- When fetching transactions for recalculation, use pagination to handle large datasets (Supabase REST limit: 1000 rows per request)

### Product Sales Workflow
1. Set up product master data in `/admin/product-map` (internal product codes)
2. Create product code mappings to map platform variant codes to internal codes
3. Upload Shopee/TikTok sales files on `/admin` page
4. View aggregated sales by product on `/product-sales` page
5. View geographic sales distribution on `/thailand-map` page
- Unmapped variant codes will be stored but not aggregated by product
- Use `strictMapping: true` option to reject unmapped codes during upload
- Unmapped provinces will be tracked in `unmappedProvinces` for manual review

### Province Name Normalization
- Province names are normalized using `provinceMapper.ts` which handles:
  - Abbreviations (e.g., "กทม." → "กรุงเทพมหานคร")
  - Typos and variations (e.g., "เชียงใหม่", "เชียงใหม", "Chiang Mai")
  - English to Thai conversion using `provinceNameMap.ts`
  - Custom aliases from `province_aliases` table
- All 77 Thai provinces are supported
- Unmapped province names are tracked for manual alias creation

### Thailand Map Visualization
- Uses D3.js (not amCharts) for license-free open-source mapping
- GeoJSON data cached by browser (1.2 MB, loaded once)
- Map accurately displays all 77 provinces with correct geographic boundaries
- Color scale dynamically adjusts based on data range
- Province names in GeoJSON are English, converted to Thai for data matching
- See `D3_THAILAND_MAP.md` for implementation details

### Goals System
- Goals are tracked monthly and can be set per platform or for "all" platforms
- Goal types: "revenue" (settlement amount) or "profit" (settlement minus fees)
- Progress is calculated automatically from platform_metrics data

### Performance Optimization
- For large datasets, Supabase queries should use pagination (`.range()`) to avoid 1000-row REST limit
- Dashboard analytics use Postgres RPC functions (`dashboard_top_products`, `dashboard_top_provinces`, `dashboard_top_platforms`) for server-side aggregation instead of fetching all rows
- **API Response Caching**: `src/lib/cache.ts` provides in-memory caching for API responses (default 60s TTL)
  - Used by `/api/dashboard/top` to cache dashboard analytics
  - Production: Replace with Redis or Vercel KV for multi-instance deployments
  - Cache utilities: `cached()` wrapper, `getCacheKey()` generator, `apiCache.clear()` invalidation
- Recommended indexes are documented in `SUPABASE_INDEXES.md`
- Province sales aggregation uses efficient grouping queries in `src/app/api/sales-by-province/route.ts`
- Thailand map uses memoization and efficient D3.js rendering for smooth performance
- Scroll animations use GPU-accelerated CSS transforms and Intersection Observer for 60fps performance
- Product images are cached with a 1-hour cache control header for faster loading
