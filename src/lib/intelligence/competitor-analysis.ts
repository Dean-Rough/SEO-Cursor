import type { EnhancedPageAnalysis, ContentDepthMetrics } from "./types";

/**
 * Analyzes content depth metrics across multiple pages.
 * Calculates averages for word count, heading counts, images, FAQ presence,
 * and identifies common schema types. Can also break down metrics by page type.
 *
 * @param pages - Array of enhanced page analyses to aggregate
 * @returns Content depth metrics aggregated across all pages
 */
export function analyzeContentDepth(pages: EnhancedPageAnalysis[]): ContentDepthMetrics {
  if (pages.length === 0) {
    return {
      averageWordCount: 0,
      averageH2Count: 0,
      averageH3Count: 0,
      averageImageCount: 0,
      faqPresenceRate: 0,
      commonSchemaTypes: [],
      byPageType: {},
    };
  }

  // Calculate overall averages
  const totalWordCount = pages.reduce((sum, page) => sum + (page.wordCount || 0), 0);
  const totalH2Count = pages.reduce((sum, page) => sum + page.h2Count, 0);
  const totalH3Count = pages.reduce((sum, page) => sum + page.h3Count, 0);
  const totalImageCount = pages.reduce((sum, page) => sum + page.imageCount, 0);
  const pagesWithFAQ = pages.filter(page => page.hasFAQ).length;

  // Count schema types across all pages
  const schemaTypeCounts = new Map<string, number>();
  pages.forEach(page => {
    page.schemaTypes.forEach(type => {
      schemaTypeCounts.set(type, (schemaTypeCounts.get(type) || 0) + 1);
    });
  });

  // Get most common schema types (appearing in at least 20% of pages or 2 pages minimum)
  const minThreshold = Math.max(2, Math.floor(pages.length * 0.2));
  const commonSchemaTypes = Array.from(schemaTypeCounts.entries())
    .filter(([_, count]) => count >= minThreshold)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);

  // Calculate metrics by page type
  const byPageType = calculatePageTypeMetrics(pages);

  return {
    averageWordCount: Math.round(totalWordCount / pages.length),
    averageH2Count: Math.round((totalH2Count / pages.length) * 10) / 10, // 1 decimal place
    averageH3Count: Math.round((totalH3Count / pages.length) * 10) / 10,
    averageImageCount: Math.round((totalImageCount / pages.length) * 10) / 10,
    faqPresenceRate: pagesWithFAQ / pages.length,
    commonSchemaTypes,
    byPageType,
  };
}

/**
 * Calculates content depth metrics grouped by page type.
 * Only includes page types that have at least 2 pages.
 *
 * @param pages - Array of enhanced page analyses
 * @returns Metrics broken down by page type
 */
function calculatePageTypeMetrics(
  pages: EnhancedPageAnalysis[]
): ContentDepthMetrics['byPageType'] {
  const pagesByType = new Map<string, EnhancedPageAnalysis[]>();

  // Group pages by type
  pages.forEach(page => {
    const existing = pagesByType.get(page.pageType) || [];
    existing.push(page);
    pagesByType.set(page.pageType, existing);
  });

  const result: ContentDepthMetrics['byPageType'] = {};

  // Calculate metrics for each page type (only if at least 2 pages)
  pagesByType.forEach((typePages, pageType) => {
    if (typePages.length < 2) return; // Skip types with too few pages

    const totalWordCount = typePages.reduce((sum, page) => sum + (page.wordCount || 0), 0);
    const totalImageCount = typePages.reduce((sum, page) => sum + page.imageCount, 0);
    const totalSectionCount = typePages.reduce(
      (sum, page) => sum + page.h2Count + page.h3Count,
      0
    );

    result[pageType] = {
      averageWordCount: Math.round(totalWordCount / typePages.length),
      averageImageCount: Math.round((totalImageCount / typePages.length) * 10) / 10,
      averageSectionCount: Math.round((totalSectionCount / typePages.length) * 10) / 10,
    };
  });

  return result;
}

/**
 * Aggregates content depth metrics across multiple competitors.
 * Useful for calculating industry benchmarks.
 *
 * @param competitors - Array of competitor analyses with their pages
 * @returns Aggregated metrics across all competitors
 */
export function aggregateCompetitorMetrics(
  competitors: Array<{ domain: string; pages: EnhancedPageAnalysis[] }>
): ContentDepthMetrics {
  const allPages = competitors.flatMap(comp => comp.pages);
  return analyzeContentDepth(allPages);
}

