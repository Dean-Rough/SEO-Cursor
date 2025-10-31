/**
 * Intelligence gathering module for SEO Wizard
 *
 * This module provides enhanced data collection capabilities for deep analysis
 * of target sites and competitors. It extends the base crawling and analysis
 * functionality with additional intelligence about page types, CTAs, schema markup,
 * content depth, images, and competitive page inventory.
 *
 * @module intelligence
 */

// Type definitions
export type {
  EnhancedPageAnalysis,
  ExtractedCTA,
  ContentDepthMetrics,
  ImageAuditResult,
  CompetitorPageInventory,
  CategorizedPage,
  CommonPagePattern,
  IntelligenceReport,
} from './types';

// Site crawler functions
export {
  analyzePageEnhanced,
  detectPageType,
  extractCTAs,
  extractSchemaTypes,
} from './site-crawler';

// Competitor analysis functions
export {
  analyzeContentDepth,
  aggregateCompetitorMetrics,
  compareToCompetitors,
  findBestPerformingCompetitor,
} from './competitor-analysis';

// Image audit functions
export {
  auditImages,
  analyzePageImages,
  auditImagesDetailed,
  generateImageRecommendations,
} from './image-audit';

// Competitor page inventory functions
export {
  buildPageInventory,
  categorizePageByUrl,
  identifyContentGaps,
  generatePageRecommendations,
  analyzeUrlStructures,
} from './competitor-pages';
