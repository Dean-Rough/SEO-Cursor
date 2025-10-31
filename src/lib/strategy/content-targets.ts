import type {
  PageKeywordMapping,
  ContentTarget,
  ContentDepthMetrics,
} from "./types";

/**
 * Calculates recommended content specifications for each page
 *
 * Strategy:
 * 1. Use competitor averages as baseline
 * 2. Add 10% to exceed competition
 * 3. Adjust based on page type and intent
 * 4. Consider keyword difficulty (higher difficulty = more content needed)
 *
 * @param pages - Page keyword mappings
 * @param competitorMetrics - Benchmarks from competitor analysis
 * @returns Array of content targets for each page
 */
export function calculateContentTargets(
  pages: PageKeywordMapping[],
  competitorMetrics: ContentDepthMetrics
): ContentTarget[] {
  return pages.map((page) => {
    // Base targets from competitor benchmarks
    let wordCount = competitorMetrics.averageWordCount;
    let sectionCount = competitorMetrics.averageSectionCount;
    let imageCount = competitorMetrics.averageImageCount;
    let includeFAQ = competitorMetrics.faqPresence > 0.5; // If >50% of competitors have FAQ

    // Adjust based on page type
    const typeAdjustments = getPageTypeAdjustments(page.pageType);
    wordCount *= typeAdjustments.wordCountMultiplier;
    sectionCount = Math.round(sectionCount * typeAdjustments.sectionMultiplier);
    imageCount = Math.round(imageCount * typeAdjustments.imageMultiplier);
    includeFAQ = includeFAQ && typeAdjustments.includeFAQ;

    // Adjust based on keyword difficulty
    const avgDifficulty = page.cluster.averageDifficulty;
    if (avgDifficulty > 50) {
      // High difficulty - need more content
      wordCount *= 1.2;
      sectionCount += 1;
    } else if (avgDifficulty < 30) {
      // Low difficulty - can be more concise
      wordCount *= 0.9;
    }

    // Add 10% to exceed competition
    wordCount = Math.round(wordCount * 1.1);
    imageCount = Math.round(imageCount * 1.1);

    // Ensure minimums
    wordCount = Math.max(300, wordCount);
    sectionCount = Math.max(3, sectionCount);
    imageCount = Math.max(1, imageCount);

    return {
      url: page.url,
      wordCount,
      sectionCount,
      imageCount,
      includeFAQ,
      competitorBenchmark: {
        averageWordCount: competitorMetrics.averageWordCount,
        averageImageCount: competitorMetrics.averageImageCount,
      },
    };
  });
}

/**
 * Gets adjustment multipliers for different page types
 */
interface PageTypeAdjustments {
  wordCountMultiplier: number;
  sectionMultiplier: number;
  imageMultiplier: number;
  includeFAQ: boolean;
}

function getPageTypeAdjustments(
  pageType: PageKeywordMapping["pageType"]
): PageTypeAdjustments {
  const adjustments: Record<string, PageTypeAdjustments> = {
    homepage: {
      wordCountMultiplier: 0.8, // Homepage should be concise
      sectionMultiplier: 1.0,
      imageMultiplier: 1.5, // More visual
      includeFAQ: false, // FAQ typically not on homepage
    },
    service: {
      wordCountMultiplier: 1.2, // Service pages need detail
      sectionMultiplier: 1.2,
      imageMultiplier: 1.3,
      includeFAQ: true, // FAQ very valuable for services
    },
    blog: {
      wordCountMultiplier: 1.5, // Blog posts should be comprehensive
      sectionMultiplier: 1.3,
      imageMultiplier: 1.0,
      includeFAQ: true,
    },
    about: {
      wordCountMultiplier: 1.0,
      sectionMultiplier: 1.0,
      imageMultiplier: 1.2, // Team photos, etc.
      includeFAQ: false,
    },
    contact: {
      wordCountMultiplier: 0.5, // Contact pages are simple
      sectionMultiplier: 0.7,
      imageMultiplier: 0.8,
      includeFAQ: true, // Quick questions
    },
    other: {
      wordCountMultiplier: 1.0,
      sectionMultiplier: 1.0,
      imageMultiplier: 1.0,
      includeFAQ: false,
    },
  };

  return (
    adjustments[pageType] || adjustments.other
  );
}

