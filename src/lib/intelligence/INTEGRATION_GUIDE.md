# Integration Guide: Intelligence Module with Generator

This guide explains how to integrate the intelligence gathering modules with the existing `generator.ts` workflow.

## Overview

The intelligence module provides enhanced data collection that can be used throughout the SEO report generation pipeline. Here's how to integrate it step-by-step.

## Integration Points

### 1. Enhanced Page Crawling

**Location:** Early in `generateSeoReport()` function

**Current Code:**
```typescript
const targetPages = await crawlSite({
  startUrl: input.website,
  limit: 20,
  maxDepth: 3,
});
```

**Enhanced Code:**
```typescript
import { analyzePageEnhanced } from './intelligence';

// Crawl with base crawler
const targetPages = await crawlSite({
  startUrl: input.website,
  limit: 20,
  maxDepth: 3,
});

// Enhance with intelligence
const targetEnhanced = await Promise.all(
  targetPages
    .filter(page => page.status === 'ok')
    .map(async (page) => {
      const result = await fetchPageHtml(page.url);
      if (!result.ok) return null;

      return analyzePageEnhanced(result.url, result.html, {
        type: input.businessType,
        location: input.businessAddress,
      });
    })
).then(pages => pages.filter((p): p is EnhancedPageAnalysis => p !== null));
```

### 2. Competitor Intelligence

**Location:** After competitor crawling

**Current Code:**
```typescript
const competitors: SiteSnapshot[] = await Promise.all(
  input.competitors.map(async (url) => {
    const pages = await crawlSite({ startUrl: url, limit: 15, maxDepth: 2 });
    return {
      domain: new URL(url).hostname,
      pages,
      aggregatedKeywords: aggregateKeywords(pages),
      metrics: await fetchDomainMetrics(url),
    };
  })
);
```

**Enhanced Code:**
```typescript
import {
  analyzePageEnhanced,
  analyzeContentDepth,
  type EnhancedPageAnalysis,
} from './intelligence';

const competitors = await Promise.all(
  input.competitors.map(async (url) => {
    // Crawl competitor
    const pages = await crawlSite({ startUrl: url, limit: 15, maxDepth: 2 });

    // Enhance pages
    const enhanced = await Promise.all(
      pages
        .filter(page => page.status === 'ok')
        .map(async (page) => {
          const result = await fetchPageHtml(page.url);
          if (!result.ok) return null;

          return analyzePageEnhanced(result.url, result.html, {
            type: input.businessType,
            location: input.businessAddress,
          });
        })
    ).then(pages => pages.filter((p): p is EnhancedPageAnalysis => p !== null));

    // Calculate content depth
    const contentDepth = analyzeContentDepth(enhanced);

    return {
      domain: new URL(url).hostname,
      pages: enhanced as PageAnalysis[], // Cast to base type for compatibility
      enhancedPages: enhanced, // Keep enhanced data
      contentDepth, // Add depth metrics
      aggregatedKeywords: aggregateKeywords(pages),
      metrics: await fetchDomainMetrics(url),
    };
  })
);
```

### 3. Image Audit Integration

**Location:** After target site analysis

**Add to report generation:**
```typescript
import { auditImagesDetailed, generateImageRecommendations } from './intelligence';

// Collect HTML for image audit
const targetPagesWithHtml = await Promise.all(
  targetPages
    .filter(page => page.status === 'ok')
    .map(async (page) => {
      const result = await fetchPageHtml(page.url);
      if (!result.ok) return null;
      return { url: page.url, html: result.html };
    })
).then(pages => pages.filter((p): p is { url: string; html: string } => p !== null));

// Perform audit
const imageAudit = auditImagesDetailed(targetPagesWithHtml, {
  type: input.businessType,
  location: input.businessAddress,
});

// Generate recommendations
const imageRecommendations = generateImageRecommendations(imageAudit);

// Add to report
report.imageAudit = {
  totalImages: imageAudit.totalImages,
  coverage: `${((imageAudit.imagesWithAlt / imageAudit.totalImages) * 100).toFixed(0)}%`,
  recommendations: imageRecommendations,
  pagesWithoutImages: imageAudit.pagesWithoutImages,
};
```

### 4. Content Gap Analysis

**Location:** During keyword opportunities phase

