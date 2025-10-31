import type { KeywordStat } from "./types";
import type { KeywordDatasetEntry } from "./keyword-dataset";
import { callMozApi, MozApiError, mozRequestAvailable } from "./moz-client";
import { getDomain } from "./url";
import {
  MOZ_MAX_SEEDS,
  MOZ_SUGGESTION_LIMIT,
  MOZ_METRIC_LIMIT,
  MOZ_COMPETITOR_LIMIT,
  MOZ_MAX_COMPETITORS,
  MOZ_BATCH_SIZE,
} from "./constants";

interface FetchMozKeywordInsightsArgs {
  businessType: string;
  additionalNotes?: string;
  serviceArea?: string;
  location?: string;
  competitors: string[];
  siteKeywords: KeywordStat[];
}

interface MozKeywordInsights {
  datasetEntries: KeywordDatasetEntry[];
  competitorKeywords: KeywordStat[];
  notes: string[];
}

interface MozKeywordMetrics {
  volume: number | null;
  difficulty: number | null;
  organic_ctr?: number | null;
  priority?: number | null;
}

interface KeywordSuggestion {
  keyword: string;
  relevance?: number;
}

interface RankingKeywordItem {
  keyword: string;
  ranking_page?: string;
  rank_position?: number;
  difficulty?: number;
  volume?: number;
}

const MAX_SEEDS = MOZ_MAX_SEEDS;
const SUGGESTION_LIMIT = MOZ_SUGGESTION_LIMIT;
const METRIC_LIMIT = MOZ_METRIC_LIMIT;
const COMPETITOR_LIMIT = MOZ_COMPETITOR_LIMIT;
const MAX_COMPETITORS = MOZ_MAX_COMPETITORS;

const NAVIGATION_KEYWORDS = new Set([
  "home",
  "portfolio",
  "feed",
  "blog",
  "contact",
  "login",
  "cart",
  "terms",
  "privacy policy",
  "terms and conditions",
]);

const NAVIGATION_TOKENS = new Set([
  "home",
  "portfolio",
  "feed",
  "blog",
  "contact",
  "dash",
  "free",
  "login",
  "cart",
  "account",
  "privacy",
  "policy",
  "terms",
  "conditions",
]);

