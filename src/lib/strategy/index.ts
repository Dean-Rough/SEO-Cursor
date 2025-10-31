/**
 * Phase 2: Strategic Planning Module
 *
 * This module transforms raw intelligence data into actionable SEO strategy.
 * It provides keyword clustering, page-to-keyword mapping, competitor gap analysis,
 * content targets, and internal linking blueprints.
 *
 * @module strategy
 */

// Types
export type {
  KeywordCluster,
  PageKeywordMapping,
  PageGap,
  ContentTarget,
  InternalLink,
  InternalLinkingBlueprint,
  PageStrategy,
  StrategyReport,
  ContentDepthMetrics,
  CompetitorPageInventory,
} from "./types";

// Keyword Clustering
export {
  clusterKeywords,
  generateClusterName,
  findRelatedClusters,
  consolidateClusters,
} from "./keyword-clustering";

// Keyword-to-Page Mapping
export {
  mapKeywordsToPages,
  detectKeywordCannibalization,
  resolveKeywordCannibalization,
  suggestAlternativeKeywords,
} from "./keyword-mapping";

// Page Gap Analysis
export {
  identifyPageGaps,
  prioritizeGaps,
  groupGapsByCategory,
  estimateImplementationTimeline,
} from "./page-gap-analysis";

// Content Targets
export {
  calculateContentTargets,
  calculateContentTargetsFromIndustryBenchmarks,
  validateContentTargets,
  generateContentOutline,
  estimateContentCreationTime,
} from "./content-targets";

// Internal Linking
export {
  buildLinkingBlueprint,
  identifyHubPages,
  validateLinkingBlueprint,
  suggestAdditionalLinks,
  generateAnchorTextVariations,
  calculateLinkingMetrics,
} from "./internal-linking";
