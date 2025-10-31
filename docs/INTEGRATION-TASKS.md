# Integration Tasks - Wiring All 5 Phases Together

**Goal:** Integrate all 5 phases into the main SEO Wizard generator pipeline

**Estimated Time:** 8-12 hours

**Strategy:** Incremental integration with feature flags for safe rollout

---

## 🎯 Integration Approach

### Phase-by-Phase Rollout (Recommended)

1. **Phase 1 Only** - Enhanced intelligence (low risk)
2. **Phase 1 + 2** - Add strategy layer
3. **Phase 1 + 2 + 3** - Add blueprints
4. **Full System** - Add generation + report

This allows testing at each stage and catching issues early.

---

## 📋 Task Breakdown

### Stage 0: Pre-Integration Setup (1-2 hours)

#### Task 0.1: Backup Current System
- [ ] Create git branch: `feat/5-phase-integration`
- [ ] Commit current state as baseline
- [ ] Tag as `pre-integration-backup`

**Commands:**
```bash
cd /Users/deannewton/Projects/SEO\ Wizard/seo-wizard
git checkout -b feat/5-phase-integration
git add .
git commit -m "Pre-integration backup - all 5 phases complete"
git tag pre-integration-backup
```

#### Task 0.2: Environment Setup
- [ ] Verify OPENAI_API_KEY in env.local (for Phase 4 testing)
- [ ] Verify MOZ_DATA_API_KEY still valid
- [ ] Install any missing dependencies (if needed)

**Check:**
```bash
cat env.local | grep -E "OPENAI_API_KEY|MOZ_DATA_API_KEY"
```

#### Task 0.3: Create Feature Flags Type
- [ ] Add feature flags to `src/lib/types.ts`

**Code:**
```typescript
// Add to src/lib/types.ts
export interface EnhancedFeatures {
  enableEnhancedIntelligence?: boolean;  // Phase 1
  enableStrategy?: boolean;              // Phase 2
  enableBlueprints?: boolean;            // Phase 3
  enableAIGeneration?: boolean;          // Phase 4 (requires OpenAI)
  enableEnhancedReport?: boolean;        // Phase 5
}

export interface SiteInput {
  // ... existing fields
  enhancedFeatures?: EnhancedFeatures;
}
```

---

### Stage 1: Type System Updates (1 hour)

#### Task 1.1: Update SeoReport Type
- [ ] Add Phase 1 intelligence data to SeoReport
- [ ] Add Phase 2 strategy data to SeoReport
- [ ] Add Phase 3 blueprints to SeoReport
- [ ] Add Phase 4 generated content to SeoReport
- [ ] Maintain backward compatibility (all new fields optional)

**File:** `src/lib/types.ts`

**Code:**
```typescript
import type { IntelligenceReport } from './intelligence/types';
import type { StrategyReport } from './strategy/types';
import type { PageBlueprint } from './blueprints/types';
import type { GeneratedPageContent } from './generation/types';

export interface SeoReport {
  // ... existing fields ...

  // New Phase 1: Intelligence (optional)
  intelligence?: {
    targetSiteAnalysis: {
      pageTypeBreakdown: Record<string, number>;
      averageContentDepth: {
        wordCount: number;
        h2Count: number;
        imageCount: number;
      };
      ctaPresence: number; // percentage of pages with CTAs
      schemaMarkupPresence: number; // percentage with schema
    };
    competitorBenchmarks: {
      averageWordCount: number;
      averageImageCount: number;
      averageSectionCount: number;
      commonSchemaTypes: string[];
    };
    contentGaps: Array<{
      suggestedUrl: string;
      pageType: string;
      competitorCount: number;
      priority: number;
    }>;
  };

  // New Phase 2: Strategy (optional)
  strategy?: {
    keywordClusters: Array<{
      name: string;
      primaryKeyword: string;
      totalVolume: number;
      averageDifficulty: number;
      keywords: string[];
    }>;
    pageStrategies: Array<{
      url: string;
      pageType: string;
      primaryKeyword: string;
      secondaryKeywords: string[];
      priority: number;
      status: 'create' | 'optimize' | 'keep';
      contentTargets: {
        wordCount: number;
        sectionCount: number;
        imageCount: number;
        includeFAQ: boolean;
      };
    }>;
    internalLinkingMap: Array<{
      fromUrl: string;
      toUrl: string;
      anchorText: string;
    }>;
  };

  // New Phase 3: Blueprints (optional)
  blueprints?: PageBlueprint[];

  // New Phase 4: Generated Content (optional)
  generatedContent?: GeneratedPageContent[];
}
```

