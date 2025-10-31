import type { PageAnalysis } from '../types';
import type { EnhancedPageAnalysis } from '../intelligence/types';
import { analyzePageEnhanced } from '../intelligence';

/**
 * Enriches basic page analysis with enhanced intelligence data
 * Falls back to basic analysis with sensible defaults if enhancement fails
 */
export async function enrichPageAnalysis(
  page: PageAnalysis,
  html: string,
  businessContext: { type: string; location?: string }
): Promise<EnhancedPageAnalysis> {
  try {
    return await analyzePageEnhanced(page.url, html, businessContext);
  } catch (error) {
    console.warn(`Failed to enrich page analysis for ${page.url}:`, error);
    // Fallback to basic analysis with defaults
    return {
      ...page,
      pageType: 'other',
      ctas: [],
      schemaTypes: [],
      h2Count: 0,
      h3Count: 0,
      imageCount: 0,
      hasFAQ: false,
    };
  }
}
