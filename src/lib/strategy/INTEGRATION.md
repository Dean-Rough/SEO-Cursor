# Phase 2 Integration Guide

This document explains how to integrate the Phase 2 Strategy module with the existing SEO Wizard codebase.

## Quick Start

```typescript
import { generateExampleStrategy, printStrategyReport } from "@/lib/strategy/example";

// Run the example to see the full pipeline
const report = generateExampleStrategy();
printStrategyReport(report);
```

## Integration with Existing Generator

The strategy module is designed to slot between intelligence gathering and content generation in the main flow.

### Current Flow (Before Phase 2)

```
Input → Crawler → Analysis → Keyword Strategy → Metadata Plans → Report
```

### New Flow (With Phase 2)

```
Input → Intelligence (Phase 1) → Strategy (Phase 2) → Blueprints (Phase 3) → Generation (Phase 4) → Report
```

## Connecting to Existing Code

### Step 1: Import Strategy Module

In `/src/lib/generator.ts`, add:

```typescript
import {
  clusterKeywords,
  mapKeywordsToPages,
  identifyPageGaps,
  calculateContentTargets,
  buildLinkingBlueprint,
  type StrategyReport,
  type ContentDepthMetrics,
  type CompetitorPageInventory,
} from "./strategy";
```

### Step 2: Build Competitor Inventory from Existing Data

The existing generator already crawls competitors. Transform that data:

```typescript
// In generator.ts, after competitor crawling
function buildCompetitorInventory(
  competitorSnapshots: SiteSnapshot[]
): CompetitorPageInventory {
  const allPages: CompetitorPageInventory["allPages"] = [];
  const competitorUrls: string[][] = [];

  competitorSnapshots.forEach((snapshot, index) => {
    const urls = snapshot.pages.map((p) => p.url);
    competitorUrls.push(urls);

    snapshot.pages.forEach((page) => {
      allPages.push({
        url: page.url,
        competitor: snapshot.domain || `Competitor ${index + 1}`,
        pageType: inferPageType(page.url),
      });
    });
  });

  // Group by page type
  const commonPageTypes = new Map<string, string[]>();
  allPages.forEach((page) => {
    const existing = commonPageTypes.get(page.pageType) || [];
    existing.push(page.url);
    commonPageTypes.set(page.pageType, existing);
  });

  return {
    allPages,
    competitorUrls,
    commonPageTypes,
  };
}

function inferPageType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("/service")) return "service";
  if (lower.includes("/blog")) return "blog";
  if (lower.includes("/about")) return "about";
  if (lower.includes("/contact")) return "contact";
  if (lower.includes("/portfolio")) return "portfolio";
  if (lower.includes("/pricing")) return "pricing";
  return "other";
}
```

### Step 3: Build Content Depth Metrics

Calculate from competitor page analysis:

```typescript
function buildContentDepthMetrics(
  competitorSnapshots: SiteSnapshot[]
): ContentDepthMetrics {
  const allPages = competitorSnapshots.flatMap((s) => s.pages);

  const totalWordCount = allPages.reduce((sum, p) => sum + p.wordCount, 0);
  const averageWordCount = totalWordCount / allPages.length || 800;

  // Estimate sections from headings (rough heuristic)
  const averageSectionCount = 6; // Can be calculated from headings array

  // Estimate images (would need enhancement to crawler)
  const averageImageCount = 4; // Placeholder

  // FAQ presence (would need crawler enhancement)
  const faqPresence = 0.6; // Placeholder: 60% have FAQ

  return {
    averageWordCount,
    averageImageCount,
    averageSectionCount,
    faqPresence,
  };
}
```

### Step 4: Integrate into Main Flow

Update `generateSeoReport` function:

```typescript
export async function generateSeoReport(
  input: SiteInput
): Promise<SeoReport> {
  // ... existing crawling and analysis code ...

  // NEW: Build Phase 2 inputs
  const competitorInventory = buildCompetitorInventory(competitorSnapshots);
  const contentMetrics = buildContentDepthMetrics(competitorSnapshots);

  // NEW: Run Phase 2 Strategy
  const strategyReport = await generateStrategy({
    keywords: allKeywords,
    existingPages: targetSite.pages.map((p) => p.url),
    competitorInventory,
    contentMetrics,
  });

  // ... continue with existing report assembly ...

  return {
    ...existingReport,
    strategy: strategyReport, // Add to report
  };
}
```

### Step 5: Update SeoReport Type

In `/src/lib/types.ts`, add:

```typescript
import type { StrategyReport } from "./strategy/types";

export interface SeoReport {
  // ... existing fields ...
  strategy?: StrategyReport; // NEW: Phase 2 strategy output
}
```

## Data Flow Example

```typescript
// Phase 1 Intelligence (Existing)
const targetSite = await crawlSite(input.website);
const competitors = await crawlCompetitors(input.competitors);
const keywords = aggregateKeywords(targetSite, competitors, dataset);

// Phase 2 Strategy (NEW)
const clusters = clusterKeywords(keywords);
const mappings = mapKeywordsToPages(clusters, targetSite.pages, competitorPages);
const gaps = identifyPageGaps(targetSite.pages, competitorInventory, keywords);
const targets = calculateContentTargets(mappings, contentMetrics);
const linkingBlueprint = buildLinkingBlueprint(pageStrategies);

// Phase 3 Blueprints (Future)
// Will consume pageStrategies to create detailed wireframes

// Phase 4 Generation (Existing, Enhanced)
// Will use blueprints to generate copy instead of vague briefs
```

