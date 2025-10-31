import { env } from "./env";
import { normaliseUrl } from "./url";

const MOZ_ENDPOINT = "https://lsapi.seomoz.com/v2/url_metrics";

export interface MozMetrics {
  domainAuthority?: number;
  pageAuthority?: number;
  linkingDomains?: number;
  spamScore?: number;
}

interface MozApiResponse {
  results?: Array<{
    target: string;
    domain_authority?: number;
    page_authority?: number;
    linking_root_domains?: number;
    spam_score?: number;
  }>;
}

export async function fetchMozMetrics(targets: string[]): Promise<Map<string, MozMetrics>> {
  const authToken = env.MOZ_API?.replace(/-+$/, "");
  const uniqueTargets = Array.from(new Set(targets.filter(Boolean)));

  const metrics = new Map<string, MozMetrics>();

  if (!authToken || !uniqueTargets.length) {
    return metrics;
  }

  try {
    const response = await fetch(MOZ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targets: uniqueTargets.map((target) => {
          try {
            return new URL(target).origin;
          } catch {
            return normaliseUrl(target);
          }
        }),
      }),
    });

    if (!response.ok) {
      console.warn("[moz] Failed to load metrics", response.status, response.statusText);
      return metrics;
    }

    const data = (await response.json()) as MozApiResponse;
    for (const item of data.results ?? []) {
      if (!item.target) continue;
      const url = safeUrl(item.target);
      if (!url) continue;
      const domain = url.hostname.replace(/^www\./, "");
      metrics.set(domain, {
        domainAuthority: item.domain_authority ?? undefined,
        pageAuthority: item.page_authority ?? undefined,
        linkingDomains: item.linking_root_domains ?? undefined,
        spamScore: item.spam_score ?? undefined,
      });
    }
  } catch (error) {
    console.warn("[moz] Unexpected error fetching metrics", error);
  }

  return metrics;
}

function safeUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    try {
      return new URL(normaliseUrl(input));
    } catch {
      return null;
    }
  }
}
