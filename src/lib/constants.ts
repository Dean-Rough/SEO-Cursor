/**
 * Constants used throughout the SEO Wizard application
 */

// Crawler Configuration
export const MAX_INTERNAL_PAGES = 15;
export const DEFAULT_CRAWL_DELAY_MS = 250;
export const REQUEST_TIMEOUT_MS = 15000;

// Keyword Analysis
export const MAX_KEYWORDS_PER_PAGE = 20;
export const BIGRAM_WEIGHT = 1.4;

// Moz API Configuration
export const MOZ_MAX_SEEDS = 4;
export const MOZ_SUGGESTION_LIMIT = 10;
export const MOZ_METRIC_LIMIT = 40;
export const MOZ_COMPETITOR_LIMIT = 10;
export const MOZ_MAX_COMPETITORS = 3;
export const MOZ_BATCH_SIZE = 10;

// Form Validation
export const MAX_COMPETITORS_IN_FORM = 5;

// UI Configuration
export const COPY_FEEDBACK_TIMEOUT_MS = 1600;
export const PROGRESS_MESSAGE_INTERVAL_MS = 2200;

// Storage Keys
export const STORAGE_KEY_REPORT = "seoWizard:report";
export const STORAGE_KEY_FORM = "seoWizard:form";

// Typography Scale (semantic sizes)
export const TEXT_STYLES = {
  label: "text-xs font-semibold uppercase tracking-[0.2em]",
  caption: "text-xs",
  body: "text-sm",
  bodyLarge: "text-base",
} as const;
