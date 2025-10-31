/**
 * Phase 5: Enhanced Report Template
 *
 * Modern, beautiful HTML template with navigation, copy buttons,
 * collapsible sections, dark mode, and full responsive design.
 */

import type { SeoReport } from '../types';
import {
  renderExecutiveSummary,
  renderPhase1Intelligence,
  renderPhase2Strategy,
} from './phase-components';
import { renderPhase3Blueprints } from './blueprint-cards';
import { renderPhase4GeneratedContent, generateExportScripts } from './export-tools';

/**
 * Generate complete enhanced HTML report
 */
export function generateEnhancedReport(report: SeoReport): string {
  const generatedDate = new Date(report.generatedAt).toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(report.input.businessName)} | SEO Strategy Report</title>
  ${renderStyles()}
</head>
<body>
  ${renderNavigationSidebar(report)}

  <div class="main-content">
    <div class="container">
      ${renderHeader(report, generatedDate)}
      ${renderDataQualityWarnings(report)}
      ${renderExecutiveSummary(report)}
      ${renderPhase1Intelligence(report)}
      ${renderPhase2Strategy(report)}
      ${renderPhase3Blueprints(report)}
      ${renderPhase4GeneratedContent(report)}
      ${renderExportSection(report)}
    </div>
  </div>

  ${renderInteractiveScripts()}
  ${generateExportScripts()}
</body>
</html>`;
}

/**
 * Render header section
 */
function renderHeader(report: SeoReport, generatedDate: string): string {
  return `
<header class="report-header">
  <div class="header-badge">SEO Strategy Report</div>
  <h1>${escapeHtml(report.input.businessName)}</h1>
  <div class="header-meta">
    <span>Generated: ${escapeHtml(generatedDate)}</span>
    <span>•</span>
    <span>${escapeHtml(report.input.website)}</span>
    <span>•</span>
    <span>${escapeHtml(report.input.businessType)}</span>
    ${report.input.serviceArea ? `<span>•</span><span>${escapeHtml(report.input.serviceArea)}</span>` : ''}
  </div>
  <p class="header-description">
    Comprehensive SEO intelligence report covering ${report.targetSite.pages.filter((p) => p.status === 'ok').length} pages analyzed,
    ${report.competitors.length} competitor${report.competitors.length === 1 ? '' : 's'} benchmarked,
    and strategic recommendations for organic growth.
  </p>
</header>
  `;
}

/**
 * Render navigation sidebar
 */
function renderNavigationSidebar(report: SeoReport): string {
  const hasContent = (report.contentDrafts?.length ?? 0) > 0;

  return `
<nav class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <h2>Navigation</h2>
    <button class="sidebar-toggle" onclick="toggleSidebar()" aria-label="Toggle sidebar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>

  <ul class="nav-menu">
    <li><a href="#top" class="nav-link">Executive Summary</a></li>
    <li>
      <a href="#phase-1" class="nav-link phase-link">
        <span class="nav-icon">📊</span>
        <span>Phase 1: Intelligence</span>
      </a>
    </li>
    <li>
      <a href="#phase-2" class="nav-link phase-link">
        <span class="nav-icon">🎯</span>
        <span>Phase 2: Strategy</span>
      </a>
    </li>
    <li>
      <a href="#phase-3" class="nav-link phase-link">
        <span class="nav-icon">🏗️</span>
        <span>Phase 3: Blueprints</span>
      </a>
    </li>
    <li>
      <a href="#phase-4" class="nav-link phase-link">
        <span class="nav-icon">✍️</span>
        <span>Phase 4: Content</span>
      </a>
    </li>
    <li>
      <a href="#export-section" class="nav-link">
        <span class="nav-icon">📥</span>
        <span>Export All</span>
      </a>
    </li>
  </ul>

  <div class="sidebar-footer">
    <button class="btn-secondary" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Print Report
    </button>
  </div>
</nav>

<button class="mobile-nav-toggle" onclick="toggleSidebar()" aria-label="Toggle navigation">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
</button>
  `;
}

/**
 * Render data quality warnings
 */
function renderDataQualityWarnings(report: SeoReport): string {
  if (!report.dataQualityWarnings || report.dataQualityWarnings.length === 0) {
    return '';
  }

  return `
<div class="warning-box">
  <div class="warning-header">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
    <h3>Data Quality Notice</h3>
  </div>
  <ul>
    ${report.dataQualityWarnings.map((warning) =>
      `<li>${escapeHtml(warning.replace(/^⚠️\s*/, ''))}</li>`
    ).join('')}
  </ul>
