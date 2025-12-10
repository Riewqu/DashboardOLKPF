/**
 * Helper functions for API route protection
 */

import { NextResponse } from "next/server";
import { getServerSession, type UserSession } from "./server";

/**
 * Protect API route - require authentication
 */
export async function requireAuth(): Promise<
  | { success: true; session: UserSession }
  | { success: false; response: NextResponse }
> {
  const session = await getServerSession();

  if (!session) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return { success: true, session };
}

/**
 * Protect API route - require admin role
 */
export async function requireAdmin(): Promise<
  | { success: true; session: UserSession }
  | { success: false; response: NextResponse }
> {
  const authResult = await requireAuth();

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.session.role !== "admin") {
    return {
      success: false,
      response: NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    };
  }

  return { success: true, session: authResult.session };
}

/**
 * Example usage in API route:
 *
 * import { requireAdmin } from "@/lib/auth/apiHelpers";
 *
 * export async function POST(req: NextRequest) {
 *   const auth = await requireAdmin(req);
 *   if (!auth.success) return auth.response;
 *
 *   // Your API logic here
 *   // auth.session contains user info
 * }
 */
