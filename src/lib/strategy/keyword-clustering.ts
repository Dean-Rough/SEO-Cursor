import type { KeywordStat } from "../types";
import type { KeywordCluster } from "./types";

/**
 * Groups related keywords into semantic clusters using token-based similarity
 *
 * Algorithm:
 * 1. Tokenize each keyword into meaningful terms (remove stopwords)
 * 2. Calculate similarity scores between keywords based on shared tokens
 * 3. Use greedy clustering to group similar keywords together
 * 4. Generate cluster names from most common terms
 *
 * @param keywords - Array of keyword statistics to cluster
 * @param options - Clustering configuration
 * @returns Array of keyword clusters
 */
export function clusterKeywords(
  keywords: KeywordStat[],
  options: {
    minClusterSize?: number;
    similarityThreshold?: number;
    maxClusters?: number;
  } = {}
): KeywordCluster[] {
  const {
    minClusterSize = 2,
    similarityThreshold = 0.3,
    maxClusters = 20,
  } = options;

  if (keywords.length === 0) return [];

  // Tokenize all keywords
  const tokenized = keywords.map((kw) => ({
    keyword: kw,
    tokens: tokenizeKeyword(kw.keyword),
  }));

  // Build clusters using greedy algorithm
  const clusters: Array<{
    keywords: KeywordStat[];
    tokens: Set<string>;
  }> = [];

  const assigned = new Set<number>();

  // Sort by volume (highest first) to ensure primary keywords seed clusters
  const sortedIndices = tokenized
    .map((_, idx) => idx)
    .sort((a, b) => {
      const volA = tokenized[a].keyword.volume ?? 0;
      const volB = tokenized[b].keyword.volume ?? 0;
      return volB - volA;
    });

  for (const idx of sortedIndices) {
    if (assigned.has(idx)) continue;
    if (clusters.length >= maxClusters) break;

    const seed = tokenized[idx];
    const cluster = {
      keywords: [seed.keyword],
      tokens: new Set(seed.tokens),
    };

    assigned.add(idx);

    // Find similar keywords to add to this cluster
    for (let j = 0; j < tokenized.length; j++) {
      if (assigned.has(j)) continue;

      const candidate = tokenized[j];
      const similarity = calculateSimilarity(seed.tokens, candidate.tokens);

      if (similarity >= similarityThreshold) {
        cluster.keywords.push(candidate.keyword);
        candidate.tokens.forEach((token) => cluster.tokens.add(token));
        assigned.add(j);
      }
    }

    // Only keep clusters that meet minimum size
    if (cluster.keywords.length >= minClusterSize) {
      clusters.push(cluster);
    }
  }

  // Handle orphan keywords (not clustered) - create single-keyword clusters for high-value terms
  const orphans = tokenized.filter((_, idx) => !assigned.has(idx));
  for (const orphan of orphans) {
    if ((orphan.keyword.volume ?? 0) > 100 || orphan.keyword.score > 5) {
      clusters.push({
        keywords: [orphan.keyword],
        tokens: new Set(orphan.tokens),
      });
    }
  }

  // Convert to KeywordCluster format
  return clusters.map((cluster, index) =>
    buildKeywordCluster(cluster.keywords, `cluster-${index + 1}`)
  );
}

/**
 * Tokenizes a keyword into meaningful terms, removing stopwords
 */
function tokenizeKeyword(keyword: string): string[] {
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
  ]);

  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

/**
 * Calculates Jaccard similarity between two token sets
 */