**Add content gap detection:**
```typescript
import {
  buildPageInventory,
  identifyContentGaps,
  generatePageRecommendations,
} from './intelligence';

// Build inventory from competitors
const competitorInventory = buildPageInventory(
  competitors.map(comp => ({
    domain: comp.domain,
    pages: comp.enhancedPages,
  }))
);

// Identify gaps
const contentGaps = identifyContentGaps(
  targetEnhanced,
  competitorInventory,
  2 // Minimum 2 competitors must have the page
);

// Generate prioritized recommendations
const missingPageRecommendations = generatePageRecommendations(
  contentGaps,
  competitors.length
);

// Add to report
report.contentGaps = contentGaps;
report.missingPages = missingPageRecommendations.map(rec => ({
  slug: rec.slug,
  priority: rec.priority,
  reason: rec.reason,
  suggestedUrl: `${input.website}/${rec.slug}`,
}));
```

### 5. Competitive Benchmarking

**Location:** Before recommendations generation

**Add benchmark comparison:**
```typescript
import {
  aggregateCompetitorMetrics,
  compareToCompetitors,
  findBestPerformingCompetitor,
} from './intelligence';

// Calculate metrics
const targetMetrics = analyzeContentDepth(targetEnhanced);
const competitorMetrics = aggregateCompetitorMetrics(
  competitors.map(comp => ({
    domain: comp.domain,
    pages: comp.enhancedPages,
  }))
);

// Generate comparison insights
const competitiveInsights = compareToCompetitors(targetMetrics, competitorMetrics);

// Find best competitor
const bestCompetitor = findBestPerformingCompetitor(
  competitors.map(comp => ({
    domain: comp.domain,
    contentDepth: comp.contentDepth,
  }))
);

// Add to report
report.competitiveBenchmarks = {
  target: targetMetrics,
  competitors: competitorMetrics,
  insights: competitiveInsights,
  bestPerformer: bestCompetitor,
};
```

### 6. Enhanced Page Blueprints

**Location:** In page blueprint generation

**Use intelligence data for better blueprints:**
```typescript
// When creating page blueprints, use intelligence data

// For existing pages - include current CTAs and schema
targetEnhanced.forEach(page => {
  const blueprint = {
    url: page.url,
    pageType: page.pageType,
    currentCTAs: page.ctas.map(cta => cta.text),
    currentSchema: page.schemaTypes,
    currentWordCount: page.wordCount,
    targetWordCount: competitorMetrics.averageWordCount,
    currentSections: page.h2Count + page.h3Count,
    targetSections: Math.ceil(competitorMetrics.averageH2Count + competitorMetrics.averageH3Count),
    currentImages: page.imageCount,
    targetImages: Math.ceil(competitorMetrics.averageImageCount),
    needsFAQ: !page.hasFAQ && competitorMetrics.faqPresenceRate > 0.5,
  };

  // Use this data to generate detailed optimization recommendations
});

// For new pages - use competitor benchmarks
missingPageRecommendations.forEach(rec => {
  const pageType = contentGaps.find(gap => gap.slug === rec.slug)?.pageType;
  const typeMetrics = competitorMetrics.byPageType?.[pageType || 'other'];

  const blueprint = {
    slug: rec.slug,
    priority: rec.priority,
    targetWordCount: typeMetrics?.averageWordCount || competitorMetrics.averageWordCount,
    targetSections: Math.ceil(typeMetrics?.averageSectionCount || 5),
    targetImages: Math.ceil(typeMetrics?.averageImageCount || 3),
    shouldIncludeFAQ: competitorMetrics.faqPresenceRate > 0.5,
    recommendedSchema: competitorMetrics.commonSchemaTypes,
  };

  // Use this data to generate new page blueprints
});
```

## Updated SeoReport Type

Add these fields to the `SeoReport` interface in `types.ts`:

```typescript
export interface SeoReport {
  // ... existing fields ...

  // New intelligence fields
  imageAudit?: {
    totalImages: number;
    coverage: string;
    recommendations: string[];
    pagesWithoutImages: string[];
  };

  contentGaps?: CommonPagePattern[];

  missingPages?: Array<{
    slug: string;
    priority: number;
    reason: string;
    suggestedUrl: string;
  }>;

  competitiveBenchmarks?: {
    target: ContentDepthMetrics;
    competitors: ContentDepthMetrics;
    insights: string[];
    bestPerformer: { domain: string; score: number } | null;
  };
}
```

