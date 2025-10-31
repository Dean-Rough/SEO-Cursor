import { describe, expect, it } from "vitest";
import { renderReportHtml } from "../src/lib/report-to-html";
import type { KeywordStat, SeoReport } from "../src/lib/types";

function buildStubReport(overrides: Partial<SeoReport> = {}): SeoReport {
  const base: SeoReport = {
    generatedAt: "2025-01-10T12:00:00.000Z",
    input: {
      businessName: "Rough",
      website: "https://rough.ink",
      businessType: "Commercial Interior Design",
      competitors: [],
      businessAddress: undefined,
      serviceArea: "Scotland",
      googleBusinessProfile: undefined,
      additionalNotes: undefined,
      useSenseCheck: true,
    },
    targetSite: {
      domain: "rough.ink",
      pages: [
        {
          url: "https://rough.ink/",
          titleTag: "Rough | Commercial Interior Design",
          metaDescription: "Rough specialises in hospitality interior design.",
          h1: "Spaces that earn attention",
          wordCount: 420,
          readability: 45,
          keywords: [
            {
              keyword: "hospitality interior design",
              score: 18,
              density: 0.6,
              source: "site",
            },
          ] satisfies KeywordStat[],
          headings: [],
          status: "ok",
        },
      ],
      aggregatedKeywords: [],
      metrics: {
        domainAuthority: 24,
        pageAuthority: 26,
        linkingDomains: 120,
        spamScore: 2,
      },
    },
    competitors: [
      {
        domain: "compete.co.uk",
        pages: [
          {
            url: "https://compete.co.uk",
            titleTag: "Compete | Hospitality Interior Design",
            metaDescription: "Compete designs award-winning hospitality spaces.",
            h1: "Hospitality interiors that convert",
            wordCount: 510,
            readability: 47,
            keywords: [
              {
                keyword: "restaurant fit out",
                score: 27,
                density: 0.9,
                source: "competitor",
              },
            ] satisfies KeywordStat[],
            headings: [],
            status: "ok",
          },
        ],
        aggregatedKeywords: [],
        metrics: null,
      },
    ],
    locality: {
      address: undefined,
      serviceArea: "Scotland",
      primaryLocation: "scotland",
    },
    senseCheck: {
      enabled: true,
      flaggedKeywords: [],
      notes: [],
    },
    keywordOpportunities: {
      strongestKeywords: [
        {
          keyword: "hospitality interior design",
          score: 26,
          density: 0.4,
          volume: 880,
          difficulty: 48,
          source: "competitor",
        },
      ],
      quickWins: [],
      contentGaps: [
        {
          keyword: "restaurant fit out",
          opportunity: 'High-intent buyers searching "restaurant fit out" default to competitors (~260 searches/mo).',
          recommendedAction: "Build a conversion-focused service page with proposition stacks, case studies, and prominent enquiry CTAs.",
        },
      ],
      localityKeywords: [],
    },
    metadataPlan: {
      homepage: {
        title: "Hospitality Interior Design | Restaurant Fit Out | Rough",
        description: "Rough specialises in hospitality interior design for commercial interior design engagements. We also capture demand around restaurant fit out. Explore recent work and request a consultation.",
        h1: "Hospitality Interior Design with Rough",
        heroPitch:
          'Rough pairs commercial interior design insight with search intelligence to win "hospitality interior design" moments.',
        callToAction: "Schedule a project discovery call",
        suggestedUrl: "/",
      },
      keyPages: [],
    },
    pageBlueprints: {
      newPages: [],
      optimizationChecklist: [
        "Ensure each page has a single, descriptive H1 with target keyword variants.",
      ],
    },
    contentDrafts: [],
    siteArchitecture: [],
    recommendations: [
      "Centre page messaging around high-value themes: hospitality interior design.",
    ],
  };

  return { ...base, ...overrides };
}

describe("renderReportHtml", () => {
  it("renders gracefully when optional sections are empty", () => {
    const report = buildStubReport();
    const html = renderReportHtml(report);

    expect(html).not.toContain("Production-Ready Content Drafts");
    expect(html).toContain("Recommendations");
  });

  it("surfaces helpful fallback messaging for empty keyword sets", () => {
    const report = buildStubReport();
    const html = renderReportHtml(report);

    expect(html).toContain("No validated keywords surfaced yet—rerun the crawl or widen the dataset to unlock insights.");
  });

  it("shows pending Moz messaging when competitor metrics are unavailable", () => {
    const report = buildStubReport();
    const html = renderReportHtml(report);

    expect(html).toContain("Pending Moz data");
    expect(html).toContain("Pending");
  });

  it("prints sense-check summary with filtered keywords", () => {
    const report = buildStubReport({
      senseCheck: {
        enabled: true,
        flaggedKeywords: [
          {
            keyword: "rgb process",
            reason: "Navigation/ui term not tied to the business offering.",
          },
        ],
        notes: ["Removed off-topic navigation terms before ranking."],
      },
    });
    const html = renderReportHtml(report);

    expect(html).toContain("Sense check active");
    expect(html).toContain("rgb process");
    expect(html).toContain("Removed off-topic navigation terms before ranking.");
  });
});
