import { env, hasOpenAICredentials } from "./env";

export interface SenseCheckResult {
  approvedKeywords: string[];
  flaggedKeywords: Array<{ keyword: string; reason: string }>;
  notes: string[];
}

export async function senseCheckKeywords(input: {
  businessName: string;
  businessType: string;
  location?: string;
  serviceArea?: string;
  googleBusinessProfile?: string;
  additionalNotes?: string;
  keywords: string[];
}): Promise<SenseCheckResult> {
  if (!hasOpenAICredentials || !input.keywords.length) {
    return {
      approvedKeywords: input.keywords,
      flaggedKeywords: [],
      notes: hasOpenAICredentials
        ? []
        : ["Skipping AI sense check: missing OPENAI_API_KEY."],
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You validate keyword lists for SEO strategists. Approve terms that match the business offering and location. Flag irrelevant or misleading phrases with concise reasons. Always respond with a JSON object.",
        },
        {
          role: "user",
          content: JSON.stringify({
            businessName: input.businessName,
            businessType: input.businessType,
            location: input.location,
            serviceArea: input.serviceArea,
            googleBusinessProfile: input.googleBusinessProfile,
            additionalNotes: input.additionalNotes,
            keywords: input.keywords,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    console.warn("[sense-check] OpenAI request failed", response.status, await response.text());
    return {
      approvedKeywords: input.keywords,
      flaggedKeywords: [],
      notes: ["AI keyword validation unavailable at the moment—continuing with the collected terms."],
    };
  }

  try {
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return {
        approvedKeywords: input.keywords,
        flaggedKeywords: [],
        notes: ["AI keyword validation returned no response—review the list manually before publishing."],
      };
    }

    const parsed = JSON.parse(content) as {
      approved?: string[];
      flagged?: Array<{ keyword: string; reason: string }>;
      notes?: string[];
    };

    const approved = parsed.approved?.filter(Boolean) ?? input.keywords;
    const flagged = parsed.flagged?.filter((entry) => entry?.keyword && entry.reason) ?? [];

    return {
      approvedKeywords: approved,
      flaggedKeywords: flagged,
      notes: parsed.notes ?? [],
    };
  } catch (error) {
    console.warn("[sense-check] Failed to parse response", error);
    return {
      approvedKeywords: input.keywords,
      flaggedKeywords: [],
      notes: ["AI keyword validation returned unreadable data—proceed with manual review."],
    };
  }
}
