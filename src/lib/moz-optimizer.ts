/**
 * Moz API Usage Optimizer
 *
 * Smart strategies to reduce credit consumption while maintaining quality:
 * - Intelligent keyword prioritization
 * - Duplicate elimination across sources
 * - Score-based filtering
 * - Batch deduplication
 */

import type { KeywordStat } from "./types";

export interface OptimizationStrategy {
  maxSeeds: number;
  maxSuggestions: number;
  maxMetrics: number;
  maxCompetitorKeywords: number;
  enableLocalVariants: boolean;
  volumeThreshold: number;  // Skip keywords below this volume
  scoreThreshold: number;   // Skip keywords below this score
}

/**
 * Conservative strategy - Lowest credit usage
 * Best for: High-volume usage, tight budgets
 * Estimated: ~150-400 rows per generation
 */
export const CONSERVATIVE: OptimizationStrategy = {
  maxSeeds: 3,
  maxSuggestions: 5,
  maxMetrics: 25,
  maxCompetitorKeywords: 5,
  enableLocalVariants: false,
  volumeThreshold: 50,
  scoreThreshold: 5,
};

/**
 * Balanced strategy - Good quality-to-cost ratio
 * Best for: Most use cases
 * Estimated: ~200-600 rows per generation
 */
export const BALANCED: OptimizationStrategy = {
  maxSeeds: 4,
  maxSuggestions: 10,
  maxMetrics: 40,
  maxCompetitorKeywords: 10,
  enableLocalVariants: true,
  volumeThreshold: 10,
  scoreThreshold: 3,
};

/**
 * Comprehensive strategy - Maximum keyword coverage
 * Best for: High-value clients, unlimited budgets
 * Estimated: ~500-1500 rows per generation
 */
export const COMPREHENSIVE: OptimizationStrategy = {
  maxSeeds: 8,
  maxSuggestions: 30,
  maxMetrics: 100,
  maxCompetitorKeywords: 25,
  enableLocalVariants: true,
  volumeThreshold: 0,
  scoreThreshold: 0,
};

/**
 * Get current optimization strategy from environment
 */
export function getOptimizationStrategy(): OptimizationStrategy {
  const strategyName = process.env.MOZ_OPTIMIZATION_STRATEGY?.toUpperCase();

  switch (strategyName) {
    case "CONSERVATIVE":
      return CONSERVATIVE;
    case "COMPREHENSIVE":
      return COMPREHENSIVE;
    case "BALANCED":
    default:
      return BALANCED;
  }
}

/**
 * Deduplicate keywords across multiple sources
 * Keeps highest scoring keyword when duplicates found
 */
export function deduplicateKeywords(keywords: KeywordStat[]): KeywordStat[] {
  const map = new Map<string, KeywordStat>();

  keywords.forEach((kw) => {
    const key = kw.keyword.toLowerCase().trim();
    const existing = map.get(key);

    if (!existing || kw.score > existing.score) {
      map.set(key, kw);
    }
  });

  return Array.from(map.values());
}

/**
 * Prioritize keywords by quality score
 * Combines volume, difficulty, and source into single score
 */
export function prioritizeKeywords(
  keywords: KeywordStat[],
  strategy: OptimizationStrategy
): KeywordStat[] {
  return keywords
    .filter((kw) => {
      // Apply volume threshold
      if (kw.volume !== undefined && kw.volume < strategy.volumeThreshold) {
        return false;
      }
      // Apply score threshold
      if (kw.score < strategy.scoreThreshold) {
        return false;
      }
      return true;
    })
    .map((kw) => ({
      ...kw,
      // Enhanced priority score
      score: calculatePriorityScore(kw),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate priority score for keyword
 * Higher score = more valuable keyword
 */
function calculatePriorityScore(kw: KeywordStat): number {
  let score = kw.score;

  // Boost by search volume (logarithmic scale)
  if (kw.volume && kw.volume > 0) {
    score += Math.log10(kw.volume + 1) * 2;
  }

  // Penalize high difficulty
  if (kw.difficulty && kw.difficulty > 50) {
    score -= (kw.difficulty - 50) * 0.2;
  }

  // Boost transactional/commercial intent
  if (kw.intent === "transactional") {
    score += 5;
  } else if (kw.intent === "commercial") {
    score += 3;
  }

  // Boost competitor keywords (proven valuable)
  if (kw.source === "competitor") {
    score += 2;
  }

  return Math.max(0, score);
}

/**
 * Smart seed keyword selection
 * Picks most diverse and relevant seeds
 */
export function selectOptimalSeeds(
  candidates: string[],
  maxSeeds: number
): string[] {
  // Remove duplicates and normalize
  const unique = Array.from(
    new Set(
      candidates.map((c) => c.toLowerCase().trim()).filter(Boolean)
    )
  );

  if (unique.length <= maxSeeds) {
    return unique;
  }

  // Prioritize by token diversity and length
  const scored = unique.map((seed) => ({
    seed,
    score: calculateSeedScore(seed),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSeeds)
    .map((s) => s.seed);
}

/**
 * Score seed keywords by quality
 */
function calculateSeedScore(seed: string): number {
  const tokens = seed.split(/\s+/);
  let score = 0;

  // Prefer 2-4 word phrases (better targeting)
  if (tokens.length >= 2 && tokens.length <= 4) {
    score += 5;
  }

  // Prefer specific terms over generic
  if (tokens.length >= 3) {
    score += 2;
  }

  // Penalize very long phrases (too specific)
  if (tokens.length > 5) {
    score -= 3;
  }

  // Penalize very short phrases (too generic)
  if (tokens.length === 1) {
    score -= 2;
  }

  return score;
}

/**
 * Estimate credit usage for given configuration
 */
export function estimateCreditUsage(
  strategy: OptimizationStrategy,
  competitorCount: number
): {
  min: number;
  max: number;
  breakdown: Record<string, { min: number; max: number }>;
} {
  const breakdown = {
    suggestions: {
      min: strategy.maxSeeds * 20,
      max: strategy.maxSeeds * 50,
    },
    metrics: {
      min: strategy.maxMetrics * 1,
      max: strategy.maxMetrics * 5,
    },
    competitors: {
      min: competitorCount * 10,
      max: competitorCount * 30,
    },
    localVariants: strategy.enableLocalVariants
      ? { min: 10, max: 100 }
      : { min: 0, max: 0 },
  };

  const min = Object.values(breakdown).reduce((sum, b) => sum + b.min, 0);
  const max = Object.values(breakdown).reduce((sum, b) => sum + b.max, 0);

  return { min, max, breakdown };
}

/**
 * Get usage optimization recommendations
 */
export function getUsageRecommendations(
  currentUsage: number,
  monthlyLimit: number
): string[] {
  const usagePercent = (currentUsage / monthlyLimit) * 100;
  const recommendations: string[] = [];

  if (usagePercent > 80) {
    recommendations.push(
      "⚠️ High usage detected. Switch to CONSERVATIVE strategy to reduce costs."
    );
    recommendations.push(
      "Consider reducing competitor count from 5 to 2-3."
    );
    recommendations.push(
      "Enable AI sense-check to filter keywords before fetching metrics."
    );
  } else if (usagePercent > 50) {
    recommendations.push(
      "Usage is moderate. Consider BALANCED strategy for cost efficiency."
    );
  } else {
    recommendations.push(
      "✅ Usage is healthy. You can use COMPREHENSIVE strategy if needed."
    );
  }

  return recommendations;
}
