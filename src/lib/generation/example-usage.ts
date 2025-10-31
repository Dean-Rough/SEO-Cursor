/**
 * Phase 4: Content Generation - Example Usage
 *
 * Demonstrates how to use the content generation system.
 * This file shows real-world usage patterns and best practices.
 */

import {
  generateCompletePageContent,
  generateMultiplePages,
  validateBlueprint,
  estimateGenerationTime,
} from "./orchestrator";

import { exportPageContent } from "./content-assembler";

import type {
  PageBlueprint,
  ContentGenerationOptions,
  BusinessContext,
  GeneratedPageContent,
} from "./types";

/**
 * Example 1: Generate content for a single homepage
 */
export async function exampleHomepageGeneration() {
  // Define business context
  const businessContext: BusinessContext = {
    businessName: "Elite Dental Care",
    businessType: "dental practice",
    location: "Austin, Texas",
    serviceArea: "Greater Austin area",
    additionalNotes:
      "Family-friendly practice with 15+ years experience. Specializes in cosmetic dentistry.",
  };

  // Define homepage blueprint (would normally come from Phase 3)
  const homepageBlueprint: PageBlueprint = {
    slug: "home",
    url: "/",
    pageType: "homepage",
    metadata: {
      title: "Austin Dentist | Family & Cosmetic Dentistry",
      description:
        "Award-winning dental practice in Austin, TX. Comprehensive family and cosmetic dentistry with 15+ years experience. Book your appointment today.",
      h1: "Welcome to Elite Dental Care",
      heroPitch: "Your trusted partner for comprehensive dental care in Austin",
      callToAction: "Schedule Your Appointment Today",
    },
    primaryKeywords: [
      { keyword: "dentist austin", score: 95, density: 0, intent: "transactional" },
      { keyword: "cosmetic dentistry", score: 90, density: 0, intent: "commercial" },
      { keyword: "family dentist", score: 88, density: 0, intent: "commercial" },
    ],
    supportingKeywords: [
      { keyword: "teeth whitening", score: 75, density: 0 },
      { keyword: "dental implants", score: 72, density: 0 },
      { keyword: "emergency dentist", score: 70, density: 0 },
    ],
    pageObjective:
      "Convert local visitors into appointment bookings by showcasing expertise, services, and patient care",
    audienceIntent: "Local residents searching for a trusted dental practice",
    mustInclude: [
      "15+ years of experience",
      "Comprehensive family and cosmetic services",
      "Convenient Austin location",
      "Modern, comfortable facility",
    ],
    sections: [
      {
        heading: "Exceptional Dental Care in Austin",
        purpose:
          "Hero section establishing trust and primary value proposition with strong CTA",
        targetKeywords: ["dentist austin", "dental care"],
        targetWordCount: 150,
        contentType: "hero",
        mustInclude: [
          "Years of experience",
          "Location mention",
          "Primary services overview",
        ],
      },
      {
        heading: "Comprehensive Dental Services",
        purpose: "Showcase range of services to address different patient needs",
        targetKeywords: ["cosmetic dentistry", "family dentist", "dental services"],
        targetWordCount: 300,
        contentType: "features",
        mustInclude: [
          "Preventive care",
          "Cosmetic treatments",
          "Restorative procedures",
          "Emergency services",
        ],
      },
      {
        heading: "Why Choose Elite Dental Care?",
        purpose: "Differentiate from competitors with unique value propositions",
        targetKeywords: ["best dentist austin", "dental practice"],
        targetWordCount: 250,
        contentType: "benefits",
        mustInclude: [
          "Experienced team",
          "Modern technology",
          "Patient-centered approach",
          "Flexible scheduling",
        ],
      },
      {
        heading: "What Our Patients Say",
        purpose: "Build trust through social proof and testimonials",
        targetKeywords: ["dentist reviews", "patient testimonials"],
        targetWordCount: 200,
        contentType: "testimonials",
        mustInclude: [
          "Real patient experiences",
          "Specific service mentions",
          "Results achieved",
        ],
      },
    ],
    faqs: {
      questions: [
        "What dental services do you offer?",
        "Do you accept dental insurance?",
        "How do I schedule an appointment?",
        "Do you offer emergency dental services?",
        "Where are you located in Austin?",
      ],
      targetKeywords: ["dentist austin", "dental services", "emergency dentist"],
      purpose:
        "Answer common questions and capture featured snippet opportunities",
    },
    internalLinks: [
      { anchorText: "cosmetic dentistry services", url: "/services/cosmetic" },
      { anchorText: "family dental care", url: "/services/family" },
      { anchorText: "contact our office", url: "/contact" },
    ],
  };

  // Configure generation options
  const options: ContentGenerationOptions = {
    businessContext,
    includeImagePlaceholders: true,
    enforceQuality: true,
    brandSeparator: " | ",
  };

  // Validate blueprint before generation
  const validation = validateBlueprint(homepageBlueprint);
  if (!validation.isValid) {
    console.error("Blueprint validation failed:", validation.errors);
    return;
  }

  if (validation.warnings.length > 0) {
    console.warn("Blueprint warnings:", validation.warnings);
  }

  // Estimate generation time
  const estimate = estimateGenerationTime(homepageBlueprint);
  console.log(
    `Estimated generation time: ${estimate.estimatedSeconds}s (${estimate.breakdown})`
  );

  // Generate content
  console.log("Starting content generation...");

  try {
    const content = await generateCompletePageContent(homepageBlueprint, options);

    console.log("\n=== GENERATION COMPLETE ===");
    console.log(`Quality Score: ${content.qualityScore}/100`);
    console.log(`Total Words: ${content.totalWordCount}`);
    console.log(`\nStrengths:`);
    content.qualityReport.strengths.forEach((s) => console.log(`  ✓ ${s}`));

    if (content.qualityReport.issues.length > 0) {
      console.log(`\nIssues:`);
      content.qualityReport.issues.forEach((i) => console.log(`  ⚠ ${i}`));
    }

    // Export in different formats
    const htmlExport = exportPageContent(content, "html");
    const markdownExport = exportPageContent(content, "markdown");

    console.log("\n=== METADATA ===");
    console.log(`Title: ${content.metadata.title} (${content.metadata.titleLength} chars)`);
    console.log(
      `Description: ${content.metadata.description} (${content.metadata.descriptionLength} chars)`
    );

    console.log("\n=== SECTIONS ===");
    content.sections.forEach((section, i) => {
      console.log(`${i + 1}. ${section.heading} - ${section.wordCount} words`);
    });

    console.log("\n=== SAMPLE CONTENT (First Section) ===");
    console.log(content.sections[0].content);

    return content;
  } catch (error) {
    console.error("Content generation failed:", error);
    throw error;
  }
}

