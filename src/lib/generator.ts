import { z } from "zod";
import {
  getDomain,
  normaliseUrl,
} from "./url";
import { crawlSite } from "./crawler";
import {
  matchDatasetKeywords,
  scoreDatasetKeyword,
  type KeywordDatasetEntry,
  enrichWithLocality,
} from "./keyword-dataset";
import { fetchMozMetrics } from "./moz";
import { generateContentDrafts, type ContentBrief } from "./content-writer";
import { hasMozDataApiToken, hasOpenAICredentials } from "./env";
import { senseCheckKeywords, type SenseCheckResult } from "./ai-utils";
import { fetchMozKeywordInsights } from "./moz-keywords";
import type {
  ContentGap,
  KeywordStat,
  PageAnalysis,
  SeoReport,
  SiteInput,
  SiteSnapshot,
  SiteArchitectureEntry,
} from "./types";

const INPUT_SCHEMA = z.object({
  businessName: z.string().min(2),
  website: z.string().url().or(z.string().min(3)),
  businessType: z.string().min(2),
  businessAddress: z.string().optional(),
  serviceArea: z.string().optional(),
  googleBusinessProfile: z.string().optional(),
  additionalNotes: z.string().optional(),
  useSenseCheck: z.boolean().default(true),
  competitors: z
    .array(z.string().min(3))
    .max(5)
    .default([]),
});

const MAX_INTERNAL_PAGES = 15;

interface LocationContext {
  address?: string;
  serviceArea?: string;
  primaryLocation?: string;
  allTerms: string[];
}

interface PreparedKeywordStrategy {
  datasetKeywords: KeywordStat[];
  siteKeywords: KeywordStat[];
  competitorKeywords: KeywordStat[];
  keywordOpportunities: {
    strongestKeywords: KeywordStat[];
    quickWins: KeywordStat[];
    contentGaps: ContentGap[];
    localityKeywords: KeywordStat[];
  };
  flaggedKeywords: Array<{ keyword: string; reason: string }>;
  notes: string[];
  senseCheckEnabled: boolean;
}
export async function generateSeoReport(rawInput: SiteInput): Promise<SeoReport> {
  const input = INPUT_SCHEMA.parse(rawInput);
  const locationContext = buildLocationContext(input);
  const additionalNotes = input.additionalNotes?.trim();
  const googleBusinessProfile = input.googleBusinessProfile?.trim();

  const targetSite = await analyseSite(input.website, {
    includeInternal: true,
    maxInternalPages: MAX_INTERNAL_PAGES,
  });

  const competitorSnapshots = await Promise.all(
    input.competitors
      .filter(Boolean)
      .slice(0, 5)
      .map(async (url) => analyseSite(url, { includeInternal: false }))
  );

  let competitorKeywords = aggregateKeywordUniverse(
    competitorSnapshots,
    "competitor"
  );
  const siteKeywords = aggregateKeywordUniverse([targetSite], "site");

  // Require Moz Data API for keyword intelligence
  if (!hasMozDataApiToken) {
    throw new Error(
      "MOZ_DATA_API_KEY is required to generate SEO strategies. " +
      "Without Moz keyword data, we cannot provide accurate search volume, difficulty, " +
      "or competitive intelligence. Please configure your Moz Data API credentials."
    );
  }

  let datasetKeywords: KeywordDatasetEntry[] = [];
  let mozKeywordNotes: string[] = [];

  try {
    const mozInsights = await fetchMozKeywordInsights({
      businessType: input.businessType,
      additionalNotes,
      serviceArea: input.serviceArea,
      location: locationContext.primaryLocation,
      competitors: input.competitors,
      siteKeywords,
    });

    if (!mozInsights?.datasetEntries?.length) {
      throw new Error(
        "Moz API returned no keyword data. This could mean:\n" +
        "1. Invalid Moz API credentials\n" +
        "2. No relevant keywords found for this business type\n" +
        "3. API rate limit exceeded\n\n" +
        "Cannot generate report without keyword intelligence."
      );
    }

    datasetKeywords = mozInsights.datasetEntries;

    if (mozInsights?.competitorKeywords?.length) {
      competitorKeywords = dedupeKeywordStats([
        competitorKeywords,
        mozInsights.competitorKeywords,
      ]);
    }
    mozKeywordNotes = mozInsights?.notes ?? [];
  } catch (error) {
    if (error instanceof Error && error.message.includes("MOZ_DATA_API_KEY")) {
      throw error; // Re-throw our validation error
    }
    console.error("[moz-keywords] Failed to load Moz keyword insights:", error);
    throw new Error(
      "Failed to retrieve Moz keyword data: " +
      (error instanceof Error ? error.message : "Unknown error") +
      "\n\nCannot generate report without keyword intelligence."
    );
  }

  const mozMetrics = await hydrateMozMetrics([targetSite, ...competitorSnapshots], {
    targetUrl: input.website,
  });

  const enrichedTarget = {
    ...targetSite,
    metrics: mozMetrics.get(targetSite.domain) ?? targetSite.metrics ?? null,
  } satisfies SiteSnapshot;

  const enrichedCompetitors = competitorSnapshots.map((snapshot) => ({
    ...snapshot,
    metrics: mozMetrics.get(snapshot.domain) ?? snapshot.metrics ?? null,
  }));

  const keywordStrategy = await prepareKeywordStrategy({
    input,
    datasetKeywords,
    siteKeywords,
    competitorKeywords,
    locationContext,
    useSenseCheck: input.useSenseCheck !== false,
  });
  const senseCheckNotes = [...keywordStrategy.notes];

  if (mozKeywordNotes.length) {
    keywordStrategy.notes.push(...mozKeywordNotes);
  }

  const metadataPlan = buildMetadataPlan(
    input.businessName,
    input.businessType,
    keywordStrategy.keywordOpportunities,
    keywordStrategy.siteKeywords
  );

  const pageBlueprints = buildPageBlueprints(
    input.businessName,
    input.businessType,
    keywordStrategy.keywordOpportunities
  );

  const siteArchitecture = buildSiteArchitecture({
    targetSite: enrichedTarget,
    metadataPlan,
    pageBlueprints,
    keywordStrategy,
  });

  let contentDrafts;
  if (hasOpenAICredentials) {
    const briefs = buildContentBriefs({
      businessName: input.businessName,
      businessType: input.businessType,
      metadataPlan,
      pageBlueprints,
      keywordOpportunities: keywordStrategy.keywordOpportunities,
      siteKeywords: keywordStrategy.siteKeywords,
      targetSite: enrichedTarget,
      locationContext,
      additionalNotes,
    });
    contentDrafts = await generateContentDrafts(briefs, {
      businessName: input.businessName,
      businessType: input.businessType,
      location: locationContext.primaryLocation,
      serviceArea: locationContext.serviceArea,
      googleBusinessProfile: input.googleBusinessProfile,
      additionalNotes: input.additionalNotes,
    });
  }

  const recommendations = buildRecommendations({
    keywordStrategy,
    siteArchitecture,
    locationContext,
    targetSite: enrichedTarget,
    competitors: enrichedCompetitors,
    additionalNotes,
    googleBusinessProfile,
  });

  // Assess data quality and generate warnings
  const dataQualityWarnings: string[] = [];

  // Check competitor analysis
  if (input.competitors.length === 0) {
    dataQualityWarnings.push(
      "⚠️ No competitors analyzed - missing competitive intelligence. Add 3-5 competitor URLs for better keyword insights and gap analysis."
    );
  } else if (input.competitors.length < 3) {
    dataQualityWarnings.push(
      `⚠️ Limited competitor analysis (${input.competitors.length} competitor${input.competitors.length === 1 ? "" : "s"}). For comprehensive insights, analyze 3-5 competitors.`
    );
  }

  // Check crawled pages
  const crawledPages = enrichedTarget.pages.filter((p) => p.status === "ok").length;
  if (crawledPages < 5) {
    dataQualityWarnings.push(
      `⚠️ Limited site content crawled (${crawledPages} page${crawledPages === 1 ? "" : "s"}). Keyword extraction may be incomplete. Ensure site is accessible and has discoverable internal links.`
    );
  }

  // Check Moz keyword data availability
  const mozEnrichedKeywords = datasetKeywords.filter(
    (k) => k.volume !== undefined && k.difficulty !== undefined
  ).length;
  if (mozEnrichedKeywords === 0) {
    dataQualityWarnings.push(
      "⚠️ No Moz keyword metrics available. Search volume and difficulty estimates are missing - recommendations may be less accurate."
    );
  } else if (mozEnrichedKeywords < datasetKeywords.length / 2) {
    dataQualityWarnings.push(
      `⚠️ Partial Moz coverage (${mozEnrichedKeywords}/${datasetKeywords.length} keywords enriched). Some recommendations lack volume/difficulty data.`
    );
  }

  // Check domain authority metrics
  if (!enrichedTarget.metrics || !enrichedTarget.metrics.domainAuthority) {
    dataQualityWarnings.push(
      "⚠️ Domain authority metrics unavailable. Cannot assess competitive positioning accurately."
    );
  }

  const normalisedInput: SiteInput = {
    businessName: input.businessName,
    website: normaliseUrl(input.website),
    businessType: input.businessType,
    competitors: input.competitors.map(normaliseUrl),
    businessAddress: input.businessAddress?.trim(),
    serviceArea: input.serviceArea?.trim(),
    googleBusinessProfile: input.googleBusinessProfile?.trim(),
    additionalNotes: input.additionalNotes?.trim(),
    useSenseCheck: input.useSenseCheck !== false,
  };

  return {
    generatedAt: new Date().toISOString(),
    input: normalisedInput,
    targetSite: enrichedTarget,
    competitors: enrichedCompetitors,
    dataQualityWarnings: dataQualityWarnings.length > 0 ? dataQualityWarnings : undefined,
    locality: locationContext,
    senseCheck: {
      enabled: keywordStrategy.senseCheckEnabled,
      flaggedKeywords: keywordStrategy.flaggedKeywords,
      notes: senseCheckNotes,
    },
    keywordOpportunities: keywordStrategy.keywordOpportunities,
    metadataPlan,
    pageBlueprints,
    contentDrafts,
    siteArchitecture,
    recommendations,
  };
}

