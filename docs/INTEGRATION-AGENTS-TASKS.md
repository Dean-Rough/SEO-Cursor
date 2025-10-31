# Integration Agent Tasks - Parallel Execution

**Goal:** Integrate all 5 phases into the main generator pipeline using parallel agents

**Status:** Stage 0-1 Complete ✅ (Feature flags + type system ready)

**Remaining:** Stages 2-7 (Phase integrations, testing, tuning)

---

## 🤖 Agent Allocation

### Agent 1: Phase 1 Integration (Intelligence)
**Deliverable:** Wire Phase 1 intelligence gathering into generator.ts
**Time Estimate:** 2 hours
**Dependencies:** None (types ready)

### Agent 2: Phase 2 Integration (Strategy)
**Deliverable:** Wire Phase 2 strategic planning into generator.ts
**Time Estimate:** 2 hours
**Dependencies:** Phase 1 (needs intelligence data)

### Agent 3: Phase 3 Integration (Blueprints)
**Deliverable:** Wire Phase 3 content blueprints into generator.ts
**Time Estimate:** 2 hours
**Dependencies:** Phase 2 (needs page strategies)

### Agent 4: Phase 4 Integration (Content Generation)
**Deliverable:** Wire Phase 4 AI generation into generator.ts
**Time Estimate:** 2 hours
**Dependencies:** Phase 3 (needs blueprints)

### Agent 5: Phase 5 Integration (Enhanced Report)
**Deliverable:** Wire Phase 5 enhanced HTML report into page.tsx
**Time Estimate:** 1 hour
**Dependencies:** All phases (displays all data)

### Agent 6: Testing & Validation
**Deliverable:** End-to-end tests, error handling audit, performance checks
**Time Estimate:** 2 hours
**Dependencies:** All integrations complete

---

## 📋 Agent 1: Phase 1 Integration (Intelligence)

### Task 1.1: Import Phase 1 Modules
**File:** `src/lib/generator.ts`

Add imports:
```typescript
import {
  analyzeContentDepth,
  buildPageInventory,
  identifyContentGaps
} from './intelligence';
import { enrichPageAnalysis } from './adapters/intelligence-adapter';
import type { EnhancedPageAnalysis } from './intelligence/types';
```

### Task 1.2: Add Helper Functions to Generator
**File:** `src/lib/generator.ts`

Add these helper functions at the bottom of the file:
```typescript
function calculatePageTypeBreakdown(pages: EnhancedPageAnalysis[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  pages.forEach(page => {
    breakdown[page.pageType] = (breakdown[page.pageType] || 0) + 1;
  });
  return breakdown;
}

function calculateCTAPresence(pages: EnhancedPageAnalysis[]): number {
  const withCTAs = pages.filter(p => p.ctas && p.ctas.length > 0).length;
  return pages.length > 0 ? (withCTAs / pages.length) * 100 : 0;
}

function calculateSchemaPresence(pages: EnhancedPageAnalysis[]): number {
  const withSchema = pages.filter(p => p.schemaTypes && p.schemaTypes.length > 0).length;
  return pages.length > 0 ? (withSchema / pages.length) * 100 : 0;
}
```

### Task 1.3: Integrate Phase 1 into Generator Pipeline
**File:** `src/lib/generator.ts`

**Location:** In `generateSeoReport` function, after crawling target site and competitors (around line 100-150)

