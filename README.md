# 📊 Dashboard OL - Multi-Platform E-Commerce Sales Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat&logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-purple?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)

แดชบอร์ดสำหรับติดตามและวิเคราะห์ยอดขายจากหลายแพลตฟอร์ม E-Commerce (TikTok, Shopee, Lazada) แบบเรียลไทม์ พร้อม PWA Support สำหรับการใช้งานบนมือถือและเดสก์ท็อป

[English](#english-version) | [ไทย](#thai-version)

---

## 🌟 Features

### 📱 Core Features
- **Multi-Platform Integration**: รองรับ TikTok, Shopee, Lazada
- **Real-time Dashboard**: แสดงภาพรวมยอดขาย, ค่าธรรมเนียม, การปรับยอด, และยอดโอน
- **Product Sales Analysis**: วิเคราะห์ยอดขายแยกตามสินค้า
- **Geographic Visualization**: แสดงยอดขายแยกตามจังหวัดด้วย D3.js Thailand Map
- **Goals Tracking**: ตั้งเป้าหมายรายเดือนและติดตามความคืบหน้า
- **Excel Import/Export**: อัปโหลดและส่งออกข้อมูลแบบ Excel (.xlsx)
- **Product Master Management**: จัดการข้อมูลสินค้าและ mapping รหัสสินค้าจากแต่ละแพลตฟอร์ม
- **Province Mapping**: จัดการชื่อย่อจังหวัดและ aliases

### 🎨 UI/UX Features
- **Modern Glass Morphism Design**: UI สไตล์โมเดิร์นด้วย glass effect
- **Smooth Scroll Animations**: GPU-accelerated animations ด้วย Intersection Observer
- **Responsive Design**: รองรับทุกขนาดหน้าจอ (Mobile, Tablet, Desktop)
- **Dark/Light Mode**: รองรับธีมสว่าง-มืด
- **Interactive Charts**: กราฟและแผนภูมิแบบ interactive

### 📱 PWA Features
- **Offline Support**: ใช้งานได้แม้ไม่มีอินเทอร์เน็ต
- **Add to Home Screen**: ติดตั้งเป็น app บนมือถือและเดสก์ท็อป
- **App Shortcuts**: Quick actions บน Android (Dashboard, Product Sales, Thailand Map, Admin)
- **iOS Support**: รองรับ iOS Safari แบบเต็มรูปแบบ
- **Service Worker**: Auto-caching สำหรับ performance ที่ดี

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14.2.15 (App Router)
- **Language**: TypeScript 5.6.3
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Lucide React Icons
- **Visualization**: D3.js 7.9.0, D3-Geo, D3-Scale
- **PWA**: next-pwa 5.6.0

### Backend
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **API**: Next.js API Routes

### Libraries
- **Excel Processing**: xlsx 0.18.5
- **Testing**: Jest 30.2.0 with ts-jest
- **Linting**: ESLint 8.57.0

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase Account**: [Sign up for free](https://supabase.com/)

---

## 🚀 Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd DashboardOL-V8
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **⚠️ Important**: Replace the placeholder values with your actual Supabase credentials. You can find these in your Supabase project settings.

### 4. Set up Supabase Database

See [SUPABASE_INDEXES.md](./SUPABASE_INDEXES.md) for database schema and recommended indexes.

Key tables:
- `upload_batches` - Platform transaction uploads
- `transactions` - Individual transaction records
- `platform_metrics` - Aggregated metrics per platform
- `product_master` - Product master data
- `product_code_map` - Platform code to internal code mapping
- `product_sales` - Product sales records
- `product_sales_summary` - Aggregated product sales
- `product_sales_uploads` - Product sales upload tracking
- `province_aliases` - Province name aliases
- `goals` - Monthly revenue/profit goals

### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server at http://localhost:3000
npm run upload       # Alternative dev command

# Production
npm run build        # Build for production (type-checks and lints)
npm start            # Start production server

# Testing & Linting
npm run lint         # Run ESLint checks
npm test             # Run Jest test suite

# Supabase
npm run gen:types    # Generate TypeScript types from Supabase schema
```

---

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (public)/            # Public pages (dashboard, product sales, map)
│   ├── (admin)/             # Admin pages (protected)
│   ├── api/                 # API routes
│   ├── dashboardClient.tsx  # Main dashboard UI
│   ├── dataClient.tsx       # Data fetching functions
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── admin/               # Admin-specific components
│   ├── AnimatedSection.tsx  # Scroll animation wrapper
│   ├── ThailandMapD3.tsx    # D3.js Thailand map
│   └── ...
├── hooks/
│   └── useScrollAnimation.ts # Scroll animation hook
├── lib/
│   ├── supabaseClient.ts    # Supabase client
│   ├── transactionParser.ts # Excel parser for transactions
│   ├── productSales.ts      # Product sales parser
│   ├── metrics.ts           # Metrics aggregation
│   ├── provinceMapper.ts    # Province name normalization
│   ├── database.types.ts    # Generated Supabase types
│   └── ...
└── tests/                   # Jest tests
```

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

---

## 🌐 Pages

| Path | Description |
|------|-------------|
| `/` | Main dashboard with platform metrics |
| `/product-sales` | Product sales analysis |
| `/thailand-map` | Geographic sales visualization |
| `/admin` | Admin dashboard (upload, goals) |
| `/admin/product-map` | Product master & code mapping |

---

## 📤 Data Upload

### Platform Transaction Upload
1. Navigate to `/admin`
2. Select platform (TikTok, Shopee, Lazada)
3. Upload Excel file (.xlsx)
4. System will parse and store transactions
5. Metrics will be automatically recalculated

**Supported Platforms**:
- **TikTok**: English columns (Order/adjustment ID, Seller SKU, fees breakdown)
- **Shopee**: Thai columns (หมายเลขคำสั่งซื้อ, เลขอ้างอิง SKU, etc.)
- **Lazada**: Thai transaction names (ชื่อรายการธุรกรรม)

### Product Sales Upload
1. Navigate to `/admin`
2. Upload Shopee or TikTok product sales Excel file
3. System auto-detects platform and parses data
4. Maps variant codes to internal product codes
5. Aggregates sales by product

---

## 🗺 Geographic Features

The Thailand Map visualization uses:
- **D3.js** for 100% open-source mapping
- **Real GeoJSON data** with accurate boundaries for all 77 provinces
- **Interactive features**: Hover tooltips, clickable provinces
- **Color scale**: Blue gradient based on revenue
- **Province aliases**: Handles variant spellings and abbreviations

See [THAILAND_MAP_GUIDE.md](./THAILAND_MAP_GUIDE.md) and [D3_THAILAND_MAP.md](./D3_THAILAND_MAP.md) for details.

---

## 📱 PWA Setup

The app is fully PWA-enabled for iOS and Android:

### Testing PWA

**Android (Chrome)**:
1. Deploy to HTTPS
2. Open in Chrome Mobile
3. Tap "Add to Home Screen"
4. Long-press app icon for shortcuts

**iOS (Safari)**:
1. Deploy to HTTPS
2. Open in Safari Mobile
3. Tap Share → "Add to Home Screen"
4. App will run in standalone mode

**Desktop (Chrome/Edge)**:
1. Click install button in address bar
2. App installs as desktop app

See [PWA_SETUP.md](./PWA_SETUP.md) for comprehensive PWA documentation.

---

## 🏗 Deployment

### Production Build
```bash
npm run build
npm start
```

### Deployment Checklist
- [ ] Set up environment variables (`.env.local`)
- [ ] Configure Supabase database schema
- [ ] Set up Supabase Storage bucket (`uploads`)
- [ ] Deploy to HTTPS (required for PWA)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Run Lighthouse audit (target: 90-100 PWA score)

### Recommended Platforms
- **Vercel**: Optimal for Next.js (auto-deploy, edge functions)
- **Netlify**: Good alternative with similar features
- **Self-hosted**: Use `npm start` with process manager (PM2, systemd)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- transactionParser.test.ts
```

Test files are located in `tests/` directory.

---

## 🔧 Configuration

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)

### PWA
PWA is configured in `next.config.js`:
- Disabled in development mode
- Auto-generates Service Worker in production
- Caches static assets and API responses

### Theme
Theme colors can be customized in `src/app/globals.css` using CSS variables.

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Comprehensive project documentation |
| [PWA_SETUP.md](./PWA_SETUP.md) | PWA setup and testing guide |
| [THAILAND_MAP_GUIDE.md](./THAILAND_MAP_GUIDE.md) | Thailand map visualization guide |
| [D3_THAILAND_MAP.md](./D3_THAILAND_MAP.md) | D3.js implementation details |
| [SUPABASE_INDEXES.md](./SUPABASE_INDEXES.md) | Database indexes and optimization |
| [PRODUCT_SALES_JOIN_SETUP.md](./PRODUCT_SALES_JOIN_SETUP.md) | Product sales join setup |
| [AGENTS.md](./AGENTS.md) | Agent documentation |

---

## 🔒 Security

- **Environment Variables**: Never commit `.env.local` to git
- **API Keys**: Use Supabase RLS (Row Level Security) for data protection
- **File Upload**: Max 15MB per file with virus scanning recommended
- **HTTPS**: Required for PWA features to work

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Supabase Connection Issues
- Verify environment variables in `.env.local`
- Check Supabase project status
- Verify API keys are correct

### PWA Not Installing
- Ensure site is served over HTTPS
- Check Service Worker registration in DevTools
- Verify manifest.json is valid

---

## 📄 License

This project is private and proprietary.

---

## 👨‍💻 Contributing

This is a private project. For internal development only.

---

## 📞 Support

For issues or questions, please contact the development team.

---

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend platform
- **D3.js** - Data visualization
- **Tailwind CSS** - Utility-first CSS
- **Vercel** - Deployment platform

---

## 📊 Project Stats

- **TypeScript**: 100% type-safe codebase
- **PWA Score**: 90-100 (Lighthouse)
- **Performance**: Optimized with scroll animations and lazy loading
- **Mobile-First**: Responsive design for all screen sizes

---

Made with ❤️ in Thailand
