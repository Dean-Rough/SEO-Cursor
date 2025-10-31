import type {
  PageStrategy,
  InternalLink,
  InternalLinkingBlueprint,
  PageKeywordMapping,
} from "./types";

/**
 * Builds comprehensive internal linking blueprint for site
 *
 * Strategy:
 * 1. Identify hub pages (high-value pillar content)
 * 2. Identify spoke pages (supporting content)
 * 3. Create logical linking patterns (hub-spoke model)
 * 4. Generate keyword-optimized anchor text
 * 5. Ensure no broken linking patterns
 *
 * @param pages - All page strategies
 * @param siteStructure - Site organization (optional, for better linking)
 * @returns Complete internal linking blueprint
 */
export function buildLinkingBlueprint(
  pages: PageStrategy[],
  siteStructure?: {
    homepage: string;
    servicePages: string[];
    blogPages: string[];
  }
): InternalLinkingBlueprint {
  const links: InternalLink[] = [];

  // Identify hub and spoke pages
  const hubPages = identifyHubPages(pages);
  const spokePages = pages.filter((p) => !hubPages.includes(p.url));

  // 1. Homepage links (homepage should link to all main hub pages)
  const homepage = pages.find((p) => p.pageType === "homepage");
  if (homepage) {
    hubPages
      .filter((hubUrl) => hubUrl !== homepage.url)
      .slice(0, 6) // Limit homepage links
      .forEach((hubUrl) => {
        const hubPage = pages.find((p) => p.url === hubUrl);
        if (hubPage) {
          links.push({
            fromUrl: homepage.url,
            toUrl: hubUrl,
            anchorText: hubPage.primaryKeyword || hubPage.cluster.name,
            context: "Main navigation or hero section",
          });
        }
      });
  }

  // 2. Hub-to-hub links (interconnect pillar content)
  for (let i = 0; i < hubPages.length; i++) {
    const hub = pages.find((p) => p.url === hubPages[i]);
    if (!hub) continue;

    // Link to 2-3 related hub pages
    const relatedHubs = findRelatedPages(hub, pages)
      .filter((p) => hubPages.includes(p.url) && p.url !== hub.url)
      .slice(0, 3);

    relatedHubs.forEach((relatedHub) => {
      links.push({
        fromUrl: hub.url,
        toUrl: relatedHub.url,
        anchorText:
          relatedHub.primaryKeyword ||
          relatedHub.cluster.name.toLowerCase(),
        context: "In main content, when discussing related topics",
      });
    });
  }

  // 3. Spoke-to-hub links (supporting content links to pillar pages)
  spokePages.forEach((spoke) => {
    // Find 2-3 relevant hub pages to link to
    const relevantHubs = findRelatedPages(spoke, pages)
      .filter((p) => hubPages.includes(p.url))
      .slice(0, 3);

    relevantHubs.forEach((hub, index) => {
      const position =
        index === 0
          ? "In introduction paragraph"
          : index === 1
            ? "In main content"
            : "In conclusion or CTA section";

      links.push({
        fromUrl: spoke.url,
        toUrl: hub.url,
        anchorText: hub.primaryKeyword || hub.cluster.name.toLowerCase(),
        context: position,
      });
    });
  });

  // 4. Service-to-service links (if applicable)
  const servicePages = pages.filter((p) => p.pageType === "service");
  servicePages.forEach((service) => {
    const relatedServices = findRelatedPages(service, servicePages)
      .filter((p) => p.url !== service.url)
      .slice(0, 2);

    relatedServices.forEach((related) => {
      links.push({
        fromUrl: service.url,
        toUrl: related.url,
        anchorText: `${related.primaryKeyword || related.cluster.name.toLowerCase()} services`,
        context: "In related services section at bottom of page",
      });
    });
  });

  // 5. Blog-to-service links (blog content should link to conversion pages)
  const blogPages = pages.filter((p) => p.pageType === "blog");
  blogPages.forEach((blog) => {
    const relevantServices = findRelatedPages(blog, servicePages).slice(0, 2);

    relevantServices.forEach((service, index) => {
      const position =
        index === 0
          ? "In introduction, when introducing topic"
          : "In CTA section at end of article";

      links.push({
        fromUrl: blog.url,
        toUrl: service.url,
        anchorText:
          index === 0
            ? service.primaryKeyword || service.cluster.name.toLowerCase()
            : `Book ${service.primaryKeyword || "our services"}`,
        context: position,
      });
    });
  });

  // 6. All pages link to contact (conversion path)
  const contactPage = pages.find((p) => p.pageType === "contact");
  if (contactPage) {
    pages
      .filter(
        (p) =>
          p.pageType !== "contact" &&
          p.pageType !== "homepage" &&
          p.status !== "keep"
      )
      .forEach((page) => {
        // Don't duplicate if already linked
        const alreadyLinked = links.some(
          (link) => link.fromUrl === page.url && link.toUrl === contactPage.url
        );

        if (!alreadyLinked) {
          links.push({
            fromUrl: page.url,
            toUrl: contactPage.url,
            anchorText: "Contact us",
            context: "In final CTA section",
          });
        }
      });
  }

  // 7. Deduplicate links
  const uniqueLinks = deduplicateLinks(links);

  // 8. Build inbound/outbound structure for each page
  const enrichedPages = pages.map((page) => ({
    ...page,
    internalLinks: {
      inbound: uniqueLinks.filter((link) => link.toUrl === page.url),
      outbound: uniqueLinks.filter((link) => link.fromUrl === page.url),
    },
  }));

  return {
    links: uniqueLinks,
    hubPages,
    spokePages: spokePages.map((p) => p.url),
  };
}

