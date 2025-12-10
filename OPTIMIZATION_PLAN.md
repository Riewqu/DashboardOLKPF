# 🚀 Performance & Security Optimization Plan

## ⚠️ Critical Security Issues (Fix ASAP)

### 1. **No Authentication on Admin Panel**
- ❌ ปัจจุบัน: Admin panel เข้าถึงได้โดยไม่ต้อง login
- ✅ แก้ไข: เพิ่ม Supabase Auth + Protected Routes

### 2. **No API Route Protection**
- ❌ ปัจจุบัน: API endpoints เปิดสาธารณะ (ใครก็เรียกได้)
- ✅ แก้ไข: เพิ่ม API authentication middleware

### 3. **No Rate Limiting**
- ❌ ปัจจุบัน: ไม่มีการจำกัดจำนวนคำขอ (เสี่ยง DDoS)
- ✅ แก้ไข: เพิ่ม rate limiting middleware

### 4. **No Input Validation**
- ❌ ปัจจุบัน: ไม่มี validation ที่ครอบคลุม
- ✅ แก้ไข: เพิ่ม Zod validation ทุก endpoint

### 5. **File Upload Security**
- ⚠️ ปัจจุบัน: ตรวจสอบ file type พื้นฐาน
- ✅ แก้ไข: เพิ่ม file signature verification, virus scanning

---

## 🚀 Performance Optimizations

### A. Database Performance (คะแนนผลกระทบ: 🔥🔥🔥🔥🔥)

#### 1. **Missing Indexes**
ตอนนี้ยังไม่มี indexes! จะทำให้ query ช้ามากเมื่อข้อมูลเยอะ

**Indexes ที่ควรสร้าง:**
```sql
-- transactions table (ตาราง query บ่อยที่สุด)
CREATE INDEX idx_transactions_platform ON transactions(platform);
CREATE INDEX idx_transactions_order_date ON transactions(order_date);
CREATE INDEX idx_transactions_payment_date ON transactions(payment_date);
CREATE INDEX idx_transactions_platform_dates ON transactions(platform, order_date, payment_date);
CREATE INDEX idx_transactions_upload_id ON transactions(upload_id);

-- product_sales table
CREATE INDEX idx_product_sales_product_code ON product_sales(product_code);
CREATE INDEX idx_product_sales_platform ON product_sales(platform);
CREATE INDEX idx_product_sales_province ON product_sales(province_normalized);
CREATE INDEX idx_product_sales_upload ON product_sales(upload_id);

-- Composite indexes for common queries
CREATE INDEX idx_transactions_composite ON transactions(platform, order_date)
  INCLUDE (revenue, fees, settlement);
```

**ผลลัพธ์ที่คาดหวัง:**
- Query เร็วขึ้น 10-100x เมื่อข้อมูลมาก
- Dashboard load เร็วขึ้นมาก

#### 2. **Query Optimization**
```typescript
// ❌ แบบเก่า: Fetch ทุก row แล้วคำนวณใน JS
const { data } = await supabase.from('transactions').select('*');
const total = data.reduce((sum, row) => sum + row.revenue, 0);

// ✅ แบบใหม่: ให้ database คำนวณ
const { data } = await supabase.from('transactions')
  .select('revenue.sum(), fees.sum(), settlement.sum()');
```

#### 3. **Pagination Everywhere**
- เพิ่ม pagination ทุกหน้าที่แสดงข้อมูลเยอะ
- ใช้ virtual scrolling สำหรับ long lists

### B. Frontend Performance (คะแนนผลกระทบ: 🔥🔥🔥🔥)

#### 1. **Image Optimization**
```typescript
// ❌ ปัจจุบัน: <img> ธรรมดา (16 warnings ใน build)
<img src="/icon-512.png" alt="Logo" />

// ✅ ใช้ next/image แทน
import Image from 'next/image';
<Image src="/icon-512.png" alt="Logo" width={512} height={512} priority />
```

