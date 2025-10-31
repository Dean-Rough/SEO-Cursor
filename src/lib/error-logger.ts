/**
 * Error logging utility for centralized error tracking
 *
 * This module provides a consistent interface for logging errors across the application.
 * In production, this should integrate with OpenTelemetry or a similar observability platform.
 */

type ErrorContext = {
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};

type ErrorSeverity = "low" | "medium" | "high" | "critical";

export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = "medium",
    context?: ErrorContext,
    isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Log an error with context and severity
 * In production, this would send to OpenTelemetry/Sentry/etc.
 */
export function logError(
  error: Error | AppError,
  context?: ErrorContext,
  severity: ErrorSeverity = "medium"
): void {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: error.message,
    name: error.name,
    stack: error.stack,
    severity,
    context,
    ...(error instanceof AppError && {
      code: error.code,
      isOperational: error.isOperational,
      originalContext: error.context,
    }),
  };

  // Console logging for development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error Logger]", errorData);
  }

  // OpenTelemetry integration
  if (typeof window !== "undefined") {
    import("./telemetry").then(({ recordException, setSpanAttributes }) => {
      recordException(error, {
        severity,
        component: context?.component || "unknown",
        action: context?.action || "unknown",
        ...(error instanceof AppError && { errorCode: error.code }),
      });

      if (context?.metadata) {
        setSpanAttributes({
          "error.metadata": JSON.stringify(context.metadata),
        });
      }
    }).catch(() => {
      // Silently fail if telemetry module isn't available
    });
  }
}

/**
 * Log a warning (non-error issue)
 */
export function logWarning(
  message: string,
  context?: ErrorContext
): void {
  const warningData = {
    timestamp: new Date().toISOString(),
    message,
    level: "warning",
    context,
  };

  if (process.env.NODE_ENV === "development") {
    console.warn("[Warning Logger]", warningData);
  }

  // OpenTelemetry integration
  if (typeof window !== "undefined") {
    import("./telemetry").then(({ addEvent }) => {
      addEvent("warning", {
        message,
        component: context?.component || "unknown",
        action: context?.action || "unknown",
      });
    }).catch(() => {
      // Silently fail if telemetry module isn't available
    });
  }
}

/**
 * Log an info-level event
 */
export function logInfo(
  message: string,
  context?: ErrorContext
): void {
  const infoData = {
    timestamp: new Date().toISOString(),
    message,
    level: "info",
    context,
  };

  if (process.env.NODE_ENV === "development") {
    console.info("[Info Logger]", infoData);
  }

  // OpenTelemetry integration
  if (typeof window !== "undefined") {
    import("./telemetry").then(({ addEvent }) => {
      addEvent("info", {
        message,
        component: context?.component || "unknown",
        action: context?.action || "unknown",
      });
    }).catch(() => {
      // Silently fail if telemetry module isn't available
    });
  }
}

/**
 * Extract user-friendly error message from various error types
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for common error patterns and provide better messages
    if (error.message.includes("fetch")) {
      return "Network error - please check your connection and try again.";
    }
    if (error.message.includes("rate limit")) {
      return "Too many requests. Please wait a moment and try again.";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("enotfound")
    );
  }

  return false;
}

/**
 * Create common error types
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // API errors
  API_ERROR: "API_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Business logic errors
  GENERATION_ERROR: "GENERATION_ERROR",
  PREFILL_ERROR: "PREFILL_ERROR",
  CRAWL_ERROR: "CRAWL_ERROR",

  // Unknown
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;
