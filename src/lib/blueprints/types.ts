/**
 * Blueprint Phase Type Definitions
 *
 * These types define the structure for detailed, copy-paste-ready page wireframes
 * that specify exact structure, image placements, CTAs, and schema markup.
 */

export interface PageBlueprint {
  url: string;
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other';
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
  faqSection?: FAQSection;
}

export interface SchemaMarkup {
  type: string; // "Organization", "Service", "Article", etc.
  jsonLd: string; // formatted JSON-LD ready to paste
}

export interface Section {
  heading: string; // Full heading text e.g., "H1: Custom Tattoo Design in Edinburgh"
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 for non-heading sections, 1-6 for H1-H6
  purpose: string; // "Hook reader and establish expertise"
  targetWordCount: number;
  keywordsToInclude: string[];
  contentGuidance: string; // "Use numbered list. Include process steps."
  contentStructure?: 'paragraph' | 'list' | 'numbered-list' | 'table' | 'mixed';
  images: ImageSuggestion[];
  ctas: CTAPlacement[];
  internalLinks: InternalLink[];
}

export interface ImageSuggestion {
  position: string; // "Hero section", "After H2: Process"
  description: string; // "Client consultation with artist sketching design"
  altTextTemplate: string; // "Tattoo artist consulting with client on {keyword} in {location}"
  imageType: 'photo' | 'diagram' | 'screenshot' | 'graphic' | 'portfolio' | 'infographic';
  sizeGuidance?: string; // "1200x600px hero image"
}

export interface CTAPlacement {
  position: string; // "Hero section", "After intro", "Bottom of page"
  primaryText: string; // "Book Free Consultation"
  secondaryText?: string; // "Or call us: 0131 XXX XXXX"
  style: 'button-primary' | 'button-secondary' | 'text-link' | 'banner';
  targetUrl?: string; // "/contact", "/booking"
  intent: 'awareness' | 'consideration' | 'decision';
}

export interface InternalLink {
  position: string; // "In introduction paragraph", "After H2: Services"
  anchorText: string; // "tattoo styles", "view our portfolio"
  targetUrl: string; // "/tattoo-styles", "/portfolio"
  context: string; // "When mentioning different design options"
}

export interface FAQSection {
  questions: FAQItem[];
  schemaMarkup: string; // FAQPage JSON-LD
}

export interface FAQItem {
  question: string;
  answerGuidance: string; // What the answer should cover
  targetWordCount: number;
  keywordsToInclude: string[];
}

/**
 * Input types for blueprint generation
 */

export interface PageStrategy {
  url: string;
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other';
  primaryKeyword: string;
  secondaryKeywords: string[];
  contentTargets: {
    wordCount: number;
    sectionCount: number;
    imageCount: number;
    includesFAQ: boolean;
  };
  priority: number;
  status: 'create' | 'optimize' | 'keep';
}

export interface ContentTarget {
  wordCount: number; // Aligned with PageStrategy.contentTargets
  sectionCount: number;
  imageCount: number;
  includesFAQ: boolean;
}

export interface BusinessInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  businessType?: string;
  serviceArea?: string;
  description?: string;
}

export interface CompetitorPattern {
  imagePlacements?: string[];
  sectionStructure?: string[];
  ctaPlacements?: string[];
  faqQuestions?: string[];
}