Add this code block:
```typescript
// ========================================
// PHASE 1: ENHANCED INTELLIGENCE
// ========================================
let intelligenceReport = null;

if (input.enhancedFeatures?.enableEnhancedIntelligence) {
  console.log('🧠 Phase 1: Enhanced Intelligence...');
  try {
    // Enrich target site pages
    const enhancedTargetPages: EnhancedPageAnalysis[] = [];
    for (const page of targetSite.pages) {
      if (page.status === 'ok') {
        const result = await fetchPageHtml(page.url);
        if (result.ok) {
          const enhanced = await enrichPageAnalysis(page, result.html, {
            type: input.businessType,
            location: locationContext.primaryLocation
          });
          enhancedTargetPages.push(enhanced);
        }
      }
    }

    // Enrich competitor pages
    const allCompetitorEnhanced: Array<{ domain: string; pages: EnhancedPageAnalysis[] }> = [];
    for (const competitor of competitorSnapshots) {
      const enhancedPages: EnhancedPageAnalysis[] = [];
      for (const page of competitor.pages) {
        if (page.status === 'ok') {
          const result = await fetchPageHtml(page.url);
          if (result.ok) {
            const enhanced = await enrichPageAnalysis(page, result.html, {
              type: input.businessType,
              location: locationContext.primaryLocation
            });
            enhancedPages.push(enhanced);
          }
        }
      }
      allCompetitorEnhanced.push({
        domain: competitor.domain,
        pages: enhancedPages
      });
    }

    // Analyze content depth
    const targetDepth = analyzeContentDepth(enhancedTargetPages);
    const competitorDepth = analyzeContentDepth(
      allCompetitorEnhanced.flatMap(c => c.pages)
    );

    // Build page inventory and identify gaps
    const inventory = buildPageInventory(allCompetitorEnhanced);
    const gaps = identifyContentGaps(
      targetSite.pages.map(p => p.url),
      inventory
    );

    intelligenceReport = {
      targetSiteAnalysis: {
        pageTypeBreakdown: calculatePageTypeBreakdown(enhancedTargetPages),
        averageContentDepth: {
          wordCount: targetDepth.averageWordCount,
          h2Count: targetDepth.averageH2Count,
          imageCount: targetDepth.averageImageCount,
        },
        ctaPresence: calculateCTAPresence(enhancedTargetPages),
        schemaMarkupPresence: calculateSchemaPresence(enhancedTargetPages),
      },
      competitorBenchmarks: {
        averageWordCount: competitorDepth.averageWordCount,
        averageImageCount: competitorDepth.averageImageCount,
        averageSectionCount: competitorDepth.averageH2Count + competitorDepth.averageH3Count,
        commonSchemaTypes: competitorDepth.commonSchemaTypes || [],
      },
      contentGaps: gaps.map(g => ({
        suggestedUrl: g.suggestedUrl,
        pageType: g.pageType,
        competitorCount: g.competitorCount,
        priority: g.priority,
      })),
    };

    console.log('✅ Phase 1 complete:', {
      targetPages: enhancedTargetPages.length,
      competitorPages: allCompetitorEnhanced.reduce((sum, c) => sum + c.pages.length, 0),
      gaps: gaps.length
    });
  } catch (error) {
    console.warn('⚠️  Phase 1 (Intelligence) failed, continuing without enhanced data:', error);
  }
}
```

### Task 1.4: Add Intelligence Data to Return Statement
**File:** `src/lib/generator.ts`

**Location:** In the final `return` statement of `generateSeoReport`

Add:
```typescript
return {
  // ... existing fields ...
  intelligence: intelligenceReport,
};
```

### Task 1.5: Test Phase 1 Integration
**Action:** Build and verify no TypeScript errors

```bash
cd /Users/deannewton/Projects/SEO\ Wizard/seo-wizard
npx tsc --noEmit
```

Expected: No errors related to Phase 1 integration

### Success Criteria
- ✅ No TypeScript compilation errors
- ✅ Generator imports Phase 1 modules correctly
- ✅ Helper functions added
- ✅ Intelligence report structure matches SeoReport type
- ✅ Graceful error handling with try-catch

---

## 📋 Agent 2: Phase 2 Integration (Strategy)

### Task 2.1: Import Phase 2 Modules
**File:** `src/lib/generator.ts`

Add imports:
```typescript
import { buildStrategy } from './adapters/strategy-adapter';
```

### Task 2.2: Integrate Phase 2 into Generator Pipeline
**File:** `src/lib/generator.ts`

**Location:** After Phase 1 intelligence block

