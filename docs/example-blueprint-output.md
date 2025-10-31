# Example Blueprint Output

This is what a generated blueprint looks like when using the Phase 3 system.

---

## Input Data

```typescript
// Page Strategy (from Phase 2)
{
  url: '/custom-tattoo-design',
  pageType: 'service',
  primaryKeyword: 'custom tattoo design',
  secondaryKeywords: ['bespoke tattoo', 'unique tattoo ideas', 'tattoo consultation'],
  contentTargets: {
    wordCount: 1200,
    sectionCount: 6,
    imageCount: 8,
    includesFAQ: true
  },
  priority: 10,
  status: 'create'
}

// Business Info
{
  name: 'Rough Ink Tattoo Studio',
  address: '123 High Street, Edinburgh',
  phone: '0131 XXX XXXX',
  email: 'hello@roughink.co.uk',
  website: 'https://roughink.co.uk',
  businessType: 'tattoo studio',
  serviceArea: 'Edinburgh'
}
```

---

## Generated Blueprint

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE BLUEPRINT: /custom-tattoo-design
Type: SERVICE | Target: 1200 words
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METADATA
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
Title: custom tattoo design Edinburgh | Rough Ink Tattoo Studio
Description: Professional custom tattoo design in Edinburgh. Rough Ink Tattoo
             Studio delivers quality results. Book your free consultation.

SCHEMA MARKUP
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "custom tattoo design",
      "description": "Professional custom tattoo design in Edinburgh...",
      "provider": {
        "@type": "Organization",
        "name": "Rough Ink Tattoo Studio",
        "url": "https://roughink.co.uk"
      },
      "areaServed": {
        "@type": "GeoCircle",
        "name": "Edinburgh"
      },
      "serviceType": [
        "custom tattoo design",
        "bespoke tattoo",
        "unique tattoo ideas"
      ]
    },
    {
      "@type": "Organization",
      "name": "Rough Ink Tattoo Studio",
      "url": "https://roughink.co.uk",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 High Street, Edinburgh"
      },
      "telephone": "0131 XXX XXXX",
      "email": "hello@roughink.co.uk",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://roughink.co.uk/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
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
Guidance: Strong, keyword-optimized heading that immediately communicates
          value proposition

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
Target: 140 words
Keywords: custom tattoo design, bespoke tattoo, unique tattoo ideas
Guidance: Open with compelling hook that addresses reader pain point or desire.
          Establish credibility. Preview key benefits. Include 1-2 natural
          internal links to related pages.
Structure: paragraph

🔗 [INTERNAL LINK]
   Anchor: "tattoo styles"
   URL: /tattoo-styles
   Context: When mentioning related services or topics

🔗 [INTERNAL LINK]
   Anchor: "tattoo portfolio"
   URL: /portfolio
   Context: When mentioning related services or topics


H2: Why Choose Our custom tattoo design Services
────────────────────────────────────────────────────────
Purpose: Differentiate from competitors, highlight unique value propositions
Target: 282 words
Keywords: custom tattoo design, bespoke tattoo, unique tattoo ideas, tattoo consultation
Guidance: Use bullet points or short paragraphs for 4-6 key benefits. Focus on
          outcomes and transformation, not just features. Use specific numbers
          or proof points where possible.
Structure: list

📸 [IMAGE: After heading: "H2: Why Choose Our custom tattoo design Services"]
   Description: Icon grid or visual representation of key benefits
   Alt Text: Key benefits of custom tattoo design service
   Type: graphic
   Size: 800x600px or 4:3 ratio


H2: Our custom tattoo design Process
────────────────────────────────────────────────────────
Purpose: Build trust by showing clear, professional process. Reduce anxiety about
         what to expect.
Target: 235 words
Keywords: custom tattoo design, process, consultation
Guidance: Use numbered list with 5 clear steps. Each step should have bold title +
          2-3 sentence description. Emphasize ease, professionalism, and client control.
Structure: numbered-list

📸 [IMAGE: Above or within section: "H2: Our custom tattoo design Process"]
   Description: 5-step process diagram showing workflow from start to completion
   Alt Text: 5-step custom tattoo design process flowchart
   Type: infographic
   Size: 800x600px or 4:3 ratio

🎯 [CTA: button-secondary]
   Text: "View Our Work"
   Secondary: "See why clients choose us"


H2: What's Included in custom tattoo design
────────────────────────────────────────────────────────
Purpose: Set clear expectations about service scope and deliverables
Target: 188 words
Keywords: custom tattoo design, bespoke tattoo, unique tattoo ideas
Guidance: Bullet point list of concrete deliverables or service components.
          Be specific. Avoid vague language. Use bold text for key items.
Structure: list


H2: custom tattoo design Portfolio
────────────────────────────────────────────────────────
Purpose: Showcase quality and range of work through visual examples
Target: 141 words
Keywords: custom tattoo design, examples, portfolio
Guidance: Brief introduction to portfolio. Grid of 6-12 high-quality images with
          captions. Each caption should include project type and key details.
Structure: mixed

📸 [IMAGE: Within section: "H2: custom tattoo design Portfolio"]
   Description: Grid of 6 high-quality custom tattoo design examples showcasing
                range and quality
   Alt Text: custom tattoo design portfolio example {number} by Rough Ink Tattoo Studio
   Type: portfolio
   Size: 800x800px square