#### Task 1.2: Create Adapter Types
- [ ] Create `src/lib/adapters/types.ts` for data transformation helpers

**File:** `src/lib/adapters/types.ts`

**Code:**
```typescript
import type { SiteSnapshot, KeywordStat } from '../types';
import type { EnhancedPageAnalysis } from '../intelligence/types';
import type { PageStrategy } from '../strategy/types';

// Adapter to convert existing data to Phase 1 format
export interface IntelligenceAdapter {
  toEnhancedPages(pages: PageAnalysis[]): EnhancedPageAnalysis[];
}

// Adapter to convert existing keywords to Phase 2 format
export interface StrategyAdapter {
  toKeywordStats(keywords: any[]): KeywordStat[];
}
```

---

### Stage 2: Phase 1 Integration (2 hours)

#### Task 2.1: Create Intelligence Adapter
- [ ] Create `src/lib/adapters/intelligence-adapter.ts`
- [ ] Convert existing `PageAnalysis` to `EnhancedPageAnalysis`

**File:** `src/lib/adapters/intelligence-adapter.ts`

**Code:**
```typescript
import type { PageAnalysis } from '../types';
import type { EnhancedPageAnalysis } from '../intelligence/types';
import { analyzePageEnhanced } from '../intelligence';

export async function enrichPageAnalysis(
  page: PageAnalysis,
  html: string,
  businessContext: { type: string; location?: string }
): Promise<EnhancedPageAnalysis> {
  try {
    return await analyzePageEnhanced(page.url, html, businessContext);
  } catch (error) {
    // Fallback to basic analysis with defaults
    return {
      ...page,
      pageType: 'other',
      ctas: [],
      schemaTypes: [],
      h2Count: 0,
      h3Count: 0,
      imageCount: 0,
      hasFAQ: false,
    };
  }
}
```

#### Task 2.2: Integrate into Generator
- [ ] Modify `src/lib/generator.ts` to call Phase 1 when enabled
- [ ] Store enhanced analysis in SeoReport

**File:** `src/lib/generator.ts`

**Code to Add:**
```typescript
// Near top of file
import {
  analyzeContentDepth,
  buildPageInventory,
  identifyContentGaps
} from './intelligence';
import { enrichPageAnalysis } from './adapters/intelligence-adapter';

// In generateSeoReport function, after crawling:
let intelligenceReport = null;

if (input.enhancedFeatures?.enableEnhancedIntelligence) {
  try {
    // Re-fetch HTML for enhanced analysis (or use cached)
    const enhancedTargetPages = await Promise.all(
      targetSite.pages.map(async (page) => {
        const html = await fetchPageHtml(page.url);
        if (!html.ok) return null;
        return enrichPageAnalysis(page, html.html, {
          type: input.businessType,
          location: locationContext.primaryLocation
        });
      })
    );

    const validEnhancedPages = enhancedTargetPages.filter(Boolean) as EnhancedPageAnalysis[];

    // Analyze competitors similarly
    const allCompetitorEnhanced = await Promise.all(
      competitorSnapshots.map(async (snapshot) => {
        const enhancedPages = await Promise.all(
          snapshot.pages.map(async (page) => {
            const html = await fetchPageHtml(page.url);
            if (!html.ok) return null;
            return enrichPageAnalysis(page, html.html, {
              type: input.businessType,
              location: locationContext.primaryLocation
            });
          })
        );
        return {
          domain: snapshot.domain,
          pages: enhancedPages.filter(Boolean) as EnhancedPageAnalysis[]
        };
      })
    );

    // Build intelligence report
    const targetDepth = analyzeContentDepth(validEnhancedPages);
    const competitorDepth = analyzeContentDepth(
      allCompetitorEnhanced.flatMap(c => c.pages)
    );

    const inventory = buildPageInventory(allCompetitorEnhanced);
    const gaps = identifyContentGaps(
      targetSite.pages.map(p => p.url),
      inventory
    );

    intelligenceReport = {
      targetSiteAnalysis: {
        pageTypeBreakdown: calculatePageTypeBreakdown(validEnhancedPages),
        averageContentDepth: {
          wordCount: targetDepth.averageWordCount,
          h2Count: targetDepth.averageH2Count,
          imageCount: targetDepth.averageImageCount,
        },
        ctaPresence: calculateCTAPresence(validEnhancedPages),
        schemaMarkupPresence: calculateSchemaPresence(validEnhancedPages),
      },
      competitorBenchmarks: {
        averageWordCount: competitorDepth.averageWordCount,
        averageImageCount: competitorDepth.averageImageCount,
        averageSectionCount: competitorDepth.averageH2Count + competitorDepth.averageH3Count,
        commonSchemaTypes: competitorDepth.commonSchemaTypes,
      },
      contentGaps: gaps.map(g => ({
        suggestedUrl: g.suggestedUrl,
        pageType: g.pageType,
        competitorCount: g.competitorCount,
        priority: g.priority,
      })),
    };
  } catch (error) {
    console.warn('Phase 1 (Intelligence) failed, continuing without enhanced data:', error);
  }
}

// Add to return statement:
return {
  // ... existing fields ...
  intelligence: intelligenceReport,
};
```

