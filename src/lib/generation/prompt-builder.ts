/**
 * Phase 4: Prompt Builder
 *
 * Builds comprehensive, structured prompts for AI content generation.
 * Supports different content types with tailored prompt templates.
 */

import type {
  ContentPrompt,
  ToneOfVoiceProfile,
  PageBlueprint,
  BlueprintSection,
  BusinessContext,
  CompetitorInsights,
} from "./types";

/**
 * Default tone profiles by business type
 */
const TONE_PROFILES: Record<string, ToneOfVoiceProfile> = {
  professional_services: {
    style: "professional",
    characteristics: [
      "Expert and authoritative",
      "Clear and concise",
      "Results-focused",
      "Trust-building",
    ],
    examplePhrases: [
      "Our proven approach",
      "Industry-leading expertise",
      "Delivered with precision",
      "Trusted by businesses across [location]",
    ],
    avoidPhrases: [
      "We're the best!",
      "100% guaranteed",
      "Revolutionary new method",
      "Secret technique",
    ],
  },
  legal: {
    style: "authoritative",
    characteristics: [
      "Formal and precise",
      "Empathetic yet professional",
      "Fact-based",
      "Reassuring",
    ],
    examplePhrases: [
      "With over [X] years of experience",
      "Protecting your rights",
      "Comprehensive legal support",
      "Personalized legal strategy",
    ],
    avoidPhrases: [
      "We'll win your case!",
      "Cheap legal services",
      "Quick fix",
      "Loophole",
    ],
  },
  healthcare: {
    style: "professional",
    characteristics: [
      "Compassionate and caring",
      "Evidence-based",
      "Patient-centered",
      "Clear explanations",
    ],
    examplePhrases: [
      "Patient-centered care",
      "Evidence-based treatment",
      "Your health is our priority",
      "Comprehensive approach to wellness",
    ],
    avoidPhrases: [
      "Miracle cure",
      "Guaranteed results",
      "Revolutionary breakthrough",
      "Instant relief",
    ],
  },
  hospitality: {
    style: "friendly",
    characteristics: [
      "Warm and welcoming",
      "Descriptive and sensory",
      "Experience-focused",
      "Personal touches",
    ],
    examplePhrases: [
      "Welcome to [business name]",
      "Unforgettable experience",
      "Comfort and hospitality",
      "Your home away from home",
    ],
    avoidPhrases: [
      "Cheap accommodation",
      "Basic amenities",
      "Standard service",
      "No frills",
    ],
  },
  retail: {
    style: "friendly",
    characteristics: [
      "Enthusiastic and helpful",
      "Product-focused",
      "Value-conscious",
      "Action-oriented",
    ],
    examplePhrases: [
      "Discover our collection",
      "Shop with confidence",
      "Quality products, exceptional value",
      "Find exactly what you need",
    ],
    avoidPhrases: [
      "Lowest prices guaranteed",
      "Everything must go",
      "Liquidation sale",
      "Going out of business",
    ],
  },
  default: {
    style: "professional",
    characteristics: [
      "Clear and professional",
      "Customer-focused",
      "Results-oriented",
      "Trustworthy",
    ],
    examplePhrases: [
      "Delivering excellence",
      "Tailored solutions",
      "Your trusted partner",
      "Quality you can count on",
    ],
    avoidPhrases: [
      "Unbelievable offer",
      "Too good to be true",
      "Once in a lifetime",
      "Limited time only",
    ],
  },
};

/**
 * Extract tone of voice from existing content or use business type defaults
 */
export function extractToneOfVoice(
  existingContent?: string,
  businessType?: string
): ToneOfVoiceProfile {
  // If we have existing content, analyze it for tone
  if (existingContent && existingContent.length > 500) {
    const tone = analyzeContentTone(existingContent);
    return tone;
  }

  // Otherwise use business type defaults
  const normalizedType = businessType?.toLowerCase().replace(/[^a-z]/g, "_") || "default";

  // Try exact match first
  if (TONE_PROFILES[normalizedType]) {
    return TONE_PROFILES[normalizedType];
  }

  // Try partial match
  const matchingKey = Object.keys(TONE_PROFILES).find((key) =>
    normalizedType.includes(key) || key.includes(normalizedType)
  );

  return TONE_PROFILES[matchingKey || "default"];
}

/**
 * Analyze existing content to determine tone
 */
