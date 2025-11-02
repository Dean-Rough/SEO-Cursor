/**
 * Google People Also Ask (PAA) Scraper
 *
 * Extracts "People Also Ask" questions from Google Search results.
 * These are gold for understanding user intent and creating content.
 *
 * Note: This scrapes public Google search results. Be respectful of rate limits.
 */

import * as cheerio from 'cheerio';

export interface PAAQuestion {
  question: string;
  answer?: string; // Optional snippet from the answer
  relatedTo: string; // The search query this came from
}

/**
 * Extract People Also Ask questions from Google Search
 *
 * @param query - Search query
 * @param maxResults - Maximum number of questions to return (default: 8)
 * @returns Array of PAA questions
 */
export async function getPeopleAlsoAsk(
  query: string,
  maxResults: number = 8
): Promise<PAAQuestion[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://www.google.com/search?q=${encodedQuery}&hl=en`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    if (!response.ok) {
      console.warn(`[google-paa] Failed to fetch PAA for "${query}": ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const questions: PAAQuestion[] = [];

    // PAA questions are typically in elements with specific attributes
    // Google's HTML structure changes frequently, so we try multiple selectors
    const selectors = [
      '[jsname="Cpkphb"]', // Common PAA container
      '.related-question-pair', // Older format
      '[data-q]', // Some PAA elements have data-q attribute
      '.kno-ftr.kp-wholepage-osrp', // Knowledge panel related questions
    ];

    selectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element);
        let questionText = $el.text().trim();

        // Clean up the question text
        if (questionText && questionText.length > 0) {
          // Remove excess whitespace
          questionText = questionText.replace(/\s+/g, ' ').trim();

          // Only add if it looks like a question and we haven't hit the limit
          if (questionText.includes('?') && questions.length < maxResults) {
            // Extract just the question part (sometimes there's answer text included)
            const questionMatch = questionText.match(/^([^?]+\?)/);
            if (questionMatch) {
              const cleanQuestion = questionMatch[1].trim();

              // Avoid duplicates
              if (!questions.some((q) => q.question === cleanQuestion)) {
                questions.push({
                  question: cleanQuestion,
                  relatedTo: query,
                });
              }
            }
          }
        }
      });
    });

    // Also check for "Related searches" section
    $('a:contains("Related searches")').each((_, element) => {
      const text = $(element).text().trim();
      if (text && !questions.some((q) => q.question === text) && questions.length < maxResults) {
        // Convert related search to a question format if it's not already
        const asQuestion = text.endsWith('?') ? text : `What about ${text}?`;
        questions.push({
          question: asQuestion,
          relatedTo: query,
        });
      }
    });

    console.log(`[google-paa] Found ${questions.length} PAA questions for "${query}"`);
    return questions.slice(0, maxResults);
  } catch (error) {
    console.error(`[google-paa] Error fetching PAA for "${query}":`, error);
    return [];
  }
}

/**
 * Get related searches from Google Search results
 * These appear at the bottom of search results
 *
 * @param query - Search query
 * @returns Array of related search terms
 */
export async function getRelatedSearches(query: string): Promise<string[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://www.google.com/search?q=${encodedQuery}&hl=en`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.warn(
        `[google-paa] Failed to fetch related searches for "${query}": ${response.status}`
      );
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const relatedSearches: string[] = [];

    // Related searches are typically in a specific section
    $('a[href*="/search?q="]').each((_, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr('href') || '';

      // Filter out navigation links and get actual search suggestions
      if (
        text.length > 0 &&
        !text.match(/^(Images|Videos|News|Maps|Shopping|More)$/i) &&
        href.includes('/search?q=') &&
        !relatedSearches.includes(text)
      ) {
        relatedSearches.push(text);
      }
    });

    console.log(`[google-paa] Found ${relatedSearches.length} related searches for "${query}"`);
    return relatedSearches.slice(0, 10);
  } catch (error) {
    console.error(`[google-paa] Error fetching related searches for "${query}":`, error);
    return [];
  }
}

/**
 * Batch fetch PAA questions for multiple queries
 *
 * @param queries - Array of search queries
 * @param delayMs - Delay between requests (default: 1000ms to avoid rate limiting)
 * @returns Map of query to PAA questions
 */
export async function batchGetPeopleAlsoAsk(
  queries: string[],
  delayMs: number = 1000
): Promise<Map<string, PAAQuestion[]>> {
  const results = new Map<string, PAAQuestion[]>();

  for (const query of queries) {
    const questions = await getPeopleAlsoAsk(query);
    results.set(query, questions);

    // Rate limiting delay - be nice to Google's servers
    if (queries.indexOf(query) < queries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
