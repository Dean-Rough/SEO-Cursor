# SEO Wizard - Implementation Tasks

**Goal:** Transform content generation from vague suggestions to copy-paste wireframes

**Strategy:** 4 distinct, modular phases that can be tweaked independently

---

## 📊 Phase 1: Intelligence Gathering (Data Collection)

**Owner Module:** `src/lib/intelligence/`

**Output:** Structured data about site, competitors, and keywords

### Tasks

- [ ] **1.1 Enhanced Site Crawling**
  - Increase depth budget intelligently (scale with site size)
  - Add page type detection (homepage, service page, blog post, contact)
  - Extract existing CTAs from pages (what calls-to-action are they using?)
  - Detect existing schema markup
  - **File:** `src/lib/intelligence/site-crawler.ts`

- [ ] **1.2 Competitor Content Depth Analysis**
  - For each competitor page, extract:
    - Word count
    - Number of H2/H3 sections
    - Number of images
    - FAQ section presence
    - Schema markup present
  - Calculate averages per page type
  - **File:** `src/lib/intelligence/competitor-analysis.ts`

- [ ] **1.3 Image Audit**
  - Extract all images from target site
  - Analyze alt text quality (present? descriptive? keyword-optimized?)
  - Count images per page
  - Identify pages lacking visuals
  - **File:** `src/lib/intelligence/image-audit.ts`

- [ ] **1.4 Competitor Page Inventory**
  - Extract site structure from competitors (all URLs)
  - Categorize pages (services, blog, about, contact, etc.)
  - Identify common pages across competitors
  - **File:** `src/lib/intelligence/competitor-pages.ts`

**Output Schema:**
```typescript
interface IntelligenceReport {
  targetSite: {
    pages: EnhancedPageAnalysis[];
    imageAudit: ImageAuditResult;
    existingCTAs: string[];
    existingSchema: SchemaType[];
  };
  competitors: {
    pages: EnhancedPageAnalysis[];
    contentDepthAverages: ContentDepthMetrics;
    commonPages: string[];
  }[];
  benchmarks: {
    averageWordCount: number;
    averageImageCount: number;
    averageSectionCount: number;
  };
}
```

---

## 🎯 Phase 2: Strategic Planning (Keyword & Architecture)

**Owner Module:** `src/lib/strategy/`

**Output:** Prioritized keyword clusters + site architecture blueprint

### Tasks

- [ ] **2.1 Keyword Clustering**
  - Group related keywords into topics
  - Example: "custom tattoo design", "bespoke tattoo", "unique tattoo ideas" → "Custom Design" cluster
  - Use semantic similarity (OpenAI embeddings or simple token matching)
  - **File:** `src/lib/strategy/keyword-clustering.ts`

- [ ] **2.2 Keyword-to-Page Mapping**
  - Assign each keyword cluster to a target page (existing or new)
  - Primary keyword + 3-5 secondary keywords per page
  - Avoid keyword cannibalization (multiple pages targeting same term)
  - **File:** `src/lib/strategy/keyword-mapping.ts`

- [ ] **2.3 Competitor Page Gap Analysis**
  - Find pages competitors have that target doesn't
  - Prioritize by: (competitor count with page) × (keyword volume)
  - Example: 4/5 competitors have "/tattoo-aftercare" → high priority gap
  - **File:** `src/lib/strategy/page-gap-analysis.ts`

- [ ] **2.4 Content Depth Targets**
  - For each page, calculate target word count based on:
    - Competitor average for that page type
    - Top 5 SERP results for primary keyword (if Moz provides SERP data, or estimate)
  - Set section count targets (how many H2s needed?)
  - **File:** `src/lib/strategy/content-targets.ts`

- [ ] **2.5 Internal Linking Blueprint**
  - For each page, identify:
    - Which existing pages should link TO this page (inbound links)
    - Which pages this should link TO (outbound links)
    - Suggested anchor text
  - **File:** `src/lib/strategy/internal-linking.ts`

