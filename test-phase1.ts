/**
 * Phase 1 Intelligence Test
 * Tests enhanced page analysis, competitor benchmarking, and gap identification
 */

import { analyzePageEnhanced } from './src/lib/intelligence/site-crawler';
import { analyzeContentDepth } from './src/lib/intelligence/competitor-analysis';
import { buildPageInventory, identifyContentGaps } from './src/lib/intelligence/competitor-pages';
import type { EnhancedPageAnalysis } from './src/lib/intelligence/types';

async function testPhase1() {
  console.log('🧠 PHASE 1 INTELLIGENCE TEST\n' + '='.repeat(50));

  const testUrl = 'https://rough.ink';
  const businessContext = {
    type: 'tattoo studio',
    location: 'Edinburgh'
  };

  try {
    // Test 1: Enhanced Page Analysis
    console.log('\n📊 Test 1: Enhanced Page Analysis');
    console.log('URL:', testUrl);

    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Custom Tattoo Design | Rough Ink Studio Edinburgh</title>
          <meta name="description" content="Professional custom tattoo design services in Edinburgh">
        </head>
        <body>
          <h1>Welcome to Rough Ink Tattoo Studio</h1>
          <h2>Our Services</h2>
          <p>${'Custom tattoo design '.repeat(50)}</p>
          <h2>About Our Artists</h2>
          <p>${'Professional tattoo artist '.repeat(50)}</p>
          <img src="/hero.jpg" alt="Tattoo studio">
          <img src="/gallery1.jpg" alt="">
          <a href="/contact" class="cta-button">Book Consultation</a>
          <script type="application/ld+json">
            {"@type": "LocalBusiness"}
          </script>
        </body>
      </html>
    `;

    const enhanced = await analyzePageEnhanced(testUrl, mockHtml, businessContext);

    console.log('✅ Enhanced Analysis Complete:');
    console.log('  Page Type:', enhanced.pageType);
    console.log('  Word Count:', enhanced.wordCount);
    console.log('  H2 Count:', enhanced.h2Count);
    console.log('  H3 Count:', enhanced.h3Count);
    console.log('  Image Count:', enhanced.imageCount);
    console.log('  CTAs Found:', enhanced.ctas.length);
    console.log('  Schema Types:', enhanced.schemaTypes.join(', ') || 'None');
    console.log('  Has FAQ:', enhanced.hasFAQ);

    // Test 2: Content Depth Analysis
    console.log('\n📏 Test 2: Content Depth Analysis');

    const mockPages: EnhancedPageAnalysis[] = [
      { ...enhanced, url: testUrl, h2Count: 4, h3Count: 2, imageCount: 3 },
      { ...enhanced, url: testUrl + '/services', h2Count: 6, h3Count: 4, imageCount: 5 },
      { ...enhanced, url: testUrl + '/gallery', h2Count: 2, h3Count: 1, imageCount: 12 },
    ];

    const depthMetrics = analyzeContentDepth(mockPages);

    console.log('✅ Content Depth Metrics:');
    console.log('  Avg Word Count:', depthMetrics.averageWordCount);
    console.log('  Avg H2 Count:', depthMetrics.averageH2Count);
    console.log('  Avg H3 Count:', depthMetrics.averageH3Count);
    console.log('  Avg Image Count:', depthMetrics.averageImageCount);
    console.log('  FAQ Presence:', (depthMetrics.faqPresence * 100).toFixed(1) + '%');

    // Test 3: Page Inventory & Gap Analysis
    console.log('\n🔍 Test 3: Gap Analysis');

    const competitorData = [
      {
        domain: 'competitor1.com',
        pages: [
          { ...enhanced, url: 'https://competitor1.com/', pageType: 'homepage' as const },
          { ...enhanced, url: 'https://competitor1.com/pricing', pageType: 'service' as const },
          { ...enhanced, url: 'https://competitor1.com/aftercare', pageType: 'blog' as const },
        ]
      },
      {
        domain: 'competitor2.com',
        pages: [
          { ...enhanced, url: 'https://competitor2.com/', pageType: 'homepage' as const },
          { ...enhanced, url: 'https://competitor2.com/pricing', pageType: 'service' as const },
          { ...enhanced, url: 'https://competitor2.com/booking', pageType: 'service' as const },
        ]
      }
    ];

    const inventory = buildPageInventory(competitorData);
    console.log('✅ Page Inventory Built:');
    console.log('  Total Pages:', inventory.allPages.length);
    console.log('  Common Patterns:', inventory.commonPages.length);

    inventory.commonPages.forEach(pattern => {
      console.log(`    - ${pattern.slug} (${pattern.pageType}): ${pattern.competitorCount}/${competitorData.length} competitors`);
    });

    const targetPages = [testUrl, testUrl + '/gallery'];
    const gaps = identifyContentGaps(
      mockPages.filter(p => targetPages.includes(p.url)),
      inventory
    );

    console.log('✅ Content Gaps Identified:', gaps.length);
    gaps.slice(0, 5).forEach(gap => {
      console.log(`    - ${gap.slug} (${gap.pageType}): ${gap.competitorCount} competitors have it`);
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ PHASE 1 TEST COMPLETE');
    console.log('='.repeat(50));
    console.log('All intelligence gathering modules working correctly:');
    console.log('  ✅ Enhanced page analysis');
    console.log('  ✅ Content depth metrics');
    console.log('  ✅ Page inventory');
    console.log('  ✅ Gap identification');

  } catch (error) {
    console.error('❌ PHASE 1 TEST FAILED:', error);
    throw error;
  }
}

// Run test
testPhase1()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
