export type KeywordIntent = "informational" | "navigational" | "transactional" | "commercial";

export interface KeywordDatasetEntry {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: KeywordIntent;
  variants?: string[];
}

interface VerticalKeywordDataset {
  vertical: string;
  matches: string[];
  keywords: KeywordDatasetEntry[];
}

export const keywordDataset: VerticalKeywordDataset[] = [
  {
    vertical: "restaurant",
    matches: ["restaurant", "bar", "dining", "steak", "cafe", "hospitality"],
    keywords: [
      {
        keyword: "best steak restaurant",
        volume: 5400,
        difficulty: 32,
        intent: "transactional",
        variants: ["best steakhouse", "top steak restaurant"],
      },
      {
        keyword: "private dining",
        volume: 14800,
        difficulty: 41,
        intent: "transactional",
        variants: ["private dining room", "exclusive dining"],
      },
      {
        keyword: "cocktail bar",
        volume: 90500,
        difficulty: 47,
        intent: "transactional",
        variants: ["best cocktail bar", "cocktail lounge"],
      },
      {
        keyword: "pre theatre menu",
        volume: 5400,
        difficulty: 29,
        intent: "transactional",
        variants: ["pre theatre dinner", "pre theatre dining"],
      },
      {
        keyword: "sunday roast",
        volume: 60500,
        difficulty: 36,
        intent: "transactional",
        variants: ["best sunday roast", "sunday lunch"],
      },
    ],
  },
  {
    vertical: "hospitality interior design",
    matches: [
      "interior design",
      "hospitality design",
      "restaurant design",
      "fit out",
      "studio",
      "design lab",
    ],
    keywords: [
      {
        keyword: "hospitality interior design",
        volume: 4400,
        difficulty: 42,
        intent: "commercial",
        variants: [
          "hospitality interior designer",
          "restaurant interior design",
          "bar interior design",
        ],
      },
      {
        keyword: "restaurant fit out",
        volume: 3600,
        difficulty: 38,
        intent: "transactional",
        variants: ["restaurant fit out company", "restaurant refurbishment"],
      },
      {
        keyword: "bar interior design",
        volume: 2900,
        difficulty: 34,
        intent: "commercial",
      },
      {
        keyword: "hotel lobby design",
        volume: 2400,
        difficulty: 41,
        intent: "informational",
      },
      {
        keyword: "experience design studio",
        volume: 1600,
        difficulty: 33,
        intent: "commercial",
      },
      {
        keyword: "retail interior designer",
        volume: 1900,
        difficulty: 39,
        intent: "commercial",
      },
      {
        keyword: "brand environment agency",
        volume: 1200,
        difficulty: 36,
        intent: "commercial",
      },
      {
        keyword: "interior design studio edinburgh",
        volume: 720,
        difficulty: 31,
        intent: "commercial",
      },
      {
        keyword: "commercial interior design scotland",
        volume: 540,
        difficulty: 34,
        intent: "commercial",
      },
      {
        keyword: "hospitality design trends",
        volume: 1300,
        difficulty: 29,
        intent: "informational",
      },
    ],
  },
  {
    vertical: "agency",
    matches: ["agency", "consultancy", "marketing", "seo", "ppc", "digital"],
    keywords: [
      {
        keyword: "seo agency",
        volume: 14800,
        difficulty: 51,
        intent: "commercial",
        variants: ["seo company", "search agency"],
      },
      {
        keyword: "digital marketing agency",
        volume: 90500,
        difficulty: 58,
        intent: "commercial",
        variants: ["marketing agency", "online marketing agency"],
      },
      {
        keyword: "ppc management",
        volume: 9900,
        difficulty: 48,
        intent: "transactional",
        variants: ["ppc agency", "pay per click management"],
      },
      {
        keyword: "content marketing strategy",
        volume: 6600,
        difficulty: 43,
        intent: "informational",
        variants: ["content strategy", "content plan"],
      },
      {
        keyword: "seo audit",
        volume: 22200,
        difficulty: 37,
        intent: "commercial",
        variants: ["site audit", "technical seo audit"],
      },
    ],
  },
  {
    vertical: "saas",
    matches: ["software", "saas", "platform", "app", "product", "cloud"],
    keywords: [
      {
        keyword: "product roadmap tool",
        volume: 4400,
        difficulty: 42,
        intent: "commercial",
        variants: ["product roadmap software", "roadmap app"],
      },
      {
        keyword: "customer success platform",
        volume: 2900,
        difficulty: 38,
        intent: "commercial",
        variants: ["cs platform", "customer success software"],
      },
      {
        keyword: "b2b lead generation software",
        volume: 1600,
        difficulty: 45,
        intent: "commercial",
        variants: ["lead gen platform", "b2b prospecting tool"],
      },
      {
        keyword: "subscription analytics",
        volume: 1900,
        difficulty: 33,
        intent: "informational",
        variants: ["saas analytics", "subscription metrics"],
      },
      {
        keyword: "churn prediction",
        volume: 2900,
        difficulty: 31,
        intent: "informational",
        variants: ["predict churn", "saas churn"],
      },
    ],
  },
  {
    vertical: "ecommerce",
    matches: ["ecommerce", "retail", "store", "shop", "boutique", "merch"],
    keywords: [
      {
        keyword: "conversion rate optimisation",
        volume: 18100,
        difficulty: 55,
        intent: "informational",
      },
      {
        keyword: "shopify seo",
        volume: 14800,
        difficulty: 49,
        intent: "informational",
      },
      {
        keyword: "product description template",
        volume: 9900,
        difficulty: 32,
        intent: "informational",
      },
      {
        keyword: "ecommerce merchandising",
        volume: 4400,
        difficulty: 37,
        intent: "informational",
      },
      {
        keyword: "abandoned cart email",
        volume: 27100,
        difficulty: 41,
        intent: "informational",
      },
    ],
  },
];

