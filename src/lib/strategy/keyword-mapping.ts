import type { KeywordCluster, PageKeywordMapping } from "./types";

/**
 * Maps keyword clusters to pages (existing or new)
 *
 * Strategy:
 * 1. Match clusters to existing pages based on URL/content similarity
 * 2. For unmatched clusters, generate new page URLs
 * 3. Assign primary keyword + 3-5 secondary keywords per page
 * 4. Detect and resolve keyword cannibalization
 *
 * @param clusters - Keyword clusters to map
 * @param existingPages - URLs of existing pages on target site
 * @param competitorPages - URLs from competitor sites (for inspiration)
 * @returns Array of page-keyword mappings
 */
export function mapKeywordsToPages(
  clusters: KeywordCluster[],
  existingPages: string[],
  competitorPages: string[] = []
): PageKeywordMapping[] {
  const mappings: PageKeywordMapping[] = [];
  const usedUrls = new Set<string>();

  // Sort clusters by priority (volume * keyword count)
  const sortedClusters = [...clusters].sort((a, b) => {
    const priorityA = a.totalVolume * a.keywords.length;
    const priorityB = b.totalVolume * b.keywords.length;
    return priorityB - priorityA;
  });

  for (const cluster of sortedClusters) {
    // Try to match to existing page
    const matchedUrl = findMatchingPage(
      cluster,
      existingPages.filter((url) => !usedUrls.has(url))
    );

    let url: string;
    let status: "create" | "optimize" | "keep";

    if (matchedUrl) {
      url = matchedUrl;
      status = "optimize";
      usedUrls.add(url);
    } else {
      // Generate new page URL
      url = generatePageUrl(cluster, competitorPages);
      status = "create";
    }

    // Determine page type
    const pageType = inferPageType(url, cluster);

    // Select secondary keywords (top 3-5 by volume, excluding primary)
    const secondaryKeywords = cluster.keywords
      .filter((kw) => kw.keyword !== cluster.primaryKeyword)
      .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
      .slice(0, 5)
      .map((kw) => kw.keyword);

    mappings.push({
      url,
      pageType,
      cluster,
      primaryKeyword: cluster.primaryKeyword,
      secondaryKeywords,
      status,
    });
  }

  // Add existing pages without clusters (mark as "keep")
  const unmappedPages = existingPages.filter((url) => !usedUrls.has(url));
  for (const url of unmappedPages) {
    const pageType = inferPageType(url);

    // Create minimal cluster for existing page
    mappings.push({
      url,
      pageType,
      cluster: {
        id: `existing-${url}`,
        name: pageType.charAt(0).toUpperCase() + pageType.slice(1),
        keywords: [],
        primaryKeyword: "",
        totalVolume: 0,
        averageDifficulty: 0,
      },
      primaryKeyword: "",
      secondaryKeywords: [],
      status: "keep",
    });
  }

  return mappings;
}

/**
 * Finds existing page that best matches a keyword cluster
 */
function findMatchingPage(
  cluster: KeywordCluster,
  existingPages: string[]
): string | null {
  if (existingPages.length === 0) return null;

  // Extract meaningful tokens from cluster
  const clusterTokens = extractTokens(cluster.primaryKeyword);

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const url of existingPages) {
    const urlTokens = extractTokens(url);
    const score = calculateMatchScore(clusterTokens, urlTokens);

    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestMatch = url;
    }
  }

  return bestMatch;
}

/**
 * Generates a URL for a new page based on keyword cluster
 */
function generatePageUrl(
  cluster: KeywordCluster,
  competitorPages: string[] = []
): string {
  // Check if competitors have similar pages
  const similarCompetitorUrl = findSimilarCompetitorUrl(
    cluster,
    competitorPages
  );

  if (similarCompetitorUrl) {
    // Use competitor URL pattern as inspiration
    const path = new URL(similarCompetitorUrl).pathname;
    return path;
  }

  // Generate URL from primary keyword
  const slug = cluster.primaryKeyword
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  // Determine appropriate prefix based on intent
  const prefix = determineUrlPrefix(cluster);

  return `${prefix}${slug}`;
}

/**
 * Finds competitor URL that matches cluster topic
 */
function findSimilarCompetitorUrl(
  cluster: KeywordCluster,
  competitorPages: string[]
): string | null {
  const clusterTokens = extractTokens(cluster.primaryKeyword);

  for (const url of competitorPages) {
    const urlTokens = extractTokens(url);
    const score = calculateMatchScore(clusterTokens, urlTokens);

    if (score > 0.5) {
      return url;
    }
  }

  return null;
}

/**
 * Determines URL prefix based on cluster intent and keywords
 */
function determineUrlPrefix(cluster: KeywordCluster): string {
  const keyword = cluster.primaryKeyword.toLowerCase();

  // Blog/informational content
  if (
    cluster.intent === "informational" ||
    keyword.includes("how to") ||
    keyword.includes("what is") ||
    keyword.includes("guide") ||
    keyword.includes("tips")
  ) {
    return "/blog/";
  }

  // Service pages
  if (
    cluster.intent === "transactional" ||
    cluster.intent === "commercial" ||
    keyword.includes("service") ||
    keyword.includes("hire") ||
    keyword.includes("book")
  ) {
    return "/services/";
  }

  // Default to root level
  return "/";
}

/**
 * Infers page type from URL and optional cluster context
 */
