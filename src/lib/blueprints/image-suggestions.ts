/**
 * Image Suggestion Engine
 *
 * Generates specific, actionable image suggestions for each section of a page.
 * Suggestions include position, description, alt text templates, and image type.
 */

import { ImageSuggestion, CompetitorPattern } from './types';

/**
 * Image type recommendations by section purpose
 */
const IMAGE_TYPE_BY_PURPOSE: Record<string, ImageSuggestion['imageType']> = {
  hero: 'photo',
  introduction: 'photo',
  process: 'infographic',
  'how-it-works': 'diagram',
  benefits: 'graphic',
  features: 'photo',
  proof: 'portfolio',
  testimonials: 'photo',
  'case-study': 'photo',
  portfolio: 'portfolio',
  gallery: 'portfolio',
  faq: 'graphic',
  cta: 'photo',
  about: 'photo',
  team: 'photo',
  contact: 'photo',
};

/**
 * Size guidance by position
 */
const SIZE_GUIDANCE: Record<string, string> = {
  hero: '1920x1080px or 16:9 ratio, hero banner',
  'full-width': '1920x800px wide banner',
  inline: '800x600px or 4:3 ratio',
  thumbnail: '400x300px thumbnail',
  square: '800x800px square',
  portrait: '600x800px portrait orientation',
};

/**
 * Suggest images for a hero section
 */
export function suggestHeroImage(
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other',
  primaryKeyword: string,
  businessName: string,
  location?: string
): ImageSuggestion {
  const descriptions: Record<string, string> = {
    homepage: `${businessName} storefront or team delivering service`,
    service: `Professional delivering ${primaryKeyword} service to satisfied client`,
    blog: `Featured image illustrating ${primaryKeyword} concept`,
    about: `${businessName} team members or founder`,
    contact: `${businessName} location or friendly team member`,
    other: `Professional representation of ${primaryKeyword}`,
  };

  const locationPart = location ? ` in ${location}` : '';

  return {
    position: 'Hero section',
    description: descriptions[pageType] || descriptions.other,
    altTextTemplate: `${businessName} - ${primaryKeyword}${locationPart}`,
    imageType: 'photo',
    sizeGuidance: SIZE_GUIDANCE.hero,
  };
}

/**
 * Suggest images for a process/how-it-works section
 */
export function suggestProcessImage(
  sectionHeading: string,
  primaryKeyword: string,
  stepCount?: number
): ImageSuggestion {
  const steps = stepCount || 5;

  return {
    position: `Above or within section: "${sectionHeading}"`,
    description: `${steps}-step process diagram showing workflow from start to completion`,
    altTextTemplate: `${steps}-step ${primaryKeyword} process flowchart`,
    imageType: 'infographic',
    sizeGuidance: SIZE_GUIDANCE.inline,
  };
}

/**
 * Suggest images for a benefits/features section
 */
export function suggestBenefitsImage(
  sectionHeading: string,
  primaryKeyword: string
): ImageSuggestion {
  return {
    position: `After heading: "${sectionHeading}"`,
    description: `Icon grid or visual representation of key benefits`,
    altTextTemplate: `Key benefits of ${primaryKeyword} service`,
    imageType: 'graphic',
    sizeGuidance: SIZE_GUIDANCE.inline,
  };
}

/**
 * Suggest images for a proof/portfolio section
 */
export function suggestPortfolioImages(
  sectionHeading: string,
  primaryKeyword: string,
  imageCount: number = 6
): ImageSuggestion {
  return {
    position: `Within section: "${sectionHeading}"`,
    description: `Grid of ${imageCount} high-quality ${primaryKeyword} examples showcasing range and quality`,
    altTextTemplate: `${primaryKeyword} portfolio example {number} by {businessName}`,
    imageType: 'portfolio',
    sizeGuidance: SIZE_GUIDANCE.square,
  };
}

/**
 * Suggest images for a testimonial section
 */
export function suggestTestimonialImage(
  sectionHeading: string
): ImageSuggestion {
  return {
    position: `Alongside testimonials in: "${sectionHeading}"`,
    description: `Client headshots or before/after comparison images`,
    altTextTemplate: `Satisfied {businessName} client testimonial`,
    imageType: 'photo',
    sizeGuidance: SIZE_GUIDANCE.thumbnail,
  };
}

/**
 * Suggest images for an about/team section
 */
export function suggestTeamImage(
  businessName: string,
  location?: string
): ImageSuggestion {
  const locationPart = location ? ` in ${location}` : '';

  return {
    position: 'Within "About" or "Team" section',
    description: `Professional team photo or individual headshots of key team members`,
    altTextTemplate: `${businessName} team${locationPart}`,
    imageType: 'photo',
    sizeGuidance: SIZE_GUIDANCE.inline,
  };
}

/**
 * Suggest images for a FAQ section
 */
