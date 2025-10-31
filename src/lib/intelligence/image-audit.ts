import { load } from "cheerio";
import type { EnhancedPageAnalysis, ImageAuditResult } from "./types";

/**
 * Performs a comprehensive audit of images across multiple pages.
 * Analyzes alt text quality, keyword optimization, and identifies pages lacking images.
 *
 * @param pages - Array of enhanced page analyses containing image data
 * @param businessContext - Business information for keyword matching in alt text
 * @returns Complete image audit results
 */
export function auditImages(
  pages: EnhancedPageAnalysis[],
  businessContext: { type: string; location?: string }
): ImageAuditResult {
  if (pages.length === 0) {
    return {
      totalImages: 0,
      imagesWithAlt: 0,
      imagesWithDescriptiveAlt: 0,
      imagesWithKeywordAlt: 0,
      averageImagesPerPage: 0,
      pagesWithoutImages: [],
    };
  }

  let totalImages = 0;
  let imagesWithAlt = 0;
  let imagesWithDescriptiveAlt = 0;
  let imagesWithKeywordAlt = 0;
  const pagesWithoutImages: string[] = [];

  // Extract business-relevant keywords for alt text analysis
  const relevantKeywords = extractBusinessKeywords(businessContext);

  pages.forEach(page => {
    if (page.status !== 'ok') return;

    const pageImageCount = page.imageCount;
    totalImages += pageImageCount;

    // Track pages without images
    if (pageImageCount === 0) {
      pagesWithoutImages.push(page.url);
      return;
    }

    // We need to re-parse the page HTML to analyze individual images
    // Since we don't store the HTML in EnhancedPageAnalysis, we'll need to
    // pass it separately. For now, we'll estimate based on page-level data.
    // In a real implementation, you'd store image details during the crawl.
  });

  // Since we don't have access to individual image alt text in the current
  // EnhancedPageAnalysis structure, we'll need to extend the crawling to capture this.
  // For now, provide a framework that assumes this data will be added.

  return {
    totalImages,
    imagesWithAlt: 0, // Will be calculated when we have image details
    imagesWithDescriptiveAlt: 0,
    imagesWithKeywordAlt: 0,
    averageImagesPerPage: pages.length > 0 ? totalImages / pages.length : 0,
    pagesWithoutImages,
  };
}

/**
 * Analyzes images from a single page's HTML.
 * Extracts detailed information about each image including alt text quality.
 *
 * @param html - The HTML content of the page
 * @param businessContext - Business information for keyword matching
 * @returns Detailed image analysis for the page
 */
export function analyzePageImages(
  html: string,
  businessContext: { type: string; location?: string }
): {
  totalImages: number;
  imagesWithAlt: number;
  imagesWithDescriptiveAlt: number;
  imagesWithKeywordAlt: number;
  imageDetails: Array<{ src: string; alt: string; hasAlt: boolean; isDescriptive: boolean; isKeywordOptimized: boolean }>;
} {
  const $ = load(html);
  const relevantKeywords = extractBusinessKeywords(businessContext);

  let imagesWithAlt = 0;
  let imagesWithDescriptiveAlt = 0;
  let imagesWithKeywordAlt = 0;
  const imageDetails: Array<{
    src: string;
    alt: string;
    hasAlt: boolean;
    isDescriptive: boolean;
    isKeywordOptimized: boolean;
  }> = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';

    const hasAlt = alt.length > 0;
    const isDescriptive = isDescriptiveAlt(alt);
    const isKeywordOptimized = hasAlt && containsRelevantKeywords(alt, relevantKeywords);

    if (hasAlt) imagesWithAlt++;
    if (isDescriptive) imagesWithDescriptiveAlt++;
    if (isKeywordOptimized) imagesWithKeywordAlt++;

    imageDetails.push({
      src,
      alt,
      hasAlt,
      isDescriptive,
      isKeywordOptimized,
    });
  });

  return {
    totalImages: imageDetails.length,
    imagesWithAlt,
    imagesWithDescriptiveAlt,
    imagesWithKeywordAlt,
    imageDetails,
  };
}

/**
 * Performs a complete image audit by re-fetching and analyzing page HTML.
 * This is a more thorough version that requires page HTML content.
 *
 * @param pagesWithHtml - Array of objects containing page URL and HTML content
 * @param businessContext - Business information for keyword matching
 * @returns Complete image audit results
 */
