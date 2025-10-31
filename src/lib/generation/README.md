# Phase 4: Content Generation System

Elite content generation system that transforms detailed blueprints into production-ready, SEO-optimized, conversion-focused copy.

## Overview

The Phase 4 content generation system produces **elite-quality** content that is:
- Indistinguishable from professional copywriter output
- Naturally keyword-optimized (no stuffing)
- Conversion-focused with strategic CTAs
- Ready to publish without human editing
- Validated for quality at every stage

## Architecture

### Module Structure

```
src/lib/generation/
├── types.ts                  # TypeScript interfaces and constants
├── prompt-builder.ts         # AI prompt engineering
├── section-generator.ts      # Section content generation
├── faq-generator.ts          # FAQ generation with schema
├── metadata-generator.ts     # Title & meta description optimization
├── content-assembler.ts      # Final content assembly
├── orchestrator.ts           # Main coordination logic
├── index.ts                  # Public exports
├── example-usage.ts          # Usage examples
└── README.md                 # This file
```

### Data Flow

```
PageBlueprint (from Phase 3)
    ↓
Orchestrator validates blueprint
    ↓
Tone of Voice extraction
    ↓
Metadata generation (title, description)
    ↓
Section-by-section content generation
    ├─ Build prompts with context
    ├─ Call OpenAI GPT-4o
    ├─ Validate quality (word count, keywords, readability)
    └─ Retry if quality issues
    ↓
FAQ generation (if applicable)
    ├─ Generate answers (40-60 words for snippets)
    └─ Create FAQPage schema markup
    ↓
Content assembly
    ├─ Combine sections & FAQs
    ├─ Format as HTML, Markdown, plain text
    ├─ Add image placeholders
    ├─ Insert schema markup
    └─ Calculate quality score
    ↓
GeneratedPageContent (ready to publish)
```

## Key Features

### 1. Intelligent Prompt Engineering

- **Business type-aware**: Adapts tone and style based on industry
- **Competitor insights**: Incorporates what top rankers cover
- **Context-rich**: Includes location, services, brand voice
- **Structured prompts**: Clear requirements, examples, and constraints

### 2. Section-by-Section Generation

- Generates each section independently for maximum quality control
- Validates keyword integration naturally
- Checks word count targets (±10% tolerance)
- Detects and flags filler phrases
- Calculates readability scores

### 3. Quality Validation

Every generated section is validated for:
- ✅ Word count within target range
- ✅ Primary keywords included naturally
- ✅ Keyword density 1.5-2.5% (optimal)
- ✅ No generic filler phrases
- ✅ Readable (Flesch score 40-80)
- ✅ Proper HTML structure

### 4. Metadata Optimization

Title tags:
- 50-60 characters (strict)
- Primary keyword near start
- Brand name at end
- Power words for CTR
- Uniqueness validation

Meta descriptions:
- 150-160 characters (strict)
- Primary + secondary keywords
- Clear CTA included
- Unique value proposition

### 5. Featured Snippet FAQs

- 40-60 word answers (optimal for snippets)
- Direct answer in first sentence
- Natural keyword integration
- FAQPage schema markup
- Microdata attributes in HTML

### 6. Multi-Format Output

Each page generated in three formats:
1. **HTML**: Semantic tags, proper structure, ready for CMS
2. **Markdown**: Clean format for MD-based systems
3. **Plain text**: For reference and analysis

### 7. Comprehensive Quality Scoring

Quality score (0-100) based on:
- **Section quality (40%)**: Word count, keywords, readability
- **Metadata quality (20%)**: Length, keywords, CTA, uniqueness
- **Content structure (20%)**: CTAs, links, schema markup
- **Critical issues (20%)**: Deductions for major problems

## Usage

### Basic Example

```typescript
import { generateCompletePageContent } from '@/lib/generation';

const blueprint = {
  slug: 'services',
  pageType: 'service',
  metadata: { /* ... */ },
  sections: [ /* ... */ ],
  faqs: { /* ... */ },
  // ...
};

const options = {
  businessContext: {
    businessName: 'Elite Dental',
    businessType: 'dental practice',
    location: 'Austin, TX',
  },
  enforceQuality: true,
};

const content = await generateCompletePageContent(blueprint, options);

console.log(`Quality Score: ${content.qualityScore}/100`);
console.log(`Total Words: ${content.totalWordCount}`);

// Export as HTML
const html = exportPageContent(content, 'html');
```

### Batch Generation

```typescript
import { generateMultiplePages } from '@/lib/generation';

const blueprints = [
  homepageBlueprint,
  aboutBlueprint,
  servicesBlueprint,
];

const allContent = await generateMultiplePages(blueprints, options);

allContent.forEach(content => {
  console.log(`${content.slug}: ${content.qualityScore}/100`);
});
```

