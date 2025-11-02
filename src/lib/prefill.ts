import { load } from "cheerio";
import { env, hasOpenAICredentials } from "./env";

export interface BusinessPrefill {
  businessName?: string;
  website?: string;
  businessAddress?: string;
  serviceArea?: string;
  businessType?: string;
  additionalNotes?: string;
}

interface PrefillExtractionResult {
  prefill: BusinessPrefill;
  rawDescription?: string;
  textSample?: string;
}

type SchemaRecord = Record<string, unknown>;

type AddressLike =
  | string
  | {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };

function formatAddress(address?: AddressLike): string | undefined {
  if (!address) return undefined;
  if (typeof address === "string") {
    const trimmed = address.trim();
    return trimmed ? trimmed : undefined;
  }
  const parts = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    address.addressCountry,
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

function normaliseArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function extractServiceArea(data: SchemaRecord | undefined): string | undefined {
  if (!data) return undefined;
  const raw = data["areaServed"];
  if (!raw) return undefined;
  const values = normaliseArray(raw)
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (
        entry &&
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as SchemaRecord).name === "string"
      ) {
        return ((entry as SchemaRecord).name as string).trim();
      }
      return "";
    })
    .filter(Boolean);
  return values.length ? Array.from(new Set(values)).join(", ") : undefined;
}

function extractBusinessType(data: SchemaRecord | undefined): string | undefined {
  if (!data) return undefined;
  const types = normaliseArray(data["@type"])
    .map((type) => (typeof type === "string" ? type : ""))
    .filter((type) => type && type.toLowerCase() !== "localbusiness");
  if (types.length) {
    return Array.from(new Set(types)).join(", ");
  }
  const category = data["category"];
  if (typeof category === "string" && category.trim()) {
    return category.trim();
  }
  const servesCuisine = data["servesCuisine"];
  if (Array.isArray(servesCuisine)) {
    return (servesCuisine as unknown[])
      .filter((item): item is string => typeof item === "string")
      .join(", ");
  }
  if (typeof servesCuisine === "string") {
    return servesCuisine.trim();
  }
  const priceRange = data["priceRange"];
  if (typeof priceRange === "string") {
    return priceRange.trim();
  }
  return undefined;
}

function extractWebsite(data: SchemaRecord | undefined): string | undefined {
  if (!data) return undefined;
  const url = data["url"];
  if (typeof url === "string") return url.trim();
  const sameAsValue = data["sameAs"];
  const sameAs = normaliseArray<any>(sameAsValue !== undefined ? sameAsValue : []);
  const website = sameAs.find((entry) =>
    typeof entry === "string" ? /^https?:\/\//i.test(entry) : false
  );
  return website?.trim();
}

function isSchemaRecord(value: unknown): value is SchemaRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractCandidateObjects(raw: string): SchemaRecord[] {
  const $ = load(raw);
  const scripts = $('script[type="application/ld+json"]').toArray();
  const parsed: SchemaRecord[] = [];
  for (const element of scripts) {
    const text = $(element).contents().text();
    if (!text) continue;
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        json.forEach((item) => {
          if (isSchemaRecord(item)) {
            parsed.push(item);
          }
        });
      } else if (isSchemaRecord(json)) {
        parsed.push(json);
      }
    } catch {
      continue;
    }
  }
  return parsed;
}

function selectBestCandidate(candidates: SchemaRecord[]): SchemaRecord | undefined {
  if (!candidates.length) return undefined;
  const priority = candidates.find((item) => {
    const types = normaliseArray(item?.["@type"]).map((type) =>
      typeof type === "string" ? type.toLowerCase() : ""
    );
    return types.some((type) =>
      [
        "localbusiness",
        "restaurant",
        "barorpub",
        "organization",
        "professionalservice",
        "store",
        "service",
        "medicalorganization",
        "dentist",
        "hospital",
        "clinic",
        "attorney",
        "realestateagent",
        "financialservice",
        "autodealer",
        "hotel",
        "lodgingbusiness",
      ].includes(type)
    );
  });
  return priority ?? candidates[0];
}

/**
 * Extract business name from HTML meta tags and common selectors
 */
