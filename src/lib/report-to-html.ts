import type { KeywordStat, MetadataRecommendation, SeoReport } from "./types";

export function renderReportHtml(report: SeoReport): string {
  const generatedDate = new Date(report.generatedAt).toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(
      report.input.businessName
    )} | SEO Strategy Blueprint</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0e121a;
        --bg-muted: #161c27;
        --border: rgba(255, 255, 255, 0.08);
        --text: #f4f6fb;
        --text-muted: #9aa5c4;
        --accent: #6d8bff;
        --accent-soft: rgba(109, 139, 255, 0.12);
        --success: #4ade80;
        --warning: #fbbf24;
      }
      body {
        margin: 0;
        font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI",
          sans-serif;
        background: radial-gradient(circle at top, #131a29, #080b12);
        color: var(--text);
        line-height: 1.6;
      }
      .container {
        max-width: 1180px;
        margin: 0 auto;
        padding: 3rem 1.5rem 5rem;
      }
      header {
        display: grid;
        gap: 1rem;
        padding: 2.5rem 2rem;
        margin-bottom: 3rem;
        background: linear-gradient(120deg, rgba(17,23,38,0.95), rgba(30,41,59,0.9));
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: 0 30px 60px rgba(4,6,15,0.6);
      }
      header h1 {
        margin: 0;
        font-size: 2.4rem;
        letter-spacing: -0.02em;
      }
      header .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.95rem;
        color: var(--text-muted);
      }
      .grid {
        display: grid;
        gap: 1.5rem;
      }
      @media (min-width: 1024px) {
        .grid.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .grid.three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      section {
        padding: 2rem;
        background: rgba(17, 23, 38, 0.6);
        border: 1px solid var(--border);
        border-radius: 16px;
        backdrop-filter: blur(8px);
      }
      section h2 {
        margin-top: 0;
        font-size: 1.6rem;
        letter-spacing: -0.01em;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1.5rem;
        font-size: 0.95rem;
      }
      table thead {
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.06em;
        color: var(--text-muted);
      }
      table th,
      table td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }
      table tbody tr:hover {
        background: rgba(109, 139, 255, 0.05);
      }
      ul {
        margin: 0.75rem 0;
        padding-left: 1.25rem;
      }
      li {
        margin-bottom: 0.35rem;
      }
      .tag {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .muted {
        color: var(--text-muted);
      }
      .callout {
        padding: 1rem 1.2rem;
        border-radius: 12px;
        background: rgba(109, 139, 255, 0.12);
        border: 1px solid rgba(109, 139, 255, 0.2);
      }
      .warning-box {
        padding: 1.5rem 1.75rem;
        border-radius: 12px;
        background: rgba(251, 191, 36, 0.08);
        border: 1px solid rgba(251, 191, 36, 0.25);
        margin-bottom: 2rem;
      }
      .warning-box h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1.1rem;
        color: var(--warning);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .warning-box ul {
        margin: 0;
        padding-left: 1.25rem;
        list-style: none;
      }
      .warning-box li {
        margin-bottom: 0.65rem;
        padding-left: 0;
      }
      .warning-box li::before {
        content: '⚠️';
        margin-right: 0.5rem;
      }
      code {
        font-family: "Fira Code", "JetBrains Mono", monospace;
        background: rgba(255, 255, 255, 0.08);
        padding: 0.05rem 0.35rem;
        border-radius: 6px;
        font-size: 0.9rem;
      }
      .source-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-left: 0.5rem;
        vertical-align: middle;
      }
      .source-badge.moz {
        background: rgba(74, 222, 128, 0.15);
        color: var(--success);
        border: 1px solid rgba(74, 222, 128, 0.3);
      }
      .source-badge.competitor {
        background: rgba(251, 191, 36, 0.15);
        color: var(--warning);
        border: 1px solid rgba(251, 191, 36, 0.3);
      }
      .source-badge.site {
        background: rgba(109, 139, 255, 0.15);
        color: var(--accent);
        border: 1px solid rgba(109, 139, 255, 0.3);
      }
      .source-badge.blended {
        background: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
        border: 1px solid rgba(148, 163, 184, 0.3);
      }
    </style>
  </head>
  <body>
    <div class="container">
      ${renderHeader(report, generatedDate)}
      ${renderDataQualityWarnings(report)}
      ${renderBusinessContext(report)}
      ${renderKeywordSection(report)}
      ${renderSiteAudit(report)}
      ${renderMetadataPlan(report)}
      ${renderSiteArchitecture(report)}
      ${renderContentDrafts(report)}
      ${renderPageBlueprints(report)}
      ${renderRecommendations(report)}
      ${renderCompetitors(report)}
    </div>
  </body>
