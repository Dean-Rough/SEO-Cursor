# SEO Wizard Data Flow

This document summarises how inputs move through the app so you can diagnose or tweak each stage quickly.

## 1. User Input & Normalisation
- Start with the Google Business Profile URL. The “Prefill” action calls `/api/prefill`, scrapes `ld+json` data, and (when OpenAI credentials exist) enriches gaps before auto-populating the form (`src/lib/prefill.ts`, `src/app/api/prefill/route.ts`).
- You can override anything after prefill; the payload ultimately includes `businessName`, `website`, `businessType`, `businessAddress`, `serviceArea`, `googleBusinessProfile`, `additionalNotes`, `useSenseCheck`, and up to five competitor URLs.
- `generateSeoReport` (`src/lib/generator.ts:85`) validates the payload with `INPUT_SCHEMA` and normalises URLs (`normaliseUrl`).
- Location strings are tokenised into `LocationContext` (`buildLocationContext`, `src/lib/generator.ts:430`), which is reused for locality keywords and prompts.

## 2. Site & Competitor Analysis
- `analyseSite` (`src/lib/generator.ts:148`) calls `crawlSite` with a depth- and page-limited scrape (max 6 internal pages).
- `analyse-page.ts` extracts title/h1/count metrics and keyword stats via tokenisation + bigrams; nav noise is removed later in the pipeline.
- Competitors are crawled the same way (without deep internal pages) so keyword coverage reflects real-world rivals.

## 3. Keyword Strategy Assembly
1. **Dataset Selection**  
   - `findVerticalDataset` (`src/lib/keyword-dataset.ts:17`) scores dataset matches; longer, exact phrases win, so “hospitality interior design” trumps the generic restaurant set.
2. **Locality Injection**  
   - `enrichWithLocality` appends geo variants when address/service area exists.
3. **Merge & Sense Check**  
   - Site/competitor/dataset stats are deduped (`dedupeKeywordStats`).  
   - When `useSenseCheck` is true, the merged pool is sent to `senseCheckKeywords` (`src/lib/ai-utils.ts`) for AI validation; otherwise we skip the API call but log that the guardrails were bypassed.  
   - If OpenAI fails, we log a soft note and fall back to heuristic filters so the pipeline still runs.
4. **Safety Filters**  
   - Navigation keywords (`home`, `feed`, `portfolio`, etc.) are stripped via `filterNavigationStats` before ranking.  
   - Dataset keywords are now restricted to those already seen in site/competitor analysis (`src/lib/generator.ts:488`), preventing standalone “steak restaurant” bleed-through.  
   - Single-word or competitor-specific anomalies (e.g. venue names, UI labels) are discarded unless they align with core service/location tokens or curated dataset phrases.
   - On AI fallback, `filterStatsByRelevance` keeps only business/location-aligned tokens.
5. **Opportunities Breakdown**  
   - `buildKeywordOpportunities` produces strongest, quick wins, content gaps, and locality clusters for downstream use.

## 4. Metadata & Content Planning
- `buildMetadataPlan` and `buildPageBlueprints` turn keyword priorities into page-level recommendations. Nav phrases are filtered again before being used in site architecture or new page titles.
- `buildContentBriefs` feeds OpenAI `gpt-5` with detailed briefs. Every string going into the LLM is derived from prior analysis + user inputs; no static copy is injected.
- `generateContentDrafts` (OpenAI completion) only runs if `OPENAI_API_KEY` exists; otherwise the report ships without drafts.

## 5. Report Rendering
- `renderReportHtml` (`src/lib/report-to-html.ts`) assembles the printable deliverable. It includes guards for missing data (e.g., “Pending Moz data” when metrics fail).
- A dedicated sense-check summary now surfaces status, filtered keywords, and fallback notes so you can see why terms disappeared (or why nothing was filtered).
- Navigation-only keyword sets surface as “No validated keywords…” rather than filler text.

## 6. Common Sources of Contamination & How We Mitigate
- **Legacy Dataset Terms** – Previously, the restaurant dataset could dominate. Now we:  
  - Score datasets by specificity,  
  - Filter navigation tokens, and  
  - Drop dataset keywords not corroborated by crawl data.
- **Sense Check Failures** – When OpenAI is down, we still enforce relevance heuristics to avoid generic SEO copy.
- **Nav/Template Keywords** – Filtered at both keyword ranking and site architecture stages so menu items don’t appear as strategic terms.

## 7. Tweaking & Extensibility
- Adjust dataset coverage in `src/lib/keyword-dataset.ts`—the affinity scoring makes it safe to add mixed verticals without fear of bleed-through.
- Update navigation/utility keyword lists in `src/lib/generator.ts` (`NAV_KEYWORD_STRINGS`, `ARCHITECTURE_UTILITY_SLUGS`) when your clients use different chrome labels.
- Modify AI prompts in `src/lib/ai-utils.ts` and `src/lib/content-writer.ts` to change tone or constraints. Keep tests updated to lock expectations.
- Integration/regression tests live under `tests/`; add new fixtures when you introduce industries with unusual vocabulary.

With this map you can trace any odd output back to its source and adjust the relevant filters or prompts without guesswork.