### Validation Before Generation

```typescript
import { validateBlueprint, estimateGenerationTime } from '@/lib/generation';

// Validate blueprint
const validation = validateBlueprint(blueprint);
if (!validation.isValid) {
  console.error('Errors:', validation.errors);
  return;
}

// Estimate time
const estimate = estimateGenerationTime(blueprint);
console.log(`Est. time: ${estimate.estimatedSeconds}s`);
```

## Prompt Engineering

### Section Prompts

Each section prompt includes:
- Section heading and purpose
- Target audience description
- Target word count
- Tone of voice
- Primary and secondary keywords
- Content structure (paragraphs, lists, etc.)
- Must-include elements
- Must-avoid phrases
- Competitor insights
- CTA to integrate (if applicable)
- Internal linking opportunities

Example prompt structure:

```
You are an expert SEO copywriter specializing in {businessType}.

Write the "{sectionHeading}" section for a {businessName} website.

REQUIREMENTS:
- Exactly {targetWordCount} words (±10% acceptable)
- Tone: {toneOfVoice}
- Target audience: {targetAudience}
- Keywords to include naturally: {keywords}
- Target keyword density: ~2.0%
- Content structure: {structure}

SECTION PURPOSE:
{purpose}

MUST INCLUDE:
1. {item1}
2. {item2}

STRICTLY AVOID:
- Generic filler phrases
- Keyword stuffing
- Unsubstantiated claims

OUTPUT FORMAT:
Return only the section content in clean HTML format.
```

### FAQ Prompts

Featured snippet-optimized FAQ prompts:

```
Write a concise, featured snippet-optimized answer to:
"{question}"

REQUIREMENTS:
- 40-60 words (optimal for featured snippets)
- Direct answer in the first sentence
- Include keywords naturally: {keywords}
- Tone: {tone}
- Provide actionable information

OUTPUT FORMAT:
Return only the answer text in plain HTML (<p> tags only).
```

### Metadata Prompts

CTR-optimized metadata prompts:

```
Create a CTR-optimized title tag and meta description.

TITLE TAG REQUIREMENTS:
- 50-60 characters (strict)
- Include primary keyword near start
- Include brand name at end
- Use power words: Best, Top, Expert, etc.
- Must be unique from existing titles

META DESCRIPTION REQUIREMENTS:
- 150-160 characters (strict)
- Include primary + secondary keyword
- Include clear call-to-action
- Highlight unique value proposition

OUTPUT FORMAT:
JSON object with "title" and "description" fields.
```

## Quality Standards

### Minimum Quality Thresholds

```typescript
const QUALITY_THRESHOLDS = {
  minWordCount: 300,
  maxWordCount: 3000,
  minReadabilityScore: 40,
  maxReadabilityScore: 80,
  minKeywordDensity: 0.5,   // 0.5%
  maxKeywordDensity: 3.5,   // 3.5%
  minQualityScore: 70,      // overall
  titleMinLength: 50,
  titleMaxLength: 60,
  descriptionMinLength: 150,
  descriptionMaxLength: 160,
};
```

### Filler Phrases Detection

The system detects and flags low-quality filler phrases:
- "in today's world"
- "needless to say"
- "at the end of the day"
- "when all is said and done"
- "for all intents and purposes"
- etc.

### Power Words

Metadata optimization uses power words strategically:
- **Urgency**: Now, Today, Fast, Quick
- **Value**: Free, Save, Discount, Bonus
- **Authority**: Expert, Professional, Certified, Award-winning
- **Quality**: Premium, Elite, Superior, Exceptional
- **Results**: Proven, Guaranteed, Success, Effective

## Integration with Existing System

### Enhances existing content-writer.ts

Phase 4 provides:
- ✅ Section-by-section generation with quality control
- ✅ Advanced metadata optimization
- ✅ FAQ generation with schema markup
- ✅ Multiple format output
- ✅ Detailed quality scoring
- ✅ Keyword density analysis
- ✅ Readability scoring

Use existing content-writer.ts for:
- ⚡ Quick batch generation
- 📝 Simpler content briefs
- 🔄 When Phase 3 blueprints aren't available

Both can coexist and complement each other.

## API Requirements

### OpenAI API

- **Model**: GPT-4o (gpt-4o)
- **Temperature**: 0.7 (creative but controlled)
- **Response format**: JSON for metadata, HTML for content
- **Rate limiting**: 1-2 second delays between requests

### Environment Variables

```bash
OPENAI_API_KEY=sk-...
```

## Performance

### Generation Times (Estimates)