#### Task 2.3: Add Helper Functions
- [ ] Add `calculatePageTypeBreakdown`
- [ ] Add `calculateCTAPresence`
- [ ] Add `calculateSchemaPresence`

**Code:**
```typescript
function calculatePageTypeBreakdown(pages: EnhancedPageAnalysis[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  pages.forEach(page => {
    breakdown[page.pageType] = (breakdown[page.pageType] || 0) + 1;
  });
  return breakdown;
}

function calculateCTAPresence(pages: EnhancedPageAnalysis[]): number {
  const withCTAs = pages.filter(p => p.ctas.length > 0).length;
  return pages.length > 0 ? (withCTAs / pages.length) * 100 : 0;
}

function calculateSchemaPresence(pages: EnhancedPageAnalysis[]): number {
  const withSchema = pages.filter(p => p.schemaTypes.length > 0).length;
  return pages.length > 0 ? (withSchema / pages.length) * 100 : 0;
}
```

#### Task 2.4: Test Phase 1 Integration
- [ ] Set `enableEnhancedIntelligence: true` in test input
- [ ] Run generator with rough.ink or test site
- [ ] Verify intelligence data appears in report
- [ ] Check console for errors

**Test Command:**
```bash
npm run dev
# Navigate to http://localhost:3000
# Fill form with enableEnhancedIntelligence checkbox (if added to UI)
# Generate report
# Check report.intelligence field in browser console
```

---

### Stage 3: Phase 2 Integration (2 hours)

#### Task 3.1: Create Strategy Adapter
- [ ] Create `src/lib/adapters/strategy-adapter.ts`
- [ ] Convert existing data to Phase 2 format

**File:** `src/lib/adapters/strategy-adapter.ts`

**Code:**
```typescript
import type { KeywordStat, SiteSnapshot } from '../types';
import type { PageStrategy } from '../strategy/types';
import {
  clusterKeywords,
  mapKeywordsToPages,
  identifyPageGaps,
  calculateContentTargets,
  buildLinkingBlueprint
} from '../strategy';

export interface StrategyInput {
  keywords: KeywordStat[];
  existingPages: string[];
  targetSite: SiteSnapshot;
  competitors: SiteSnapshot[];
  competitorInventory: any; // From Phase 1
  contentDepthMetrics: any; // From Phase 1
  businessType: string;
}

export async function buildStrategy(input: StrategyInput) {
  // Cluster keywords
  const clusters = clusterKeywords(input.keywords);

  // Map to pages
  const mappings = mapKeywordsToPages(
    clusters,
    input.existingPages,
    input.competitorInventory?.allPages.map(p => p.url) || []
  );

  // Identify gaps
  const gaps = identifyPageGaps(
    input.existingPages,
    input.competitorInventory,
    input.keywords
  );

  // Calculate content targets
  const targets = calculateContentTargets(
    mappings,
    input.contentDepthMetrics
  );

  // Build internal linking
  const linking = buildLinkingBlueprint(
    mappings.map(m => ({
      ...m,
      contentTarget: targets.find(t => t.url === m.url)!,
    })),
    {
      homepage: input.targetSite.domain,
      servicePages: mappings.filter(m => m.pageType === 'service').map(m => m.url),
      blogPages: mappings.filter(m => m.pageType === 'blog').map(m => m.url),
    }
  );

  return {
    clusters,
    mappings,
    gaps,
    targets,
    linking,
  };
}
```

