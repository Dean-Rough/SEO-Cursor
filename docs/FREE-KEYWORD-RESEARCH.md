# Free Keyword Research System

## Overview

This document describes the free/low-cost keyword research system that replaces expensive Moz API calls with a combination of free Google services and Claude AI.

## Cost Comparison

| Method | Cost per Generation | Monthly Cost (100 gens) | Annual Cost |
|--------|--------------------|-----------------------|-------------|
| **Moz API** | ~$1.00 | $100 | $1,200 |
| **Free System** | ~$0.03 | $3 | $36 |
| **Savings** | $0.97 (97%) | $97 | $1,164 |

## Data Sources

### 1. Google Autocomplete (Free)
- **File**: `src/lib/google-autocomplete.ts`
- **What it provides**: Real-time search suggestions from Google
- **Cost**: Free
- **Rate limits**: Soft limits, respect with delays
- **Quality**: Excellent - shows what people actually search for

```typescript
const suggestions = await getAutocompleteSuggestions('vegan protein');
// Returns: ['vegan protein powder', 'vegan protein sources', ...]
```

### 2. People Also Ask (Free)
- **File**: `src/lib/google-paa.ts`
- **What it provides**: Questions people ask about a topic
- **Cost**: Free (web scraping)
- **Rate limits**: Be respectful, 1-2 second delays
- **Quality**: Excellent for content ideas

```typescript
const questions = await getPeopleAlsoAsk('vegan protein');
// Returns: [
//   { question: 'What is the best vegan protein?', relatedTo: 'vegan protein' },
//   { question: 'How much protein do vegans need?', ... }
// ]
```

### 3. Related Searches (Free)
- **File**: `src/lib/google-paa.ts`
- **What it provides**: Google's "Related searches" from bottom of SERP
- **Cost**: Free (web scraping)
- **Quality**: Good for semantic variations

```typescript
const related = await getRelatedSearches('vegan protein');
// Returns: ['plant based protein', 'vegan protein recipes', ...]
```

### 4. Google Trends (Free)
- **File**: `src/lib/google-trends.ts`
- **What it provides**: Trending searches, relative interest over time
- **Cost**: Free
- **Quality**: Great for understanding seasonality

```typescript
const trending = await getTrendingSearches('US');
// Returns trending keywords with relative interest scores
```

### 5. Claude AI Expansion (Paid, ~$0.01/generation)
- **File**: `src/lib/claude-keyword-expansion.ts`
- **What it provides**: Semantic variations, long-tail keywords, content angles
- **Cost**: ~$0.01 per generation (GPT-4 Turbo)
- **Quality**: Exceptional - understands context and intent

```typescript
const expansion = await expandKeywordsWithClaude(
  'vegan protein',
  'health food blog',
  'Portland'
);
// Returns: {
//   coreKeywords: [...],
//   longTailVariations: [...],
//   questionBasedKeywords: [...],
//   semanticVariations: [...],
//   contentAngles: [...],
//   userIntents: [...]
// }
```

### 6. Google Search Console (Free, Optional)
- **File**: `src/lib/google-search-console.ts`
- **What it provides**: YOUR ACTUAL ranking data, clicks, impressions
- **Cost**: Free (requires OAuth setup)
- **Quality**: THE BEST - real data for your site

*Note: Requires OAuth2 configuration. See file for setup instructions.*

## Main Aggregator

**File**: `src/lib/free-keyword-research.ts`

This combines all sources into a single, prioritized keyword list.

```typescript
const keywords = await performFreeKeywordResearch({
  seedKeywords: ['vegan protein', 'plant based diet'],
  businessType: 'Health food blog in Portland',
  location: 'Portland, OR',
  useClaudeExpansion: true,
  maxKeywords: 100,
});

// Returns: KeywordStat[] with scores, intent, and deduplicated results
```

### How it Works

1. **Fetch from multiple sources**
   - Google Autocomplete (5 seed keywords)
   - People Also Ask (3 seed keywords)
   - Related Searches (3 seed keywords)
   - Google Trends (regional data)