**ประโยชน์:**
- Auto lazy loading
- Auto WebP conversion
- Responsive images
- ลด bandwidth 50-70%

#### 2. **Code Splitting & Lazy Loading**
```typescript
// ❌ Import ทั้งหมดทันที
import AdminDashboard from './adminDashboard';

// ✅ Lazy load components ที่หนัก
const AdminDashboard = dynamic(() => import('./adminDashboard'), {
  loading: () => <LoadingSpinner />
});
```

#### 3. **React Memoization**
```typescript
// Memoize expensive calculations
const aggregatedData = useMemo(() => {
  return transactions.reduce(...);
}, [transactions]);

// Memoize components
const ProductCard = memo(({ product }) => {
  return <div>...</div>;
});
```

#### 4. **Bundle Size Reduction**
- Bundle ปัจจุบัน: 16MB (ใหญ่เกินไป!)
- เป้าหมาย: < 5MB

**วิธีลดขนาด:**
1. Remove unused dependencies
2. Use tree-shaking
3. Split vendor bundles
4. Compress assets

### C. Caching Strategy (คะแนนผลกระทบ: 🔥🔥🔥🔥)

#### 1. **HTTP Caching Headers**
```typescript
// API routes
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  });
}
```

#### 2. **Service Worker Caching**
```javascript
// Enhanced PWA caching strategy
{
  urlPattern: /^https:\/\/api\//,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 5 * 60 // 5 minutes
    }
  }
}
```

#### 3. **React Query / SWR**
```typescript
// ใช้ SWR สำหรับ client-side caching
import useSWR from 'swr';

function Dashboard() {
  const { data, error } = useSWR('/api/dashboard/top', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000 // 1 minute
  });
}
```

### D. Network Performance (คะแนนผลกระทบ: 🔥🔥🔥)

#### 1. **Compression**
```javascript
// next.config.js
module.exports = {
  compress: true,
  // Gzip/Brotli compression enabled by default in production
}
```

#### 2. **Preloading & Prefetching**
```typescript
// Prefetch critical routes
<Link href="/admin" prefetch={true}>
  Admin
</Link>
```

#### 3. **CDN for Static Assets**
- ย้าย images, fonts ไป CDN (Cloudflare, Vercel Edge)
- ลด latency 200-500ms

---

## 🔒 Security Implementation Plan

### Phase 1: Authentication (สัปดาห์ที่ 1)

```typescript
// 1. เพิ่ม Supabase Auth
// src/lib/auth.ts
export async function getServerSession() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// 2. Protected Admin Layout
export default async function AdminLayout({ children }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return <div>{children}</div>;
}

// 3. Protected API Routes
export async function POST(req: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Process request
}
```

### Phase 2: Rate Limiting (สัปดาห์ที่ 1)

```typescript
// src/middleware.ts
import { RateLimiter } from '@/lib/rateLimiter';

const limiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

export async function middleware(request: NextRequest) {
  try {
    const ip = request.ip ?? '127.0.0.1';
    await limiter.check(ip, 10); // 10 requests per minute
  } catch {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
}

export const config = {
  matcher: '/api/:path*'
};
```

### Phase 3: Input Validation (สัปดาห์ที่ 2)

```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const uploadSchema = z.object({
  platform: z.enum(['TikTok', 'Shopee', 'Lazada']),
  file: z.custom<File>((val) => val instanceof File)
    .refine((file) => file.size <= 15 * 1024 * 1024, 'File too large')
    .refine((file) => file.name.endsWith('.xlsx'), 'Must be Excel file')
});

// ใช้ใน API
export async function POST(req: Request) {
  const body = await req.json();
  const validated = uploadSchema.parse(body); // Throws if invalid

  // Process validated data
}
```

### Phase 4: Security Headers (สัปดาห์ที่ 2)

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};
```

### Phase 5: File Upload Security (สัปดาห์ที่ 3)

```typescript
// src/lib/fileValidation.ts
import { fileTypeFromBuffer } from 'file-type';

