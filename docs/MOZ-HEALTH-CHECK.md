# Moz API Health Check

The SEO Wizard now includes a Moz API health check system that verifies credential validity and credit availability before generation.

## Features

### 1. API Endpoint: `/api/health/moz`

Returns Moz account status including:
- **Credential validity** (401 if invalid)
- **Credit availability** (429 if quota exhausted)
- **Subscription details** (plan name, status)
- **Usage metrics** (rows used, remaining, limit)

**Example Response (Success):**
```json
{
  "isConfigured": true,
  "isValid": true,
  "hasCredits": true,
  "details": {
    "subscription": {
      "name": "Pro",
      "status": "active"
    },
    "usage": {
      "rowsRemaining": 8500,
      "rowsUsed": 1500,
      "rowsLimit": 10000
    }
  }
}
```

**Example Response (No Credits):**
```json
{
  "isConfigured": true,
  "isValid": true,
  "hasCredits": false,
  "error": "Moz API quota exhausted. 0 rows remaining."
}
```

**Example Response (Not Configured):**
```json
{
  "isConfigured": false,
  "isValid": false,
  "hasCredits": false,
  "error": "Moz API credentials not configured. Set MOZ_DATA_API_KEY in .env.local"
}
```

### 2. Visual Status Indicator

The UI displays a Moz status badge in the header:

- **Green "MOZ OK"** - Credentials valid, credits available
- **Red "MOZ"** - Invalid credentials or no credits remaining

Hover over the badge to see detailed error messages.

### 3. Pre-Generation Warning

If Moz API is unavailable (invalid credentials or no credits), a warning alert appears above the "Generate Strategy" button:

> ⚠️ **Moz API Limited:** Moz API quota exhausted. Keyword data and metrics will be unavailable.

This ensures users know before running a generation that Moz features will be limited.

## How It Works

### Client-Side Check

On page load, the app calls `/api/health/moz` and stores the status in React state:

```typescript
const [mozStatus, setMozStatus] = useState<{
  isValid: boolean;
  hasCredits: boolean;
  error?: string;
} | null>(null);

useEffect(() => {
  fetch("/api/health/moz")
    .then(res => res.json())
    .then(data => setMozStatus(data));
}, []);
```

### Server-Side Check

The API endpoint uses the `account.info` RPC method to verify credentials and fetch quota:

```typescript
import { checkMozAccountStatus } from "@/lib/moz-health";

export async function GET() {
  const status = await checkMozAccountStatus();

  if (!status.isConfigured) return NextResponse.json(status, { status: 503 });
  if (!status.isValid) return NextResponse.json(status, { status: 401 });
  if (!status.hasCredits) return NextResponse.json(status, { status: 429 });

  return NextResponse.json(status, { status: 200 });
}
```

## Configuration

### Required Environment Variables

Set these in `.env.local`:

```bash
# Moz Keyword Explorer API (RPC endpoint)
MOZ_DATA_API_KEY=your_moz_data_api_key_here

# Moz Links API (optional, for domain authority)
MOZ_API=accessID:secretKey
```

### Graceful Degradation

If Moz is not configured or has no credits:
- ✅ Report generation still works
- ❌ Keyword volume/difficulty data unavailable
- ❌ Domain authority metrics unavailable
- ✅ Competitor analysis still works (without Moz data)
- ✅ Site crawling and analysis works normally

## Testing

### Manual Testing

1. **Valid Credentials + Credits:**
   - Set `MOZ_DATA_API_KEY` in `.env.local`
   - Visit http://localhost:3000
   - Should see green "MOZ OK" badge

2. **Invalid Credentials:**
   - Set `MOZ_DATA_API_KEY=invalid_key`
   - Should see red "MOZ" badge
   - Warning alert should appear above Generate button

3. **No Configuration:**
   - Remove `MOZ_DATA_API_KEY` from `.env.local`
   - Should see red "MOZ" badge
   - Warning message: "Moz API credentials not configured"

### API Testing

```bash
# Check Moz status
curl http://localhost:3000/api/health/moz

# Expected status codes:
# 200 - All good (valid + credits)
# 401 - Invalid credentials
# 429 - Quota exhausted
# 503 - Not configured
```

## Error Handling

The system handles these common Moz API errors:

| Error | Status Code | User Message |
|-------|-------------|--------------|
| No credentials configured | 503 | "Moz API credentials not configured" |
| Invalid token | 401 | "Moz API credentials are invalid or expired" |
| Quota exhausted | 429 | "Moz API quota exhausted. 0 rows remaining" |
| Network error | 500 | "Failed to check Moz account status" |

## Implementation Files

- **[src/lib/moz-health.ts](../src/lib/moz-health.ts)** - Core health check logic
- **[src/app/api/health/moz/route.ts](../src/app/api/health/moz/route.ts)** - API endpoint
- **[src/app/page.tsx](../src/app/page.tsx)** - UI integration

## Benefits

1. **Early Warning** - Users know before generating if Moz will work
2. **Transparency** - Clear error messages explain exactly what's wrong
3. **No Surprises** - Prevents frustration from failed generations
4. **Debugging** - Status indicator helps diagnose configuration issues
5. **Quota Management** - Users can see credit status at a glance
