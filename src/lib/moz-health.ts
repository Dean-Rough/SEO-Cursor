import { env, hasMozDataApiToken } from "./env";

const MOZ_RPC_ENDPOINT = "https://api.moz.com/jsonrpc";

export interface MozAccountStatus {
  isConfigured: boolean;
  isValid: boolean;
  hasCredits: boolean;
  error?: string;
  details?: {
    subscription?: {
      name?: string;
      status?: string;
    };
    usage?: {
      rowsRemaining?: number;
      rowsUsed?: number;
      rowsLimit?: number;
    };
  };
}

interface MozAccountInfoResponse {
  account?: {
    subscription?: {
      name?: string;
      status?: string;
    };
  };
  usage?: {
    rows_remaining?: number;
    rows_used?: number;
    rows_limit?: number;
  };
}

/**
 * Check Moz API account status and credit availability
 * Uses the account.info endpoint to verify credentials and check quota
 */
export async function checkMozAccountStatus(): Promise<MozAccountStatus> {
  // Check if credentials are configured
  if (!hasMozDataApiToken || !env.MOZ_DATA_API_TOKEN) {
    return {
      isConfigured: false,
      isValid: false,
      hasCredits: false,
      error: "Moz API credentials not configured. Set MOZ_DATA_API_KEY in .env.local",
    };
  }

  // Try to fetch account info
  try {
    const response = await fetch(MOZ_RPC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-moz-token": env.MOZ_DATA_API_TOKEN,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "health-check",
        method: "account.info",
        params: {},
      }),
    });

    if (!response.ok) {
      return {
        isConfigured: true,
        isValid: false,
        hasCredits: false,
        error: `Moz API returned ${response.status}: ${response.statusText}`,
      };
    }

    const payload = await response.json();

    if (payload.error) {
      // Common error codes:
      // -32600: Invalid request
      // -32601: Method not found
      // -32602: Invalid params
      // -32603: Internal error
      // 401: Unauthorized (invalid token)
      const isAuthError = payload.error.status === 401 || payload.error.code === 401;

      return {
        isConfigured: true,
        isValid: !isAuthError,
        hasCredits: false,
        error: isAuthError
          ? "Moz API credentials are invalid or expired"
          : `Moz API error: ${payload.error.message}`,
      };
    }

    const result = payload.result as MozAccountInfoResponse;

    // Check if account has remaining rows/credits
    const rowsRemaining = result.usage?.rows_remaining ?? 0;
    const hasCredits = rowsRemaining > 0;

    return {
      isConfigured: true,
      isValid: true,
      hasCredits,
      details: {
        subscription: {
          name: result.account?.subscription?.name,
          status: result.account?.subscription?.status,
        },
        usage: {
          rowsRemaining: result.usage?.rows_remaining,
          rowsUsed: result.usage?.rows_used,
          rowsLimit: result.usage?.rows_limit,
        },
      },
      error: hasCredits
        ? undefined
        : `Moz API quota exhausted. ${rowsRemaining} rows remaining.`,
    };
  } catch (error) {
    return {
      isConfigured: true,
      isValid: false,
      hasCredits: false,
      error: `Failed to check Moz account status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Simple boolean check for UI components
 */
export async function isMozAvailable(): Promise<boolean> {
  const status = await checkMozAccountStatus();
  return status.isValid && status.hasCredits;
}
