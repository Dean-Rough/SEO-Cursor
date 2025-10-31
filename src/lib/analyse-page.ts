import { load } from "cheerio";
import {
  computeBigrams,
  extractVisibleText,
  fleschReadingEase,
  getWordFrequency,
  normaliseDensity,
  tokenise,
} from "./text";
import type { KeywordStat, PageAnalysis } from "./types";

const MAX_KEYWORDS = 20;
const BIGRAM_WEIGHT = 1.4;

const DEFAULT_EXCLUDED_KEYWORD_TOKENS = [
  "column",
  "columns",
  "edit",
  "button",
  "widget",
  "container",
  "section",
  "single",
  "block",
  "layout",
  "row",
  "element",
  "image",
  "slider",
  "arrow",
  "module",
  "panel",
  "structure",
  "wrapper",
  "canvas",
  "component",
  "technical",
  "storage",
  "preferences",
  "nbsp",
  "strictly",
  "necessary",
  "legitimate",
  "interest",
  "cookie",
  "consent",
  "access",
];

const DEFAULT_EXCLUDED_KEYWORDS = [
  "edit column",
  "column edit",
  "single column",
  "single edit",
  "button edit",
  "edit button",
  "grid column",
  "column grid",
  "edit section",
  "section edit",
  "technical storage",
  "storage access",
  "strictly necessary",
  "legitimate interest",
  "nbsp nbsp",
  "cookie consent",
  "cookie preferences",
];

let runtimeExcludedTokens = new Set<string>(DEFAULT_EXCLUDED_KEYWORD_TOKENS);
let runtimeExcludedKeywords = new Set<string>(DEFAULT_EXCLUDED_KEYWORDS);

export function setupKeywordFilters(config?: {
  excludeTokens?: string[];
  excludeKeywords?: string[];
}) {
  if (config?.excludeTokens) {
    runtimeExcludedTokens = new Set([
      ...DEFAULT_EXCLUDED_KEYWORD_TOKENS,
      ...config.excludeTokens.map((token) => token.toLowerCase()),
    ]);
  }

  if (config?.excludeKeywords) {
    runtimeExcludedKeywords = new Set([
      ...DEFAULT_EXCLUDED_KEYWORDS,
      ...config.excludeKeywords.map((keyword) => keyword.toLowerCase()),
    ]);
  }
}

export function analysePage(url: string, html: string): PageAnalysis {
  try {
    const $ = load(html);
    const titleTag = cleanString($("title").first().text());
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ?? "";
    const h1 = cleanString($("h1").first().text());
    const headings = $("h1, h2, h3")
      .map((_, el) => cleanString($(el).text()))
      .get()
      .filter(Boolean);

    const plainText = extractVisibleText(html);
    const tokens = tokenise(plainText);
    const totalWords = tokens.length;
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    const keywordStats = buildKeywordStats(tokens, totalWords);
    const readability = fleschReadingEase(plainText);

    return {
      url,
      titleTag,
      metaDescription,
      h1,
      wordCount,
      readability,
      keywords: keywordStats,
      headings,
      status: "ok",
    };
  } catch (error) {
    return {
      url,
      titleTag: "",
      metaDescription: "",
      h1: "",
      wordCount: 0,
      readability: null,
      keywords: [],
      headings: [],
      status: "error",
      error: error instanceof Error ? error.message : "Unknown analysis error",
    };
  }
}

function buildKeywordStats(tokens: string[], totalWords: number): KeywordStat[] {
  const uniFreq = getWordFrequency(tokens);
  const biFreq = computeBigrams(tokens);
  const combined = new Map<string, { score: number; density: number }>();

  for (const [keyword, count] of uniFreq.entries()) {
    combined.set(keyword, {
      score: count,
      density: normaliseDensity(count, totalWords),
    });
  }

  for (const [bigram, count] of biFreq.entries()) {
    const weighted = count * BIGRAM_WEIGHT;
    combined.set(bigram, {
      score: (combined.get(bigram)?.score ?? 0) + weighted,
      density: normaliseDensity(count * 2, totalWords),
    });
  }

  return Array.from(combined.entries())
    .map(([keyword, { score, density }]) => ({
      keyword,
      score: Math.round((score + Number.EPSILON) * 100) / 100,
      density,
      source: "page" as const,
    }))
    .filter((entry) => !shouldExcludeKeyword(entry.keyword))
    .filter((entry) => entry.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_KEYWORDS);
}

function cleanString(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function shouldExcludeKeyword(keyword: string): boolean {
  const lower = keyword.toLowerCase();
  if (runtimeExcludedKeywords.has(lower)) return true;
  const tokens = lower.split(/\s+/);
  if (
    tokens.some(
      (token) =>
        runtimeExcludedTokens.has(token) ||
        /\d/.test(token) ||
        token.length < 3
    )
  ) {
    return true;
  }
  return false;
}