</html>`;
}

function renderDataQualityWarnings(report: SeoReport) {
  if (!report.dataQualityWarnings || report.dataQualityWarnings.length === 0) {
    return "";
  }

  const warningItems = report.dataQualityWarnings
    .map((warning) => {
      // Remove the emoji from the warning text since we're adding it via CSS
      const warningText = warning.replace(/^⚠️\s*/, "");
      return `<li>${escapeHtml(warningText)}</li>`;
    })
    .join("");

  return `<div class="warning-box">
    <h3>⚠️ Data Quality Notice</h3>
    <ul>
      ${warningItems}
    </ul>
  </div>`;
}

function renderBusinessContext(report: SeoReport) {
  const rows: string[] = [];

  if (report.input.businessAddress) {
    rows.push(`<li><strong>Address:</strong> ${escapeHtml(report.input.businessAddress)}</li>`);
  }
  if (report.input.serviceArea) {
    rows.push(`<li><strong>Service area:</strong> ${escapeHtml(report.input.serviceArea)}</li>`);
  }
  if (report.input.googleBusinessProfile) {
    rows.push(
      `<li><strong>Google Business Profile:</strong> <a href="${escapeHtml(
        report.input.googleBusinessProfile
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
        report.input.googleBusinessProfile
      )}</a></li>`
    );
  }
  if (report.input.additionalNotes) {
    rows.push(
      `<li><strong>Strategic notes:</strong> ${escapeHtml(report.input.additionalNotes)}</li>`
    );
  }

  if (!rows.length) return "";

  return `<section>
    <h2>Business Overview</h2>
    <ul>
      ${rows.join("")}
    </ul>
  </section>`;
}

function renderHeader(report: SeoReport, generatedDate: string) {
  return `<header>
    <span class="tag">SEO Intelligence Report</span>
    <h1>${escapeHtml(report.input.businessName)}</h1>
    <div class="meta">
      <span>Generated: ${escapeHtml(generatedDate)}</span>
      <span>Website: ${escapeHtml(report.input.website)}</span>
      <span>Business Type: ${escapeHtml(report.input.businessType)}</span>
      ${
        report.input.serviceArea
          ? `<span>Service Area: ${escapeHtml(report.input.serviceArea)}</span>`
          : ""
      }
      ${
        report.input.businessAddress
          ? `<span>Address: ${escapeHtml(report.input.businessAddress)}</span>`
          : ""
      }
      ${
        report.input.googleBusinessProfile
          ? `<span>GBP: <a href="${escapeHtml(
              report.input.googleBusinessProfile
            )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
              report.input.googleBusinessProfile
            )}</a></span>`
          : ""
      }
    </div>
    ${renderAuthorityBadges(report.targetSite.metrics)}
    <p class="muted">
      Automated crawl of target domain, ${report.competitors.length} competitor${
        report.competitors.length === 1 ? "" : "s"
      }, and keyword landscape to surface the next best actions for growth.
    </p>
  </header>`;
}

function renderKeywordSection(report: SeoReport) {
  const { strongestKeywords, quickWins, contentGaps } =
    report.keywordOpportunities;
  const localityKeywords = report.keywordOpportunities.localityKeywords ?? [];

  return `<section>
    <h2>1. Keyword Growth Priorities</h2>
    ${renderSenseCheckSummary(report)}
    <div style="margin-bottom: 1.5rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.85rem;">
      <strong style="display: block; margin-bottom: 0.5rem;">Data Source Legend:</strong>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
        <span><span class="source-badge moz">Moz</span> Validated by Moz Keyword Explorer</span>
        <span><span class="source-badge competitor">Competitor</span> Found in competitor analysis</span>
        <span><span class="source-badge site">Site</span> Extracted from your site</span>
        <span><span class="source-badge blended">Multi</span> Multiple sources</span>
      </div>
    </div>
    <div class="grid three">
      <div>
        <h3>Primary Demand Signals</h3>
        <p class="muted">The highest scoring themes across competitor landscapes.</p>
        ${renderKeywordList(strongestKeywords)}
      </div>
      <div>
        <h3>Quick Win Enhancements</h3>
        <p class="muted">Keywords we already have topical authority for—optimise copy and internal linking to capture near-term lifts.</p>
        ${renderKeywordList(quickWins)}
      </div>
      <div>
        <h3>Local Dominance</h3>
        <p class="muted">Location-infused queries critical for regional visibility.</p>
        ${renderKeywordList(localityKeywords)}
      </div>
    </div>
    <h3>Content Gap Actions</h3>
    <table>
      <thead>
        <tr>
          <th>Keyword</th>
          <th>Opportunity</th>
          <th>Recommended Action</th>
        </tr>
      </thead>
      <tbody>
        ${contentGaps
          .map(
            (gap) => `<tr>
              <td><strong>${escapeHtml(gap.keyword)}</strong></td>
              <td>${escapeHtml(gap.opportunity)}</td>
              <td class="muted">${escapeHtml(gap.recommendedAction)}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </section>`;
}

function renderSenseCheckSummary(report: SeoReport) {
  const senseCheck = report.senseCheck ?? {
    enabled: true,
    flaggedKeywords: [],
    notes: [],
  };
  const hasFlags = senseCheck.flaggedKeywords.length > 0;
  const hasNotes = senseCheck.notes.length > 0;
  const statusText = senseCheck.enabled
    ? "Sense check active — Moz heuristics and AI filtered the keyword pools before ranking."
    : "Sense check disabled — raw keyword pools shown without AI filtering.";

  const flaggedList = hasFlags
    ? `<div style="margin-top:0.75rem;">
        <p class="muted" style="text-transform:uppercase;font-size:0.75rem;letter-spacing:0.18em;">Filtered</p>
        <ul>${senseCheck.flaggedKeywords
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.keyword)}</strong>${
                item.reason ? ` — ${escapeHtml(item.reason)}` : ""
              }</li>`
          )
          .join("")}</ul>
      </div>`
    : "";

  const notesList = hasNotes
    ? `<div style="margin-top:0.75rem;">
        <p class="muted" style="text-transform:uppercase;font-size:0.75rem;letter-spacing:0.18em;">Notes</p>
        <ul>${senseCheck.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
      </div>`
    : "";

  const cleanMsg =
    !hasFlags && !hasNotes && senseCheck.enabled
      ? `<p class="muted" style="margin-top:0.5rem;">All collected keywords cleared the sense check—no anomalies detected.</p>`
      : "";

  return `<div class="callout" style="margin-bottom:1.5rem;background:rgba(35,51,89,0.6);border-color:rgba(109,139,255,0.3);">
    <p style="margin:0 0 0.3rem 0;font-weight:600;"><span style="display:inline-flex;align-items:center;gap:0.4rem;">
      <span style="display:inline-block;width:0.65rem;height:0.65rem;border-radius:999px;background:${
        senseCheck.enabled ? "var(--success)" : "rgba(255,255,255,0.25)"
      };"></span>
      Sense check ${senseCheck.enabled ? "active" : "bypassed"}
    </span></p>
    <p class="muted" style="margin:0;">${escapeHtml(statusText)}</p>
    ${flaggedList}
    ${notesList}
    ${cleanMsg}
  </div>`;
}

function renderKeywordList(keywords: KeywordStat[]) {
  if (!keywords.length) {
    return `<p class="muted">No validated keywords surfaced yet—rerun the crawl or widen the dataset to unlock insights.</p>`;
  }
  return `<ul>
    ${keywords
      .map((keyword) => {
        const sourceBadge = renderSourceBadge(keyword.source);
        return `<li><strong>${escapeHtml(keyword.keyword)}</strong>${sourceBadge} &middot; signal score ${keyword.score.toFixed(
          1
        )}${
          typeof keyword.volume === "number"
            ? ` &middot; ~${Math.round(keyword.volume).toLocaleString()} searches/mo`
            : ""
        }${
          typeof keyword.difficulty === "number"
            ? ` &middot; difficulty ${Math.round(keyword.difficulty)}`
            : ""
        } &middot; avg density ${keyword.density.toFixed(2)}%</li>`;
      })
      .join("")}
  </ul>`;
}

function renderSourceBadge(source?: "page" | "site" | "competitor" | "dataset" | "blended"): string {
  if (!source) return "";

  const labels: Record<typeof source, string> = {
    page: "Site",
    site: "Site",
    competitor: "Competitor",
    dataset: "Moz",
    blended: "Multi",
  };

  const cssClass = source === "dataset" ? "moz" : source === "page" || source === "site" ? "site" : source;

  return `<span class="source-badge ${cssClass}">${labels[source]}</span>`;
}

function renderSiteAudit(report: SeoReport) {
  const rows = report.targetSite.pages
    .map((page) => {
      if (page.status !== "ok") {
        return `<tr>
          <td colspan="5">
            <strong>${escapeHtml(page.url)}</strong><br />
            <span class="muted">Error: ${escapeHtml(page.error ?? "Unknown issue")}</span>
          </td>
        </tr>`;
      }

      return `<tr>
        <td><strong>${escapeHtml(page.url)}</strong><br/><span class="muted">${escapeHtml(
          page.titleTag
        )}</span></td>
        <td>${page.wordCount.toLocaleString()}</td>
        <td>${page.readability ?? "—"}</td>
        <td>${escapeHtml(page.h1 || "—")}</td>
        <td>
          ${page.keywords
            .slice(0, 5)
            .map((keyword) => `<code>${escapeHtml(keyword.keyword)}</code>`)
            .join(" ")}
        </td>
      </tr>`;
    })
    .join("");

  return `<section>
    <h2>2. Current Site Snapshot</h2>
    ${renderAuthorityPanel(report.targetSite.metrics)}
    <p class="muted">
      Crawl includes homepage plus high-authority internal URLs. Use this to prioritise technical clean-up and copy refinement.
    </p>
    <table>
      <thead>
        <tr>
          <th>URL</th>
          <th>Word Count</th>
          <th>Reading Ease</th>
          <th>Primary H1</th>
          <th>Dominant Keywords</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function renderMetadataPlan(report: SeoReport) {
  const { homepage, keyPages } = report.metadataPlan;

  return `<section>
    <h2>3. Metadata & Messaging</h2>
    <div class="grid two">
      ${renderMetadataCard("Homepage Core Treatment", homepage)}
      <div>
        <h3>Support Page Upgrades</h3>
        ${keyPages.map((page) => renderMetadataCardSmall(page)).join("")}
      </div>
    </div>
  </section>`;
}

