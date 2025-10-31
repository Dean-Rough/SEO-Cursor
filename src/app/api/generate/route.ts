import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSeoReport } from "@/lib/generator";
import { checkRateLimit, getRequestIdentifier } from "@/lib/rate-limit";
import type { SiteInput } from "@/lib/types";

const REQUEST_SCHEMA = z.object({
  businessName: z.string().min(2, "Business name is required"),
  website: z.string().min(3, "Website is required"),
  businessType: z.string().min(2, "Business type is required"),
  businessAddress: z.string().optional(),
  serviceArea: z.string().optional(),
  googleBusinessProfile: z.string().optional(),
  additionalNotes: z.string().optional(),
  competitors: z.array(z.string().min(3)).max(5).optional(),
  useSenseCheck: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting: 10 requests per hour per IP
    const identifier = getRequestIdentifier(request);
    const rateLimit = checkRateLimit(identifier, {
      limit: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.reset),
            "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const payload = await request.json();
    const data = REQUEST_SCHEMA.parse(payload);

    const report = await generateSeoReport({
      businessName: data.businessName,
      website: data.website,
      businessType: data.businessType,
      businessAddress: data.businessAddress,
      serviceArea: data.serviceArea,
      googleBusinessProfile: data.googleBusinessProfile,
      additionalNotes: data.additionalNotes,
      competitors: data.competitors ?? [],
      useSenseCheck: data.useSenseCheck,
    } satisfies SiteInput);

    return NextResponse.json(report, {
      headers: {
        "cache-control": "no-store",
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.reset),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[generate-api] Full error details:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const detailedMessage = errorMessage.includes("OpenAI")
      ? "OpenAI API error - check your API key and model availability"
      : errorMessage.includes("Moz")
      ? "Moz API error - check your credentials and rate limits"
      : errorMessage.includes("fetch")
      ? "Network error while crawling - target site may be unreachable"
      : `Report generation failed: ${errorMessage}`;

    return NextResponse.json(
      {
        message: detailedMessage,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
