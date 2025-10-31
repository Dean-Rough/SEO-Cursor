import { describe, expect, it } from "vitest";
import {
  findVerticalDataset,
  matchDatasetKeywords,
  scoreDatasetKeyword,
} from "@/lib/keyword-dataset";

describe("keyword dataset", () => {
  it("matches hospitality businesses", () => {
    const dataset = findVerticalDataset("Steak restaurant in Glasgow");
    expect(dataset.vertical).toBe("restaurant");
  });

  it("prioritises hospitality interior design dataset for design studios", () => {
    const dataset = findVerticalDataset("Hospitality interior design studio");
    expect(dataset.vertical).toBe("hospitality interior design");
  });

  it("returns keyword insights for hospitality", () => {
    const keywords = matchDatasetKeywords("Steak restaurant in Glasgow");
    const sundayRoast = keywords.find((entry) => entry.keyword === "sunday roast");
    expect(sundayRoast).toBeDefined();
    expect(sundayRoast?.intent).toBe("transactional");
  });

  it("avoids restaurant-only keywords when business type is design-led", () => {
    const keywords = matchDatasetKeywords("Hospitality interior design studio");
    const hasCocktail = keywords.some((entry) => entry.keyword === "cocktail bar");
    expect(hasCocktail).toBe(false);
    const hasHospitalityDesign = keywords.some(
      (entry) => entry.keyword === "hospitality interior design"
    );
    expect(hasHospitalityDesign).toBe(true);
  });

  it("scores dataset keywords with difficulty weighting", () => {
    const entry = matchDatasetKeywords("seo agency").find(
      (keyword) => keyword.keyword === "seo agency"
    );
    expect(entry).toBeDefined();
    const score = entry ? scoreDatasetKeyword(entry) : 0;
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(200);
  });
});
