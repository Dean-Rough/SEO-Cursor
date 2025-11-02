/**
 * Claude-Powered Keyword Expansion
 *
 * Uses Claude (via OpenAI-compatible API) to generate keyword variations,
 * semantic expansions, and content angles based on seed keywords.
 *
 * This is more powerful than traditional keyword tools because Claude
 * understands context, intent, and semantic relationships.
 */

import OpenAI from 'openai';
import { env } from './env';

export interface KeywordExpansion {
  coreKeywords: string[];
  longTailVariations: string[];
  questionBasedKeywords: string[];
  semanticVariations: string[];
  contentAngles: string[];
  userIntents: string[];
}

const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

/**
 * Expand a seed keyword using Claude's semantic understanding
 *
 * @param seedKeyword - The base keyword to expand
 * @param businessContext - Business type and context for relevance
 * @param location - Geographic location for local variations
 * @returns Comprehensive keyword expansion
 */
export async function expandKeywordsWithClaude(
  seedKeyword: string,
  businessContext: string,
  location?: string
): Promise<KeywordExpansion | null> {
  if (!openai) {
    console.warn('[claude-keywords] OpenAI API key not configured');
    return null;
  }

  try {
    const locationContext = location ? `in ${location}` : '';

    const prompt = `You are an expert SEO keyword researcher. Given a seed keyword and business context, generate a comprehensive list of related keywords and content angles.

Seed Keyword: "${seedKeyword}"
Business: ${businessContext} ${locationContext}

Please provide:

1. **Core Keywords** (5-8): Direct variations and synonyms of the seed keyword
2. **Long-Tail Variations** (8-12): Longer, more specific keyword phrases
3. **Question-Based Keywords** (6-10): How/what/why/when/where questions people ask
4. **Semantic Variations** (5-8): Related concepts and topics
5. **Content Angles** (4-6): Unique perspectives or approaches for content
6. **User Intents** (3-5): What users are actually trying to accomplish

Format your response as JSON with these exact keys:
{
  "coreKeywords": [],
  "longTailVariations": [],
  "questionBasedKeywords": [],
  "semanticVariations": [],
  "contentAngles": [],
  "userIntents": []
}

Important:
- Focus on keywords relevant to "${businessContext}"
${location ? `- Include local variations for ${location}` : ''}
- Prioritize high commercial intent keywords
- Avoid generic navigation keywords (home, contact, about)
- Keep keywords natural and conversational`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO keyword researcher. Provide keyword suggestions in valid JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[claude-keywords] No response from API');
      return null;
    }

    const expansion = JSON.parse(content) as KeywordExpansion;

    console.log(
      `[claude-keywords] Generated ${Object.values(expansion).flat().length} total keywords for "${seedKeyword}"`
    );

    return expansion;
  } catch (error) {
    console.error('[claude-keywords] Error expanding keywords:', error);
    return null;
  }
}

/**
 * Generate keyword suggestions from multiple data sources combined
 *
 * @param params - Configuration object
 * @returns Combined keyword list from all sources
 */
export async function generateKeywordSuggestions(params: {
  seedKeywords: string[];
  autocompleteData?: string[];
  paaQuestions?: string[];
  relatedSearches?: string[];
  businessContext: string;
  location?: string;
}): Promise<string[]> {
  if (!openai) {
    console.warn('[claude-keywords] OpenAI API key not configured, using source data only');
    return [
      ...params.seedKeywords,
      ...(params.autocompleteData || []),
      ...(params.paaQuestions || []),
      ...(params.relatedSearches || []),
    ];
  }

  try {
    const locationContext = params.location ? `in ${params.location}` : '';

    const prompt = `You are an expert SEO keyword researcher. I've collected keyword data from multiple sources. Your job is to:

1. Analyze and prioritize the keywords
2. Remove duplicates and near-duplicates
3. Filter out navigation keywords (home, contact, etc.)
4. Add semantic variations I might have missed
5. Return the top 50 most valuable keywords

**Seed Keywords:**
${params.seedKeywords.join('\n')}

**Google Autocomplete Suggestions:**
${params.autocompleteData?.join('\n') || 'None'}

**People Also Ask Questions:**
${params.paaQuestions?.join('\n') || 'None'}

**Related Searches:**
${params.relatedSearches?.join('\n') || 'None'}

**Business Context:** ${params.businessContext} ${locationContext}

Return a JSON array of the top 50 keywords, prioritized by:
- Commercial intent
- Relevance to the business
- Search likelihood
- Content opportunity

Format: { "keywords": ["keyword 1", "keyword 2", ...] }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO keyword researcher. Provide clean, prioritized keyword lists in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[claude-keywords] No response from API');
      return params.seedKeywords;
    }

    const result = JSON.parse(content) as { keywords: string[] };

    console.log(
      `[claude-keywords] Filtered and prioritized to ${result.keywords.length} keywords`
    );

    return result.keywords;
  } catch (error) {
    console.error('[claude-keywords] Error generating suggestions:', error);
    // Fallback to combined source data
    return [
      ...params.seedKeywords,
      ...(params.autocompleteData || []),
      ...(params.paaQuestions || []),
      ...(params.relatedSearches || []),
    ];
  }
}

/**
 * Validate if keywords are relevant to the business
 * Uses Claude to filter out irrelevant suggestions
 *
 * @param keywords - Keywords to validate
 * @param businessContext - Business description
 * @returns Filtered list of relevant keywords
 */
export async function validateKeywordRelevance(
  keywords: string[],
  businessContext: string
): Promise<string[]> {
  if (!openai || keywords.length === 0) {
    return keywords;
  }

  try {
    const prompt = `Filter this list of keywords to only include those relevant to: ${businessContext}

Keywords:
${keywords.join('\n')}

Return only the relevant keywords as a JSON array: { "relevant": [] }

Remove:
- Navigation keywords (home, contact, about, login)
- Unrelated topics
- Generic web terms
- Off-brand suggestions`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO keyword filter. Return only relevant keywords in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return keywords;
    }

    const result = JSON.parse(content) as { relevant: string[] };
    console.log(
      `[claude-keywords] Filtered ${keywords.length} keywords to ${result.relevant.length} relevant ones`
    );

    return result.relevant;
  } catch (error) {
    console.error('[claude-keywords] Error validating keywords:', error);
    return keywords;
  }
}