function renderContentDrafts(report: SeoReport) {
  if (!report.contentDrafts || !report.contentDrafts.length) {
    return "";
  }

  return `<section>
    <h2>5. Production-Ready Content Drafts</h2>
    <p class="muted">These drafts are generated against the keyword strategy, metadata plan, and authority signals. Review, tweak brand nuances, and publish.</p>
    <div class="grid">
      ${report.contentDrafts
        .map((draft) => {
          return `<article class="callout" style="background:rgba(12,18,28,0.65);border:1px solid rgba(255,255,255,0.08);">
            <h3>${escapeHtml(draft.title)}</h3>
            <p class="muted">${escapeHtml(draft.summary)}</p>
            <div style="margin:1rem 0;">
              ${draft.sections
                .map(
                  (section) => `<div style="margin-bottom:1.25rem;">
                    <h4 style="margin:0 0 0.4rem;font-size:1.05rem;">${escapeHtml(section.heading)}</h4>
                    <p class="muted" style="margin:0 0 0.6rem;">${escapeHtml(section.purpose)}</p>
                    <div style="display:flex;flex-direction:column;gap:0.6rem;">${formatBody(section.body)}</div>
                    ${
                      section.targetKeywords?.length
                        ? `<p class="muted" style="font-size:0.85rem;"><strong>Target keywords:</strong> ${section.targetKeywords
                            .map((kw) => `<code>${escapeHtml(kw)}</code>`)
                            .join(" ")}</p>`
                        : ""
                    }
                    ${
                      section.internalLinks?.length
                        ? `<p class="muted" style="font-size:0.85rem;"><strong>Internal links:</strong> ${section.internalLinks
                            .map((link) => `<code>${escapeHtml(link)}</code>`)
                            .join(" ")}</p>`
                        : ""
                    }
                  </div>`
                )
                .join("")}
            </div>
            <div style="display:flex;flex-direction:column;gap:0.4rem;">
              <p><strong>Primary CTA:</strong> ${escapeHtml(draft.callToAction)}</p>
              ${draft.url ? `<p class="muted"><code>${escapeHtml(draft.url)}</code></p>` : ""}
            </div>
          </article>`;
        })
        .join("")}
    </div>
  </section>`;
}

