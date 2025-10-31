/**
 * Example usage of the Strategy module
 *
 * This demonstrates how to use all Phase 2 modules together to generate
 * a complete SEO strategy from intelligence data.
 */

import type { KeywordStat } from "../types";
import {
  clusterKeywords,
  mapKeywordsToPages,
  identifyPageGaps,
  calculateContentTargets,
  buildLinkingBlueprint,
  detectKeywordCannibalization,
  validateContentTargets,
  calculateLinkingMetrics,
} from "./index";
import type {
  StrategyReport,
  CompetitorPageInventory,
  ContentDepthMetrics,
  PageStrategy,
} from "./types";

/**
 * Sample data: Keywords discovered from Phase 1 intelligence gathering
 */
const sampleKeywords: KeywordStat[] = [
  // Custom design cluster
  {
    keyword: "custom tattoo design",
    score: 9,
    density: 3.2,
    volume: 1200,
    difficulty: 35,
    intent: "commercial",
    source: "competitor",
  },
  {
    keyword: "bespoke tattoo edinburgh",
    score: 8,
    density: 2.8,
    volume: 800,
    difficulty: 30,
    intent: "commercial",
    source: "dataset",
  },
  {
    keyword: "unique tattoo ideas",
    score: 7,
    density: 2.1,
    volume: 950,
    difficulty: 28,
    intent: "informational",
    source: "site",
  },

  // Aftercare cluster
  {
    keyword: "tattoo aftercare",
    score: 9,
    density: 3.5,
    volume: 2200,
    difficulty: 25,
    intent: "informational",
    source: "competitor",
  },
  {
    keyword: "tattoo healing process",
    score: 8,
    density: 2.9,
    volume: 1500,
    difficulty: 22,
    intent: "informational",
    source: "dataset",
  },
  {
    keyword: "new tattoo care",
    score: 7,
    density: 2.3,
    volume: 1100,
    difficulty: 20,
    intent: "informational",
    source: "site",
  },

  // Removal cluster
  {
    keyword: "tattoo removal edinburgh",
    score: 8,
    density: 2.7,
    volume: 1400,
    difficulty: 40,
    intent: "commercial",
    source: "competitor",
  },
  {
    keyword: "laser tattoo removal",
    score: 7,
    density: 2.2,
    volume: 1800,
    difficulty: 45,
    intent: "commercial",
    source: "dataset",
  },

  // Cover-up cluster
  {
    keyword: "tattoo cover up",
    score: 8,
    density: 2.6,
    volume: 1300,
    difficulty: 35,
    intent: "commercial",
    source: "competitor",
  },
  {
    keyword: "cover up tattoo ideas",
    score: 6,
    density: 1.8,
    volume: 900,
    difficulty: 28,
    intent: "informational",
    source: "dataset",
  },

  // Studio/local cluster
  {
    keyword: "tattoo studio edinburgh",
    score: 9,
    density: 3.8,
    volume: 2500,
    difficulty: 50,
    intent: "navigational",
    source: "competitor",
  },
  {
    keyword: "best tattoo artist edinburgh",
    score: 8,
    density: 3.1,
    volume: 1600,
    difficulty: 48,
    intent: "commercial",
    source: "dataset",
  },
];

/**
 * Sample data: Existing pages on target site
 */
const existingPages = [
  "/",
  "/services",
  "/portfolio",
  "/contact",
  "/about",
];

/**
 * Sample data: Competitor page inventory from Phase 1
 */
