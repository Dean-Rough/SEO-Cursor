import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { TelemetryProvider } from "@/components/providers/TelemetryProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "SEO Wizard | Automated Keyword & Content Strategy",
  description:
    "Generate a complete SEO strategy, keyword plan, and metadata recommendations in one click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/cll6ajh.css" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-background text-foreground font-sans"
      >
        <TelemetryProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <ToastProvider />
        </TelemetryProvider>
      </body>
    </html>
  );
}