function inferPageType(
  url: string,
  cluster?: KeywordCluster
): PageKeywordMapping["pageType"] {
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl === "/" || normalizedUrl === "/index") {
    return "homepage";
  }

  if (
    normalizedUrl.includes("/about") ||
    normalizedUrl.includes("/our-story") ||
    normalizedUrl.includes("/team")
  ) {
    return "about";
  }

  if (
    normalizedUrl.includes("/contact") ||
    normalizedUrl.includes("/get-in-touch")
  ) {
    return "contact";
  }

  if (
    normalizedUrl.includes("/blog") ||
    normalizedUrl.includes("/news") ||
    normalizedUrl.includes("/articles")
  ) {
    return "blog";
  }

  if (
    normalizedUrl.includes("/service") ||
    cluster?.intent === "transactional" ||
    cluster?.intent === "commercial"
  ) {
    return "service";
  }

  return "other";
}

/**
 * Extracts meaningful tokens from a string (URL or keyword)
 */
function extractTokens(text: string): Set<string> {
  const stopwords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "will",
    "with",
    "services",
    "blog",
  ]);

  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/[\s/-]+/)
    .filter((token) => token.length > 2 && !stopwords.has(token));

  return new Set(tokens);
}

/**
 * Calculates match score between two token sets
 */
function calculateMatchScore(tokens1: Set<string>, tokens2: Set<string>): number {
  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Detects keyword cannibalization (multiple pages targeting same primary keyword)
 *
 * @param mappings - Page keyword mappings to check
 * @returns Array of warnings about potential cannibalization
 */
export function detectKeywordCannibalization(
  mappings: PageKeywordMapping[]
): string[] {
  const warnings: string[] = [];
  const primaryKeywordMap = new Map<string, string[]>();

  // Group pages by primary keyword
  mappings.forEach((mapping) => {
    if (!mapping.primaryKeyword) return;

    const normalized = mapping.primaryKeyword.toLowerCase().trim();
    const pages = primaryKeywordMap.get(normalized) ?? [];
    pages.push(mapping.url);
    primaryKeywordMap.set(normalized, pages);
  });

  // Find duplicates
  primaryKeywordMap.forEach((pages, keyword) => {
    if (pages.length > 1) {
      warnings.push(
        `Keyword cannibalization detected: "${keyword}" is targeted by ${pages.length} pages: ${pages.join(", ")}`
      );
    }
  });

  return warnings;
}

/**
 * Resolves keyword cannibalization by reassigning keywords
 *
 * Strategy:
 * 1. For each duplicate primary keyword, keep it on the highest-priority page
 * 2. Move it to secondary keywords on other pages
 * 3. Promote a secondary keyword to primary on affected pages
 */
export function resolveKeywordCannibalization(
  mappings: PageKeywordMapping[]
): PageKeywordMapping[] {
  const primaryKeywordMap = new Map<string, PageKeywordMapping[]>();

  // Group mappings by primary keyword
  mappings.forEach((mapping) => {
    if (!mapping.primaryKeyword) return;

    const normalized = mapping.primaryKeyword.toLowerCase().trim();
    const group = primaryKeywordMap.get(normalized) ?? [];
    group.push(mapping);
    primaryKeywordMap.set(normalized, group);
  });

  // Resolve conflicts
  primaryKeywordMap.forEach((group, keyword) => {
    if (group.length <= 1) return;

    // Sort by priority (total volume + status weight)
    const sorted = group.sort((a, b) => {
      const priorityA =
        a.cluster.totalVolume + (a.status === "create" ? 1000 : 0);
      const priorityB =
        b.cluster.totalVolume + (b.status === "create" ? 1000 : 0);
      return priorityB - priorityA;
    });

    // Keep primary on first page, reassign on others
    for (let i = 1; i < sorted.length; i++) {
      const mapping = sorted[i];

      // Move current primary to secondary
      if (!mapping.secondaryKeywords.includes(mapping.primaryKeyword)) {
        mapping.secondaryKeywords.unshift(mapping.primaryKeyword);
      }

      // Promote best secondary to primary
      const newPrimary = mapping.cluster.keywords
        .filter(
          (kw) =>
            kw.keyword !== mapping.primaryKeyword &&
            !isPrimaryElsewhere(kw.keyword, mappings)
        )
        .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0];

      if (newPrimary) {
        mapping.primaryKeyword = newPrimary.keyword;
        mapping.secondaryKeywords = mapping.secondaryKeywords.filter(
          (kw) => kw !== newPrimary.keyword
        );
      }
    }
  });

  return mappings;
}

/**
 * Checks if a keyword is used as primary on any other page
 */
function isPrimaryElsewhere(
  keyword: string,
  mappings: PageKeywordMapping[]
): boolean {
  return mappings.some(
    (m) => m.primaryKeyword.toLowerCase() === keyword.toLowerCase()
  );
}

/**
 * Suggests alternative keywords for pages with weak primary keywords
 */
export function suggestAlternativeKeywords(
  mapping: PageKeywordMapping,
  allClusters: KeywordCluster[]
): string[] {
  const suggestions: string[] = [];

  // Look for related keywords in other clusters
  const pageTokens = extractTokens(mapping.url);

  allClusters.forEach((cluster) => {
    if (cluster.id === mapping.cluster.id) return;

    cluster.keywords.forEach((kw) => {
      const kwTokens = extractTokens(kw.keyword);
      const similarity = calculateMatchScore(pageTokens, kwTokens);

      if (similarity > 0.3 && (kw.volume ?? 0) > 50) {
        suggestions.push(kw.keyword);
      }
    });
  });

  return suggestions.slice(0, 5);
}