const competitorInventory: CompetitorPageInventory = {
  allPages: [
    {
      url: "https://competitor1.com/services/tattoo-removal",
      competitor: "Competitor 1",
      pageType: "service",
    },
    {
      url: "https://competitor2.com/services/tattoo-removal",
      competitor: "Competitor 2",
      pageType: "service",
    },
    {
      url: "https://competitor1.com/services/cover-ups",
      competitor: "Competitor 1",
      pageType: "service",
    },
    {
      url: "https://competitor2.com/services/cover-ups",
      competitor: "Competitor 2",
      pageType: "service",
    },
    {
      url: "https://competitor3.com/services/custom-tattoos",
      competitor: "Competitor 3",
      pageType: "service",
    },
    {
      url: "https://competitor1.com/blog/tattoo-aftercare-guide",
      competitor: "Competitor 1",
      pageType: "blog",
    },
    {
      url: "https://competitor2.com/blog/aftercare-tips",
      competitor: "Competitor 2",
      pageType: "blog",
    },
    {
      url: "https://competitor3.com/pricing",
      competitor: "Competitor 3",
      pageType: "pricing",
    },
  ],
  competitorUrls: [
    [
      "https://competitor1.com/services/tattoo-removal",
      "https://competitor1.com/services/cover-ups",
      "https://competitor1.com/blog/tattoo-aftercare-guide",
    ],
    [
      "https://competitor2.com/services/tattoo-removal",
      "https://competitor2.com/services/cover-ups",
      "https://competitor2.com/blog/aftercare-tips",
    ],
    [
      "https://competitor3.com/services/custom-tattoos",
      "https://competitor3.com/pricing",
    ],
  ],
  commonPageTypes: new Map([
    ["service", ["tattoo-removal", "cover-ups", "custom-tattoos"]],
    ["blog", ["tattoo-aftercare-guide", "aftercare-tips"]],
    ["pricing", ["pricing"]],
  ]),
};

/**
 * Sample data: Competitor content depth metrics from Phase 1
 */
const competitorMetrics: ContentDepthMetrics = {
  averageWordCount: 1200,
  averageImageCount: 5,
  averageSectionCount: 6,
  faqPresence: 0.7, // 70% of competitors have FAQ sections
};

/**
 * Generates a complete SEO strategy from Phase 1 intelligence data
 */
