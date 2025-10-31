export interface SiteInput {
  businessName: string;
  website: string;
  businessType: string;
  competitors: string[];
  businessAddress?: string;
  serviceArea?: string;
  googleBusinessProfile?: string;
  additionalNotes?: string;
  useSenseCheck?: boolean;
}

export interface KeywordStat {
  keyword: string;
  score: number;
  density: number;
  volume?: number;
  difficulty?: number;
  intent?: "informational" | "navigational" | "transactional" | "commercial";
  source?: "page" | "site" | "competitor" | "dataset" | "blended";
}

export interface PageAnalysis {
  url: string;
  titleTag: string;
  metaDescription: string;
  h1: string;
  wordCount: number;
  readability: number | null;
  keywords: KeywordStat[];
  headings: string[];
  status: "ok" | "error";
  error?: string;
}

export interface SiteSnapshot {
  domain: string;
  pages: PageAnalysis[];
  aggregatedKeywords: KeywordStat[];
  metrics?: DomainMetrics | null;
}

export interface MetadataRecommendation {
  title: string;
  description: string;
  h1: string;
  heroPitch: string;
  callToAction: string;
  suggestedUrl?: string;
}

export interface ContentGap {
  keyword: string;
  opportunity: string;
  recommendedAction: string;
  volume?: number;
  difficulty?: number;
  intent?: "informational" | "navigational" | "transactional" | "commercial";
}

export interface DomainMetrics {
  domainAuthority?: number;
  pageAuthority?: number;
  linkingDomains?: number;
  spamScore?: number;
}

export interface SeoReport {
  generatedAt: string;
  input: SiteInput;
  targetSite: SiteSnapshot;
  competitors: SiteSnapshot[];
  dataQualityWarnings?: string[];
  locality: {
    address?: string;
    serviceArea?: string;
    primaryLocation?: string;
  };
  senseCheck: {
    enabled: boolean;
    flaggedKeywords: Array<{ keyword: string; reason: string }>;
    notes: string[];
  };
  keywordOpportunities: {
    strongestKeywords: KeywordStat[];
    quickWins: KeywordStat[];
    contentGaps: ContentGap[];
    localityKeywords: KeywordStat[];
  };
  metadataPlan: {
    homepage: MetadataRecommendation;
    keyPages: MetadataRecommendation[];
  };
  pageBlueprints: {
    newPages: MetadataRecommendation[];
    optimizationChecklist: string[];
  };
  contentDrafts?: PageContentDraft[];
  siteArchitecture: SiteArchitectureEntry[];
  recommendations: string[];
}

export interface ContentSection {
  heading: string;
  body: string;
  purpose: string;
  targetKeywords: string[];
  internalLinks: string[];
}

export interface PageContentDraft {
  slug: string;
  title: string;
  url?: string;
  sections: ContentSection[];
  callToAction: string;
  summary: string;
}

export interface SiteArchitectureEntry {
  slug: string;
  title: string;
  type: "existing" | "new";
  purpose: string;
  targetKeywords: string[];
  status: "keep" | "optimise" | "create";
}
