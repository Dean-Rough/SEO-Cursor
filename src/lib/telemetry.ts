/**
 * OpenTelemetry integration for observability
 *
 * This module provides instrumentation for tracing, metrics, and logging.
 * It's designed to work with OpenTelemetry-compatible backends like:
 * - Jaeger
 * - Zipkin
 * - Honeycomb
 * - Datadog
 * - New Relic
 */

import { trace, context, SpanStatusCode, type Span } from "@opentelemetry/api";

const TRACER_NAME = "seo-wizard";
const SERVICE_NAME = "seo-wizard-web";

/**
 * Check if telemetry is enabled
 */
export function isTelemetryEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_OTEL_ENABLED === "true"
  );
}

/**
 * Initialize OpenTelemetry instrumentation
 * This should be called once at app startup
 */
export async function initTelemetry(): Promise<void> {
  if (!isTelemetryEnabled()) {
    console.info("[Telemetry] Disabled - set NEXT_PUBLIC_OTEL_ENABLED=true to enable");
    return;
  }

  try {
    // Dynamic imports to avoid loading OTel when disabled
    const { WebTracerProvider } = await import("@opentelemetry/sdk-trace-web");
    const { BatchSpanProcessor } = await import("@opentelemetry/sdk-trace-base");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { SEMRESATTRS_SERVICE_NAME } = await import("@opentelemetry/semantic-conventions");
    const { registerInstrumentations } = await import("@opentelemetry/instrumentation");
    const { FetchInstrumentation } = await import("@opentelemetry/instrumentation-fetch");

    // Use type-only import to avoid runtime issues with Resource
    const Resources = await import("@opentelemetry/resources");
    const Resource = (Resources as any).Resource || (Resources as any).default;

    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
      environment: process.env.NODE_ENV || "development",
    });

    const provider = new WebTracerProvider({
      resource,
    });

    // Configure exporter
    const exporter = new OTLPTraceExporter({
      url: process.env.NEXT_PUBLIC_OTEL_EXPORTER_URL || "http://localhost:4318/v1/traces",
      headers: process.env.NEXT_PUBLIC_OTEL_EXPORTER_HEADERS
        ? JSON.parse(process.env.NEXT_PUBLIC_OTEL_EXPORTER_HEADERS)
        : {},
    });

    (provider as any).addSpanProcessor(new BatchSpanProcessor(exporter));
    provider.register();

    // Register instrumentations
    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [
            /localhost/,
            /127\.0\.0\.1/,
            new RegExp(process.env.NEXT_PUBLIC_API_URL || ""),
          ],
          clearTimingResources: true,
        }),
      ],
    });

    console.info("[Telemetry] OpenTelemetry initialized successfully");
  } catch (error) {
    console.error("[Telemetry] Failed to initialize OpenTelemetry:", error);
  }
}

/**
 * Get the active tracer
 */
export function getTracer() {
  return trace.getTracer(TRACER_NAME);
}

/**
 * Create a span for tracing an operation
 */
export function startSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>
): Span | null {
  if (!isTelemetryEnabled()) {
    return null;
  }

  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    attributes: {
      ...attributes,
      "service.name": SERVICE_NAME,
    },
  });

  return span;
}

/**
 * Trace an async operation
 */
export async function traceAsync<T>(
  name: string,
  fn: (span: Span | null) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  if (!isTelemetryEnabled()) {
    return fn(null);
  }

  const span = startSpan(name, attributes);
  if (!span) {
    return fn(null);
  }

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Trace a synchronous operation
 */
export function traceSync<T>(
  name: string,
  fn: (span: Span | null) => T,
  attributes?: Record<string, string | number | boolean>
): T {
  if (!isTelemetryEnabled()) {
    return fn(null);
  }

  const span = startSpan(name, attributes);
  if (!span) {
    return fn(null);
  }

  try {
    const result = context.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Record an exception in the current span
 */
export function recordException(error: Error, attributes?: Record<string, string>): void {
  if (!isTelemetryEnabled()) {
    return;
  }

  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    if (attributes) {
      span.setAttributes(attributes);
    }
  }
}

/**
 * Add an event to the current span
 */
export function addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
  if (!isTelemetryEnabled()) {
    return;
  }

  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Set attributes on the current span
 */
export function setSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  if (!isTelemetryEnabled()) {
    return;
  }

  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}