</div>
  `;
}

/**
 * Render export section
 */
function renderExportSection(report: SeoReport): string {
  return `
<section class="export-section" id="export-section">
  <div class="section-header-large">
    <span class="section-icon">📥</span>
    <h2>Export Complete Strategy</h2>
  </div>

  <div class="export-grid">
    <div class="export-card">
      <h3>Complete Package</h3>
      <p>Download everything as a ZIP file including all pages, schema, and documentation</p>
      <button class="export-btn primary" onclick="exportAllContent()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download ZIP
      </button>
      <div class="package-contents">
        <strong>Includes:</strong>
        <ul>
          <li>All page content (.md + .html)</li>
          <li>Schema markup files (.json)</li>
          <li>Implementation checklist</li>
          <li>Keyword strategy document</li>
          <li>Internal linking map</li>
        </ul>
      </div>
    </div>

    <div class="export-card">
      <h3>Implementation Checklist</h3>
      <p>Step-by-step guide for rolling out the complete strategy</p>
      <button class="export-btn" onclick="exportImplementationChecklist()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        Download Checklist
      </button>
    </div>

    <div class="export-card">
      <h3>Print Report</h3>
      <p>Print-optimized version of the complete strategy</p>
      <button class="export-btn" onclick="window.print()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Print Report
      </button>
    </div>
  </div>
</section>
  `;
}

/**
 * Render CSS styles
 */
function renderStyles(): string {
  return `
