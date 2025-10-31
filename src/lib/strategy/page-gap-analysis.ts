import type { KeywordStat } from "../types";
import type { PageGap, CompetitorPageInventory } from "./types";

/**
 * Identifies pages that competitors have but target site doesn't
 *
 * Strategy:
 * 1. Analyze competitor URL structures to identify common page types
 * 2. Compare with target site pages
 * 3. Calculate priority based on competitor prevalence and keyword volume
 * 4. Generate actionable recommendations
 *
 * @param targetPages - URLs from target site
 * @param competitorInventory - Structured competitor page data
 * @param keywordData - Available keyword data for volume estimation
 * @returns Prioritized array of page gaps
 */
export function identifyPageGaps(
  targetPages: string[],
  competitorInventory: CompetitorPageInventory,
  keywordData: KeywordStat[] = []
): PageGap[] {
  const gaps: PageGap[] = [];

  // Normalize target pages for comparison
  const normalizedTargetPages = targetPages.map((url) =>
    normalizeUrlForComparison(url)
  );

  // Analyze competitor page patterns
  const pagePatterns = analyzePagePatterns(competitorInventory);

  // Find patterns missing from target
  pagePatterns.forEach((pattern) => {
    const hasMatchingPage = normalizedTargetPages.some((targetUrl) =>
      urlMatchesPattern(targetUrl, pattern.pattern)
    );

    if (!hasMatchingPage) {
      const estimatedVolume = estimateVolumeForPattern(
        pattern.pattern,
        keywordData
      );

      gaps.push({
        suggestedUrl: pattern.suggestedUrl,
        pageType: pattern.pageType,
        competitorCount: pattern.competitorCount,
        exampleUrls: pattern.exampleUrls,
        estimatedVolume,
        priority: 0, // Will be calculated in prioritization
        reasoning: pattern.reasoning,
      });
    }
  });

  // Prioritize gaps
  return prioritizeGaps(gaps);
}

/**
 * Analyzes competitor URLs to identify common page patterns
 */
interface PagePattern {
  pattern: string; // Simplified pattern (e.g., "services/tattoo-removal")
  suggestedUrl: string; // Recommended URL for target
  pageType: string;
  competitorCount: number;
  exampleUrls: string[];
  reasoning: string;
}

function analyzePagePatterns(
  inventory: CompetitorPageInventory
): PagePattern[] {
  const patterns = new Map<string, PagePattern>();

  // Group similar URLs across competitors
  inventory.allPages.forEach((page) => {
    const pattern = extractPattern(page.url);
    if (!pattern) return;

    const existing = patterns.get(pattern);

    if (existing) {
      existing.competitorCount++;
      existing.exampleUrls.push(page.url);
    } else {
      patterns.set(pattern, {
        pattern,
        suggestedUrl: generateSuggestedUrl(pattern, page.url),
        pageType: page.pageType || inferPageTypeFromUrl(page.url),
        competitorCount: 1,
        exampleUrls: [page.url],
        reasoning: generateReasoning(pattern, page.pageType, 1),
      });
    }
  });

  // Update reasoning with final competitor counts
  patterns.forEach((pattern) => {
    pattern.reasoning = generateReasoning(
      pattern.pattern,
      pattern.pageType,
      pattern.competitorCount
    );
  });

  return Array.from(patterns.values()).filter(
    (p) => p.competitorCount >= 2 // At least 2 competitors have this page
  );
}

/**
 * Extracts a normalized pattern from a URL
 * e.g., "/services/tattoo-removal" -> "services/tattoo-removal"
 * e.g., "/blog/aftercare-guide" -> "blog/aftercare-guide"
 */
function extractPattern(url: string): string | null {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;

    // Remove trailing slash
    path = path.replace(/\/$/, "");

    // Remove leading slash
    path = path.replace(/^\//, "");

    // Skip homepage and generic pages
    if (
      !path ||
      path === "index" ||
      path === "home" ||
      path === "contact" ||
      path === "about"
    ) {
      return null;
    }

    // Remove numeric IDs and dates
    path = path.replace(/\/\d+/g, "");

    return path;
  } catch {
    return null;
  }
}

/**
 * Generates suggested URL for target site based on pattern
 */
function generateSuggestedUrl(pattern: string, exampleUrl: string): string {
  // Use the pattern as base
  let suggested = `/${pattern}`;

  // Clean up any artifacts
  suggested = suggested.replace(/\/+/g, "/");

  return suggested;
}

/**
 * Infers page type from URL structure
 */
function inferPageTypeFromUrl(url: string): string {
  const lower = url.toLowerCase();

  if (lower.includes("/service")) return "service";
  if (lower.includes("/blog") || lower.includes("/article")) return "blog";
  if (lower.includes("/portfolio") || lower.includes("/gallery"))
    return "portfolio";
  if (lower.includes("/faq")) return "faq";
  if (lower.includes("/pricing")) return "pricing";
  if (lower.includes("/location")) return "location";
  if (lower.includes("/review")) return "testimonial";

  return "other";
}

/**
 * Generates reasoning for why this gap is important
 */
function generateReasoning(
  pattern: string,
  pageType: string,
  competitorCount: number
): string {
  const competitorText =
    competitorCount === 1
      ? "1 competitor has"
      : `${competitorCount} competitors have`;

  const typeSpecificReason = getTypeSpecificReasoning(pageType, pattern);

  return `${competitorText} this page type. ${typeSpecificReason}`;
}

/**
 * Provides type-specific reasoning for gap importance
 */
