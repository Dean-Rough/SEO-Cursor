/**
 * Section Structure Generator
 *
 * The CORE module that generates detailed section-by-section wireframes.
 * Creates comprehensive section plans with headings, word counts, keywords,
 * content guidance, and structural specifications.
 */

import {
  Section,
  FAQSection,
  FAQItem,
  PageStrategy,
  ContentTarget,
  InternalLink,
  CompetitorPattern,
} from './types';
import {
  suggestImagesForSection,
  generatePageImageStrategy,
} from './image-suggestions';
import { generateMidContentCTA, generateInlineCTA } from './cta-strategy';

/**
 * Generate H1 for a page
 */
export function generateH1Section(
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other',
  primaryKeyword: string,
  location?: string
): Section {
  const locationPart = location ? ` in ${location}` : '';

  const h1Templates: Record<string, string> = {
    homepage: `${primaryKeyword}${locationPart}`,
    service: `${primaryKeyword}${locationPart}`,
    blog: primaryKeyword,
    about: `About Us`,
    contact: `Contact Us`,
    other: primaryKeyword,
  };

  const h1 = h1Templates[pageType] || primaryKeyword;

  return {
    heading: `H1: ${h1}`,
    level: 1,
    purpose: 'Hook reader, establish relevance, set expectations',
    targetWordCount: 0, // H1 is just heading
    keywordsToInclude: [primaryKeyword],
    contentGuidance: 'Strong, keyword-optimized heading that immediately communicates value proposition',
    images: [],
    ctas: [],
    internalLinks: [],
  };
}

/**
 * Generate introduction section
 */
export function generateIntroSection(
  primaryKeyword: string,
  secondaryKeywords: string[],
  businessName: string,
  location?: string,
  relatedPages?: string[]
): Section {
  const internalLinks: InternalLink[] = [];

  // Add internal links to related pages
  if (relatedPages && relatedPages.length > 0) {
    relatedPages.slice(0, 2).forEach((page) => {
      internalLinks.push({
        position: 'Within introduction paragraph',
        anchorText: page.toLowerCase().replace(/-/g, ' '),
        targetUrl: `/${page}`,
        context: `When mentioning related services or topics`,
      });
    });
  }

  return {
    heading: 'Introduction',
    level: 0, // Not a heading, just a section
    purpose: 'Hook reader, establish expertise and authority, preview what they will learn',
    targetWordCount: 150,
    keywordsToInclude: [primaryKeyword, ...secondaryKeywords.slice(0, 2)],
    contentGuidance:
      'Open with compelling hook that addresses reader pain point or desire. Establish credibility. Preview key benefits. Include 1-2 natural internal links to related pages.',
    contentStructure: 'paragraph',
    images: [],
    ctas: [],
    internalLinks,
  };
}

/**
 * Generate process/how-it-works section
 */
export function generateProcessSection(
  primaryKeyword: string,
  stepCount: number = 5
): Section {
  return {
    heading: `H2: Our ${primaryKeyword} Process`,
    level: 2,
    purpose: 'Build trust by showing clear, professional process. Reduce anxiety about what to expect.',
    targetWordCount: 250,
    keywordsToInclude: [primaryKeyword, 'process', 'consultation'],
    contentGuidance: `Use numbered list with ${stepCount} clear steps. Each step should have bold title + 2-3 sentence description. Emphasize ease, professionalism, and client control.`,
    contentStructure: 'numbered-list',
    images: [],
    ctas: [],
    internalLinks: [],
  };
}

/**
 * Generate benefits section
 */
export function generateBenefitsSection(
  primaryKeyword: string,
  secondaryKeywords: string[]
): Section {
  return {
    heading: `H2: Why Choose Our ${primaryKeyword} Services`,
    level: 2,
    purpose: 'Differentiate from competitors, highlight unique value propositions',
    targetWordCount: 300,
    keywordsToInclude: [primaryKeyword, ...secondaryKeywords.slice(0, 3)],
    contentGuidance:
      'Use bullet points or short paragraphs for 4-6 key benefits. Focus on outcomes and transformation, not just features. Use specific numbers or proof points where possible.',
    contentStructure: 'list',
    images: [],
    ctas: [],
    internalLinks: [],
  };
}

/**
 * Generate service details section
 */
