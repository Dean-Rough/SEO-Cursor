import type { KeywordStat, SiteSnapshot } from '../types';
import type { PageStrategy } from '../strategy/types';
import type { EnhancedPageAnalysis } from '../intelligence/types';
import {
  clusterKeywords,
  mapKeywordsToPages,
  identifyPageGaps,
  calculateContentTargets,
  buildLinkingBlueprint
} from '../strategy';

export interface StrategyInput {
  keywords: KeywordStat[];
  existingPages: string[];
  targetSite: {
    domain: string;
    pages: EnhancedPageAnalysis[];
  };
  competitors: Array<{
    domain: string;
    pages: EnhancedPageAnalysis[];
  }>;
  competitorInventory: any; // From Phase 1
  contentDepthMetrics: {
    averageWordCount: number;
    averageImageCount: number;
    averageSectionCount: number;
    faqPresence: number;
  };
  businessType: string;
}

/**
 * Builds a complete strategic plan from keywords and site data
 * Orchestrates keyword clustering, page mapping, gap analysis, and linking
 */
export async function buildStrategy(input: StrategyInput) {
  // Cluster keywords
  const clusters = clusterKeywords(input.keywords);

  // Map to pages
  const mappings = mapKeywordsToPages(
    clusters,
    input.existingPages,
    input.competitors.flatMap(c => c.pages.map(p => p.url))
  );

  // Identify gaps
  const gaps = identifyPageGaps(
    input.existingPages,
    input.competitorInventory,
    input.keywords
  );

  // Calculate content targets
  const targets = calculateContentTargets(
    mappings,
    input.contentDepthMetrics
  );

  // Build internal linking
  const linking = buildLinkingBlueprint(
    mappings.map((m: any) => ({
      ...m,
      contentTarget: targets.find((t: any) => t.url === m.url),
    })),
    {
      homepage: input.targetSite.domain,
      servicePages: mappings.filter((m: any) => m.pageType === 'service').map((m: any) => m.url),
      blogPages: mappings.filter((m: any) => m.pageType === 'blog').map((m: any) => m.url),
    }
  );

  return {
    clusters,
    mappings,
    gaps,
    targets,
    linking,
  };
}
