import type { Metadata } from "next";
import "./globals.css";

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
        <link rel="stylesheet" href="https://use.typekit.net/xqf3weh.css" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-background text-foreground font-sans"
      >
        {children}
      </body>
    </html>
  );
}
