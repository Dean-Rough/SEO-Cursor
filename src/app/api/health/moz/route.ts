import { NextResponse } from "next/server";
import { checkMozAccountStatus } from "@/lib/moz-health";

/**
 * GET /api/health/moz
 *
 * Check Moz API configuration and account status.
 * Returns credential validity, quota information, and subscription details.
 *
 * No authentication required - this is a health check endpoint.
 */
export async function GET() {
  try {
    const status = await checkMozAccountStatus();

    // Return appropriate status code based on health
    if (!status.isConfigured) {
      return NextResponse.json(status, { status: 503 }); // Service Unavailable
    }

    if (!status.isValid) {
      return NextResponse.json(status, { status: 401 }); // Unauthorized
    }

    if (!status.hasCredits) {
      return NextResponse.json(status, { status: 429 }); // Too Many Requests / Quota Exceeded
    }

    // All good!
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        isConfigured: false,
        isValid: false,
        hasCredits: false,
        error: error instanceof Error ? error.message : "Unknown health check error",
      },
      { status: 500 }
    );
  }
}