function normaliseBusinessType(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function computeDatasetAffinity(dataset: VerticalKeywordDataset, businessType: string) {
  const normalised = normaliseBusinessType(businessType);
  if (!normalised) return 0;

  let bestMatchScore = 0;
  for (const match of dataset.matches) {
    const normalisedMatch = normaliseBusinessType(match);
    if (!normalisedMatch) continue;
    if (!normalised.includes(normalisedMatch)) continue;
    const wordCount = normalisedMatch.split(" ").length;
    const lengthScore = normalisedMatch.replace(/\s+/g, "").length;
    const multiWordBonus = wordCount > 1 ? wordCount * 12 : 6;
    const exactPhraseBonus = normalised.includes(` ${normalisedMatch} `) ? 10 : 0;
    const score = lengthScore + multiWordBonus + exactPhraseBonus;
    if (score > bestMatchScore) {
      bestMatchScore = score;
    }
  }

  if (normalised.includes(normaliseBusinessType(dataset.vertical))) {
    bestMatchScore += dataset.vertical.length * 2;
  }

  return bestMatchScore;
}

export function findVerticalDataset(businessType: string) {
  const scores = keywordDataset.map((dataset) => ({
    dataset,
    score: computeDatasetAffinity(dataset, businessType),
  }));

  const best = scores.reduce(
    (winner, current) => (current.score > winner.score ? current : winner),
    { dataset: keywordDataset[0], score: -Infinity }
  );

  return best.score > 0 ? best.dataset : keywordDataset[0];
}

export function matchDatasetKeywords(
  businessType: string
): KeywordDatasetEntry[] {
  const dataset = findVerticalDataset(businessType);
  return dataset.keywords;
}

export function scoreDatasetKeyword(entry: KeywordDatasetEntry) {
  const base = entry.volume / 100;
  const difficultyPenalty = Math.max(10, 100 - entry.difficulty);
  return Math.round((base * (difficultyPenalty / 100) + Number.EPSILON) * 100) / 100;
}

export function enrichWithLocality(
  keywords: KeywordDatasetEntry[],
  location?: string,
  serviceArea?: string
) {
  if (!location && !serviceArea) return keywords;

  const localityTerms = Array.from(
    new Set(
      [location, serviceArea]
        .filter(Boolean)
        .flatMap((value) =>
          value
            ? value
                .split(/,|\//)
                .map((token) => token.trim().toLowerCase())
                .filter(Boolean)
            : []
        )
    )
  );

  if (!localityTerms.length) return keywords;

  const augmented = [...keywords];
  localityTerms.forEach((term) => {
    augmented.push({
      keyword: `interior design ${term}`,
      volume: 400,
      difficulty: 30,
      intent: "commercial",
    });
    augmented.push({
      keyword: `hospitality design ${term}`,
      volume: 320,
      difficulty: 32,
      intent: "commercial",
    });
  });

  return augmented;
}
