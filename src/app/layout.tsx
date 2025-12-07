import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "แดชบอร์ดยอดขายทุกช่องทาง",
  description: "ติดตามยอดขาย TikTok | Shopee | Lazada แบบ PWA บนมือถือและเดสก์ท็อป",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sales Dashboard"
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ]
  },
  applicationName: "ยอดขาย",
  keywords: ["sales", "dashboard", "tiktok", "shopee", "lazada", "e-commerce", "ยอดขาย", "แดชบอร์ด"],
};

export const viewport: Viewport = {
  themeColor: "#0b1f3a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover" // สำหรับ iPhone X+ notch
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* iOS Specific Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ยอดขาย" />

        {/* iOS Touch Icons - Different sizes for different devices */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />

        {/* iOS Splash Screens - สำหรับหน้าจอ loading */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" />

        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#0b1f3a" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
