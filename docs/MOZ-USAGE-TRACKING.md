# Moz API Usage Tracking

The SEO Wizard now tracks and displays exactly how many Moz API credits (rows) are consumed during each strategy generation.

## Features

### 1. Automatic Usage Tracking

Every Moz API call is automatically tracked via response headers:

```typescript
// In moz-client.ts
const rowsUsedHeader = response.headers.get("x-moz-rows-used");
const rowsUsed = rowsUsedHeader ? parseInt(rowsUsedHeader, 10) : 0;

if (rowsUsed > 0) {
  mozUsageLog.push({
    rowsUsed,
    method,
    timestamp: Date.now(),
  });
}
```

### 2. Per-Generation Tracking

Usage is tracked for the current generation session:
- **Cleared at start** of each generation
- **Accumulated during** keyword suggestions, competitor analysis, metrics fetch
- **Included in report** with breakdown by API method

### 3. Visual Usage Report

The Summary tab displays a "Moz API Usage" card showing:

**Total Rows Consumed:**
```
1,247 rows consumed
```

**Breakdown by API Method:**
```
data.keyword.suggestions.list    ×5 calls    450 rows
data.keyword.metrics.fetch        ×120 calls  720 rows
data.site.ranking-keywords.list   ×3 calls    77 rows
```

### 4. Console Logging

During generation, usage is logged to the console:

```
[moz-usage] data.keyword.suggestions.list: 90 rows (total: 90)
[moz-usage] data.keyword.metrics.fetch: 6 rows (total: 96)
[moz-usage] data.keyword.metrics.fetch: 6 rows (total: 102)
...
```

## Usage Patterns

### Typical Credit Consumption

Based on default settings, a typical generation uses:

| Operation | Calls | Rows per Call | Total Rows |
|-----------|-------|---------------|------------|
| Keyword suggestions | 5-10 | ~50-100 | 250-1000 |
| Keyword metrics | 50-200 | 1-10 | 50-2000 |
| Competitor ranking keywords | 3-5 | ~20-50 | 60-250 |
| Local keyword variants | 20-50 | 1-10 | 20-500 |
| **Total** | | | **~380-3750** |

### Factors Affecting Usage

1. **Number of competitors** - More competitors = more ranking keyword API calls
2. **Keyword diversity** - More unique keywords = more metrics fetch calls
3. **Local variants** - Generating local keywords increases metrics calls
4. **Business type complexity** - Complex services generate more seed keywords

## API Methods Tracked

### `data.keyword.suggestions.list`
- **Purpose:** Get keyword suggestions for seed terms
- **Cost:** ~50-100 rows per call
- **Frequency:** 1 call per seed keyword (typically 5-10 seeds)

### `data.keyword.metrics.fetch`
- **Purpose:** Get volume/difficulty for individual keywords
- **Cost:** 1-10 rows per call
- **Frequency:** 1 call per unique keyword (can be 50-200 keywords)

### `data.site.ranking-keywords.list`
- **Purpose:** Get competitor ranking keywords
- **Cost:** ~20-50 rows per call
- **Frequency:** 1 call per competitor (typically 3-5 competitors)

### `account.info`
- **Purpose:** Health check / quota verification
- **Cost:** 0 rows (no quota consumption)
- **Frequency:** Once per page load

## Optimizations

The system includes several optimizations to minimize credit usage:

### 1. Batch Processing
```typescript
const BATCH_SIZE = 20;
for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
  const batch = keywords.slice(i, i + BATCH_SIZE);
  await Promise.allSettled(batch.map(fetchMetrics));
}
```

### 2. Limits and Caps
```typescript
const MOZ_MAX_SEEDS = 10;           // Max seed keywords
const MOZ_SUGGESTION_LIMIT = 50;    // Max suggestions per seed
const MOZ_METRIC_LIMIT = 200;       // Max keywords to fetch metrics for
const MOZ_COMPETITOR_LIMIT = 50;    // Max competitor keywords per domain
```

### 3. Deduplication
```typescript
// Keywords are deduplicated before fetching metrics
const uniqueKeywords = Array.from(new Set(allKeywords.map(k => k.toLowerCase())));
```