Add this code:
```typescript
// ========================================
// PHASE 2: STRATEGIC PLANNING
// ========================================
let strategyReport = null;

if (input.enhancedFeatures?.enableStrategy && intelligenceReport) {
  console.log('🎯 Phase 2: Strategic Planning...');
  try {
    // Gather all keywords
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
      targetSite: {
        domain: targetSite.domain,
        pages: [] // Will be populated by Agent 1's enhanced pages
      },
      competitors: [], // Will be populated by Agent 1's enhanced pages
      competitorInventory: intelligenceReport.contentGaps,
      contentDepthMetrics: intelligenceReport.competitorBenchmarks,
      businessType: input.businessType,
    });

    strategyReport = {
      keywordClusters: strategy.clusters.map((c: any) => ({
        name: c.name,
        primaryKeyword: c.primaryKeyword,
        totalVolume: c.totalVolume || 0,
        averageDifficulty: c.averageDifficulty || 0,
        keywords: c.keywords.map((k: any) => k.keyword),
      })),
      pageStrategies: strategy.mappings.map((m: any) => {
        const target = strategy.targets.find((t: any) => t.url === m.url);
        return {
          url: m.url,
          pageType: m.pageType || 'other',
          primaryKeyword: m.primaryKeyword,
          secondaryKeywords: m.secondaryKeywords || [],
          priority: m.priority || 5,
          status: m.status || 'create',
          contentTargets: target ? {
            wordCount: target.wordCount,
            sectionCount: target.sectionCount,
            imageCount: target.imageCount,
            includeFAQ: target.includeFAQ || false,
          } : undefined,
        };
      }),
      internalLinkingMap: strategy.linking?.links?.map((link: any) => ({
        fromUrl: link.fromUrl,
        toUrl: link.toUrl,
        anchorText: link.anchorText,
      })) || [],
    };

    console.log('✅ Phase 2 complete:', {
      clusters: strategy.clusters.length,
      pageStrategies: strategy.mappings.length,
      links: strategy.linking?.links?.length || 0
    });
  } catch (error) {
    console.warn('⚠️  Phase 2 (Strategy) failed, continuing without strategy data:', error);
  }
}
```

### Task 2.3: Add Strategy Data to Return Statement
**File:** `src/lib/generator.ts`

Add:
```typescript
return {
  // ... existing ...
  strategy: strategyReport,
};
```

### Task 2.4: Test Phase 2 Integration
```bash
npx tsc --noEmit
```

### Success Criteria
- ✅ No TypeScript errors
- ✅ Phase 2 only runs if Phase 1 succeeded
- ✅ Strategy report structure matches type
- ✅ Graceful error handling

---

## 📋 Agent 3: Phase 3 Integration (Blueprints)

### Task 3.1: Import Phase 3 Modules
**File:** `src/lib/generator.ts`

Add:
```typescript
import { assembleSiteBlueprints } from './blueprints';
```

### Task 3.2: Integrate Phase 3 into Generator Pipeline
**File:** `src/lib/generator.ts`

**Location:** After Phase 2 strategy block

```typescript
// ========================================
// PHASE 3: CONTENT BLUEPRINTS
// ========================================
let blueprints = null;

if (input.enhancedFeatures?.enableBlueprints && strategyReport) {
  console.log('📐 Phase 3: Content Blueprints...');
  try {
    const businessInfo = {
      name: input.businessName,
      businessType: input.businessType,
      serviceArea: locationContext.serviceArea || locationContext.primaryLocation || '',
      address: locationContext.address || input.businessAddress || '',
      phone: '',
      email: '',
      website: input.website,
    };

    // Convert page strategies to PageStrategy format
    const pageStrategies = strategyReport.pageStrategies.map(ps => ({
      url: ps.url,
      pageType: ps.pageType,
      primaryKeyword: ps.primaryKeyword,
      secondaryKeywords: ps.secondaryKeywords,
      contentTargets: ps.contentTargets || {
        wordCount: 800,
        sectionCount: 5,
        imageCount: 3,
        includeFAQ: false
      },
      priority: ps.priority,
      status: ps.status,
    }));

    blueprints = assembleSiteBlueprints(pageStrategies, businessInfo);

    console.log('✅ Phase 3 complete:', {
      blueprints: blueprints.length
    });
  } catch (error) {
    console.warn('⚠️  Phase 3 (Blueprints) failed, continuing without blueprints:', error);
  }
}
```