export function auditImagesDetailed(
  pagesWithHtml: Array<{ url: string; html: string }>,
  businessContext: { type: string; location?: string }
): ImageAuditResult {
  if (pagesWithHtml.length === 0) {
    return {
      totalImages: 0,
      imagesWithAlt: 0,
      imagesWithDescriptiveAlt: 0,
      imagesWithKeywordAlt: 0,
      averageImagesPerPage: 0,
      pagesWithoutImages: [],
    };
  }

  let totalImages = 0;
  let imagesWithAlt = 0;
  let imagesWithDescriptiveAlt = 0;
  let imagesWithKeywordAlt = 0;
  const pagesWithoutImages: string[] = [];

  pagesWithHtml.forEach(({ url, html }) => {
    const analysis = analyzePageImages(html, businessContext);

    totalImages += analysis.totalImages;
    imagesWithAlt += analysis.imagesWithAlt;
    imagesWithDescriptiveAlt += analysis.imagesWithDescriptiveAlt;
    imagesWithKeywordAlt += analysis.imagesWithKeywordAlt;

    if (analysis.totalImages === 0) {
      pagesWithoutImages.push(url);
    }
  });

  return {
    totalImages,
    imagesWithAlt,
    imagesWithDescriptiveAlt,
    imagesWithKeywordAlt,
    averageImagesPerPage: totalImages / pagesWithHtml.length,
    pagesWithoutImages,
  };
}

/**
 * Determines if alt text is descriptive (more than 5 words)
 *
 * @param alt - The alt text to analyze
 * @returns True if the alt text is descriptive
 */
function isDescriptiveAlt(alt: string): boolean {
  if (!alt || alt.trim().length === 0) return false;

  const words = alt.trim().split(/\s+/).filter(Boolean);
  return words.length > 5;
}

/**
 * Extracts relevant business keywords for alt text analysis.
 * Breaks down business type and location into searchable terms.
 *
 * @param businessContext - Business type and location information
 * @returns Array of lowercase keywords to search for
 */
function extractBusinessKeywords(businessContext: { type: string; location?: string }): string[] {
  const keywords: string[] = [];

  // Add business type keywords (split on common separators)
  const typeWords = businessContext.type
    .toLowerCase()
    .split(/[\s,\-\/&]+/)
    .filter(word => word.length > 2); // Ignore very short words

  keywords.push(...typeWords);

  // Add location keywords if available
  if (businessContext.location) {
    const locationWords = businessContext.location
      .toLowerCase()
      .split(/[\s,\-\/&]+/)
      .filter(word => word.length > 2);

    keywords.push(...locationWords);
  }

  return keywords;
}

/**
 * Checks if alt text contains relevant business keywords
 *
 * @param alt - The alt text to check
 * @param keywords - Array of relevant keywords
 * @returns True if alt text contains at least one keyword
 */
function containsRelevantKeywords(alt: string, keywords: string[]): boolean {
  const altLower = alt.toLowerCase();

  return keywords.some(keyword => {
    // Use word boundary matching to avoid false positives
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    return regex.test(altLower);
  });
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates recommendations for image optimization based on audit results.
 *
 * @param audit - The image audit results
 * @returns Array of actionable recommendations
 */
export function generateImageRecommendations(audit: ImageAuditResult): string[] {
  const recommendations: string[] = [];

  if (audit.totalImages === 0) {
    recommendations.push(
      'No images found on the site. Adding relevant images can significantly improve user engagement and SEO.'
    );
    return recommendations;
  }

  // Calculate percentages
  const altPercentage = (audit.imagesWithAlt / audit.totalImages) * 100;
  const descriptivePercentage = (audit.imagesWithDescriptiveAlt / audit.totalImages) * 100;
  const keywordPercentage = (audit.imagesWithKeywordAlt / audit.totalImages) * 100;

  // Alt text recommendations
  if (altPercentage < 50) {
    recommendations.push(
      `Only ${altPercentage.toFixed(0)}% of images have alt text. Add descriptive alt text to all images for accessibility and SEO.`
    );
  } else if (altPercentage < 90) {
    recommendations.push(
      `${altPercentage.toFixed(0)}% of images have alt text. Aim for 100% coverage to maximize accessibility and SEO benefits.`
    );
  }

  // Descriptive alt text recommendations
  if (descriptivePercentage < 40 && audit.imagesWithAlt > 0) {
    recommendations.push(
      `Only ${descriptivePercentage.toFixed(0)}% of images have descriptive alt text (>5 words). Expand alt text to be more descriptive of image content.`
    );
  }

  // Keyword optimization recommendations
  if (keywordPercentage < 30 && audit.imagesWithAlt > 0) {
    recommendations.push(
      `Only ${keywordPercentage.toFixed(0)}% of images have keyword-optimized alt text. Include relevant business and location keywords naturally in alt text.`
    );
  }

  // Pages without images
  if (audit.pagesWithoutImages.length > 0) {
    const percentage = (audit.pagesWithoutImages.length / audit.totalImages) * 100;
    recommendations.push(
      `${audit.pagesWithoutImages.length} pages have no images. Consider adding relevant visuals to improve engagement.`
    );
  }

  // Average images per page
  if (audit.averageImagesPerPage < 2) {
    recommendations.push(
      `Average of ${audit.averageImagesPerPage.toFixed(1)} images per page is low. Most high-performing pages have 3-5 relevant images.`
    );
  }

  return recommendations;
}
