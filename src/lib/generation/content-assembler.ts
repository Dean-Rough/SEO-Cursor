/**
 * Phase 4: Content Assembler
 *
 * Combines generated sections, FAQs, and metadata into final page content.
 * Outputs in multiple formats (HTML, Markdown, plain text) with quality scoring.
 */

import { fleschReadingEase } from "../text";
import type {
  GeneratedPageContent,
  GeneratedSection,
  GeneratedFAQ,
  GeneratedMetadata,
  PageBlueprint,
  ContentQualityReport,
} from "./types";
import { generateFAQSchema, formatFAQsAsHTML, formatFAQsAsMarkdown } from "./faq-generator";

/**
 * Assemble complete page content from generated components
 */
export function assemblePageContent(
  sections: GeneratedSection[],
  faqs: GeneratedFAQ[],
  metadata: GeneratedMetadata,
  blueprint: PageBlueprint,
  options: {
    includeImagePlaceholders?: boolean;
    schemaMarkup?: string[];
  } = {}
): GeneratedPageContent {
  // Generate content in different formats
  const htmlContent = formatAsHTML(sections, faqs, blueprint, options);
  const markdownContent = formatAsMarkdown(sections, faqs, blueprint);
  const plainTextContent = formatAsPlainText(sections, faqs);

  // Calculate total word count
  const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0) +
    faqs.reduce((sum, f) => sum + f.wordCount, 0);

  // Prepare schema markup
  const schemaMarkup = options.schemaMarkup || [];
  if (faqs.length > 0) {
    schemaMarkup.push(generateFAQSchema(faqs));
  }

  // Generate quality report
  const qualityReport = generateQualityReport(
    sections,
    faqs,
    metadata,
    blueprint,
    htmlContent,
    totalWordCount
  );

  // Calculate overall quality score
  const qualityScore = calculateQualityScore(sections, metadata, qualityReport);

  return {
    url: blueprint.url || `/${blueprint.slug}`,
    slug: blueprint.slug,
    metadata,
    schema: schemaMarkup,
    content: {
      html: htmlContent,
      markdown: markdownContent,
      plainText: plainTextContent,
    },
    sections,
    faqs,
    totalWordCount,
    qualityScore,
    qualityReport,
  };
}

/**
 * Format content as HTML
 */
export function formatAsHTML(
  sections: GeneratedSection[],
  faqs: GeneratedFAQ[],
  blueprint: PageBlueprint,
  options: {
    includeImagePlaceholders?: boolean;
  } = {}
): string {
  let html = '<article class="page-content">\n';

  // Add sections
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionClass = getSectionClass(blueprint.sections[i]?.contentType || "content");

    html += `  <section class="${sectionClass}">\n`;
    html += `    <h2>${escapeHTML(section.heading)}</h2>\n`;
    html += `    ${indentHTML(section.content, 4)}\n`;

    // Add image placeholder if requested
    if (options.includeImagePlaceholders && i % 2 === 0) {
      const altText = `${section.heading} - ${blueprint.metadata.title}`;
      html += `    <div class="image-placeholder">\n`;
      html += `      <img src="/images/${blueprint.slug}-${i + 1}.jpg" alt="${escapeHTML(altText)}" loading="lazy" />\n`;
      html += `    </div>\n`;
    }

    html += "  </section>\n\n";
  }

  // Add FAQs if present
  if (faqs.length > 0) {
    html += '  <section class="faq-section">\n';
    html += "    <h2>Frequently Asked Questions</h2>\n";
    html += indentHTML(formatFAQsAsHTML(faqs), 4);
    html += "  </section>\n\n";
  }

  html += "</article>\n";

  return html;
}

/**
 * Format content as Markdown
 */
