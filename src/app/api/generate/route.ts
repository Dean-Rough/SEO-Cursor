import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSeoReport } from "@/lib/generator";
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
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[generate-api]", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unexpected error creating SEO report",
      },
      { status: 500 }
    );
  }
}
