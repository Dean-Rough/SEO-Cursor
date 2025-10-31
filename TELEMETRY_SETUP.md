# OpenTelemetry Setup Guide

This document explains how to enable and configure OpenTelemetry observability for the SEO Wizard application.

## Overview

The application includes comprehensive error handling and observability infrastructure:

- ✅ **Toast notifications** for user feedback (using Sonner)
- ✅ **Error boundaries** for graceful error recovery
- ✅ **Error logging** with context and severity levels
- ✅ **OpenTelemetry integration** for distributed tracing

## Quick Start

### 1. Enable Telemetry

Add these environment variables to your `.env.local` file:

```bash
# Enable OpenTelemetry
NEXT_PUBLIC_OTEL_ENABLED=true

# Configure the collector endpoint (default: http://localhost:4318/v1/traces)
NEXT_PUBLIC_OTEL_EXPORTER_URL=http://localhost:4318/v1/traces

# Optional: Add authentication headers
NEXT_PUBLIC_OTEL_EXPORTER_HEADERS={"Authorization":"Bearer your-token"}
```

### 2. Run a Local OpenTelemetry Collector

The easiest way to get started is using Docker:

```bash
# Using Jaeger (includes UI at http://localhost:16686)
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

Or use the OpenTelemetry Collector directly:

```bash
docker run -d --name otel-collector \
  -p 4317:4317 \
  -p 4318:4318 \
  otel/opentelemetry-collector:latest
```

### 3. Verify Setup

1. Start your Next.js development server: `npm run dev`
2. Open the browser console - you should see: `[Telemetry] OpenTelemetry initialized successfully`
3. Generate an SEO report to create traces
4. Open Jaeger UI at http://localhost:16686 to view traces

## Architecture

### Error Handling Flow

```
User Action
    ↓
Try Operation
    ↓
    ├─ Success → Toast Success + Log Info + OTel Event
    │
    └─ Failure → Toast Error + Log Error + OTel Exception
                      ↓
                 Error Boundary (if uncaught)
                      ↓
                 Fallback UI + Log + OTel
```

### Components

#### 1. Toast Notifications (`useToast`)
Located in: `src/lib/hooks/useToast.ts`

```typescript
import { useToast } from "@/lib/hooks/useToast";

const toast = useToast();

// Success notification
toast.success("Operation completed", {
  description: "Details about the success",
  duration: 4000,
});

// Error with retry action
toast.error("Operation failed", {
  description: "Error details",
  action: {
    label: "Retry",
    onClick: retryFunction,
  },
  duration: 6000,
});
```

#### 2. Error Logger (`logError`, `logInfo`, `logWarning`)
Located in: `src/lib/error-logger.ts`

```typescript
import { logError, logInfo, ErrorCodes } from "@/lib/error-logger";

// Log an error with context
logError(error, {
  component: "ComponentName",
  action: "actionName",
  metadata: { key: "value" },
}, "high");

// Log info event
logInfo("User completed action", {
  component: "ComponentName",
  action: "actionName",
});
```

#### 3. Error Boundaries
Located in: `src/components/ErrorBoundary.tsx`

```tsx
import { ErrorBoundary, SectionErrorBoundary } from "@/components/ErrorBoundary";

// Full-page error boundary
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>

// Section-level error boundary
<SectionErrorBoundary sectionName="Report Generation">
  <ReportComponent />
</SectionErrorBoundary>
```

#### 4. OpenTelemetry Tracing
Located in: `src/lib/telemetry.ts`

```typescript
import { traceAsync, startSpan } from "@/lib/telemetry";

// Trace an async operation
await traceAsync("generate-report", async (span) => {
  span?.setAttribute("businessName", businessName);
  // ... operation code
}, { userId: "123" });

