#!/usr/bin/env node

/**
 * Test script to demonstrate blueprint generation
 * Run with: npx ts-node src/lib/blueprints/test-example.ts
 */

import { assemblePageBlueprint, formatBlueprintAsMarkdown } from './wireframe-assembler';
import type { PageStrategy, BusinessInfo } from './types';

const pageStrategy: PageStrategy = {
  url: '/custom-tattoo-design',
  pageType: 'service',
  primaryKeyword: 'custom tattoo design',
  secondaryKeywords: [
    'bespoke tattoo',
    'unique tattoo ideas',
    'tattoo consultation',
    'custom tattoo artist',
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

const businessInfo: BusinessInfo = {
  name: 'Rough Ink Tattoo Studio',
  address: '123 High Street, Edinburgh',
  phone: '0131 XXX XXXX',
  email: 'hello@roughink.co.uk',
  website: 'https://roughink.co.uk',
  businessType: 'tattoo studio',
  serviceArea: 'Edinburgh',
};

const relatedPages = [
  { url: '/tattoo-styles', keyword: 'tattoo styles' },
  { url: '/portfolio', keyword: 'tattoo portfolio' },
  { url: '/aftercare', keyword: 'tattoo aftercare' },
];

console.log('Generating blueprint for custom tattoo design service page...\n');

const blueprint = assemblePageBlueprint(
  pageStrategy,
  businessInfo,
  undefined,
  relatedPages
);

console.log(formatBlueprintAsMarkdown(blueprint));
