import { describe, expect, it } from "vitest";
import { extractBusinessProfile } from "../src/lib/prefill";

const SAMPLE_HTML = `
<!doctype html>
<html>
  <head>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "InteriorDesign"],
      "name": "Rough",
      "url": "https://rough.ink",
      "description": "Rough is a hospitality interior design studio in Edinburgh.",
      "address": {
        "streetAddress": "38 Buccleuch Street",
        "addressLocality": "Edinburgh",
        "addressRegion": "Scotland",
        "postalCode": "EH8 9JS",
        "addressCountry": "GB"
      },
      "areaServed": ["Edinburgh", "Scotland"]
    }
    </script>
  </head>
  <body>
    <main>
      <p>Rough delivers hospitality interior design and fit out projects across Scotland.</p>
    </main>
  </body>
</html>
`;

describe("extractBusinessProfile", () => {
  it("returns core business fields from structured data", () => {
    const result = extractBusinessProfile(SAMPLE_HTML);
    expect(result.prefill.businessName).toBe("Rough");
    expect(result.prefill.website).toBe("https://rough.ink");
    expect(result.prefill.businessType).toBe("InteriorDesign");
    expect(result.prefill.serviceArea).toBe("Edinburgh, Scotland");
    expect(result.prefill.businessAddress).toContain("38 Buccleuch Street");
    expect(result.rawDescription).toContain("hospitality interior design");
  });
});