## Backward Compatibility

The strategy module is **additive only** - it doesn't modify existing functionality:

- ✅ Existing reports still work (strategy is optional)
- ✅ Existing keyword logic remains unchanged
- ✅ Existing crawler/analyzer untouched
- ✅ Can be enabled via feature flag

## Feature Flag (Optional)

Add to SiteInput:

```typescript
export interface SiteInput {
  // ... existing fields ...
  enableStrategy?: boolean; // NEW: Enable Phase 2 strategy
}
```

Then conditionally run:

```typescript
if (input.enableStrategy) {
  report.strategy = await generateStrategy(...);
}
```

## Testing Integration

Create test in `/tests/strategy-integration.test.ts`:

```typescript
import { generateSeoReport } from "@/lib/generator";
import { describe, it, expect } from "vitest";

describe("Strategy Integration", () => {
  it("should generate strategy when enabled", async () => {
    const input = {
      businessName: "Rough Ink",
      website: "https://example.com",
      businessType: "Tattoo Studio",
      competitors: ["https://competitor1.com"],
      enableStrategy: true,
    };

    const report = await generateSeoReport(input);

    expect(report.strategy).toBeDefined();
    expect(report.strategy?.keywordClusters).toBeInstanceOf(Array);
    expect(report.strategy?.pageStrategies).toBeInstanceOf(Array);
    expect(report.strategy?.pageGaps).toBeInstanceOf(Array);
  });

  it("should work without strategy (backward compatible)", async () => {
    const input = {
      businessName: "Rough Ink",
      website: "https://example.com",
      businessType: "Tattoo Studio",
      competitors: ["https://competitor1.com"],
    };

    const report = await generateSeoReport(input);

    expect(report).toBeDefined();
    expect(report.keywordOpportunities).toBeDefined();
    // Strategy is optional
  });
});
```

## Performance Considerations

Phase 2 adds minimal overhead:

- **Keyword clustering**: ~10-50ms for 100-500 keywords
- **Page mapping**: ~5-20ms for 20-50 pages
- **Gap analysis**: ~10-30ms for 50-200 competitor pages
- **Content targets**: ~5-10ms for 20-50 pages
- **Linking blueprint**: ~10-50ms for 20-50 pages

**Total: ~40-160ms** (negligible compared to crawling/API calls)

## Reporting Integration

Update `/src/lib/report-to-html.ts` to include strategy section:

```typescript
function renderStrategySection(strategy: StrategyReport): string {
  return `
    <section class="strategy-section">
      <h2>🎯 Strategic Planning</h2>

      <div class="keyword-clusters">
        <h3>Keyword Clusters</h3>
        ${strategy.keywordClusters.map(renderCluster).join("")}
      </div>

      <div class="page-strategies">
        <h3>Page Strategies</h3>
        ${strategy.pageStrategies.map(renderPageStrategy).join("")}
      </div>

      <div class="page-gaps">
        <h3>Content Gaps</h3>
        ${strategy.pageGaps.map(renderPageGap).join("")}
      </div>

      <div class="internal-linking">
        <h3>Internal Linking Blueprint</h3>
        ${renderLinkingBlueprint(strategy.internalLinkingBlueprint)}
      </div>
    </section>
  `;
}
```

## Migration Path

### Phase 1: Add Strategy Module (Now)

- ✅ Create `/src/lib/strategy/` (DONE)
- Add imports to generator
- Build adapter functions (inventory, metrics)
- Add feature flag

### Phase 2: Enhance Reporting

- Update HTML report templates
- Add strategy visualizations
- Export strategy as JSON/CSV

### Phase 3: Connect to Blueprints

- Phase 3 will consume `PageStrategy` objects
- Generate detailed wireframes from strategies
- Pass to Phase 4 content generation

### Phase 4: Full Integration

- Make strategy default (remove feature flag)
- Deprecate old keyword logic
- Full end-to-end testing

## Troubleshooting

### Issue: Type errors with KeywordStat

**Solution**: Ensure Phase 1 outputs match expected `KeywordStat` interface. Add adapters if needed:

```typescript
function adaptKeywordStat(oldFormat: any): KeywordStat {
  return {
    keyword: oldFormat.keyword,
    score: oldFormat.score,
    density: oldFormat.density,
    volume: oldFormat.volume || 0,
    difficulty: oldFormat.difficulty || 30,
    intent: inferIntent(oldFormat),
    source: oldFormat.source || "site",
  };
}
```

### Issue: Empty competitor inventory

**Solution**: Check competitor crawling is working. Add fallback:

```typescript
if (competitorInventory.allPages.length === 0) {
  console.warn("No competitor data available, using defaults");
  return generateStrategyWithDefaults(keywords, existingPages);
}
```

### Issue: Strategy taking too long

**Solution**: Add timeouts and limits:

```typescript
const clusters = clusterKeywords(keywords, {
  maxClusters: 15, // Limit for performance
});
```

## Next Steps

1. ✅ Phase 2 modules created (DONE)
2. Enhance crawler to extract images and FAQ presence
3. Add strategy section to HTML report
4. Create Phase 3 blueprint modules
5. Connect Phase 3 to Phase 2 outputs
6. Update Phase 4 generation to use blueprints

## Questions?

See `/docs/tasks.md` for overall architecture or `README.md` in this directory for module details.
