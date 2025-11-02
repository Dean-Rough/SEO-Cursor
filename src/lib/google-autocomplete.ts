/**
 * Google Autocomplete API Integration
 *
 * Fetches keyword suggestions from Google's autocomplete API.
 * This is the same API that powers search suggestions in Google Search.
 *
 * Free to use, but rate-limited. Be respectful of Google's servers.
 */

export interface AutocompleteSuggestion {
  query: string;
  relevance: number; // Position in the results (0 = most relevant)
}

/**
 * Fetch autocomplete suggestions from Google
 *
 * @param seed - The seed keyword to get suggestions for
 * @param language - Language code (default: 'en')
 * @param country - Country code for localization (default: 'us')
 * @returns Array of autocomplete suggestions
 */
export async function getAutocompleteSuggestions(
  seed: string,
  language: string = 'en',
  country: string = 'us'
): Promise<AutocompleteSuggestion[]> {
  if (!seed || seed.trim().length === 0) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(seed.trim());
    const url = `http://suggestqueries.google.com/complete/search?client=firefox&q=${encodedQuery}&hl=${language}&gl=${country}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOWizard/1.0)',
      },
    });

    if (!response.ok) {
      console.warn(`[google-autocomplete] Failed to fetch suggestions for "${seed}": ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Google returns: [query, [suggestions], metadata]
    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
      console.warn(`[google-autocomplete] Unexpected response format for "${seed}"`);
      return [];
    }

    const suggestions = data[1] as string[];

    return suggestions
      .filter((suggestion) => suggestion && suggestion.trim().length > 0)
      .map((query, index) => ({
        query: query.trim(),
        relevance: index,
      }));
  } catch (error) {
    console.error(`[google-autocomplete] Error fetching suggestions for "${seed}":`, error);
    return [];
  }
}

/**
 * Batch fetch autocomplete suggestions for multiple seed keywords
 * Includes rate limiting to avoid hitting Google's limits
 *
 * @param seeds - Array of seed keywords
 * @param delayMs - Delay between requests in milliseconds (default: 500ms)
 * @returns Map of seed keyword to suggestions
 */
export async function batchGetAutocompleteSuggestions(
  seeds: string[],
  delayMs: number = 500
): Promise<Map<string, AutocompleteSuggestion[]>> {
  const results = new Map<string, AutocompleteSuggestion[]>();

  for (const seed of seeds) {
    const suggestions = await getAutocompleteSuggestions(seed);
    results.set(seed, suggestions);

    // Rate limiting delay
    if (seeds.indexOf(seed) < seeds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Generate keyword variations using autocomplete
 * Uses common modifiers to expand a seed keyword
 *
 * @param seed - Base keyword
 * @param modifiers - Array of modifiers to append (e.g., 'how', 'best', 'vs')
 * @returns Flattened array of all suggestions
 */
export async function expandKeywordWithModifiers(
  seed: string,
  modifiers: string[] = ['how', 'best', 'vs', 'near me', 'why', 'what is']
): Promise<string[]> {
  const queries = [
    seed,
    ...modifiers.map((mod) => `${mod} ${seed}`),
    ...modifiers.map((mod) => `${seed} ${mod}`),
  ];

  const results = await batchGetAutocompleteSuggestions(queries, 300);
  const allSuggestions = new Set<string>();

  results.forEach((suggestions) => {
    suggestions.forEach((suggestion) => {
      allSuggestions.add(suggestion.query);
    });
  });

  return Array.from(allSuggestions);
}
