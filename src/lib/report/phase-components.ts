/**
 * Phase 5: Phase Visualization Components
 *
 * Creates distinct, beautiful HTML components for each phase section
 * with collapsible content, visual hierarchy, and progressive disclosure.
 */

import type {
  PhaseSection,
  IntelligenceReport,
  StrategyReport,
  BlueprintReport,
  GeneratedContentReport,
  KeywordCluster,
  PageStrategy,
  PageBlueprint,
  GeneratedPageContent,
} from './types';
import type { SeoReport } from '../types';

/**
 * Escape HTML for safe rendering
 */
function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate Phase 1: Intelligence section HTML
 */
export function renderPhase1Intelligence(report: SeoReport): string {
  const targetPages = report.targetSite.pages.filter((p) => p.status === 'ok');
  const totalImages = targetPages.reduce((sum, p) => {
    // Estimate images from content (this is a placeholder - would need actual image extraction)
    return sum + Math.floor(p.wordCount / 300); // Rough estimate
  }, 0);
  const avgWordCount = targetPages.length > 0
    ? Math.round(targetPages.reduce((sum, p) => sum + p.wordCount, 0) / targetPages.length)
    : 0;

  const competitorPages = report.competitors.flatMap((c) => c.pages.filter((p) => p.status === 'ok'));
  const competitorAvgWordCount = competitorPages.length > 0
    ? Math.round(competitorPages.reduce((sum, p) => sum + p.wordCount, 0) / competitorPages.length)
    : 0;

  const wordCountGap = competitorAvgWordCount - avgWordCount;
  const gapPercentage = avgWordCount > 0 ? Math.round((wordCountGap / avgWordCount) * 100) : 0;

  return `
<section class="phase-section" id="phase-1">
  <div class="phase-header">
    <div class="phase-title">
      <span class="phase-icon">📊</span>
      <h2>Phase 1: Intelligence Gathering</h2>
      <button class="toggle-btn" onclick="togglePhase('phase-1')" aria-label="Toggle Phase 1">
        <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
        </svg>
      </button>
    </div>
    <p class="phase-summary">Comprehensive analysis of your site, ${report.competitors.length} competitor${report.competitors.length === 1 ? '' : 's'}, and content benchmarks</p>
  </div>

  <div class="phase-stats">
    <div class="stat-card">
      <div class="stat-label">Pages Analyzed</div>
      <div class="stat-value">${targetPages.length}</div>
    </div>
    <div class="stat-card ${wordCountGap > 0 ? 'warning' : 'success'}">
      <div class="stat-label">Avg Word Count</div>
      <div class="stat-value">${avgWordCount.toLocaleString()}</div>
      <div class="stat-meta">vs ${competitorAvgWordCount.toLocaleString()} competitor avg</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Image Coverage</div>
      <div class="stat-value">${Math.round((totalImages / Math.max(targetPages.length, 1)) * 100)}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Competitors</div>
      <div class="stat-value">${report.competitors.length}</div>
    </div>
  </div>

  <div class="phase-content">
    <div class="content-grid">
      <div class="content-block">
        <h3>Your Site Snapshot</h3>
        <div class="insights">
          <div class="insight-item">
            <span class="insight-icon">📄</span>
            <div>
              <strong>${targetPages.length} pages crawled</strong>
              <p class="muted">Average ${avgWordCount.toLocaleString()} words per page</p>
            </div>
          </div>
          ${wordCountGap > 0 ? `
          <div class="insight-item warning">
            <span class="insight-icon">⚠️</span>
            <div>
              <strong>${gapPercentage}% content gap</strong>
              <p class="muted">Your pages average ${wordCountGap.toLocaleString()} fewer words than competitors</p>
            </div>
          </div>
          ` : ''}
          <div class="insight-item">
            <span class="insight-icon">🎯</span>
            <div>
              <strong>${report.targetSite.aggregatedKeywords.length} unique keywords</strong>
              <p class="muted">Extracted from existing content</p>
            </div>
          </div>
        </div>

        <button class="expand-btn" onclick="toggleDetail('site-detail')">
          View Full Site Analysis
          <svg class="chevron-small" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
          </svg>
        </button>

        <div id="site-detail" class="detail-panel" style="display: none;">
          <table class="data-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Words</th>
                <th>Readability</th>
                <th>Top Keywords</th>
              </tr>
            </thead>
            <tbody>
              ${targetPages.slice(0, 20).map((page) => `
                <tr>
                  <td>
                    <div class="url-cell">
                      <strong>${escapeHtml(page.url.replace(report.input.website, ''))}</strong>
                      <span class="muted">${escapeHtml(page.titleTag.slice(0, 60))}${page.titleTag.length > 60 ? '...' : ''}</span>
                    </div>
                  </td>
                  <td>${page.wordCount.toLocaleString()}</td>
                  <td>${page.readability ?? '—'}</td>
                  <td>
                    ${page.keywords.slice(0, 3).map((kw) => `<code>${escapeHtml(kw.keyword)}</code>`).join(' ')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="content-block">
        <h3>Competitor Benchmarks</h3>
        <div class="insights">
          ${report.competitors.map((comp) => {
            const compPages = comp.pages.filter((p) => p.status === 'ok');
            const compAvg = compPages.length > 0
              ? Math.round(compPages.reduce((sum, p) => sum + p.wordCount, 0) / compPages.length)
              : 0;
            return `
            <div class="insight-item">
              <span class="insight-icon">🏢</span>
              <div>
                <strong>${escapeHtml(comp.domain)}</strong>
                <p class="muted">${compPages.length} pages • ${compAvg.toLocaleString()} avg words</p>
                ${comp.metrics?.domainAuthority ? `<p class="muted">DA: ${comp.metrics.domainAuthority}</p>` : ''}
              </div>
            </div>
            `;
          }).join('')}
        </div>

        <button class="expand-btn" onclick="toggleDetail('competitor-detail')">
          View Competitor Analysis
          <svg class="chevron-small" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
          </svg>
        </button>

        <div id="competitor-detail" class="detail-panel" style="display: none;">
          ${report.competitors.map((comp) => {
            const homePage = comp.pages.find((p) => p.status === 'ok');
            if (!homePage) return '';
            return `
            <div class="competitor-card">
              <h4>${escapeHtml(comp.domain)}</h4>
              <div class="meta-grid">
                ${comp.metrics?.domainAuthority ? `<div><span class="label">DA:</span> ${comp.metrics.domainAuthority}</div>` : ''}
                ${comp.metrics?.pageAuthority ? `<div><span class="label">PA:</span> ${comp.metrics.pageAuthority}</div>` : ''}
                ${comp.metrics?.linkingDomains ? `<div><span class="label">Linking Domains:</span> ${comp.metrics.linkingDomains.toLocaleString()}</div>` : ''}
              </div>
              <p class="muted">${escapeHtml(homePage.metaDescription.slice(0, 150))}${homePage.metaDescription.length > 150 ? '...' : ''}</p>
              <div class="keyword-pills">
                ${homePage.keywords.slice(0, 8).map((kw) => `<span class="pill">${escapeHtml(kw.keyword)}</span>`).join('')}
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  </div>
</section>
  `;
}

/**
 * Generate Phase 2: Strategy section HTML
 */
export function renderPhase2Strategy(report: SeoReport): string {
  const architecture = report.siteArchitecture ?? [];
  const createPages = architecture.filter((p) => p.status === 'create');
  const optimizePages = architecture.filter((p) => p.status === 'optimise');
  const keepPages = architecture.filter((p) => p.status === 'keep');

  const totalKeywords = report.keywordOpportunities.strongestKeywords.length +
    report.keywordOpportunities.quickWins.length +
    report.keywordOpportunities.localityKeywords.length;

  const totalVolume = [...report.keywordOpportunities.strongestKeywords,
    ...report.keywordOpportunities.quickWins,
    ...report.keywordOpportunities.localityKeywords]
    .reduce((sum, kw) => sum + (kw.volume ?? 0), 0);

  return `
<section class="phase-section" id="phase-2">
  <div class="phase-header">
    <div class="phase-title">
      <span class="phase-icon">🎯</span>
      <h2>Phase 2: Strategic Planning</h2>
      <button class="toggle-btn" onclick="togglePhase('phase-2')" aria-label="Toggle Phase 2">
        <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
        </svg>
      </button>
    </div>
    <p class="phase-summary">Keyword clustering, site architecture blueprint, and content gap analysis</p>
  </div>

  <div class="phase-stats">
    <div class="stat-card success">
      <div class="stat-label">Keywords Identified</div>
      <div class="stat-value">${totalKeywords}</div>
      <div class="stat-meta">${Math.round(totalVolume).toLocaleString()} monthly volume</div>
    </div>
    <div class="stat-card create">
      <div class="stat-label">Pages to Create</div>
      <div class="stat-value">${createPages.length}</div>
    </div>
    <div class="stat-card optimize">
      <div class="stat-label">Pages to Optimize</div>
      <div class="stat-value">${optimizePages.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Content Gaps</div>
      <div class="stat-value">${report.keywordOpportunities.contentGaps.length}</div>
    </div>
  </div>

  <div class="phase-content">
    <h3>Keyword Strategy</h3>
    <div class="keyword-clusters">
      <div class="cluster-card primary">
        <h4>Primary Demand Signals</h4>
        <p class="muted">Highest scoring keywords from competitor analysis</p>
        <div class="keyword-list">
          ${report.keywordOpportunities.strongestKeywords.slice(0, 10).map((kw) => `
            <div class="keyword-row">
              <div>
                <strong>${escapeHtml(kw.keyword)}</strong>
                <span class="keyword-meta">
                  Score: ${kw.score.toFixed(1)}
                  ${kw.volume ? ` • ${Math.round(kw.volume).toLocaleString()}/mo` : ''}
                  ${kw.difficulty ? ` • Diff: ${Math.round(kw.difficulty)}` : ''}
                </span>
              </div>
              <span class="source-badge ${kw.source}">${kw.source ?? 'unknown'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="cluster-card quick-win">
        <h4>Quick Win Enhancements</h4>
        <p class="muted">Keywords you already rank for—optimize to capture more</p>
        <div class="keyword-list">
          ${report.keywordOpportunities.quickWins.slice(0, 10).map((kw) => `
            <div class="keyword-row">
              <div>
                <strong>${escapeHtml(kw.keyword)}</strong>
                <span class="keyword-meta">
                  Score: ${kw.score.toFixed(1)} • Density: ${kw.density.toFixed(2)}%
                </span>
              </div>
              <span class="source-badge ${kw.source}">${kw.source ?? 'site'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="cluster-card local">
        <h4>Local Dominance</h4>
        <p class="muted">Location-specific queries for regional visibility</p>
        <div class="keyword-list">
          ${report.keywordOpportunities.localityKeywords.slice(0, 10).map((kw) => `
            <div class="keyword-row">
              <div>
                <strong>${escapeHtml(kw.keyword)}</strong>
                <span class="keyword-meta">
                  Score: ${kw.score.toFixed(1)}
                  ${kw.volume ? ` • ${Math.round(kw.volume).toLocaleString()}/mo` : ''}
                </span>
              </div>
              <span class="source-badge local">local</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <h3>Site Architecture Blueprint</h3>
    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterArchitecture('all')">All (${architecture.length})</button>
      <button class="filter-btn" onclick="filterArchitecture('create')">Create (${createPages.length})</button>
      <button class="filter-btn" onclick="filterArchitecture('optimize')">Optimize (${optimizePages.length})</button>
      <button class="filter-btn" onclick="filterArchitecture('keep')">Keep (${keepPages.length})</button>
    </div>

    <div class="architecture-grid" id="architecture-grid">
      ${architecture.slice(0, 20).map((page) => `
        <div class="architecture-card" data-status="${page.status}">
          <div class="card-header">
            <span class="status-badge ${page.status}">${page.status === 'optimise' ? 'optimize' : page.status}</span>
            <code class="url">${escapeHtml(page.slug.startsWith('/') ? page.slug : `/${page.slug}`)}</code>
          </div>
          <h4>${escapeHtml(page.title)}</h4>
          <p class="muted">${escapeHtml(page.purpose)}</p>
          <div class="keyword-pills">
            ${page.targetKeywords.slice(0, 4).map((kw) => `<span class="pill">${escapeHtml(kw)}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>
  `;
}

/**
 * Generate executive summary
 */
export function renderExecutiveSummary(report: SeoReport): string {
  const architecture = report.siteArchitecture ?? [];
  const createCount = architecture.filter((p) => p.status === 'create').length;
  const optimizeCount = architecture.filter((p) => p.status === 'optimise').length;

  const totalKeywords = report.keywordOpportunities.strongestKeywords.length +
    report.keywordOpportunities.quickWins.length +
    report.keywordOpportunities.localityKeywords.length;

  const totalVolume = [...report.keywordOpportunities.strongestKeywords,
    ...report.keywordOpportunities.quickWins,
    ...report.keywordOpportunities.localityKeywords]
    .reduce((sum, kw) => sum + (kw.volume ?? 0), 0);

  const targetPages = report.targetSite.pages.filter((p) => p.status === 'ok');
  const avgWordCount = targetPages.length > 0
    ? Math.round(targetPages.reduce((sum, p) => sum + p.wordCount, 0) / targetPages.length)
    : 0;

  const competitorPages = report.competitors.flatMap((c) => c.pages.filter((p) => p.status === 'ok'));
  const competitorAvgWordCount = competitorPages.length > 0
    ? Math.round(competitorPages.reduce((sum, p) => sum + p.wordCount, 0) / competitorPages.length)
    : 0;

  return `
<section class="executive-summary">
  <h2>Executive Summary</h2>
  <div class="summary-hero">
    <p class="hero-text">
      Your site needs <strong>${createCount} new pages</strong> and <strong>${optimizeCount} optimizations</strong>
      to dominate ${escapeHtml(report.locality.serviceArea || report.locality.primaryLocation || 'your market')}
      ${escapeHtml(report.input.businessType)} searches.
    </p>
  </div>

  <div class="key-findings">
    <h3>Key Findings</h3>
    <div class="findings-grid">
      <div class="finding success">
        <span class="finding-icon">✓</span>
        <div>
          <strong>${totalKeywords} keywords identified</strong>
          <p>${Math.round(totalVolume).toLocaleString()} total monthly search volume</p>
        </div>
      </div>
      <div class="finding success">
        <span class="finding-icon">✓</span>
        <div>
          <strong>${report.keywordOpportunities.contentGaps.length} high-priority gaps found</strong>
          <p>Content opportunities competitors are exploiting</p>
        </div>
      </div>
      ${competitorAvgWordCount > avgWordCount ? `
      <div class="finding warning">
        <span class="finding-icon">⚠️</span>
        <div>
          <strong>Content depth gap detected</strong>
          <p>Competitor avg: ${competitorAvgWordCount.toLocaleString()} words (yours: ${avgWordCount.toLocaleString()})</p>
        </div>
      </div>
      ` : ''}
      <div class="finding info">
        <span class="finding-icon">📊</span>
        <div>
          <strong>Estimated Timeline: 8-12 weeks</strong>
          <p>For full implementation of strategy</p>
        </div>
      </div>
      <div class="finding info">
        <span class="finding-icon">📈</span>
        <div>
          <strong>Estimated Impact: 3-5x traffic</strong>
          <p>Within 6 months of implementation</p>
        </div>
      </div>
    </div>
  </div>
</section>
  `;
}
