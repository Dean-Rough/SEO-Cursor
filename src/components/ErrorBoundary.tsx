"use client";

import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logError } from "@/lib/error-logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches React errors and displays a fallback UI
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to telemetry
    logError(error, {
      component: "ErrorBoundary",
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    }, "high");

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI with nocturnal theme
 */
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080c16] px-6 py-12">
      <Card className="w-full max-w-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-500/20 p-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Something went wrong</CardTitle>
              <CardDescription className="text-sm text-zinc-400">
                An unexpected error occurred in the application.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Error Details
            </p>
            <p className="mt-2 font-mono text-sm text-red-200">{error.message}</p>
            {error.stack && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-200">
                  Stack trace
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-black/60 p-3 text-xs text-zinc-300">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={reset}
              className="rounded-2xl border border-white/10 bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-400"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-2xl border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
            >
              Reload Page
            </Button>
          </div>

          <p className="text-xs text-zinc-500">
            If this problem persists, please contact support or try clearing your browser cache.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Section-level error boundary for more granular error handling
 */
export function SectionErrorBoundary({ children, sectionName }: { children: ReactNode; sectionName?: string }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-white">
                {sectionName ? `Error in ${sectionName}` : "Section Error"}
              </p>
              <p className="text-xs text-zinc-400">{error.message}</p>
              <Button
                onClick={reset}
                size="sm"
                variant="outline"
                className="rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-200 hover:bg-white/10"
              >
                <RefreshCcw className="mr-1.5 h-3 w-3" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
