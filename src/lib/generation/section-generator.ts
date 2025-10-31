/**
 * Phase 4: Section Generator
 *
 * Generates high-quality content sections using OpenAI with quality validation.
 * Ensures natural keyword integration, proper structure, and conversion focus.
 */

import { env, hasOpenAICredentials } from "../env";
import { tokenise, getWordFrequency, fleschReadingEase } from "../text";
import type {
  ContentPrompt,
  GeneratedSection,
  ValidationResult,
  FILLER_PHRASES,
  QUALITY_THRESHOLDS,
} from "./types";
import { buildAIPromptString } from "./prompt-builder";

const MODEL = "gpt-4o";
const MAX_RETRIES = 2;

/**
 * Generate high-quality content for a single section
 */
export async function generateSectionContent(
  prompt: ContentPrompt,
  businessContext: {
    businessName: string;
    businessType: string;
    location?: string;
  },
  apiKey: string
): Promise<GeneratedSection> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required for content generation");
  }

  let lastError: Error | null = null;
  let attempts = 0;

  // Try generating content with retries for quality
  while (attempts < MAX_RETRIES) {
    attempts++;

    try {
      const content = await callOpenAI(prompt, businessContext, apiKey);

      // Validate quality
      const validation = validateSectionQuality(content, prompt);

      // If valid or last attempt, return
      if (validation.isValid || attempts === MAX_RETRIES) {
        return content;
      }

      // Otherwise retry with stricter prompt
      console.log(
        `[section-generator] Quality issues detected (score: ${validation.score}), retrying (${attempts}/${MAX_RETRIES})`
      );
      lastError = new Error(`Quality validation failed: ${validation.issues.join(", ")}`);
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[section-generator] Generation attempt ${attempts} failed:`,
        error
      );
    }
  }

  throw new Error(
    `Failed to generate quality content after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

/**
 * Call OpenAI API to generate section content
 */
async function callOpenAI(
  prompt: ContentPrompt,
  businessContext: {
    businessName: string;
    businessType: string;
    location?: string;
  },
  apiKey: string
): Promise<GeneratedSection> {
  const promptString = buildAIPromptString(prompt, businessContext);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an elite SEO copywriter producing production-ready website content. Write naturally, avoid keyword stuffing, and focus on conversion. Never invent facts.",
        },
        {
          role: "user",
          content: promptString,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  // Clean and process content
  const cleanedContent = cleanHTML(content);

  // Calculate metrics
  const wordCount = countWords(cleanedContent);
  const keywordDensity = calculateKeywordDensity(
    cleanedContent,
    [...prompt.keywords.primary, ...prompt.keywords.secondary]
  );

  // Quality metrics
  const qualityMetrics = {
    meetsWordCountTarget: isWordCountAcceptable(wordCount, prompt.targetWordCount),
    includesRequiredKeywords: checkRequiredKeywords(
      cleanedContent,
      prompt.keywords.primary
    ),
    readabilityScore: calculateReadability(cleanedContent),
    hasFluff: detectFiller(cleanedContent),
    keywordDensity,
    tone: "matches" as const,
  };

  return {
    heading: prompt.sectionHeading,
    content: cleanedContent,
    wordCount,
    qualityMetrics,
  };
}

/**
 * Clean and normalize HTML content
 */
function cleanHTML(html: string): string {
  // Remove markdown code blocks if present
  let cleaned = html.replace(/```html\n?/g, "").replace(/```\n?/g, "");

  // Ensure proper HTML structure
  cleaned = cleaned.trim();

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");

  // Ensure paragraphs are wrapped
  if (!cleaned.startsWith("<")) {
    const paragraphs = cleaned.split("\n\n");
    cleaned = paragraphs.map((p) => (p.trim() ? `<p>${p.trim()}</p>` : "")).join("\n");
  }

  return cleaned;
}

/**
 * Count words in HTML content
 */
function countWords(html: string): number {
  // Strip HTML tags
  const text = html.replace(/<[^>]+>/g, " ");
  // Count words
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Calculate keyword density for each keyword
 */
function calculateKeywordDensity(
  content: string,
  keywords: string[]
): { [keyword: string]: number } {
  const text = content.replace(/<[^>]+>/g, " ").toLowerCase();
  const totalWords = countWords(content);

  const densities: { [keyword: string]: number } = {};

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    // Count exact phrase occurrences
    const regex = new RegExp(`\\b${keywordLower}\\b`, "gi");
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;

    // Calculate density as percentage
    const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
    densities[keyword] = Math.round(density * 100) / 100;
  }

  return densities;
}

/**
 * Calculate readability score
 */
function calculateReadability(html: string): number | undefined {
  const text = html.replace(/<[^>]+>/g, " ");
  const score = fleschReadingEase(text);
  return score !== null ? score : undefined;
}

/**
 * Detect filler phrases
 */
function detectFiller(content: string): boolean {
  const text = content.toLowerCase();

  const fillerPhrases = [
    "in today's world",
    "it goes without saying",
    "needless to say",
    "at the end of the day",
    "when all is said and done",
    "in this day and age",
    "each and every",
    "first and foremost",
    "last but not least",
    "the fact of the matter is",
    "for all intents and purposes",
    "all things considered",
  ];

  return fillerPhrases.some((phrase) => text.includes(phrase));
}

/**
 * Check if word count is acceptable (±10%)
 */
function isWordCountAcceptable(actual: number, target: number): boolean {
  const tolerance = 0.1; // 10%
  const min = target * (1 - tolerance);
  const max = target * (1 + tolerance);
  return actual >= min && actual <= max;
}

/**
 * Check if all required keywords are present
 */
function checkRequiredKeywords(content: string, primaryKeywords: string[]): boolean {
  const text = content.toLowerCase();

  // At least one primary keyword must be present
  return primaryKeywords.some((keyword) => {
    const keywordLower = keyword.toLowerCase();
    return text.includes(keywordLower);
  });
}

/**
 * Validate section quality
 */
export function validateSectionQuality(
  section: GeneratedSection,
  target: ContentPrompt
): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Word count validation
  if (!section.qualityMetrics.meetsWordCountTarget) {
    const diff = Math.abs(section.wordCount - target.targetWordCount);
    const percentOff = (diff / target.targetWordCount) * 100;

    if (percentOff > 20) {
      issues.push(
        `Word count ${section.wordCount} is ${Math.round(percentOff)}% off target ${target.targetWordCount}`
      );
      score -= 20;
    } else {
      warnings.push(
        `Word count ${section.wordCount} is slightly off target ${target.targetWordCount}`
      );
      score -= 5;
    }
  }

  // Keyword validation
  if (!section.qualityMetrics.includesRequiredKeywords) {
    issues.push("Missing required primary keywords");
    score -= 25;
  }

  // Check keyword density
  const densities = Object.values(section.qualityMetrics.keywordDensity);
  const maxDensity = Math.max(...densities, 0);
  const minDensity = Math.min(...densities.filter((d) => d > 0), Infinity);

  if (maxDensity > 3.5) {
    issues.push(`Keyword density too high (${maxDensity.toFixed(1)}%) - may be over-optimized`);
    score -= 15;
  } else if (maxDensity > 3.0) {
    warnings.push(`Keyword density slightly high (${maxDensity.toFixed(1)}%)`);
    score -= 5;
  }

  if (minDensity === Infinity || minDensity === 0) {
    warnings.push("Some keywords not included");
    score -= 5;
  }

  // Readability validation
  if (
    section.qualityMetrics.readabilityScore !== undefined &&
    section.qualityMetrics.readabilityScore < 40
  ) {
    warnings.push(
      `Low readability score (${section.qualityMetrics.readabilityScore}) - content may be too complex`
    );
    score -= 10;
  }

  // Filler detection
  if (section.qualityMetrics.hasFluff) {
    warnings.push("Generic filler phrases detected");
    score -= 10;
  }

  // Content structure validation
  if (section.content.length < 100) {
    issues.push("Content too short");
    score -= 20;
  }

  // Check for proper HTML structure
  if (!section.content.includes("<p>") && !section.content.includes("<ul>")) {
    warnings.push("Content may lack proper HTML structure");
    score -= 5;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    isValid: issues.length === 0 && score >= 70,
    issues,
    warnings,
    score,
  };
}

/**
 * Batch generate multiple sections with rate limiting
 */
export async function generateMultipleSections(
  prompts: Array<{
    prompt: ContentPrompt;
    businessContext: {
      businessName: string;
      businessType: string;
      location?: string;
    };
  }>,
  apiKey: string,
  delayMs: number = 1000
): Promise<GeneratedSection[]> {
  const sections: GeneratedSection[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const { prompt, businessContext } = prompts[i];

    console.log(
      `[section-generator] Generating section ${i + 1}/${prompts.length}: "${prompt.sectionHeading}"`
    );

    try {
      const section = await generateSectionContent(prompt, businessContext, apiKey);
      sections.push(section);

      // Rate limiting delay (except for last iteration)
      if (i < prompts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(
        `[section-generator] Failed to generate section "${prompt.sectionHeading}":`,
        error
      );
      // Continue with other sections
    }
  }

  return sections;
}