function getTypeSpecificReasoning(pageType: string, pattern: string): string {
  switch (pageType) {
    case "service":
      return "Service pages are critical for conversions and local SEO.";
    case "blog":
      return "Content pages help with long-tail keyword targeting and authority building.";
    case "faq":
      return "FAQ pages improve user experience and can capture featured snippets.";
    case "pricing":
      return "Transparent pricing builds trust and can reduce inquiry friction.";
    case "portfolio":
      return "Showcasing work builds credibility and social proof.";
    case "testimonial":
      return "Reviews and testimonials significantly impact conversion rates.";
    case "location":
      return "Location pages improve local search visibility.";
    default:
      return "This page type is common among successful competitors.";
  }
}

/**
 * Checks if a URL matches a pattern
 */
function urlMatchesPattern(url: string, pattern: string): boolean {
  const normalizedUrl = url.toLowerCase().replace(/^\/|\/$/g, "");
  const normalizedPattern = pattern.toLowerCase();

  // Exact match
  if (normalizedUrl === normalizedPattern) return true;

  // Check if URL contains all significant tokens from pattern
  const patternTokens = normalizedPattern.split(/[/-]/);
  const urlTokens = normalizedUrl.split(/[/-]/);

  const significantTokens = patternTokens.filter(
    (token) => token.length > 3 && !["page", "index"].includes(token)
  );

  if (significantTokens.length === 0) return false;

  const matchCount = significantTokens.filter((token) =>
    urlTokens.includes(token)
  ).length;

  return matchCount / significantTokens.length >= 0.7;
}

/**
 * Normalizes URL for comparison (removes protocol, domain, trailing slashes)
 */
function normalizeUrlForComparison(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().replace(/\/$/, "");
  } catch {
    return url.toLowerCase().replace(/\/$/, "");
  }
}

/**
 * Estimates keyword volume for a page pattern
 */
function estimateVolumeForPattern(
  pattern: string,
  keywordData: KeywordStat[]
): number | undefined {
  if (keywordData.length === 0) return undefined;

  const patternTokens = pattern
    .split(/[/-]/)
    .filter((token) => token.length > 2);

  // Find keywords that match pattern tokens
  const relevantKeywords = keywordData.filter((kw) => {
    const kwLower = kw.keyword.toLowerCase();
    return patternTokens.some((token) => kwLower.includes(token));
  });

  if (relevantKeywords.length === 0) return undefined;

  // Sum volumes
  return relevantKeywords.reduce((sum, kw) => sum + (kw.volume ?? 0), 0);
}

/**
 * Prioritizes page gaps based on multiple factors
 *
 * Priority factors:
 * 1. Competitor prevalence (how many have it)
 * 2. Estimated keyword volume
 * 3. Page type importance (services > blog > other)
 * 4. URL specificity (specific pages > generic)
 *
 * @param gaps - Array of page gaps to prioritize
 * @returns Sorted array with priority scores (1-10)
 */
export function prioritizeGaps(gaps: PageGap[]): PageGap[] {
  // Calculate priority score for each gap
  const scored = gaps.map((gap) => {
    let score = 0;

    // Factor 1: Competitor prevalence (0-4 points)
    score += Math.min(gap.competitorCount, 4);

    // Factor 2: Keyword volume (0-3 points)
    if (gap.estimatedVolume) {
      if (gap.estimatedVolume > 1000) score += 3;
      else if (gap.estimatedVolume > 500) score += 2;
      else if (gap.estimatedVolume > 100) score += 1;
    }

    // Factor 3: Page type importance (0-3 points)
    score += getPageTypeWeight(gap.pageType);

    // Normalize to 1-10 scale
    const normalizedScore = Math.max(1, Math.min(10, Math.round(score)));

    return {
      ...gap,
      priority: normalizedScore,
    };
  });

  // Sort by priority (highest first)
  return scored.sort((a, b) => b.priority - a.priority);
}

/**
 * Assigns weight to page types based on business impact
 */
function getPageTypeWeight(pageType: string): number {
  const weights: Record<string, number> = {
    service: 3,
    pricing: 2,
    faq: 2,
    portfolio: 2,
    location: 2,
    testimonial: 2,
    blog: 1,
    other: 0,
  };

  return weights[pageType] ?? 0;
}

/**
 * Groups gaps by category for better reporting
 */
export function groupGapsByCategory(gaps: PageGap[]): Map<string, PageGap[]> {
  const grouped = new Map<string, PageGap[]>();

  gaps.forEach((gap) => {
    const category = gap.pageType;
    const existing = grouped.get(category) ?? [];
    existing.push(gap);
    grouped.set(category, existing);
  });

  return grouped;
}

/**
 * Generates implementation timeline estimate based on gaps
 */
export function estimateImplementationTimeline(gaps: PageGap[]): {
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  totalWeeks: string;
} {
  const high = gaps.filter((g) => g.priority >= 8).length;
  const medium = gaps.filter((g) => g.priority >= 5 && g.priority < 8).length;
  const low = gaps.filter((g) => g.priority < 5).length;

  // Estimate: 1 week per high-priority page, 0.5 weeks per medium, 0.25 per low
  const totalWeeks = high * 1 + medium * 0.5 + low * 0.25;

  return {
    highPriority: high,
    mediumPriority: medium,
    lowPriority: low,
    totalWeeks: `${Math.ceil(totalWeeks)}-${Math.ceil(totalWeeks * 1.5)} weeks`,
  };
}
