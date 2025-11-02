/**
 * Free Keyword Research Aggregator
 *
 * Combines multiple free data sources to create comprehensive keyword research:
 * - Google Autocomplete
 * - People Also Ask (PAA)
 * - Related Searches
 * - Google Trends
 * - Claude AI expansion
 * - (Optional) Google Search Console data
 *
 * This replaces expensive Moz API calls with "good enough" free alternatives.
 */

import { getAutocompleteSuggestions, expandKeywordWithModifiers } from './google-autocomplete';
import { getPeopleAlsoAsk, getRelatedSearches } from './google-paa';
import { getTrendingSearches } from './google-trends';
import {
  expandKeywordsWithClaude,
  generateKeywordSuggestions,
  validateKeywordRelevance,
} from './claude-keyword-expansion';
import type { KeywordStat } from './types';

export interface FreeKeywordResearchParams {
  seedKeywords: string[];
  businessType: string;
  location?: string;
  useClaudeExpansion?: boolean;
  maxKeywords?: number;
}

export interface KeywordSource {
  source: 'autocomplete' | 'paa' | 'related' | 'trending' | 'claude' | 'gsc';
  keyword: string;
  score: number; // Confidence/relevance score (0-100)
}

/**
 * Main function: Perform comprehensive keyword research using free sources
 *
 * @param params - Research parameters
 * @returns Aggregated and prioritized keyword list
 */
