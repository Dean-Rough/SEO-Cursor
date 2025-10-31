/**
 * Wireframe Assembler
 *
 * Combines all blueprint components into a single, beautiful, copy-paste-ready wireframe.
 * This is the master orchestrator that produces the final detailed page blueprint.
 */

import {
  PageBlueprint,
  PageStrategy,
  ContentTarget,
  BusinessInfo,
  Section,
  CompetitorPattern,
} from './types';
import { generateSchemaForPage, combineSchemas } from './schema-generator';
import { generatePageImageStrategy, suggestImagesForSection } from './image-suggestions';
import {
  generateCTAStrategy,
  determineBuyerIntent,
  generateFAQCTA,
} from './cta-strategy';
import {
  generateSectionStructure,
  generateFAQSection,
  distributeWordCount,
  addInternalLinks,
  calculateTotalWordCount,
} from './section-generator';

/**
 * Main function: Assemble complete page blueprint
 */
export function assemblePageBlueprint(
  pageStrategy: PageStrategy,
  businessInfo: BusinessInfo,
  contentTarget?: ContentTarget,
  relatedPages?: Array<{ url: string; keyword: string }>,
  competitorPatterns?: CompetitorPattern
): PageBlueprint {
  // Use content target from strategy or provided
  const target = contentTarget || pageStrategy.contentTargets;

  // 1. Generate sections
  let sections = generateSectionStructure(
    pageStrategy,
    businessInfo.name,
    businessInfo.serviceArea,
    relatedPages?.map((p) => p.url),
    competitorPatterns
  );

  // 2. Adjust word counts to meet target
  const currentWordCount = calculateTotalWordCount(sections);
  if (currentWordCount > 0 && currentWordCount !== target.wordCount) {
    sections = distributeWordCount(sections, target.wordCount);
  }

  // 3. Add internal links
  if (relatedPages && relatedPages.length > 0) {
    sections = addInternalLinks(sections, relatedPages);
  }

  // 4. Generate images for each section
  sections = sections.map((section) => {
    const images = suggestImagesForSection(
      section,
      pageStrategy.pageType,
      pageStrategy.primaryKeyword,
      businessInfo.name,
      businessInfo.serviceArea,
      competitorPatterns
    );
    return { ...section, images };
  });

  // 5. Generate page-level image strategy
  const allImages = generatePageImageStrategy(
    pageStrategy.pageType,
    pageStrategy.primaryKeyword,
    businessInfo.name,
    sections,
    target.imageCount,
    businessInfo.serviceArea,
    competitorPatterns
  );

  // 6. Generate CTA strategy
  const ctas = generateCTAStrategy(
    pageStrategy.pageType,
    pageStrategy.primaryKeyword,
    sections,
    { phone: businessInfo.phone }
  );

  // 7. Assign CTAs to sections
  sections = assignCTAsToSections(sections, ctas);

  // 8. Generate FAQ section if needed
  let faqSection;
  if (target.includesFAQ) {
    faqSection = generateFAQSection(
      pageStrategy.primaryKeyword,
      pageStrategy.secondaryKeywords,
      competitorPatterns?.faqQuestions
    );

    // Add FAQ CTA
    const faqCTA = generateFAQCTA(
      determineBuyerIntent(pageStrategy.pageType, pageStrategy.primaryKeyword)
    );
    ctas.push(faqCTA);
  }

  // 9. Generate schema markup
  const schemas = generateSchemaForPage(
    pageStrategy.pageType,
    {
      title: generateMetaTitle(pageStrategy, businessInfo),
      description: generateMetaDescription(pageStrategy, businessInfo),
      keywords: [pageStrategy.primaryKeyword, ...pageStrategy.secondaryKeywords],
      url: pageStrategy.url,
    },
    businessInfo
  );

  // 10. Extract all internal links
  const allInternalLinks = sections.flatMap((s) => s.internalLinks);

  // 11. Assemble final blueprint
  const blueprint: PageBlueprint = {
    url: pageStrategy.url,
    pageType: pageStrategy.pageType,
    metadata: {
      title: generateMetaTitle(pageStrategy, businessInfo),
      description: generateMetaDescription(pageStrategy, businessInfo),
    },
    schema: schemas,
    contentStructure: {
      sections,
      totalTargetWordCount: calculateTotalWordCount(sections),
    },
    images: allImages,
    ctas,
    internalLinks: allInternalLinks,
    faqSection,
  };

  return blueprint;
}

/**
 * Assign CTAs to appropriate sections
 */
