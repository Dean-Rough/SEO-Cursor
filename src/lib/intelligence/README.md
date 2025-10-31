# Intelligence Gathering Module

This module provides enhanced data collection capabilities for SEO Wizard, extending the base crawling and analysis functionality with deep intelligence about target sites and competitors.

## Overview

The intelligence module consists of 4 main components:

1. **Site Crawler** (`site-crawler.ts`) - Enhanced page analysis with page type detection, CTA extraction, and schema markup detection
2. **Competitor Analysis** (`competitor-analysis.ts`) - Content depth metrics and competitive benchmarking
3. **Image Audit** (`image-audit.ts`) - Comprehensive image analysis including alt text quality assessment
4. **Competitor Pages** (`competitor-pages.ts`) - Page inventory and content gap identification

## Installation

All dependencies are already included in the main SEO Wizard project:
- `cheerio` - HTML parsing
- TypeScript types from `../types`

## Usage

### Basic Usage

```typescript
import {
  analyzePageEnhanced,
  analyzeContentDepth,
  auditImagesDetailed,
  buildPageInventory,
} from '@/lib/intelligence';

// Analyze a single page
const enhanced = await analyzePageEnhanced(url, html, businessContext);

// Analyze content depth across pages
const metrics = analyzeContentDepth(pages);

// Audit images
const audit = auditImagesDetailed(pagesWithHtml, businessContext);

// Build competitor inventory
const inventory = buildPageInventory(competitors);
```

### Complete Intelligence Gathering Workflow

See `example-usage.ts` for a complete implementation showing how to:
- Crawl target and competitor sites
- Perform enhanced analysis
- Generate benchmarks and insights
- Identify content gaps
- Create actionable recommendations

## Module Documentation

### Site Crawler (`site-crawler.ts`)

Extends base page analysis with additional intelligence:

**Key Functions:**
- `analyzePageEnhanced()` - Complete enhanced page analysis
- `detectPageType()` - Categorizes pages (homepage, service, blog, etc.)
- `extractCTAs()` - Finds call-to-action elements
- `extractSchemaTypes()` - Parses JSON-LD schema markup

**Output:** `EnhancedPageAnalysis` with page type, CTAs, schema, heading counts, image count, FAQ detection

### Competitor Analysis (`competitor-analysis.ts`)

Analyzes content depth and benchmarks competitors:

**Key Functions:**
- `analyzeContentDepth()` - Calculates averages for word count, headings, images, FAQ rate
- `aggregateCompetitorMetrics()` - Combines metrics across competitors
- `compareToCompetitors()` - Generates insights by comparing target to competitors
- `findBestPerformingCompetitor()` - Identifies top competitor by content quality score

**Output:** `ContentDepthMetrics` with averages and breakdowns by page type

### Image Audit (`image-audit.ts`)

Comprehensive image analysis across a site:

**Key Functions:**
- `auditImages()` - Basic audit using pre-analyzed pages
- `auditImagesDetailed()` - Detailed audit by re-parsing HTML
- `analyzePageImages()` - Analyzes individual page images
- `generateImageRecommendations()` - Creates actionable image optimization suggestions

**Output:** `ImageAuditResult` with counts, percentages, and page-level details

### Competitor Pages (`competitor-pages.ts`)

Inventory and gap analysis:

**Key Functions:**
- `buildPageInventory()` - Categorizes all competitor pages
- `identifyContentGaps()` - Finds pages competitors have that target doesn't
- `generatePageRecommendations()` - Prioritizes missing pages
- `categorizePageByUrl()` - Standalone URL categorization
- `analyzeUrlStructures()` - Identifies URL structure patterns

**Output:** `CompetitorPageInventory` with categorized pages and common patterns

## Type Definitions

All types are defined in `types.ts`:

- `EnhancedPageAnalysis` - Extended page analysis with intelligence data
- `ExtractedCTA` - Call-to-action element details
- `ContentDepthMetrics` - Aggregated content metrics
- `ImageAuditResult` - Image analysis results
- `CompetitorPageInventory` - Categorized competitor pages
- `CommonPagePattern` - Page patterns found across competitors
- `IntelligenceReport` - Complete intelligence report structure

## Integration with Existing Code

The intelligence module is designed to wrap and extend existing functionality:

- Uses `crawlSite()` from `../crawler.ts` for site crawling
- Uses `analysePage()` from `../analyse-page.ts` as foundation
- Uses `fetchPageHtml()` from `../fetcher.ts` for HTML retrieval
- Exports types compatible with existing `PageAnalysis` type

**No modifications to existing files are required** - all functionality is additive.

## Example: Integration into Generator

To integrate with the main generator flow (`../generator.ts`):

```typescript
import {
  analyzePageEnhanced,
  analyzeContentDepth,
  buildPageInventory,
  identifyContentGaps,
} from './intelligence';

async function enhancedGeneration(input: SiteInput): Promise<SeoReport> {
  // Step 1: Crawl with existing crawler
  const targetPages = await crawlSite({ ... });

  // Step 2: Enhance with intelligence
  const targetEnhanced = await Promise.all(
    targetPages.map(page => {
      const html = await fetchPageHtml(page.url);
      return analyzePageEnhanced(page.url, html.html, {
        type: input.businessType,
        location: input.businessAddress,
      });
    })
  );

  // Step 3: Analyze competitors
  const competitors = await Promise.all(
    input.competitors.map(async (url) => {
      const pages = await crawlSite({ startUrl: url, ... });
      const enhanced = await Promise.all(
        pages.map(page => analyzePageEnhanced(...))
      );
      return {
        domain: new URL(url).hostname,
        pages: enhanced,
        contentDepth: analyzeContentDepth(enhanced),
      };
    })
  );

  // Step 4: Build inventory and find gaps
  const inventory = buildPageInventory(competitors);
  const gaps = identifyContentGaps(targetEnhanced, inventory);

  // Step 5: Continue with existing generation logic...
  // Use intelligence data to enhance keyword opportunities,
  // metadata recommendations, and content drafts
}
```

## Testing

Each module can be tested independently:

```typescript
// Test page type detection
const pageType = detectPageType('https://example.com/services', '<html>...</html>');
expect(pageType).toBe('service');

// Test CTA extraction
const ctas = extractCTAs('<button>Book Now</button>');
expect(ctas).toHaveLength(1);
expect(ctas[0].text).toBe('Book Now');

// Test content depth calculation
const metrics = analyzeContentDepth(mockPages);
expect(metrics.averageWordCount).toBeGreaterThan(0);
```

## Performance Considerations

- **Crawling**: Uses existing rate limiting and robots.txt respect
- **Memory**: Processes pages individually to avoid loading all HTML into memory
- **Caching**: Consider caching enhanced analysis results to avoid re-parsing
- **Parallelization**: Safe to analyze multiple pages in parallel

## Future Enhancements

Potential additions to this module:

1. **Heading Hierarchy Analysis** - Detect improper heading structure (H1 → H3 without H2)
2. **Link Analysis** - Internal/external link patterns
3. **Mobile Optimization Detection** - Viewport meta tags, responsive design indicators
4. **Performance Metrics** - Page load time estimation from HTML size
5. **Accessibility Audit** - ARIA labels, semantic HTML usage
6. **Content Freshness** - Date detection in content and schema

## Contributing

When adding new intelligence features:

1. Add types to `types.ts`
2. Create focused function modules
3. Add JSDoc comments to all exported functions
4. Update `index.ts` exports
5. Add example usage to `example-usage.ts`
6. Update this README

## License

Part of SEO Wizard project - see main project LICENSE