**Output Schema:**
```typescript
interface StrategyReport {
  keywordClusters: KeywordCluster[];
  architecture: {
    existingPages: PageStrategy[];
    newPages: PageStrategy[];
  };
  internalLinkingMap: InternalLinkingBlueprint;
}

interface PageStrategy {
  url: string;
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other';
  primaryKeyword: string;
  secondaryKeywords: string[];
  cluster: KeywordCluster;
  contentTargets: {
    wordCount: number;
    sectionCount: number;
    imageCount: number;
    includesFAQ: boolean;
  };
  priority: number; // 1-10
  status: 'create' | 'optimize' | 'keep';
}
```

---

## 🏗️ Phase 3: Content Blueprinting (Structure Generation)

**Owner Module:** `src/lib/blueprints/`

**Output:** Detailed wireframes for every page (NOT full copy yet, just structure)

### Tasks

- [ ] **3.1 Schema Markup Generator**
  - For each page type, generate appropriate schema
  - Service pages → Service + LocalBusiness schema
  - Blog posts → Article schema
  - FAQ sections → FAQPage schema
  - Include all required + recommended properties
  - **File:** `src/lib/blueprints/schema-generator.ts`

- [ ] **3.2 Image Suggestion Engine**
  - For each section of a page, suggest image type
  - Use competitor analysis + page type
  - Examples:
    - Hero section → "Client consultation" or "Service example"
    - Process section → "Step-by-step diagram"
    - Proof section → "Portfolio grid"
  - Generate descriptive alt text templates
  - **File:** `src/lib/blueprints/image-suggestions.ts`

- [ ] **3.3 CTA Strategy Generator**
  - Based on page type and buyer journey stage:
    - Awareness content → "Learn More", "Download Guide"
    - Consideration → "Get Quote", "View Portfolio"
    - Decision → "Book Now", "Call Today"
  - Position CTAs strategically (hero, mid-content, bottom)
  - **File:** `src/lib/blueprints/cta-strategy.ts`

- [ ] **3.4 Section Structure Generator**
  - For each page, create detailed section plan:
    - H1 (keyword-optimized)
    - Introduction paragraph specs (word count, keyword density)
    - H2 sections (what to cover, order, word count each)
    - FAQ section (questions based on PAA + competitor analysis)
    - Internal linking opportunities (specific anchor text + target pages)
  - **File:** `src/lib/blueprints/section-generator.ts`

- [ ] **3.5 Wireframe Assembler**
  - Combine all blueprint components into structured wireframe
  - Format: Clear headings, word counts, image placeholders, CTA placements
  - Human-readable + AI-prompt-ready
  - **File:** `src/lib/blueprints/wireframe-assembler.ts`

**Output Schema:**
```typescript
interface PageBlueprint {
  url: string;
  metadata: {
    title: string;
    description: string;
    ogImage?: string;
  };
  schema: SchemaMarkup[];
  contentStructure: {
    sections: Section[];
    totalTargetWordCount: number;
  };
  images: ImageSuggestion[];
  ctas: CTAPlacement[];
  internalLinks: InternalLink[];
}

interface Section {
  heading: string; // H1, H2, H3
  purpose: string; // "Introduce service", "Build trust", "Answer objections"
  targetWordCount: number;
  keywordsToInclude: string[];
  contentGuidance: string; // "Describe process step-by-step", "Use bullet points for benefits"
  images: ImageSuggestion[];
  ctas?: CTAPlacement[];
  internalLinks?: InternalLink[];
}

interface ImageSuggestion {
  position: string; // "Hero", "After H2: Process", "Portfolio grid"
  description: string; // "Client consultation with artist sketching"
  altTextTemplate: string;
  imageType: 'photo' | 'diagram' | 'screenshot' | 'graphic' | 'portfolio';
}

interface CTAPlacement {
  position: string; // "Hero", "After intro", "Bottom of page"
  primaryText: string; // "Book Free Consultation"
  secondaryText?: string; // "Or call us today"
  style: 'button' | 'link' | 'banner';
  targetUrl?: string;
}

interface InternalLink {
  position: string; // "In intro paragraph", "After H2: Services"
  anchorText: string;
  targetUrl: string;
  context: string; // "When mentioning tattoo styles"
}
```