#### Task 3.2: Integrate into Generator
- [ ] Call Phase 2 when `enableStrategy: true`
- [ ] Store strategy data in SeoReport

**File:** `src/lib/generator.ts`

**Code to Add:**
```typescript
// After Phase 1 intelligence
let strategyReport = null;

if (input.enhancedFeatures?.enableStrategy && intelligenceReport) {
  try {
    const allKeywords = [
      ...keywordStrategy.siteKeywords,
      ...keywordStrategy.competitorKeywords,
      ...datasetKeywords.map(k => ({
        keyword: k.keyword,
        score: 50,
        density: 0,
        volume: k.volume,
        difficulty: k.difficulty,
        source: 'dataset' as const,
      })),
    ];

    const strategy = await buildStrategy({
      keywords: allKeywords,
      existingPages: targetSite.pages.map(p => p.url),
      targetSite: enrichedTarget,
      competitors: enrichedCompetitors,
      competitorInventory: intelligenceReport.contentGaps,
      contentDepthMetrics: intelligenceReport.competitorBenchmarks,
      businessType: input.businessType,
    });

    strategyReport = {
      keywordClusters: strategy.clusters.map(c => ({
        name: c.name,
        primaryKeyword: c.primaryKeyword,
        totalVolume: c.totalVolume,
        averageDifficulty: c.averageDifficulty,
        keywords: c.keywords.map(k => k.keyword),
      })),
      pageStrategies: strategy.mappings.map(m => {
        const target = strategy.targets.find(t => t.url === m.url);
        return {
          url: m.url,
          pageType: m.pageType,
          primaryKeyword: m.primaryKeyword,
          secondaryKeywords: m.secondaryKeywords,
          priority: calculatePriority(m),
          status: m.status,
          contentTargets: target ? {
            wordCount: target.wordCount,
            sectionCount: target.sectionCount,
            imageCount: target.imageCount,
            includeFAQ: target.includeFAQ,
          } : undefined,
        };
      }),
      internalLinkingMap: strategy.linking.links.map(link => ({
        fromUrl: link.fromUrl,
        toUrl: link.toUrl,
        anchorText: link.anchorText,
      })),
    };
  } catch (error) {
    console.warn('Phase 2 (Strategy) failed, continuing without strategy data:', error);
  }
}

// Add to return:
return {
  // ... existing ...
  strategy: strategyReport,
};
```

#### Task 3.3: Test Phase 2 Integration
- [ ] Enable both Phase 1 + 2
- [ ] Run generator
- [ ] Verify keyword clusters appear
- [ ] Verify page strategies calculated
- [ ] Check internal linking map

---

### Stage 4: Phase 3 Integration (2 hours)

#### Task 4.1: Integrate Blueprints
- [ ] Call Phase 3 when `enableBlueprints: true`
- [ ] Generate blueprints for all pages in strategy

**File:** `src/lib/generator.ts`

**Code:**
```typescript
import { assemblePageBlueprint, assembleSiteBlueprints } from './blueprints';

let blueprints = null;

if (input.enhancedFeatures?.enableBlueprints && strategyReport) {
  try {
    const businessInfo = {
      name: input.businessName,
      businessType: input.businessType,
      serviceArea: locationContext.serviceArea,
      address: locationContext.address,
      phone: input.phone || '',
      email: input.email || '',
      website: input.website,
    };

    // Convert page strategies to PageStrategy type for blueprints
    const pageStrategies = strategyReport.pageStrategies.map(ps => ({
      url: ps.url,
      pageType: ps.pageType,
      primaryKeyword: ps.primaryKeyword,
      secondaryKeywords: ps.secondaryKeywords,
      cluster: strategyReport.keywordClusters.find(c =>
        c.primaryKeyword === ps.primaryKeyword
      ),
      contentTarget: ps.contentTargets,
      priority: ps.priority,
      status: ps.status,
      internalLinks: {
        inbound: strategyReport.internalLinkingMap.filter(l => l.toUrl === ps.url),
        outbound: strategyReport.internalLinkingMap.filter(l => l.fromUrl === ps.url),
      },
    }));

    blueprints = assembleSiteBlueprints(pageStrategies, businessInfo);
  } catch (error) {
    console.warn('Phase 3 (Blueprints) failed, continuing without blueprints:', error);
  }
}

// Add to return:
return {
  // ... existing ...
  blueprints,
};
```