/**
 * Identifies hub pages (pillar content that should receive most links)
 *
 * Criteria:
 * 1. High keyword volume
 * 2. Service pages (transactional/commercial intent)
 * 3. High priority score
 * 4. Status "create" or "optimize" (not just "keep")
 */
export function identifyHubPages(pages: PageStrategy[]): string[] {
  const hubs: Array<{ url: string; score: number }> = [];

  pages.forEach((page) => {
    let score = 0;

    // Keyword volume (normalized)
    score += Math.min((page.cluster.totalVolume ?? 0) / 100, 50);

    // Page type weight
    if (page.pageType === "service") score += 30;
    else if (page.pageType === "homepage") score += 40;
    else if (page.pageType === "blog") score += 10;

    // Intent weight
    if (
      page.cluster.intent === "transactional" ||
      page.cluster.intent === "commercial"
    ) {
      score += 20;
    }

    // Priority score
    score += page.priority * 3;

    // Status weight (new/optimized pages are priorities)
    if (page.status === "create") score += 15;
    else if (page.status === "optimize") score += 10;

    hubs.push({ url: page.url, score });
  });

  // Sort by score and take top 20% (or minimum 3, maximum 10)
  const sortedHubs = hubs.sort((a, b) => b.score - a.score);
  const hubCount = Math.max(3, Math.min(10, Math.ceil(pages.length * 0.2)));

  return sortedHubs.slice(0, hubCount).map((h) => h.url);
}

/**
 * Finds pages related to a given page based on keyword overlap
 */
function findRelatedPages(
  targetPage: PageStrategy,
  allPages: PageStrategy[]
): PageStrategy[] {
  const related: Array<{ page: PageStrategy; score: number }> = [];

  const targetKeywords = new Set([
    targetPage.primaryKeyword,
    ...targetPage.secondaryKeywords,
  ]);

  const targetTokens = new Set(
    [...targetKeywords].flatMap((kw) => tokenize(kw))
  );

  allPages.forEach((page) => {
    if (page.url === targetPage.url) return;

    const pageKeywords = new Set([
      page.primaryKeyword,
      ...page.secondaryKeywords,
    ]);

    const pageTokens = new Set([...pageKeywords].flatMap((kw) => tokenize(kw)));

    // Calculate overlap
    const intersection = new Set(
      [...targetTokens].filter((x) => pageTokens.has(x))
    );

    if (intersection.size > 0) {
      const score = intersection.size / Math.min(targetTokens.size, pageTokens.size);
      related.push({ page, score });
    }
  });

  return related.sort((a, b) => b.score - a.score).map((r) => r.page);
}

/**
 * Tokenizes text for comparison
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

/**
 * Removes duplicate links (same from/to pair)
 */