function renderMetadataCard(title: string, metadata: MetadataRecommendation) {
  return `<div class="callout">
    <h3>${escapeHtml(title)}</h3>
    <p><strong>Meta Title</strong><br/>${escapeHtml(metadata.title)}</p>
    <p class="muted"><strong>Meta Description</strong><br/>${escapeHtml(
      metadata.description
    )}</p>
    <p><strong>H1</strong><br/>${escapeHtml(metadata.h1)}</p>
    <p class="muted">${escapeHtml(metadata.heroPitch)}</p>
    <p><strong>CTA</strong>: ${escapeHtml(metadata.callToAction)}</p>
  </div>`;
}

function renderMetadataCardSmall(metadata: MetadataRecommendation) {
  return `<div style="margin-bottom:1rem;padding:1rem;border:1px solid var(--border);border-radius:12px;background:rgba(12,18,28,0.6);">
    ${
      metadata.suggestedUrl
        ? `<p class="muted"><code>${escapeHtml(metadata.suggestedUrl)}</code></p>`
        : ""
    }
    <p><strong>${escapeHtml(metadata.title)}</strong></p>
    <p class="muted">${escapeHtml(metadata.description)}</p>
  </div>`;
}

function renderSiteArchitecture(report: SeoReport) {
  const architecture = report.siteArchitecture ?? [];
  if (!architecture.length) {
    return "";
  }

  const rows = architecture
    .map((entry) => {
      return `<tr>
        <td><code>${escapeHtml(entry.slug.startsWith("/") ? entry.slug : `/${entry.slug}`)}</code></td>
        <td>${escapeHtml(entry.title)}</td>
        <td class="muted">${escapeHtml(entry.purpose)}</td>
        <td>${escapeHtml(entry.status)}</td>
        <td>${entry.targetKeywords
          .map((keyword) => `<code>${escapeHtml(keyword)}</code>`)
          .join(" ")}</td>
      </tr>`;
    })
    .join("");

  return `<section>
    <h2>4. Proposed Site Architecture</h2>
    <p class="muted">Prioritise optimisation for existing pages, then create the missing destinations listed below.</p>
    <table>
      <thead>
        <tr>
          <th>Slug</th>
          <th>Title</th>
          <th>Purpose</th>
          <th>Status</th>
          <th>Target Keywords</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function renderPageBlueprints(report: SeoReport) {
  const { newPages, optimizationChecklist } = report.pageBlueprints;

  return `<section>
    <h2>6. Expansion Roadmap</h2>
    <div class="grid two">
      <div>
        <h3>New High-Intent Pages</h3>
        ${newPages
          .map(
            (page) => `<div style="margin-bottom:1rem;">
              <p><code>${escapeHtml(page.suggestedUrl ?? slugify(page.h1))}</code></p>
              <p><strong>${escapeHtml(page.title)}</strong></p>
              <p class="muted">${escapeHtml(page.description)}</p>
            </div>`
          )
          .join("")}
      </div>
      <div>
        <h3>Optimisation Checklist</h3>
        <ul>
          ${optimizationChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    </div>
  </section>`;
}

function renderRecommendations(report: SeoReport) {
  const recommendations = report.recommendations ?? [];
  if (!recommendations.length) return "";

  const items = recommendations
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `<section>
    <h2>7. Recommendations</h2>
    <p class="muted">Execution priorities distilled from keyword strategy, site audit, and authority signals.</p>
    <ul>
      ${items}
    </ul>
  </section>`;
}

function renderCompetitors(report: SeoReport) {
  if (!report.competitors.length) return "";

  const rows = report.competitors
    .map((competitor) => {
      const page = competitor.pages[0];
      if (!page || page.status !== "ok") {
        return `<tr>
          <td><strong>${escapeHtml(competitor.domain)}</strong></td>
          <td colspan="6" class="muted">${escapeHtml(page?.error ?? "Could not analyse competitor homepage.")}</td>
        </tr>`;
      }
      const metrics = competitor.metrics;
      const domainAuthorityCell =
        metrics?.domainAuthority !== undefined
          ? escapeHtml(String(metrics.domainAuthority))
          : `<span class="muted">Pending Moz data</span>`;
      const spamScoreCell =
        metrics?.spamScore !== undefined
          ? escapeHtml(`${metrics.spamScore}%`)
          : `<span class="muted">Pending</span>`;
      return `<tr>
        <td><strong>${escapeHtml(competitor.domain)}</strong><br/><span class="muted">${escapeHtml(
          page.url
        )}</span></td>
        <td>${escapeHtml(page.titleTag)}</td>
        <td>${escapeHtml(page.metaDescription)}</td>
        <td>${domainAuthorityCell}</td>
        <td>${spamScoreCell}</td>
        <td>${page.keywords
          .slice(0, 6)
          .map((keyword) => `<code>${escapeHtml(keyword.keyword)}</code>`)
          .join(" ")}</td>
      </tr>`;
    })
    .join("");

  return `<section>
    <h2>8. Competitor Edge</h2>
    <p class="muted">Benchmarking closest rivals to identify tone, positioning, and keyword plays we must counter.</p>
    <table>
      <thead>
        <tr>
          <th>Domain</th>
          <th>Meta Title</th>
          <th>Meta Description</th>
          <th>Domain Authority</th>
          <th>Spam Score</th>
          <th>Keyword Focus</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function renderAuthorityBadges(metrics: SeoReport["targetSite"]["metrics"] | undefined | null) {
  if (!metrics || (!metrics.domainAuthority && !metrics.linkingDomains)) {
    return "";
  }

  const badge = (label: string, value: string) =>
    `<span class="tag" style="background:rgba(109,139,255,0.08);color:#c2cbff">${label}: ${value}</span>`;

  const parts: string[] = [];
  if (metrics.domainAuthority !== undefined) {
    parts.push(badge("Domain Authority", String(metrics.domainAuthority)));
  }
  if (metrics.linkingDomains !== undefined) {
    parts.push(badge("Linking Domains", metrics.linkingDomains.toLocaleString()));
  }
  if (metrics.spamScore !== undefined) {
    parts.push(badge("Spam Score", `${metrics.spamScore}%`));
  }

  return `<div class="meta" style="gap:0.5rem;margin-top:0.5rem;">${parts.join(" ")}</div>`;
}

function renderAuthorityPanel(metrics: SeoReport["targetSite"]["metrics"] | undefined | null) {
  if (!metrics) return "";
  return `<div class="callout" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.5rem;">
    ${renderAuthorityStat("Domain Authority", metrics.domainAuthority)}
    ${renderAuthorityStat("Page Authority", metrics.pageAuthority)}
    ${renderAuthorityStat("Linking Domains", metrics.linkingDomains)}
    ${renderAuthorityStat("Spam Score", metrics.spamScore !== undefined ? `${metrics.spamScore}%` : undefined)}
  </div>`;
}

function renderAuthorityStat(label: string, value?: number | string) {
  if (value === undefined || value === null || value === "undefined") return "";
  return `<div>
    <p class="muted" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.2em;">${escapeHtml(label)}</p>
    <p style="font-size:1.4rem;font-weight:600;margin-top:0.25rem;">${escapeHtml(String(value))}</p>
  </div>`;
}

function formatBody(body: string): string {
  const paragraphs = body
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    const single = body.trim();
    return single ? `<p>${escapeHtml(single)}</p>` : "";
  }

  return paragraphs.map((para) => `<p>${escapeHtml(para)}</p>`).join("");
}

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
