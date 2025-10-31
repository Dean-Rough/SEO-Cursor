const DEFAULT_PROTOCOL = "https://";

export function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return `${DEFAULT_PROTOCOL}${trimmed}`;
}

export function getDomain(url: string): string {
  try {
    const parsed = new URL(normaliseUrl(url));
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isSameDomain(target: string, candidate: string): boolean {
  try {
    const targetUrl = new URL(normaliseUrl(target));
    const candidateUrl = new URL(normaliseUrl(candidate), targetUrl.origin);
    return (
      targetUrl.hostname.replace(/^www\./, "") ===
      candidateUrl.hostname.replace(/^www\./, "")
    );
  } catch {
    return false;
  }
}

export function resolveUrl(base: string, path: string): string {
  try {
    const baseUrl = new URL(normaliseUrl(base));
    return new URL(path, baseUrl).toString();
  } catch {
    return normaliseUrl(path);
  }
}
