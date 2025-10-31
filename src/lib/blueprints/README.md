# Phase 3: Content Blueprinting

**Status**: ✅ Complete
**Module Path**: `src/lib/blueprints/`

## Overview

The Blueprint Phase generates detailed, copy-paste-ready wireframes for every page with exact structure, image placements, CTAs, and schema markup. This is the MOST CRITICAL phase - blueprints are so detailed that anyone (junior dev, copywriter, or AI) can implement them directly.

## What This Phase Produces

For each page, you get:

1. **Complete Section Structure** - Every heading (H1, H2, H3) with exact text
2. **Word Count Targets** - Specific word count for each section
3. **Keyword Integration** - Which keywords to include in each section
4. **Content Guidance** - Detailed instructions on what to write and how to structure it
5. **Image Placements** - Exact position, description, alt text templates, and image types
6. **CTA Strategy** - Strategic call-to-action placement with specific text and styling
7. **Internal Links** - Specific anchor text and target URLs for internal linking
8. **Schema Markup** - Ready-to-paste JSON-LD for all page types
9. **FAQ Sections** - Complete FAQ questions with answer guidance (when applicable)

## Module Structure

```
src/lib/blueprints/
├── types.ts                  # TypeScript interfaces
├── schema-generator.ts       # JSON-LD schema markup generation
├── image-suggestions.ts      # Image placement recommendations
├── cta-strategy.ts          # CTA placement strategy
├── section-generator.ts     # Section-by-section structure (CORE)
├── wireframe-assembler.ts   # Orchestrator that combines everything
├── index.ts                 # Module exports
├── example.ts               # Usage examples
├── test-example.ts          # Test script
└── README.md                # This file
```

## Core Modules

### 1. Schema Generator (`schema-generator.ts`)

Generates valid JSON-LD schema markup for different page types.

**Supported Schema Types:**
- **Homepage**: Organization + LocalBusiness
- **Service Pages**: Service + Organization
- **Blog Posts**: Article
- **About Page**: AboutPage + Organization
- **Contact Page**: ContactPage
- **FAQ Sections**: FAQPage

**Key Functions:**
```typescript
generateSchemaForPage(pageType, pageData, businessInfo): SchemaMarkup[]
generateFAQSchema(faqs): string
combineSchemas(schemas): string  // Combines into @graph
```