function extractBusinessNameFromHTML($: ReturnType<typeof load>): string | undefined {
  // Try og:title meta tag
  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle?.trim()) return ogTitle.trim();

  // Try h1.fontHeadlineLarge (Google Maps specific)
  const h1 = $("h1.fontHeadlineLarge").first().text().trim();
  if (h1) return h1;

  // Try any h1
  const anyH1 = $("h1").first().text().trim();
  if (anyH1) return anyH1;

  // Try meta name
  const metaName = $('meta[name="title"]').attr("content");
  if (metaName?.trim()) return metaName.trim();

  return undefined;
}

/**
 * Extract website URL from HTML using various fallback methods
 */
function extractWebsiteFromHTML($: ReturnType<typeof load>): string | undefined {
  // Try data-item-id="authority" button (Google Maps website link)
  const authorityLink = $('a[data-item-id="authority"]').attr("href");
  if (authorityLink && /^https?:\/\//i.test(authorityLink)) {
    return authorityLink.trim();
  }

  // Try og:url meta tag
  const ogUrl = $('meta[property="og:url"]').attr("content");
  if (ogUrl?.trim() && /^https?:\/\//i.test(ogUrl)) {
    // Filter out Google domains
    if (!ogUrl.includes("google.com") && !ogUrl.includes("maps.app.goo.gl")) {
      return ogUrl.trim();
    }
  }

  // Look for links that look like official websites (not social media or Google)
  const excludedDomains = [
    "google.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "linkedin.com",
    "youtube.com",
    "maps.app.goo.gl",
  ];
  const links = $("a[href]").toArray();
  for (const link of links) {
    const href = $(link).attr("href");
    if (href && /^https?:\/\//i.test(href)) {
      const isExcluded = excludedDomains.some((domain) => href.includes(domain));
      if (!isExcluded) {
        return href.trim();
      }
    }
  }

  return undefined;
}

/**
 * Extract phone number from HTML using regex and selectors
 */
function extractPhoneFromHTML($: ReturnType<typeof load>): string | undefined {
  // Try data-item-id phone button (Google Maps)
  const phoneButton = $('button[data-item-id^="phone:tel:"]').first();
  if (phoneButton.length) {
    const itemId = phoneButton.attr("data-item-id");
    if (itemId) {
      const phoneMatch = itemId.match(/phone:tel:(.+)/);
      if (phoneMatch?.[1]) {
        return phoneMatch[1].trim();
      }
    }
  }

  // Try tel: links
  const telLink = $('a[href^="tel:"]').first().attr("href");
  if (telLink) {
    return telLink.replace("tel:", "").trim();
  }

  // Regex pattern for phone numbers
  const phoneRegex = /\+?\d{1,4}[\s\-\.]?\(?\d{1,4}\)?[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,9}/g;
  const bodyText = $("body").text();
  const phoneMatches = bodyText.match(phoneRegex);
  if (phoneMatches?.length) {
    // Return the first match that looks reasonable (10+ digits)
    const validPhone = phoneMatches.find((p) => p.replace(/\D/g, "").length >= 10);
    if (validPhone) return validPhone.trim();
  }

  return undefined;
}

/**
 * Extract address from HTML using aria-labels and data attributes
 */