/**
 * Example 2: Generate content for multiple service pages
 */
export async function exampleMultiplePageGeneration() {
  const businessContext: BusinessContext = {
    businessName: "Smith & Associates Law",
    businessType: "law firm",
    location: "Denver, Colorado",
    additionalNotes:
      "Specializing in family law, personal injury, and estate planning",
  };

  // Define service page blueprints
  const servicePages: PageBlueprint[] = [
    {
      slug: "family-law",
      url: "/services/family-law",
      pageType: "service",
      metadata: {
        title: "Family Law Attorney Denver | Smith & Associates",
        description:
          "Experienced family law attorneys in Denver. Divorce, custody, support. Compassionate legal representation. Free consultation.",
        h1: "Family Law Services in Denver",
        heroPitch: "Protecting your family's future with compassionate legal support",
        callToAction: "Schedule Free Consultation",
      },
      primaryKeywords: [
        { keyword: "family law attorney denver", score: 95, density: 0 },
        { keyword: "divorce lawyer", score: 90, density: 0 },
      ],
      supportingKeywords: [
        { keyword: "child custody", score: 80, density: 0 },
        { keyword: "spousal support", score: 75, density: 0 },
      ],
      pageObjective: "Convert consultations for family law matters",
      audienceIntent:
        "People facing family law issues seeking legal representation",
      mustInclude: ["Free consultation", "Years of experience", "Client-focused approach"],
      sections: [
        {
          heading: "Expert Family Law Representation",
          purpose: "Establish authority and empathy",
          targetKeywords: ["family law attorney", "divorce lawyer"],
          targetWordCount: 200,
          contentType: "hero",
        },
        {
          heading: "Our Family Law Services",
          purpose: "Detail specific practice areas",
          targetKeywords: ["family law services", "divorce", "custody"],
          targetWordCount: 350,
          contentType: "features",
        },
      ],
      faqs: {
        questions: [
          "How much does a divorce lawyer cost?",
          "What is the divorce process in Colorado?",
          "How is child custody determined?",
        ],
        targetKeywords: ["divorce lawyer", "child custody"],
        purpose: "Answer common legal questions",
      },
    },
    {
      slug: "personal-injury",
      url: "/services/personal-injury",
      pageType: "service",
      metadata: {
        title: "Personal Injury Lawyer Denver | Free Case Review",
        description:
          "Denver personal injury attorneys fighting for your rights. Car accidents, slip & fall, medical malpractice. No fee unless we win.",
        h1: "Personal Injury Legal Services",
        heroPitch: "Maximum compensation for your injuries",
        callToAction: "Free Case Evaluation",
      },
      primaryKeywords: [
        { keyword: "personal injury lawyer denver", score: 95, density: 0 },
        { keyword: "car accident attorney", score: 88, density: 0 },
      ],
      supportingKeywords: [
        { keyword: "slip and fall", score: 75, density: 0 },
        { keyword: "wrongful death", score: 72, density: 0 },
      ],
      pageObjective: "Generate case evaluation requests",
      audienceIntent: "Injury victims seeking legal compensation",
      mustInclude: [
        "No fee unless we win",
        "Free case evaluation",
        "Proven track record",
      ],
      sections: [
        {
          heading: "Fighting for Injury Victims",
          purpose: "Strong opening with clear value",
          targetKeywords: ["personal injury lawyer", "injury attorney"],
          targetWordCount: 200,
          contentType: "hero",
        },
        {
          heading: "Types of Personal Injury Cases",
          purpose: "Cover all practice areas",
          targetKeywords: ["car accident", "slip and fall", "medical malpractice"],
          targetWordCount: 400,
          contentType: "features",
        },
      ],
      faqs: {
        questions: [
          "How much is my personal injury case worth?",
          "How long do I have to file a claim?",
          "What if I can't afford a lawyer?",
        ],
        targetKeywords: ["personal injury claim", "injury lawyer"],
        purpose: "Address cost concerns and process",
      },
    },
  ];

  const options: ContentGenerationOptions = {
    businessContext,
    enforceQuality: false, // Continue even if one page has issues
  };

  console.log(`\nGenerating content for ${servicePages.length} service pages...`);

  try {
    const allContent = await generateMultiplePages(servicePages, options);

    console.log("\n=== BATCH GENERATION COMPLETE ===");
    console.log(`Successfully generated: ${allContent.length}/${servicePages.length} pages`);

    allContent.forEach((content, i) => {
      console.log(
        `\n${i + 1}. ${content.slug} - Quality: ${content.qualityScore}/100, Words: ${content.totalWordCount}`
      );
    });

    return allContent;
  } catch (error) {
    console.error("Batch generation failed:", error);
    throw error;
  }
}

