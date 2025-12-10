/**
 * Server-side authentication functions
 * These functions should ONLY be called from server components or API routes
 */

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseClient";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "dashboard_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export type UserRole = "viewer" | "admin";

export type UserSession = {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  displayName: string;
  expiresAt: Date;
};

type LoginAttempt = {
  ip_address: string;
  attempts: number;
  locked_until: string | null;
  updated_at: string;
};

/**
 * Verify PIN and create session
 */
export async function verifyPinAndCreateSession(
  pin: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: true; session: UserSession } | { success: false; error: string; lockedUntil?: Date }> {
  try {
    // Check Supabase client
    if (!supabaseAdmin) {
      console.error("❌ Supabase client not initialized");
      return { success: false, error: "Database connection error" };
    }

    // 1. Check brute force protection
    if (ipAddress) {
      const isLocked = await checkBruteForceProtection(ipAddress);
      if (isLocked) {
        const lockInfo = await getLockInfo(ipAddress);
        return {
          success: false,
          error: "Too many failed attempts. Please try again later.",
          lockedUntil: lockInfo?.locked_until ? new Date(lockInfo.locked_until) : undefined
        };
      }
    }

    // 2. Find user by PIN
    const { data: users, error: userError } = await supabaseAdmin!
      .from("user_accounts")
      .select("*")
      .eq("is_active", true);

    if (userError || !users || users.length === 0) {
      console.error("❌ Error fetching users:", userError);
      if (ipAddress) await recordFailedAttempt(ipAddress);
      return { success: false, error: "Invalid PIN" };
    }

    // 3. Check PIN against all users
    let matchedUser: typeof users[0] | null = null;

    for (const user of users) {
      const isMatch = await bcrypt.compare(pin, user.pin_hash);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      if (ipAddress) await recordFailedAttempt(ipAddress);
      await logAuditAction(null, "failed_login", { ip_address: ipAddress }, ipAddress, userAgent);
      return { success: false, error: "Invalid PIN" };
    }

    // 4. Clear failed attempts
    if (ipAddress) {
      await clearFailedAttempts(ipAddress);
    }

    // 5. Create session token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    const { error: sessionError } = await supabaseAdmin.from("user_sessions").insert({
      user_id: matchedUser.id,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      last_activity: new Date().toISOString()
    });

    if (sessionError) {
      console.error("❌ Error creating session:", sessionError);
      return { success: false, error: "Failed to create session" };
    }

    // 6. Update last login
    await supabaseAdmin!
      .from("user_accounts")
      .update({ last_login: new Date().toISOString() })
      .eq("id", matchedUser.id);

    // 7. Log audit
    await logAuditAction(
      matchedUser.id,
      "login",
      { username: matchedUser.username, role: matchedUser.role },
      ipAddress,
      userAgent
    );

    // 8. Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/"
    });

    const session: UserSession = {
      id: token,
      userId: matchedUser.id,
      username: matchedUser.username,
      role: matchedUser.role as UserRole,
      displayName: matchedUser.display_name,
      expiresAt
    };

    console.log("✅ Login successful:", matchedUser.username);

    return { success: true, session };
  } catch (error) {
    console.error("❌ Error in verifyPinAndCreateSession:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

/**
 * Get current session from cookie
 */
export async function getServerSession(): Promise<UserSession | null> {
  try {
    if (!supabaseAdmin) {
      console.error("❌ Supabase client not initialized");
      return null;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Get session from database
    const { data: session, error } = await supabaseAdmin!
      .from("user_sessions")
      .select(`
        *,
        user_accounts (*)
      `)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session || !session.user_accounts) {
      return null;
    }

    const user = Array.isArray(session.user_accounts)
      ? session.user_accounts[0]
      : session.user_accounts;

    // Update last activity
    await supabaseAdmin!
      .from("user_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("token", token);

    return {
      id: token,
      userId: user.id,
      username: user.username,
      role: user.role as UserRole,
      displayName: user.display_name,
      expiresAt: new Date(session.expires_at)
    };
  } catch (error) {
    console.error("❌ Error in getServerSession:", error);
    return null;
  }
}

/**
 * Logout and destroy session
 */
export async function logout(): Promise<void> {
  try {
    if (!supabaseAdmin) {
      console.error("❌ Supabase client not initialized");
      return;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      // Get user info before deleting session
      const { data: session } = await supabaseAdmin!
        .from("user_sessions")
        .select("user_id")
        .eq("token", token)
        .single();

      // Delete session from database
      await supabaseAdmin.from("user_sessions").delete().eq("token", token);

      // Log audit
      if (session) {
        await logAuditAction(session.user_id, "logout", {}, undefined, undefined);
      }

      // Clear cookie
      cookieStore.delete(SESSION_COOKIE_NAME);

      console.log("✅ Logout successful");
    }
  } catch (error) {
    console.error("❌ Error in logout:", error);
  }
}

/**
 * Check if role has permission for path
 */
export function hasPermission(role: UserRole, path: string): boolean {
  // Admin has access to everything
  if (role === "admin") {
    return true;
  }

  // Viewer can access public pages only
  if (role === "viewer") {
    const publicPaths = ["/", "/product-sales", "/thailand-map"];
    return publicPaths.some(p => path === p || path.startsWith(p + "/"));
  }

  return false;
}

/**
 * Brute force protection: Check if IP is locked
 */
async function checkBruteForceProtection(ipAddress: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const { data, error } = await supabaseAdmin!
    .from("login_attempts")
    .select("*")
    .eq("ip_address", ipAddress)
    .single();

  if (error || !data) {
    return false;
  }

  // Check if locked
  if (data.locked_until) {
    const lockedUntil = new Date(data.locked_until);
    if (lockedUntil > new Date()) {
      return true; // Still locked
    }
  }

  // Check attempts (lock after 5 failed attempts)
  if (data.attempts && data.attempts >= 5) {
    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // Lock for 5 minutes
    await supabaseAdmin!
      .from("login_attempts")
      .update({ locked_until: lockedUntil.toISOString() })
      .eq("ip_address", ipAddress);
    return true;
  }

  return false;
}

/**
 * Get lock info for IP
 */
async function getLockInfo(ipAddress: string): Promise<LoginAttempt | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin!
    .from("login_attempts")
    .select("*")
    .eq("ip_address", ipAddress)
    .single();

  if (error || !data) {
    return null;
  }

  return data as LoginAttempt;
}

/**
 * Record failed login attempt
 */
async function recordFailedAttempt(ipAddress: string): Promise<void> {
  if (!supabaseAdmin) return;

  const { data: existing } = await supabaseAdmin!
    .from("login_attempts")
    .select("*")
    .eq("ip_address", ipAddress)
    .single();

  if (existing) {
    // Increment attempts
    await supabaseAdmin!
      .from("login_attempts")
      .update({
        attempts: (existing.attempts || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("ip_address", ipAddress);
  } else {
    // Create new record
    await supabaseAdmin.from("login_attempts").insert({
      ip_address: ipAddress,
      attempts: 1,
      updated_at: new Date().toISOString()
    });
  }
}

/**
 * Clear failed attempts after successful login
 */
async function clearFailedAttempts(ipAddress: string): Promise<void> {
  if (!supabaseAdmin) return;

  await supabaseAdmin!
    .from("login_attempts")
    .delete()
    .eq("ip_address", ipAddress);
}

/**
 * Log audit action
 */
async function logAuditAction(
  userId: string | null,
  action: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    if (!supabaseAdmin) return;

    // Get username if userId provided
    let username: string | null = null;
    if (userId) {
      const { data: user } = await supabaseAdmin!
        .from("user_accounts")
        .select("username")
        .eq("id", userId)
        .single();
      username = user?.username || null;
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      username,
      action,
      details,
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    });
  } catch (error) {
    console.error("❌ Error logging audit action:", error);
  }
}

/**
 * Cleanup expired sessions (should be called periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  if (!supabaseAdmin) return 0;

  const { data } = await supabaseAdmin!
    .from("user_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select();

  return data?.length || 0;
}