export function suggestFAQImage(primaryKeyword: string): ImageSuggestion {
  return {
    position: 'Before FAQ section',
    description: `Simple graphic or icon representing questions/answers`,
    altTextTemplate: `Frequently asked questions about ${primaryKeyword}`,
    imageType: 'graphic',
    sizeGuidance: SIZE_GUIDANCE.inline,
  };
}

/**
 * Main function: Generate image suggestions for a section
 */
export function suggestImagesForSection(
  section: {
    heading: string;
    purpose: string;
    level: number;
  },
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other',
  primaryKeyword: string,
  businessName: string,
  location?: string,
  competitorImagePatterns?: CompetitorPattern
): ImageSuggestion[] {
  const suggestions: ImageSuggestion[] = [];

  // Normalize purpose for matching
  const purposeLower = section.purpose.toLowerCase();
  const headingLower = section.heading.toLowerCase();

  // Hero section (H1)
  if (section.level === 1) {
    suggestions.push(suggestHeroImage(pageType, primaryKeyword, businessName, location));
    return suggestions;
  }

  // Process/How-it-works section
  if (
    purposeLower.includes('process') ||
    purposeLower.includes('how it works') ||
    headingLower.includes('process') ||
    headingLower.includes('how')
  ) {
    suggestions.push(suggestProcessImage(section.heading, primaryKeyword));
  }

  // Benefits/Features section
  if (
    purposeLower.includes('benefit') ||
    purposeLower.includes('feature') ||
    headingLower.includes('benefit') ||
    headingLower.includes('why')
  ) {
    suggestions.push(suggestBenefitsImage(section.heading, primaryKeyword));
  }

  // Portfolio/Proof section
  if (
    purposeLower.includes('proof') ||
    purposeLower.includes('portfolio') ||
    purposeLower.includes('example') ||
    purposeLower.includes('showcase') ||
    headingLower.includes('portfolio') ||
    headingLower.includes('work') ||
    headingLower.includes('gallery')
  ) {
    suggestions.push(suggestPortfolioImages(section.heading, primaryKeyword));
  }

  // Testimonial section
  if (
    purposeLower.includes('testimonial') ||
    purposeLower.includes('review') ||
    purposeLower.includes('client') ||
    headingLower.includes('testimonial') ||
    headingLower.includes('review')
  ) {
    suggestions.push(suggestTestimonialImage(section.heading));
  }

  // About/Team section
  if (
    purposeLower.includes('team') ||
    purposeLower.includes('about') ||
    purposeLower.includes('who we are') ||
    headingLower.includes('team') ||
    headingLower.includes('about')
  ) {
    suggestions.push(suggestTeamImage(businessName, location));
  }

  // FAQ section
  if (
    purposeLower.includes('faq') ||
    purposeLower.includes('question') ||
    headingLower.includes('faq') ||
    headingLower.includes('question')
  ) {
    suggestions.push(suggestFAQImage(primaryKeyword));
  }

  // Default: Add a relevant inline image if no specific match
  if (suggestions.length === 0 && section.level === 2) {
    suggestions.push({
      position: `After heading: "${section.heading}"`,
      description: `Relevant photo or graphic illustrating ${primaryKeyword}`,
      altTextTemplate: `${primaryKeyword} - ${section.heading.replace(/^H\d:\s*/, '')}`,
      imageType: 'photo',
      sizeGuidance: SIZE_GUIDANCE.inline,
    });
  }

  return suggestions;
}

/**
 * Generate comprehensive image strategy for a page
 */
export function generatePageImageStrategy(
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other',
  primaryKeyword: string,
  businessName: string,
  sections: Array<{ heading: string; purpose: string; level: number }>,
  targetImageCount: number,
  location?: string,
  competitorPatterns?: CompetitorPattern
): ImageSuggestion[] {
  const allSuggestions: ImageSuggestion[] = [];

  // Generate suggestions for each section
  sections.forEach((section) => {
    const sectionSuggestions = suggestImagesForSection(
      section,
      pageType,
      primaryKeyword,
      businessName,
      location,
      competitorPatterns
    );
    allSuggestions.push(...sectionSuggestions);
  });

  // If we haven't reached target, add more generic images
  while (allSuggestions.length < targetImageCount) {
    allSuggestions.push({
      position: `Section ${allSuggestions.length + 1}`,
      description: `Supporting image illustrating ${primaryKeyword} service or concept`,
      altTextTemplate: `${businessName} ${primaryKeyword} example ${allSuggestions.length + 1}`,
      imageType: 'photo',
      sizeGuidance: SIZE_GUIDANCE.inline,
    });
  }

  // If we have too many, trim to target
  return allSuggestions.slice(0, targetImageCount);
}

/**
 * Helper: Create alt text from template
 */
export function fillAltTextTemplate(
  template: string,
  replacements: Record<string, string>
): string {
  let result = template;

  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });

  return result;
}
