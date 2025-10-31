/**
 * Example Usage of Blueprint System
 *
 * This demonstrates how to use the blueprint phase to generate
 * detailed page wireframes.
 */

import {
  assemblePageBlueprint,
  assembleSiteBlueprints,
  formatBlueprintAsMarkdown,
  validateBlueprint,
} from './wireframe-assembler';
import { PageStrategy, BusinessInfo, CompetitorPattern } from './types';

/**
 * Example: Generate blueprint for a single service page
 */
export function exampleSinglePageBlueprint() {
  // Define page strategy (would come from Phase 2: Strategy)
  const pageStrategy: PageStrategy = {
    url: '/custom-tattoo-design',
    pageType: 'service',
    primaryKeyword: 'custom tattoo design',
    secondaryKeywords: [
      'bespoke tattoo',
      'unique tattoo ideas',
      'tattoo consultation',
      'custom tattoo artist',
      'personalized tattoo',
    ],
    contentTargets: {
      wordCount: 1200,
      sectionCount: 6,
      imageCount: 8,
      includesFAQ: true,
    },
    priority: 10,
    status: 'create',
  };

  // Define business info
  const businessInfo: BusinessInfo = {
    name: 'Rough Ink Tattoo Studio',
    address: '123 High Street, Edinburgh',
    phone: '0131 XXX XXXX',
    email: 'hello@roughink.co.uk',
    website: 'https://roughink.co.uk',
    businessType: 'tattoo studio',
    serviceArea: 'Edinburgh',
    description: 'Award-winning tattoo studio in Edinburgh specializing in custom designs',
  };

  // Define related pages for internal linking
  const relatedPages = [
    { url: '/tattoo-styles', keyword: 'tattoo styles' },
    { url: '/portfolio', keyword: 'tattoo portfolio' },
    { url: '/aftercare', keyword: 'tattoo aftercare' },
  ];

  // Optional: competitor patterns (would come from Phase 1: Intelligence)
  const competitorPatterns: CompetitorPattern = {
    imagePlacements: ['hero', 'process', 'portfolio'],
    sectionStructure: ['benefits', 'process', 'portfolio', 'pricing'],
    ctaPlacements: ['hero', 'mid-content', 'bottom'],
    faqQuestions: [
      'How much does a custom tattoo cost?',
      'How long does the design process take?',
    ],
  };

  // Generate blueprint
  const blueprint = assemblePageBlueprint(
    pageStrategy,
    businessInfo,
    undefined, // uses contentTargets from pageStrategy
    relatedPages,
    competitorPatterns
  );

  // Validate blueprint
  const validation = validateBlueprint(blueprint);
  console.log('Blueprint Validation:', validation);

  // Format as markdown
  const markdown = formatBlueprintAsMarkdown(blueprint);
  console.log('\n' + markdown);

  return blueprint;
}

/**
 * Example: Generate blueprints for entire site
 */
export function exampleSiteBlueprints() {
  const businessInfo: BusinessInfo = {
    name: 'Rough Ink Tattoo Studio',
    address: '123 High Street, Edinburgh',
    phone: '0131 XXX XXXX',
    website: 'https://roughink.co.uk',
    businessType: 'tattoo studio',
    serviceArea: 'Edinburgh',
  };

  // Define multiple page strategies
  const pageStrategies: PageStrategy[] = [
    {
      url: '/',
      pageType: 'homepage',
      primaryKeyword: 'tattoo studio Edinburgh',
      secondaryKeywords: ['Edinburgh tattoo artist', 'custom tattoos', 'tattoo parlour'],
      contentTargets: {
        wordCount: 800,
        sectionCount: 5,
        imageCount: 6,
        includesFAQ: false,
      },
      priority: 10,
      status: 'optimize',
    },
    {
      url: '/custom-tattoo-design',
      pageType: 'service',
      primaryKeyword: 'custom tattoo design',
      secondaryKeywords: ['bespoke tattoo', 'unique tattoo ideas'],
      contentTargets: {
        wordCount: 1200,
        sectionCount: 6,
        imageCount: 8,
        includesFAQ: true,
      },
      priority: 9,
      status: 'create',
    },
    {
      url: '/tattoo-styles',
      pageType: 'service',
      primaryKeyword: 'tattoo styles',
      secondaryKeywords: ['traditional tattoo', 'realism tattoo', 'geometric tattoo'],
      contentTargets: {
        wordCount: 1000,
        sectionCount: 5,
        imageCount: 10,
        includesFAQ: false,
      },
      priority: 8,
      status: 'create',
    },
  ];

  // Generate all blueprints
  const blueprints = assembleSiteBlueprints(pageStrategies, businessInfo);

  console.log(`Generated ${blueprints.length} page blueprints`);

  // Output each blueprint
  blueprints.forEach((blueprint, index) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`BLUEPRINT ${index + 1}: ${blueprint.url}`);
    console.log('='.repeat(80));
    console.log(formatBlueprintAsMarkdown(blueprint));
  });

  return blueprints;
}

/**
 * Example: Quick blueprint for testing
 */
export function quickExampleBlueprint(): string {
  const pageStrategy: PageStrategy = {
    url: '/custom-tattoo-design',
    pageType: 'service',
    primaryKeyword: 'custom tattoo design',
    secondaryKeywords: ['bespoke tattoo', 'unique tattoo ideas'],
    contentTargets: {
      wordCount: 1200,
      sectionCount: 6,
      imageCount: 8,
      includesFAQ: true,
    },
    priority: 10,
    status: 'create',
  };

  const businessInfo: BusinessInfo = {
    name: 'Rough Ink Tattoo Studio',
    serviceArea: 'Edinburgh',
    phone: '0131 XXX XXXX',
    website: 'https://roughink.co.uk',
  };

  const blueprint = assemblePageBlueprint(pageStrategy, businessInfo);

  return formatBlueprintAsMarkdown(blueprint);
}

// Run example if this file is executed directly
if (require.main === module) {
  console.log('Running Blueprint Example...\n');
  console.log(quickExampleBlueprint());
}
