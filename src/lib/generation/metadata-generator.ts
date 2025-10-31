/**
 * Phase 4: Metadata Generator
 *
 * Generates CTR-optimized title tags and meta descriptions.
 * Uses power words, proper keyword placement, and uniqueness validation.
 */

import { env } from "../env";
import type {
  GeneratedMetadata,
  PageBlueprint,
  BusinessContext,
  POWER_WORDS,
  QUALITY_THRESHOLDS,
} from "./types";
import { buildMetadataPrompt } from "./prompt-builder";

const MODEL = "gpt-4o";

// Power words for metadata optimization
const POWER_WORDS_LIST = {
  urgency: ["Now", "Today", "Limited", "Fast", "Quick", "Instant", "Immediate"],
  value: ["Free", "Save", "Discount", "Deal", "Bonus", "Extra", "Plus"],
  authority: [
    "Expert",
    "Professional",
    "Certified",
    "Award-winning",
    "Top",
    "Best",
    "Leading",
  ],
  quality: ["Premium", "Elite", "Superior", "Exceptional", "Outstanding", "Excellence"],
  results: ["Proven", "Guaranteed", "Results", "Success", "Effective", "Powerful"],
  curiosity: ["Secret", "Revealed", "Guide", "Tips", "Tricks", "Hacks", "Insider"],
  numbers: ["Top 10", "Best 5", "7 Ways", "Complete", "Ultimate", "Essential"],
};

/**
 * Generate optimized metadata for a page
 */
export async function generateMetadata(
  blueprint: PageBlueprint,
  businessContext: BusinessContext,
  existingTitles: string[],
  apiKey: string,
  brandSeparator: string = " | "
): Promise<GeneratedMetadata> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required for metadata generation");
  }

  const promptString = buildMetadataPrompt(blueprint, businessContext, existingTitles);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert SEO metadata specialist. Create compelling, CTR-optimized title tags and meta descriptions that drive clicks while accurately representing content.",
        },
        {
          role: "user",
          content: promptString,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned empty metadata");
  }

  const parsed = JSON.parse(content) as {
    title: string;
    description: string;
  };

  // Clean and validate
  const cleanedTitle = cleanTitle(parsed.title, businessContext.businessName, brandSeparator);
  const cleanedDescription = cleanDescription(parsed.description);

  // Analyze metadata
  const keywordsIncluded = extractIncludedKeywords(
    cleanedTitle,
    cleanedDescription,
    blueprint.primaryKeywords.map((k) => k.keyword)
  );

  const powerWordsUsed = detectPowerWords(cleanedTitle, cleanedDescription);
  const hasCTA = detectCTA(cleanedDescription);
  const uniquenessScore = calculateUniqueness(cleanedTitle, existingTitles);

  return {
    title: cleanedTitle,
    titleLength: cleanedTitle.length,
    description: cleanedDescription,
    descriptionLength: cleanedDescription.length,
    keywordsIncluded,
    powerWordsUsed,
    hasCTA,
    uniquenessScore,
  };
}

/**
 * Clean and normalize title tag
 */
function cleanTitle(title: string, brandName: string, separator: string): string {
  let cleaned = title.trim();

  // Remove any existing brand name to re-add it properly
  const brandRegex = new RegExp(`[|\\-–—]\\s*${escapeRegex(brandName)}\\s*$`, "i");
  cleaned = cleaned.replace(brandRegex, "").trim();

  // Add brand name if not present
  if (!cleaned.toLowerCase().includes(brandName.toLowerCase())) {
    cleaned = `${cleaned}${separator}${brandName}`;
  }

  // Ensure proper length (50-60 characters)
  if (cleaned.length > 60) {
    // Try to trim without brand name first
    const withoutBrand = cleaned.replace(
      new RegExp(`[|\\-–—]\\s*${escapeRegex(brandName)}\\s*$`, "i"),
      ""
    );
    const maxLength = 60 - separator.length - brandName.length;

    if (withoutBrand.length > maxLength) {
      // Trim to max length at word boundary
      const trimmed = withoutBrand.substring(0, maxLength);
      const lastSpace = trimmed.lastIndexOf(" ");
      cleaned = `${trimmed.substring(0, lastSpace)}${separator}${brandName}`;
    }
  }

  return cleaned;
}

/**
 * Clean and normalize meta description
 */