export function generateServiceDetailsSection(
  primaryKeyword: string,
  secondaryKeywords: string[]
): Section {
  return {
    heading: `H2: What's Included in ${primaryKeyword}`,
    level: 2,
    purpose: 'Set clear expectations about service scope and deliverables',
    targetWordCount: 200,
    keywordsToInclude: [primaryKeyword, ...secondaryKeywords.slice(0, 2)],
    contentGuidance:
      'Bullet point list of concrete deliverables or service components. Be specific. Avoid vague language. Use bold text for key items.',
    contentStructure: 'list',
    images: [],
    ctas: [],
    internalLinks: [],
  };
}

/**
 * Generate social proof section
 */
export function generateSocialProofSection(primaryKeyword: string): Section {
  return {
    heading: 'H2: What Our Clients Say',
    level: 2,
    purpose: 'Build trust through social proof and testimonials',
    targetWordCount: 200,
    keywordsToInclude: [primaryKeyword, 'clients', 'results'],
    contentGuidance:
      'Include 2-3 client testimonials with specific results or outcomes. Include client name and context (city, project type). Use quote formatting.',
    contentStructure: 'mixed',
    images: [],
    ctas: [],
    internalLinks: [],
  };
}

/**
 * Generate portfolio/examples section
 */
export function generatePortfolioSection(primaryKeyword: string): Section {
  return {
    heading: `H2: ${primaryKeyword} Portfolio`,
    level: 2,
    purpose: 'Showcase quality and range of work through visual examples',
    targetWordCount: 150,
    keywordsToInclude: [primaryKeyword, 'examples', 'portfolio'],
    contentGuidance:
      'Brief introduction to portfolio. Grid of 6-12 high-quality images with captions. Each caption should include project type and key details.',
    contentStructure: 'mixed',
    images: [],
    ctas: [],
    internalLinks: [],
  };
}

/**
 * Generate pricing section
 */
export function generatePricingSection(primaryKeyword: string): Section {
  return {
    heading: `H2: ${primaryKeyword} Pricing`,
    level: 2,
    purpose: 'Set expectations and qualify leads by providing pricing transparency',
    targetWordCount: 200,
    keywordsToInclude: [primaryKeyword, 'price', 'cost', 'investment'],
    contentGuidance:
      'Provide pricing ranges or packages. Explain what influences cost. Include "starting from" or "typical range" to manage expectations. Add qualifier that custom quotes are available.',
    contentStructure: 'mixed',
    images: [],
    ctas: [],
    internalLinks: [],
  };
}

/**
 * Generate related services section
 */
export function generateRelatedServicesSection(
  relatedKeywords: string[],
  relatedPages: string[]
): Section {
  const internalLinks: InternalLink[] = relatedPages.map((page, index) => ({
    position: 'Within related services list',
    anchorText: relatedKeywords[index] || page.replace(/-/g, ' '),
    targetUrl: `/${page}`,
    context: 'Linking to related service pages',
  }));

  return {
    heading: 'H2: Related Services',
    level: 2,
    purpose: 'Internal linking to related services, keep users on site',
    targetWordCount: 100,
    keywordsToInclude: relatedKeywords,
    contentGuidance:
      'Brief mention of related services with links. 1-2 sentences per related service explaining what it is.',
    contentStructure: 'list',
    images: [],
    ctas: [],
    internalLinks,
  };
}

/**
 * Generate about/expertise section
 */
export function generateAboutSection(
  businessName: string,
  primaryKeyword: string
): Section {
  return {
    heading: `H2: About ${businessName}`,
    level: 2,
    purpose: 'Build credibility through experience, qualifications, and backstory',
    targetWordCount: 250,
    keywordsToInclude: [primaryKeyword, 'experience', 'expert'],
    contentGuidance:
      'Establish expertise and credibility. Include years of experience, certifications, awards, or unique qualifications. Personal story if relevant. Focus on what makes you trustworthy.',
    contentStructure: 'paragraph',
    images: [],
    ctas: [],
    internalLinks: [],
  };
}

/**
 * Generate FAQ section
 */