export function formatAsMarkdown(
  sections: GeneratedSection[],
  faqs: GeneratedFAQ[],
  blueprint: PageBlueprint
): string {
  let markdown = `# ${blueprint.metadata.title}\n\n`;
  markdown += `${blueprint.metadata.description}\n\n`;
  markdown += "---\n\n";

  // Add sections
  for (const section of sections) {
    markdown += `## ${section.heading}\n\n`;
    markdown += `${htmlToMarkdown(section.content)}\n\n`;
  }

  // Add FAQs
  if (faqs.length > 0) {
    markdown += formatFAQsAsMarkdown(faqs);
  }

  return markdown;
}

/**
 * Format content as plain text
 */
export function formatAsPlainText(
  sections: GeneratedSection[],
  faqs: GeneratedFAQ[]
): string {
  let text = "";

  // Add sections
  for (const section of sections) {
    text += `${section.heading.toUpperCase()}\n\n`;
    text += `${stripHTML(section.content)}\n\n`;
    text += "---\n\n";
  }

  // Add FAQs
  if (faqs.length > 0) {
    text += "FREQUENTLY ASKED QUESTIONS\n\n";
    for (const faq of faqs) {
      text += `Q: ${faq.question}\n`;
      text += `A: ${stripHTML(faq.answer)}\n\n`;
    }
  }

  return text;
}

/**
 * Generate comprehensive quality report
 */
function generateQualityReport(
  sections: GeneratedSection[],
  faqs: GeneratedFAQ[],
  metadata: GeneratedMetadata,
  blueprint: PageBlueprint,
  htmlContent: string,
  totalWordCount: number
): ContentQualityReport {
  // Calculate target word count (sum of all section targets)
  const targetWordCount = blueprint.sections.reduce((sum, s) => sum + s.targetWordCount, 0);

  // Word count comparison
  const percentage = targetWordCount > 0 ? (totalWordCount / targetWordCount) * 100 : 100;
  const wordCountVsTarget = `${totalWordCount.toLocaleString()} / ${targetWordCount.toLocaleString()} (${Math.round(percentage)}%)`;

  // Aggregate keyword density
  const keywordDensity: { [keyword: string]: string } = {};
  const allKeywords = blueprint.primaryKeywords.map((k) => k.keyword);

  for (const keyword of allKeywords) {
    const densities = sections
      .map((s) => s.qualityMetrics.keywordDensity[keyword] || 0)
      .filter((d) => d > 0);

    if (densities.length > 0) {
      const avgDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length;
      keywordDensity[keyword] = `${avgDensity.toFixed(1)}%`;
    }
  }

  // Calculate average readability
  const readabilityScores = sections
    .map((s) => s.qualityMetrics.readabilityScore)
    .filter((s): s is number => s !== undefined);

  let readabilityGrade: string | undefined;
  if (readabilityScores.length > 0) {
    const avgReadability =
      readabilityScores.reduce((sum, s) => sum + s, 0) / readabilityScores.length;
    readabilityGrade = getReadabilityGrade(avgReadability);
  }

  // Count CTAs
  const ctaCount = countCTAs(htmlContent);

  // Count internal links
  const internalLinkCount = countInternalLinks(htmlContent);

  // Count image placeholders
  const imageCount = (htmlContent.match(/<img/g) || []).length;

  // Schema markup count
  const schemaMarkupCount = faqs.length > 0 ? 1 : 0;

  // Identify issues
  const issues: string[] = [];
  const strengths: string[] = [];

  // Word count issues
  if (percentage < 90) {
    issues.push(`Content is ${Math.round(100 - percentage)}% below target word count`);
  } else if (percentage > 110) {
    issues.push(`Content is ${Math.round(percentage - 100)}% above target word count`);
  } else {
    strengths.push("Word count meets target");
  }

  // Keyword density issues
  const densityValues = Object.values(keywordDensity).map((d) =>
    parseFloat(d.replace("%", ""))
  );
  if (densityValues.some((d) => d > 3.5)) {
    issues.push("Keyword density too high in some sections (risk of over-optimization)");
  } else if (densityValues.some((d) => d >= 1.5 && d <= 2.5)) {
    strengths.push("Optimal keyword density achieved");
  }

  // Readability issues
  if (readabilityScores.length > 0) {
    const avgReadability =
      readabilityScores.reduce((sum, s) => sum + s, 0) / readabilityScores.length;
    if (avgReadability < 40) {
      issues.push("Content may be too complex (low readability score)");
    } else if (avgReadability >= 50 && avgReadability <= 70) {
      strengths.push("Good readability level for target audience");
    }
  }

  // CTA validation
  if (ctaCount === 0) {
    issues.push("No calls-to-action detected");
  } else if (ctaCount >= 2) {
    strengths.push(`${ctaCount} CTAs included for conversion optimization`);
  }

  // Internal links validation
  if (internalLinkCount === 0) {
    issues.push("No internal links included");
  } else {
    strengths.push(`${internalLinkCount} internal links for site architecture`);
  }

  // Section quality
  const lowQualitySections = sections.filter(
    (s) => !s.qualityMetrics.meetsWordCountTarget || !s.qualityMetrics.includesRequiredKeywords
  );
  if (lowQualitySections.length > 0) {
    issues.push(`${lowQualitySections.length} sections need quality improvements`);
  } else {
    strengths.push("All sections meet quality standards");
  }

  // FAQ optimization
  if (faqs.length > 0) {
    const optimizedFAQs = faqs.filter((f) => f.optimizedForSnippet);
    if (optimizedFAQs.length === faqs.length) {
      strengths.push(`${faqs.length} FAQs optimized for featured snippets`);
    } else {
      issues.push(`${faqs.length - optimizedFAQs.length} FAQs not optimized for snippets`);
    }
  }

  // Metadata validation
  if (metadata.keywordsIncluded.length === 0) {
    issues.push("Target keywords missing from metadata");
  }
  if (!metadata.hasCTA) {
    issues.push("Meta description missing call-to-action");
  }
  if (metadata.uniquenessScore < 70) {
    issues.push("Metadata may be too similar to existing pages");
  }

  return {
    wordCountVsTarget,
    keywordDensity,
    readabilityGrade,
    ctaCount,
    internalLinkCount,
    imageCount,
    schemaMarkupCount,
    issues,
    strengths,
  };
}