function extractAddressFromHTML($: ReturnType<typeof load>): string | undefined {
  // Try data-item-id="address" button (Google Maps)
  const addressButton = $('button[data-item-id="address"]').first();
  if (addressButton.length) {
    const ariaLabel = addressButton.attr("aria-label");
    if (ariaLabel) {
      // aria-label often contains "Address: <actual address>"
      const match = ariaLabel.match(/Address:\s*(.+)/i);
      if (match?.[1]) {
        return match[1].trim();
      }
      return ariaLabel.trim();
    }
    const text = addressButton.text().trim();
    if (text) return text;
  }

  // Try aria-label containing address patterns
  const ariaLabels = $('[aria-label*="Address"]').toArray();
  for (const element of ariaLabels) {
    const ariaLabel = $(element).attr("aria-label");
    if (ariaLabel) {
      const match = ariaLabel.match(/Address:\s*(.+)/i);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  // Try pattern matching for "Street, City, State ZIP"
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}/gi;
  const bodyText = $("body").text();
  const addressMatch = bodyText.match(addressRegex);
  if (addressMatch?.length) {
    return addressMatch[0].trim();
  }

  return undefined;
}

/**
 * Extract description from meta tags
 */
function extractDescriptionFromHTML($: ReturnType<typeof load>): string | undefined {
  // Try meta description
  const metaDesc = $('meta[name="description"]').attr("content");
  if (metaDesc?.trim()) return metaDesc.trim();

  // Try og:description
  const ogDesc = $('meta[property="og:description"]').attr("content");
  if (ogDesc?.trim()) return ogDesc.trim();

  return undefined;
}

export function extractBusinessProfile(html: string): PrefillExtractionResult {
  const candidates = extractCandidateObjects(html);
  const candidate = selectBestCandidate(candidates);
  const prefill: BusinessPrefill = {};
  let rawDescription: string | undefined;

  // Load HTML for fallback parsing
  const $ = load(html);

  // Extract from JSON-LD schema first (primary method)
  if (candidate) {
    const candidateName = candidate["name"];
    if (typeof candidateName === "string") {
      prefill.businessName = candidateName.trim();
    }
    const website = extractWebsite(candidate);
    if (website) {
      prefill.website = website;
    }
    const address = formatAddress(candidate["address"] as AddressLike | undefined);
    if (address) {
      prefill.businessAddress = address;
    }
    const serviceArea = extractServiceArea(candidate);
    if (serviceArea) {
      prefill.serviceArea = serviceArea;
    }
    const businessType = extractBusinessType(candidate);
    if (businessType) {
      prefill.businessType = businessType;
    }
    const description = candidate["description"];
    if (typeof description === "string" && description.trim()) {
      rawDescription = description.trim();
    }
  }

  // Apply HTML fallback parsing for missing fields
  if (!prefill.businessName) {
    const htmlName = extractBusinessNameFromHTML($);
    if (htmlName) {
      prefill.businessName = htmlName;
    }
  }

  if (!prefill.website) {
    const htmlWebsite = extractWebsiteFromHTML($);
    if (htmlWebsite) {
      prefill.website = htmlWebsite;
    }
  }

  if (!prefill.businessAddress) {
    const htmlAddress = extractAddressFromHTML($);
    if (htmlAddress) {
      prefill.businessAddress = htmlAddress;
    }
  }

  if (!rawDescription) {
    const htmlDescription = extractDescriptionFromHTML($);
    if (htmlDescription) {
      rawDescription = htmlDescription;
    }
  }

  // Extract phone number and add to additionalNotes if found
  const phone = extractPhoneFromHTML($);
  if (phone) {
    const phoneNote = `Phone: ${phone}`;
    if (prefill.additionalNotes) {
      prefill.additionalNotes += `\n${phoneNote}`;
    } else {
      prefill.additionalNotes = phoneNote;
    }
  }

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const textSample = bodyText ? bodyText.slice(0, 4000) : undefined;

  if (!rawDescription && textSample) {
    rawDescription = textSample.slice(0, 600);
  }

  return {
    prefill,
    rawDescription,
    textSample,
  };
}

export async function enrichBusinessProfile(params: {
  profileUrl: string;
  html: string;
}): Promise<{ prefill: BusinessPrefill; notes: string[] }> {
  const notes: string[] = [];
  const extraction = extractBusinessProfile(params.html);
  const basePrefill = extraction.prefill;

  if (!hasOpenAICredentials) {
    notes.push("AI enrichment skipped: missing OPENAI_API_KEY.");
    return { prefill: basePrefill, notes };
  }

  const textPromptParts = [
    extraction.rawDescription ?? "",
    extraction.textSample ?? "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that extracts structured business information from Google Business Profiles. Always respond with a JSON object containing the requested fields.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instructions:
                "Using the scraped content, infer the business details. Respond as JSON with keys businessName, website, businessType, businessAddress, serviceArea, additionalNotes. additionalNotes should summarise core services in one or two sentences.",
              profileUrl: params.profileUrl,
              scrapedPrefill: basePrefill,
              scrapedText: textPromptParts,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      notes.push(
        `AI enrichment unavailable (${response.status})—falling back to scraped data.`
      );
      return { prefill: basePrefill, notes };
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      notes.push("AI enrichment returned no content—using scraped data.");
      return { prefill: basePrefill, notes };
    }

    const parsed = JSON.parse(content) as BusinessPrefill;
    const merged: BusinessPrefill = {
      ...basePrefill,
      ...parsed,
    };
    notes.push("Fields inferred via AI enrichment.");
    return { prefill: merged, notes };
  } catch (error) {
    console.warn("[prefill] AI enrichment failed", error);
    notes.push("AI enrichment failed—using scraped data.");
    return { prefill: basePrefill, notes };
  }
}
