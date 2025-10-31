import type { KeywordStat } from "../types";

/**
 * Represents a cluster of related keywords grouped by semantic similarity
 */
export interface KeywordCluster {
  /** Unique identifier for the cluster */
  id: string;
  /** Human-readable cluster name (e.g., "Custom Tattoo Design") */
  name: string;
  /** All keywords belonging to this cluster */
  keywords: KeywordStat[];
  /** The highest volume keyword in the cluster */
  primaryKeyword: string;
  /** Sum of search volumes for all keywords in cluster */
  totalVolume: number;
  /** Average difficulty score across all keywords */
  averageDifficulty: number;
  /** Primary search intent for this cluster */
  intent?: "informational" | "navigational" | "transactional" | "commercial";
}

/**
 * Maps a keyword cluster to a specific page (existing or new)
 */
export interface PageKeywordMapping {
  /** URL for the page (existing or suggested new URL) */
  url: string;
  /** Type of page for content strategy purposes */
  pageType: "homepage" | "service" | "blog" | "about" | "contact" | "other";
  /** The keyword cluster assigned to this page */
  cluster: KeywordCluster;
  /** Single primary keyword to optimize for */
  primaryKeyword: string;
  /** 3-5 supporting keywords for the page */
  secondaryKeywords: string[];
  /** Whether to create, optimize, or keep as-is */
  status: "create" | "optimize" | "keep";
}

/**
 * Identifies a page that competitors have but target site doesn't
 */
export interface PageGap {
  /** Suggested URL path for the missing page */
  suggestedUrl: string;
  /** Category of page (e.g., "service", "blog", "resource") */
  pageType: string;
  /** Number of competitors that have this type of page */
  competitorCount: number;
  /** Example URLs from competitor sites */
  exampleUrls: string[];
  /** Estimated total search volume for keywords this page would target */
  estimatedVolume?: number;
  /** Priority score (1-10) for creating this page */
  priority: number;
  /** Explanation of why this gap is important */
  reasoning: string;
}

/**
 * Recommended content specifications for a page based on competitor analysis
 */
export interface ContentTarget {
  /** URL of the page */
  url: string;
  /** Recommended word count (competitor avg + 10%) */
  wordCount: number;
  /** Number of H2 sections needed */
  sectionCount: number;
  /** Recommended number of images */
  imageCount: number;
  /** Whether to include an FAQ section */
  includeFAQ: boolean;
  /** Competitor benchmarks used to calculate targets */
  competitorBenchmark: {
    averageWordCount: number;
    averageImageCount: number;
  };
}

/**
 * Represents a single internal link recommendation
 */
export interface InternalLink {
  /** Source page URL */
  fromUrl: string;
  /** Destination page URL */
  toUrl: string;
  /** Recommended anchor text (keyword-optimized) */
  anchorText: string;
  /** Where and why to place this link */
  context: string;
}

/**
 * Complete internal linking strategy for the site
 */
export interface InternalLinkingBlueprint {
  /** All recommended internal links */
  links: InternalLink[];
  /** Hub pages that should receive most inbound links (pillar content) */
  hubPages: string[];
  /** Spoke pages that primarily link to hub pages */
  spokePages: string[];
}

/**
 * Complete strategy for a single page combining all elements
 */
export interface PageStrategy {
  /** URL for the page */
  url: string;
  /** Type of page */
  pageType: "homepage" | "service" | "blog" | "about" | "contact" | "other";
  /** Primary keyword to optimize for */
  primaryKeyword: string;
  /** Supporting keywords (3-5) */
  secondaryKeywords: string[];
  /** Keyword cluster this page belongs to */
  cluster: KeywordCluster;
  /** Content specifications and targets */
  contentTarget: ContentTarget;
  /** Priority score (1-10) for implementation */
  priority: number;
  /** Whether to create, optimize, or keep */
  status: "create" | "optimize" | "keep";
  /** Internal linking recommendations */
  internalLinks: {
    /** Links that should point to this page */
    inbound: InternalLink[];
    /** Links this page should have */
    outbound: InternalLink[];
  };
}

/**
 * Complete strategic report combining all Phase 2 outputs
 */
export interface StrategyReport {
  /** All identified keyword clusters */
  keywordClusters: KeywordCluster[];
  /** Complete strategy for each page */
  pageStrategies: PageStrategy[];
  /** Identified gaps in content compared to competitors */
  pageGaps: PageGap[];
  /** Internal linking blueprint */
  internalLinkingBlueprint: InternalLinkingBlueprint;
  /** Summary statistics */
  summary: {
    totalPages: number;
    pagesToCreate: number;
    pagesToOptimize: number;
    totalKeywordClusters: number;
    estimatedWorkload: string;
  };
}

/**
 * Metrics about content depth from competitor analysis (from Phase 1)
 */
export interface ContentDepthMetrics {
  averageWordCount: number;
  averageImageCount: number;
  averageSectionCount: number;
  faqPresence: number; // Percentage of pages with FAQ
}

/**
 * Inventory of competitor pages (from Phase 1)
 */
export interface CompetitorPageInventory {
  competitorUrls: string[][];
  commonPageTypes: Map<string, string[]>; // pageType -> URLs
  allPages: Array<{
    url: string;
    competitor: string;
    pageType: string;
  }>;
}