- Metadata: ~3 seconds
- Section: ~5 seconds each
- FAQ: ~2 seconds each
- Assembly: ~1 second

**Example**: Homepage with 4 sections + 5 FAQs = ~30 seconds total

### Rate Limiting

- 1 second delay between sections
- 500ms delay between FAQs
- 2 second delay between pages (batch generation)

## Error Handling

### Retry Logic

The system includes retry logic for:
- OpenAI API failures
- Quality validation failures (up to 2 retries per section)
- Rate limit errors

### Quality Enforcement

When `enforceQuality: true`:
- Generation fails if quality score < 70
- All sections must meet minimum standards
- Metadata must pass validation

When `enforceQuality: false`:
- Best-effort generation
- Continues even if some sections have issues
- Useful for batch processing

## Output Examples

### Generated Section HTML

```html
<section class="hero-section">
  <h2>Exceptional Dental Care in Austin</h2>
  <p>
    Welcome to Elite Dental Care, where we've been providing comprehensive dental
    services to Austin families for over 15 years. Our experienced team combines
    modern technology with a patient-centered approach to deliver exceptional care
    in a comfortable, welcoming environment.
  </p>
  <p>
    Whether you need routine preventive care, advanced cosmetic dentistry, or
    emergency treatment, we're here to help. <strong>Schedule your appointment
    today</strong> and experience the difference that personalized dental care makes.
  </p>
</section>
```

### Generated Metadata

```typescript
{
  title: "Austin Dentist | Family & Cosmetic Dentistry | Elite Dental",
  titleLength: 59,
  description: "Award-winning dental practice in Austin, TX. Comprehensive family and cosmetic dentistry with 15+ years experience. Book your appointment today.",
  descriptionLength: 158,
  keywordsIncluded: ["dentist", "austin", "cosmetic dentistry"],
  powerWordsUsed: ["Award-winning"],
  hasCTA: true,
  uniquenessScore: 92
}
```

### Quality Report

```typescript
{
  wordCountVsTarget: "1,247 / 1,200 (104%)",
  keywordDensity: {
    "dentist austin": "2.1%",
    "cosmetic dentistry": "1.8%",
    "family dentist": "1.5%"
  },
  readabilityGrade: "Standard (8th-9th grade)",
  ctaCount: 3,
  internalLinkCount: 4,
  imageCount: 2,
  schemaMarkupCount: 1,
  issues: [],
  strengths: [
    "Word count meets target",
    "Optimal keyword density achieved",
    "Good readability level for target audience",
    "3 CTAs included for conversion optimization",
    "4 internal links for site architecture",
    "All sections meet quality standards",
    "5 FAQs optimized for featured snippets"
  ]
}
```

## Best Practices

### 1. Blueprint Preparation

- Ensure all required fields are populated
- Provide clear section purposes
- Set realistic word count targets (150-500 per section)
- Include specific must-include items

### 2. Business Context

- Provide detailed business information
- Include location for local SEO
- Add unique selling points in additionalNotes
- Specify service area if applicable

### 3. Quality Control

- Always validate blueprints before generation
- Review quality reports for all generated content
- Address issues with quality scores < 80
- Use enforceQuality for critical pages

### 4. Batch Processing

- Generate pages sequentially (not parallel) to respect rate limits
- Use lower quality thresholds for bulk generation
- Review and refine high-priority pages manually

### 5. Human Review

Even with quality scores of 90+, always:
- Verify factual accuracy
- Ensure brand voice alignment
- Check for any AI-specific quirks
- Validate internal links
- Confirm CTA placement

## Troubleshooting

### Common Issues

**Issue**: Quality score consistently low
- **Solution**: Review blueprint quality, ensure clear purposes and must-includes

**Issue**: Keyword density too high
- **Solution**: Reduce primary keyword count, use more secondary keywords

**Issue**: Sections too short/long
- **Solution**: Adjust targetWordCount, ensure prompts are clear

**Issue**: Generic/filler content
- **Solution**: Add more specific must-includes, use competitor insights

**Issue**: API rate limits
- **Solution**: Increase delays between requests, use batch generation carefully

## Future Enhancements

Potential improvements for Phase 5:
- [ ] Image generation integration (DALL-E)
- [ ] Video script generation
- [ ] Social media content variants
- [ ] A/B testing variant generation
- [ ] Multi-language support
- [ ] Voice search optimization
- [ ] Dynamic content personalization
- [ ] Real-time content performance tracking

## License

Part of SEO Wizard project. See main project LICENSE.

## Support

For issues or questions about Phase 4 content generation:
1. Check this README and example-usage.ts
2. Review quality reports for specific issues
3. Validate blueprints before generation
4. Check OpenAI API status and credentials