/**
 * Calculates content targets using industry-specific benchmarks
 * (when competitor data is unavailable or incomplete)
 */
export function calculateContentTargetsFromIndustryBenchmarks(
  pages: PageKeywordMapping[],
  industry: string = "general"
): ContentTarget[] {
  const benchmarks = getIndustryBenchmarks(industry);

  return pages.map((page) => {
    const baseBenchmark = benchmarks[page.pageType] || benchmarks.other;

    // Adjust for keyword difficulty
    const avgDifficulty = page.cluster.averageDifficulty;
    let wordCount = baseBenchmark.wordCount;

    if (avgDifficulty > 50) {
      wordCount = Math.round(wordCount * 1.3);
    }

    return {
      url: page.url,
      wordCount,
      sectionCount: baseBenchmark.sectionCount,
      imageCount: baseBenchmark.imageCount,
      includeFAQ: baseBenchmark.includeFAQ,
      competitorBenchmark: {
        averageWordCount: baseBenchmark.wordCount,
        averageImageCount: baseBenchmark.imageCount,
      },
    };
  });
}

/**
 * Industry-specific content benchmarks
 */
interface Benchmark {
  wordCount: number;
  sectionCount: number;
  imageCount: number;
  includeFAQ: boolean;
}

function getIndustryBenchmarks(
  industry: string
): Record<string, Benchmark> {
  // Default benchmarks (applicable to most industries)
  const defaultBenchmarks: Record<string, Benchmark> = {
    homepage: {
      wordCount: 600,
      sectionCount: 5,
      imageCount: 4,
      includeFAQ: false,
    },
    service: {
      wordCount: 1200,
      sectionCount: 6,
      imageCount: 5,
      includeFAQ: true,
    },
    blog: {
      wordCount: 1800,
      sectionCount: 8,
      imageCount: 4,
      includeFAQ: true,
    },
    about: {
      wordCount: 800,
      sectionCount: 4,
      imageCount: 3,
      includeFAQ: false,
    },
    contact: {
      wordCount: 300,
      sectionCount: 3,
      imageCount: 1,
      includeFAQ: true,
    },
    other: {
      wordCount: 900,
      sectionCount: 5,
      imageCount: 3,
      includeFAQ: false,
    },
  };

  // Industry-specific adjustments
  const industryAdjustments: Record<
    string,
    Record<string, Partial<Benchmark>>
  > = {
    legal: {
      service: { wordCount: 2000, sectionCount: 8 }, // Legal needs more detail
      blog: { wordCount: 2500, sectionCount: 10 },
    },
    medical: {
      service: { wordCount: 1800, sectionCount: 7 },
      blog: { wordCount: 2200, sectionCount: 9 },
    },
    ecommerce: {
      homepage: { wordCount: 400, imageCount: 6 }, // More visual, less text
      service: { wordCount: 800, imageCount: 8 },
    },
  };

  const adjustments = industryAdjustments[industry.toLowerCase()];

  if (!adjustments) return defaultBenchmarks;

  // Merge adjustments with defaults
  const result = { ...defaultBenchmarks };
  Object.keys(adjustments).forEach((pageType) => {
    result[pageType] = {
      ...defaultBenchmarks[pageType],
      ...adjustments[pageType],
    };
  });

  return result;
}

/**
 * Validates content targets and suggests adjustments if unrealistic
 */