### 4. Intelligent Filtering
- Navigation keywords filtered out (home, contact, login, etc.)
- Low-quality keywords skipped
- Irrelevant keywords removed via AI sense-check (optional)

## Configuration

### Adjust Usage Limits

Edit `/Users/deannewton/Projects/SEO Wizard/seo-wizard/src/lib/constants.ts`:

```typescript
// Reduce credit usage by lowering these limits
export const MOZ_MAX_SEEDS = 5;              // Default: 10
export const MOZ_SUGGESTION_LIMIT = 25;      // Default: 50
export const MOZ_METRIC_LIMIT = 100;         // Default: 200
export const MOZ_COMPETITOR_LIMIT = 25;      // Default: 50
export const MOZ_BATCH_SIZE = 10;            // Default: 20
```

**Trade-off:** Lower limits = fewer credits used, but less comprehensive keyword data.

## Monitoring Credit Usage

### 1. Check Remaining Credits

Call the health check endpoint:
```bash
curl http://localhost:3000/api/health/moz
```

Response includes:
```json
{
  "details": {
    "usage": {
      "rowsRemaining": 7253,
      "rowsUsed": 2747,
      "rowsLimit": 10000
    }
  }
}
```

### 2. View Usage in Report

After generation, check the Summary tab for the "Moz API Usage" card showing total rows consumed.

### 3. Console Logs

Watch server console during generation for real-time usage tracking.

## Cost Estimation

### By Plan Tier

Moz offers different API plans with varying row limits:

| Plan | Monthly Rows | Avg Generations | Cost per Generation |
|------|--------------|-----------------|---------------------|
| Standard | 50,000 | ~13-130 | 380-3750 rows |
| Medium | 200,000 | ~53-526 | 380-3750 rows |
| Large | 1,000,000 | ~266-2631 | 380-3750 rows |

### Calculation Formula

```
generations_per_month = monthly_row_limit / avg_rows_per_generation
```

**Example:**
- 50,000 rows/month ÷ 1,000 rows/generation = **50 generations/month**

## Troubleshooting

### High Credit Usage

If a generation consumes more credits than expected:

1. **Check competitor count** - Reduce competitors from 5 to 2-3
2. **Review keyword metrics limit** - Lower `MOZ_METRIC_LIMIT` from 200 to 100
3. **Disable local variants** - Comment out local keyword generation code
4. **Enable AI sense-check** - Filter out irrelevant keywords before fetching metrics

### Zero Credits Shown

If mozUsage is undefined or shows 0 rows:

1. **Check Moz configuration** - Ensure `MOZ_DATA_API_KEY` is set
2. **Verify response headers** - Moz API should return `x-moz-rows-used` header
3. **Check console logs** - Look for `[moz-usage]` log messages
4. **API errors** - Failed API calls won't be tracked

## Implementation Details

### Files

- **[src/lib/moz-client.ts](../src/lib/moz-client.ts)** - Usage tracking logic
- **[src/lib/types.ts](../src/lib/types.ts)** - `mozUsage` type definition
- **[src/lib/generator.ts](../src/lib/generator.ts)** - Usage aggregation and reporting
- **[src/app/page.tsx](../src/app/page.tsx)** - Usage display in Summary view

### Data Flow

1. **Generation starts** → `clearMozUsageLog()`
2. **Each API call** → Track rows via `x-moz-rows-used` header
3. **Generation completes** → Aggregate usage by method
4. **Report includes** → `mozUsage: { totalRows, breakdown }`
5. **UI displays** → Moz API Usage card in Summary tab

## Best Practices

1. **Monitor monthly usage** - Check health endpoint regularly
2. **Set usage alerts** - Alert when approaching row limit
3. **Optimize limits** - Adjust constants based on your plan tier
4. **Review breakdown** - Identify high-cost API methods
5. **Use AI sense-check** - Filter keywords before fetching metrics
6. **Test with low limits** - Start conservative and increase if needed

## Future Enhancements

Potential improvements to usage tracking:

- [ ] Historical usage dashboard
- [ ] Per-user usage tracking
- [ ] Cost projections based on past usage
- [ ] Automatic limit adjustment
- [ ] Usage alerts/notifications
- [ ] CSV export of usage logs
