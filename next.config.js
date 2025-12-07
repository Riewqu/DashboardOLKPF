const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true
});

const nextConfig = {
  reactStrictMode: true,
  // App Router is stable in Next.js 13.4+, no need for experimental flag
};

module.exports = withPWA(nextConfig);
