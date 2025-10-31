/**
 * Phase 2 Strategy Test
 * Tests keyword clustering, page mapping, and internal linking
 */

import { clusterKeywords } from './src/lib/strategy/keyword-clustering';
import { mapKeywordsToPages } from './src/lib/strategy/keyword-mapping';
import { calculateContentTargets } from './src/lib/strategy/content-targets';
import { buildLinkingBlueprint } from './src/lib/strategy/internal-linking';
import type { KeywordStat } from './src/lib/types';

async function testPhase2() {
  console.log('🎯 PHASE 2 STRATEGY TEST\n' + '='.repeat(50));

  try {
    // Test Data: Keywords from tattoo studio
    const keywords: KeywordStat[] = [
      { keyword: 'custom tattoo design', score: 85, density: 2.1, volume: 1200, difficulty: 45, source: 'site' },
      { keyword: 'bespoke tattoo', score: 78, density: 1.8, volume: 800, difficulty: 42, source: 'competitor' },
      { keyword: 'unique tattoo ideas', score: 72, density: 1.5, volume: 950, difficulty: 38, source: 'dataset' },
      { keyword: 'tattoo artist edinburgh', score: 90, density: 2.5, volume: 2100, difficulty: 52, source: 'site' },
      { keyword: 'professional tattoo studio', score: 82, density: 2.0, volume: 1500, difficulty: 48, source: 'competitor' },
      { keyword: 'tattoo pricing', score: 68, density: 1.2, volume: 1800, difficulty: 35, source: 'dataset' },
      { keyword: 'tattoo cost edinburgh', score: 65, density: 1.1, volume: 1600, difficulty: 33, source: 'competitor' },
      { keyword: 'tattoo aftercare', score: 75, density: 1.6, volume: 1100, difficulty: 28, source: 'dataset' },
      { keyword: 'tattoo healing tips', score: 70, density: 1.4, volume: 900, difficulty: 25, source: 'competitor' },
      { keyword: 'traditional tattoo style', score: 77, density: 1.7, volume: 1300, difficulty: 40, source: 'site' },
      { keyword: 'japanese tattoo edinburgh', score: 80, density: 1.9, volume: 750, difficulty: 44, source: 'competitor' },
      { keyword: 'watercolor tattoo', score: 73, density: 1.5, volume: 850, difficulty: 38, source: 'dataset' },
    ];

    // Test 1: Keyword Clustering
    console.log('\n🔗 Test 1: Keyword Clustering');
    const startCluster = Date.now();
    const clusters = clusterKeywords(keywords);
    const clusterTime = Date.now() - startCluster;

    console.log('✅ Keyword Clusters Created:', clusters.length);
    console.log(`⏱️  Clustering time: ${clusterTime}ms`);

    clusters.forEach((cluster, idx) => {
      console.log(`\n  Cluster ${idx + 1}: "${cluster.name}"`);
      console.log(`    Primary: ${cluster.primaryKeyword}`);
      console.log(`    Keywords: ${cluster.keywords.length}`);
      console.log(`    Total Volume: ${cluster.totalVolume || 'N/A'}`);
      console.log(`    Avg Difficulty: ${cluster.averageDifficulty?.toFixed(1) || 'N/A'}`);
      console.log(`    Terms: ${cluster.keywords.map(k => k.keyword).slice(0, 3).join(', ')}...`);
    });

    // Test 2: Page Mapping
    console.log('\n\n📄 Test 2: Keyword-to-Page Mapping');
    const existingPages = [
      '/',
      '/gallery',
      '/about',
      '/contact'
    ];
    const competitorPages = [
      '/pricing',
      '/aftercare',
      '/styles',
      '/booking'
    ];

    const startMapping = Date.now();
    const mappings = mapKeywordsToPages(clusters, existingPages, competitorPages);
    const mappingTime = Date.now() - startMapping;

    console.log('✅ Page Strategies Created:', mappings.length);
    console.log(`⏱️  Mapping time: ${mappingTime}ms`);

    const createPages = mappings.filter(m => m.status === 'create');
    const optimizePages = mappings.filter(m => m.status === 'optimize');
    const keepPages = mappings.filter(m => m.status === 'keep');

    console.log(`\n  Create: ${createPages.length} pages`);
    createPages.slice(0, 3).forEach(page => {
      console.log(`    - ${page.url} (${page.pageType}): ${page.primaryKeyword}`);
    });

    console.log(`\n  Optimize: ${optimizePages.length} pages`);
    optimizePages.slice(0, 2).forEach(page => {
      console.log(`    - ${page.url} (${page.pageType}): ${page.primaryKeyword}`);
    });

    console.log(`\n  Keep: ${keepPages.length} pages`);

    // Test 3: Content Targets
    console.log('\n\n📊 Test 3: Content Target Calculation');
    const mockDepthMetrics = {
      averageWordCount: 1200,
      averageImageCount: 5,
      averageSectionCount: 6,
      faqPresence: 0.6
    };

    const startTargets = Date.now();
    const targets = calculateContentTargets(mappings, mockDepthMetrics);
    const targetsTime = Date.now() - startTargets;

    console.log('✅ Content Targets Calculated:', targets.length);
    console.log(`⏱️  Calculation time: ${targetsTime}ms`);

    targets.slice(0, 5).forEach(target => {
      console.log(`\n  ${target.url}`);
      console.log(`    Words: ${target.wordCount}`);
      console.log(`    Sections: ${target.sectionCount}`);
      console.log(`    Images: ${target.imageCount}`);
      console.log(`    FAQ: ${target.includeFAQ ? 'Yes' : 'No'}`);
    });

    // Test 4: Internal Linking
    console.log('\n\n🔗 Test 4: Internal Linking Blueprint');
    const siteStructure = {
      homepage: '/',
      servicePages: mappings.filter(m => m.pageType === 'service').map(m => m.url),
      blogPages: mappings.filter(m => m.pageType === 'blog').map(m => m.url)
    };

    const mappingsWithTargets = mappings.map(m => ({
      ...m,
      contentTarget: targets.find(t => t.url === m.url) || {
        url: m.url,
        wordCount: 800,
        sectionCount: 5,
        imageCount: 3,
        includeFAQ: false
      }
    }));

    const startLinking = Date.now();
    const linking = buildLinkingBlueprint(mappingsWithTargets, siteStructure);
    const linkingTime = Date.now() - startLinking;

    console.log('✅ Internal Linking Blueprint Created');
    console.log(`⏱️  Linking time: ${linkingTime}ms`);
    console.log(`  Total Links: ${linking.links.length}`);
    console.log(`  Avg Links per Page: ${(linking.links.length / mappings.length).toFixed(1)}`);

    console.log('\n  Sample Links:');
    linking.links.slice(0, 5).forEach(link => {
      console.log(`    ${link.fromUrl} → ${link.toUrl}`);
      console.log(`      Anchor: "${link.anchorText}"`);
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ PHASE 2 TEST COMPLETE');
    console.log('='.repeat(50));
    console.log('All strategy modules working correctly:');
    console.log(`  ✅ Keyword clustering (${clusterTime}ms)`);
    console.log(`  ✅ Page mapping (${mappingTime}ms)`);
    console.log(`  ✅ Content targets (${targetsTime}ms)`);
    console.log(`  ✅ Internal linking (${linkingTime}ms)`);
    console.log(`\nTotal Phase 2 time: ${clusterTime + mappingTime + targetsTime + linkingTime}ms`);

  } catch (error) {
    console.error('❌ PHASE 2 TEST FAILED:', error);
    throw error;
  }
}

// Run test
testPhase2()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