<style>
  /* Reset & Base Styles */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --bg-primary: #0a0e17;
    --bg-secondary: #0f1419;
    --bg-elevated: #161b22;
    --bg-card: #1a1f28;
    --border: rgba(255, 255, 255, 0.08);
    --border-bright: rgba(255, 255, 255, 0.15);
    --text-primary: #f0f6fc;
    --text-secondary: #9198a1;
    --text-muted: #6e7681;
    --accent-blue: #58a6ff;
    --accent-purple: #a371f7;
    --accent-green: #3fb950;
    --accent-yellow: #f0883e;
    --success: #3fb950;
    --warning: #f0883e;
    --danger: #f85149;
    --sidebar-width: 280px;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* Layout */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: var(--sidebar-width);
    height: 100vh;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    padding: 2rem 0;
    overflow-y: auto;
    z-index: 1000;
    transition: transform 0.3s ease;
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
  }

  .sidebar-header {
    padding: 0 1.5rem 1.5rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sidebar-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .sidebar-toggle {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .sidebar-toggle:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .nav-menu {
    list-style: none;
    padding: 1rem 0;
  }

  .nav-menu li {
    margin: 0.25rem 0;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all 0.2s;
    border-left: 3px solid transparent;
  }

  .nav-link:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-left-color: var(--accent-blue);
  }

  .nav-link.active {
    background: var(--bg-elevated);
    color: var(--accent-blue);
    border-left-color: var(--accent-blue);
  }

  .nav-icon {
    font-size: 1.25rem;
  }

  .sidebar-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--border);
    margin-top: auto;
  }

  .main-content {
    margin-left: var(--sidebar-width);
    min-height: 100vh;
    transition: margin-left 0.3s ease;
  }

  .main-content.expanded {
    margin-left: 0;
  }

  .mobile-nav-toggle {
    display: none;
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 999;
    background: var(--accent-blue);
    border: none;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    color: white;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem 5rem;
  }

  /* Header */
  .report-header {
    text-align: center;
    padding: 3rem 2rem;
    background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%);
    border-radius: 16px;
    border: 1px solid var(--border-bright);
    margin-bottom: 3rem;
  }

  .header-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(88, 166, 255, 0.15);
    color: var(--accent-blue);
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }

  .report-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-blue) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-meta {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }

  .header-description {
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }

  /* Warning Box */
  .warning-box {
    background: rgba(240, 136, 62, 0.1);
    border: 1px solid rgba(240, 136, 62, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .warning-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--warning);
    margin-bottom: 1rem;
  }

  .warning-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .warning-box ul {
    list-style: none;
    padding-left: 0;
  }

  .warning-box li {
    padding: 0.5rem 0;
    color: var(--text-secondary);
  }

  .warning-box li::before {
    content: '⚠️';
    margin-right: 0.5rem;
  }

  /* Executive Summary */
  .executive-summary {
    margin-bottom: 4rem;
  }

  .executive-summary h2 {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .summary-hero {
    background: linear-gradient(135deg, rgba(88, 166, 255, 0.15) 0%, rgba(163, 113, 247, 0.15) 100%);
    border: 1px solid var(--border-bright);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .hero-text {
    font-size: 1.25rem;
    line-height: 1.6;
    color: var(--text-primary);
  }

  .hero-text strong {
    color: var(--accent-blue);
  }

  .key-findings h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .findings-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .finding {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .finding.success {
    border-left: 3px solid var(--success);
  }

  .finding.warning {
    border-left: 3px solid var(--warning);
  }

  .finding.info {
    border-left: 3px solid var(--accent-blue);
  }

  .finding-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .finding strong {
    display: block;
    margin-bottom: 0.25rem;
    color: var(--text-primary);
  }

  .finding p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  /* Phase Sections */
  .phase-section {
    margin-bottom: 4rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .phase-header {
    padding: 2rem;
    background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
    border-bottom: 1px solid var(--border);
  }

  .phase-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .phase-icon {
    font-size: 2rem;
  }

  .phase-title h2 {
    font-size: 1.75rem;
    font-weight: 600;
    flex: 1;
  }

  .toggle-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .toggle-btn .chevron {
    transition: transform 0.3s ease;
  }

  .toggle-btn.expanded .chevron {
    transform: rotate(180deg);
  }

  .phase-summary {
    color: var(--text-secondary);
    font-size: 1.05rem;
  }

  .phase-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    background: var(--bg-card);
  }

  .stat-card {
    padding: 1.5rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 12px;
    text-align: center;
  }

  .stat-card.success {
    border-left: 3px solid var(--success);
  }

  .stat-card.warning {
    border-left: 3px solid var(--warning);
  }

  .stat-card.create {
    border-left: 3px solid var(--accent-green);
  }

  .stat-card.optimize {
    border-left: 3px solid var(--accent-blue);
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-meta {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }

  .phase-content {
    padding: 2rem;
  }

  /* Content blocks */
  .content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 2rem;
  }

  .content-block {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
  }

  .content-block h3 {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
  }

  .insights {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .insight-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .insight-item.warning {
    border-left: 3px solid var(--warning);
    background: rgba(240, 136, 62, 0.05);
  }

  .insight-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .expand-btn, .control-btn, .filter-btn {
    margin-top: 1rem;
    padding: 0.75rem 1.25rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .expand-btn:hover, .control-btn:hover, .filter-btn:hover {
    background: var(--bg-card);
    color: var(--text-primary);
    border-color: var(--border-bright);
  }

  .filter-btn.active {
    background: var(--accent-blue);
    color: white;
    border-color: var(--accent-blue);
  }

  .detail-panel {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .url-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .competitor-card {
    padding: 1.5rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .competitor-card h4 {
    margin-bottom: 1rem;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .meta-grid .label {
    font-weight: 600;
    color: var(--text-secondary);
  }

  .keyword-pills, .keyword-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .pill {
    padding: 0.35rem 0.75rem;
    background: rgba(88, 166, 255, 0.15);
    color: var(--accent-blue);
    border-radius: 999px;
    font-size: 0.875rem;
  }

  .pill.primary {
    background: rgba(88, 166, 255, 0.25);
    font-weight: 600;
  }

  /* Keyword clusters */
  .keyword-clusters {
    display: grid;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .cluster-card {
    padding: 1.5rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .cluster-card.primary {
    border-left: 3px solid var(--accent-blue);
  }

  .cluster-card.quick-win {
    border-left: 3px solid var(--accent-green);
  }

  .cluster-card.local {
    border-left: 3px solid var(--accent-purple);
  }

  .cluster-card h4 {
    font-size: 1.15rem;
    margin-bottom: 0.5rem;
  }

  .keyword-list {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .keyword-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-elevated);
    border-radius: 6px;
  }

  .keyword-meta {
    display: block;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .source-badge {
    padding: 0.25rem 0.5rem;
    background: var(--bg-primary);
    border-radius: 4px;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
  }

  .source-badge.competitor {
    color: var(--accent-yellow);
  }

  .source-badge.site, .source-badge.page {
    color: var(--accent-blue);
  }

  .source-badge.dataset {
    color: var(--accent-green);
  }

  .source-badge.local {
    color: var(--accent-purple);
  }

  /* Architecture */
  .filter-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .architecture-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .architecture-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s;
  }

  .architecture-card:hover {
    border-color: var(--border-bright);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .status-badge {
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge.create {
    background: rgba(63, 185, 80, 0.15);
    color: var(--accent-green);
  }

  .status-badge.optimize, .status-badge.optimise {
    background: rgba(88, 166, 255, 0.15);
    color: var(--accent-blue);
  }

  .status-badge.keep {
    background: rgba(145, 152, 161, 0.15);
    color: var(--text-secondary);
  }

  .url {
    font-size: 0.875rem;
  }

  /* Blueprints */
  .blueprint-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .blueprints-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .blueprint-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .blueprint-header {
    padding: 1.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .blueprint-header:hover {
    background: var(--bg-elevated);
  }

  .blueprint-header.expanded {
    background: var(--bg-elevated);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .page-type-icon {
    font-size: 1.25rem;
  }

  .blueprint-url {
    font-size: 0.875rem;
  }

  .priority-score {
    padding: 0.35rem 0.75rem;
    background: rgba(88, 166, 255, 0.15);
    color: var(--accent-blue);
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .blueprint-title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .blueprint-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .meta-item strong {
    color: var(--text-primary);
  }

  .expand-indicator {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    margin-top: 1rem;
  }

  .chevron-small {
    transition: transform 0.3s ease;
  }

  .blueprint-header.expanded .chevron-small {
    transform: rotate(180deg);
  }

  .blueprint-content {
    border-top: 1px solid var(--border);
    padding: 1.5rem;
  }

  .blueprint-section {
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h4 {
    font-size: 1.1rem;
    color: var(--text-primary);
  }

  .copyable-content {
    background: var(--bg-elevated);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .metadata-grid {
    display: grid;
    gap: 1rem;
  }

  .metadata-grid label {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    display: block;
  }

  .code-block {
    background: var(--bg-primary);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid var(--border);
  }

  .code-block code {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-primary);
  }

  /* Wireframe */
  .content-wireframe {
    background: var(--bg-elevated);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .wireframe {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .wireframe-section {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .wireframe-section.hero {
    border-left: 3px solid var(--accent-blue);
  }

  .wireframe-section.intro {
    border-left: 3px solid var(--accent-green);
  }

  .wireframe-section.faq {
    border-left: 3px solid var(--accent-purple);
  }

  .section-tag {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: rgba(88, 166, 255, 0.15);
    color: var(--accent-blue);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
  }

  .wireframe-section h3, .wireframe-section h4 {
    margin-bottom: 1rem;
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-spec {
    padding: 1rem;
    background: var(--bg-elevated);
    border-radius: 6px;
    font-size: 0.9rem;
    line-height: 1.8;
  }

  .element {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-elevated);
    border-radius: 6px;
  }

  .element.image {
    border-left: 3px solid var(--accent-purple);
  }

  .element.cta {
    border-left: 3px solid var(--accent-green);
  }

  .element-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .keyword-strategy {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Content pages */
  .export-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .content-pages {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .content-page-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .content-page-card.placeholder {
    opacity: 0.7;
  }

  .content-page-header {
    padding: 1.5rem;
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .content-page-header h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .content-meta {
    display: flex;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    flex-wrap: wrap;
  }

  .ready-badge {
    padding: 0.25rem 0.5rem;
    background: rgba(63, 185, 80, 0.15);
    color: var(--accent-green);
    border-radius: 4px;
    font-weight: 600;
  }

  .pending-badge {
    padding: 0.25rem 0.5rem;
    background: rgba(240, 136, 62, 0.15);
    color: var(--accent-yellow);
    border-radius: 4px;
    font-weight: 600;
  }

  .page-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.5rem 0.75rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .action-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-color: var(--border-bright);
  }

  .content-sections {
    padding: 1.5rem;
  }

  .content-section {
    margin-bottom: 2rem;
  }

  .copyable-section {
    background: var(--bg-elevated);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .content-preview {
    background: var(--bg-elevated);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .section-block {
    margin-bottom: 2rem;
  }

  .section-block h3 {
    font-size: 1.15rem;
    margin-bottom: 0.75rem;
  }

  .section-purpose {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .section-meta {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .cta-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.2);
    border-radius: 8px;
    text-align: center;
  }

  .content-html-preview {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .preview-frame {
    background: white;
    color: #000;
    padding: 2rem;
    border-radius: 8px;
  }

  .preview-frame h4 {
    color: #000;
    margin-bottom: 1rem;
  }

  .html-preview-content h1 {
    color: #000;
    margin-bottom: 1.5rem;
  }

  .html-preview-content h2 {
    color: #333;
    margin: 1.5rem 0 1rem;
  }

  .html-preview-content p {
    color: #555;
    margin-bottom: 1rem;
  }

  .cta-button {
    display: inline-block;
    padding: 1rem 2rem;
    background: #0066cc;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 1rem;
  }

  .placeholder-message {
    padding: 1.5rem;
    text-align: center;
  }

  /* Export section */
  .export-section {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 3rem;
    margin-top: 4rem;
  }

  .section-header-large {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .section-icon {
    font-size: 2.5rem;
  }

  .section-header-large h2 {
    font-size: 2rem;
  }

  .export-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  .export-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
  }

  .export-card h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .export-card p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  .package-contents {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .package-contents strong {
    display: block;
    margin-bottom: 0.75rem;
  }

  .package-contents ul {
    list-style: none;
    padding-left: 0;
  }

  .package-contents li {
    padding: 0.5rem 0;
    color: var(--text-secondary);
  }

  .package-contents li::before {
    content: '✓';
    color: var(--accent-green);
    margin-right: 0.5rem;
  }

  /* Buttons */
  .btn-primary, .btn-secondary, .export-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-primary, .export-btn.primary {
    background: var(--accent-blue);
    color: white;
  }

  .btn-primary:hover, .export-btn.primary:hover {
    background: #4a8dd8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);
  }

  .btn-secondary, .export-btn {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover, .export-btn:hover {
    background: var(--bg-card);
    border-color: var(--border-bright);
  }

  .copy-btn, .copy-btn-small {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .copy-btn:hover, .copy-btn-small:hover {
    background: var(--success);
    color: white;
    border-color: var(--success);
  }

  /* Tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .data-table th {
    background: var(--bg-card);
    padding: 1rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--border);
  }

  .data-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .data-table tr:hover {
    background: var(--bg-card);
  }

  code {
    background: var(--bg-card);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--accent-blue);
  }

  .muted {
    color: var(--text-secondary);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .sidebar {
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .main-content {
      margin-left: 0;
    }

    .mobile-nav-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  @media print {
    .sidebar, .mobile-nav-toggle, .export-btn, .copy-btn, .toggle-btn {
      display: none !important;
    }

    .main-content {
      margin-left: 0;
    }

    .phase-content {
      display: block !important;
    }
  }
</style>
  `;
}

/**
 * Render interactive JavaScript
 */
function renderInteractiveScripts(): string {
  return `
<script>
  // Toggle phase sections
  function togglePhase(phaseId) {
    const phase = document.getElementById(phaseId);
    if (!phase) return;

    const content = phase.querySelector('.phase-content');
    const btn = phase.querySelector('.toggle-btn');

    if (content.style.display === 'none') {
      content.style.display = 'block';
      btn.classList.add('expanded');
    } else {
      content.style.display = 'none';
      btn.classList.remove('expanded');
    }
  }

  // Toggle detail panels
  function toggleDetail(detailId) {
    const detail = document.getElementById(detailId);
    if (!detail) return;

    detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
  }

  // Toggle sidebar
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
  }

  // Filter architecture
  let currentFilter = 'all';
  function filterArchitecture(status) {
    currentFilter = status;
    const cards = document.querySelectorAll('.architecture-card');
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    cards.forEach(card => {
      if (status === 'all' || card.dataset.status === status) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Toggle blueprint
  function toggleBlueprint(index) {
    const content = document.getElementById(\`blueprint-content-\${index}\`);
    const header = document.querySelector(\`#blueprint-\${index} .blueprint-header\`);

    if (content.style.display === 'none' || !content.style.display) {
      content.style.display = 'block';
      header.classList.add('expanded');
    } else {
      content.style.display = 'none';
      header.classList.remove('expanded');
    }
  }

  // Expand/collapse all blueprints
  function expandAllBlueprints() {
    document.querySelectorAll('.blueprint-content').forEach(content => {
      content.style.display = 'block';
    });
    document.querySelectorAll('.blueprint-header').forEach(header => {
      header.classList.add('expanded');
    });
  }

  function collapseAllBlueprints() {
    document.querySelectorAll('.blueprint-content').forEach(content => {
      content.style.display = 'none';
    });
    document.querySelectorAll('.blueprint-header').forEach(header => {
      header.classList.remove('expanded');
    });
  }

  // Smooth scroll for navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Update active state
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  });

  // Initialize - expand all phases by default
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.phase-content').forEach(content => {
      content.style.display = 'block';
    });
  });
</script>
  `;
}

/**
 * Escape HTML
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
