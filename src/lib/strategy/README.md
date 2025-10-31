# Phase 2: Strategic Planning Module

This module transforms raw intelligence data (from Phase 1) into actionable SEO strategy and site architecture.

## Overview

The strategic planning layer consists of five interconnected modules:

1. **Keyword Clustering** - Groups related keywords into topical clusters
2. **Keyword-to-Page Mapping** - Assigns clusters to pages (existing or new)
3. **Page Gap Analysis** - Identifies missing pages compared to competitors
4. **Content Targets** - Calculates optimal content specifications per page
5. **Internal Linking** - Builds hub-spoke linking architecture

## Module Architecture

```
src/lib/strategy/
├── types.ts                    # All TypeScript interfaces
├── keyword-clustering.ts       # Semantic keyword grouping
├── keyword-mapping.ts          # Page-keyword assignment
├── page-gap-analysis.ts        # Competitor gap identification
├── content-targets.ts          # Content specification calculator
├── internal-linking.ts         # Linking blueprint generator
├── index.ts                    # Module exports
└── README.md                   # This file
```

## Usage Examples

### 1. Keyword Clustering

Groups related keywords using token-based similarity:

```typescript
import { clusterKeywords } from "@/lib/strategy";
import type { KeywordStat } from "@/lib/types";

const keywords: KeywordStat[] = [
  { keyword: "custom tattoo design", score: 8, density: 2.5, volume: 1200, difficulty: 35 },
  { keyword: "bespoke tattoo", score: 7, density: 2.1, volume: 800, difficulty: 30 },
  { keyword: "unique tattoo ideas", score: 6, density: 1.8, volume: 950, difficulty: 28 },
  { keyword: "tattoo aftercare", score: 9, density: 3.2, volume: 2200, difficulty: 25 },
  { keyword: "tattoo healing", score: 7, density: 2.0, volume: 1500, difficulty: 22 },
];

const clusters = clusterKeywords(keywords, {
  minClusterSize: 2,
  similarityThreshold: 0.3,
  maxClusters: 20,
});

console.log(clusters);
// [
//   {
//     id: "cluster-1",
//     name: "Custom Tattoo Design",
//     primaryKeyword: "custom tattoo design",
//     keywords: [/* 3 related keywords */],
//     totalVolume: 2950,
//     averageDifficulty: 31,
//     intent: "commercial"
//   },
//   {
//     id: "cluster-2",
//     name: "Tattoo Aftercare",
//     primaryKeyword: "tattoo aftercare",
//     keywords: [/* 2 related keywords */],
//     totalVolume: 3700,
//     averageDifficulty: 23.5,
//     intent: "informational"
//   }
// ]
```

**Algorithm**: Uses Jaccard similarity on tokenized keywords. Seeds clusters with high-volume keywords first.

### 2. Keyword-to-Page Mapping

Assigns keyword clusters to pages and detects cannibalization:

```typescript
import { mapKeywordsToPages, detectKeywordCannibalization } from "@/lib/strategy";

const existingPages = [
  "/",
  "/services/custom-tattoos",
  "/contact",
];

const mappings = mapKeywordsToPages(
  clusters,
  existingPages,
  competitorPages
);

console.log(mappings);
// [
//   {
//     url: "/services/custom-tattoos",
//     pageType: "service",
//     cluster: clusters[0],
//     primaryKeyword: "custom tattoo design",
//     secondaryKeywords: ["bespoke tattoo", "unique tattoo ideas"],
//     status: "optimize"
//   },
//   {
//     url: "/blog/tattoo-aftercare-guide",
//     pageType: "blog",
//     cluster: clusters[1],
//     primaryKeyword: "tattoo aftercare",
//     secondaryKeywords: ["tattoo healing", "new tattoo care"],
//     status: "create"
//   }
// ]

const warnings = detectKeywordCannibalization(mappings);
// Returns array of warnings if multiple pages target same primary keyword
```