**Example Output:**
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "custom tattoo design",
  "description": "Professional custom tattoo design services...",
  "provider": {
    "@type": "Organization",
    "name": "Rough Ink Tattoo Studio"
  }
}
```

### 2. Image Suggestion Engine (`image-suggestions.ts`)

Suggests specific images for each section based on purpose and page type.

**Image Types:**
- `photo` - Professional photography
- `diagram` - Process or workflow diagrams
- `infographic` - Data visualization or step-by-step
- `graphic` - Icons or illustrations
- `portfolio` - Work examples/case studies
- `screenshot` - UI or product screenshots

**Key Functions:**
```typescript
suggestImagesForSection(section, pageType, keyword, businessName): ImageSuggestion[]
generatePageImageStrategy(pageType, keyword, sections, targetCount): ImageSuggestion[]
```

**Example Output:**
```typescript
{
  position: "Hero section",
  description: "Client consultation with tattoo artist sketching custom design",
  altTextTemplate: "Rough Ink Tattoo Studio - custom tattoo design in Edinburgh",
  imageType: "photo",
  sizeGuidance: "1920x1080px or 16:9 ratio, hero banner"
}
```

### 3. CTA Strategy Generator (`cta-strategy.ts`)

Generates strategic CTA placements based on buyer journey stage.

**Buyer Intent Stages:**
- **Awareness**: Learn More, Download Guide, Get Inspired
- **Consideration**: Get Free Quote, View Portfolio, Schedule Consultation
- **Decision**: Book Now, Start Project, Call Today

**CTA Positions:**
- Hero (above fold) - Primary conversion
- Mid-content (after social proof/process) - Secondary push
- Bottom (final opportunity) - Last conversion chance
- Inline (within content) - Natural flow CTAs

**Key Functions:**
```typescript
determineBuyerIntent(pageType, primaryKeyword): 'awareness' | 'consideration' | 'decision'
generateCTAStrategy(pageType, primaryKeyword, sections): CTAPlacement[]
```

**Example Output:**
```typescript
{
  position: "Hero section - above the fold",
  primaryText: "Book Free Consultation",
  secondaryText: "Or call: 0131 XXX XXXX",
  style: "button-primary",
  targetUrl: "/contact",
  intent: "consideration"
}
```

### 4. Section Generator (`section-generator.ts`) **[CORE]**

This is the heart of the blueprint phase. Generates detailed section-by-section structure.

**Section Types Generated:**
- H1 with keyword optimization
- Introduction with hooks and internal links
- Process/How-it-works with numbered steps
- Benefits/Features with bullet points
- Service details with deliverables
- Social proof with testimonials
- Portfolio/Examples with image grids
- Pricing with transparency
- Related services with internal links
- FAQ with questions and answer guidance

**Key Functions:**
```typescript
generateSectionStructure(pageStrategy, businessName, location): Section[]
generateFAQSection(primaryKeyword, secondaryKeywords): FAQSection
distributeWordCount(sections, targetTotal): Section[]
addInternalLinks(sections, relatedPages): Section[]
```

**Example Section Output:**
```typescript
{
  heading: "H2: Our Custom Tattoo Design Process",
  level: 2,
  purpose: "Build trust by showing clear, professional process. Reduce booking anxiety.",
  targetWordCount: 250,
  keywordsToInclude: ["custom tattoo design", "tattoo consultation", "design process"],
  contentGuidance: "Use numbered list with 5 clear steps. Each step should have bold title + 2-3 sentence description. Emphasize ease, professionalism, and client control.",
  contentStructure: "numbered-list",
  images: [{...}],
  ctas: [{...}],
  internalLinks: [{...}]
}
```

### 5. Wireframe Assembler (`wireframe-assembler.ts`) **[ORCHESTRATOR]**

Combines all components into final blueprint. This is the main entry point.

**Key Functions:**
```typescript
// Single page blueprint
assemblePageBlueprint(
  pageStrategy: PageStrategy,
  businessInfo: BusinessInfo,
  contentTarget?: ContentTarget,
  relatedPages?: Array<{url: string, keyword: string}>,
  competitorPatterns?: CompetitorPattern
): PageBlueprint

// Multiple page blueprints
assembleSiteBlueprints(
  pageStrategies: PageStrategy[],
  businessInfo: BusinessInfo,
  competitorPatterns?: CompetitorPattern
): PageBlueprint[]

// Format for humans
formatBlueprintAsMarkdown(blueprint: PageBlueprint): string

// Validate completeness
validateBlueprint(blueprint: PageBlueprint): {valid: boolean, errors: string[], warnings: string[]}
```

## Usage Example

### Basic Usage

```typescript
import { assemblePageBlueprint, formatBlueprintAsMarkdown } from '@/lib/blueprints';