export function generateExampleStrategy(): StrategyReport {
  console.log("🎯 Phase 2: Strategic Planning");
  console.log("================================\n");

  // Step 1: Cluster keywords
  console.log("Step 1: Clustering keywords...");
  const clusters = clusterKeywords(sampleKeywords, {
    minClusterSize: 2,
    similarityThreshold: 0.3,
    maxClusters: 20,
  });

  console.log(`✓ Created ${clusters.length} keyword clusters:`);
  clusters.forEach((cluster) => {
    console.log(
      `  - ${cluster.name}: ${cluster.keywords.length} keywords, ${cluster.totalVolume} volume`
    );
  });
  console.log();

  // Step 2: Map keywords to pages
  console.log("Step 2: Mapping keywords to pages...");
  const competitorPages = competitorInventory.allPages.map((p) => p.url);
  let mappings = mapKeywordsToPages(clusters, existingPages, competitorPages);

  console.log(`✓ Created ${mappings.length} page mappings`);
  console.log(
    `  - ${mappings.filter((m) => m.status === "create").length} new pages to create`
  );
  console.log(
    `  - ${mappings.filter((m) => m.status === "optimize").length} existing pages to optimize`
  );
  console.log(
    `  - ${mappings.filter((m) => m.status === "keep").length} pages to keep as-is`
  );

  // Check for keyword cannibalization
  const cannibalizationWarnings = detectKeywordCannibalization(mappings);
  if (cannibalizationWarnings.length > 0) {
    console.log(`⚠️  Found ${cannibalizationWarnings.length} cannibalization issues`);
  }
  console.log();

  // Step 3: Identify page gaps
  console.log("Step 3: Analyzing page gaps...");
  const gaps = identifyPageGaps(
    existingPages,
    competitorInventory,
    sampleKeywords
  );

  console.log(`✓ Found ${gaps.length} content gaps:`);
  gaps.slice(0, 3).forEach((gap) => {
    console.log(
      `  - ${gap.suggestedUrl} (priority ${gap.priority}/10): ${gap.competitorCount} competitors have this`
    );
  });
  console.log();

  // Step 4: Calculate content targets
  console.log("Step 4: Calculating content targets...");
  const targets = calculateContentTargets(mappings, competitorMetrics);

  console.log(`✓ Generated content targets for ${targets.length} pages`);
  const avgWordCount =
    targets.reduce((sum, t) => sum + t.wordCount, 0) / targets.length;
  console.log(`  - Average target word count: ${Math.round(avgWordCount)}`);

  const validationIssues = validateContentTargets(targets);
  if (validationIssues.length > 0) {
    console.log(`⚠️  Found ${validationIssues.length} target validation issues`);
  }
  console.log();

  // Step 5: Build page strategies (combine mappings + targets)
  console.log("Step 5: Building page strategies...");
  const pageStrategies: PageStrategy[] = mappings.map((mapping) => {
    const target = targets.find((t) => t.url === mapping.url);
    const priority = calculatePriority(mapping);

    return {
      ...mapping,
      contentTarget: target || {
        url: mapping.url,
        wordCount: 800,
        sectionCount: 5,
        imageCount: 3,
        includeFAQ: false,
        competitorBenchmark: {
          averageWordCount: 800,
          averageImageCount: 3,
        },
      },
      priority,
      internalLinks: { inbound: [], outbound: [] },
    };
  });

  console.log(`✓ Created ${pageStrategies.length} complete page strategies`);
  console.log();

  // Step 6: Generate internal linking blueprint
  console.log("Step 6: Generating internal linking blueprint...");
  const linkingBlueprint = buildLinkingBlueprint(pageStrategies);

  const linkMetrics = calculateLinkingMetrics(linkingBlueprint);
  console.log(`✓ Generated ${linkMetrics.totalLinks} internal links`);
  console.log(`  - Hub pages: ${linkMetrics.hubPagesCount}`);
  console.log(`  - Spoke pages: ${linkMetrics.spokePagesCount}`);
  console.log(
    `  - Average links per page: ${linkMetrics.averageLinksPerPage.toFixed(1)}`
  );
  if (linkMetrics.orphanPagesCount > 0) {
    console.log(`  ⚠️  Orphan pages: ${linkMetrics.orphanPagesCount}`);
  }
  console.log();

  // Step 7: Assemble final report
  console.log("Step 7: Assembling strategy report...");

  const pagesToCreate = pageStrategies.filter((p) => p.status === "create")
    .length;
  const pagesToOptimize = pageStrategies.filter((p) => p.status === "optimize")
    .length;

  const report: StrategyReport = {
    keywordClusters: clusters,
    pageStrategies,
    pageGaps: gaps,
    internalLinkingBlueprint: linkingBlueprint,
    summary: {
      totalPages: pageStrategies.length,
      pagesToCreate,
      pagesToOptimize,
      totalKeywordClusters: clusters.length,
      estimatedWorkload: estimateWorkload(pageStrategies),
    },
  };

  console.log("✓ Strategy report complete!\n");

  // Print summary
  console.log("📊 Strategy Summary");
  console.log("===================");
  console.log(`Total pages in strategy: ${report.summary.totalPages}`);
  console.log(`New pages to create: ${report.summary.pagesToCreate}`);
  console.log(`Existing pages to optimize: ${report.summary.pagesToOptimize}`);
  console.log(`Keyword clusters identified: ${report.summary.totalKeywordClusters}`);
  console.log(`Estimated workload: ${report.summary.estimatedWorkload}`);
  console.log(`Content gaps found: ${gaps.length}`);
  console.log(`Internal links to implement: ${linkingBlueprint.links.length}\n`);

  return report;
}

/**
 * Calculates priority score (1-10) for a page mapping
 */