**Algorithm**: Matches clusters to existing pages by URL similarity. Generates new URLs for unmatched clusters. Checks for duplicate primary keywords.

### 3. Page Gap Analysis

Identifies missing pages by analyzing competitor site structures:

```typescript
import { identifyPageGaps, prioritizeGaps } from "@/lib/strategy";

const targetPages = ["/", "/services", "/contact"];

const competitorInventory = {
  allPages: [
    { url: "https://competitor1.com/services/tattoo-removal", competitor: "Competitor 1", pageType: "service" },
    { url: "https://competitor2.com/services/tattoo-removal", competitor: "Competitor 2", pageType: "service" },
    { url: "https://competitor3.com/services/cover-ups", competitor: "Competitor 3", pageType: "service" },
  ],
  competitorUrls: [
    ["https://competitor1.com/services/tattoo-removal", "https://competitor1.com/gallery"],
    ["https://competitor2.com/services/tattoo-removal", "https://competitor2.com/pricing"],
  ],
  commonPageTypes: new Map([["service", ["tattoo-removal", "cover-ups"]]]),
};

const gaps = identifyPageGaps(targetPages, competitorInventory, keywords);

console.log(gaps);
// [
//   {
//     suggestedUrl: "/services/tattoo-removal",
//     pageType: "service",
//     competitorCount: 2,
//     exampleUrls: ["https://competitor1.com/services/tattoo-removal", ...],
//     estimatedVolume: 1800,
//     priority: 9,
//     reasoning: "2 competitors have this page type. Service pages are critical for conversions and local SEO."
//   }
// ]
```

**Algorithm**: Extracts URL patterns from competitors, compares to target site, prioritizes by competitor prevalence and keyword volume.

### 4. Content Targets

Calculates optimal content specifications:

```typescript
import { calculateContentTargets, validateContentTargets } from "@/lib/strategy";

const competitorMetrics = {
  averageWordCount: 1200,
  averageImageCount: 5,
  averageSectionCount: 6,
  faqPresence: 0.7, // 70% of competitors have FAQ
};

const targets = calculateContentTargets(mappings, competitorMetrics);

console.log(targets);
// [
//   {
//     url: "/services/custom-tattoos",
//     wordCount: 1584,  // 1200 * 1.2 (service multiplier) * 1.1 (exceed competition)
//     sectionCount: 7,
//     imageCount: 7,
//     includeFAQ: true,
//     competitorBenchmark: {
//       averageWordCount: 1200,
//       averageImageCount: 5
//     }
//   }
// ]

const issues = validateContentTargets(targets);
// Returns warnings for unrealistic targets
```

**Algorithm**: Uses competitor benchmarks + page type adjustments + keyword difficulty modifiers. Adds 10% to exceed competition.

### 5. Internal Linking Blueprint

Generates hub-spoke linking architecture:

```typescript
import { buildLinkingBlueprint, identifyHubPages } from "@/lib/strategy";

// First, enrich mappings with content targets to create PageStrategy objects
const pageStrategies = mappings.map((mapping, index) => ({
  ...mapping,
  priority: 10 - index, // Higher for first pages
  contentTarget: targets.find(t => t.url === mapping.url)!,
  internalLinks: { inbound: [], outbound: [] }, // Will be populated
}));

const blueprint = buildLinkingBlueprint(pageStrategies);

console.log(blueprint);
// {
//   links: [
//     {
//       fromUrl: "/",
//       toUrl: "/services/custom-tattoos",
//       anchorText: "custom tattoo design",
//       context: "Main navigation or hero section"
//     },
//     {
//       fromUrl: "/blog/tattoo-aftercare-guide",
//       toUrl: "/services/custom-tattoos",
//       anchorText: "custom tattoo design services",
//       context: "In CTA section at end of article"
//     }
//   ],
//   hubPages: ["/", "/services/custom-tattoos"],
//   spokePages: ["/blog/tattoo-aftercare-guide", "/contact"]
// }
```

