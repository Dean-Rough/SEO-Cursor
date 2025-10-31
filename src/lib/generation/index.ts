/**
 * Phase 4: Content Generation - Main Exports
 *
 * Elite content generation system for SEO Wizard.
 * Exports all generation modules and the main orchestrator.
 */

// Type exports
export type {
  ContentPrompt,
  ToneOfVoiceProfile,
  GeneratedSection,
  GeneratedFAQ,
  GeneratedMetadata,
  GeneratedPageContent,
  PageBlueprint,
  BlueprintSection,
  BlueprintFAQSection,
  BusinessContext,
  CompetitorInsights,
  ContentGenerationOptions,
  ValidationResult,
  SectionQualityMetrics,
  ContentQualityReport,
} from "./types";

export { POWER_WORDS, FILLER_PHRASES, QUALITY_THRESHOLDS } from "./types";

// Prompt builder exports
export {
  extractToneOfVoice,
  buildSectionPrompt,
  buildAIPromptString,
  buildFAQPrompt,
  buildMetadataPrompt,
} from "./prompt-builder";

// Section generator exports
export {
  generateSectionContent,
  validateSectionQuality,
  generateMultipleSections,
} from "./section-generator";

// FAQ generator exports
export {
  generateFAQSection,
  generateFAQSchema,
  generateCommonFAQs,
  formatFAQsAsHTML,
  formatFAQsAsMarkdown,
} from "./faq-generator";

// Metadata generator exports
export {
  generateMetadata,
  validateMetadata,
  generateMetadataVariations,
  formatMetadataAsHTML,
  suggestPowerWords,
} from "./metadata-generator";

// Content assembler exports
export {
  assemblePageContent,
  formatAsHTML,
  formatAsMarkdown,
  calculateQualityScore,
  exportPageContent,
} from "./content-assembler";

// Main orchestrator export
export { generateCompletePageContent } from "./orchestrator";