export function generateFAQSection(
  primaryKeyword: string,
  secondaryKeywords: string[],
  competitorFAQs?: string[]
): FAQSection {
  const questions: FAQItem[] = [];

  // Generate common FAQ questions based on primary keyword
  questions.push({
    question: `What is ${primaryKeyword}?`,
    answerGuidance: `Define ${primaryKeyword} in simple terms. Explain key benefits and why someone would need it. 2-3 sentences.`,
    targetWordCount: 80,
    keywordsToInclude: [primaryKeyword],
  });

  questions.push({
    question: `How much does ${primaryKeyword} cost?`,
    answerGuidance:
      'Provide pricing range or explain factors that affect cost. Be transparent but encourage custom quote.',
    targetWordCount: 100,
    keywordsToInclude: [primaryKeyword, 'price', 'cost'],
  });

  questions.push({
    question: `How long does ${primaryKeyword} take?`,
    answerGuidance:
      'Provide realistic timeline. Explain factors that might affect duration. Set expectations.',
    targetWordCount: 80,
    keywordsToInclude: [primaryKeyword, 'timeline'],
  });

  questions.push({
    question: `Why should I choose your ${primaryKeyword} services?`,
    answerGuidance:
      'Highlight 2-3 key differentiators. Focus on unique value props and results.',
    targetWordCount: 100,
    keywordsToInclude: [primaryKeyword, 'benefits'],
  });

  questions.push({
    question: `What areas do you serve for ${primaryKeyword}?`,
    answerGuidance:
      'List service areas or regions. Be specific about coverage.',
    targetWordCount: 60,
    keywordsToInclude: [primaryKeyword, 'areas', 'location'],
  });

  // Add secondary keyword FAQs
  secondaryKeywords.slice(0, 2).forEach((keyword) => {
    questions.push({
      question: `Do you offer ${keyword}?`,
      answerGuidance: `Confirm yes and briefly describe what ${keyword} includes. 2-3 sentences.`,
      targetWordCount: 80,
      keywordsToInclude: [keyword],
    });
  });

  return {
    questions,
    schemaMarkup: '', // Will be filled by schema generator
  };
}

/**
 * Main function: Generate complete section structure for a page
 */