function analyzeContentTone(content: string): ToneOfVoiceProfile {
  const lowercaseContent = content.toLowerCase();

  // Detect formality
  const formalIndicators = ["pursuant to", "hereby", "aforementioned", "therefore", "whereby"];
  const casualIndicators = ["we're", "you'll", "let's", "gonna", "wanna"];

  const formalScore = formalIndicators.filter((word) => lowercaseContent.includes(word)).length;
  const casualScore = casualIndicators.filter((word) => lowercaseContent.includes(word)).length;

  // Detect enthusiasm
  const exclamationCount = (content.match(/!/g) || []).length;
  const enthusiasticWords = ["amazing", "incredible", "fantastic", "awesome", "love"];
  const enthusiasmScore = enthusiasticWords.filter((word) => lowercaseContent.includes(word)).length;

  // Determine style
  let style: ToneOfVoiceProfile["style"] = "professional";
  if (formalScore > 3) {
    style = "authoritative";
  } else if (casualScore > formalScore && enthusiasmScore > 2) {
    style = "friendly";
  } else if (casualScore > formalScore) {
    style = "casual";
  }

  // Extract common phrases (simplified)
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const examplePhrases = sentences.slice(0, 4).map((s) => s.trim());

  return {
    style,
    characteristics: ["Mirrors existing content tone"],
    examplePhrases,
    avoidPhrases: [],
  };
}

/**
 * Build comprehensive section prompt
 */
export function buildSectionPrompt(
  section: BlueprintSection,
  pageContext: PageBlueprint,
  businessContext: BusinessContext,
  toneProfile: ToneOfVoiceProfile,
  competitorInsights?: CompetitorInsights
): ContentPrompt {
  // Calculate target keyword density (1.5-2.5% is ideal)
  const targetDensity = 2.0;

  // Determine content structure based on section type
  let contentStructure: ContentPrompt["contentStructure"] = "paragraph";
  if (section.contentType === "features" || section.contentType === "benefits") {
    contentStructure = "list";
  } else if (section.contentType === "process") {
    contentStructure = "numbered-list";
  } else if (section.heading.toLowerCase().includes("why choose")) {
    contentStructure = "mixed";
  }

  // Build must-include list
  const mustInclude: string[] = [...(section.mustInclude || [])];

  if (businessContext.location) {
    mustInclude.push(`Location reference: ${businessContext.location}`);
  }

  if (section.contentType === "hero") {
    mustInclude.push("Clear value proposition");
    mustInclude.push("Primary call-to-action");
  }

  if (section.contentType === "testimonials") {
    mustInclude.push("Specific examples or metrics");
    mustInclude.push("Customer names or business types");
  }

  // Build must-avoid list
  const mustAvoid: string[] = [
    ...toneProfile.avoidPhrases,
    "Generic filler phrases",
    "Keyword stuffing",
    "Unsubstantiated claims",
    "Vague benefits without specifics",
  ];

  // Build competitor insights summary
  let competitorInsightsSummary: string | undefined;
  if (competitorInsights) {
    competitorInsightsSummary = `Top ranking competitors cover: ${competitorInsights.commonTopics.join(", ")}. Average section word count: ${Math.round(competitorInsights.averageWordCount / competitorInsights.averageSections)}. Consider unique angles: ${competitorInsights.uniqueAngles.join(", ")}.`;
  }

  // Determine CTA if applicable
  let ctaToIntegrate: string | undefined;
  if (section.contentType === "hero" || section.contentType === "cta") {
    ctaToIntegrate = pageContext.metadata.callToAction;
  }

  // Extract internal links from page context
  const internalLinks = pageContext.internalLinks?.slice(0, 3);

  return {
    sectionHeading: section.heading,
    purpose: section.purpose,
    targetAudience: getAudienceFromIntent(pageContext.audienceIntent),
    targetWordCount: section.targetWordCount,
    toneOfVoice: toneProfile.style,
    keywords: {
      primary: section.targetKeywords.slice(0, 2),
      secondary: section.targetKeywords.slice(2, 5),
      targetDensity,
    },
    contentStructure,
    mustInclude,
    mustAvoid,
    competitorInsights: competitorInsightsSummary,
    ctaToIntegrate,
    internalLinks,
  };
}

/**
 * Convert audience intent to human-readable description
 */
function getAudienceFromIntent(intent: string): string {
  const intentLower = intent.toLowerCase();

  if (intentLower.includes("local")) {
    return "Local customers searching for nearby services";
  }
  if (intentLower.includes("research")) {
    return "Potential customers researching options and comparing providers";
  }
  if (intentLower.includes("ready to buy") || intentLower.includes("transactional")) {
    return "Customers ready to make a purchase decision";
  }
  if (intentLower.includes("information")) {
    return "Users seeking information and education on the topic";
  }

  return intent;
}

/**
 * Build AI prompt string from ContentPrompt
 */