#### Task 4.2: Test Phase 3 Integration
- [ ] Enable Phases 1 + 2 + 3
- [ ] Run generator
- [ ] Verify blueprints generated for each page
- [ ] Check blueprint quality (schema, sections, images, CTAs)

---

### Stage 5: Phase 4 Integration (2 hours)

#### Task 4.1: Add OpenAI Check
- [ ] Verify OPENAI_API_KEY before attempting generation
- [ ] Graceful error if key missing

**File:** `src/lib/generator.ts`

**Code:**
```typescript
import { generateCompletePageContent, generateMultiplePages } from './generation';

let generatedContent = null;

if (input.enhancedFeatures?.enableAIGeneration && blueprints) {
  // Check for API key
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn('OPENAI_API_KEY not found, skipping AI generation');
  } else {
    try {
      const businessContext = {
        businessName: input.businessName,
        businessType: input.businessType,
        location: locationContext.primaryLocation,
        serviceArea: locationContext.serviceArea,
      };

      const options = {
        businessContext,
        includeImagePlaceholders: true,
        enforceQuality: true,
        minQualityScore: 70, // Minimum acceptable score
      };

      // Generate content for all blueprints
      // Limit to top priority pages to control costs
      const topPriorityBlueprints = blueprints
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 5); // Generate only top 5 pages

      generatedContent = await generateMultiplePages(
        topPriorityBlueprints,
        options
      );

      console.log(`Generated content for ${generatedContent.length} pages`);
      generatedContent.forEach(content => {
        console.log(`  ${content.slug}: ${content.qualityScore}/100`);
      });
    } catch (error) {
      console.error('Phase 4 (Content Generation) failed:', error);
      // Continue without generated content
    }
  }
}

// Add to return:
return {
  // ... existing ...
  generatedContent,
};
```

#### Task 4.2: Add Cost Estimation
- [ ] Calculate estimated OpenAI cost before generation
- [ ] Log cost estimate

**Code:**
```typescript
function estimateGenerationCost(blueprints: PageBlueprint[]): number {
  // Rough estimate: $0.04 per page (4 sections + FAQs)
  return blueprints.length * 0.04;
}

// Before generateMultiplePages:
const estimatedCost = estimateGenerationCost(topPriorityBlueprints);
console.log(`Estimated OpenAI cost: $${estimatedCost.toFixed(2)}`);
```

#### Task 4.3: Test Phase 4 Integration
- [ ] Enable all 4 phases
- [ ] Run generator with OpenAI key
- [ ] Verify content generated
- [ ] Check quality scores
- [ ] Verify cost estimate reasonable

---

### Stage 6: Phase 5 Integration (1 hour)

#### Task 5.1: Update Report Generation
- [ ] Use enhanced report template when `enableEnhancedReport: true`
- [ ] Fall back to old template if disabled

**File:** `src/app/page.tsx` or wherever report is rendered

**Code:**
```typescript
import { renderReportHtml } from '@/lib/report-to-html'; // Old
import { generateEnhancedReport } from '@/lib/report'; // New

// When generating HTML:
const reportHtml = report.enhancedFeatures?.enableEnhancedReport
  ? generateEnhancedReport(report)
  : renderReportHtml(report);
```

#### Task 5.2: Test Phase 5 Integration
- [ ] Enable all 5 phases
- [ ] Generate full report
- [ ] Verify enhanced HTML includes all phases
- [ ] Test copy buttons
- [ ] Test download functionality
- [ ] Check responsive design on mobile

---

### Stage 7: Final Testing & Tuning (2 hours)

#### Task 7.1: End-to-End Test
- [ ] Test with rough.ink or real site
- [ ] Enable all phases
- [ ] Generate complete report
- [ ] Verify all data flows correctly
- [ ] Check quality of output

