/**
 * Phase 4: Content Generation Types
 *
 * Comprehensive type definitions for elite content generation system.
 * These types support section-by-section generation with quality validation,
 * metadata optimization, FAQ generation, and final content assembly.
 */

import type { KeywordStat, MetadataRecommendation } from "../types";

/**
 * Tone of voice profile for consistent content generation
 */
export interface ToneOfVoiceProfile {
  style: "professional" | "friendly" | "authoritative" | "casual";
  characteristics: string[];
  examplePhrases: string[];
  avoidPhrases: string[];
}

/**
 * Structured prompt for AI content generation
 */
export interface ContentPrompt {
  sectionHeading: string;
  purpose: string;
  targetAudience: string;
  targetWordCount: number;
  toneOfVoice: ToneOfVoiceProfile["style"];
  keywords: {
    primary: string[];
    secondary: string[];
    targetDensity: number; // 1-3%
  };
  contentStructure: "paragraph" | "list" | "numbered-list" | "mixed";
  mustInclude: string[]; // facts, proofs, specific points
  mustAvoid: string[]; // clichés, overpromising
  competitorInsights?: string; // what top rankers cover
  ctaToIntegrate?: string;
  internalLinks?: Array<{ anchorText: string; url: string }>;
}

/**
 * Quality metrics for generated content section
 */
export interface SectionQualityMetrics {
  meetsWordCountTarget: boolean;
  includesRequiredKeywords: boolean;
  readabilityScore?: number;
  hasFluff: boolean; // detected generic filler phrases
  keywordDensity: { [keyword: string]: number };
  tone: "matches" | "inconsistent" | "unknown";
}

/**
 * Generated content section with validation
 */
export interface GeneratedSection {
  heading: string;
  content: string; // HTML or Markdown
  wordCount: number;
  qualityMetrics: SectionQualityMetrics;
}

/**
 * FAQ optimized for featured snippets
 */
export interface GeneratedFAQ {
  question: string;
  answer: string;
  wordCount: number;
  optimizedForSnippet: boolean;
  targetKeywords: string[];
}

/**
 * CTR-optimized metadata
 */
export interface GeneratedMetadata {
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  keywordsIncluded: string[];
  powerWordsUsed: string[];
  hasCTA: boolean;
  uniquenessScore: number; // 0-100
}

/**
 * Quality report for assembled content
 */
export interface ContentQualityReport {
  wordCountVsTarget: string; // "1,247 / 1,200 (104%)"
  keywordDensity: { [keyword: string]: string }; // "2.3%"
  readabilityGrade?: string;
  ctaCount: number;
  internalLinkCount: number;
  imageCount: number;
  schemaMarkupCount: number;
  issues: string[]; // any quality issues detected
  strengths: string[]; // what makes this content great
}

/**
 * Complete generated page content in multiple formats
 */
export interface GeneratedPageContent {
  url: string;
  slug: string;
  metadata: GeneratedMetadata;
  schema: string[]; // JSON-LD scripts
  content: {
    html: string;
    markdown: string;
    plainText: string;
  };
  sections: GeneratedSection[];
  faqs: GeneratedFAQ[];
  totalWordCount: number;
  qualityScore: number; // 0-100
  qualityReport: ContentQualityReport;
}

/**
 * Page blueprint from Phase 3 (simplified interface)
 */
export interface PageBlueprint {
  slug: string;
  url?: string;
  pageType: "homepage" | "existing" | "new" | "service" | "about" | "blog";
  metadata: MetadataRecommendation;
  primaryKeywords: KeywordStat[];
  supportingKeywords: KeywordStat[];
  pageObjective: string;
  audienceIntent: string;
  mustInclude: string[];
  sections: BlueprintSection[];
  faqs?: BlueprintFAQSection;
  internalLinks?: Array<{ anchorText: string; url: string }>;
}

/**
 * Section definition from blueprint
 */
export interface BlueprintSection {
  heading: string;
  purpose: string;
  targetKeywords: string[];
  targetWordCount: number;
  contentType: "hero" | "features" | "benefits" | "about" | "process" | "testimonials" | "cta" | "content";
  mustInclude?: string[];
}

/**
 * FAQ section definition from blueprint
 */
export interface BlueprintFAQSection {
  questions: string[];
  targetKeywords: string[];
  purpose: string;
}

/**
 * Business context for content generation
 */
export interface BusinessContext {
  businessName: string;
  businessType: string;
  location?: string;
  serviceArea?: string;
  googleBusinessProfile?: string;
  additionalNotes?: string;
}

/**
 * Competitor content insights
 */
export interface CompetitorInsights {
  topRankingContent: string[];
  commonTopics: string[];
  uniqueAngles: string[];
  averageWordCount: number;
  averageSections: number;
}

/**
 * Content generation options
 */
export interface ContentGenerationOptions {
  businessContext: BusinessContext;
  toneProfile?: ToneOfVoiceProfile;
  competitorInsights?: CompetitorInsights;
  maxRetries?: number; // retry if quality is poor
  enforceQuality?: boolean; // throw error if quality threshold not met
  includeImagePlaceholders?: boolean;
  brandName?: string;
  brandSeparator?: string; // for title tags, e.g. " | " or " - "
}

/**
 * Content validation result
 */
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  score: number; // 0-100
}

/**
 * Power words for metadata optimization
 */
export const POWER_WORDS = {
  urgency: ["Now", "Today", "Limited", "Fast", "Quick", "Instant", "Immediate"],
  value: ["Free", "Save", "Discount", "Deal", "Bonus", "Extra", "Plus"],
  authority: ["Expert", "Professional", "Certified", "Award-winning", "Top", "Best", "Leading"],
  quality: ["Premium", "Elite", "Superior", "Exceptional", "Outstanding", "Excellence"],
  results: ["Proven", "Guaranteed", "Results", "Success", "Effective", "Powerful"],
  curiosity: ["Secret", "Revealed", "Guide", "Tips", "Tricks", "Hacks", "Insider"],
  numbers: ["Top 10", "Best 5", "7 Ways", "Complete", "Ultimate", "Essential"],
} as const;

/**
 * Filler phrases to detect (indicates low-quality content)
 */
export const FILLER_PHRASES = [
  "in today's world",
  "it goes without saying",
  "needless to say",
  "at the end of the day",
  "when all is said and done",
  "in this day and age",
  "each and every",
  "first and foremost",
  "last but not least",
  "the fact of the matter is",
  "for all intents and purposes",
  "all things considered",
  "as a matter of fact",
  "in point of fact",
  "in the final analysis",
];

/**
 * Quality thresholds
 */
export const QUALITY_THRESHOLDS = {
  minWordCount: 300,
  maxWordCount: 3000,
  minReadabilityScore: 40, // Flesch reading ease
  maxReadabilityScore: 80,
  minKeywordDensity: 0.5, // %
  maxKeywordDensity: 3.5, // %
  minQualityScore: 70, // overall
  titleMinLength: 50,
  titleMaxLength: 60,
  descriptionMinLength: 150,
  descriptionMaxLength: 160,
} as const;