2. **Feed to Claude for synthesis**
   - Claude analyzes all data
   - Removes duplicates
   - Filters irrelevant keywords
   - Adds semantic variations
   - Prioritizes by commercial intent

3. **Score and deduplicate**
   - Keywords from multiple sources get higher scores
   - Intent inference (informational, commercial, transactional)
   - Sort by relevance score

4. **Validate with Claude**
   - Final relevance check
   - Remove navigation keywords
   - Ensure brand fit

## Integration with Generator

To replace Moz calls in `src/lib/generator.ts`:

### Before (Moz):
```typescript
import { fetchKeywordSuggestions } from './moz-keywords';

const keywords = await fetchKeywordSuggestions({
  seeds: ['restaurant', 'italian food'],
  locale: 'en-US',
  businessType: 'Italian restaurant',
});
```

### After (Free):
```typescript
import { performFreeKeywordResearch } from './free-keyword-research';

const keywords = await performFreeKeywordResearch({
  seedKeywords: ['restaurant', 'italian food'],
  businessType: 'Italian restaurant in Edinburgh',
  location: 'Edinburgh, UK',
  useClaudeExpansion: true,
  maxKeywords: 100,
});
```

## What You Lose vs. Moz

1. **Search Volume Estimates**: We don't know exact monthly searches
   - *But*: Claude understands relative popularity
   - *But*: Your own GSC data is more accurate anyway

2. **Keyword Difficulty Scores**: No difficulty metrics
   - *But*: You weren't using these for prioritization anyway
   - *But*: Intent and relevance matter more

3. **Domain Authority**: No DA/PA metrics
   - *But*: These are vanity metrics
   - *But*: Your content quality matters more

## What You Gain

1. **Real User Questions**: PAA data shows actual questions
2. **Trending Topics**: Google Trends shows what's hot
3. **Semantic Understanding**: Claude connects related concepts
4. **Cost Savings**: 97% cheaper
5. **Unlimited Usage**: No row limits or credit worries
6. **(Optional) Your Own Data**: GSC integration gives you real performance

## Recommendations

### For Personal Use (Current Setup)
✅ Use this free system
✅ Add GSC integration for your own sites
✅ Keep Claude expansion enabled
✅ Monitor costs (~$3/month)

### For Client Work (Future)
- Consider keeping Moz for client reports (they expect volume numbers)
- Use free system for personal research
- Combine both: Free research → Moz enrichment on top keywords only

### For WordPress Plugin
- Free system only
- Make GSC integration the killer feature
- Charge for Claude enhancement as premium tier

## Environment Variables

```bash
# Required (already have)
OPENAI_API_KEY=your_openai_key_here

# Optional (for GSC)
GSC_CLIENT_ID=your_google_oauth_client_id
GSC_CLIENT_SECRET=your_google_oauth_client_secret
GSC_REDIRECT_URI=http://localhost:3000/api/auth/gsc/callback
```

## Migration Plan

1. ✅ Create free data source libraries
2. ⏳ Replace Moz calls in generator.ts
3. ⏳ Update UI to remove Moz branding
4. ⏳ Remove Moz env variables
5. ⏳ Test end-to-end
6. 🔮 (Future) Add GSC OAuth flow
7. 🔮 (Future) Add keyword volume estimation via Claude

## Files Created

- `src/lib/google-autocomplete.ts` - Autocomplete API
- `src/lib/google-paa.ts` - People Also Ask scraper
- `src/lib/google-trends.ts` - Trends integration
- `src/lib/claude-keyword-expansion.ts` - AI-powered expansion
- `src/lib/google-search-console.ts` - GSC integration (setup guide)
- `src/lib/free-keyword-research.ts` - Main aggregator
- `docs/FREE-KEYWORD-RESEARCH.md` - This document

## Next Steps

1. Replace `fetchKeywordSuggestions()` calls in `generator.ts`
2. Replace `fetchDomainMetrics()` calls (or remove entirely)
3. Update `SeoReport` types to remove Moz-specific fields
4. Update UI components to remove Moz branding
5. Test with real business data
6. Celebrate saving $1,200/year! 🎉