function calculateSimilarity(tokens1: string[], tokens2: string[]): number {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Builds a KeywordCluster from a group of keywords
 */
function buildKeywordCluster(
  keywords: KeywordStat[],
  id: string
): KeywordCluster {
  // Find primary keyword (highest volume)
  const primaryKeyword = keywords.reduce((best, current) => {
    const bestVol = best.volume ?? 0;
    const currentVol = current.volume ?? 0;
    return currentVol > bestVol ? current : best;
  });

  // Calculate totals
  const totalVolume = keywords.reduce(
    (sum, kw) => sum + (kw.volume ?? 0),
    0
  );
  const averageDifficulty =
    keywords.reduce((sum, kw) => sum + (kw.difficulty ?? 0), 0) /
    keywords.length;

  // Determine dominant intent
  const intentCounts = new Map<string, number>();
  keywords.forEach((kw) => {
    if (kw.intent) {
      intentCounts.set(kw.intent, (intentCounts.get(kw.intent) ?? 0) + 1);
    }
  });
  const dominantIntent = [...intentCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] as KeywordCluster["intent"];

  // Generate cluster name
  const name = generateClusterName(keywords);

  return {
    id,
    name,
    keywords,
    primaryKeyword: primaryKeyword.keyword,
    totalVolume,
    averageDifficulty,
    intent: dominantIntent,
  };
}

/**
 * Generates a human-readable name for a keyword cluster
 *
 * Strategy:
 * 1. Extract all tokens from keywords
 * 2. Find most common meaningful terms
 * 3. Combine into a descriptive phrase
 * 4. Capitalize appropriately
 */
export function generateClusterName(keywords: KeywordStat[]): string {
  // Tokenize all keywords
  const allTokens: string[] = [];
  keywords.forEach((kw) => {
    const tokens = tokenizeKeyword(kw.keyword);
    allTokens.push(...tokens);
  });

  // Count token frequency
  const tokenFrequency = new Map<string, number>();
  allTokens.forEach((token) => {
    tokenFrequency.set(token, (tokenFrequency.get(token) ?? 0) + 1);
  });

  // Get top 3 most common tokens
  const topTokens = [...tokenFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);

  if (topTokens.length === 0) {
    return "Miscellaneous Keywords";
  }

  // Try to find a representative keyword that contains top tokens
  const representative = keywords.find((kw) => {
    const kwTokens = tokenizeKeyword(kw.keyword);
    return topTokens.some((token) => kwTokens.includes(token));
  });

  if (representative) {
    // Use the representative keyword as base, capitalize each word
    return representative.keyword
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Fallback: combine top tokens
  return topTokens
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

/**
 * Finds clusters that are related (share significant overlap)
 * Useful for identifying potential keyword cannibalization
 */
export function findRelatedClusters(
  clusters: KeywordCluster[],
  similarityThreshold: number = 0.25
): Array<{ cluster1: string; cluster2: string; similarity: number }> {
  const related: Array<{
    cluster1: string;
    cluster2: string;
    similarity: number;
  }> = [];

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const tokens1 = clusters[i].keywords.flatMap((kw) =>
        tokenizeKeyword(kw.keyword)
      );
      const tokens2 = clusters[j].keywords.flatMap((kw) =>
        tokenizeKeyword(kw.keyword)
      );

      const similarity = calculateSimilarity(tokens1, tokens2);

      if (similarity >= similarityThreshold) {
        related.push({
          cluster1: clusters[i].name,
          cluster2: clusters[j].name,
          similarity,
        });
      }
    }
  }

  return related.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Re-clusters keywords by merging small clusters with larger related ones
 */
export function consolidateClusters(
  clusters: KeywordCluster[],
  minSize: number = 3
): KeywordCluster[] {
  const large = clusters.filter((c) => c.keywords.length >= minSize);
  const small = clusters.filter((c) => c.keywords.length < minSize);

  // Try to merge small clusters into large ones
  small.forEach((smallCluster) => {
    let bestMatch: KeywordCluster | undefined = undefined;
    let bestSimilarity = 0;

    const smallTokens = smallCluster.keywords.flatMap((kw) =>
      tokenizeKeyword(kw.keyword)
    );

    large.forEach((largeCluster) => {
      const largeTokens = largeCluster.keywords.flatMap((kw) =>
        tokenizeKeyword(kw.keyword)
      );

      const similarity = calculateSimilarity(smallTokens, largeTokens);

      if (similarity > bestSimilarity && similarity > 0.2) {
        bestMatch = largeCluster;
        bestSimilarity = similarity;
      }
    });

    if (bestMatch !== undefined) {
      // Merge into best match
      const matchedCluster: KeywordCluster = bestMatch;
      matchedCluster.keywords.push(...smallCluster.keywords);
      matchedCluster.totalVolume += smallCluster.totalVolume;
      matchedCluster.averageDifficulty =
        (matchedCluster.averageDifficulty * (matchedCluster.keywords.length - smallCluster.keywords.length) +
          smallCluster.averageDifficulty * smallCluster.keywords.length) /
        matchedCluster.keywords.length;

      // Recalculate primary keyword if needed
      const newPrimary = matchedCluster.keywords.reduce((best, current) => {
        const bestVol = best.volume ?? 0;
        const currentVol = current.volume ?? 0;
        return currentVol > bestVol ? current : best;
      });
      matchedCluster.primaryKeyword = newPrimary.keyword;
    } else {
      // Keep as separate cluster even if small
      large.push(smallCluster);
    }
  });

  return large;
}
