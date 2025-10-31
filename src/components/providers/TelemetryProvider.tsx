"use client";

import { useEffect, type ReactNode } from "react";
import { initTelemetry, isTelemetryEnabled } from "@/lib/telemetry";

/**
 * Provider component that initializes OpenTelemetry on the client side
 *
 * This should be added to the root layout to enable telemetry across the app.
 *
 * Configuration via environment variables:
 * - NEXT_PUBLIC_OTEL_ENABLED=true (enable telemetry)
 * - NEXT_PUBLIC_OTEL_EXPORTER_URL=http://your-collector:4318/v1/traces
 * - NEXT_PUBLIC_OTEL_EXPORTER_HEADERS={"Authorization":"Bearer token"}
 */
export function TelemetryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== "undefined" && isTelemetryEnabled()) {
      initTelemetry().catch((error) => {
        console.error("[TelemetryProvider] Failed to initialize telemetry:", error);
      });
    }
  }, []);

  return <>{children}</>;
}
