/**
 * Example usage of the intelligence gathering modules
 *
 * This file demonstrates how to use the enhanced intelligence gathering
 * capabilities to analyze a target site and competitors.
 *
 * NOTE: This is an example file for documentation purposes.
 * It is not imported by the main application.
 */

import { crawlSite } from '../crawler';
import { fetchPageHtml } from '../fetcher';
import {
  analyzePageEnhanced,
  analyzeContentDepth,
  buildPageInventory,
  identifyContentGaps,
  auditImagesDetailed,
  generateImageRecommendations,
  generatePageRecommendations,
  compareToCompetitors,
  aggregateCompetitorMetrics,
  findBestPerformingCompetitor,
} from './index';
import type { EnhancedPageAnalysis, IntelligenceReport } from './types';

/**
 * Example: Complete intelligence gathering workflow
 */
export async function gatherIntelligence(
  targetUrl: string,
  competitorUrls: string[],
  businessContext: { type: string; location?: string }
): Promise<IntelligenceReport> {
  console.log('🔍 Starting intelligence gathering...');

  // Step 1: Crawl target site
  console.log('📊 Analyzing target site:', targetUrl);
  const targetPages = await crawlSite({
    startUrl: targetUrl,
    limit: 20,
    maxDepth: 3,
    sameDomainOnly: true,
  });

  // Step 2: Enhance target site analysis
  const targetEnhanced: EnhancedPageAnalysis[] = [];
  const targetPagesWithHtml: Array<{ url: string; html: string }> = [];

  for (const page of targetPages) {
    if (page.status !== 'ok') continue;

    const result = await fetchPageHtml(page.url);
    if (!result.ok) continue;

    const enhanced = await analyzePageEnhanced(result.url, result.html, businessContext);
    targetEnhanced.push(enhanced);
    targetPagesWithHtml.push({ url: result.url, html: result.html });
  }

  // Step 3: Perform image audit on target site
  console.log('🖼️  Auditing images...');
  const imageAudit = auditImagesDetailed(targetPagesWithHtml, businessContext);
  const imageRecommendations = generateImageRecommendations(imageAudit);
  console.log(`Found ${imageAudit.totalImages} images, ${imageAudit.imagesWithAlt} with alt text`);

  // Step 4: Extract existing CTAs and schema types
  const existingCTAs = targetEnhanced.flatMap(page => page.ctas);
  const allSchemaTypes = new Set<string>();
  targetEnhanced.forEach(page => {
    page.schemaTypes.forEach(type => allSchemaTypes.add(type));
  });

  // Step 5: Crawl and analyze competitors
  console.log('🏆 Analyzing competitors...');
  const competitors: Array<{
    domain: string;
    pages: EnhancedPageAnalysis[];
    contentDepth: ReturnType<typeof analyzeContentDepth>;
  }> = [];

  for (const competitorUrl of competitorUrls) {
    console.log('  - Crawling:', competitorUrl);

    const competitorPages = await crawlSite({
      startUrl: competitorUrl,
      limit: 20,
      maxDepth: 3,
      sameDomainOnly: true,
    });

    const competitorEnhanced: EnhancedPageAnalysis[] = [];

    for (const page of competitorPages) {
      if (page.status !== 'ok') continue;

      const result = await fetchPageHtml(page.url);
      if (!result.ok) continue;

      const enhanced = await analyzePageEnhanced(result.url, result.html, businessContext);
      competitorEnhanced.push(enhanced);
    }

    const contentDepth = analyzeContentDepth(competitorEnhanced);

    competitors.push({
      domain: new URL(competitorUrl).hostname,
      pages: competitorEnhanced,
      contentDepth,
    });
  }

  // Step 6: Build competitor page inventory
  console.log('📋 Building page inventory...');
  const competitorInventory = buildPageInventory(competitors);

  // Step 7: Identify content gaps
  const contentGaps = identifyContentGaps(targetEnhanced, competitorInventory, 2);
  const pageRecommendations = generatePageRecommendations(contentGaps, competitors.length);

  console.log(`Found ${contentGaps.length} content gaps`);

  // Step 8: Calculate benchmarks
  const competitorMetrics = aggregateCompetitorMetrics(competitors);
  const targetMetrics = analyzeContentDepth(targetEnhanced);

  const benchmarks = {
    averageWordCount: competitorMetrics.averageWordCount,
    averageImageCount: competitorMetrics.averageImageCount,
    averageSectionCount: competitorMetrics.averageH2Count + competitorMetrics.averageH3Count,
  };

  // Step 9: Generate comparison insights
  const comparisonInsights = compareToCompetitors(targetMetrics, competitorMetrics);
  comparisonInsights.forEach(insight => console.log('💡', insight));

  // Step 10: Find best-performing competitor
  const bestCompetitor = findBestPerformingCompetitor(competitors);
  if (bestCompetitor) {
    console.log(`🥇 Best-performing competitor: ${bestCompetitor.domain} (score: ${bestCompetitor.score})`);
  }

  // Step 11: Assemble complete intelligence report
  const report: IntelligenceReport = {
    targetSite: {
      pages: targetEnhanced,
      imageAudit,
      existingCTAs,
      existingSchemaTypes: Array.from(allSchemaTypes),
    },
    competitors,
    competitorInventory,
    benchmarks,
  };

  console.log('✅ Intelligence gathering complete!');
  return report;
}

/**
 * Example: Quick analysis of a single page
 */