### Task 3.3: Add Blueprints to Return Statement
```typescript
return {
  // ... existing ...
  blueprints,
};
```

### Task 3.4: Test Phase 3 Integration
```bash
npx tsc --noEmit
```

### Success Criteria
- ✅ No TypeScript errors
- ✅ Phase 3 only runs if Phase 2 succeeded
- ✅ Blueprints array matches type
- ✅ Business info correctly mapped

---

## 📋 Agent 4: Phase 4 Integration (Content Generation)

### Task 4.1: Import Phase 4 Modules
**File:** `src/lib/generator.ts`

Add:
```typescript
import { generateMultiplePages } from './generation';
```

### Task 4.2: Add OpenAI Cost Estimator
**File:** `src/lib/generator.ts`

Add helper:
```typescript
function estimateGenerationCost(blueprintCount: number): number {
  // Rough estimate: $0.04 per page (4 sections + metadata + FAQs)
  return blueprintCount * 0.04;
}
```

### Task 4.3: Integrate Phase 4 into Generator Pipeline
**File:** `src/lib/generator.ts`

**Location:** After Phase 3 blueprints block

```typescript
// ========================================
// PHASE 4: AI CONTENT GENERATION
// ========================================
let generatedContent = null;

if (input.enhancedFeatures?.enableAIGeneration && blueprints) {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    console.warn('⚠️  OPENAI_API_KEY not found, skipping AI generation');
  } else {
    console.log('✍️  Phase 4: AI Content Generation...');
    try {
      const businessContext = {
        businessName: input.businessName,
        businessType: input.businessType,
        location: locationContext.primaryLocation || '',
        serviceArea: locationContext.serviceArea || '',
      };

      const options = {
        businessContext,
        includeImagePlaceholders: true,
        enforceQuality: true,
        minQualityScore: 70,
      };

      // Limit to top 5 priority pages to control costs
      const topPriorityBlueprints = blueprints
        .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 5);

      const estimatedCost = estimateGenerationCost(topPriorityBlueprints.length);
      console.log(`💰 Estimated OpenAI cost: $${estimatedCost.toFixed(2)}`);

      generatedContent = await generateMultiplePages(
        topPriorityBlueprints,
        options
      );

      console.log('✅ Phase 4 complete:', {
        pagesGenerated: generatedContent.length,
        avgQuality: generatedContent.reduce((sum: number, c: any) => sum + c.qualityScore, 0) / generatedContent.length
      });
    } catch (error) {
      console.error('⚠️  Phase 4 (Content Generation) failed:', error);
    }
  }
}
```

### Task 4.4: Add Generated Content to Return Statement
```typescript
return {
  // ... existing ...
  generatedContent,
};
```

### Task 4.5: Test Phase 4 Integration
```bash
npx tsc --noEmit
```

### Success Criteria
- ✅ No TypeScript errors
- ✅ OpenAI key check before generation
- ✅ Cost estimation logged
- ✅ Limits to top 5 pages
- ✅ Quality scores logged

---

## 📋 Agent 5: Phase 5 Integration (Enhanced Report)

### Task 5.1: Import Phase 5 Module
**File:** `src/app/page.tsx`

Add:
```typescript
import { generateEnhancedReport } from '@/lib/report';
```

### Task 5.2: Update Report Rendering Logic
**File:** `src/app/page.tsx`

**Location:** Where `renderReportHtml` is called (around line 100-150)

Replace:
```typescript
const html = renderReportHtml(data);
```

With:
```typescript
const html = data.intelligence || data.strategy || data.blueprints || data.generatedContent
  ? generateEnhancedReport(data)
  : renderReportHtml(data);
```

### Task 5.3: Test Phase 5 Integration
```bash
npx tsc --noEmit
npm run build
```

### Success Criteria
- ✅ No TypeScript errors
- ✅ Falls back to old template if no enhanced data
- ✅ Uses new template when any phase data present
- ✅ Build succeeds

---

## 📋 Agent 6: Testing & Validation

