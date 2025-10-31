/**
 * CTA Strategy Generator
 *
 * Generates strategic call-to-action placements based on page type,
 * buyer journey stage, and content structure.
 */

import { CTAPlacement } from './types';

/**
 * CTA text by intent and industry
 */
const CTA_TEMPLATES = {
  awareness: {
    primary: [
      'Learn More',
      'Read Our Guide',
      'Get Inspired',
      'See Examples',
      'Download Free Guide',
      'View Resources',
    ],
    secondary: [
      'Subscribe to Newsletter',
      'Follow Us',
      'Join Our Community',
    ],
  },
  consideration: {
    primary: [
      'Get Free Quote',
      'Request Consultation',
      'See Pricing',
      'View Portfolio',
      'Schedule Discovery Call',
      'Compare Options',
    ],
    secondary: [
      'Read Customer Reviews',
      'See Case Studies',
      'Chat With Expert',
    ],
  },
  decision: {
    primary: [
      'Book Now',
      'Get Started Today',
      'Request Quote',
      'Call Now',
      'Start Your Project',
      'Schedule Appointment',
    ],
    secondary: [
      'Call: {phone}',
      'Email Us',
      'Visit Our Location',
    ],
  },
};

/**
 * Determine buyer intent based on page type and primary keyword
 */
export function determineBuyerIntent(
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other',
  primaryKeyword: string
): 'awareness' | 'consideration' | 'decision' {
  // Contact and quote pages are always decision stage
  if (pageType === 'contact' || primaryKeyword.toLowerCase().includes('quote')) {
    return 'decision';
  }

  // Blog posts are typically awareness stage
  if (pageType === 'blog') {
    return 'awareness';
  }

  // Service pages are consideration stage
  if (pageType === 'service') {
    return 'consideration';
  }

  // Homepage is typically consideration stage
  if (pageType === 'homepage') {
    return 'consideration';
  }

  // About pages are consideration stage
  if (pageType === 'about') {
    return 'consideration';
  }

  // Check keyword intent signals
  const keywordLower = primaryKeyword.toLowerCase();

  // Decision signals
  if (
    keywordLower.includes('buy') ||
    keywordLower.includes('hire') ||
    keywordLower.includes('book') ||
    keywordLower.includes('price') ||
    keywordLower.includes('cost')
  ) {
    return 'decision';
  }

  // Consideration signals
  if (
    keywordLower.includes('best') ||
    keywordLower.includes('top') ||
    keywordLower.includes('review') ||
    keywordLower.includes('compare')
  ) {
    return 'consideration';
  }

  // Awareness signals
  if (
    keywordLower.includes('what') ||
    keywordLower.includes('how') ||
    keywordLower.includes('guide') ||
    keywordLower.includes('tips')
  ) {
    return 'awareness';
  }

  // Default to consideration
  return 'consideration';
}

/**
 * Select appropriate CTA text for intent
 */
export function selectCTAText(
  intent: 'awareness' | 'consideration' | 'decision',
  position: 'hero' | 'mid-content' | 'bottom',
  serviceType?: string
): { primary: string; secondary?: string } {
  const templates = CTA_TEMPLATES[intent];

  // For hero position, use stronger CTAs
  if (position === 'hero') {
    if (intent === 'decision') {
      return {
        primary: 'Book Free Consultation',
        secondary: 'or call us today',
      };
    }
    if (intent === 'consideration') {
      return {
        primary: 'Get Free Quote',
        secondary: 'No obligation',
      };
    }
    return {
      primary: 'Learn More',
    };
  }

  // For mid-content, use contextual CTAs
  if (position === 'mid-content') {
    if (intent === 'decision') {
      return {
        primary: 'Start Your Project',
      };
    }
    if (intent === 'consideration') {
      return {
        primary: 'View Our Work',
        secondary: 'See why clients choose us',
      };
    }
    return {
      primary: 'Get Inspired',
    };
  }

  // For bottom, use final conversion push
  if (position === 'bottom') {
    if (intent === 'decision') {
      return {
        primary: 'Book Your Appointment Today',
        secondary: 'Limited availability',
      };
    }
    if (intent === 'consideration') {
      return {
        primary: 'Request Your Free Quote',
        secondary: 'Get personalized pricing',
      };
    }
    return {
      primary: 'Download Our Guide',
      secondary: 'Free resource',
    };
  }

  return { primary: templates.primary[0] };
}

/**
 * Generate hero CTA
 */
export function generateHeroCTA(
  intent: 'awareness' | 'consideration' | 'decision',
  primaryKeyword: string,
  phone?: string
): CTAPlacement {
  const cta = selectCTAText(intent, 'hero');

  return {
    position: 'Hero section - above the fold',
    primaryText: cta.primary,
    secondaryText: phone ? `Or call: ${phone}` : cta.secondary,
    style: 'button-primary',
    targetUrl: intent === 'awareness' ? undefined : '/contact',
    intent,
  };
}

/**
 * Generate mid-content CTA (after social proof or process)
 */
