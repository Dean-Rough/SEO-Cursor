import { NextResponse } from "next/server";
import { z } from "zod";
import { enrichBusinessProfile } from "@/lib/prefill";

const MAX_INLINE_REDIRECTS = 4;

function decodeRedirectValue(value: string): string {
  let decoded = value;
  decoded = decoded.replace(/&amp;/gi, "&").replace(/&#x2f;/gi, "/").replace(/&#47;/gi, "/");
  decoded = decoded
    .replace(/\\u003d/gi, "=")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u002f/gi, "/")
    .replace(/\\\//g, "/");

  try {
    const normalised = decoded.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return JSON.parse(`"${normalised}"`);
  } catch {
    return decoded;
  }
}

function extractInlineRedirect(html: string, baseUrl: string): string | null {
  const metaMatch = html.match(
    /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"';>]+)[^"']*["']/i
  );
  if (metaMatch?.[1]) {
    try {
      const target = decodeRedirectValue(metaMatch[1]);
      return new URL(target, baseUrl).toString();
    } catch {
      // ignore invalid URL
    }
  }

  const scriptMatch = html.match(
    /window\.location(?:\.href|\.assign|\.replace)\((["'`])([^"'`]+)\1\)/i
  );
  if (scriptMatch?.[2]) {
    try {
      const target = decodeRedirectValue(scriptMatch[2]);
      return new URL(target, baseUrl).toString();
    } catch {
      // ignore invalid URL
    }
  }

  const dataUrlMatch = html.match(/data-url=(["'])([^"']+)\1/i);
  if (dataUrlMatch?.[2]) {
    try {
      const target = decodeRedirectValue(dataUrlMatch[2]);
      return new URL(target, baseUrl).toString();
    } catch {
      // ignore invalid URL
    }
  }

  const fallbackMatch = html.match(
    /(https:\/\/www\.google\.[^"'<>]+\/maps\/[^"'<>]+)/
  );
  if (fallbackMatch?.[1]) {
    try {
      const target = decodeRedirectValue(fallbackMatch[1]);
      return new URL(target, baseUrl).toString();
    } catch {
      // ignore invalid URL
    }
  }

  return null;
}

async function fetchProfileDocument(
  url: string,
  depth = 0,
  visited = new Set<string>()
): Promise<{ html: string; finalUrl: string; notes: string[] }> {
  if (depth > MAX_INLINE_REDIRECTS) {
    return {
      html: "",
      finalUrl: url,
      notes: ["Exceeded inline redirect attempts while loading Google Business Profile."],
    };
  }

  visited.add(url);

  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load Google Business Profile (status ${response.status}).`);
  }

  const html = await response.text();
  const resolvedUrl = response.url || url;
  const redirectTarget = extractInlineRedirect(html, resolvedUrl);

  if (redirectTarget && !visited.has(redirectTarget)) {
    const next = await fetchProfileDocument(redirectTarget, depth + 1, visited);
    return {
      html: next.html,
      finalUrl: next.finalUrl,
      notes: [
        `Followed inline redirect to ${redirectTarget}`,
        ...next.notes,
      ],
    };
  }

  return {
    html,
    finalUrl: resolvedUrl,
    notes: [],
  };
}

function extractCidFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (/maps\.app\.goo\.gl/i.test(url.hostname) && url.pathname.length > 1) {
      const shortMatch = url.pathname.match(/\/([A-Za-z0-9_-]+)/);
      if (shortMatch?.[1]) {
        return shortMatch[1];
      }
    }
    const directCid = url.searchParams.get("cid");
    if (directCid) return directCid;
    const queryCid = url.searchParams.get("query") ?? url.searchParams.get("q");
    if (queryCid) {
      const match = queryCid.match(/cid=(\d{5,})/i);
      if (match) return match[1];
    }
    const hashMatch = url.hash.match(/cid=(\d{5,})/i);
    if (hashMatch) return hashMatch[1];
  } catch {
    // ignore url parse failure
  }
  const inlineMatch = value.match(/cid=(\d{5,})/i);
  if (inlineMatch) return inlineMatch[1];
  return null;
}

function extractCidFromHtml(html: string): string | null {
  const patterns = [
    /["'?&]cid=(\d{5,})/i,
    /"cid":"(\d{5,})"/i,
    /\\u003dcid\\u003d(\d{5,})/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

const REQUEST_SCHEMA = z.object({
  googleBusinessProfile: z.string().url().or(z.string().min(10)),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { googleBusinessProfile } = REQUEST_SCHEMA.parse(payload);
    const fetchResult = await fetchProfileDocument(googleBusinessProfile);
    const result = await enrichBusinessProfile({
      profileUrl: fetchResult.finalUrl,
      html: fetchResult.html,
    });

    let combinedNotes = [...fetchResult.notes, ...result.notes];
    let prefillPayload = result.prefill;
    let hasData = Object.values(result.prefill).some(Boolean);

    if (!hasData) {
      const cidFromCurrent = extractCidFromHtml(fetchResult.html);
      const cidFromUrl =
        extractCidFromUrl(fetchResult.finalUrl) ??
        extractCidFromUrl(googleBusinessProfile);
      const cid = cidFromCurrent ?? cidFromUrl;
      if (cid) {
        combinedNotes.push(`Attempting CID fallback scrape for ${cid}.`);
        const fallbackUrl = `https://maps.google.com/maps?cid=${cid}&output=classic&dg=ntvo`;
        const fallbackFetch = await fetchProfileDocument(fallbackUrl);
        const fallbackResult = await enrichBusinessProfile({
          profileUrl: fallbackFetch.finalUrl,
          html: fallbackFetch.html,
        });
        combinedNotes = [
          ...combinedNotes,
          ...fallbackFetch.notes,
          ...fallbackResult.notes,
        ];
        prefillPayload = fallbackResult.prefill;
        hasData = Object.values(prefillPayload).some(Boolean);
      }
    }

    if (!hasData) {
      combinedNotes.push(
        "Unable to infer core services from the scraped content. Please enter the details manually."
      );
    }

    return NextResponse.json(
      {
        prefill: prefillPayload,
        notes: combinedNotes,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[prefill-api]", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unexpected error attempting to prefill from Google Business Profile.",
      },
      { status: 500 }
    );
  }
}
