import type { PageAnalysis, KeywordStat } from "../types";

/**
 * Enhanced page analysis that extends the base PageAnalysis with additional intelligence data
 */
export interface EnhancedPageAnalysis extends PageAnalysis {
  /** Detected type of page based on URL patterns and content */
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other';
  /** Call-to-action elements extracted from the page */
  ctas: ExtractedCTA[];
  /** Schema.org types found in JSON-LD scripts */
  schemaTypes: string[];
  /** Count of H2 headings on the page */
  h2Count: number;
  /** Count of H3 headings on the page */
  h3Count: number;
  /** Total number of images on the page */
  imageCount: number;
  /** Whether the page contains an FAQ section */
  hasFAQ: boolean;
}

/**
 * Call-to-action element extracted from a page
 */
export interface ExtractedCTA {
  /** The visible text of the CTA */
  text: string;
  /** Type of element (button or link) */
  type: 'button' | 'link';
  /** URL the CTA points to (if available) */
  targetUrl?: string;
}

/**
 * Aggregated metrics about content depth across multiple pages
 */
export interface ContentDepthMetrics {
  /** Average word count across all pages */
  averageWordCount: number;
  /** Average number of H2 headings per page */
  averageH2Count: number;
  /** Average number of H3 headings per page */
  averageH3Count: number;
  /** Average number of images per page */
  averageImageCount: number;
  /** Percentage of pages that contain FAQ sections (0-1) */
  faqPresenceRate: number;
  /** Most commonly used schema types across pages */
  commonSchemaTypes: string[];
  /** Metrics broken down by page type (if detectable) */
  byPageType?: {
    [pageType: string]: {
      averageWordCount: number;
      averageImageCount: number;
      averageSectionCount: number;
    };
  };
}

/**
 * Results of auditing images across a site
 */
export interface ImageAuditResult {
  /** Total number of images found */
  totalImages: number;
  /** Number of images with alt attributes */
  imagesWithAlt: number;
  /** Number of images with descriptive alt text (>5 words) */
  imagesWithDescriptiveAlt: number;
  /** Number of images with keyword-optimized alt text */
  imagesWithKeywordAlt: number;
  /** Average number of images per page */
  averageImagesPerPage: number;
  /** URLs of pages that have no images */
  pagesWithoutImages: string[];
}

/**
 * Inventory of competitor pages categorized by type
 */
export interface CompetitorPageInventory {
  /** All competitor pages with categorization */
  allPages: CategorizedPage[];
  /** Common page patterns found across multiple competitors */
  commonPages: CommonPagePattern[];
}

/**
 * A page categorized by its type and URL slug
 */
export interface CategorizedPage {
  /** Full URL of the page */
  url: string;
  /** Detected page type */
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other';
  /** URL slug/path */
  slug: string;
  /** Domain this page belongs to */
  domain: string;
}

/**
 * A page pattern found across multiple competitors
 */
export interface CommonPagePattern {
  /** Type of page */
  pageType: string;
  /** Common slug pattern */
  slug: string;
  /** Example URLs showing this pattern */
  exampleUrls: string[];
  /** Number of competitors that have this page */
  competitorCount: number;
}

/**
 * Complete intelligence report combining all analysis data
 */
export interface IntelligenceReport {
  /** Intelligence about the target site */
  targetSite: {
    /** Enhanced analysis of all crawled pages */
    pages: EnhancedPageAnalysis[];
    /** Image audit results for the target site */
    imageAudit: ImageAuditResult;
    /** All CTAs found across the site */
    existingCTAs: ExtractedCTA[];
    /** All schema types used on the site */
    existingSchemaTypes: string[];
  };
  /** Intelligence about each competitor */
  competitors: Array<{
    /** Competitor domain */
    domain: string;
    /** Enhanced analysis of competitor pages */
    pages: EnhancedPageAnalysis[];
    /** Content depth metrics for this competitor */
    contentDepth: ContentDepthMetrics;
  }>;
  /** Inventory of competitor pages and common patterns */
  competitorInventory: CompetitorPageInventory;
  /** Benchmark metrics across all competitors */
  benchmarks: {
    /** Average word count across all competitor pages */
    averageWordCount: number;
    /** Average image count across all competitor pages */
    averageImageCount: number;
    /** Average section count across all competitor pages */
    averageSectionCount: number;
  };
}
