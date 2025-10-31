import { env, hasOpenAICredentials } from "./env";
import type {
  PageContentDraft,
  MetadataRecommendation,
  KeywordStat,
} from "./types";

export interface ContentBrief {
  slug: string;
  url?: string;
  pageType: "homepage" | "existing" | "new";
  metadata: MetadataRecommendation;
  primaryKeywords: KeywordStat[];
  supportingKeywords: KeywordStat[];
  pageObjective: string;
  audienceIntent: string;
  mustInclude: string[];
  authoritySignals?: {
    domainAuthority?: number;
    pageAuthority?: number;
    linkingDomains?: number;
    spamScore?: number;
  };
}

interface ContentResponse {
  pages: Array<{
    slug: string;
    url?: string;
    title: string;
    summary: string;
    callToAction: string;
    sections: Array<{
      heading: string;
      body: string;
      purpose: string;
      targetKeywords: string[];
      internalLinks: string[];
    }>;
  }>;
}

const MODEL = "gpt-4o";

export async function generateContentDrafts(
  briefs: ContentBrief[],
  options: {
    businessName: string;
    businessType: string;
    location?: string;
    serviceArea?: string;
    googleBusinessProfile?: string;
    additionalNotes?: string;
  }
): Promise<PageContentDraft[]> {
  if (!hasOpenAICredentials || !briefs.length) {
    return [];
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior SEO strategist and conversion-focused copywriter. You produce production-ready website copy that aligns with search intent, keyword strategy, and UX best practice. You never invent facts; if information is missing, you highlight the gap instead of guessing.",
        },
        {
          role: "user",
          content: JSON.stringify({
            business: {
              name: options.businessName,
              type: options.businessType,
              location: options.location,
              serviceArea: options.serviceArea,
              googleBusinessProfile: options.googleBusinessProfile,
              additionalNotes: options.additionalNotes,
            },
            requirements: [
              "Every section must be unique, factually grounded, and conversion oriented.",
              "Explicitly address user intent in the body copy – include data-backed hooks, social proof, and differentiators where available.",
              "Use natural language and varied sentence structures; avoid keyword stuffing but ensure target keywords appear at least once.",
              "Maintain a confident, expert tone suitable for high-value service businesses.",
              "Return valid JSON only, adhering to the provided schema.",
              "Include internalLink suggestions only if they are certain; otherwise return an empty array.",
              ...(options.location
                ? [`Reinforce priority geography (${options.location}) within hero messaging and CTAs.`]
                : []),
              ...(options.serviceArea
                ? [`Acknowledge wider service coverage (${options.serviceArea}) where relevant (e.g., FAQs, footer prompts).`]
                : []),
              ...(options.additionalNotes
                ? [`Explicitly weave in strategic context: ${options.additionalNotes}.`]
                : []),
              ...(options.googleBusinessProfile
                ? [
                    "Ensure contact details and trust signals align with the provided Google Business Profile."
                  ]
                : []),
            ],
            schema: {
              pages: [
                {
                  slug: "string",
                  url: "string (optional)",
                  title: "string",
                  summary: "string",
                  callToAction: "string",
                  sections: [
                    {
                      heading: "string",
                      body: "string (paragraphs allowed, min 120 words)",
                      purpose: "string explaining why this section exists",
                      targetKeywords: ["string"],
                      internalLinks: ["string URL paths or empty array"],
                    },
                  ],
                },
              ],
            },
            briefs: briefs.map((brief) => ({
              slug: brief.slug,
              url: brief.url,
              pageType: brief.pageType,
              pageObjective: brief.pageObjective,
              audienceIntent: brief.audienceIntent,
              metadata: brief.metadata,
              primaryKeywords: brief.primaryKeywords.map((keyword) => ({
                keyword: keyword.keyword,
                score: keyword.score,
                intent: keyword.intent,
              })),
              supportingKeywords: brief.supportingKeywords.map((keyword) => ({
                keyword: keyword.keyword,
                score: keyword.score,
              })),
              authoritySignals: brief.authoritySignals ?? {},
              mustInclude: brief.mustInclude,
            })),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    console.warn("[content-writer] OpenAI request failed", response.status, await response.text());
    return [];
  }

  try {
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return [];
    const parsed = JSON.parse(content) as ContentResponse;
    return parsed.pages?.map(normaliseDraft) ?? [];
  } catch (error) {
    console.warn("[content-writer] Failed to parse OpenAI response", error);
    return [];
  }
}

function normaliseDraft(page: ContentResponse["pages"][number]): PageContentDraft {
  return {
    slug: page.slug,
    title: page.title,
    url: page.url,
    summary: page.summary,
    callToAction: page.callToAction,
    sections: page.sections.map((section) => ({
      heading: section.heading,
      body: section.body.trim(),
      purpose: section.purpose,
      targetKeywords: dedupeKeywords(section.targetKeywords),
      internalLinks: section.internalLinks ?? [],
    })),
  };
}

function dedupeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const keyword of keywords ?? []) {
    const normalised = keyword.trim().toLowerCase();
    if (seen.has(normalised)) continue;
    seen.add(normalised);
    result.push(keyword);
  }
  return result;
}