## Minimal Integration (Quick Start)

If you want to integrate gradually, start with these high-value additions:

### Option 1: Enhanced Page Type Detection Only

```typescript
import { detectPageType } from './intelligence';

// Add page type to existing analysis
const pagesWithTypes = targetPages.map(page => ({
  ...page,
  pageType: detectPageType(page.url, ''), // HTML not needed for basic detection
}));
```

### Option 2: Content Gap Analysis Only

```typescript
import { buildPageInventory, identifyContentGaps } from './intelligence';

// Use existing crawled data
const inventory = buildPageInventory(
  competitors.map(comp => ({
    domain: comp.domain,
    pages: comp.pages.map(page => ({
      ...page,
      pageType: 'other' as const,
      ctas: [],
      schemaTypes: [],
      h2Count: 0,
      h3Count: 0,
      imageCount: 0,
      hasFAQ: false,
    })),
  }))
);

// Find gaps
const gaps = identifyContentGaps(
  targetPages.map(page => ({
    ...page,
    pageType: 'other' as const,
    ctas: [],
    schemaTypes: [],
    h2Count: 0,
    h3Count: 0,
    imageCount: 0,
    hasFAQ: false,
  })),
  inventory
);

// Use gaps in recommendations
```

### Option 3: Benchmarking Only

```typescript
import { analyzeContentDepth, compareToCompetitors } from './intelligence';

// Create minimal enhanced pages for metrics only
const targetForMetrics = targetPages.map(page => ({
  ...page,
  pageType: 'other' as const,
  ctas: [],
  schemaTypes: [],
  h2Count: page.headings.filter(h => h.startsWith('h2')).length || 0,
  h3Count: page.headings.filter(h => h.startsWith('h3')).length || 0,
  imageCount: 0, // Would need to parse HTML
  hasFAQ: false,
}));

const targetMetrics = analyzeContentDepth(targetForMetrics);
// Same for competitors...

const insights = compareToCompetitors(targetMetrics, competitorMetrics);
// Add insights to recommendations
```

## Testing Integration

Test the integration with a real site:

```typescript
// Test script: test-intelligence.ts
import { generateSeoReport } from './generator';

const testInput = {
  businessName: 'Test Business',
  website: 'https://example.com',
  businessType: 'Local Service',
  competitors: ['https://competitor1.com', 'https://competitor2.com'],
  businessAddress: 'Edinburgh, UK',
};

const report = await generateSeoReport(testInput);

console.log('Intelligence Data:');
console.log('- Image Audit:', report.imageAudit);
console.log('- Content Gaps:', report.contentGaps?.length);
console.log('- Missing Pages:', report.missingPages?.length);
console.log('- Benchmarks:', report.competitiveBenchmarks?.insights);
```

## Performance Considerations

The intelligence gathering adds additional processing time:

- **Enhanced Analysis**: ~50-100ms per page (HTML parsing + analysis)
- **Image Audit**: ~20-50ms per page (depends on image count)
- **Content Depth**: ~5ms for any number of pages (pure computation)
- **Inventory Building**: ~10-20ms for 100+ pages

**Total Added Time:** ~2-3 seconds for 20 target pages + 3 competitors (15 pages each)

To optimize:
1. Run page enhancements in parallel (already implemented with `Promise.all`)
2. Consider caching enhanced results if regenerating reports
3. Skip HTML re-fetching if already fetched during crawl (would require crawler modification)

## Troubleshooting

### "Cannot find module './intelligence'"

Add to `tsconfig.json` paths if not already present:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Type Errors with EnhancedPageAnalysis

The enhanced type extends `PageAnalysis`, so you can always cast:
```typescript
const basePage: PageAnalysis = enhancedPage; // Safe downcast
```

### Missing HTML for Image Audit

If you don't have HTML stored, you can skip detailed image audit:
```typescript
// Use basic count from enhanced analysis instead
const totalImages = targetEnhanced.reduce((sum, page) => sum + page.imageCount, 0);
```

## Next Steps

After integrating intelligence gathering:

1. **Update HTML Report** - Display new intelligence data in the report
2. **Enhance Content Generation** - Use benchmarks to set content targets
3. **Improve Recommendations** - Make recommendations more specific using intelligence data
4. **Add Export** - Export intelligence data as separate JSON for external tools

See the main tasks.md for Phase 2 (Strategy) which builds on this intelligence data.
