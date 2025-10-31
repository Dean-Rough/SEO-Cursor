import { load } from "cheerio";
import { analysePage } from "../analyse-page";
import type { EnhancedPageAnalysis, ExtractedCTA } from "./types";

/**
 * Analyzes a page with enhanced intelligence gathering capabilities.
 * Extends the base page analysis with page type detection, CTA extraction,
 * schema markup detection, and content structure metrics.
 *
 * @param url - The URL of the page being analyzed
 * @param html - The raw HTML content of the page
 * @param businessContext - Optional business context for better analysis
 * @returns Enhanced page analysis with additional intelligence data
 */
export async function analyzePageEnhanced(
  url: string,
  html: string,
  businessContext?: { type: string; location?: string }
): Promise<EnhancedPageAnalysis> {
  // Get base analysis
  const baseAnalysis = analysePage(url, html);

  // Perform enhanced analysis
  const pageType = detectPageType(url, html);
  const ctas = extractCTAs(html);
  const schemaTypes = extractSchemaTypes(html);
  const { h2Count, h3Count } = countHeadingLevels(html);
  const imageCount = countImages(html);
  const hasFAQ = detectFAQSection(html);

  return {
    ...baseAnalysis,
    pageType,
    ctas,
    schemaTypes,
    h2Count,
    h3Count,
    imageCount,
    hasFAQ,
  };
}

/**
 * Detects the type of page based on URL patterns and content analysis.
 * Uses URL structure and heading content to categorize pages.
 *
 * @param url - The URL to analyze
 * @param html - The HTML content of the page
 * @returns The detected page type
 */
export function detectPageType(url: string, html: string): EnhancedPageAnalysis['pageType'] {
  const urlLower = url.toLowerCase();
  const pathname = new URL(url).pathname.toLowerCase();

  // Homepage detection
  if (pathname === '/' || pathname === '' || pathname === '/index.html' || pathname === '/home') {
    return 'homepage';
  }

  // Contact page detection
  if (
    /\/(contact|get-in-touch|reach-us|connect)($|\/|\?)/i.test(pathname) ||
    /contact[-_]?(us|page)?/i.test(pathname)
  ) {
    return 'contact';
  }

  // About page detection
  if (
    /\/(about|who-we-are|our-story|our-team|meet-the-team)($|\/|\?)/i.test(pathname) ||
    /about[-_]?(us|page)?/i.test(pathname)
  ) {
    return 'about';
  }

  // Blog/News page detection
  if (
    /\/(blog|news|articles|insights|resources|posts)($|\/|\?)/i.test(pathname) ||
    /\d{4}\/\d{2}\/\d{2}/i.test(pathname) // Date-based URLs
  ) {
    return 'blog';
  }

  // Service page detection
  if (
    /\/(service|services|what-we-do|solutions|products|offerings)($|\/|\?)/i.test(pathname)
  ) {
    return 'service';
  }

  // Content-based detection for ambiguous URLs
  const $ = load(html);
  const h1Text = $('h1').first().text().toLowerCase();
  const titleText = $('title').text().toLowerCase();

  // Check for blog indicators in heading/title
  if (
    /\b(blog|article|post|news)\b/i.test(h1Text) ||
    /\b(blog|article|post|news)\b/i.test(titleText)
  ) {
    return 'blog';
  }

  // Check for service indicators
  if (
    /\b(service|solution|product|offering)\b/i.test(h1Text) ||
    /\b(service|solution|product|offering)\b/i.test(titleText)
  ) {
    return 'service';
  }

  // Default to 'other' if no clear pattern matches
  return 'other';
}

/**
 * Extracts call-to-action (CTA) elements from the page HTML.
 * Looks for buttons and links with action-oriented text.
 *
 * @param html - The HTML content to analyze
 * @returns Array of extracted CTAs
 */
