import { normaliseUrl } from "./url";

const REQUEST_TIMEOUT = 15000;

export async function fetchPageHtml(
  url: string
): Promise<{ url: string; ok: boolean; html: string; error?: string }> {
  const resolvedUrl = normaliseUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(resolvedUrl, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; SEOWizardBot/1.0; +SEO Analysis Tool)",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        url: resolvedUrl,
        ok: false,
        html: "",
        error: `Request failed with status ${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    const isHtml =
      contentType.includes("text/html") ||
      contentType.includes("application/xhtml+xml") ||
      (contentType === "" && resolvedUrl.endsWith(".html"));
    if (!isHtml) {
      return {
        url: resolvedUrl,
        ok: false,
        html: "",
        error: `Unsupported content-type: ${contentType || "unknown"}`,
      };
    }

    const html = await response.text();
    return { url: resolvedUrl, ok: true, html };
  } catch (error) {
    return {
      url: resolvedUrl,
      ok: false,
      html: "",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error while fetching page",
    };
  } finally {
    clearTimeout(timeout);
  }
}