function cleanDescription(description: string): string {
  let cleaned = description.trim();

  // Remove quotes if wrapped
  cleaned = cleaned.replace(/^["']|["']$/g, "");

  // Ensure proper length (150-160 characters)
  if (cleaned.length > 160) {
    // Trim at word boundary
    const trimmed = cleaned.substring(0, 160);
    const lastSpace = trimmed.lastIndexOf(" ");
    cleaned = trimmed.substring(0, lastSpace);

    // Ensure it ends with punctuation
    if (!/[.!?]$/.test(cleaned)) {
      cleaned += ".";
    }
  }

  return cleaned;
}

/**
 * Extract keywords that are included in metadata
 */
function extractIncludedKeywords(
  title: string,
  description: string,
  targetKeywords: string[]
): string[] {
  const combined = `${title} ${description}`.toLowerCase();
  return targetKeywords.filter((keyword) =>
    combined.includes(keyword.toLowerCase())
  );
}

/**
 * Detect power words used in metadata
 */
function detectPowerWords(title: string, description: string): string[] {
  const combined = `${title} ${description}`.toLowerCase();
  const foundWords: string[] = [];

  for (const category of Object.values(POWER_WORDS_LIST)) {
    for (const word of category) {
      if (combined.includes(word.toLowerCase())) {
        foundWords.push(word);
      }
    }
  }

  return [...new Set(foundWords)];
}

/**
 * Detect if description has a CTA
 */
function detectCTA(description: string): boolean {
  const ctaPatterns = [
    /\bcontact\b/i,
    /\bcall\b/i,
    /\bbook\b/i,
    /\bschedule\b/i,
    /\bget\b/i,
    /\blearn more\b/i,
    /\bdiscover\b/i,
    /\bexplore\b/i,
    /\bvisit\b/i,
    /\brequest\b/i,
    /\bstart\b/i,
    /\btry\b/i,
  ];

  return ctaPatterns.some((pattern) => pattern.test(description));
}

/**
 * Calculate uniqueness score against existing titles
 */
function calculateUniqueness(title: string, existingTitles: string[]): number {
  if (existingTitles.length === 0) {
    return 100;
  }

  // Tokenize title
  const titleWords = new Set(
    title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  // Calculate average similarity
  let totalSimilarity = 0;

  for (const existingTitle of existingTitles) {
    const existingWords = new Set(
      existingTitle
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    // Calculate Jaccard similarity
    const intersection = new Set([...titleWords].filter((w) => existingWords.has(w)));
    const union = new Set([...titleWords, ...existingWords]);

    const similarity = union.size > 0 ? intersection.size / union.size : 0;
    totalSimilarity += similarity;
  }

  const avgSimilarity = totalSimilarity / existingTitles.length;

  // Convert to uniqueness score (0-100)
  return Math.round((1 - avgSimilarity) * 100);
}

/**
 * Validate metadata quality
 */
export function validateMetadata(metadata: GeneratedMetadata): string[] {
  const issues: string[] = [];

  // Title length validation
  if (metadata.titleLength < 50) {
    issues.push(`Title too short (${metadata.titleLength} chars, min 50)`);
  } else if (metadata.titleLength > 60) {
    issues.push(`Title too long (${metadata.titleLength} chars, max 60)`);
  }

  // Description length validation
  if (metadata.descriptionLength < 150) {
    issues.push(`Description too short (${metadata.descriptionLength} chars, min 150)`);
  } else if (metadata.descriptionLength > 160) {
    issues.push(`Description too long (${metadata.descriptionLength} chars, max 160)`);
  }

  // Keyword inclusion
  if (metadata.keywordsIncluded.length === 0) {
    issues.push("No target keywords included in metadata");
  }

  // CTA check
  if (!metadata.hasCTA) {
    issues.push("Description missing clear call-to-action");
  }

  // Uniqueness check
  if (metadata.uniquenessScore < 50) {
    issues.push(
      `Low uniqueness score (${metadata.uniquenessScore}%) - too similar to existing titles`
    );
  }

  return issues;
}

/**
 * Generate metadata variations for A/B testing
 */
export async function generateMetadataVariations(
  blueprint: PageBlueprint,
  businessContext: BusinessContext,
  existingTitles: string[],
  apiKey: string,
  count: number = 3
): Promise<GeneratedMetadata[]> {
  const variations: GeneratedMetadata[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const metadata = await generateMetadata(
        blueprint,
        businessContext,
        existingTitles,
        apiKey
      );
      variations.push(metadata);

      // Add to existing titles to ensure next variation is different
      existingTitles.push(metadata.title);

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[metadata-generator] Failed to generate variation ${i + 1}:`, error);
    }
  }

  return variations;
}

/**
 * Format metadata for HTML
 */
export function formatMetadataAsHTML(metadata: GeneratedMetadata): string {
  return `<title>${escapeHTML(metadata.title)}</title>
<meta name="description" content="${escapeHTML(metadata.description)}" />`;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Escape special regex characters
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Suggest power words for metadata
 */
export function suggestPowerWords(
  pageType: string,
  businessType: string
): { category: string; words: string[] }[] {
  const suggestions: { category: string; words: string[] }[] = [];

  // Add authority words for professional services
  if (
    businessType.toLowerCase().includes("law") ||
    businessType.toLowerCase().includes("medical") ||
    businessType.toLowerCase().includes("financial")
  ) {
    suggestions.push({
      category: "authority",
      words: POWER_WORDS_LIST.authority,
    });
  }

  // Add urgency words for transactional pages
  if (pageType === "new" || pageType === "service") {
    suggestions.push({
      category: "urgency",
      words: POWER_WORDS_LIST.urgency,
    });
  }

  // Add value words for all types
  suggestions.push({
    category: "value",
    words: POWER_WORDS_LIST.value.slice(0, 3),
  });

  return suggestions;
}