**Algorithm**: Identifies hubs by volume + priority + page type. Creates logical linking patterns: homepage → hubs, hubs ↔ hubs, spokes → hubs, blog → services.

## Complete Strategy Generation Example

Here's how to use all modules together:

```typescript
import {
  clusterKeywords,
  mapKeywordsToPages,
  identifyPageGaps,
  calculateContentTargets,
  buildLinkingBlueprint,
  type StrategyReport,
} from "@/lib/strategy";

async function generateStrategy(
  keywords: KeywordStat[],
  existingPages: string[],
  competitorData: {
    pages: string[];
    inventory: CompetitorPageInventory;
    metrics: ContentDepthMetrics;
  }
): Promise<StrategyReport> {
  // 1. Cluster keywords
  const clusters = clusterKeywords(keywords);

  // 2. Map to pages
  const mappings = mapKeywordsToPages(
    clusters,
    existingPages,
    competitorData.pages
  );

  // 3. Identify gaps
  const gaps = identifyPageGaps(
    existingPages,
    competitorData.inventory,
    keywords
  );

  // 4. Calculate content targets
  const targets = calculateContentTargets(mappings, competitorData.metrics);

  // 5. Build page strategies
  const pageStrategies = mappings.map((mapping) => ({
    ...mapping,
    priority: calculatePriority(mapping),
    contentTarget: targets.find((t) => t.url === mapping.url)!,
    internalLinks: { inbound: [], outbound: [] },
  }));

  // 6. Generate linking blueprint
  const linkingBlueprint = buildLinkingBlueprint(pageStrategies);

  // 7. Assemble report
  return {
    keywordClusters: clusters,
    pageStrategies,
    pageGaps: gaps,
    internalLinkingBlueprint: linkingBlueprint,
    summary: {
      totalPages: pageStrategies.length,
      pagesToCreate: pageStrategies.filter((p) => p.status === "create").length,
      pagesToOptimize: pageStrategies.filter((p) => p.status === "optimize").length,
      totalKeywordClusters: clusters.length,
      estimatedWorkload: estimateWorkload(pageStrategies),
    },
  };
}

function calculatePriority(mapping: PageKeywordMapping): number {
  let score = 0;
  score += Math.min(mapping.cluster.totalVolume / 200, 5);
  score += mapping.status === "create" ? 3 : 1;
  score += mapping.pageType === "service" ? 2 : 0;
  return Math.max(1, Math.min(10, Math.round(score)));
}

function estimateWorkload(strategies: PageStrategy[]): string {
  const createCount = strategies.filter((s) => s.status === "create").length;
  const optimizeCount = strategies.filter((s) => s.status === "optimize").length;

  // 1 week per new page, 0.5 weeks per optimization
  const weeks = Math.ceil(createCount * 1 + optimizeCount * 0.5);

  return `${weeks}-${Math.ceil(weeks * 1.5)} weeks`;
}
```

## Integration with Existing Codebase

### Phase 1 (Intelligence) → Phase 2 (Strategy)

```typescript
// Phase 1 provides:
// - Keywords from site crawl and competitor analysis
// - Existing pages list
// - Competitor page inventory
// - Content depth metrics

// Phase 2 consumes this data and produces:
// - Keyword clusters
// - Page-keyword mappings
// - Content gap priorities
// - Content targets
// - Internal linking blueprint
```

### Phase 2 (Strategy) → Phase 3 (Blueprints)

```typescript
// Phase 3 will consume Phase 2 outputs:
// - PageStrategy objects → detailed wireframes
// - ContentTarget → section structure
// - InternalLink → specific link placements
// - KeywordCluster → keyword density targets
```

## Design Decisions & Trade-offs

### 1. Clustering Algorithm

**Choice**: Token-based Jaccard similarity (not ML/embeddings)

**Rationale**:
- Fast and deterministic
- No external API calls (cost/latency)
- Works well for keyword phrases
- Easy to debug and tune

**Trade-off**: Less sophisticated than semantic embeddings, but 80% as effective for SEO keywords.

### 2. Page Mapping Strategy