function assignCTAsToSections(sections: Section[], ctas: any[]): Section[] {
  return sections.map((section, index) => {
    const sectionCTAs = ctas.filter((cta) =>
      cta.position.toLowerCase().includes(section.heading.toLowerCase())
    );

    // Hero section gets hero CTA
    if (section.level === 1) {
      const heroCTA = ctas.find((cta) => cta.position.includes('Hero'));
      return {
        ...section,
        ctas: heroCTA ? [heroCTA] : [],
      };
    }

    // Assign mid-content CTAs
    if (sectionCTAs.length > 0) {
      return {
        ...section,
        ctas: sectionCTAs,
      };
    }

    // Last section gets bottom CTA
    if (index === sections.length - 1) {
      const bottomCTA = ctas.find((cta) => cta.position.includes('Bottom'));
      return {
        ...section,
        ctas: bottomCTA ? [bottomCTA] : [],
      };
    }

    return section;
  });
}

/**
 * Generate meta title
 */
function generateMetaTitle(
  pageStrategy: PageStrategy,
  businessInfo: BusinessInfo
): string {
  const { pageType, primaryKeyword } = pageStrategy;
  const location = businessInfo.serviceArea;
  const businessName = businessInfo.name;

  const locationPart = location ? ` ${location}` : '';

  const templates: Record<string, string> = {
    homepage: `${primaryKeyword}${locationPart} | ${businessName}`,
    service: `${primaryKeyword}${locationPart} | ${businessName}`,
    blog: `${primaryKeyword} - Complete Guide | ${businessName}`,
    about: `About ${businessName} | ${primaryKeyword}${locationPart}`,
    contact: `Contact ${businessName} | ${primaryKeyword}${locationPart}`,
    other: `${primaryKeyword} | ${businessName}`,
  };

  let title = templates[pageType] || templates.other;

  // Ensure title is under 60 characters
  if (title.length > 60) {
    // Simplify to fit
    title = `${primaryKeyword} | ${businessName}`;
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }
  }

  return title;
}

/**
 * Generate meta description
 */
function generateMetaDescription(
  pageStrategy: PageStrategy,
  businessInfo: BusinessInfo
): string {
  const { pageType, primaryKeyword } = pageStrategy;
  const location = businessInfo.serviceArea;
  const businessName = businessInfo.name;

  const locationPart = location ? ` in ${location}` : '';

  const templates: Record<string, string> = {
    homepage: `${businessName} provides expert ${primaryKeyword}${locationPart}. Get a free quote today!`,
    service: `Professional ${primaryKeyword}${locationPart}. ${businessName} delivers quality results. Book your free consultation.`,
    blog: `Learn everything about ${primaryKeyword}. Expert tips and insights from ${businessName}.`,
    about: `Learn about ${businessName}, your trusted ${primaryKeyword} experts${locationPart}.`,
    contact: `Get in touch with ${businessName} for ${primaryKeyword}${locationPart}. Call today!`,
    other: `${primaryKeyword} by ${businessName}${locationPart}. Quality service, expert results.`,
  };

  let description = templates[pageType] || templates.other;

  // Ensure description is 150-160 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return description;
}

/**
 * Format blueprint as human-readable markdown
 */
