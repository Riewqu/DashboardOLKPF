import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: session.username,
        role: session.role,
        displayName: session.displayName,
        expiresAt: session.expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error("❌ Session API error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