### Task 6.1: TypeScript Compilation Check
```bash
cd /Users/deannewton/Projects/SEO\ Wizard/seo-wizard
npx tsc --noEmit
```

**Expected:** No errors

### Task 6.2: Build Check
```bash
npm run build
```

**Expected:** Successful build

### Task 6.3: Create Integration Test Script
**File:** `test-integration.ts`

```typescript
import type { SiteInput } from './src/lib/types';

const testInput: SiteInput = {
  businessName: 'Test Business',
  website: 'https://example.com',
  businessType: 'restaurant',
  competitors: ['https://competitor1.com', 'https://competitor2.com'],
  businessAddress: '123 Test St, Test City',
  serviceArea: 'Test Area',
  useSenseCheck: true,
  enhancedFeatures: {
    enableEnhancedIntelligence: true,
    enableStrategy: true,
    enableBlueprints: true,
    enableAIGeneration: false, // Skip to avoid costs in testing
    enableEnhancedReport: true,
  }
};

console.log('Integration test input:', JSON.stringify(testInput, null, 2));
console.log('✅ Feature flags structure valid');
```

Run:
```bash
npx tsx test-integration.ts
```

### Task 6.4: Error Handling Audit

**Check:** Each phase has try-catch with console.warn
**Check:** Each phase checks for dependencies (e.g., Phase 2 checks for intelligenceReport)
**Check:** Each phase returns null on failure
**Check:** Pipeline continues if phase fails

### Task 6.5: Backward Compatibility Test

**Verify:** Old input format (without enhancedFeatures) still works
**Verify:** Report without phase data still renders with old template

### Task 6.6: Performance Check

**Action:** Add timing logs to each phase

```typescript
const phase1Start = Date.now();
// ... phase 1 code ...
console.log(`Phase 1 took ${Date.now() - phase1Start}ms`);
```

### Task 6.7: Documentation Update
**File:** `docs/INTEGRATION-COMPLETE.md`

Document:
- Feature flag options
- Example configurations
- Performance benchmarks
- Troubleshooting guide

### Success Criteria
- ✅ All TypeScript checks pass
- ✅ Build succeeds
- ✅ Integration test runs
- ✅ Error handling verified
- ✅ Backward compatibility confirmed
- ✅ Performance logged
- ✅ Documentation complete

---

## 🎛️ Agent Coordination Notes

### Data Flow
1. **Agent 1** enriches page data → stores in `intelligenceReport`
2. **Agent 2** uses `intelligenceReport` → stores in `strategyReport`
3. **Agent 3** uses `strategyReport` → stores in `blueprints`
4. **Agent 4** uses `blueprints` → stores in `generatedContent`
5. **Agent 5** uses all data → generates enhanced HTML
6. **Agent 6** tests all integrations → validates pipeline

### Shared Variables (in generator.ts)
- `intelligenceReport` (Phase 1 output)
- `strategyReport` (Phase 2 output)
- `blueprints` (Phase 3 output)
- `generatedContent` (Phase 4 output)

### Critical Points
- Each agent must maintain existing generator functionality
- All phase blocks must use try-catch
- All phase data must be optional in return statement
- No phase should block the pipeline on failure

---

## 🚀 Execution Plan

### Parallel Agents (Run Simultaneously)
**Agent 1-4:** Can work on separate sections of generator.ts
**Agent 5:** Works on page.tsx (separate file)
**Agent 6:** Works on test files (separate)

### Sequential Dependencies
After all agents complete:
1. Merge all generator.ts changes carefully (Agents 1-4)
2. Test merged generator.ts
3. Run Agent 6 validation
4. Fix any merge conflicts or errors
5. Final integration test

---

## 📊 Success Metrics

- ✅ All 5 phases integrated
- ✅ Feature flags working
- ✅ No breaking changes
- ✅ Graceful degradation on errors
- ✅ TypeScript compilation success
- ✅ Build success
- ✅ Backward compatible
- ✅ Performance < 60 seconds per report

---

**Ready for parallel agent deployment!** 🚀

All agents have clear tasks, dependencies, and success criteria.