export function formatBlueprintAsMarkdown(blueprint: PageBlueprint): string {
  const lines: string[] = [];

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`PAGE BLUEPRINT: ${blueprint.url}`);
  lines.push(`Type: ${blueprint.pageType.toUpperCase()} | Target: ${blueprint.contentStructure.totalTargetWordCount} words`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  // Metadata
  lines.push('METADATA');
  lines.push('▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔');
  lines.push(`Title: ${blueprint.metadata.title}`);
  lines.push(`Description: ${blueprint.metadata.description}`);
  lines.push('');

  // Schema
  lines.push('SCHEMA MARKUP');
  lines.push('▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔');
  lines.push(combineSchemas(blueprint.schema));
  lines.push('');

  // Content structure
  lines.push('CONTENT STRUCTURE');
  lines.push('▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔');
  lines.push('');

  blueprint.contentStructure.sections.forEach((section, index) => {
    // Section heading
    if (section.level > 0) {
      lines.push(`${section.heading}`);
      lines.push('─'.repeat(60));
    } else {
      lines.push(`${section.heading} Section`);
      lines.push('─'.repeat(60));
    }

    // Purpose
    lines.push(`Purpose: ${section.purpose}`);

    // Word count
    if (section.targetWordCount > 0) {
      lines.push(`Target: ${section.targetWordCount} words`);
    }

    // Keywords
    if (section.keywordsToInclude.length > 0) {
      lines.push(`Keywords: ${section.keywordsToInclude.join(', ')}`);
    }

    // Content guidance
    lines.push(`Guidance: ${section.contentGuidance}`);

    // Structure
    if (section.contentStructure) {
      lines.push(`Structure: ${section.contentStructure}`);
    }

    // Images
    if (section.images.length > 0) {
      section.images.forEach((img) => {
        lines.push('');
        lines.push(`📸 [IMAGE: ${img.position}]`);
        lines.push(`   Description: ${img.description}`);
        lines.push(`   Alt Text: ${img.altTextTemplate}`);
        lines.push(`   Type: ${img.imageType}`);
        if (img.sizeGuidance) {
          lines.push(`   Size: ${img.sizeGuidance}`);
        }
      });
    }

    // CTAs
    if (section.ctas.length > 0) {
      section.ctas.forEach((cta) => {
        lines.push('');
        lines.push(`🎯 [CTA: ${cta.style}]`);
        lines.push(`   Text: "${cta.primaryText}"`);
        if (cta.secondaryText) {
          lines.push(`   Secondary: "${cta.secondaryText}"`);
        }
        if (cta.targetUrl) {
          lines.push(`   URL: ${cta.targetUrl}`);
        }
      });
    }

    // Internal links
    if (section.internalLinks.length > 0) {
      section.internalLinks.forEach((link) => {
        lines.push('');
        lines.push(`🔗 [INTERNAL LINK]`);
        lines.push(`   Anchor: "${link.anchorText}"`);
        lines.push(`   URL: ${link.targetUrl}`);
        lines.push(`   Context: ${link.context}`);
      });
    }

    lines.push('');
  });

  // FAQ Section
  if (blueprint.faqSection) {
    lines.push('FAQ SECTION');
    lines.push('▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔');
    lines.push('');

    blueprint.faqSection.questions.forEach((faq, index) => {
      lines.push(`Q${index + 1}: ${faq.question}`);
      lines.push(`Answer Guidance: ${faq.answerGuidance}`);
      lines.push(`Target: ${faq.targetWordCount} words`);
      lines.push(`Keywords: ${faq.keywordsToInclude.join(', ')}`);
      lines.push('');
    });
  }

  // Summary
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('BLUEPRINT SUMMARY');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`Total Sections: ${blueprint.contentStructure.sections.length}`);
  lines.push(`Total Word Count: ${blueprint.contentStructure.totalTargetWordCount}`);
  lines.push(`Total Images: ${blueprint.images.length}`);
  lines.push(`Total CTAs: ${blueprint.ctas.length}`);
  lines.push(`Internal Links: ${blueprint.internalLinks.length}`);
  if (blueprint.faqSection) {
    lines.push(`FAQ Questions: ${blueprint.faqSection.questions.length}`);
  }
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

/**
 * Format blueprint as HTML
 */
export function formatBlueprintAsHTML(blueprint: PageBlueprint): string {
  const markdown = formatBlueprintAsMarkdown(blueprint);

  // Simple HTML conversion
  return `<div class="blueprint">
  <pre>${markdown}</pre>
</div>`;
}

/**
 * Generate multiple blueprints for a set of page strategies
 */
export function assembleSiteBlueprints(
  pageStrategies: PageStrategy[],
  businessInfo: BusinessInfo,
  competitorPatterns?: CompetitorPattern
): PageBlueprint[] {
  return pageStrategies.map((strategy) => {
    // Find related pages for internal linking
    const relatedPages = pageStrategies
      .filter((p) => p.url !== strategy.url && p.pageType === strategy.pageType)
      .slice(0, 3)
      .map((p) => ({
        url: p.url,
        keyword: p.primaryKeyword,
      }));

    return assemblePageBlueprint(
      strategy,
      businessInfo,
      strategy.contentTargets,
      relatedPages,
      competitorPatterns
    );
  });
}

/**
 * Export blueprint as JSON
 */
export function exportBlueprintAsJSON(blueprint: PageBlueprint): string {
  return JSON.stringify(blueprint, null, 2);
}

/**
 * Helper: Validate blueprint completeness
 */
export function validateBlueprint(blueprint: PageBlueprint): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check metadata
  if (!blueprint.metadata.title) {
    errors.push('Missing meta title');
  }
  if (!blueprint.metadata.description) {
    errors.push('Missing meta description');
  }
  if (blueprint.metadata.title.length > 60) {
    warnings.push('Meta title exceeds 60 characters');
  }
  if (blueprint.metadata.description.length > 160) {
    warnings.push('Meta description exceeds 160 characters');
  }

  // Check sections
  if (blueprint.contentStructure.sections.length === 0) {
    errors.push('No sections defined');
  }

  // Check word count
  if (blueprint.contentStructure.totalTargetWordCount < 300) {
    warnings.push('Total word count is very low (< 300 words)');
  }

  // Check images
  if (blueprint.images.length === 0) {
    warnings.push('No images specified');
  }

  // Check CTAs
  if (blueprint.ctas.length === 0) {
    warnings.push('No CTAs specified');
  }

  // Check schema
  if (blueprint.schema.length === 0) {
    warnings.push('No schema markup specified');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
