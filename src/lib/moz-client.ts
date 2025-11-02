import { randomUUID } from "crypto";
import { env, hasMozDataApiToken } from "./env";

const MOZ_RPC_ENDPOINT = "https://api.moz.com/jsonrpc";

export class MozApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: number,
    readonly data?: unknown
  ) {
    super(message);
    this.name = "MozApiError";
  }
}

export interface MozUsageMetrics {
  rowsUsed: number;
  method: string;
  timestamp: number;
}

interface MozRpcParams {
  [key: string]: unknown;
}

interface MozRpcResponse<T> {
  id: string;
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    status?: number;
    message: string;
    data?: unknown;
  };
}

// Global usage tracker
const mozUsageLog: MozUsageMetrics[] = [];

export function getMozUsageLog(): MozUsageMetrics[] {
  return [...mozUsageLog];
}

export function clearMozUsageLog(): void {
  mozUsageLog.length = 0;
}

export function getTotalMozRowsUsed(): number {
  return mozUsageLog.reduce((total, entry) => total + entry.rowsUsed, 0);
}

export async function callMozApi<T>(
  method: string,
  params: MozRpcParams
): Promise<T> {
  if (!hasMozDataApiToken || !env.MOZ_DATA_API_TOKEN) {
    throw new MozApiError("Moz Data API token is not configured.");
  }

  const requestBody = {
    jsonrpc: "2.0",
    id: randomUUID(),
    method,
    params,
  };

  let response: Response;
  try {
    response = await fetch(MOZ_RPC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-moz-token": env.MOZ_DATA_API_TOKEN,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    throw new MozApiError(
      error instanceof Error ? error.message : "Unknown Moz API network error."
    );
  }

  // Extract usage from response headers
  const rowsUsedHeader = response.headers.get("x-moz-rows-used");
  const rowsUsed = rowsUsedHeader ? parseInt(rowsUsedHeader, 10) : 0;

  if (rowsUsed > 0) {
    mozUsageLog.push({
      rowsUsed,
      method,
      timestamp: Date.now(),
    });
    console.log(`[moz-usage] ${method}: ${rowsUsed} rows (total: ${getTotalMozRowsUsed()})`);
  }

  let payload: MozRpcResponse<T>;
  try {
    payload = await response.json();
  } catch (error) {
    throw new MozApiError(
      `Failed to parse Moz API response for ${method}: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }

  if (payload.error) {
    throw new MozApiError(
      payload.error.message,
      payload.error.status,
      payload.error.code,
      payload.error.data
    );
  }

  return payload.result as T;
}

export function mozRequestAvailable(): boolean {
  return hasMozDataApiToken && Boolean(env.MOZ_DATA_API_TOKEN);
}
