import { removeStopwords } from "stopword";

const MIN_TOKEN_LENGTH = 3;
const STOP_SYMBOLS = /[^a-z0-9\s]/g;

export function cleanText(input: string): string {
  return input.replace(/\s+/g, " ").replace(/\u00A0/g, " ").trim();
}

export function extractVisibleText(html: string): string {
  return cleanText(
    html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/<\/?[^>]+(>|$)/g, " ")
  );
}

export function tokenise(text: string): string[] {
  const canonical = text
    .toLowerCase()
    .replace(STOP_SYMBOLS, " ")
    .split(/\s+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

  return removeStopwords(canonical);
}

export function getWordFrequency(tokens: string[]): Map<string, number> {
  return tokens.reduce((acc, token) => {
    const count = acc.get(token) ?? 0;
    acc.set(token, count + 1);
    return acc;
  }, new Map<string, number>());
}

export function computeBigrams(tokens: string[]): Map<string, number> {
  const bigrams = new Map<string, number>();

  for (let i = 0; i < tokens.length - 1; i += 1) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    if (/\d/.test(tokens[i]) && /\d/.test(tokens[i + 1])) continue;
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1);
  }

  return bigrams;
}

export function fleschReadingEase(text: string): number | null {
  if (!text) return null;

  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  if (!sentences.length || !words.length) return null;

  const syllables = words.reduce((total, word) => {
    return total + estimateSyllables(word);
  }, 0);

  const score =
    206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);

  return Math.round((score + Number.EPSILON) * 10) / 10;
}

function estimateSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;

  if (cleaned.length <= 3) return 1;

  const vowelGroups = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, "").match(/[aeiouy]{1,2}/g);
  return vowelGroups ? vowelGroups.length : 1;
}

export function normaliseDensity(count: number, totalWords: number): number {
  if (!totalWords) return 0;
  return Math.round(((count / totalWords) * 100 + Number.EPSILON) * 100) / 100;
}