export async function performFreeKeywordResearch(
  params: FreeKeywordResearchParams
): Promise<KeywordStat[]> {
  const {
    seedKeywords,
    businessType,
    location,
    useClaudeExpansion = true,
    maxKeywords = 100,
  } = params;

  console.log(
    `[free-keywords] Starting research for ${seedKeywords.length} seed keywords: ${seedKeywords.join(', ')}`
  );

  const allKeywordSources: KeywordSource[] = [];

  // 1. Google Autocomplete - Fast and free
  console.log('[free-keywords] Fetching Google Autocomplete suggestions...');
  for (const seed of seedKeywords.slice(0, 5)) {
    // Limit to 5 seeds to avoid rate limits
    const suggestions = await getAutocompleteSuggestions(seed);
    suggestions.forEach((suggestion) => {
      allKeywordSources.push({
        source: 'autocomplete',
        keyword: suggestion.query,
        score: 70 - suggestion.relevance * 5, // Higher relevance = higher score
      });
    });

    // Small delay to avoid rate limiting
    await delay(300);
  }

  // 2. People Also Ask - Great for question-based keywords
  console.log('[free-keywords] Scraping People Also Ask questions...');
  for (const seed of seedKeywords.slice(0, 3)) {
    // Limit to 3 to avoid rate limits
    const questions = await getPeopleAlsoAsk(seed);
    questions.forEach((q) => {
      allKeywordSources.push({
        source: 'paa',
        keyword: q.question,
        score: 75, // PAA questions are high-value
      });
    });

    await delay(1000); // Longer delay for scraping
  }

  // 3. Related Searches
  console.log('[free-keywords] Fetching Related Searches...');
  for (const seed of seedKeywords.slice(0, 3)) {
    const related = await getRelatedSearches(seed);
    related.forEach((keyword) => {
      allKeywordSources.push({
        source: 'related',
        keyword,
        score: 65,
      });
    });

    await delay(1000);
  }

  // 4. Google Trends - Trending keywords
  console.log('[free-keywords] Checking Google Trends...');
  if (location) {
    const trending = await getTrendingSearches(location.toUpperCase().slice(0, 2));
    trending.slice(0, 10).forEach((trend) => {
      allKeywordSources.push({
        source: 'trending',
        keyword: trend.keyword,
        score: trend.relativeInterest,
      });
    });
  }

  // 5. Claude AI Expansion - The secret weapon
  if (useClaudeExpansion) {
    console.log('[free-keywords] Using Claude for semantic expansion...');

    // Prepare data for Claude
    const autocompleteData = allKeywordSources
      .filter((k) => k.source === 'autocomplete')
      .map((k) => k.keyword);

    const paaQuestions = allKeywordSources
      .filter((k) => k.source === 'paa')
      .map((k) => k.keyword);

    const relatedSearches = allKeywordSources
      .filter((k) => k.source === 'related')
      .map((k) => k.keyword);

    // Get Claude's suggestions
    const claudeSuggestions = await generateKeywordSuggestions({
      seedKeywords,
      autocompleteData,
      paaQuestions,
      relatedSearches,
      businessContext: businessType,
      location,
    });

    claudeSuggestions.forEach((keyword) => {
      allKeywordSources.push({
        source: 'claude',
        keyword,
        score: 80, // Claude suggestions are high-quality
      });
    });
  }

  // Deduplicate and aggregate scores
  console.log('[free-keywords] Deduplicating and scoring...');
  const keywordMap = new Map<string, { sources: Set<string>; totalScore: number }>();

  allKeywordSources.forEach((source) => {
    const normalized = source.keyword.toLowerCase().trim();

    if (!keywordMap.has(normalized)) {
      keywordMap.set(normalized, {
        sources: new Set([source.source]),
        totalScore: source.score,
      });
    } else {
      const existing = keywordMap.get(normalized)!;
      existing.sources.add(source.source);
      // Boost score for multi-source keywords
      existing.totalScore += source.score * 0.5;
    }
  });

  // Convert to KeywordStat format
  const keywords: KeywordStat[] = Array.from(keywordMap.entries())
    .map(([keyword, data]) => ({
      keyword,
      score: Math.min(100, data.totalScore / data.sources.size), // Normalize score
      density: 0, // Not applicable for external keywords
      volume: undefined, // We don't have volume data (and that's okay!)
      difficulty: undefined, // We don't have difficulty data
      intent: inferIntent(keyword),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords);

  console.log(`[free-keywords] Research complete. Found ${keywords.length} keywords.`);

  // Optional: Validate with Claude
  if (useClaudeExpansion && keywords.length > 0) {
    console.log('[free-keywords] Validating keyword relevance with Claude...');
    const keywordList = keywords.map((k) => k.keyword);
    const validated = await validateKeywordRelevance(keywordList, businessType);

    return keywords.filter((k) => validated.includes(k.keyword));
  }

  return keywords;
}

/**
 * Infer user intent from keyword pattern
 */
function inferIntent(keyword: string): 'informational' | 'commercial' | 'transactional' | 'navigational' {
  const lower = keyword.toLowerCase();

  // Transactional
  if (
    /\b(buy|purchase|order|book|reserve|hire|get quote|price|cost|cheap|discount)\b/i.test(lower)
  ) {
    return 'transactional';
  }

  // Commercial
  if (
    /\b(best|top|review|compare|vs|versus|alternative|recommendation)\b/i.test(lower)
  ) {
    return 'commercial';
  }

  // Navigational
  if (/\b(login|sign in|contact|about|location|hours|phone)\b/i.test(lower)) {
    return 'navigational';
  }

  // Default to informational
  return 'informational';
}

/**
 * Simple delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get keyword expansion for a single seed (quick version)
 */
export async function quickKeywordExpansion(
  seed: string,
  businessType: string
): Promise<string[]> {
  const keywords = await performFreeKeywordResearch({
    seedKeywords: [seed],
    businessType,
    useClaudeExpansion: true,
    maxKeywords: 50,
  });

  return keywords.map((k) => k.keyword);
}

/**
 * Cost comparison: Free vs. Moz
 */
export const COST_COMPARISON = {
  moz: {
    rowsPerGeneration: 400, // Average from our tracking
    costPerRow: 0.0025, // Estimated
    costPerGeneration: 1.0,
    monthlyGenerations: 100,
    monthlyCost: 100,
  },
  free: {
    apiCalls: 20, // Google autocomplete, PAA, etc.
    claudeCalls: 3,
    costPerClaudeCall: 0.01, // GPT-4 Turbo
    costPerGeneration: 0.03,
    monthlyGenerations: 100,
    monthlyCost: 3,
  },
  savings: {
    perGeneration: 0.97,
    monthly: 97,
    annual: 1164,
  },
};

export default {
  performFreeKeywordResearch,
  quickKeywordExpansion,
  COST_COMPARISON,
};