export function generateSectionStructure(
  pageStrategy: PageStrategy,
  businessName: string,
  location?: string,
  relatedPages?: string[],
  competitorPatterns?: CompetitorPattern
): Section[] {
  const sections: Section[] = [];

  const { pageType, primaryKeyword, secondaryKeywords, contentTargets } = pageStrategy;

  // 1. H1 Section
  sections.push(generateH1Section(pageType, primaryKeyword, location));

  // 2. Introduction
  sections.push(
    generateIntroSection(
      primaryKeyword,
      secondaryKeywords,
      businessName,
      location,
      relatedPages
    )
  );

  // 3. Build out H2 sections based on page type
  if (pageType === 'homepage') {
    // Homepage structure
    sections.push(generateBenefitsSection(primaryKeyword, secondaryKeywords));
    sections.push(generateProcessSection(primaryKeyword));
    sections.push(generateServiceDetailsSection(primaryKeyword, secondaryKeywords));
    sections.push(generateSocialProofSection(primaryKeyword));
    if (relatedPages && relatedPages.length > 0) {
      sections.push(
        generateRelatedServicesSection(secondaryKeywords, relatedPages)
      );
    }
  } else if (pageType === 'service') {
    // Service page structure
    sections.push(generateBenefitsSection(primaryKeyword, secondaryKeywords));
    sections.push(generateProcessSection(primaryKeyword));
    sections.push(generateServiceDetailsSection(primaryKeyword, secondaryKeywords));
    sections.push(generatePortfolioSection(primaryKeyword));
    sections.push(generateSocialProofSection(primaryKeyword));
    sections.push(generatePricingSection(primaryKeyword));
    if (relatedPages && relatedPages.length > 0) {
      sections.push(
        generateRelatedServicesSection(secondaryKeywords, relatedPages)
      );
    }
  } else if (pageType === 'blog') {
    // Blog post structure - more flexible
    sections.push({
      heading: `H2: Understanding ${primaryKeyword}`,
      level: 2,
      purpose: 'Define topic and set foundation',
      targetWordCount: 300,
      keywordsToInclude: [primaryKeyword, ...secondaryKeywords.slice(0, 2)],
      contentGuidance: 'Explain the topic clearly. Define key terms. Set context.',
      contentStructure: 'paragraph',
      images: [],
      ctas: [],
      internalLinks: [],
    });

    // Add 2-3 more H2 sections for blog depth
    secondaryKeywords.slice(0, 3).forEach((keyword, index) => {
      sections.push({
        heading: `H2: ${keyword}`,
        level: 2,
        purpose: 'Deep dive into sub-topic',
        targetWordCount: 250,
        keywordsToInclude: [keyword, primaryKeyword],
        contentGuidance:
          'Detailed explanation with examples. Use subheadings (H3) if needed.',
        contentStructure: 'mixed',
        images: [],
        ctas: [],
        internalLinks: [],
      });
    });

    sections.push({
      heading: 'H2: Conclusion',
      level: 2,
      purpose: 'Summarize key points and provide clear next step',
      targetWordCount: 150,
      keywordsToInclude: [primaryKeyword],
      contentGuidance: 'Recap main points. End with clear CTA.',
      contentStructure: 'paragraph',
      images: [],
      ctas: [],
      internalLinks: [],
    });
  } else if (pageType === 'about') {
    // About page structure
    sections.push(generateAboutSection(businessName, primaryKeyword));
    sections.push({
      heading: 'H2: Our Mission',
      level: 2,
      purpose: 'Communicate values and purpose',
      targetWordCount: 150,
      keywordsToInclude: [primaryKeyword],
      contentGuidance: 'Explain company mission and values. What drives you.',
      contentStructure: 'paragraph',
      images: [],
      ctas: [],
      internalLinks: [],
    });
    sections.push({
      heading: 'H2: Our Team',
      level: 2,
      purpose: 'Introduce key team members',
      targetWordCount: 200,
      keywordsToInclude: [primaryKeyword],
      contentGuidance: 'Brief bios of key team members. Highlight expertise.',
      contentStructure: 'mixed',
      images: [],
      ctas: [],
      internalLinks: [],
    });
  } else if (pageType === 'contact') {
    // Contact page structure (simpler)
    sections.push({
      heading: 'H2: Get In Touch',
      level: 2,
      purpose: 'Encourage contact with clear next steps',
      targetWordCount: 100,
      keywordsToInclude: [primaryKeyword],
      contentGuidance: 'Friendly invitation to contact. Explain what to expect.',
      contentStructure: 'paragraph',
      images: [],
      ctas: [],
      internalLinks: [],
    });
  }

  // Adjust section count if we need more to reach target
  const currentH2Count = sections.filter((s) => s.level === 2).length;
  if (currentH2Count < contentTargets.sectionCount) {
    const deficit = contentTargets.sectionCount - currentH2Count;
    for (let i = 0; i < deficit; i++) {
      sections.push({
        heading: `H2: Additional ${primaryKeyword} Information`,
        level: 2,
        purpose: 'Provide additional relevant information',
        targetWordCount: 200,
        keywordsToInclude: [primaryKeyword],
        contentGuidance: 'Additional relevant content to reach target depth.',
        contentStructure: 'paragraph',
        images: [],
        ctas: [],
        internalLinks: [],
      });
    }
  }

  return sections;
}

/**
 * Helper: Calculate total word count from sections
 */
export function calculateTotalWordCount(sections: Section[]): number {
  return sections.reduce((sum, section) => sum + section.targetWordCount, 0);
}

/**
 * Helper: Distribute word count across sections proportionally
 */
export function distributeWordCount(
  sections: Section[],
  targetTotalWordCount: number
): Section[] {
  const currentTotal = calculateTotalWordCount(sections);

  if (currentTotal === 0) return sections;

  const multiplier = targetTotalWordCount / currentTotal;

  return sections.map((section) => ({
    ...section,
    targetWordCount: Math.round(section.targetWordCount * multiplier),
  }));
}

/**
 * Helper: Add internal linking opportunities to sections
 */
export function addInternalLinks(
  sections: Section[],
  relatedPages: Array<{ url: string; keyword: string }>
): Section[] {
  return sections.map((section, index) => {
    // Add 1-2 internal links per section (but not all sections)
    if (index > 0 && index < sections.length - 1 && relatedPages.length > 0) {
      const linkCount = Math.min(2, relatedPages.length);
      const links: InternalLink[] = [];

      for (let i = 0; i < linkCount; i++) {
        const page = relatedPages[i % relatedPages.length];
        links.push({
          position: `Within section: "${section.heading}"`,
          anchorText: page.keyword,
          targetUrl: page.url,
          context: `When naturally mentioning ${page.keyword}`,
        });
      }

      return {
        ...section,
        internalLinks: [...section.internalLinks, ...links],
      };
    }

    return section;
  });
}
