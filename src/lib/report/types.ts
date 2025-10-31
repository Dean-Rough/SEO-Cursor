/**
 * Phase 5: Report Assembly - Type Definitions
 *
 * Enhanced types for the 4-phase report structure with intelligence,
 * strategy, blueprints, and generated content visualization.
 */

import type { SeoReport, KeywordStat, PageAnalysis, ContentSection } from '../types';

/**
 * Complete report data structure combining all 4 phases
 */
export interface EnhancedReportData {
  intelligence: IntelligenceReport;
  strategy: StrategyReport;
  blueprints: BlueprintReport;
  generatedContent: GeneratedContentReport;
  metadata: ReportMetadata;
}

/**
 * Phase 1: Intelligence Report
 */
export interface IntelligenceReport {
  targetSite: {
    pageCount: number;
    avgWordCount: number;
    avgImageCount: number;
    pagesWithImages: number;
    schemaMarkupDetected: boolean;
    existingCTAs: string[];
    pages: PageAnalysis[];
  };
  competitors: {
    count: number;
    avgWordCount: number;
    avgImageCount: number;
    avgSectionCount: number;
    commonPagesMissing: string[];
  };
  benchmarks: {
    wordCountGap: number;
    imageCountGap: number;
    contentDepthGap: string;
  };
}

/**
 * Phase 2: Strategy Report
 */
export interface StrategyReport {
  keywordClusters: KeywordCluster[];
  siteArchitecture: {
    existingPages: PageStrategy[];
    newPages: PageStrategy[];
    totalPages: number;
  };
  internalLinking: {
    totalLinks: number;
    topPriority: Array<{
      from: string;
      to: string;
      anchor: string;
      priority: number;
    }>;
  };
}

/**
 * Keyword cluster with related keywords
 */
export interface KeywordCluster {
  id: string;
  name: string;
  primaryKeyword: KeywordStat;
  secondaryKeywords: KeywordStat[];
  totalVolume: number;
  avgDifficulty: number;
  targetPage: string;
}

/**
 * Page strategy with targets and status
 */
export interface PageStrategy {
  url: string;
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other';
  primaryKeyword: string;
  secondaryKeywords: string[];
  cluster?: KeywordCluster;
  contentTargets: ContentTargets;
  priority: number; // 1-10
  status: 'create' | 'optimize' | 'keep';
}

/**
 * Content depth targets for a page
 */
export interface ContentTargets {
  wordCount: number;
  sectionCount: number;
  imageCount: number;
  includesFAQ: boolean;
  includesSchema: boolean;
}

/**
 * Phase 3: Blueprint Report
 */
export interface BlueprintReport {
  blueprints: PageBlueprint[];
  totalBlueprints: number;
  createCount: number;
  optimizeCount: number;
  keepCount: number;
}

/**
 * Detailed page blueprint
 */
export interface PageBlueprint {
  url: string;
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other';
  primaryKeyword: string;
  secondaryKeywords: string[];
  priority: number;
  status: 'create' | 'optimize' | 'keep';
  qualityScore: number; // 0-100
  metadata: {
    title: string;
    description: string;
    ogImage?: string;
  };
  schema: SchemaMarkup[];
  contentStructure: ContentStructure;
  images: ImageSuggestion[];
  ctas: CTAPlacement[];
  internalLinks: InternalLink[];
}

/**
 * Schema markup configuration
 */
export interface SchemaMarkup {
  type: string; // e.g., "Service", "LocalBusiness", "FAQPage"
  json: string; // JSON-LD markup ready to paste
}

/**
 * Content structure with sections
 */
export interface ContentStructure {
  sections: Section[];
  totalTargetWordCount: number;
}

/**
 * Individual content section
 */
export interface Section {
  heading: string; // H1, H2, H3
  level: 1 | 2 | 3;
  purpose: string;
  targetWordCount: number;
  keywordsToInclude: string[];
  contentGuidance: string;
  images: ImageSuggestion[];
  ctas?: CTAPlacement[];
  internalLinks?: InternalLink[];
}

/**
 * Image suggestion
 */
export interface ImageSuggestion {
  position: string;
  description: string;
  altTextTemplate: string;
  imageType: 'photo' | 'diagram' | 'screenshot' | 'graphic' | 'portfolio';
}

/**
 * CTA placement
 */
export interface CTAPlacement {
  position: string;
  primaryText: string;
  secondaryText?: string;
  style: 'button' | 'link' | 'banner';
  targetUrl?: string;
}

/**
 * Internal link suggestion
 */
export interface InternalLink {
  position: string;
  anchorText: string;
  targetUrl: string;
  context: string;
}

/**
 * Phase 4: Generated Content Report
 */
export interface GeneratedContentReport {
  pages: GeneratedPageContent[];
  totalPages: number;
  totalWordCount: number;
  avgQualityScore: number;
}

/**
 * Generated page content
 */
export interface GeneratedPageContent {
  url: string;
  metadata: {
    title: string;
    description: string;
  };
  schema: string; // JSON-LD markup ready to paste
  content: {
    html: string;
    markdown: string;
    sections: GeneratedSection[];
  };
  wordCount: number;
  keywordDensity: { [keyword: string]: number };
  qualityScore: number; // 0-100
}

/**
 * Generated section
 */
export interface GeneratedSection {
  heading: string;
  content: string;
  wordCount: number;
  images: string[]; // Image placeholder markdown
  ctas: string[]; // CTA HTML
  internalLinks: string[]; // Link markdown
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  businessName: string;
  targetSite: string;
  competitorCount: number;
  generatedAt: string;
  estimatedTimeline: string;
  estimatedImpact: string;
}

/**
 * Phase section for HTML rendering
 */
export interface PhaseSection {
  id: string;
  phaseNumber: number;
  title: string;
  icon: string;
  summary: string;
  stats: PhaseStat[];
  detailsHTML: string;
  expanded?: boolean;
}

/**
 * Phase summary stat
 */
export interface PhaseStat {
  label: string;
  value: string | number;
  type?: 'success' | 'warning' | 'info' | 'neutral';
}

/**
 * Export file configuration
 */
export interface ExportFile {
  filename: string;
  content: string;
  type: 'markdown' | 'html' | 'json' | 'csv';
}

/**
 * Export package (for ZIP)
 */
export interface ExportPackage {
  files: ExportFile[];
  structure: {
    pages: ExportFile[];
    schema: ExportFile[];
    checklists: ExportFile[];
    maps: ExportFile[];
  };
}
