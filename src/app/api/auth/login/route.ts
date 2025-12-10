import { NextRequest, NextResponse } from "next/server";
import { verifyPinAndCreateSession } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;

    // Validation
    if (!pin || typeof pin !== "string" || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "Invalid PIN format. Must be 6 digits." },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = req.ip || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Verify PIN and create session
    const result = await verifyPinAndCreateSession(pin, ipAddress, userAgent);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          lockedUntil: result.lockedUntil?.toISOString()
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        username: result.session.username,
        role: result.session.role,
        displayName: result.session.displayName
      }
    });
  } catch (error) {
    console.error("❌ Login API error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