export async function analyzePageQuick(
  url: string,
  businessContext: { type: string; location?: string }
): Promise<EnhancedPageAnalysis> {
  console.log('🔍 Analyzing page:', url);

  const result = await fetchPageHtml(url);
  if (!result.ok) {
    throw new Error(`Failed to fetch page: ${result.error}`);
  }

  const analysis = await analyzePageEnhanced(result.url, result.html, businessContext);

  console.log(`Page type: ${analysis.pageType}`);
  console.log(`Word count: ${analysis.wordCount}`);
  console.log(`Images: ${analysis.imageCount}`);
  console.log(`H2 headings: ${analysis.h2Count}`);
  console.log(`H3 headings: ${analysis.h3Count}`);
  console.log(`Schema types: ${analysis.schemaTypes.join(', ') || 'None'}`);
  console.log(`CTAs found: ${analysis.ctas.length}`);
  console.log(`Has FAQ: ${analysis.hasFAQ ? 'Yes' : 'No'}`);

  return analysis;
}

/**
 * Example: Compare target site against competitors
 */
export async function compareWithCompetitors(
  targetUrl: string,
  competitorUrls: string[]
): Promise<void> {
  console.log('🔍 Starting comparison analysis...');

  // Crawl target
  const targetPages = await crawlSite({
    startUrl: targetUrl,
    limit: 15,
    maxDepth: 2,
  });

  const targetEnhanced: EnhancedPageAnalysis[] = [];
  for (const page of targetPages) {
    if (page.status !== 'ok') continue;
    const result = await fetchPageHtml(page.url);
    if (!result.ok) continue;
    const enhanced = await analyzePageEnhanced(result.url, result.html);
    targetEnhanced.push(enhanced);
  }

  const targetMetrics = analyzeContentDepth(targetEnhanced);

  // Crawl competitors
  const competitors: Array<{ domain: string; pages: EnhancedPageAnalysis[] }> = [];

  for (const compUrl of competitorUrls) {
    const pages = await crawlSite({ startUrl: compUrl, limit: 15, maxDepth: 2 });
    const enhanced: EnhancedPageAnalysis[] = [];

    for (const page of pages) {
      if (page.status !== 'ok') continue;
      const result = await fetchPageHtml(page.url);
      if (!result.ok) continue;
      const enhancedPage = await analyzePageEnhanced(result.url, result.html);
      enhanced.push(enhancedPage);
    }

    competitors.push({
      domain: new URL(compUrl).hostname,
      pages: enhanced,
    });
  }

  const competitorMetrics = aggregateCompetitorMetrics(competitors);

  // Display comparison
  console.log('\n📊 COMPARISON RESULTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Target Word Count:     ${targetMetrics.averageWordCount}`);
  console.log(`Competitor Avg:        ${competitorMetrics.averageWordCount}`);
  console.log(`Difference:            ${targetMetrics.averageWordCount - competitorMetrics.averageWordCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Target Images/Page:    ${targetMetrics.averageImageCount.toFixed(1)}`);
  console.log(`Competitor Avg:        ${competitorMetrics.averageImageCount.toFixed(1)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Target Sections/Page:  ${(targetMetrics.averageH2Count + targetMetrics.averageH3Count).toFixed(1)}`);
  console.log(`Competitor Avg:        ${(competitorMetrics.averageH2Count + competitorMetrics.averageH3Count).toFixed(1)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Target FAQ Rate:       ${(targetMetrics.faqPresenceRate * 100).toFixed(0)}%`);
  console.log(`Competitor FAQ Rate:   ${(competitorMetrics.faqPresenceRate * 100).toFixed(0)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Show insights
  const insights = compareToCompetitors(targetMetrics, competitorMetrics);
  console.log('💡 INSIGHTS:');
  insights.forEach(insight => console.log(`  - ${insight}`));
}

/**
 * Example: Find missing pages from competitors
 */
export async function findMissingPages(
  targetUrl: string,
  competitorUrls: string[]
): Promise<void> {
  console.log('🔍 Identifying missing pages...');

  // Crawl all sites
  const targetPages = await crawlSite({ startUrl: targetUrl, limit: 20, maxDepth: 2 });
  const targetEnhanced: EnhancedPageAnalysis[] = [];

  for (const page of targetPages) {
    if (page.status !== 'ok') continue;
    const result = await fetchPageHtml(page.url);
    if (!result.ok) continue;
    const enhanced = await analyzePageEnhanced(result.url, result.html);
    targetEnhanced.push(enhanced);
  }

  const competitors: Array<{ domain: string; pages: EnhancedPageAnalysis[] }> = [];

  for (const compUrl of competitorUrls) {
    const pages = await crawlSite({ startUrl: compUrl, limit: 20, maxDepth: 2 });
    const enhanced: EnhancedPageAnalysis[] = [];

    for (const page of pages) {
      if (page.status !== 'ok') continue;
      const result = await fetchPageHtml(page.url);
      if (!result.ok) continue;
      const enhancedPage = await analyzePageEnhanced(result.url, result.html);
      enhanced.push(enhancedPage);
    }

    competitors.push({ domain: new URL(compUrl).hostname, pages: enhanced });
  }

  // Build inventory and find gaps
  const inventory = buildPageInventory(competitors);
  const gaps = identifyContentGaps(targetEnhanced, inventory, 2);
  const recommendations = generatePageRecommendations(gaps, competitors.length);

  // Display results
  console.log(`\n📋 Found ${gaps.length} missing pages:`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. /${rec.slug}`);
    console.log(`   Priority: ${rec.priority}/10`);
    console.log(`   ${rec.reason}\n`);
  });
}
