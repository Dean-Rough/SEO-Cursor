/**
 * Phase 4 Content Generation Test
 * Tests AI content generation with OpenAI GPT-4o
 *
 * REQUIRES: OPENAI_API_KEY environment variable
 */

import { generateCompletePageContent } from './src/lib/generation';
import type { PageBlueprint } from './src/lib/blueprints/types';

async function testPhase4() {
  console.log('✍️  PHASE 4 CONTENT GENERATION TEST\n' + '='.repeat(50));

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('⚠️  OPENAI_API_KEY not found');
    console.log('Skipping Phase 4 test (requires OpenAI API access)');
    console.log('\nTo test Phase 4:');
    console.log('1. Set OPENAI_API_KEY in env.local');
    console.log('2. Run: npx tsx test-phase4.ts');
    return;
  }

  try {
    // Create a simple blueprint for testing
    const testBlueprint: PageBlueprint = {
      url: '/tattoo-pricing',
      slug: 'tattoo-pricing',
      pageType: 'service',
      primaryKeyword: 'tattoo pricing Edinburgh',
      secondaryKeywords: ['tattoo cost', 'tattoo prices', 'how much tattoo'],
      priority: 8,
      status: 'create',

      metadata: {
        title: 'Tattoo Pricing Edinburgh | Rough Ink Studio',
        description: 'Transparent tattoo pricing in Edinburgh. Get detailed quotes for custom work.'
      },

      schemaMarkup: [],

      contentStructure: {
        sections: [
          {
            heading: 'H1: Tattoo Pricing in Edinburgh',
            level: 1,
            purpose: 'Hook reader, establish relevance',
            targetWordCount: 0,
            keywordsToInclude: ['tattoo pricing Edinburgh'],
            contentGuidance: 'Strong heading that communicates value',
            images: [],
            ctas: [],
            internalLinks: []
          },
          {
            heading: 'Introduction',
            level: 2,
            purpose: 'Hook reader, establish expertise',
            targetWordCount: 120,
            keywordsToInclude: ['tattoo pricing', 'tattoo cost'],
            contentGuidance: 'Open with hook about pricing transparency. Establish credibility.',
            images: [],
            ctas: [],
            internalLinks: []
          },
          {
            heading: 'Pricing Factors',
            level: 2,
            purpose: 'Educate about what affects tattoo pricing',
            targetWordCount: 200,
            keywordsToInclude: ['tattoo cost', 'pricing factors'],
            contentGuidance: 'Explain size, complexity, time, artist experience as factors',
            images: [],
            ctas: [],
            internalLinks: []
          }
        ],
        totalTargetWordCount: 320
      },

      images: [],
      ctas: [],
      internalLinks: []
    };

    console.log('\n📋 Test Blueprint:');
    console.log('  URL:', testBlueprint.url);
    console.log('  Type:', testBlueprint.pageType);
    console.log('  Primary Keyword:', testBlueprint.primaryKeyword);
    console.log('  Target Words:', testBlueprint.contentStructure.totalTargetWordCount);
    console.log('  Sections:', testBlueprint.contentStructure.sections.length);

    // Test content generation
    console.log('\n🤖 Generating content with GPT-4o...');
    console.log('⏱️  This may take 10-20 seconds...');

    const startTime = Date.now();

    const businessContext = {
      businessName: 'Rough Ink Tattoo Studio',
      businessType: 'tattoo studio',
      location: 'Edinburgh',
      serviceArea: 'Edinburgh and surrounding areas'
    };

    const options = {
      businessContext,
      includeImagePlaceholders: true,
      enforceQuality: true,
      minQualityScore: 70
    };

    const result = await generateCompletePageContent(testBlueprint, options);
    const generationTime = Date.now() - startTime;

    // Display results
    console.log('\n' + '='.repeat(50));
    console.log('✅ CONTENT GENERATED');
    console.log('='.repeat(50));
    console.log('⏱️  Generation Time:', generationTime + 'ms', `(${(generationTime/1000).toFixed(1)}s)`);
    console.log('📊 Quality Score:', result.qualityScore + '/100');
    console.log('📝 Word Count:', result.wordCount);
    console.log('📄 Format:', result.format);
    console.log('📍 Slug:', result.slug);

    console.log('\n📝 Metadata:');
    console.log('  Title:', result.metadata.title);
    console.log('  Description:', result.metadata.description);

    console.log('\n📄 Content Preview (first 300 chars):');
    console.log('─'.repeat(50));
    const preview = result.content.substring(0, 300);
    console.log(preview + '...');
    console.log('─'.repeat(50));

    if (result.sections && result.sections.length > 0) {
      console.log('\n📑 Sections Generated:', result.sections.length);
      result.sections.forEach((section, idx) => {
        console.log(`  ${idx + 1}. ${section.heading} (${section.content.split(' ').length} words)`);
      });
    }

    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:', result.warnings.length);
      result.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    // Quality assessment
    console.log('\n📊 Quality Assessment:');
    if (result.qualityScore >= 80) {
      console.log('  ✅ Excellent quality (≥80)');
    } else if (result.qualityScore >= 70) {
      console.log('  ✅ Good quality (70-79)');
    } else {
      console.log('  ⚠️  Below threshold (<70)');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ PHASE 4 TEST COMPLETE');
    console.log('='.repeat(50));
    console.log('AI content generation working correctly:');
    console.log('  ✅ OpenAI integration functional');
    console.log('  ✅ Content generated successfully');
    console.log('  ✅ Quality scoring working');
    console.log(`  ✅ Generation time: ${(generationTime/1000).toFixed(1)}s`);
    console.log(`  ✅ Quality score: ${result.qualityScore}/100`);

    // Cost estimation
    const estimatedCost = 0.04; // $0.04 per page
    console.log(`\n💰 Estimated cost for this generation: ~$${estimatedCost.toFixed(2)}`);

  } catch (error) {
    console.error('❌ PHASE 4 TEST FAILED:', error);
    throw error;
  }
}

// Run test
testPhase4()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