**Choice**: Greedy matching (high-volume clusters first)

**Rationale**:
- Ensures important keywords get dedicated pages
- Simple and predictable
- Easy to understand for users

**Trade-off**: May miss some optimal mappings, but cannibalization detection catches issues.

### 3. Content Targets Formula

**Choice**: Competitor average × page type multiplier × 1.1

**Rationale**:
- Data-driven (uses actual benchmarks)
- Adjustable for different page types
- 10% buffer ensures we exceed competition

**Trade-off**: Assumes longer = better, which isn't always true, but generally safe for SEO.

### 4. Internal Linking Model

**Choice**: Hub-spoke topology

**Rationale**:
- Proven SEO architecture (topic clusters)
- Clear hierarchy for link equity
- Scales well with site growth

**Trade-off**: Less flexible than full mesh, but much cleaner and easier to implement.

## Key Algorithms

### Keyword Clustering (keyword-clustering.ts)

1. Tokenize all keywords (remove stopwords)
2. Sort by volume (highest first)
3. For each unassigned keyword:
   - Start new cluster with this keyword as seed
   - Find similar keywords (Jaccard > threshold)
   - Add to cluster
4. Consolidate small clusters into larger ones
5. Generate descriptive cluster names from common tokens

**Time Complexity**: O(n²) where n = number of keywords (acceptable for n < 1000)

### Page Gap Analysis (page-gap-analysis.ts)

1. Extract URL patterns from all competitor pages
2. Group by pattern (e.g., "services/tattoo-removal")
3. Count competitor prevalence per pattern
4. Compare to target site pages
5. Prioritize gaps by: `competitorCount × 4 + volumeScore × 3 + pageTypeWeight × 3`
6. Return sorted by priority

**Time Complexity**: O(n log n) where n = total competitor pages

### Internal Linking (internal-linking.ts)

1. Identify hub pages by score: `volume/100 + pageTypeWeight + priority×3`
2. Create homepage → hubs links
3. Create hub ↔ hub links (top 3 related)
4. Create spoke → hub links (all spokes link to 2-3 hubs)
5. Create blog → service conversion links
6. Add universal links (all → contact)
7. Deduplicate and validate

**Time Complexity**: O(n²) where n = number of pages (acceptable for n < 100)

## Testing Strategy

Each module should be tested with:

1. **Unit tests**: Core functions (clustering, similarity, prioritization)
2. **Integration tests**: Full pipeline with sample data
3. **Edge cases**: Empty inputs, single keyword, no competitors
4. **Validation tests**: Output quality checks

Example test:

```typescript
import { clusterKeywords } from "./keyword-clustering";

describe("clusterKeywords", () => {
  it("should group related keywords", () => {
    const keywords = [
      { keyword: "custom tattoo", score: 8, density: 2, volume: 1000 },
      { keyword: "tattoo custom", score: 7, density: 2, volume: 800 },
      { keyword: "cake recipe", score: 6, density: 1, volume: 500 },
    ];

    const clusters = clusterKeywords(keywords);

    expect(clusters).toHaveLength(2);
    expect(clusters[0].keywords).toHaveLength(2);
    expect(clusters[0].name).toMatch(/tattoo/i);
  });
});
```

## Performance Considerations

- **Keyword clustering**: Cache results, skip re-clustering unless keywords change
- **Page mapping**: Memoize URL similarity calculations
- **Gap analysis**: Index competitor URLs by pattern for O(1) lookups
- **Linking blueprint**: Pre-compute page relationships once

## Future Enhancements

1. **ML-based clustering**: Use OpenAI embeddings for semantic similarity
2. **Dynamic thresholds**: Auto-tune similarity thresholds based on dataset
3. **Historical data**: Learn from past strategy performance
4. **A/B testing**: Generate multiple strategies, compare predicted outcomes
5. **Visual output**: Generate site architecture diagrams

## Questions?

See the main project docs at `/docs/tasks.md` for context on how this fits into the overall system.