/**
 * Calculate overall quality score (0-100)
 */
export function calculateQualityScore(
  sections: GeneratedSection[],
  metadata: GeneratedMetadata,
  qualityReport: ContentQualityReport
): number {
  let score = 100;

  // Section quality (40 points)
  const sectionScores = sections.map((s) => {
    let sectionScore = 100;
    if (!s.qualityMetrics.meetsWordCountTarget) sectionScore -= 20;
    if (!s.qualityMetrics.includesRequiredKeywords) sectionScore -= 30;
    if (s.qualityMetrics.hasFluff) sectionScore -= 15;
    return Math.max(0, sectionScore);
  });

  const avgSectionScore = sectionScores.reduce((sum, s) => sum + s, 0) / sectionScores.length;
  score -= (100 - avgSectionScore) * 0.4;

  // Metadata quality (20 points)
  let metadataScore = 100;
  if (metadata.titleLength < 50 || metadata.titleLength > 60) metadataScore -= 25;
  if (metadata.descriptionLength < 150 || metadata.descriptionLength > 160)
    metadataScore -= 25;
  if (metadata.keywordsIncluded.length === 0) metadataScore -= 30;
  if (!metadata.hasCTA) metadataScore -= 20;

  score -= (100 - Math.max(0, metadataScore)) * 0.2;

  // Content structure (20 points)
  let structureScore = 100;
  if (qualityReport.ctaCount === 0) structureScore -= 30;
  if (qualityReport.internalLinkCount === 0) structureScore -= 30;
  if (qualityReport.schemaMarkupCount === 0) structureScore -= 20;

  score -= (100 - Math.max(0, structureScore)) * 0.2;

  // Critical issues (20 points deduction)
  const criticalIssueCount = qualityReport.issues.length;
  score -= Math.min(20, criticalIssueCount * 5);

  return Math.max(0, Math.round(score));
}