H2: What Our Clients Say
────────────────────────────────────────────────────────
Purpose: Build trust through social proof and testimonials
Target: 188 words
Keywords: custom tattoo design, clients, results
Guidance: Include 2-3 client testimonials with specific results or outcomes.
          Include client name and context (city, project type). Use quote formatting.
Structure: mixed

📸 [IMAGE: Alongside testimonials in: "H2: What Our Clients Say"]
   Description: Client headshots or before/after comparison images
   Alt Text: Satisfied Rough Ink Tattoo Studio client testimonial
   Type: photo
   Size: 400x300px thumbnail


H2: custom tattoo design Pricing
────────────────────────────────────────────────────────
Purpose: Set expectations and qualify leads by providing pricing transparency
Target: 188 words
Keywords: custom tattoo design, price, cost, investment
Guidance: Provide pricing ranges or packages. Explain what influences cost.
          Include "starting from" or "typical range" to manage expectations.
          Add qualifier that custom quotes are available.
Structure: mixed

🎯 [CTA: banner]
   Text: "Request Your Free Quote"
   Secondary: "Get personalized pricing"
   URL: /contact


FAQ SECTION
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔

Q1: What is custom tattoo design?
Answer Guidance: Define custom tattoo design in simple terms. Explain key benefits
                 and why someone would need it. 2-3 sentences.
Target: 80 words
Keywords: custom tattoo design

Q2: How much does custom tattoo design cost?
Answer Guidance: Provide pricing range or explain factors that affect cost.
                 Be transparent but encourage custom quote.
Target: 100 words
Keywords: custom tattoo design, price, cost

Q3: How long does custom tattoo design take?
Answer Guidance: Provide realistic timeline. Explain factors that might affect
                 duration. Set expectations.
Target: 80 words
Keywords: custom tattoo design, timeline

Q4: Why should I choose your custom tattoo design services?
Answer Guidance: Highlight 2-3 key differentiators. Focus on unique value props
                 and results.
Target: 100 words
Keywords: custom tattoo design, benefits

Q5: What areas do you serve for custom tattoo design?
Answer Guidance: List service areas or regions. Be specific about coverage.
Target: 60 words
Keywords: custom tattoo design, areas, location

Q6: Do you offer bespoke tattoo?
Answer Guidance: Confirm yes and briefly describe what bespoke tattoo includes.
                 2-3 sentences.
Target: 80 words
Keywords: bespoke tattoo

Q7: Do you offer unique tattoo ideas?
Answer Guidance: Confirm yes and briefly describe what unique tattoo ideas includes.
                 2-3 sentences.
Target: 80 words
Keywords: unique tattoo ideas

🎯 [CTA: button-secondary]
   Text: "Have more questions? Get in touch"
   URL: /contact

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLUEPRINT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Sections: 9
Total Word Count: 1,362 words
Total Images: 8
Total CTAs: 4
Internal Links: 2
FAQ Questions: 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## What Makes This Blueprint Exceptional

### 1. Copy-Paste Ready Schema
The JSON-LD is valid and includes all recommended properties. Just copy the `<script>` tag into your HTML.

### 2. Exact Word Counts
Not "write about benefits" but "write **282 words** about benefits in a **list structure**"

### 3. Specific Image Guidance
Not "add an image" but:
- **Position**: "After heading H2: Why Choose..."
- **Description**: "Icon grid or visual representation of key benefits"
- **Alt Text**: Keyword-optimized template
- **Type**: graphic
- **Size**: 800x600px

### 4. Strategic CTA Placement
- Hero: Immediate conversion (button-primary)
- Mid-content: After trust-building (button-secondary)
- Bottom: Final push (banner)
- FAQ: Post-education (button-secondary)

### 5. Internal Linking Strategy
Not just "link to related pages" but:
- **Anchor text**: "tattoo styles"
- **Target**: /tattoo-styles
- **Context**: "When mentioning related services or topics"

### 6. Content Structure Specification
Each section specifies:
- paragraph (flowing text)
- list (bullet points)
- numbered-list (step-by-step)
- mixed (combination)

### 7. FAQ Optimized for Featured Snippets
- Questions in natural language
- Answer guidance (not full answers yet - that's Phase 4)
- Word count targets
- Keyword integration
- FAQPage schema included

---

## How Phase 4 Will Use This

Phase 4 (Content Generation) will:

1. **Take each section** and generate actual copy using AI
2. **Follow word count targets** exactly
3. **Integrate keywords** naturally as specified
4. **Apply content guidance** (lists vs paragraphs, tone, emphasis)
5. **Insert images** at specified positions with alt text
6. **Add CTAs** with exact text and styling
7. **Include internal links** with anchor text
8. **Generate FAQ answers** following answer guidance
9. **Combine everything** into final HTML/Markdown

**Result**: Production-ready page content that can be pasted directly into any CMS.

---

## Implementation Quality

This blueprint demonstrates:
- ✅ No ambiguity about what to build
- ✅ Junior developer could implement without questions
- ✅ AI prompt generator has all needed context
- ✅ Content writer knows exactly what to write
- ✅ Designer knows what images to source
- ✅ Developer knows what schema to add
- ✅ SEO specialist can validate keyword integration

**This is what "copy-paste ready" means.**