async function analyseSite(
  url: string,
  options: { includeInternal: boolean; maxInternalPages?: number } = {
    includeInternal: true,
  }
): Promise<SiteSnapshot> {
  const domain = getDomain(url);
  const limit = 1 + (options.includeInternal ? options.maxInternalPages ?? MAX_INTERNAL_PAGES : 0);

  const crawledPages = await crawlSite({
    startUrl: url,
    limit,
    maxDepth: options.includeInternal ? 3 : 0,
    sameDomainOnly: true,
    respectRobots: true,
  });

  const pages = crawledPages.slice(0, limit);

  const aggregatedKeywords = aggregateKeywordsFromPages(pages, "site");

  return {
    domain,
    pages,
    aggregatedKeywords,
    metrics: null,
  };
}

function aggregateKeywordUniverse(
  sites: SiteSnapshot[],
  source: KeywordStat["source"] = "site"
): KeywordStat[] {
  return aggregateKeywordsFromPages(
    sites.flatMap((site) => site.pages),
    source
  );
}

function aggregateKeywordsFromPages(
  pages: PageAnalysis[],
  defaultSource: KeywordStat["source"] = "page"
): KeywordStat[] {
  const keywordMap = new Map<
    string,
    {
      keyword: string;
      score: number;
      densitySum: number;
      hits: number;
      volume?: number;
      difficulty?: number;
      intent?: KeywordStat["intent"];
      source?: KeywordStat["source"];
    }
  >();

  for (const page of pages) {
    if (page.status !== "ok") continue;

    for (const keyword of page.keywords) {
      const cleanedKeyword = formatKeywordDisplay(keyword.keyword);
      if (!isMeaningfulKeyword(cleanedKeyword)) continue;
      const key = normaliseKeyword(cleanedKeyword);
      const current = keywordMap.get(key) ?? {
        keyword: cleanedKeyword,
        score: 0,
        densitySum: 0,
        hits: 0,
        volume: keyword.volume,
        difficulty: keyword.difficulty,
        intent: keyword.intent,
        source: keyword.source ?? defaultSource,
      };
      keywordMap.set(key, {
        keyword: current.keyword || cleanedKeyword,
        score: current.score + keyword.score,
        densitySum: current.densitySum + keyword.density,
        hits: current.hits + 1,
        volume: keyword.volume ?? current.volume,
        difficulty: keyword.difficulty ?? current.difficulty,
        intent: keyword.intent ?? current.intent,
        source: keyword.source ?? current.source ?? defaultSource,
      });
    }
  }

  return Array.from(keywordMap.entries())
    .map(([, { keyword, score, densitySum, hits, volume, difficulty, intent, source }]) => ({
      keyword,
      score: Math.round((score + Number.EPSILON) * 100) / 100,
      density: Math.round(((densitySum / hits || 0) + Number.EPSILON) * 100) / 100,
      volume,
      difficulty,
      intent,
      source: source ?? defaultSource,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

function buildKeywordOpportunities(
  competitorKeywords: KeywordStat[],
  siteKeywords: KeywordStat[],
  datasetKeywords: KeywordStat[]
): {
  strongestKeywords: KeywordStat[];
  quickWins: KeywordStat[];
  contentGaps: ContentGap[];
  localityKeywords: KeywordStat[];
} {
  const combined = filterNavigationStats(dedupeKeywordStats([
    ...datasetKeywords,
    ...competitorKeywords,
  ]));

  const siteKeywordSet = new Set(
    siteKeywords.map((k) => normaliseKeyword(k.keyword))
  );
  const datasetSet = new Set(
    datasetKeywords.map((k) => normaliseKeyword(k.keyword))
  );

  const strongestKeywords = combined.slice(0, 15);

  const contentGaps: ContentGap[] = combined
    .filter((keyword) => !siteKeywordSet.has(normaliseKeyword(keyword.keyword)))
    .slice(0, 10)
    .map((keyword) => buildContentGap(keyword));

  let quickWins = siteKeywords
    .filter((keyword) => datasetSet.has(normaliseKeyword(keyword.keyword)))
    .slice(0, 8);

  if (!quickWins.length) {
    quickWins = siteKeywords.slice(0, 8);
  }

  quickWins = quickWins.map((keyword) => ({
    ...keyword,
    intent: keyword.intent ?? inferIntent(keyword.keyword),
  }));

  return {
    strongestKeywords,
    quickWins,
    contentGaps,
    localityKeywords: [],
  };
}

function keywordEntryToStat(entry: KeywordDatasetEntry): KeywordStat {
  const keyword = formatKeywordDisplay(entry.keyword);
  return {
    keyword,
    score: scoreDatasetKeyword(entry),
    density: 0,
    volume: entry.volume,
    difficulty: entry.difficulty,
    intent: entry.intent,
    source: "dataset",
  };
}

function cleanKeywordStats(
  stats: KeywordStat[],
  defaultSource: KeywordStat["source"]
): KeywordStat[] {
  const cleaned: KeywordStat[] = [];
  for (const stat of stats) {
    const keyword = formatKeywordDisplay(stat.keyword);
    if (!isMeaningfulKeyword(keyword)) continue;
    cleaned.push({
      ...stat,
      keyword,
      source: stat.source ?? defaultSource,
    });
  }
  return cleaned;
}

function dedupeKeywordStats(stats: KeywordStat[] | KeywordStat[][]): KeywordStat[] {
  const list = Array.isArray(stats[0])
    ? (stats as KeywordStat[][]).flat()
    : (stats as KeywordStat[]);

  const map = new Map<string, KeywordStat>();
  for (const stat of list) {
    const key = normaliseKeyword(stat.keyword);
    if (!key) continue;
    const existing = map.get(key);
    if (!existing || stat.score > existing.score) {
      map.set(key, {
        ...stat,
        density: stat.density ?? existing?.density ?? 0,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

function mergeKeywordStats(
  ...lists: KeywordStat[][]
): Map<string, KeywordStat> {
  const map = new Map<string, KeywordStat>();
  lists.flat().forEach((stat) => {
    const key = normaliseKeyword(stat.keyword);
    if (!key) return;
    const existing = map.get(key);
    if (!existing || stat.score > existing.score) {
      map.set(key, stat);
    }
  });
  return map;
}

function filterStatsByApprovedKeywords(
  stats: KeywordStat[],
  approvedSet: Set<string>
): KeywordStat[] {
  if (!approvedSet.size) return stats;
  return stats.filter((stat) => approvedSet.has(normaliseKeyword(stat.keyword)));
}

function extractLocalityKeywords(stats: KeywordStat[], terms: string[]): KeywordStat[] {
  if (!terms.length) return [];
  const lowerTerms = terms.map((term) => term.toLowerCase());
  const locality = stats.filter((stat) =>
    lowerTerms.some((term) => stat.keyword.includes(term))
  );
  return locality.slice(0, 8);
}

async function hydrateMozMetrics(
  snapshots: SiteSnapshot[],
  options: { targetUrl: string }
) {
  const targetOrigins = snapshots.map((snapshot, index) => {
    if (!snapshot.domain) return null;
    if (index === 0) {
      return normaliseUrl(options.targetUrl);
    }
    return `https://${snapshot.domain}`;
  });

  const metrics = await fetchMozMetrics(targetOrigins.filter(Boolean) as string[]);
  return metrics;
}

function buildLocationContext(input: SiteInput): LocationContext {
  const address = input.businessAddress?.trim() || undefined;
  const serviceArea = input.serviceArea?.trim() || undefined;

  const terms = new Set<string>();

  const addTerms = (value?: string) => {
    if (!value) return;
    value
      .split(/[|,&/\n]/)
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => {
        const cleaned = token.replace(/[0-9#]+/g, "").trim();
        if (cleaned.length >= 2) {
          terms.add(cleaned.toLowerCase());
        }
      });
  };

  addTerms(address);
  addTerms(serviceArea);

  const allTerms = Array.from(terms);
  const primaryLocation = allTerms[0] ?? undefined;

  return {
    address,
    serviceArea,
    primaryLocation,
    allTerms,
  };
}

async function prepareKeywordStrategy(params: {
  input: SiteInput;
  datasetKeywords: KeywordDatasetEntry[];
  siteKeywords: KeywordStat[];
  competitorKeywords: KeywordStat[];
  locationContext: LocationContext;
  useSenseCheck: boolean;
}): Promise<PreparedKeywordStrategy> {
  const additionalNotes = params.input.additionalNotes?.trim();
  const googleBusinessProfile = params.input.googleBusinessProfile?.trim();

  const localisedDatasetEntries = enrichWithLocality(
    params.datasetKeywords,
    params.locationContext.primaryLocation ?? params.locationContext.address,
    params.locationContext.serviceArea
  );

  let datasetStats = dedupeKeywordStats(
    localisedDatasetEntries.map(keywordEntryToStat)
  );
  let siteStats = dedupeKeywordStats(
    cleanKeywordStats(params.siteKeywords, "site")
  );
  let competitorStats = dedupeKeywordStats(
    cleanKeywordStats(params.competitorKeywords, "competitor")
  );

  const combinedMap = mergeKeywordStats(datasetStats, siteStats, competitorStats);

  const combinedKeywords = Array.from(combinedMap.keys());
  const shouldSenseCheck = params.useSenseCheck && combinedKeywords.length > 0;

  const senseCheck: SenseCheckResult = shouldSenseCheck
    ? await senseCheckKeywords({
        businessName: params.input.businessName,
        businessType: params.input.businessType,
        location:
          params.locationContext.primaryLocation ?? params.locationContext.address,
        serviceArea: params.locationContext.serviceArea,
        additionalNotes,
        googleBusinessProfile,
        keywords: combinedKeywords,
      })
    : {
        approvedKeywords: combinedKeywords,
        flaggedKeywords: [],
        notes: params.useSenseCheck
          ? []
          : ["AI sense check disabled for this run—showing raw keyword pools."],
      };

  const approvedSet = new Set(
    (senseCheck.approvedKeywords ?? combinedKeywords).map((keyword) =>
      normaliseKeyword(keyword)
    )
  );

  const filteredDataset = filterStatsByApprovedKeywords(datasetStats, approvedSet);
  const filteredSite = filterStatsByApprovedKeywords(siteStats, approvedSet);
  const filteredCompetitor = filterStatsByApprovedKeywords(
    competitorStats,
    approvedSet
  );

  const aiFallback = didSenseCheckFallback(senseCheck.notes);

  datasetStats = filterNavigationStats(filteredDataset);
  siteStats = filterNavigationStats(filteredSite);
  competitorStats = filterNavigationStats(filteredCompetitor);

  const relevanceContext = buildKeywordRelevanceContext({
    businessName: params.input.businessName,
    businessType: params.input.businessType,
    additionalNotes,
    locationTerms: params.locationContext.allTerms,
    siteKeywords: siteStats,
    competitorKeywords: competitorStats,
    datasetKeywords: datasetStats,
  });

  datasetStats = filterStatsByRelevance(datasetStats, relevanceContext);
  const refinedSiteStats = filterStatsByRelevance(siteStats, relevanceContext);
  if (refinedSiteStats.length) {
    siteStats = refinedSiteStats;
  }
  const refinedCompetitorStats = filterStatsByRelevance(competitorStats, relevanceContext);
  if (refinedCompetitorStats.length) {
    competitorStats = refinedCompetitorStats;
  }

  if (aiFallback) {
    const refinedDataset = filterStatsByRelevance(datasetStats, relevanceContext);
    if (refinedDataset.length) {
      datasetStats = refinedDataset;
    }
  }

  datasetStats = datasetStats.filter(isRelevantSeed);
  const cleanedSiteStats = siteStats.filter(
    (stat) => !shouldFilterNavKeyword(stat.keyword)
  );

  const keywordOpportunities = buildKeywordOpportunities(
    competitorStats,
    cleanedSiteStats,
    datasetStats
  );

  const localityKeywords = extractLocalityKeywords(
    datasetStats,
    params.locationContext.allTerms
  );
  keywordOpportunities.localityKeywords = localityKeywords;

  return {
    datasetKeywords: datasetStats,
    siteKeywords: siteStats,
    competitorKeywords: competitorStats,
    keywordOpportunities,
    flaggedKeywords: senseCheck.flaggedKeywords,
    notes: senseCheck.notes,
    senseCheckEnabled: params.useSenseCheck,
  };
}

function buildSiteArchitecture(params: {
  targetSite: SiteSnapshot;
  metadataPlan: ReturnType<typeof buildMetadataPlan>;
  pageBlueprints: ReturnType<typeof buildPageBlueprints>;
  keywordStrategy: PreparedKeywordStrategy;
}): SiteArchitectureEntry[] {
  const entries: SiteArchitectureEntry[] = [];
  const seen = new Set<string>();

  const addEntry = (entry: SiteArchitectureEntry) => {
    const key = entry.slug;
    if (seen.has(key)) return;
    seen.add(key);
    entries.push(entry);
  };

  for (const page of params.targetSite.pages) {
    if (page.status !== "ok") continue;
    const slug = slugFromUrl(page.url);
    if (shouldSkipArchitectureSlug(slug)) continue;
    const keywordCandidates = page.keywords
      .map((keyword) => formatKeywordDisplay(keyword.keyword))
      .filter(Boolean);
    const topKeywords = filterNavigationStrings(keywordCandidates).slice(0, 2);
    const hasThinCopy = page.wordCount < 200;
    const primaryKeyword = topKeywords[0];
    addEntry({
      slug,
      title: page.h1 || page.titleTag || slug,
      type: "existing",
      purpose: primaryKeyword
        ? `Strengthen relevance for "${primaryKeyword}" with refreshed messaging, proof, and internal links.`
        : hasThinCopy
        ? "Expand the page with a defined value proposition, proof points, and a prominent CTA."
        : "Clarify the positioning and next steps to drive enquiries.",
      targetKeywords: topKeywords,
      status: hasThinCopy || !primaryKeyword ? "optimise" : "keep",
    });
  }

  params.metadataPlan.keyPages.forEach((page) => {
    const slug = page.suggestedUrl
      ? slugFromUrl(page.suggestedUrl)
      : slugify(page.title);
    if (shouldSkipArchitectureSlug(slug)) return;
    const keywords = filterNavigationStrings([
      formatKeywordDisplay(page.h1),
    ]);
    const primary = keywords[0] ?? formatKeywordDisplay(page.h1);
    addEntry({
      slug,
      title: page.title,
      type: "existing",
      purpose: `Strengthen relevance for ${primary || page.title} and drive conversions.`,
      targetKeywords: keywords.length ? keywords : filterNavigationStrings([formatKeywordDisplay(page.title)]),
      status: "optimise",
    });
  });

  params.pageBlueprints.newPages.forEach((page) => {
    const slug = page.suggestedUrl
      ? slugFromUrl(page.suggestedUrl)
      : slugify(page.title);
    if (shouldSkipArchitectureSlug(slug)) return;

    const matchingGaps = params.keywordStrategy.keywordOpportunities.contentGaps
      .filter((gap) => slug.includes(slugify(gap.keyword)) || page.title.toLowerCase().includes(gap.keyword))
      .slice(0, 2)
      .map((gap) => gap.keyword);

    addEntry({
      slug,
      title: page.title,
      type: "new",
      purpose: `Create a conversion-focused destination for ${matchingGaps[0] ?? page.title}, including proof, FAQs, and conversion paths.`,
      targetKeywords: matchingGaps.length
        ? matchingGaps
        : filterNavigationStrings([formatKeywordDisplay(page.title)]),
      status: "create",
    });
  });

  return entries;
}

function buildRecommendations(params: {
  keywordStrategy: PreparedKeywordStrategy;
  siteArchitecture: SiteArchitectureEntry[];
  locationContext: LocationContext;
  targetSite: SiteSnapshot;
  competitors: SiteSnapshot[];
  additionalNotes?: string;
  googleBusinessProfile?: string;
}): string[] {
  const recommendations: string[] = [];
  const strategicNote = params.additionalNotes?.trim();
  const gbp = params.googleBusinessProfile?.trim();

  if (strategicNote) {
    recommendations.push(`Ensure every deliverable reflects the strategic focus: ${strategicNote}.`);
  }

  const topKeywords = params.keywordStrategy.keywordOpportunities.strongestKeywords
    .slice(0, 3)
    .map((keyword) => keyword.keyword)
    .join(", ");
  if (topKeywords) {
    recommendations.push(`Centre page messaging around high-value themes: ${topKeywords}.`);
  }

  if (params.keywordStrategy.keywordOpportunities.localityKeywords.length) {
    const locList = params.keywordStrategy.keywordOpportunities.localityKeywords
      .slice(0, 3)
      .map((keyword) => keyword.keyword)
      .join(", ");
    recommendations.push(
      `Bake locality modifiers (${locList}) into hero copy, schema, and internal anchor text to dominate local searches.`
    );
  }

  if (params.keywordStrategy.flaggedKeywords.length) {
    const flagged = params.keywordStrategy.flaggedKeywords
      .map((item) => item.keyword)
      .slice(0, 3)
      .join(", ");
    recommendations.push(
      `Remove irrelevant terms such as ${flagged} from the roadmap—they don't align with the core service.`
    );
  }

  params.keywordStrategy.notes.forEach((note) => {
    if (note) {
      recommendations.push(note);
    }
  });

  const pagesToCreate = params.siteArchitecture.filter((entry) => entry.status === "create");
  if (pagesToCreate.length) {
    recommendations.push(
      `Prioritise building ${pagesToCreate.length} new landing page${
        pagesToCreate.length === 1 ? "" : "s"
      } targeting unmet demand (e.g. ${pagesToCreate
        .slice(0, 2)
        .map((entry) => entry.title)
        .join(", ")}).`
    );
  }

  if (gbp) {
    recommendations.push(
      `Optimise the Google Business Profile (${gbp}) with refreshed services, imagery, and location keywords to reinforce the new positioning.`
    );
  }

  const targetAuthority = params.targetSite.metrics?.domainAuthority;
  const competitorAuthorities = params.competitors
    .map((competitor) => competitor.metrics?.domainAuthority)
    .filter((value): value is number => typeof value === "number");

  if (targetAuthority && competitorAuthorities.length) {
    const competitorAvg =
      competitorAuthorities.reduce((sum, value) => sum + value, 0) /
      competitorAuthorities.length;
    if (targetAuthority < competitorAvg) {
      recommendations.push(
        `Earn authoritative backlinks in the ${
          params.locationContext.primaryLocation ?? params.locationContext.serviceArea ?? "target"
        } market—competitors average DA ${competitorAvg.toFixed(1)} vs. current ${targetAuthority.toFixed(
          1
        )}.`
      );
    }
  }

  if (!recommendations.length) {
    recommendations.push(
      "Focus on aligning on-page copy, metadata, and internal linking with the refreshed keyword clusters to maximise relevance."
    );
  }

  return recommendations;
}

function buildContentBriefs(params: {
  businessName: string;
  businessType: string;
  metadataPlan: SeoReport["metadataPlan"];
  pageBlueprints: SeoReport["pageBlueprints"];
  keywordOpportunities: SeoReport["keywordOpportunities"];
  siteKeywords: KeywordStat[];
  targetSite: SiteSnapshot;
  locationContext: LocationContext;
  additionalNotes?: string;
}): ContentBrief[] {
  const briefs: ContentBrief[] = [];

  const homepageBrief: ContentBrief = {
    slug: "homepage",
    pageType: "homepage",
    metadata: params.metadataPlan.homepage,
    primaryKeywords: params.keywordOpportunities.strongestKeywords.slice(0, 6),
    supportingKeywords: params.siteKeywords.slice(0, 6),
    pageObjective: params.additionalNotes
      ? `Position ${params.businessName} as the go-to ${params.businessType} while incorporating ${params.additionalNotes}.`
      : `Position ${params.businessName} as the go-to ${params.businessType}.`,
    audienceIntent:
      "High-intent visitors evaluating the brand for immediate enquiry, booking, or consultation.",
    mustInclude: [
      `Core value proposition of ${params.businessName} as a ${params.businessType}.`,
      ...(params.locationContext.primaryLocation
        ? [`Reference the primary service location (${params.locationContext.primaryLocation}) within the hero copy and testimonials.`]
        : []),
      "Evidence of expertise, social proof, or differentiators gleaned from competitive insights.",
      "Clear transition into services/menus plus conversion-focused CTA.",
      ...(params.additionalNotes
        ? [`Weave in business context: ${params.additionalNotes}.`]
        : []),
    ],
    authoritySignals: params.targetSite.metrics ?? undefined,
  };
  briefs.push(homepageBrief);

  params.metadataPlan.keyPages.forEach((page, index) => {
    const supportingKeyword = params.keywordOpportunities.quickWins[index];
    briefs.push({
      slug: page.suggestedUrl ? slugFromUrl(page.suggestedUrl) : slugify(page.title),
      url: page.suggestedUrl,
      pageType: "existing",
      metadata: page,
      primaryKeywords: supportingKeyword ? [supportingKeyword] : [],
      supportingKeywords: params.siteKeywords.slice(0, 4),
      pageObjective: `Deepen relevance for ${supportingKeyword?.keyword ?? page.title}.`,
      audienceIntent:
        "Users comparing providers, looking for proof of capability, pricing cues, and next steps.",
      mustInclude: [
        "Specific service or offering details, structured for fast scanning.",
        "Unique differentiators compared to major competitors.",
        "Inline conversion hooks and relevant internal links.",
        ...(params.locationContext.primaryLocation
          ? [`Reference recent projects delivered in ${params.locationContext.primaryLocation} or the wider ${params.locationContext.serviceArea ?? "region"}.`]
          : []),
        ...(params.additionalNotes
          ? [`Reflect new strategic initiatives: ${params.additionalNotes}.`]
          : []),
      ],
      authoritySignals: params.targetSite.metrics ?? undefined,
    });
  });

  params.pageBlueprints.newPages.forEach((page, index) => {
    const gap = params.keywordOpportunities.contentGaps[index];
    const primary = gap ? makeKeywordStatFromGap(gap) : undefined;
    briefs.push({
      slug: page.suggestedUrl ? slugFromUrl(page.suggestedUrl) : slugify(page.title),
      url: page.suggestedUrl,
      pageType: "new",
      metadata: page,
      primaryKeywords: primary ? [primary] : [],
      supportingKeywords: params.keywordOpportunities.strongestKeywords.slice(0, 3),
      pageObjective: gap?.recommendedAction ?? `Capture demand for ${page.title}.`,
      audienceIntent:
        gap?.opportunity ?? "High-intent users seeking detailed answers before converting.",
      mustInclude: [
        "Structured sections (overview, key benefits, proof, FAQs).",
        "Compelling CTA and clear next steps.",
        "Signals of trust (awards, testimonials, guarantees) if available.",
        ...(params.locationContext.primaryLocation
          ? [`Include geographical context (e.g. signature projects in ${params.locationContext.primaryLocation}) to reinforce localisation.`]
          : []),
        ...(params.additionalNotes
          ? [`Address strategic note: ${params.additionalNotes}.`]
          : []),
      ],
      authoritySignals: params.targetSite.metrics ?? undefined,
    });
  });

  return briefs;
}


function buildMetadataPlan(
  businessName: string,
  businessType: string,
  opportunities: ReturnType<typeof buildKeywordOpportunities>,
  siteKeywords: KeywordStat[]
) {
  const primaryKeyword =
    opportunities.strongestKeywords[0]?.keyword ??
    siteKeywords[0]?.keyword ??
    businessType;
  const secondaryKeyword =
    opportunities.strongestKeywords[1]?.keyword ??
    opportunities.quickWins[0]?.keyword ??
    businessType;

  const homepage: ReturnType<typeof buildMetadata> = buildMetadata({
    businessName,
    businessType,
    mainKeyword: primaryKeyword,
    secondaryKeyword,
  });

  const keyPages = opportunities.quickWins.slice(0, 4).map((keyword) =>
    buildMetadata({
      businessName,
      businessType,
      mainKeyword: keyword.keyword,
      secondaryKeyword: primaryKeyword,
      urlHint: keyword.keyword,
    })
  );

  return {
    homepage,
    keyPages,
  };
}

function buildMetadata({
  businessName,
  businessType,
  mainKeyword,
  secondaryKeyword,
  urlHint,
}: {
  businessName?: string;
  businessType: string;
  mainKeyword: string;
  secondaryKeyword?: string;
  urlHint?: string;
}) {
  const safeBusinessName = businessName?.trim() ?? "";
  const formattedMainKeyword = capitalise(mainKeyword || businessType);
  const formattedSecondary = secondaryKeyword
    ? capitalise(secondaryKeyword)
    : null;
  const formattedType = capitalise(businessType);

  const titleSegments = [
    formattedMainKeyword,
    formattedSecondary,
    safeBusinessName || null,
  ].filter(Boolean);

  const descriptionParts = [
    safeBusinessName
      ? `${safeBusinessName} specialises in ${formattedMainKeyword.toLowerCase()} for ${formattedType.toLowerCase()} engagements.`
      : `Specialists in ${formattedMainKeyword.toLowerCase()} for ${formattedType.toLowerCase()} engagements.`,
    formattedSecondary
      ? `We also capture demand around ${formattedSecondary.toLowerCase()}.`
      : null,
    "Explore recent work and request a consultation.",
  ].filter(Boolean);

  const heroPitch = safeBusinessName
    ? `${safeBusinessName} pairs ${formattedType.toLowerCase()} insight with search intelligence to win "${formattedMainKeyword.toLowerCase()}" moments.`
    : `Pair ${formattedType.toLowerCase()} insight with search intelligence to win "${formattedMainKeyword.toLowerCase()}" moments.`;

  const callToAction = defaultCallToAction(formattedType);

  const h1 = safeBusinessName
    ? `${formattedMainKeyword} with ${safeBusinessName}`
    : `${formattedMainKeyword} ${formattedType}`;

  return {
    title: titleSegments.join(" | "),
    description: descriptionParts.join(" "),
    h1,
    heroPitch,
    callToAction,
    suggestedUrl: urlHint ? `/${slugify(urlHint)}/` : undefined,
  };
}

function buildPageBlueprints(
  businessName: string,
  businessType: string,
  opportunities: ReturnType<typeof buildKeywordOpportunities>
) {
  const newPages = opportunities.contentGaps.slice(0, 5).map((gap) =>
    buildMetadata({
      businessName,
      businessType,
      mainKeyword: gap.keyword,
      secondaryKeyword: opportunities.strongestKeywords[0]?.keyword,
      urlHint: gap.keyword,
    })
  );

  const optimisationChecklist = [
    "Ensure each page has a single, descriptive H1 with target keyword variants.",
    "Structure content with H2/H3 subtopics that mirror search intent clusters.",
    "Embed internal links from authority pages to new and optimised URLs with contextual anchor text.",
    "Compress hero media and implement lazy loading for secondary imagery.",
    "Add schema markup (LocalBusiness, Product, FAQ) where relevant to enhance SERP visibility.",
    "Implement conversion hooks (lead forms, booking CTAs) within the first viewport.",
  ];

  return { newPages, optimizationChecklist: optimisationChecklist };
}

function buildContentGap(keyword: KeywordStat): ContentGap {
  const intent = keyword.intent ?? inferIntent(keyword.keyword);
  return {
    keyword: keyword.keyword,
    opportunity: describeOpportunity(
      keyword.keyword,
      intent,
      keyword.volume,
      keyword.difficulty
    ),
    recommendedAction: recommendAction(keyword.keyword, intent),
    volume: keyword.volume,
    difficulty: keyword.difficulty,
    intent,
  };
}

function describeOpportunity(
  keyword: string,
  intent?: KeywordStat["intent"],
  volume?: number,
  difficulty?: number
): string {
  const metrics: string[] = [];
  if (typeof volume === "number" && volume > 0) {
    metrics.push(`~${Math.round(volume).toLocaleString()} searches/mo`);
  }
  if (typeof difficulty === "number" && difficulty > 0) {
    metrics.push(`difficulty ${Math.round(difficulty)}/100`);
  }
  const metricsSuffix = metrics.length ? ` (${metrics.join(", ")})` : "";

  const lowerKeyword = keyword.toLowerCase();
  if (/\b(near me|edinburgh|scotland|glasgow|london|manchester|uk)\b/.test(lowerKeyword)) {
    return `Local intent for "${keyword}" is largely unclaimed${metricsSuffix}.`;
  }

  switch (intent) {
    case "informational":
      return `Educational demand for "${keyword}" is under-served${metricsSuffix}.`;
    case "transactional":
      return `High-intent buyers searching "${keyword}" default to competitors${metricsSuffix}.`;
    case "navigational":
      return `"${keyword}" searchers are landing on competitor brand hubs${metricsSuffix}.`;
    case "commercial":
      return `Comparison shoppers researching "${keyword}" lack a compelling option from us${metricsSuffix}.`;
    default:
      return `Search demand for "${keyword}" remains open for us to claim${metricsSuffix}.`;
  }
}

function recommendAction(
  keyword: string,
  intent?: KeywordStat["intent"]
): string {
  const lowerKeyword = keyword.toLowerCase();

  if (/(pricing|cost|rates|fees|budget)/i.test(keyword)) {
    return "Publish transparent pricing content with tiered packages, ROI signals, and next steps.";
  }

  if (/\b(near me|edinburgh|glasgow|scotland|london|manchester|uk)\b/.test(lowerKeyword)) {
    return "Launch a location landing page with local proof points, embedded map, and Google Business Profile integration.";
  }

  if (intent === "informational" || /(guide|ideas|tips|how to|what is|examples|inspiration)/i.test(keyword)) {
    return "Publish an authority guide that addresses core questions, features data-backed insights, and links into services.";
  }

  if (intent === "transactional" || /(service|agency|firm|consultant|studio|hire|provider)/i.test(keyword)) {
    return "Build a conversion-focused service page with proposition stacks, case studies, and prominent enquiry CTAs.";
  }

  if (intent === "navigational" || /(case study|portfolio|work)/i.test(keyword)) {
    return "Curate a branded hub or case study page that clearly owns the query and routes visitors to contact options.";
  }

  if (intent === "commercial" || /(best|top|vs|comparison|alternatives)/i.test(keyword)) {
    return "Create a comparison resource outlining differentiators, proof points, and buyer guidance.";
  }

  if (/(ideas|trends)/i.test(keyword)) {
    return "Develop an inspiration-led article supported by visuals, expert commentary, and internal links to services.";
  }

  return "Develop a dedicated landing page with unique proof points, FAQs, and supporting media.";
}

function defaultCallToAction(businessType: string): string {
  const type = businessType.trim().toLowerCase();
  if (/(restaurant|hospitality|venue|bar|hotel|leisure)/.test(type)) {
    return "Schedule a project discovery call";
  }
  if (/(agency|studio|consult|consultancy|firm|advis|strategy)/.test(type)) {
    return "Book a strategy call";
  }
  if (/(retail|ecommerce|shop|store|product)/.test(type)) {
    return "Start your project";
  }
  return "Request a consultation";
}

function inferIntent(keyword: string): KeywordStat["intent"] {
  const lower = keyword.toLowerCase();

  if (/(near me|service|agency|firm|consultant|provider|hire|quote|proposal|studio)/.test(lower)) {
    return "transactional";
  }

  if (/(pricing|cost|rates|fees|best|top|vs|comparison|alternatives)/.test(lower)) {
    return "commercial";
  }

  if (/(how|what|why|guide|tips|ideas|examples|trends|inspiration)/.test(lower)) {
    return "informational";
  }

  if (/(case study|portfolio|rough\.|\.co|\.com|brand)/.test(lower)) {
    return "navigational";
  }

  return "commercial";
}

function slugify(phrase: string): string {
  return phrase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normaliseKeyword(value: string): string {
  return formatKeywordDisplay(value);
}

function slugFromUrl(url: string): string {
  try {
    const parsed = new URL(url, "https://placeholder.local");
    const pathname = parsed.pathname === "/" ? "home" : parsed.pathname.replace(/^\/+|\/+$/g, "");
    return slugify(pathname || "home");
  } catch {
    return slugify(url.replace(/^\/+/, ""));
  }
}

function makeKeywordStatFromGap(gap: ContentGap): KeywordStat {
  const score = gap.volume ? Math.max(1, gap.volume / 100) : 1;
  return {
    keyword: gap.keyword,
    score,
    density: 0,
    volume: gap.volume,
    difficulty: gap.difficulty,
    intent: gap.intent,
    source: "dataset",
  };
}

const ARCHITECTURE_UTILITY_SLUGS = new Set([
  "cart",
  "checkout",
  "privacy-policy",
  "terms",
  "terms-and-conditions",
  "policy",
  "login",
  "account",
  "search",
  "feed",
  "rss",
]);

function shouldSkipArchitectureSlug(slug: string): boolean {
  return ARCHITECTURE_UTILITY_SLUGS.has(slug);
}

const NAV_KEYWORD_STRINGS = new Set([
  "home portfolio",
  "portfolio feed",
  "feed blog",
  "blog contact",
  "contact dash",
  "dash free",
  "home",
  "portfolio",
  "feed",
  "blog",
  "contact",
  "login",
  "cart",
  "privacy policy",
  "terms",
  "terms and conditions",
]);

const NAV_TOKENS = new Set([
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

const CORE_SERVICE_TOKENS = new Set([
  "design",
  "designer",
  "designers",
  "interior",
  "interiors",
  "fit",
  "fitout",
  "fit-out",
  "refit",
  "refurbishment",
  "branding",
  "brand",
  "studio",
  "studios",
  "architecture",
  "architectural",
  "spatial",
  "experience",
  "experiential",
  "environment",
  "environments",
]);

function keywordTokens(value?: string): string[] {
  if (!value) return [];
  return formatKeywordDisplay(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function isNavigationToken(token: string): boolean {
  return NAV_TOKENS.has(token);
}

function isNavigationKeyword(keyword: string): boolean {
  const normalised = formatKeywordDisplay(keyword);
  if (!normalised) return true;
  if (NAV_KEYWORD_STRINGS.has(normalised)) return true;
  const tokens = keywordTokens(normalised);
  if (!tokens.length) return true;
  return tokens.every((token) => isNavigationToken(token));
}

function shouldFilterNavKeyword(keyword: string): boolean {
  const normalised = formatKeywordDisplay(keyword);
  if (!normalised) return true;
  if (/\d/.test(normalised)) return true;
  if (isNavigationKeyword(normalised)) return true;
  return false;
}

function isRelevantSeed(stat: KeywordStat): boolean {
  const normalised = formatKeywordDisplay(stat.keyword);
  if (!normalised) return false;
  if (shouldFilterNavKeyword(normalised)) return false;
  return stat.score > 0;
}

function filterNavigationStats(stats: KeywordStat[]): KeywordStat[] {
  const seen = new Set<string>();
  const filtered: KeywordStat[] = [];
  for (const stat of stats) {
    const normalised = normaliseKeyword(stat.keyword);
    if (!normalised || seen.has(normalised)) continue;
    if (isNavigationKeyword(stat.keyword)) continue;
    seen.add(normalised);
    filtered.push(stat);
  }
  return filtered;
}

function filterNavigationStrings(strings: string[]): string[] {
  const seen = new Set<string>();
  const filtered: string[] = [];
  for (const value of strings) {
    const normalised = normaliseKeyword(value);
    if (!normalised || seen.has(normalised)) continue;
    if (isNavigationKeyword(normalised)) continue;
    if (!isMeaningfulKeyword(normalised)) continue;
    seen.add(normalised);
    filtered.push(normalised);
  }
  return filtered;
}

function didSenseCheckFallback(notes: string[]): boolean {
  if (!notes?.length) return false;
  return notes.some((note) =>
    /AI keyword validation|Sense check|Skipping AI sense check/i.test(note)
  );
}

interface KeywordRelevanceContext {
  businessTokens: Set<string>;
  locationTokens: Set<string>;
  contentTokens: Set<string>;
  datasetKeywords: Set<string>;
}

function buildKeywordRelevanceContext(params: {
  businessName: string;
  businessType: string;
  additionalNotes?: string;
  locationTerms: string[];
  siteKeywords: KeywordStat[];
  competitorKeywords: KeywordStat[];
  datasetKeywords: KeywordStat[];
}): KeywordRelevanceContext {
  const businessTokens = new Set<string>();
  addTokens(businessTokens, params.businessName);
  addTokens(businessTokens, params.businessType);
  addTokens(businessTokens, params.additionalNotes);

  const locationTokens = new Set<string>();
  params.locationTerms.forEach((term) => addTokens(locationTokens, term));

  const contentTokens = new Set<string>();
  const addContentTokens = (stat: KeywordStat) => {
    keywordTokens(stat.keyword).forEach((token) => {
      if (!isNavigationToken(token)) {
        contentTokens.add(token);
      }
    });
  };

  params.siteKeywords.forEach(addContentTokens);
  params.competitorKeywords.forEach(addContentTokens);
  params.datasetKeywords.forEach(addContentTokens);

  const datasetKeywords = new Set<string>();
  params.datasetKeywords.forEach((stat) => {
    const normalised = normaliseKeyword(stat.keyword);
    if (normalised) {
      datasetKeywords.add(normalised);
    }
  });

  return {
    businessTokens,
    locationTokens,
    contentTokens,
    datasetKeywords,
  };
}

function addTokens(target: Set<string>, value?: string) {
  keywordTokens(value).forEach((token) => {
    if (!isNavigationToken(token)) {
      target.add(token);
    }
  });
}

function filterStatsByRelevance(
  stats: KeywordStat[],
  context: KeywordRelevanceContext
): KeywordStat[] {
  const relevant = stats.filter((stat) =>
    isKeywordRelevantForContext(stat.keyword, context)
  );
  if (relevant.length) {
    return relevant;
  }
  const multiWordFallback = stats.filter(
    (stat) => keywordTokens(stat.keyword).length >= 2
  );
  return multiWordFallback.length ? multiWordFallback : stats;
}

function isKeywordRelevantForContext(
  keyword: string,
  context: KeywordRelevanceContext
): boolean {
  const tokens = keywordTokens(keyword);
  if (!tokens.length) return false;

  const normalised = normaliseKeyword(keyword);
  if (normalised && context.datasetKeywords.has(normalised)) {
    return true;
  }

  const isSingleWord = tokens.length === 1;

  const matchesCore = tokens.some((token) => CORE_SERVICE_TOKENS.has(token));
  const matchesBusiness = tokens.some((token) => context.businessTokens.has(token));
  const matchesLocation = tokens.some((token) => context.locationTokens.has(token));
  const matchesContent = tokens.some((token) => context.contentTokens.has(token));

  if (isSingleWord) {
    if (matchesCore && (matchesBusiness || matchesLocation)) {
      return true;
    }
    if (matchesLocation && matchesBusiness) {
      return true;
    }
    return false;
  }

  if (matchesCore && (matchesBusiness || matchesLocation || matchesContent)) {
    return true;
  }

  if (matchesBusiness && (matchesLocation || matchesContent)) {
    return true;
  }

  if (matchesLocation && (matchesBusiness || matchesContent || matchesCore)) {
    return true;
  }

  if (matchesContent && matchesCore) {
    return true;
  }

  return false;
}

const EXCLUDED_KEYWORDS = new Set([
  "",
  "nbsp",
  "nbsp nbsp",
  "technical storage",
  "storage access",
  "strictly necessary",
  "legitimate interest",
  "cookie consent",
  "cookie preferences",
  "access",
  "preferences",
]);

function formatKeywordDisplay(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9\s\-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isMeaningfulKeyword(keyword: string): boolean {
  if (!keyword) return false;
  if (keyword.length < 3) return false;
  if (EXCLUDED_KEYWORDS.has(keyword)) return false;
  return true;
}

function capitalise(value: string): string {
  return value
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export const generatorTestUtils = {
  buildMetadata,
  buildContentGap,
  defaultCallToAction,
  describeOpportunity,
  recommendAction,
  inferIntent,
  shouldSkipArchitectureSlug,
  isNavigationKeyword,
  filterStatsByRelevance,
  buildKeywordRelevanceContext,
};