/**
 * Get readability grade from Flesch score
 */
function getReadabilityGrade(score: number): string {
  if (score >= 90) return "Very Easy (5th grade)";
  if (score >= 80) return "Easy (6th grade)";
  if (score >= 70) return "Fairly Easy (7th grade)";
  if (score >= 60) return "Standard (8th-9th grade)";
  if (score >= 50) return "Fairly Difficult (10th-12th grade)";
  if (score >= 30) return "Difficult (College)";
  return "Very Difficult (College graduate)";
}

/**
 * Count CTAs in content
 */
function countCTAs(html: string): number {
  const ctaPatterns = [
    /contact us/gi,
    /call us/gi,
    /get started/gi,
    /book now/gi,
    /schedule/gi,
    /request a quote/gi,
    /learn more/gi,
    /get in touch/gi,
  ];

  let count = 0;
  for (const pattern of ctaPatterns) {
    const matches = html.match(pattern);
    if (matches) count += matches.length;
  }

  return count;
}

/**
 * Count internal links
 */
function countInternalLinks(html: string): number {
  // Match internal links (relative URLs)
  const linkPattern = /<a\s+[^>]*href=["'](?!http|\/\/|#|mailto:)([^"']+)["'][^>]*>/gi;
  const matches = html.match(linkPattern);
  return matches ? matches.length : 0;
}

/**
 * Get CSS class for section type
 */
function getSectionClass(contentType: string): string {
  const classMap: { [key: string]: string } = {
    hero: "hero-section",
    features: "features-section",
    benefits: "benefits-section",
    about: "about-section",
    process: "process-section",
    testimonials: "testimonials-section",
    cta: "cta-section",
    content: "content-section",
  };

  return classMap[contentType] || "content-section";
}

/**
 * Indent HTML lines
 */
function indentHTML(html: string, spaces: number): string {
  const indent = " ".repeat(spaces);
  return html
    .split("\n")
    .map((line) => (line.trim() ? `${indent}${line}` : line))
    .join("\n");
}

/**
 * Convert HTML to Markdown (simplified)
 */
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Convert headings
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n");

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>/gi, "\n");
  markdown = markdown.replace(/<\/ul>/gi, "\n");
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");

  // Convert ordered lists
  markdown = markdown.replace(/<ol[^>]*>/gi, "\n");
  markdown = markdown.replace(/<\/ol>/gi, "\n");
  let olCounter = 1;
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${olCounter++}. $1\n`);

  // Convert emphasis
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_");

  // Convert links
  markdown = markdown.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Strip remaining HTML
  markdown = stripHTML(markdown);

  return markdown.trim();
}

/**
 * Strip HTML tags
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Export page content to file formats
 */
export function exportPageContent(
  content: GeneratedPageContent,
  format: "html" | "markdown" | "json"
): string {
  switch (format) {
    case "html":
      return generateFullHTML(content);
    case "markdown":
      return content.content.markdown;
    case "json":
      return JSON.stringify(content, null, 2);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Generate full HTML document
 */
function generateFullHTML(content: GeneratedPageContent): string {
  let html = "<!DOCTYPE html>\n";
  html += '<html lang="en">\n';
  html += "<head>\n";
  html += '  <meta charset="UTF-8">\n';
  html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  html += `  <title>${escapeHTML(content.metadata.title)}</title>\n`;
  html += `  <meta name="description" content="${escapeHTML(content.metadata.description)}">\n`;

  // Add schema markup
  for (const schema of content.schema) {
    html += '  <script type="application/ld+json">\n';
    html += indentHTML(schema, 4);
    html += "\n  </script>\n";
  }

  html += "</head>\n";
  html += "<body>\n";
  html += indentHTML(content.content.html, 2);
  html += "\n</body>\n";
  html += "</html>\n";

  return html;
}