---

## ✍️ Phase 4: Content Generation (AI Writing)

**Owner Module:** `src/lib/generation/`

**Output:** Full copy for each section, ready to paste into CMS

### Tasks

- [ ] **4.1 Enhanced Content Prompt Builder**
  - For each section, build comprehensive AI prompt including:
    - Section purpose and target audience
    - Keyword list (primary + secondary)
    - Target word count
    - Tone of voice (extracted from existing good content)
    - Competitor analysis summary
    - What to include/avoid
    - CTA to integrate
  - **File:** `src/lib/generation/prompt-builder.ts`

- [ ] **4.2 Section Content Generator**
  - Use blueprint + enhanced prompts to generate each section
  - Iterate per section (not whole page at once) for quality
  - Include internal link markdown formatting
  - Include CTA integration
  - Validate keyword inclusion (check density)
  - **File:** `src/lib/generation/section-generator.ts`

- [ ] **4.3 FAQ Generator**
  - Based on:
    - Competitor FAQ analysis
    - Primary keyword + "questions" (People Also Ask)
    - Common objections/concerns for business type
  - Generate Q&A pairs optimized for featured snippets
  - Format for FAQPage schema
  - **File:** `src/lib/generation/faq-generator.ts`

- [ ] **4.4 Metadata Generator**
  - Title tag (50-60 chars, keyword-optimized, CTR-optimized)
  - Meta description (150-160 chars, includes CTA)
  - Ensure uniqueness across all pages
  - Power words + emotional triggers
  - **File:** `src/lib/generation/metadata-generator.ts`

- [ ] **4.5 Content Assembler & Formatter**
  - Combine all generated sections into final page content
  - Format with proper markdown/HTML
  - Insert image placeholders with alt text
  - Insert CTAs
  - Insert internal links
  - Add schema markup
  - **File:** `src/lib/generation/content-assembler.ts`

**Output Schema:**
```typescript
interface GeneratedPageContent {
  url: string;
  metadata: {
    title: string;
    description: string;
  };
  schema: string; // JSON-LD markup ready to paste
  content: {
    html: string; // Full HTML ready to paste
    markdown: string; // Markdown version for CMS
    sections: GeneratedSection[];
  };
  wordCount: number;
  keywordDensity: { [keyword: string]: number };
  qualityScore: number; // 0-100
}

interface GeneratedSection {
  heading: string;
  content: string;
  wordCount: number;
  images: string[]; // Image placeholder markdown
  ctas: string[]; // CTA HTML
  internalLinks: string[]; // Link markdown
}
```

---

## 🎨 Phase 5: Report Assembly (User-Facing Output)

**Owner Module:** `src/lib/report/`

**Output:** Beautiful HTML report with all 4 phases clearly visible

### Tasks

- [ ] **5.1 Phase Visualization Components**
  - Create distinct sections for each phase in HTML report
  - Collapsible/expandable sections
  - Clear visual hierarchy
  - **File:** `src/lib/report/phase-components.ts`

- [ ] **5.2 Enhanced Report Template**
  - Add tabs/navigation for phases:
    - Tab 1: Intelligence Summary
    - Tab 2: Strategy & Architecture
    - Tab 3: Content Blueprints
    - Tab 4: Generated Content
  - Copy buttons for each section
  - Download individual pages as files
  - **File:** `src/lib/report/enhanced-template.ts`

- [ ] **5.3 Blueprint Preview Cards**
  - For each page blueprint, create compact preview card
  - Shows: URL, primary keyword, word count target, priority
  - Click to expand full wireframe
  - Visual indicators (🟢 new page, 🔵 optimize, 🟡 keep)
  - **File:** `src/lib/report/blueprint-cards.ts`