/**
 * Example 3: Integration with existing content-writer.ts
 *
 * Shows how Phase 4 can enhance the existing content generation
 */
export async function exampleEnhancedContentGeneration() {
  // The new Phase 4 system can work alongside the existing content-writer.ts
  // Use Phase 4 for:
  // 1. Section-by-section generation with quality control
  // 2. Advanced metadata optimization
  // 3. FAQ generation with schema
  // 4. Multiple format output (HTML, Markdown, plain text)
  // 5. Detailed quality scoring

  // Use existing content-writer.ts for:
  // 1. Quick batch generation of multiple pages
  // 2. Simpler content briefs
  // 3. When Phase 3 blueprints aren't available

  console.log("Phase 4 enhances existing content generation with:");
  console.log("  - Section-by-section quality validation");
  console.log("  - Advanced keyword density analysis");
  console.log("  - Featured snippet-optimized FAQs");
  console.log("  - CTR-optimized metadata with uniqueness checking");
  console.log("  - Comprehensive quality scoring");
  console.log("  - Multiple export formats (HTML, Markdown, JSON)");
}

/**
 * Example 4: Quality analysis and improvement
 */
export function exampleQualityAnalysis(content: GeneratedPageContent) {
  console.log("\n=== QUALITY ANALYSIS ===");
  console.log(`Overall Score: ${content.qualityScore}/100`);

  console.log("\n📊 Metrics:");
  console.log(`  Word Count: ${content.qualityReport.wordCountVsTarget}`);
  console.log(`  CTAs: ${content.qualityReport.ctaCount}`);
  console.log(`  Internal Links: ${content.qualityReport.internalLinkCount}`);
  console.log(`  Schema Markup: ${content.qualityReport.schemaMarkupCount}`);

  if (content.qualityReport.readabilityGrade) {
    console.log(`  Readability: ${content.qualityReport.readabilityGrade}`);
  }

  console.log("\n🔑 Keyword Density:");
  Object.entries(content.qualityReport.keywordDensity).forEach(([keyword, density]) => {
    const status = parseFloat(density) > 3.5 ? "⚠️" : "✓";
    console.log(`  ${status} ${keyword}: ${density}`);
  });

  console.log("\n✅ Strengths:");
  content.qualityReport.strengths.forEach((strength) => {
    console.log(`  • ${strength}`);
  });

  if (content.qualityReport.issues.length > 0) {
    console.log("\n⚠️  Issues:");
    content.qualityReport.issues.forEach((issue) => {
      console.log(`  • ${issue}`);
    });
  }

  // Recommendations
  console.log("\n💡 Recommendations:");
  if (content.qualityScore >= 90) {
    console.log("  • Content is excellent and ready to publish!");
  } else if (content.qualityScore >= 80) {
    console.log("  • Content is good with minor improvements needed");
  } else if (content.qualityScore >= 70) {
    console.log("  • Review and address the issues listed above");
  } else {
    console.log("  • Significant improvements needed before publishing");
    console.log("  • Consider regenerating sections with quality issues");
  }
}

// Example execution (commented out - uncomment to test)
/*
async function runExample() {
  console.log("Starting Phase 4 Content Generation Example\n");

  // Run example 1
  const homepageContent = await exampleHomepageGeneration();

  if (homepageContent) {
    exampleQualityAnalysis(homepageContent);
  }

  // Run example 2
  // await exampleMultiplePageGeneration();
}

// Uncomment to execute:
// runExample().catch(console.error);
*/