export async function fetchMozKeywordInsights(
  args: FetchMozKeywordInsightsArgs
): Promise<MozKeywordInsights | null> {
  if (!mozRequestAvailable()) {
    return null;
  }

  const notes: string[] = [];
  const localeContext = determineLocale(args.serviceArea, args.location);
  const seeds = buildSeedKeywords(args, localeContext.primaryLocation).slice(
    0,
    MAX_SEEDS
  );

  if (!seeds.length) {
    seeds.push(args.businessType.trim().toLowerCase());
  }

  const suggestionMap = new Map<string, KeywordSuggestion>();
  const metricsCandidates = new Map<string, { reason: string }>();

  for (const seed of seeds) {
    addKeywordCandidate(metricsCandidates, seed, "seed");
    try {
      const result = await callMozApi<{
        suggestions: KeywordSuggestion[];
      }>("data.keyword.suggestions.list", {
        data: {
          serp_query: {
            keyword: seed,
            locale: localeContext.locale,
            device: "desktop",
            engine: "google",
            vicinity: localeContext.vicinity ?? "",
          },
          options: {
            strategy: "default",
          },
          page: {
            limit: SUGGESTION_LIMIT,
          },
        },
      });
      result.suggestions.forEach((suggestion) => {
        if (isNavigationKeyword(suggestion.keyword)) return;
        if (!suggestion.keyword.trim()) return;
        suggestionMap.set(suggestion.keyword.toLowerCase(), suggestion);
        addKeywordCandidate(metricsCandidates, suggestion.keyword, "suggestion");
      });
    } catch (error) {
      notes.push(
        `Moz suggestions unavailable for seed "${seed}": ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
    }
  }

  const competitorKeywords: KeywordStat[] = [];
  const competitorSet = new Set<string>();
  for (const competitorUrl of args.competitors.slice(0, MAX_COMPETITORS)) {
    const domain = getDomain(competitorUrl);
    if (!domain || competitorSet.has(domain)) continue;
    competitorSet.add(domain);
    try {
      const result = await callMozApi<{
        ranking_keywords: RankingKeywordItem[];
      }>("data.site.ranking-keywords.list", {
        data: {
          target_query: {
            query: `https://${domain}`,
            scope: "domain",
            locale: localeContext.competitorLocale,
          },
          options: {
            sort: "rank",
          },
          page: {
            limit: COMPETITOR_LIMIT,
          },
        },
      });

      result.ranking_keywords.forEach((item) => {
        if (!item.keyword || isNavigationKeyword(item.keyword)) return;
        addKeywordCandidate(metricsCandidates, item.keyword, "competitor");
        const stat = rankingKeywordToStat(item);
        competitorKeywords.push(stat);
      });
    } catch (error) {
      if (error instanceof MozApiError && error.status === 404) {
        notes.push(
          `Moz has no ranking keyword data for competitor ${domain}.`
        );
      } else {
        notes.push(
          `Failed to load Moz ranking keywords for ${domain}: ${
            error instanceof Error ? error.message : "unknown error"
          }`
        );
      }
    }
  }

  const uniqueKeywords = Array.from(metricsCandidates.keys()).slice(
    0,
    METRIC_LIMIT
  );
  const metricsMap = new Map<string, MozKeywordMetrics>();

  // Batch API calls for better performance
  const BATCH_SIZE = MOZ_BATCH_SIZE;
  for (let i = 0; i < uniqueKeywords.length; i += BATCH_SIZE) {
    const batch = uniqueKeywords.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (keyword) => {
        const result = await callMozApi<{
          keyword_metrics: MozKeywordMetrics;
        }>("data.keyword.metrics.fetch", {
          data: {
            serp_query: {
              keyword,
              locale: localeContext.locale,
              device: "desktop",
              engine: "google",
              vicinity: localeContext.vicinity ?? "",
            },
          },
        });
        return { keyword, metrics: result.keyword_metrics };
      })
    );

    results.forEach((result, index) => {
      const keyword = batch[index];
      if (result.status === "fulfilled") {
        metricsMap.set(keyword.toLowerCase(), result.value.metrics);
      } else {
        const error = result.reason;
        if (error instanceof MozApiError && error.status === 404) {
          notes.push(`Moz has no metrics for "${keyword}".`);
        } else {
          notes.push(
            `Failed to load Moz metrics for "${keyword}": ${
              error instanceof Error ? error.message : "unknown error"
            }`
          );
        }
      }
    });
  }

  const datasetEntries: KeywordDatasetEntry[] = [];
  for (const keyword of uniqueKeywords) {
    const normalised = keyword.toLowerCase();
    if (isNavigationKeyword(normalised)) continue;
    const metrics = metricsMap.get(normalised);
    if (!metrics) continue;
    datasetEntries.push({
      keyword,
      volume: metrics.volume ?? 0,
      difficulty: metrics.difficulty ?? 0,
      intent: inferIntentFromKeyword(keyword) ?? "informational",
    });
  }

  // Ensure seeds appear even if metrics missing by appending with defaults
  seeds.forEach((seed) => {
    if (datasetEntries.some((entry) => entry.keyword.toLowerCase() === seed)) {
      return;
    }
    datasetEntries.push({
      keyword: seed,
      volume: 0,
      difficulty: 30,
      intent: inferIntentFromKeyword(seed) ?? "informational",
    });
  });

  // Generate local keyword variants for keywords that don't already contain location
  if (localeContext.primaryLocation) {
    const locationTerm = localeContext.primaryLocation.toLowerCase();
    const localVariants = new Set<string>();

    // For each keyword without location, create a local variant
    datasetEntries.forEach((entry) => {
      const keywordLower = entry.keyword.toLowerCase();
      // Skip if already contains location term
      if (keywordLower.includes(locationTerm)) return;
      // Skip navigation keywords
      if (isNavigationKeyword(keywordLower)) return;
      // Skip very long keywords (likely already specific)
      if (entry.keyword.split(" ").length > 4) return;

      // Create local variant
      const localVariant = `${entry.keyword.toLowerCase()} ${locationTerm}`;
      localVariants.add(localVariant);
    });

    // Fetch metrics for local variants in batches
    if (localVariants.size > 0) {
      const localVariantArray = Array.from(localVariants).slice(0, METRIC_LIMIT);
      const localMetricsMap = new Map<string, MozKeywordMetrics>();

      for (let i = 0; i < localVariantArray.length; i += MOZ_BATCH_SIZE) {
        const batch = localVariantArray.slice(i, i + MOZ_BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (keyword) => {
            const result = await callMozApi<{
              keyword_metrics: MozKeywordMetrics;
            }>("data.keyword.metrics.fetch", {
              data: {
                serp_query: {
                  keyword,
                  locale: localeContext.locale,
                  device: "desktop",
                  engine: "google",
                  vicinity: localeContext.vicinity ?? "",
                },
              },
            });
            return { keyword, metrics: result.keyword_metrics };
          })
        );

        results.forEach((result, index) => {
          const keyword = batch[index];
          if (result.status === "fulfilled") {
            localMetricsMap.set(keyword.toLowerCase(), result.value.metrics);
          }
        });
      }

      // Add local variants with metrics to dataset
      localVariantArray.forEach((localKeyword) => {
        const metrics = localMetricsMap.get(localKeyword);
        if (metrics && metrics.volume && metrics.volume > 0) {
          datasetEntries.push({
            keyword: localKeyword,
            volume: metrics.volume ?? 0,
            difficulty: metrics.difficulty ?? 0,
            intent: inferIntentFromKeyword(localKeyword) ?? "informational",
          });
        }
      });

      notes.push(
        `Generated ${localMetricsMap.size} local keyword variants for "${localeContext.primaryLocation}"`
      );
    }
  }

  return {
    datasetEntries: dedupeDatasetEntries(datasetEntries),
    competitorKeywords: dedupeKeywordStats(competitorKeywords),
    notes,
  };
}