- [ ] **5.4 Content Export Tools**
  - "Copy All" button for each page content
  - "Download as Markdown" for each page
  - "Export All as ZIP" (all pages as individual .md/.html files)
  - Schema markup as separate JSON files
  - **File:** `src/lib/report/export-tools.ts`

**Report Structure:**
```
SEO Strategy Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Executive Summary]
Your site needs 8 new pages, 12 optimizations to dominate [location] [industry]

[Data Quality Warnings] ⚠️
If any issues detected


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PHASE 1: INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Site Crawl Summary
- 15 pages analyzed
- Average word count: 450 (competitor avg: 1,200) ⚠️
- Image coverage: 40% pages missing visuals
- Schema markup: Not detected

Competitor Benchmarks
- Competitor A: 18 pages, avg 1,400 words
- Competitor B: 22 pages, avg 1,100 words
- Common pages you're missing: [list]

[Expandable: Full Intelligence Report]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PHASE 2: STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keyword Clusters (5 clusters identified)
┌─────────────────────────────────────┐
│ 🎯 Custom Design                    │
│ Keywords: custom tattoo design,     │
│ bespoke tattoo, unique tattoo ideas │
│ Primary Vol: 1,200 | Difficulty: 35 │
│ Target Page: /custom-tattoo-design  │
└─────────────────────────────────────┘
[4 more clusters...]

Site Architecture Blueprint
┌────────────────────────────────────────────┐
│ 🟢 NEW: /custom-tattoo-design             │
│ Priority: 10/10                            │
│ Primary Keyword: custom tattoo design     │
│ Target: 1,200 words | 6 sections          │
│ [View Blueprint] [Generate Content]        │
└────────────────────────────────────────────┘
[17 more pages...]

Internal Linking Strategy
[Visual graph or table showing link flow]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ PHASE 3: BLUEPRINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[18 page blueprints, each in this format:]

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PAGE: /custom-tattoo-design          ┃
┃ Primary Keyword: custom tattoo design┃
┃ Target: 1,200 words | 6 sections     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

METADATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: [optimized title] [Copy]
Meta: [optimized description] [Copy]

SCHEMA MARKUP [Copy] [Download JSON]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<script type="application/ld+json">
{ "@context": "https://schema.org", ... }
</script>

CONTENT STRUCTURE [Generate Full Content ↓]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

H1: Custom Tattoo Design in Edinburgh
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
📸 [HERO IMAGE: Client consultation with artist]
   Alt: "Tattoo artist consulting with client..."

🎯 CTA: "Book Free Design Consultation"

Introduction (150 words)
Purpose: Hook reader, establish expertise
Keywords: custom tattoo design, edinburgh, unique
→ Internal link to /tattoo-styles


H2: Our Custom Design Process (250 words)
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
📸 [PROCESS DIAGRAM: 5 steps]
   Alt: "5-step custom tattoo design process..."

Content: Numbered list of process steps
Keywords: tattoo consultation, design refinement
🎯 CTA: "Start Your Design Journey"

[4 more sections...]

[Expand Full Blueprint]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ PHASE 4: GENERATED CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[For each page, full generated copy:]

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ GENERATED CONTENT                     ┃
┃ /custom-tattoo-design                 ┃
┃ 1,247 words | Quality Score: 92/100   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

[Copy All] [Download Markdown] [Download HTML]

METADATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: Custom Tattoo Design Edinburgh | Award-Winning...
Meta: Work with Edinburgh's best tattoo artists to design...

SCHEMA MARKUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<script type="application/ld+json">...</script>

CONTENT (Ready to Paste)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<h1>Custom Tattoo Design in Edinburgh</h1>

<img src="[placeholder-hero.jpg]" alt="Tattoo artist consulting with client on custom tattoo design in Edinburgh studio">

<a href="/contact" class="cta-button">Book Free Design Consultation</a>

<p>Your tattoo should be as unique as you are. At Rough Ink, our award-winning Edinburgh tattoo artists work closely with you to transform your ideas into stunning custom designs. Whether you're looking for a [custom tattoo design in Edinburgh](/custom-tattoo-design) or want to explore different [tattoo styles](/tattoo-styles), our team brings 15+ years of experience to every consultation.</p>

[Full content continues...]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 EXPORT ALL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Download Complete Strategy as ZIP]
- 18 page content files (.md + .html)
- Schema markup files (.json)
- Internal linking map (.csv)
- Image brief (.pdf)
- Implementation checklist (.md)
```

