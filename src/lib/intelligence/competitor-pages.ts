import type {
  EnhancedPageAnalysis,
  CompetitorPageInventory,
  CategorizedPage,
  CommonPagePattern,
} from "./types";

/**
 * Builds a comprehensive inventory of competitor pages and identifies common patterns.
 * Analyzes page structures across competitors to find content gaps and opportunities.
 *
 * @param competitors - Array of competitor domains with their analyzed pages
 * @returns Complete page inventory with categorization and common patterns
 */
export function buildPageInventory(
  competitors: Array<{ domain: string; pages: EnhancedPageAnalysis[] }>
): CompetitorPageInventory {
  // Categorize all pages
  const allPages: CategorizedPage[] = [];

  competitors.forEach(competitor => {
    competitor.pages.forEach(page => {
      if (page.status !== 'ok') return;

      allPages.push({
        url: page.url,
        pageType: page.pageType,
        slug: extractSlug(page.url),
        domain: competitor.domain,
      });
    });
  });

  // Find common page patterns
  const commonPages = findCommonPatterns(allPages, competitors.length);

  return {
    allPages,
    commonPages,
  };
}

/**
 * Extracts the URL slug/path from a full URL.
 * Normalizes the slug for pattern matching.
 *
 * @param url - The full URL to extract slug from
 * @returns Normalized slug
 */
function extractSlug(url: string): string {
  try {
    const urlObj = new URL(url);
    let slug = urlObj.pathname;

    // Remove trailing slash
    if (slug.endsWith('/') && slug.length > 1) {
      slug = slug.slice(0, -1);
    }

    // Remove leading slash for consistency
    if (slug.startsWith('/')) {
      slug = slug.slice(1);
    }

    // If empty (homepage), use 'home'
    if (slug === '') {
      slug = 'home';
    }

    return slug.toLowerCase();
  } catch {
    return 'unknown';
  }
}

/**
 * Finds common page patterns across multiple competitors.
 * A pattern is "common" if it appears on multiple competitor sites.
 *
 * @param allPages - All categorized pages from all competitors
 * @param totalCompetitors - Total number of competitors analyzed
 * @returns Array of common page patterns sorted by frequency
 */
function findCommonPatterns(
  allPages: CategorizedPage[],
  totalCompetitors: number
): CommonPagePattern[] {
  // Group pages by normalized slug
  const slugGroups = new Map<string, CategorizedPage[]>();

  allPages.forEach(page => {
    const normalizedSlug = normalizeSlug(page.slug);
    const existing = slugGroups.get(normalizedSlug) || [];
    existing.push(page);
    slugGroups.set(normalizedSlug, existing);
  });

  // Identify patterns that appear on multiple competitor sites
  const patterns: CommonPagePattern[] = [];

  slugGroups.forEach((pages, slug) => {
    // Count unique competitors with this slug
    const uniqueDomains = new Set(pages.map(p => p.domain));
    const competitorCount = uniqueDomains.size;

    // Only consider patterns that appear on at least 2 competitors (or 40% of competitors)
    const threshold = Math.max(2, Math.ceil(totalCompetitors * 0.4));

    if (competitorCount >= threshold) {
      // Determine most common page type for this slug
      const pageTypeCounts = new Map<string, number>();
      pages.forEach(page => {
        pageTypeCounts.set(page.pageType, (pageTypeCounts.get(page.pageType) || 0) + 1);
      });

      let mostCommonType = 'other';
      let maxCount = 0;
      pageTypeCounts.forEach((count, type) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonType = type;
        }
      });

      // Get example URLs (up to 3)
      const exampleUrls = Array.from(uniqueDomains)
        .slice(0, 3)
        .map(domain => pages.find(p => p.domain === domain)?.url)
        .filter((url): url is string => url !== undefined);

      patterns.push({
        pageType: mostCommonType,
        slug: slug,
        exampleUrls,
        competitorCount,
      });
    }
  });

  // Sort by competitor count (most common first)
  patterns.sort((a, b) => b.competitorCount - a.competitorCount);

  return patterns;
}

/**
 * Normalizes a slug for pattern matching.
 * Removes common variations and focuses on core content.
 *
 * @param slug - The slug to normalize
 * @returns Normalized slug for pattern matching
 */
function normalizeSlug(slug: string): string {
  let normalized = slug.toLowerCase();

  // Remove common prefixes/suffixes that don't affect meaning
  normalized = normalized.replace(/^(our|my|your|the)-/, '');
  normalized = normalized.replace(/-(page|us|now)$/, '');

  // Normalize common variations
  normalized = normalized.replace(/-(and|&)-/g, '-');
  normalized = normalized.replace(/services?/, 'service');
  normalized = normalized.replace(/products?/, 'product');
  normalized = normalized.replace(/blogs?/, 'blog');
  normalized = normalized.replace(/articles?/, 'article');
  normalized = normalized.replace(/solutions?/, 'solution');

  // Remove trailing numbers (often used for pagination or versions)
  normalized = normalized.replace(/-\d+$/, '');

  return normalized;
}

/**
 * Categorizes a page by its URL pattern.
 * This is a standalone function that can be used without full page analysis.
 *
 * @param url - The URL to categorize
 * @returns The detected page type
 */