const pageStrategy = {
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

const businessInfo = {
  name: 'Rough Ink Tattoo Studio',
  serviceArea: 'Edinburgh',
  phone: '0131 XXX XXXX',
  website: 'https://roughink.co.uk',
};

const blueprint = assemblePageBlueprint(pageStrategy, businessInfo);

console.log(formatBlueprintAsMarkdown(blueprint));
```

### With Internal Linking

```typescript
const relatedPages = [
  { url: '/tattoo-styles', keyword: 'tattoo styles' },
  { url: '/portfolio', keyword: 'tattoo portfolio' },
  { url: '/aftercare', keyword: 'tattoo aftercare' },
];

const blueprint = assemblePageBlueprint(
  pageStrategy,
  businessInfo,
  undefined, // use contentTargets from pageStrategy
  relatedPages
);
```

### Entire Site Blueprint

```typescript
import { assembleSiteBlueprints } from '@/lib/blueprints';

const pageStrategies = [
  { url: '/', pageType: 'homepage', ... },
  { url: '/custom-tattoo-design', pageType: 'service', ... },
  { url: '/tattoo-styles', pageType: 'service', ... },
];

const blueprints = assembleSiteBlueprints(pageStrategies, businessInfo);

blueprints.forEach(bp => {
  console.log(formatBlueprintAsMarkdown(bp));
});
```

## Integration with Other Phases

### Input from Phase 2: Strategy

The blueprint phase receives:
- **PageStrategy[]** - Page-level keyword assignments and content targets
- **KeywordClusters** - Grouped keywords for semantic coverage
- **InternalLinkingMap** - Which pages should link to each other

### Output to Phase 4: Generation

The blueprint phase provides:
- **Complete section structure** - What to write, where, and how much
- **Keyword assignments** - Which keywords go in which sections
- **Content guidance** - Detailed instructions for AI prompts
- **CTA/image placements** - Where to insert non-text elements

## Blueprint Quality Standards

A high-quality blueprint must:

1. **Be implementable by a junior developer** - No ambiguity about structure
2. **Have specific word counts** - Not "write about X" but "write 250 words about X"
3. **Include keyword density targets** - Which keywords in which sections
4. **Specify content structure** - Paragraph, list, table, numbered list
5. **Have exact image specifications** - Position, type, description, alt text
6. **Include strategic CTAs** - Not just "add CTA" but exact text and position
7. **Provide content guidance** - What to emphasize, what to avoid
8. **Include schema markup** - Valid JSON-LD ready to paste
9. **Be optimized for featured snippets** - FAQ structure, definition boxes

## Example Full Blueprint Output

See `test-example.ts` for a complete working example. When run, it produces:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE BLUEPRINT: /custom-tattoo-design
Type: SERVICE | Target: 1200 words
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METADATA
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
Title: custom tattoo design Edinburgh | Rough Ink Tattoo Studio
Description: Professional custom tattoo design in Edinburgh. Rough Ink Tattoo Studio delivers quality results. Book your free consultation.

SCHEMA MARKUP
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "custom tattoo design",
      ...
    },
    {
      "@type": "Organization",
      "name": "Rough Ink Tattoo Studio",
      ...
    }
  ]
}
</script>

CONTENT STRUCTURE
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔

H1: custom tattoo design in Edinburgh
────────────────────────────────────────────────────────
Purpose: Hook reader, establish relevance, set expectations
Keywords: custom tattoo design
Guidance: Strong, keyword-optimized heading that immediately communicates value proposition

📸 [IMAGE: Hero section]
   Description: Rough Ink Tattoo Studio storefront or team delivering service
   Alt Text: Rough Ink Tattoo Studio - custom tattoo design in Edinburgh
   Type: photo
   Size: 1920x1080px or 16:9 ratio, hero banner

🎯 [CTA: button-primary]
   Text: "Book Free Consultation"
   Secondary: "Or call: 0131 XXX XXXX"
   URL: /contact

Introduction Section
────────────────────────────────────────────────────────
Purpose: Hook reader, establish expertise and authority, preview what they will learn
Target: 150 words
Keywords: custom tattoo design, bespoke tattoo, unique tattoo ideas
Guidance: Open with compelling hook that addresses reader pain point or desire. Establish credibility. Preview key benefits. Include 1-2 natural internal links to related pages.
Structure: paragraph

🔗 [INTERNAL LINK]
   Anchor: "tattoo styles"
   URL: /tattoo-styles
   Context: When mentioning related services or topics

[... 6 more detailed H2 sections with images, CTAs, links ...]

FAQ SECTION
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔

Q1: What is custom tattoo design?
Answer Guidance: Define custom tattoo design in simple terms. Explain key benefits and why someone would need it. 2-3 sentences.
Target: 80 words
Keywords: custom tattoo design

[... 5 more FAQ questions ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLUEPRINT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Sections: 10
Total Word Count: 1200
Total Images: 8
Total CTAs: 3
Internal Links: 6
FAQ Questions: 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Testing

Run the test example:

```bash
npx ts-node src/lib/blueprints/test-example.ts
```

Or use in your code:

```typescript
import { quickExampleBlueprint } from '@/lib/blueprints/example';

console.log(quickExampleBlueprint());
```

## Success Criteria

- ✅ Blueprints are so detailed a junior dev can implement them
- ✅ Every section has word count + keyword + content guidance
- ✅ Images have specific descriptions and alt text templates
- ✅ CTAs are positioned strategically with specific text
- ✅ Schema markup is valid JSON-LD ready to paste
- ✅ FAQ sections optimized for featured snippets
- ✅ Internal linking opportunities clearly specified

## Next Steps

Phase 4 (Generation) will:
1. Take these blueprints as input
2. Generate actual copy for each section using AI
3. Insert images, CTAs, and internal links
4. Format as HTML/Markdown ready to paste into CMS
5. Validate keyword density and quality

The better the blueprint, the better the generated content will be.
