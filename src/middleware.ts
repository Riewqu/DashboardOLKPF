import { NextRequest, NextResponse } from "next/server";
import { apiRateLimiter, authRateLimiter, uploadRateLimiter, getClientIp, createRateLimitResponse } from "@/lib/rateLimiter";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🚦 Rate Limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);

    // Different rate limits for different endpoints
    let limiter = apiRateLimiter; // Default: 60 req/min

    if (pathname.startsWith("/api/auth/")) {
      limiter = authRateLimiter; // Strict: 5 req/15min
    } else if (pathname.includes("/upload")) {
      limiter = uploadRateLimiter; // Moderate: 5 req/min
    }

    const result = limiter.check(ip);

    if (!result.allowed) {
      console.log(`🚫 Rate limit exceeded for IP: ${ip} on ${pathname}`);
      return createRateLimitResponse(result.resetTime);
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limiter.getStats().maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

    return response;
  }

  // 🔒 Authentication check for non-API routes
  // Public paths that don't require authentication
  const publicPaths = ["/login", "/_next", "/favicon.ico", "/icon-192.png", "/icon-512.png", "/manifest.json", "/sw.js"];

  // Check if path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if session cookie exists
  const sessionToken = request.cookies.get("dashboard_session")?.value;

  // No session -> redirect to login
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists, but we need to validate it in the layout
  // Middleware just checks if cookie exists
  // Full validation happens in server components

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)"
  ]
};