export function validateContentTargets(
  targets: ContentTarget[]
): Array<{ url: string; issue: string; suggestion: string }> {
  const issues: Array<{ url: string; issue: string; suggestion: string }> = [];

  targets.forEach((target) => {
    // Check for unrealistic word counts
    if (target.wordCount > 4000) {
      issues.push({
        url: target.url,
        issue: "Word count target is very high (>4000 words)",
        suggestion:
          "Consider splitting into multiple pages or reducing scope",
      });
    }

    // Check for insufficient content
    if (target.wordCount < 300) {
      issues.push({
        url: target.url,
        issue: "Word count target is too low (<300 words)",
        suggestion:
          "Increase content depth to at least 300 words for SEO value",
      });
    }

    // Check section-to-word ratio
    const wordsPerSection = target.wordCount / target.sectionCount;
    if (wordsPerSection < 100) {
      issues.push({
        url: target.url,
        issue: "Too many sections for word count (sections too short)",
        suggestion: `Reduce sections to ${Math.round(target.wordCount / 150)} or increase word count`,
      });
    }

    if (wordsPerSection > 500) {
      issues.push({
        url: target.url,
        issue: "Sections will be too long (>500 words each)",
        suggestion: `Increase sections to ${Math.round(target.wordCount / 300)} for better readability`,
      });
    }

    // Check image density
    const wordsPerImage = target.wordCount / target.imageCount;
    if (wordsPerImage > 800) {
      issues.push({
        url: target.url,
        issue: "Not enough images for content length",
        suggestion: `Add at least ${Math.round(target.wordCount / 600)} images to break up text`,
      });
    }
  });

  return issues;
}

/**
 * Generates content outline based on targets
 */
export function generateContentOutline(target: ContentTarget): {
  sections: Array<{
    heading: string;
    wordCount: number;
    includeImage: boolean;
  }>;
  faq?: {
    questionCount: number;
  };
} {
  const wordsPerSection = Math.round(target.wordCount / target.sectionCount);

  // Determine how many sections should have images
  const sectionsWithImages = Math.min(target.imageCount, target.sectionCount);

  // Standard section structure
  const sections = [];

  // Introduction (always first)
  sections.push({
    heading: "Introduction",
    wordCount: Math.round(wordsPerSection * 0.8), // Intro is typically shorter
    includeImage: true, // Hero image
  });

  // Main sections
  const mainSectionCount = target.sectionCount - 1; // Minus intro
  for (let i = 0; i < mainSectionCount; i++) {
    sections.push({
      heading: `Section ${i + 1}`, // Will be replaced with actual headings
      wordCount: wordsPerSection,
      includeImage: i < sectionsWithImages - 1, // Distribute images
    });
  }

  const outline: {
    sections: Array<{
      heading: string;
      wordCount: number;
      includeImage: boolean;
    }>;
    faq?: { questionCount: number };
  } = { sections };

  if (target.includeFAQ) {
    outline.faq = {
      questionCount: Math.min(8, Math.max(5, Math.round(target.sectionCount / 2))),
    };
  }

  return outline;
}

/**
 * Estimates time to create content based on targets
 */
export function estimateContentCreationTime(
  targets: ContentTarget[]
): {
  totalHours: number;
  breakdown: Array<{
    url: string;
    hours: number;
  }>;
} {
  // Estimation: 200 words per hour of writing, plus time for images and structure
  const breakdown = targets.map((target) => {
    const writingHours = target.wordCount / 200;
    const imageHours = target.imageCount * 0.25; // 15 min per image to source/optimize
    const structureHours = target.sectionCount * 0.1; // 6 min per section to structure
    const faqHours = target.includeFAQ ? 0.5 : 0;

    const totalHours = Math.round(
      (writingHours + imageHours + structureHours + faqHours) * 10
    ) / 10;

    return {
      url: target.url,
      hours: totalHours,
    };
  });

  const totalHours = breakdown.reduce((sum, item) => sum + item.hours, 0);

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    breakdown,
  };
}
