import { load } from "cheerio";
import { analysePage } from "./analyse-page";
import { fetchPageHtml } from "./fetcher";
import { isSameDomain, normaliseUrl, resolveUrl } from "./url";
import type { PageAnalysis } from "./types";

interface CrawlOptions {
  startUrl: string;
  limit: number;
  maxDepth: number;
  sameDomainOnly?: boolean;
  respectRobots?: boolean;
  delayMs?: number;
}

interface RobotsRules {
  disallows: string[];
  allows: string[];
  crawlDelay?: number;
}

export async function crawlSite(options: CrawlOptions): Promise<PageAnalysis[]> {
  const startUrl = normaliseUrl(options.startUrl);
  const start = new URL(startUrl);
  const limit = Math.max(1, options.limit);
  const maxDepth = Math.max(0, options.maxDepth);
  const sameDomainOnly = options.sameDomainOnly ?? true;
  const respectRobots = options.respectRobots ?? true;
  const defaultDelay = options.delayMs ?? 250;

  const robots = respectRobots ? await fetchRobotsRules(start) : null;
  const crawlDelay = robots?.crawlDelay ?? defaultDelay;

  const pages: PageAnalysis[] = [];
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const visited = new Set<string>();
  const enqueued = new Set<string>([startUrl]);

  while (queue.length && pages.length < limit) {
    const { url, depth } = queue.shift()!;
    const normalised = normaliseUrl(url);
    if (visited.has(normalised)) {
      continue;
    }
    visited.add(normalised);

    const candidate = new URL(normalised);
    if (robots && !isAllowed(candidate, robots)) {
      pages.push(createBlockedAnalysis(normalised));
      continue;
    }

    const result = await fetchPageHtml(normalised);
    if (!result.ok) {
      pages.push(createErrorAnalysis(normalised, result.error ?? "Fetch error"));
      continue;
    }

    const analysis = analysePage(result.url, result.html);
    pages.push(analysis);

    if (depth >= maxDepth || pages.length >= limit) {
      continue;
    }

    const links = extractLinks(result.html, normalised);
    for (const link of links) {
      const normalisedLink = normaliseUrl(link);
      if (visited.has(normalisedLink) || enqueued.has(normalisedLink)) continue;
      if (sameDomainOnly && !isSameDomain(startUrl, normalisedLink)) continue;
      const nextUrl = new URL(normalisedLink, start);
      if (robots && !isAllowed(nextUrl, robots)) continue;

      if (queue.length + pages.length >= limit) continue;

      queue.push({ url: normalisedLink, depth: depth + 1 });
      enqueued.add(normalisedLink);
    }

    if (crawlDelay > 0 && queue.length) {
      await sleep(crawlDelay);
    }
  }

  return pages.slice(0, limit);
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = load(html);
  const links = new Set<string>();
  const binaryExtensionPattern = /\.(pdf|zip|exe|png|jpe?g|gif|svg|webp|mp4|mp3|mov|wav|avi|docx?|xlsx?|pptx?)($|\?)/i;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("#")) return;
    if (/^(mailto:|tel:)/i.test(href)) return;
    if (/^javascript:/i.test(href)) return;
    if (binaryExtensionPattern.test(href)) return;

    links.add(resolveUrl(baseUrl, href));
  });

  return Array.from(links);
}

function createErrorAnalysis(url: string, error: string): PageAnalysis {
  return {
    url,
    titleTag: "",
    metaDescription: "",
    h1: "",
    wordCount: 0,
    readability: null,
    keywords: [],
    headings: [],
    status: "error",
    error,
  };
}

function createBlockedAnalysis(url: string): PageAnalysis {
  return {
    url,
    titleTag: "",
    metaDescription: "",
    h1: "",
    wordCount: 0,
    readability: null,
    keywords: [],
    headings: [],
    status: "error",
    error: "Blocked by robots.txt",
  };
}

async function fetchRobotsRules(url: URL): Promise<RobotsRules | null> {
  try {
    const response = await fetch(`${url.origin}/robots.txt`, {
      headers: {
        "user-agent": "SEO Wizard Bot/1.0 (+https://github.com/deannewton/seo-wizard)",
        accept: "text/plain",
      },
    });

    if (!response.ok) return null;
    const text = await response.text();
    return parseRobots(text);
  } catch {
    return null;
  }
}

function parseRobots(text: string): RobotsRules {
  const lines = text.split(/\r?\n/);
  const rules: RobotsRules = { disallows: [], allows: [] };
  let relevant = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const [directive, value = ""] = line.split(":").map((part) => part.trim());

    if (/^user-agent$/i.test(directive)) {
      relevant = value === "*";
    } else if (!relevant) {
      continue;
    } else if (/^disallow$/i.test(directive) && value) {
      rules.disallows.push(value);
    } else if (/^allow$/i.test(directive) && value) {
      rules.allows.push(value);
    } else if (/^crawl-delay$/i.test(directive) && value) {
      const delay = Number.parseFloat(value);
      if (!Number.isNaN(delay)) {
        rules.crawlDelay = delay * 1000;
      }
    }
  }

  return rules;
}

function isAllowed(url: URL, rules: RobotsRules): boolean {
  const path = url.pathname || "/";

  const allowMatch = longestMatch(path, rules.allows);
  const disallowMatch = longestMatch(path, rules.disallows);

  if (disallowMatch === null) return true;
  if (allowMatch === null) return disallowMatch.length === 0;

  return allowMatch.length >= disallowMatch.length;
}

function sleep(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function longestMatch(path: string, rules: string[]): string | null {
  let longest: string | null = null;
  for (const rule of rules) {
    if (!rule) continue;
    if (rule === "/") {
      if (!longest || rule.length > longest.length) longest = rule;
      continue;
    }
    if (path.startsWith(rule) && (!longest || rule.length > longest.length)) {
      longest = rule;
    }
  }
  return longest;
}