/**
 * Compares target site metrics against competitor benchmarks.
 * Returns insights about where the target site is underperforming.
 *
 * @param targetMetrics - Content depth metrics for the target site
 * @param competitorMetrics - Aggregated metrics from competitors
 * @returns Array of insights and gaps
 */
export function compareToCompetitors(
  targetMetrics: ContentDepthMetrics,
  competitorMetrics: ContentDepthMetrics
): string[] {
  const insights: string[] = [];

  // Compare word count
  const wordCountDiff = targetMetrics.averageWordCount - competitorMetrics.averageWordCount;
  if (wordCountDiff < -200) {
    insights.push(
      `Target site pages are significantly shorter (${targetMetrics.averageWordCount} words) than competitors (${competitorMetrics.averageWordCount} words on average). Consider adding more comprehensive content.`
    );
  } else if (wordCountDiff > 200) {
    insights.push(
      `Target site pages are longer (${targetMetrics.averageWordCount} words) than competitors (${competitorMetrics.averageWordCount} words). Ensure content is concise and valuable.`
    );
  }

  // Compare image usage
  const imageDiff = targetMetrics.averageImageCount - competitorMetrics.averageImageCount;
  if (imageDiff < -1) {
    insights.push(
      `Target site uses fewer images (${targetMetrics.averageImageCount.toFixed(1)}) per page than competitors (${competitorMetrics.averageImageCount.toFixed(1)}). Visual content can improve engagement.`
    );
  }

  // Compare section structure
  const targetSections = targetMetrics.averageH2Count + targetMetrics.averageH3Count;
  const competitorSections = competitorMetrics.averageH2Count + competitorMetrics.averageH3Count;
  if (targetSections < competitorSections - 2) {
    insights.push(
      `Target site pages have fewer sections (${targetSections.toFixed(1)} headings) than competitors (${competitorSections.toFixed(1)}). Better content structure can improve readability and SEO.`
    );
  }

  // Compare FAQ adoption
  if (targetMetrics.faqPresenceRate < competitorMetrics.faqPresenceRate - 0.2) {
    insights.push(
      `Only ${(targetMetrics.faqPresenceRate * 100).toFixed(0)}% of target pages have FAQs, compared to ${(competitorMetrics.faqPresenceRate * 100).toFixed(0)}% for competitors. FAQ sections can capture featured snippets.`
    );
  }

  // Compare schema markup
  if (targetMetrics.commonSchemaTypes.length === 0 && competitorMetrics.commonSchemaTypes.length > 0) {
    insights.push(
      `Target site lacks schema markup, while competitors use: ${competitorMetrics.commonSchemaTypes.join(', ')}. Adding structured data can improve search visibility.`
    );
  }

  return insights;
}

/**
 * Finds the best-performing competitor based on content depth metrics.
 * "Best" is determined by a composite score of word count, structure, and features.
 *
 * @param competitors - Array of competitor analyses with their metrics
 * @returns The competitor with the highest content quality score, or null if none
 */
export function findBestPerformingCompetitor(
  competitors: Array<{ domain: string; contentDepth: ContentDepthMetrics }>
): { domain: string; score: number } | null {
  if (competitors.length === 0) return null;

  const scored = competitors.map(comp => {
    const metrics = comp.contentDepth;

    // Calculate composite score
    // Word count: 1 point per 100 words (capped at 15)
    const wordScore = Math.min(15, metrics.averageWordCount / 100);

    // Section structure: 1 point per section (capped at 10)
    const sectionScore = Math.min(10, metrics.averageH2Count + metrics.averageH3Count);

    // Images: 2 points per image (capped at 10)
    const imageScore = Math.min(10, metrics.averageImageCount * 2);

    // FAQ presence: 5 points if >50% pages have FAQ
    const faqScore = metrics.faqPresenceRate > 0.5 ? 5 : 0;

    // Schema markup: 2 points per common type (capped at 10)
    const schemaScore = Math.min(10, metrics.commonSchemaTypes.length * 2);

    const totalScore = wordScore + sectionScore + imageScore + faqScore + schemaScore;

    return {
      domain: comp.domain,
      score: Math.round(totalScore * 10) / 10, // 1 decimal place
    };
  });

  // Return competitor with highest score
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}