function deduplicateLinks(links: InternalLink[]): InternalLink[] {
  const seen = new Set<string>();
  const unique: InternalLink[] = [];

  links.forEach((link) => {
    const key = `${link.fromUrl}::${link.toUrl}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(link);
    }
  });

  return unique;
}

/**
 * Validates linking blueprint for common issues
 */
export function validateLinkingBlueprint(
  blueprint: InternalLinkingBlueprint
): Array<{ issue: string; severity: "error" | "warning" }> {
  const issues: Array<{ issue: string; severity: "error" | "warning" }> = [];

  // Check for orphan pages (pages with no inbound links)
  const allUrls = new Set([
    ...blueprint.hubPages,
    ...blueprint.spokePages,
  ]);

  const linkedUrls = new Set(blueprint.links.map((link) => link.toUrl));

  allUrls.forEach((url) => {
    if (!linkedUrls.has(url) && url !== "/") {
      issues.push({
        issue: `Orphan page detected: ${url} has no inbound links`,
        severity: "warning",
      });
    }
  });

  // Check for excessive outbound links (>15 per page)
  const outboundCounts = new Map<string, number>();
  blueprint.links.forEach((link) => {
    outboundCounts.set(
      link.fromUrl,
      (outboundCounts.get(link.fromUrl) ?? 0) + 1
    );
  });

  outboundCounts.forEach((count, url) => {
    if (count > 15) {
      issues.push({
        issue: `${url} has excessive outbound links (${count}). Consider reducing to improve link equity distribution.`,
        severity: "warning",
      });
    }
  });

  // Check for broken link patterns (links to non-existent pages)
  const validUrls = allUrls;
  blueprint.links.forEach((link) => {
    if (!validUrls.has(link.fromUrl)) {
      issues.push({
        issue: `Link originates from non-existent page: ${link.fromUrl}`,
        severity: "error",
      });
    }
    if (!validUrls.has(link.toUrl)) {
      issues.push({
        issue: `Link points to non-existent page: ${link.toUrl}`,
        severity: "error",
      });
    }
  });

  return issues;
}

/**
 * Suggests additional internal links based on content gaps
 */
export function suggestAdditionalLinks(
  blueprint: InternalLinkingBlueprint,
  pages: PageStrategy[]
): InternalLink[] {
  const suggestions: InternalLink[] = [];

  // Find pages with too few inbound links
  const inboundCounts = new Map<string, number>();
  blueprint.links.forEach((link) => {
    inboundCounts.set(link.toUrl, (inboundCounts.get(link.toUrl) ?? 0) + 1);
  });

  pages.forEach((page) => {
    const inboundCount = inboundCounts.get(page.url) ?? 0;

    // High-priority pages should have at least 3-5 inbound links
    if (page.priority >= 7 && inboundCount < 3) {
      // Find related pages that could link here
      const relatedPages = findRelatedPages(page, pages)
        .filter((p) => {
          // Don't suggest links that already exist
          const linkExists = blueprint.links.some(
            (link) => link.fromUrl === p.url && link.toUrl === page.url
          );
          return !linkExists;
        })
        .slice(0, 3 - inboundCount);

      relatedPages.forEach((fromPage) => {
        suggestions.push({
          fromUrl: fromPage.url,
          toUrl: page.url,
          anchorText: page.primaryKeyword || page.cluster.name.toLowerCase(),
          context: "Additional contextual link in related content section",
        });
      });
    }
  });

  return suggestions;
}

/**
 * Generates anchor text variations to avoid over-optimization
 */
export function generateAnchorTextVariations(
  keyword: string
): string[] {
  const variations: string[] = [keyword];

  // Add natural variations
  variations.push(`learn more about ${keyword}`);
  variations.push(`our ${keyword} services`);
  variations.push(`${keyword} guide`);
  variations.push(`read more about ${keyword}`);

  return variations;
}

/**
 * Calculates linking metrics for reporting
 */
export function calculateLinkingMetrics(blueprint: InternalLinkingBlueprint): {
  totalLinks: number;
  averageLinksPerPage: number;
  hubPagesCount: number;
  spokePagesCount: number;
  orphanPagesCount: number;
  strongestPage: string;
  weakestPages: string[];
} {
  const allPages = new Set([
    ...blueprint.hubPages,
    ...blueprint.spokePages,
  ]);

  const inboundCounts = new Map<string, number>();
  blueprint.links.forEach((link) => {
    inboundCounts.set(link.toUrl, (inboundCounts.get(link.toUrl) ?? 0) + 1);
  });

  const orphans = [...allPages].filter(
    (url) => (inboundCounts.get(url) ?? 0) === 0 && url !== "/"
  );

  const sorted = [...inboundCounts.entries()].sort((a, b) => b[1] - a[1]);
  const weakest = [...allPages]
    .filter((url) => (inboundCounts.get(url) ?? 0) < 2)
    .slice(0, 5);

  return {
    totalLinks: blueprint.links.length,
    averageLinksPerPage: blueprint.links.length / allPages.size,
    hubPagesCount: blueprint.hubPages.length,
    spokePagesCount: blueprint.spokePages.length,
    orphanPagesCount: orphans.length,
    strongestPage: sorted[0]?.[0] ?? "",
    weakestPages: weakest,
  };
}