export function buildAIPromptString(
  prompt: ContentPrompt,
  businessContext: BusinessContext
): string {
  const keywordList = [
    ...prompt.keywords.primary.map((k) => `"${k}" (primary)`),
    ...prompt.keywords.secondary.map((k) => `"${k}" (secondary)`),
  ].join(", ");

  const structureInstructions = {
    paragraph: "Write in clear, engaging paragraphs with varied sentence structure.",
    list: "Structure as bullet points, each highlighting a distinct benefit or feature.",
    "numbered-list": "Present as a numbered step-by-step process or sequential list.",
    mixed: "Combine paragraphs with bullet points where appropriate for readability.",
  };

  let promptText = `You are an expert SEO copywriter specializing in ${businessContext.businessType}.

Write the "${prompt.sectionHeading}" section for a ${businessContext.businessName} website.

REQUIREMENTS:
- Exactly ${prompt.targetWordCount} words (±10% acceptable)
- Tone: ${prompt.toneOfVoice}
- Target audience: ${prompt.targetAudience}
- Keywords to include naturally: ${keywordList}
- Target keyword density: ~${prompt.keywords.targetDensity}%
- Content structure: ${structureInstructions[prompt.contentStructure]}

SECTION PURPOSE:
${prompt.purpose}

MUST INCLUDE:
${prompt.mustInclude.map((item, i) => `${i + 1}. ${item}`).join("\n")}

STRICTLY AVOID:
${prompt.mustAvoid.map((item) => `- ${item}`).join("\n")}`;

  if (prompt.competitorInsights) {
    promptText += `\n\nCOMPETITOR INSIGHTS:
${prompt.competitorInsights}`;
  }

  if (prompt.ctaToIntegrate) {
    promptText += `\n\nCALL TO ACTION:
Integrate this CTA naturally: "${prompt.ctaToIntegrate}"`;
  }

  if (prompt.internalLinks && prompt.internalLinks.length > 0) {
    promptText += `\n\nINTERNAL LINKS:
Consider linking to these pages with natural anchor text:
${prompt.internalLinks.map((link) => `- ${link.anchorText} → ${link.url}`).join("\n")}`;
  }

  promptText += `\n\nOUTPUT FORMAT:
Return only the section content in clean HTML format using semantic tags (<p>, <ul>, <ol>, <strong>, <em>).
Do not include the section heading - just the body content.
Ensure content is production-ready, unique, and conversion-focused.`;

  return promptText;
}

/**
 * Build FAQ prompt
 */
export function buildFAQPrompt(
  question: string,
  targetKeywords: string[],
  businessContext: BusinessContext,
  toneProfile: ToneOfVoiceProfile
): string {
  return `You are an expert SEO copywriter specializing in ${businessContext.businessType}.

Write a concise, featured snippet-optimized answer to this FAQ question:
"${question}"

REQUIREMENTS:
- 40-60 words (optimal for featured snippets)
- Direct answer in the first sentence
- Include relevant keywords naturally: ${targetKeywords.join(", ")}
- Tone: ${toneProfile.style}
- Provide actionable information
- Location context: ${businessContext.location || "N/A"}

OUTPUT FORMAT:
Return only the answer text in plain HTML (<p> tags only, <strong> for emphasis if needed).
Do not include the question - just the answer.`;
}

/**
 * Build metadata optimization prompt
 */
export function buildMetadataPrompt(
  pageContext: PageBlueprint,
  businessContext: BusinessContext,
  existingTitles: string[]
): string {
  const primaryKeyword = pageContext.primaryKeywords[0]?.keyword || "";
  const secondaryKeywords = pageContext.supportingKeywords
    .slice(0, 3)
    .map((k) => k.keyword)
    .join(", ");

  return `You are an expert in SEO metadata optimization.

Create a CTR-optimized title tag and meta description for a ${pageContext.pageType} page.

PAGE DETAILS:
- Business: ${businessContext.businessName}
- Type: ${businessContext.businessType}
- Location: ${businessContext.location || "N/A"}
- Primary keyword: "${primaryKeyword}"
- Supporting keywords: ${secondaryKeywords}
- Page objective: ${pageContext.pageObjective}
- Audience intent: ${pageContext.audienceIntent}

TITLE TAG REQUIREMENTS:
- 50-60 characters (strict)
- Include primary keyword naturally near the start
- Include brand name at the end: " | ${businessContext.businessName}" or " - ${businessContext.businessName}"
- Use power words: Best, Top, Expert, Award-winning, Professional, etc.
- Be compelling and clickable
- Must be unique (avoid these existing titles: ${existingTitles.join("; ")})

META DESCRIPTION REQUIREMENTS:
- 150-160 characters (strict)
- Include primary keyword and at least one secondary keyword
- Include clear call-to-action
- Highlight unique value proposition
- No generic phrases
- Compelling and conversion-focused

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "title": "Your optimized title tag here",
  "description": "Your optimized meta description here"
}`;
}