export async function validateExcelFile(file: File): Promise<boolean> {
  // 1. Check file extension
  if (!file.name.endsWith('.xlsx')) {
    throw new Error('Invalid file extension');
  }

  // 2. Check MIME type
  if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    throw new Error('Invalid MIME type');
  }

  // 3. Check file signature (magic bytes)
  const buffer = await file.arrayBuffer();
  const type = await fileTypeFromBuffer(Buffer.from(buffer));

  if (type?.mime !== 'application/zip') { // Excel files are ZIP archives
    throw new Error('Invalid file signature');
  }

  // 4. Check file size
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('File too large');
  }

  return true;
}
```

---

## 📊 Performance Monitoring

### 1. **Add Performance Tracking**
```typescript
// src/lib/monitoring.ts
export function trackPageLoad(pageName: string) {
  if (typeof window !== 'undefined') {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    console.log(`📊 ${pageName} Performance:`, {
      DNS: navigation.domainLookupEnd - navigation.domainLookupStart,
      TCP: navigation.connectEnd - navigation.connectStart,
      Request: navigation.responseStart - navigation.requestStart,
      Response: navigation.responseEnd - navigation.responseStart,
      DOM: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      Total: navigation.loadEventEnd - navigation.fetchStart
    });
  }
}
```

### 2. **Add Error Tracking**
```typescript
// src/lib/errorTracking.ts
export function reportError(error: Error, context?: Record<string, any>) {
  console.error('❌ Error:', error.message, context);

  // Send to error tracking service (Sentry, LogRocket, etc.)
  // await fetch('/api/log-error', { method: 'POST', body: JSON.stringify({ error, context }) });
}
```

---

## 🎯 Priority Matrix

| Task | Impact | Effort | Priority | Timeline |
|------|--------|--------|----------|----------|
| Add Database Indexes | 🔥🔥🔥🔥🔥 | 1 hour | P0 | Day 1 |
| Add Authentication | 🔥🔥🔥🔥🔥 | 1 day | P0 | Day 1-2 |
| Add Rate Limiting | 🔥🔥🔥🔥 | 2 hours | P1 | Day 2 |
| Convert <img> to <Image> | 🔥🔥🔥🔥 | 3 hours | P1 | Day 3 |
| Add Input Validation | 🔥🔥🔥🔥 | 1 day | P1 | Day 3-4 |
| Add Security Headers | 🔥🔥🔥 | 1 hour | P2 | Day 5 |
| Implement Code Splitting | 🔥🔥🔥 | 2 days | P2 | Week 2 |
| Add SWR/React Query | 🔥🔥🔥 | 1 day | P2 | Week 2 |
| Enhanced File Validation | 🔥🔥 | 3 hours | P3 | Week 2 |
| Add Monitoring | 🔥🔥 | 1 day | P3 | Week 3 |

---

## 📈 Expected Results

### Performance Improvements:
- ⚡ Dashboard load time: 3s → 0.5s (6x faster)
- ⚡ API response time: 500ms → 50ms (10x faster)
- ⚡ Bundle size: 16MB → 4MB (75% reduction)
- ⚡ Time to Interactive: 5s → 1s (5x faster)

### Security Improvements:
- 🔒 Admin panel protected with authentication
- 🔒 All API routes authenticated
- 🔒 Rate limiting prevents abuse
- 🔒 Input validation prevents injection attacks
- 🔒 Security headers protect against common attacks
- 🔒 File uploads properly validated

---

## 🚀 Quick Wins (ทำได้เลยวันนี้!)

1. **Add Database Indexes** (1 hour) - ผลกระทบสูงสุด!
2. **Enable Compression** (5 minutes)
3. **Add Cache Headers** (30 minutes)
4. **Lazy Load Heavy Components** (1 hour)

---

อยากให้ผมเริ่มทำการปรับปรุงไหมครับ? เริ่มจาก Quick Wins ก่อนเลยดีไหม?