// Manual span management
const span = startSpan("operation-name", { attr: "value" });
try {
  // ... operation
  span?.setStatus({ code: SpanStatusCode.OK });
} finally {
  span?.end();
}
```

## Production Deployment

### Option 1: Managed Services

#### Honeycomb
```bash
NEXT_PUBLIC_OTEL_ENABLED=true
NEXT_PUBLIC_OTEL_EXPORTER_URL=https://api.honeycomb.io/v1/traces
NEXT_PUBLIC_OTEL_EXPORTER_HEADERS={"x-honeycomb-team":"your-api-key"}
```

#### Datadog
```bash
NEXT_PUBLIC_OTEL_ENABLED=true
NEXT_PUBLIC_OTEL_EXPORTER_URL=https://trace.agent.datadoghq.com/v1/traces
NEXT_PUBLIC_OTEL_EXPORTER_HEADERS={"DD-API-KEY":"your-api-key"}
```

#### New Relic
```bash
NEXT_PUBLIC_OTEL_ENABLED=true
NEXT_PUBLIC_OTEL_EXPORTER_URL=https://otlp.nr-data.net:4318/v1/traces
NEXT_PUBLIC_OTEL_EXPORTER_HEADERS={"api-key":"your-license-key"}
```

### Option 2: Self-Hosted

Deploy the OpenTelemetry Collector with your preferred backend (Jaeger, Zipkin, Prometheus, etc.).

Example `docker-compose.yml`:

```yaml
version: '3.8'
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP

  jaeger:
    image: jaegertracing/all-in-one:latest
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "16686:16686" # Jaeger UI
```

## Monitoring Checklist

### What Gets Logged

✅ **API Errors**
- Rate limit exceeded
- Network failures
- Validation errors
- External API failures (Moz, OpenAI)

✅ **User Actions**
- Form submissions
- Report generation
- Prefill operations
- Copy/download actions
- Reset operations

✅ **System Events**
- Component rendering errors
- Copy/paste failures
- Storage operations

### Severity Levels

- **Low**: Copy failures, UI glitches
- **Medium**: Prefill errors, validation failures
- **High**: Report generation failures, API errors
- **Critical**: Uncaught exceptions, system crashes

## Testing

### Manual Testing

1. **Success Flow**
   - Generate a report successfully
   - Check for success toast
   - Verify info log in console
   - Check trace in Jaeger

2. **Error Flow**
   - Submit invalid form data
   - Check for error toast
   - Verify error log in console
   - Check exception in Jaeger

3. **Retry Flow**
   - Trigger a retryable error
   - Click retry button in toast
   - Verify retry trace

### Automated Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Troubleshooting

### Telemetry not working

1. Check environment variables are set correctly
2. Verify `NEXT_PUBLIC_OTEL_ENABLED=true`
3. Check browser console for initialization message
4. Verify collector is running and accessible

### No traces appearing in Jaeger

1. Check collector URL is correct
2. Verify network connectivity to collector
3. Check browser network tab for failed requests to collector
4. Review collector logs for errors

### Performance impact

- Telemetry adds ~5-10ms overhead per traced operation
- Batch span processor minimizes network calls
- Can be disabled in production if needed

## Best Practices

1. **Always provide context** when logging errors:
   ```typescript
   logError(error, {
     component: "ComponentName",
     action: "actionName",
     metadata: { businessName, website }
   });
   ```

2. **Use appropriate severity levels**:
   - Low: Non-critical UI issues
   - Medium: Failed operations with fallback
   - High: Failed business-critical operations
   - Critical: System failures requiring immediate attention

3. **Include user-friendly messages** in toasts:
   ```typescript
   toast.error("Failed to generate report", {
     description: getUserFriendlyMessage(error),
     action: isRetryable ? { label: "Retry", onClick: retry } : undefined
   });
   ```

4. **Wrap risky operations in error boundaries**:
   ```tsx
   <SectionErrorBoundary sectionName="Keywords">
     <KeywordTable data={keywords} />
   </SectionErrorBoundary>
   ```

## Related Files

- `src/lib/hooks/useToast.ts` - Toast notification hook
- `src/lib/error-logger.ts` - Error logging utilities
- `src/lib/telemetry.ts` - OpenTelemetry integration
- `src/components/ErrorBoundary.tsx` - Error boundary components
- `src/components/providers/ToastProvider.tsx` - Toast provider
- `src/components/providers/TelemetryProvider.tsx` - Telemetry provider

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review the Jaeger UI for trace details
3. Enable debug logging: `localStorage.debug = 'otel:*'`
