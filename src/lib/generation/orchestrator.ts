/**
 * Phase 4: Content Generation Orchestrator
 *
 * Main orchestration function that coordinates all content generation modules
 * to produce complete, elite-quality page content from blueprints.
 */

import { env, hasOpenAICredentials } from "../env";
import type {
  PageBlueprint,
  GeneratedPageContent,
  ContentGenerationOptions,
  ToneOfVoiceProfile,
  ContentPrompt,
} from "./types";

import { extractToneOfVoice, buildSectionPrompt } from "./prompt-builder";
import { generateSectionContent } from "./section-generator";
import { generateFAQSection, generateCommonFAQs } from "./faq-generator";
import { generateMetadata } from "./metadata-generator";
import { assemblePageContent } from "./content-assembler";

/**
 * Generate complete page content from blueprint
 *
 * This is the main entry point for Phase 4 content generation.
 * It orchestrates all generation modules to produce production-ready content.
 */
export async function generateCompletePageContent(
  blueprint: PageBlueprint,
  options: ContentGenerationOptions,
  existingTitles: string[] = []
): Promise<GeneratedPageContent> {
  const apiKey = env.OPENAI_API_KEY;

  if (!hasOpenAICredentials || !apiKey) {
    throw new Error(
      "OpenAI API key is required for content generation. Set OPENAI_API_KEY environment variable."
    );
  }

  console.log(`[orchestrator] Starting content generation for: ${blueprint.slug}`);

  try {
    // Step 1: Determine tone of voice
    console.log("[orchestrator] Step 1/4: Determining tone of voice...");
    const toneProfile =
      options.toneProfile ||
      extractToneOfVoice(undefined, options.businessContext.businessType);

    console.log(`[orchestrator] Using tone: ${toneProfile.style}`);

    // Step 2: Generate metadata first (needed for context)
    console.log("[orchestrator] Step 2/4: Generating metadata...");
    const metadata = await generateMetadata(
      blueprint,
      options.businessContext,
      existingTitles,
      apiKey,
      options.brandSeparator
    );

    console.log(
      `[orchestrator] Metadata generated: "${metadata.title}" (${metadata.titleLength} chars)`
    );

    // Step 3: Generate section content
    console.log(
      `[orchestrator] Step 3/4: Generating ${blueprint.sections.length} sections...`
    );

    const sectionPrompts = blueprint.sections.map((section) => ({
      prompt: buildSectionPrompt(
        section,
        blueprint,
        options.businessContext,
        toneProfile,
        options.competitorInsights
      ),
      businessContext: options.businessContext,
    }));

    const sections = [];
    for (let i = 0; i < sectionPrompts.length; i++) {
      const { prompt, businessContext } = sectionPrompts[i];

      console.log(
        `[orchestrator]   Generating section ${i + 1}/${sectionPrompts.length}: "${prompt.sectionHeading}"`
      );

      try {
        const section = await generateSectionContent(prompt, businessContext, apiKey);
        sections.push(section);

        console.log(
          `[orchestrator]   ✓ Section complete: ${section.wordCount} words, quality: ${section.qualityMetrics.includesRequiredKeywords ? "good" : "needs review"}`
        );

        // Rate limiting delay
        if (i < sectionPrompts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `[orchestrator]   ✗ Failed to generate section "${prompt.sectionHeading}":`,
          error
        );
        throw error;
      }
    }

    // Step 4: Generate FAQs if specified in blueprint
    console.log("[orchestrator] Step 4/4: Generating FAQs...");
    let faqs: any[] = [];

    if (blueprint.faqs) {
      try {
        faqs = await generateFAQSection(
          blueprint.faqs,
          options.businessContext,
          toneProfile,
          apiKey
        );
        console.log(`[orchestrator] Generated ${faqs.length} FAQ answers`);
      } catch (error) {
        console.error("[orchestrator] Failed to generate FAQs:", error);
        // Continue without FAQs rather than failing
      }
    } else {
      console.log("[orchestrator] No FAQs in blueprint, skipping");
    }

    // Step 5: Assemble final content
    console.log("[orchestrator] Step 5/5: Assembling final content...");

    const pageContent = assemblePageContent(sections, faqs, metadata, blueprint, {
      includeImagePlaceholders: options.includeImagePlaceholders,
    });

    console.log(
      `[orchestrator] ✓ Content generation complete for "${blueprint.slug}"`
    );
    console.log(`[orchestrator]   Total words: ${pageContent.totalWordCount}`);
    console.log(`[orchestrator]   Quality score: ${pageContent.qualityScore}/100`);
    console.log(
      `[orchestrator]   Issues: ${pageContent.qualityReport.issues.length}`
    );
    console.log(
      `[orchestrator]   Strengths: ${pageContent.qualityReport.strengths.length}`
    );

    // Check quality threshold if enforced
    if (options.enforceQuality && pageContent.qualityScore < 70) {
      throw new Error(
        `Quality score ${pageContent.qualityScore}/100 below threshold. Issues: ${pageContent.qualityReport.issues.join(", ")}`
      );
    }

    return pageContent;
  } catch (error) {
    console.error(
      `[orchestrator] Content generation failed for "${blueprint.slug}":`,
      error
    );
    throw error;
  }
}