function calculatePriority(mapping: any): number {
  let score = 0;

  // Keyword volume (0-5 points)
  const volume = mapping.cluster.totalVolume ?? 0;
  score += Math.min(volume / 400, 5);

  // Page type (0-3 points)
  if (mapping.pageType === "service") score += 3;
  else if (mapping.pageType === "homepage") score += 4;
  else if (mapping.pageType === "blog") score += 1;

  // Status (0-2 points)
  if (mapping.status === "create") score += 2;
  else if (mapping.status === "optimize") score += 1;

  // Intent (0-2 points)
  if (
    mapping.cluster.intent === "commercial" ||
    mapping.cluster.intent === "transactional"
  ) {
    score += 2;
  }

  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Estimates workload based on page strategies
 */
function estimateWorkload(strategies: PageStrategy[]): string {
  const createCount = strategies.filter((s) => s.status === "create").length;
  const optimizeCount = strategies.filter((s) => s.status === "optimize")
    .length;

  // 1 week per new page, 0.5 weeks per optimization
  const weeks = Math.ceil(createCount * 1 + optimizeCount * 0.5);

  return `${weeks}-${Math.ceil(weeks * 1.5)} weeks`;
}

/**
 * Pretty prints a strategy report
 */
export function printStrategyReport(report: StrategyReport): void {
  console.log("\n" + "=".repeat(80));
  console.log("COMPLETE STRATEGY REPORT");
  console.log("=".repeat(80) + "\n");

  // Section 1: Keyword Clusters
  console.log("📌 KEYWORD CLUSTERS");
  console.log("-".repeat(80));
  report.keywordClusters.forEach((cluster, index) => {
    console.log(`\n${index + 1}. ${cluster.name} (${cluster.id})`);
    console.log(`   Primary: ${cluster.primaryKeyword}`);
    console.log(`   Keywords: ${cluster.keywords.length}`);
    console.log(`   Total Volume: ${cluster.totalVolume.toLocaleString()}`);
    console.log(`   Avg Difficulty: ${cluster.averageDifficulty.toFixed(1)}`);
    console.log(`   Intent: ${cluster.intent || "unknown"}`);
  });

  // Section 2: Page Strategies
  console.log("\n\n🏗️  PAGE STRATEGIES");
  console.log("-".repeat(80));

  const createPages = report.pageStrategies.filter((p) => p.status === "create");
  const optimizePages = report.pageStrategies.filter(
    (p) => p.status === "optimize"
  );

  console.log(`\n🟢 NEW PAGES (${createPages.length})`);
  createPages.forEach((page) => {
    console.log(`\n   ${page.url}`);
    console.log(`   Primary: ${page.primaryKeyword}`);
    console.log(`   Priority: ${page.priority}/10`);
    console.log(
      `   Target: ${page.contentTarget.wordCount} words, ${page.contentTarget.sectionCount} sections`
    );
  });

  console.log(`\n\n🔵 OPTIMIZE EXISTING (${optimizePages.length})`);
  optimizePages.forEach((page) => {
    console.log(`\n   ${page.url}`);
    console.log(`   Primary: ${page.primaryKeyword}`);
    console.log(
      `   Target: ${page.contentTarget.wordCount} words, ${page.contentTarget.sectionCount} sections`
    );
  });

  // Section 3: Content Gaps
  console.log("\n\n🔍 CONTENT GAPS");
  console.log("-".repeat(80));
  report.pageGaps.slice(0, 5).forEach((gap) => {
    console.log(`\n   ${gap.suggestedUrl}`);
    console.log(`   Priority: ${gap.priority}/10`);
    console.log(`   ${gap.competitorCount} competitors have this page`);
    if (gap.estimatedVolume) {
      console.log(`   Est. Volume: ${gap.estimatedVolume.toLocaleString()}`);
    }
    console.log(`   Reasoning: ${gap.reasoning}`);
  });

  // Section 4: Internal Linking
  console.log("\n\n🔗 INTERNAL LINKING");
  console.log("-".repeat(80));
  console.log(`Total links: ${report.internalLinkingBlueprint.links.length}`);
  console.log(
    `Hub pages: ${report.internalLinkingBlueprint.hubPages.length}`
  );
  console.log(
    `Spoke pages: ${report.internalLinkingBlueprint.spokePages.length}`
  );

  console.log("\nSample links:");
  report.internalLinkingBlueprint.links.slice(0, 5).forEach((link) => {
    console.log(`   ${link.fromUrl} → ${link.toUrl}`);
    console.log(`   Anchor: "${link.anchorText}"`);
    console.log(`   Context: ${link.context}`);
    console.log();
  });

  // Section 5: Summary
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total pages: ${report.summary.totalPages}`);
  console.log(`Pages to create: ${report.summary.pagesToCreate}`);
  console.log(`Pages to optimize: ${report.summary.pagesToOptimize}`);
  console.log(`Keyword clusters: ${report.summary.totalKeywordClusters}`);
  console.log(`Estimated workload: ${report.summary.estimatedWorkload}`);
  console.log("=".repeat(80) + "\n");
}

// Run example if executed directly
if (require.main === module) {
  const report = generateExampleStrategy();
  printStrategyReport(report);
}
