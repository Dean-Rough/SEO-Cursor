import { describe, expect, it } from "vitest";
import { generatorTestUtils } from "../src/lib/generator";
import type { KeywordStat } from "../src/lib/types";

const {
  buildMetadata,
  buildContentGap,
  defaultCallToAction,
  inferIntent,
  shouldSkipArchitectureSlug,
  isNavigationKeyword,
  filterStatsByRelevance,
  buildKeywordRelevanceContext,
} = generatorTestUtils;

describe("generator helpers", () => {
  it("buildMetadata weaves business name into natural copy", () => {
    const metadata = buildMetadata({
      businessName: "Rough",
      businessType: "Commercial Interior Design",
      mainKeyword: "hospitality interior design",
      secondaryKeyword: "restaurant fit out",
    });

    expect(metadata.description).toContain(
      "Rough specialises in hospitality interior design for commercial interior design engagements."
    );
    expect(metadata.description).not.toContain("Discover");
    expect(metadata.h1).toBe("Hospitality Interior Design with Rough");
  });

  it("buildContentGap annotates opportunity and recommended action", () => {
    const keyword: KeywordStat = {
      keyword: "restaurant fit out",
      score: 32,
      density: 0,
      volume: 320,
      difficulty: 48,
      intent: "transactional",
      source: "competitor",
    };

    const gap = buildContentGap(keyword);

    expect(gap.opportunity).toContain('~320 searches/mo');
    expect(gap.recommendedAction).toContain("conversion-focused service page");
    expect(gap.intent).toBe("transactional");
  });

  it("defaultCallToAction adapts CTA to business type", () => {
    expect(defaultCallToAction("Hospitality Studio")).toBe("Schedule a project discovery call");
    expect(defaultCallToAction("Strategy Agency")).toBe("Book a strategy call");
    expect(defaultCallToAction("Product Manufacturer")).toBe("Start your project");
  });

  it("inferIntent classifies keyword intent heuristically", () => {
    expect(inferIntent("interior design tips")).toBe("informational");
    expect(inferIntent("interior design agency near me")).toBe("transactional");
    expect(inferIntent("best interior design software")).toBe("commercial");
  });

  it("shouldSkipArchitectureSlug ignores utility paths", () => {
    expect(shouldSkipArchitectureSlug("cart")).toBe(true);
    expect(shouldSkipArchitectureSlug("about")).toBe(false);
  });

  it("isNavigationKeyword spots navigation-only phrases", () => {
    expect(isNavigationKeyword("home portfolio")).toBe(true);
    expect(isNavigationKeyword("hospitality interior design")).toBe(false);
  });

  it("prunes irrelevant competitor-only tokens when sense check is unavailable", () => {
    const context = buildKeywordRelevanceContext({
      businessName: "Rough",
      businessType: "Commercial Interior Design",
      additionalNotes: undefined,
      locationTerms: ["edinburgh", "scotland"],
      siteKeywords: [
        {
          keyword: "interior design scotland",
          score: 12,
          density: 0.4,
          source: "site",
        },
      ] satisfies KeywordStat[],
      competitorKeywords: [
        {
          keyword: "bar interior design",
          score: 18,
          density: 0.3,
          source: "competitor",
        },
      ] satisfies KeywordStat[],
      datasetKeywords: [
        {
          keyword: "hospitality interior design",
          score: 22,
          density: 0.2,
          source: "dataset",
        },
      ] satisfies KeywordStat[],
    });

    const filtered = filterStatsByRelevance(
      [
        {
          keyword: "ovo hydro",
          score: 30,
          density: 0.5,
          source: "competitor",
        },
        {
          keyword: "menu",
          score: 24,
          density: 0.4,
          source: "site",
        },
        {
          keyword: "bar interior design",
          score: 18,
          density: 0.3,
          source: "competitor",
        },
      ],
      context
    );

    expect(filtered.map((entry) => entry.keyword)).toEqual([
      "bar interior design",
    ]);
  });
});
