import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { TelemetryProvider } from "@/components/providers/TelemetryProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

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
      <body
        suppressHydrationWarning
        className={`${outfit.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
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