---

## 🔧 Technical Requirements

### New Dependencies
```json
{
  "openai": "^4.0.0", // Already installed
  "cheerio": "^1.0.0-rc.12", // Already installed
  "@anthropic-ai/sdk": "^0.x.x" // If using Claude for content gen
}
```

### New Directory Structure
```
src/lib/
├── intelligence/         # Phase 1
│   ├── site-crawler.ts
│   ├── competitor-analysis.ts
│   ├── image-audit.ts
│   └── competitor-pages.ts
├── strategy/            # Phase 2
│   ├── keyword-clustering.ts
│   ├── keyword-mapping.ts
│   ├── page-gap-analysis.ts
│   ├── content-targets.ts
│   └── internal-linking.ts
├── blueprints/          # Phase 3
│   ├── schema-generator.ts
│   ├── image-suggestions.ts
│   ├── cta-strategy.ts
│   ├── section-generator.ts
│   └── wireframe-assembler.ts
├── generation/          # Phase 4
│   ├── prompt-builder.ts
│   ├── section-generator.ts
│   ├── faq-generator.ts
│   ├── metadata-generator.ts
│   └── content-assembler.ts
└── report/              # Phase 5
    ├── phase-components.ts
    ├── enhanced-template.ts
    ├── blueprint-cards.ts
    └── export-tools.ts
```

---

## 🚀 Implementation Approach

### Parallel Agent Tasks

**Agent 1: Intelligence Phase**
- Tasks 1.1 - 1.4
- Input: Current crawler + analysis code
- Output: Enhanced intelligence gathering modules

**Agent 2: Strategy Phase**
- Tasks 2.1 - 2.5
- Input: Current generator + keyword strategy code
- Output: Strategic planning modules

**Agent 3: Blueprint Phase**
- Tasks 3.1 - 3.5
- Input: Current metadata + content planning code
- Output: Detailed blueprint generation modules

**Agent 4: Generation Phase**
- Tasks 4.1 - 4.5
- Input: Current content-writer.ts + ai-utils.ts
- Output: Enhanced content generation modules

**Agent 5: Report Phase**
- Tasks 5.1 - 5.4
- Input: Current report-to-html.ts
- Output: Enhanced report with phase visualization

### Integration Task (After Agents Complete)
- Wire all phases together in main generator flow
- Update types to flow data between phases
- Test end-to-end with real site
- Audit output quality
- Tune prompts/thresholds

---

## ✅ Definition of Done

Each phase should be:
1. **Modular** - Can be run independently with test data
2. **Testable** - Unit tests for core logic
3. **Configurable** - Thresholds/settings in constants
4. **Observable** - Clear console output showing phase progress
5. **Documented** - JSDoc comments explaining purpose

Final output should be:
1. **Copy-paste ready** - Content can go straight into CMS
2. **Visually clear** - Each phase distinct in HTML report
3. **Actionable** - User knows exactly what to do next
4. **Complete** - Nothing vague or "TODO"

---

## 🎯 Success Metrics

Before:
- Vague recommendations ("optimize for X keyword")
- No structure guidance
- Generic content drafts
- User has to figure out implementation

After:
- Exact wireframes (H1, H2, sections, word counts)
- Image suggestions with alt text
- Schema markup ready to paste
- CTA strategy per page
- Internal linking blueprint
- Full copy ready to publish

---

## Notes for Agent Coordination

- Each agent gets assigned their phase tasks
- Agents should create new files in designated module folders
- Avoid modifying shared files simultaneously
- Use clear output types so phases can be chained
- After all agents complete, we reconvene to integrate + audit