#### Task 7.2: Performance Optimization
- [ ] Profile pipeline execution time
- [ ] Identify bottlenecks
- [ ] Consider caching opportunities
- [ ] Add parallel processing where possible

#### Task 7.3: Error Handling Audit
- [ ] Verify graceful degradation at each phase
- [ ] Test with missing API keys
- [ ] Test with malformed input
- [ ] Test with small/large sites

#### Task 7.4: Documentation Update
- [ ] Update main README with new features
- [ ] Add troubleshooting guide
- [ ] Document feature flags
- [ ] Add example configurations

---

## 🎛️ Feature Flag Configuration Examples

### Minimal Enhancement (Safe Start)
```typescript
{
  enhancedFeatures: {
    enableEnhancedIntelligence: true,  // Just Phase 1
    enableStrategy: false,
    enableBlueprints: false,
    enableAIGeneration: false,
    enableEnhancedReport: false,
  }
}
```

### Strategic Planning (No AI)
```typescript
{
  enhancedFeatures: {
    enableEnhancedIntelligence: true,
    enableStrategy: true,
    enableBlueprints: true,
    enableAIGeneration: false,  // Save costs
    enableEnhancedReport: true,
  }
}
```

### Full System (Maximum Value)
```typescript
{
  enhancedFeatures: {
    enableEnhancedIntelligence: true,
    enableStrategy: true,
    enableBlueprints: true,
    enableAIGeneration: true,  // Requires OPENAI_API_KEY
    enableEnhancedReport: true,
  }
}
```

---

## 🐛 Testing Checklist

- [ ] Test with 0 competitors (should show warnings)
- [ ] Test with 5 competitors (should work great)
- [ ] Test with no MOZ_DATA_API_KEY (should fail gracefully)
- [ ] Test with no OPENAI_API_KEY (Phase 4 skipped, others work)
- [ ] Test with small site (5 pages)
- [ ] Test with medium site (20 pages)
- [ ] Test with different business types (restaurant, lawyer, salon)
- [ ] Test with different locations (US, UK, Australia)
- [ ] Test mobile responsive report
- [ ] Test print layout
- [ ] Test copy-to-clipboard functionality
- [ ] Test download functionality

---

## 🎯 Success Criteria

### Must Have
- ✅ All 5 phases integrated
- ✅ Feature flags working
- ✅ Backward compatible (old format still works)
- ✅ Graceful degradation when phase fails
- ✅ End-to-end test passes with real site
- ✅ No breaking changes to existing API

### Nice to Have
- ⭐ Unit tests added
- ⭐ Performance < 60 seconds total
- ⭐ Cost estimation shown to user
- ⭐ Progress indicators during generation
- ⭐ Caching layer implemented

---

## 📊 Estimated Timeline

| Stage | Time | Description |
|-------|------|-------------|
| Stage 0 | 1-2h | Setup, backup, env check |
| Stage 1 | 1h | Type system updates |
| Stage 2 | 2h | Phase 1 integration |
| Stage 3 | 2h | Phase 2 integration |
| Stage 4 | 2h | Phase 3 integration |
| Stage 5 | 2h | Phase 4 integration |
| Stage 6 | 1h | Phase 5 integration |
| Stage 7 | 2h | Testing & tuning |
| **Total** | **13-14h** | **Complete integration** |

With experience and focus: **8-10 hours achievable**

---

## 🚨 Risk Mitigation

### Risk 1: Phase 1 fails
**Impact:** Low - Can fall back to basic analysis
**Mitigation:** Try-catch with console warning

### Risk 2: OpenAI API fails
**Impact:** Medium - No generated content
**Mitigation:** Show blueprints instead, user can write copy manually

### Risk 3: Integration breaks existing functionality
**Impact:** High - Users lose access to working tool
**Mitigation:** Feature flags allow disabling new features

### Risk 4: Performance degrades significantly
**Impact:** Medium - User frustration
**Mitigation:** Add caching, parallel processing, limit pages

---

## 📝 Post-Integration Tasks

After successful integration:

1. **Write blog post** about new features
2. **Update documentation** with examples
3. **Create video walkthrough**
4. **Gather user feedback**
5. **Plan next iteration** (unit tests, optimization)

---

**Ready to begin integration!** 🚀

Follow tasks stage-by-stage for safe, incremental rollout.