export function categorizePageByUrl(url: string): CategorizedPage['pageType'] {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // Homepage
    if (pathname === '/' || pathname === '' || pathname === '/index.html' || pathname === '/home') {
      return 'homepage';
    }

    // Contact
    if (/\/(contact|get-in-touch|reach-us)($|\/|\?)/i.test(pathname)) {
      return 'contact';
    }

    // About
    if (/\/(about(?:-us|-team|-company|-studio)?|who-we-are|our-story|our-team)($|\/|\?)/i.test(pathname)) {
      return 'about';
    }

    // Blog/News
    if (/\/(blog|news|articles|insights|resources)($|\/|\?)/i.test(pathname) ||
        /\d{4}\/\d{2}\/\d{2}/i.test(pathname)) {
      return 'blog';
    }

    // Service
    if (/\/(service|services|what-we-do|solutions|products)($|\/|\?)/i.test(pathname)) {
      return 'service';
    }

    return 'other';
  } catch {
    return 'other';
  }
}

/**
 * Identifies content gaps by comparing target site pages against competitor patterns.
 * Returns pages that competitors have but the target site is missing.
 *
 * @param targetPages - Pages from the target site
 * @param competitorInventory - Inventory of competitor pages
 * @param minCompetitorCount - Minimum number of competitors that must have a page for it to be considered a gap (default: 2)
 * @returns Array of page patterns the target site is missing
 */
export function identifyContentGaps(
  targetPages: EnhancedPageAnalysis[],
  competitorInventory: CompetitorPageInventory,
  minCompetitorCount: number = 2
): CommonPagePattern[] {
  // Extract target site slugs
  const targetSlugs = new Set<string>();
  targetPages.forEach(page => {
    if (page.status === 'ok') {
      const slug = extractSlug(page.url);
      const normalized = normalizeSlug(slug);
      targetSlugs.add(normalized);
    }
  });

  // Find common competitor pages that target doesn't have
  const gaps = competitorInventory.commonPages.filter(pattern => {
    // Skip if not enough competitors have this page
    if (pattern.competitorCount < minCompetitorCount) return false;

    // Check if target has this slug
    const normalizedSlug = normalizeSlug(pattern.slug);
    return !targetSlugs.has(normalizedSlug);
  });

  return gaps;
}

/**
 * Generates prioritized recommendations for missing pages based on competitor analysis.
 *
 * @param contentGaps - Array of page patterns the target site is missing
 * @param competitorCount - Total number of competitors analyzed
 * @returns Array of prioritized recommendations
 */
export function generatePageRecommendations(
  contentGaps: CommonPagePattern[],
  competitorCount: number
): Array<{ slug: string; priority: number; reason: string }> {
  return contentGaps.map(gap => {
    // Calculate priority (1-10 scale)
    // Higher priority for pages that more competitors have
    const competitorRatio = gap.competitorCount / competitorCount;
    let priority = Math.round(competitorRatio * 10);

    // Boost priority for certain page types
    if (gap.pageType === 'service') {
      priority = Math.min(10, priority + 2); // Services are high priority
    } else if (gap.pageType === 'blog') {
      priority = Math.min(10, priority + 1); // Blog content is valuable
    }

    // Generate reason
    const reason = `${gap.competitorCount} of ${competitorCount} competitors have this page. Page type: ${gap.pageType}. Consider creating to match competitor coverage.`;

    return {
      slug: gap.slug,
      priority: Math.max(1, Math.min(10, priority)), // Clamp to 1-10
      reason,
    };
  }).sort((a, b) => b.priority - a.priority); // Sort by priority descending
}

/**
 * Analyzes URL structure patterns across competitors to identify best practices.
 *
 * @param inventory - The competitor page inventory
 * @returns Insights about URL structure patterns
 */
export function analyzeUrlStructures(inventory: CompetitorPageInventory): {
  averageDepth: number;
  commonPrefixes: string[];
  structurePatterns: string[];
} {
  const depths: number[] = [];
  const prefixes = new Map<string, number>();

  inventory.allPages.forEach(page => {
    // Calculate URL depth (number of slashes)
    const depth = (page.slug.match(/\//g) || []).length;
    depths.push(depth);

    // Extract first segment as prefix
    const firstSegment = page.slug.split('/')[0];
    if (firstSegment && firstSegment !== 'home') {
      prefixes.set(firstSegment, (prefixes.get(firstSegment) || 0) + 1);
    }
  });

  // Calculate average depth
  const averageDepth = depths.length > 0
    ? depths.reduce((sum, d) => sum + d, 0) / depths.length
    : 0;

  // Get most common prefixes
  const commonPrefixes = Array.from(prefixes.entries())
    .filter(([_, count]) => count >= 2) // Appears at least twice
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([prefix]) => prefix);

  // Identify structure patterns
  const structurePatterns: string[] = [];

  if (averageDepth < 1.5) {
    structurePatterns.push('Flat structure: Most pages are at the root level');
  } else if (averageDepth > 2.5) {
    structurePatterns.push('Deep structure: Many pages are nested in subdirectories');
  } else {
    structurePatterns.push('Balanced structure: Mix of root-level and nested pages');
  }

  if (commonPrefixes.includes('service') || commonPrefixes.includes('services')) {
    structurePatterns.push('Services grouped under /services/ prefix');
  }

  if (commonPrefixes.includes('blog') || commonPrefixes.includes('news')) {
    structurePatterns.push('Content grouped under /blog/ or /news/ prefix');
  }

  return {
    averageDepth: Math.round(averageDepth * 10) / 10,
    commonPrefixes,
    structurePatterns,
  };
}