function determineLocale(serviceArea?: string, location?: string) {
  const combined = `${serviceArea ?? ""} ${location ?? ""}`.toLowerCase();
  if (
    /\b(scotland|uk|united kingdom|england|wales|northern ireland|edinburgh)\b/.test(
      combined
    )
  ) {
    return {
      locale: "en-GB",
      competitorLocale: "en-GB",
      vicinity: location ?? serviceArea ?? "",
      primaryLocation: location ?? serviceArea ?? "",
    };
  }
  if (/\b(australia|sydney|melbourne|brisbane)\b/.test(combined)) {
    return {
      locale: "en-AU",
      competitorLocale: "en-AU",
      vicinity: location ?? serviceArea ?? "",
      primaryLocation: location ?? serviceArea ?? "",
    };
  }
  if (/\b(canada|toronto|vancouver|montreal)\b/.test(combined)) {
    return {
      locale: "en-CA",
      competitorLocale: "en-CA",
      vicinity: location ?? serviceArea ?? "",
      primaryLocation: location ?? serviceArea ?? "",
    };
  }

  return {
    locale: "en-US",
    competitorLocale: "en-US",
    vicinity: location ?? serviceArea ?? "",
    primaryLocation: location ?? serviceArea ?? "",
  };
}

function buildSeedKeywords(
  args: FetchMozKeywordInsightsArgs,
  primaryLocation?: string | null
): string[] {
  const seeds = new Set<string>();
  const basePhrases = extractPhrases(args.businessType)
    .concat(extractPhrases(args.additionalNotes ?? ""))
    .concat(
      args.siteKeywords
        .slice(0, 5)
        .map((stat) => stat.keyword.toLowerCase().trim())
    );

  basePhrases.forEach((phrase) => {
    if (!phrase) return;
    seeds.add(phrase);
    if (primaryLocation) {
      seeds.add(`${phrase} ${primaryLocation.toLowerCase()}`.trim());
    }
    if (args.serviceArea && args.serviceArea !== primaryLocation) {
      seeds.add(`${phrase} ${args.serviceArea.toLowerCase()}`.trim());
    }
  });

  return Array.from(seeds)
    .map((seed) => seed.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractPhrases(value: string): string[] {
  return value
    .split(/[,/&]| and |\+|\|/i)
    .map((segment) =>
      segment
        .replace(/[^a-z0-9\s-]/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
    )
    .filter((segment) => segment.length >= 3);
}

function isNavigationKeyword(keyword: string): boolean {
  const normalised = keyword.trim().toLowerCase();
  if (!normalised) return true;
  if (NAVIGATION_KEYWORDS.has(normalised)) return true;
  const tokens = normalised.split(/\s+/);
  return tokens.every((token) => NAVIGATION_TOKENS.has(token));
}

function addKeywordCandidate(
  map: Map<string, { reason: string }>,
  keyword: string,
  reason: string
) {
  const normalised = keyword.trim().toLowerCase();
  if (!normalised) return;
  if (isNavigationKeyword(normalised)) return;
  if (!map.has(normalised)) {
    map.set(normalised, { reason });
  }
}

function rankingKeywordToStat(item: RankingKeywordItem): KeywordStat {
  const score = computeRankingScore(item.volume, item.rank_position);
  return {
    keyword: item.keyword,
    score,
    density: 0,
    volume: item.volume ?? undefined,
    difficulty: item.difficulty ?? undefined,
    intent: inferIntentFromKeyword(item.keyword) ?? "informational",
    source: "competitor",
  };
}

function computeRankingScore(
  volume?: number,
  rankPosition?: number
): number {
  const volumeScore = volume ? Math.log10(volume + 1) * 10 : 1;
  const rankScore = rankPosition ? Math.max(0, 50 - rankPosition) : 0;
  return Math.round((volumeScore + rankScore + Number.EPSILON) * 10) / 10;
}

function inferIntentFromKeyword(keyword: string): KeywordStat["intent"] {
  const lower = keyword.toLowerCase();

  if (
    /(near me|service|agency|firm|consultant|provider|hire|quote|proposal|studio)/.test(
      lower
    )
  ) {
    return "transactional";
  }

  if (
    /(pricing|cost|rates|fees|best|top|vs|comparison|alternatives)/.test(lower)
  ) {
    return "commercial";
  }

  if (
    /(how|what|why|guide|tips|ideas|examples|trends|inspiration)/.test(lower)
  ) {
    return "informational";
  }

  if (/(case study|portfolio|\.co|\.com|brand)/.test(lower)) {
    return "navigational";
  }

  return "commercial";
}

function dedupeDatasetEntries(entries: KeywordDatasetEntry[]) {
  const seen = new Set<string>();
  const result: KeywordDatasetEntry[] = [];
  for (const entry of entries) {
    const normalised = entry.keyword.toLowerCase();
    if (seen.has(normalised)) continue;
    seen.add(normalised);
    result.push(entry);
  }
  return result;
}

function dedupeKeywordStats(stats: KeywordStat[]) {
  const seen = new Map<string, KeywordStat>();
  stats.forEach((stat) => {
    const key = stat.keyword.toLowerCase();
    if (!seen.has(key) || stat.score > (seen.get(key)?.score ?? 0)) {
      seen.set(key, stat);
    }
  });
  return Array.from(seen.values());
}