export function generateMidContentCTA(
  intent: 'awareness' | 'consideration' | 'decision',
  afterSection: string
): CTAPlacement {
  const cta = selectCTAText(intent, 'mid-content');

  return {
    position: `After section: "${afterSection}"`,
    primaryText: cta.primary,
    secondaryText: cta.secondary,
    style: intent === 'decision' ? 'button-primary' : 'button-secondary',
    targetUrl: intent === 'awareness' ? undefined : '/contact',
    intent,
  };
}

/**
 * Generate bottom CTA (final conversion)
 */
export function generateBottomCTA(
  intent: 'awareness' | 'consideration' | 'decision',
  primaryKeyword: string
): CTAPlacement {
  const cta = selectCTAText(intent, 'bottom');

  return {
    position: 'Bottom of page - final conversion opportunity',
    primaryText: cta.primary,
    secondaryText: cta.secondary,
    style: 'banner',
    targetUrl: '/contact',
    intent,
  };
}

/**
 * Generate inline CTA (within content)
 */
export function generateInlineCTA(
  position: string,
  intent: 'awareness' | 'consideration' | 'decision'
): CTAPlacement {
  const ctaText = intent === 'awareness'
    ? 'Learn more about our services'
    : intent === 'consideration'
    ? 'Get your free quote'
    : 'Book your appointment';

  return {
    position,
    primaryText: ctaText,
    style: 'text-link',
    targetUrl: intent === 'awareness' ? '/services' : '/contact',
    intent,
  };
}

/**
 * Main function: Generate comprehensive CTA strategy for a page
 */
export function generateCTAStrategy(
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other',
  primaryKeyword: string,
  sections: Array<{ heading: string; purpose: string; level: number }>,
  businessInfo?: { phone?: string }
): CTAPlacement[] {
  const ctas: CTAPlacement[] = [];

  // Determine buyer intent
  const intent = determineBuyerIntent(pageType, primaryKeyword);

  // 1. Hero CTA (always include)
  ctas.push(generateHeroCTA(intent, primaryKeyword, businessInfo?.phone));

  // 2. Mid-content CTAs (after key sections)
  // Look for process, benefits, or social proof sections
  const keySection = sections.find(
    (s) =>
      s.level === 2 &&
      (s.purpose.toLowerCase().includes('process') ||
        s.purpose.toLowerCase().includes('benefit') ||
        s.purpose.toLowerCase().includes('proof') ||
        s.purpose.toLowerCase().includes('testimonial'))
  );

  if (keySection) {
    ctas.push(generateMidContentCTA(intent, keySection.heading));
  }

  // 3. Bottom CTA (always include)
  ctas.push(generateBottomCTA(intent, primaryKeyword));

  // 4. Add inline CTAs for longer pages (8+ sections)
  if (sections.length >= 8) {
    // Add inline CTA after 3rd H2 section
    const thirdH2 = sections.filter((s) => s.level === 2)[2];
    if (thirdH2) {
      ctas.push(generateInlineCTA(`Within section: "${thirdH2.heading}"`, intent));
    }
  }

  return ctas;
}

/**
 * Generate CTA for FAQ section
 */
export function generateFAQCTA(
  intent: 'awareness' | 'consideration' | 'decision'
): CTAPlacement {
  const ctaText = intent === 'decision'
    ? 'Ready to get started? Book your consultation'
    : intent === 'consideration'
    ? 'Have more questions? Get in touch'
    : 'Want to learn more? Explore our services';

  return {
    position: 'After FAQ section',
    primaryText: ctaText,
    style: 'button-secondary',
    targetUrl: '/contact',
    intent,
  };
}

/**
 * Customize CTA for specific business type
 */
export function customizeCTAForBusiness(
  cta: CTAPlacement,
  businessType?: string
): CTAPlacement {
  if (!businessType) return cta;

  const businessLower = businessType.toLowerCase();

  // Customize based on business type
  if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    if (cta.intent === 'decision') {
      return { ...cta, primaryText: 'Reserve Your Table' };
    }
  }

  if (businessLower.includes('salon') || businessLower.includes('spa')) {
    if (cta.intent === 'decision') {
      return { ...cta, primaryText: 'Book Your Appointment' };
    }
  }

  if (businessLower.includes('lawyer') || businessLower.includes('legal')) {
    if (cta.intent === 'consideration') {
      return { ...cta, primaryText: 'Schedule Free Consultation' };
    }
  }

  if (businessLower.includes('contractor') || businessLower.includes('builder')) {
    if (cta.intent === 'consideration') {
      return { ...cta, primaryText: 'Get Your Free Estimate' };
    }
  }

  return cta;
}

/**
 * Helper: Format CTA as HTML
 */
export function formatCTAAsHTML(cta: CTAPlacement): string {
  const styleClass =
    cta.style === 'button-primary'
      ? 'cta-button primary'
      : cta.style === 'button-secondary'
      ? 'cta-button secondary'
      : cta.style === 'banner'
      ? 'cta-banner'
      : 'cta-link';

  const href = cta.targetUrl || '#contact';

  let html = `<a href="${href}" class="${styleClass}">${cta.primaryText}</a>`;

  if (cta.secondaryText) {
    html += `\n<p class="cta-secondary">${cta.secondaryText}</p>`;
  }

  return html;
}
