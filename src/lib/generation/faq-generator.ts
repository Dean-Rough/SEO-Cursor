/**
 * Phase 4: FAQ Generator
 *
 * Generates FAQ sections optimized for featured snippets.
 * Creates concise, direct answers with proper schema markup.
 */

import { env } from "../env";
import type {
  GeneratedFAQ,
  BlueprintFAQSection,
  BusinessContext,
  ToneOfVoiceProfile,
} from "./types";
import { buildFAQPrompt } from "./prompt-builder";

const MODEL = "gpt-4o";

/**
 * Generate FAQ section with featured snippet optimization
 */
export async function generateFAQSection(
  faqBlueprint: BlueprintFAQSection,
  businessContext: BusinessContext,
  toneProfile: ToneOfVoiceProfile,
  apiKey: string
): Promise<GeneratedFAQ[]> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required for FAQ generation");
  }

  const faqs: GeneratedFAQ[] = [];

  // Generate answers for each question
  for (const question of faqBlueprint.questions) {
    try {
      const faq = await generateFAQAnswer(
        question,
        faqBlueprint.targetKeywords,
        businessContext,
        toneProfile,
        apiKey
      );
      faqs.push(faq);

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[faq-generator] Failed to generate answer for "${question}":`, error);
      // Continue with other questions
    }
  }

  return faqs;
}

/**
 * Generate a single FAQ answer
 */
async function generateFAQAnswer(
  question: string,
  targetKeywords: string[],
  businessContext: BusinessContext,
  toneProfile: ToneOfVoiceProfile,
  apiKey: string
): Promise<GeneratedFAQ> {
  const promptString = buildFAQPrompt(question, targetKeywords, businessContext, toneProfile);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at writing featured snippet-optimized FAQ answers. Be direct, concise, and informative. Answer the question in the first sentence.",
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
  const answer = payload.choices?.[0]?.message?.content;

  if (!answer) {
    throw new Error("OpenAI returned empty answer");
  }

  // Clean the answer
  const cleanedAnswer = cleanFAQAnswer(answer);

  // Calculate metrics
  const wordCount = countWords(cleanedAnswer);
  const optimizedForSnippet = isSnippetOptimized(cleanedAnswer, wordCount);

  return {
    question,
    answer: cleanedAnswer,
    wordCount,
    optimizedForSnippet,
    targetKeywords,
  };
}

/**
 * Clean FAQ answer HTML
 */
function cleanFAQAnswer(html: string): string {
  // Remove markdown code blocks if present
  let cleaned = html.replace(/```html\n?/g, "").replace(/```\n?/g, "");

  // Ensure proper HTML structure (only <p> tags for FAQs)
  cleaned = cleaned.trim();

  // Remove any complex HTML, keep only <p>, <strong>, <em>
  cleaned = cleaned.replace(/<(?!\/?(p|strong|em)\b)[^>]+>/g, "");

  // Wrap in <p> if not already wrapped
  if (!cleaned.startsWith("<p>")) {
    cleaned = `<p>${cleaned}</p>`;
  }

  return cleaned;
}

/**
 * Count words in text
 */
function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Check if answer is optimized for featured snippets
 */
function isSnippetOptimized(answer: string, wordCount: number): boolean {
  // Featured snippets prefer 40-60 words
  if (wordCount < 30 || wordCount > 70) {
    return false;
  }

  const text = answer.replace(/<[^>]+>/g, " ").trim();

  // Should answer directly (not start with "Well,", "So,", etc.)
  const startsWithFiller = /^(well|so|actually|basically|essentially),?\s+/i.test(text);
  if (startsWithFiller) {
    return false;
  }

  // Should be clear and direct
  return true;
}

/**
 * Generate FAQPage schema markup
 */
export function generateFAQSchema(faqs: GeneratedFAQ[]): string {
  const schemaObject = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.replace(/<[^>]+>/g, " ").trim(),
      },
    })),
  };

  return JSON.stringify(schemaObject, null, 2);
}

/**
 * Generate common FAQ questions based on business type and keywords
 */
export function generateCommonFAQs(
  businessType: string,
  businessName: string,
  location?: string,
  primaryKeywords?: string[]
): string[] {
  const normalizedType = businessType.toLowerCase();
  const faqs: string[] = [];

  // Generic questions
  faqs.push(`What services does ${businessName} offer?`);

  if (location) {
    faqs.push(`Does ${businessName} serve ${location}?`);
    faqs.push(`Where is ${businessName} located?`);
  }

  // Business-type specific questions
  if (normalizedType.includes("law") || normalizedType.includes("legal")) {
    faqs.push(`How much does a consultation cost?`);
    faqs.push(`What areas of law do you specialize in?`);
    faqs.push(`How long does a typical case take?`);
  } else if (normalizedType.includes("dental") || normalizedType.includes("dentist")) {
    faqs.push(`Do you accept insurance?`);
    faqs.push(`What should I bring to my first appointment?`);
    faqs.push(`Do you offer emergency dental services?`);
  } else if (normalizedType.includes("restaurant") || normalizedType.includes("cafe")) {
    faqs.push(`What are your opening hours?`);
    faqs.push(`Do you take reservations?`);
    faqs.push(`Do you offer delivery or takeout?`);
  } else if (normalizedType.includes("salon") || normalizedType.includes("spa")) {
    faqs.push(`How do I book an appointment?`);
    faqs.push(`What services do you offer?`);
    faqs.push(`Do you use organic or natural products?`);
  } else if (normalizedType.includes("plumb") || normalizedType.includes("electric")) {
    faqs.push(`Do you offer emergency services?`);
    faqs.push(`Are you licensed and insured?`);
    faqs.push(`What is your service area?`);
  } else if (normalizedType.includes("hotel") || normalizedType.includes("accommod")) {
    faqs.push(`What is your cancellation policy?`);
    faqs.push(`Do you offer free parking?`);
    faqs.push(`Is breakfast included?`);
  } else {
    // Generic service-based questions
    faqs.push(`How can I contact ${businessName}?`);
    faqs.push(`What makes ${businessName} different from competitors?`);
    faqs.push(`Do you offer free consultations?`);
  }

  // Keyword-based questions
  if (primaryKeywords && primaryKeywords.length > 0) {
    const mainKeyword = primaryKeywords[0];
    faqs.push(`Why choose ${businessName} for ${mainKeyword}?`);

    // Add question based on intent keywords
    const intentKeywords = ["cost", "price", "affordable", "best", "near me"];
    for (const intent of intentKeywords) {
      if (mainKeyword.toLowerCase().includes(intent)) {
        if (intent === "cost" || intent === "price" || intent === "affordable") {
          faqs.push(`How much does ${mainKeyword} cost?`);
        } else if (intent === "best") {
          faqs.push(`What makes ${businessName} the best choice for ${mainKeyword}?`);
        }
      }
    }
  }

  // Return unique questions (limit to 8)
  return [...new Set(faqs)].slice(0, 8);
}

/**
 * Format FAQ section as HTML
 */
export function formatFAQsAsHTML(faqs: GeneratedFAQ[]): string {
  let html = '<div class="faq-section">\n';

  for (const faq of faqs) {
    html += '  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">\n';
    html += `    <h3 class="faq-question" itemprop="name">${escapeHTML(faq.question)}</h3>\n`;
    html += '    <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">\n';
    html += `      <div itemprop="text">${faq.answer}</div>\n`;
    html += "    </div>\n";
    html += "  </div>\n";
  }

  html += "</div>\n";

  return html;
}

/**
 * Format FAQ section as Markdown
 */
export function formatFAQsAsMarkdown(faqs: GeneratedFAQ[]): string {
  let markdown = "## Frequently Asked Questions\n\n";

  for (const faq of faqs) {
    markdown += `### ${faq.question}\n\n`;
    // Convert HTML to plain text
    const plainAnswer = faq.answer.replace(/<[^>]+>/g, "").trim();
    markdown += `${plainAnswer}\n\n`;
  }

  return markdown;
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