/**
 * Generate content for multiple pages in batch
 */
export async function generateMultiplePages(
  blueprints: PageBlueprint[],
  options: ContentGenerationOptions
): Promise<GeneratedPageContent[]> {
  const results: GeneratedPageContent[] = [];
  const existingTitles: string[] = [];

  console.log(
    `[orchestrator] Starting batch generation for ${blueprints.length} pages...`
  );

  for (let i = 0; i < blueprints.length; i++) {
    const blueprint = blueprints[i];

    console.log(
      `\n[orchestrator] === Page ${i + 1}/${blueprints.length}: ${blueprint.slug} ===`
    );

    try {
      const content = await generateCompletePageContent(
        blueprint,
        options,
        existingTitles
      );

      results.push(content);
      existingTitles.push(content.metadata.title);

      // Delay between pages to respect rate limits
      if (i < blueprints.length - 1) {
        console.log(
          "[orchestrator] Waiting 2 seconds before next page (rate limiting)..."
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(
        `[orchestrator] Failed to generate content for "${blueprint.slug}":`,
        error
      );

      if (options.enforceQuality) {
        throw error; // Stop on first failure if quality is enforced
      }

      // Otherwise continue with other pages
    }
  }

  console.log(
    `\n[orchestrator] Batch generation complete: ${results.length}/${blueprints.length} pages generated`
  );

  return results;
}

/**
 * Generate content with retry logic
 */
export async function generateWithRetry(
  blueprint: PageBlueprint,
  options: ContentGenerationOptions,
  existingTitles: string[] = [],
  maxRetries: number = 2
): Promise<GeneratedPageContent> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[orchestrator] Generation attempt ${attempt}/${maxRetries} for "${blueprint.slug}"`
      );

      const content = await generateCompletePageContent(
        blueprint,
        options,
        existingTitles
      );

      // Success
      return content;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `[orchestrator] Attempt ${attempt} failed:`,
        error
      );

      if (attempt < maxRetries) {
        const delay = attempt * 2000; // Exponential backoff
        console.log(
          `[orchestrator] Retrying in ${delay / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to generate content after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Estimate generation time for a blueprint
 */
export function estimateGenerationTime(blueprint: PageBlueprint): {
  estimatedSeconds: number;
  breakdown: string;
} {
  // Rough estimates based on API response times
  const metadataTime = 3; // seconds
  const sectionTime = 5; // seconds per section
  const faqTime = 2; // seconds per FAQ
  const assemblyTime = 1; // seconds

  const sectionCount = blueprint.sections.length;
  const faqCount = blueprint.faqs?.questions.length || 0;

  const totalTime =
    metadataTime +
    sectionCount * sectionTime +
    faqCount * faqTime +
    assemblyTime +
    sectionCount; // Rate limiting delays

  const breakdown = [
    `Metadata: ${metadataTime}s`,
    `Sections (${sectionCount}): ${sectionCount * sectionTime}s`,
    faqCount > 0 ? `FAQs (${faqCount}): ${faqCount * faqTime}s` : null,
    `Assembly: ${assemblyTime}s`,
    `Rate limiting: ${sectionCount}s`,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    estimatedSeconds: totalTime,
    breakdown,
  };
}

/**
 * Validate blueprint before generation
 */
export function validateBlueprint(blueprint: PageBlueprint): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!blueprint.slug) {
    errors.push("Blueprint missing required field: slug");
  }

  if (!blueprint.metadata?.title) {
    errors.push("Blueprint missing required field: metadata.title");
  }

  if (!blueprint.sections || blueprint.sections.length === 0) {
    errors.push("Blueprint must have at least one section");
  }

  if (!blueprint.primaryKeywords || blueprint.primaryKeywords.length === 0) {
    warnings.push("Blueprint has no primary keywords");
  }

  // Section validation
  blueprint.sections?.forEach((section, index) => {
    if (!section.heading) {
      errors.push(`Section ${index + 1} missing heading`);
    }
    if (!section.purpose) {
      warnings.push(`Section ${index + 1} missing purpose`);
    }
    if (!section.targetWordCount || section.targetWordCount < 100) {
      warnings.push(
        `Section ${index + 1} has low target word count (${section.targetWordCount})`
      );
    }
  });

  // FAQ validation
  if (blueprint.faqs) {
    if (!blueprint.faqs.questions || blueprint.faqs.questions.length === 0) {
      warnings.push("FAQ section defined but has no questions");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