export function extractCTAs(html: string): ExtractedCTA[] {
  const $ = load(html);
  const ctas: ExtractedCTA[] = [];

  // Action words that indicate CTAs
  const actionWords = [
    'book', 'schedule', 'call', 'contact', 'get', 'start', 'try', 'buy',
    'shop', 'order', 'request', 'download', 'subscribe', 'sign up', 'join',
    'learn more', 'discover', 'explore', 'view', 'see', 'find out', 'enquire',
    'register', 'apply', 'quote', 'estimate', 'free', 'demo', 'consultation'
  ];

  // Extract button elements
  $('button').each((_, el) => {
    const text = $(el).text().trim();
    if (text && hasActionWord(text, actionWords)) {
      const href = $(el).attr('onclick')?.match(/location\.href\s*=\s*['"]([^'"]+)['"]/)?.[1];
      ctas.push({
        text: text.slice(0, 100), // Limit length
        type: 'button',
        targetUrl: href,
      });
    }
  });

  // Extract links with button-like classes or action-oriented text
  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const classList = $(el).attr('class') || '';
    const href = $(el).attr('href');

    // Check if link looks like a button (has button-related classes)
    const looksLikeButton = /\b(btn|button|cta|call-to-action)\b/i.test(classList);

    if (text && href && (looksLikeButton || hasActionWord(text, actionWords))) {
      // Avoid duplicates
      const isDuplicate = ctas.some(cta =>
        cta.text.toLowerCase() === text.toLowerCase() && cta.targetUrl === href
      );

      if (!isDuplicate) {
        ctas.push({
          text: text.slice(0, 100), // Limit length
          type: looksLikeButton ? 'button' : 'link',
          targetUrl: href,
        });
      }
    }
  });

  // Deduplicate by text (case-insensitive)
  const seen = new Set<string>();
  return ctas.filter(cta => {
    const key = cta.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Checks if text contains any action words that indicate a CTA
 */
function hasActionWord(text: string, actionWords: string[]): boolean {
  const textLower = text.toLowerCase();
  return actionWords.some(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i');
    return pattern.test(textLower);
  });
}

/**
 * Extracts schema.org types from JSON-LD scripts in the page.
 * Parses all JSON-LD script tags and extracts @type values.
 *
 * @param html - The HTML content to analyze
 * @returns Array of schema type names (e.g., ["Service", "LocalBusiness"])
 */
export function extractSchemaTypes(html: string): string[] {
  const $ = load(html);
  const schemaTypes = new Set<string>();

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonText = $(el).html();
      if (!jsonText) return;

      const data = JSON.parse(jsonText);
      extractTypesFromSchema(data, schemaTypes);
    } catch (error) {
      // Invalid JSON, skip this script
    }
  });

  return Array.from(schemaTypes);
}

/**
 * Recursively extracts @type values from schema.org JSON-LD data
 */
function extractTypesFromSchema(data: any, types: Set<string>): void {
  if (!data || typeof data !== 'object') return;

  // Handle arrays
  if (Array.isArray(data)) {
    data.forEach(item => extractTypesFromSchema(item, types));
    return;
  }

  // Extract @type if present
  if (data['@type']) {
    if (typeof data['@type'] === 'string') {
      types.add(data['@type']);
    } else if (Array.isArray(data['@type'])) {
      data['@type'].forEach((type: string) => {
        if (typeof type === 'string') types.add(type);
      });
    }
  }

  // Recursively check nested objects
  for (const key in data) {
    if (key !== '@type' && typeof data[key] === 'object') {
      extractTypesFromSchema(data[key], types);
    }
  }
}

/**
 * Counts H2 and H3 headings in the HTML content
 *
 * @param html - The HTML content to analyze
 * @returns Object with h2Count and h3Count
 */
function countHeadingLevels(html: string): { h2Count: number; h3Count: number } {
  const $ = load(html);
  return {
    h2Count: $('h2').length,
    h3Count: $('h3').length,
  };
}

/**
 * Counts the total number of images on the page
 *
 * @param html - The HTML content to analyze
 * @returns Number of img tags found
 */
function countImages(html: string): number {
  const $ = load(html);
  return $('img').length;
}

/**
 * Detects whether the page contains an FAQ section.
 * Looks for headings or schema markup indicating FAQs.
 *
 * @param html - The HTML content to analyze
 * @returns True if FAQ section is detected
 */
function detectFAQSection(html: string): boolean {
  const $ = load(html);

  // Check for FAQ in headings
  const hasHeadingIndicator = $('h1, h2, h3, h4').toArray().some(el => {
    const text = $(el).text().toLowerCase();
    return /\b(faq|frequently asked questions?|common questions?)\b/i.test(text);
  });

  if (hasHeadingIndicator) return true;

  // Check for FAQ schema
  const hasFAQSchema = $('script[type="application/ld+json"]').toArray().some(el => {
    try {
      const jsonText = $(el).html();
      if (!jsonText) return false;
      const data = JSON.parse(jsonText);
      return containsType(data, 'FAQPage') || containsType(data, 'Question');
    } catch {
      return false;
    }
  });

  return hasFAQSchema;
}

/**
 * Checks if schema data contains a specific @type
 */
function containsType(data: any, targetType: string): boolean {
  if (!data || typeof data !== 'object') return false;

  if (Array.isArray(data)) {
    return data.some(item => containsType(item, targetType));
  }

  if (data['@type']) {
    if (typeof data['@type'] === 'string' && data['@type'] === targetType) {
      return true;
    }
    if (Array.isArray(data['@type']) && data['@type'].includes(targetType)) {
      return true;
    }
  }

  // Check nested objects
  for (const key in data) {
    if (key !== '@type' && typeof data[key] === 'object') {
      if (containsType(data[key], targetType)) return true;
    }
  }

  return false;
}
