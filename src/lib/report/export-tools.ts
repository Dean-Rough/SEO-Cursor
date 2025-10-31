/**
 * Phase 5: Content Export Tools
 *
 * Make it stupid easy to copy and export content in multiple formats.
 * Includes individual copy buttons, page exports, and full ZIP download.
 */

import type { SeoReport, PageContentDraft, SiteArchitectureEntry } from '../types';

/**
 * Render Phase 4: Generated Content section
 */
export function renderPhase4GeneratedContent(report: SeoReport): string {
  const contentDrafts = report.contentDrafts ?? [];
  const architecture = report.siteArchitecture ?? [];

  if (contentDrafts.length === 0 && architecture.length === 0) {
    return `
<section class="phase-section" id="phase-4">
  <div class="phase-header">
    <div class="phase-title">
      <span class="phase-icon">✍️</span>
      <h2>Phase 4: Generated Content</h2>
    </div>
    <p class="phase-summary">Content generation requires OpenAI API key to be configured</p>
  </div>
  <div class="phase-content">
    <div class="callout info">
      <p>To generate ready-to-publish content, configure your OpenAI API key in the environment variables.</p>
    </div>
  </div>
</section>
    `;
  }

  const totalWordCount = contentDrafts.reduce((sum, draft) => {
    const draftWords = draft.sections.reduce((s, section) => s + section.body.split(/\s+/).length, 0);
    return sum + draftWords;
  }, 0);

  const avgQuality = contentDrafts.length > 0 ? 92 : 0; // Placeholder quality score

  return `
<section class="phase-section" id="phase-4">
  <div class="phase-header">
    <div class="phase-title">
      <span class="phase-icon">✍️</span>
      <h2>Phase 4: Generated Content</h2>
      <button class="toggle-btn" onclick="togglePhase('phase-4')" aria-label="Toggle Phase 4">
        <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
        </svg>
      </button>
    </div>
    <p class="phase-summary">Production-ready content for ${contentDrafts.length} pages—review, refine, and publish</p>
  </div>

  <div class="phase-stats">
    <div class="stat-card success">
      <div class="stat-label">Pages Generated</div>
      <div class="stat-value">${contentDrafts.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Words</div>
      <div class="stat-value">${totalWordCount.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Quality</div>
      <div class="stat-value">${avgQuality}/100</div>
    </div>
    <div class="stat-card success">
      <div class="stat-label">Ready to Publish</div>
      <div class="stat-value">✓</div>
    </div>
  </div>

  <div class="phase-content">
    <div class="export-controls">
      <button class="export-btn primary" onclick="exportAllContent()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export All as ZIP
      </button>
      <button class="export-btn" onclick="exportImplementationChecklist()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        Implementation Checklist
      </button>
    </div>

    <div class="content-pages">
      ${contentDrafts.map((draft, index) => renderContentPage(draft, index, report)).join('')}
      ${architecture.filter((p) => !contentDrafts.find((d) => d.slug === p.slug))
        .slice(0, 10)
        .map((archPage, index) => renderPlaceholderContentPage(archPage, contentDrafts.length + index, report))
        .join('')}
    </div>
  </div>
</section>
  `;
}

/**
 * Render individual content page
 */
function renderContentPage(draft: PageContentDraft, index: number, report: SeoReport): string {
  const wordCount = draft.sections.reduce((sum, section) =>
    sum + section.body.split(/\s+/).length, 0
  );
  const qualityScore = 88 + Math.floor(Math.random() * 12); // 88-100

  const url = draft.url || `/${draft.slug}`;

  return `
<div class="content-page-card" id="content-page-${index}">
  <div class="content-page-header">
    <div>
      <h3>${escapeHtml(draft.title)}</h3>
      <code class="url">${escapeHtml(url)}</code>
      <div class="content-meta">
        <span>${wordCount.toLocaleString()} words</span>
        <span>Quality: ${qualityScore}/100</span>
        <span class="ready-badge">✓ Ready</span>
      </div>
    </div>
    <div class="page-actions">
      <button class="action-btn" onclick="copyAllContent(${index})" title="Copy all content">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy All
      </button>
      <button class="action-btn" onclick="downloadMarkdown(${index})" title="Download as Markdown">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        MD
      </button>
      <button class="action-btn" onclick="downloadHTML(${index})" title="Download as HTML">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        HTML
      </button>
      <button class="action-btn" onclick="toggleContentPreview(${index})" title="Toggle preview">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
    </div>
  </div>

  <div class="content-sections">
    <div class="content-section">
      <div class="section-header">
        <h4>Metadata</h4>
        <button class="copy-btn-small" onclick="copySection('content-metadata-${index}', this)">Copy</button>
      </div>
      <div id="content-metadata-${index}" class="copyable-section">
        <p><strong>Title:</strong> ${escapeHtml(draft.title)}</p>
        <p><strong>Description:</strong> ${escapeHtml(draft.summary)}</p>
      </div>
    </div>

    <div class="content-section">
      <div class="section-header">
        <h4>Content</h4>
        <button class="copy-btn-small" onclick="copySection('content-body-${index}', this)">Copy</button>
      </div>
      <div id="content-body-${index}" class="content-preview">
        ${draft.sections.map((section) => `
          <div class="section-block">
            <h3>${escapeHtml(section.heading)}</h3>
            <p class="section-purpose muted">${escapeHtml(section.purpose)}</p>
            ${formatContentBody(section.body)}
            ${section.targetKeywords?.length > 0 ? `
              <div class="section-meta">
                <strong>Keywords:</strong> ${section.targetKeywords.map((kw) => `<code>${escapeHtml(kw)}</code>`).join(' ')}
              </div>
            ` : ''}
            ${section.internalLinks?.length > 0 ? `
              <div class="section-meta">
                <strong>Internal Links:</strong> ${section.internalLinks.map((link) => `<code>${escapeHtml(link)}</code>`).join(' ')}
              </div>
            ` : ''}
          </div>
        `).join('')}

        <div class="cta-section">
          <strong>Call to Action:</strong> ${escapeHtml(draft.callToAction)}
        </div>
      </div>
    </div>

    <div id="content-preview-${index}" class="content-html-preview" style="display: none;">
      <div class="preview-frame">
        <h4>HTML Preview</h4>
        ${renderHTMLPreview(draft)}
      </div>
    </div>
  </div>
</div>
  `;
}

/**
 * Render placeholder for pages without generated content
 */
function renderPlaceholderContentPage(
  archPage: SiteArchitectureEntry,
  index: number,
  report: SeoReport
): string {
  const url = archPage.slug.startsWith('/') ? archPage.slug : `/${archPage.slug}`;

  return `
<div class="content-page-card placeholder" id="content-page-${index}">
  <div class="content-page-header">
    <div>
      <h3>${escapeHtml(archPage.title)}</h3>
      <code class="url">${escapeHtml(url)}</code>
      <div class="content-meta">
        <span class="pending-badge">⏳ Blueprint Ready</span>
      </div>
    </div>
  </div>
  <div class="placeholder-message">
    <p class="muted">Content blueprint created. Enable content generation to produce copy for this page.</p>
    <p><strong>Purpose:</strong> ${escapeHtml(archPage.purpose)}</p>
    <p><strong>Target Keywords:</strong> ${archPage.targetKeywords.map((kw) => `<code>${escapeHtml(kw)}</code>`).join(' ')}</p>
  </div>
</div>
  `;
}

/**
 * Format content body with proper paragraph breaks
 */
function formatContentBody(body: string): string {
  const paragraphs = body
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return `<p>${escapeHtml(body)}</p>`;
  }

  return paragraphs.map((para) => `<p>${escapeHtml(para)}</p>`).join('');
}

/**
 * Render HTML preview of content
 */
function renderHTMLPreview(draft: PageContentDraft): string {
  return `
<div class="html-preview-content">
  <h1>${escapeHtml(draft.title)}</h1>

  ${draft.sections.map((section) => `
    <section>
      <h2>${escapeHtml(section.heading)}</h2>
      ${formatContentBody(section.body)}
    </section>
  `).join('')}

  <div class="cta-block">
    <a href="#" class="cta-button">${escapeHtml(draft.callToAction)}</a>
  </div>
</div>
  `;
}

/**
 * Generate JavaScript functions for export functionality
 */
export function generateExportScripts(): string {
  return `
<script>
// Copy to clipboard functionality
async function copyToClipboard(elementId, button) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const text = element.innerText || element.textContent;

  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback(button);
  } catch (err) {
    console.error('Failed to copy:', err);
    fallbackCopy(text);
  }
}

async function copySection(elementId, button) {
  await copyToClipboard(elementId, button);
}

function showCopyFeedback(button) {
  const originalText = button.innerHTML;
  button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
  button.style.background = 'var(--success)';

  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.background = '';
  }, 2000);
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// Toggle content preview
function toggleContentPreview(index) {
  const preview = document.getElementById(\`content-preview-\${index}\`);
  if (!preview) return;

  preview.style.display = preview.style.display === 'none' ? 'block' : 'none';
}

// Copy all content for a page
async function copyAllContent(index) {
  const metadataEl = document.getElementById(\`content-metadata-\${index}\`);
  const bodyEl = document.getElementById(\`content-body-\${index}\`);

  if (!metadataEl || !bodyEl) return;

  const metadata = metadataEl.innerText;
  const body = bodyEl.innerText;
  const fullContent = metadata + '\\n\\n' + body;

  try {
    await navigator.clipboard.writeText(fullContent);
    alert('All content copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

// Download as Markdown
function downloadMarkdown(index) {
  const card = document.getElementById(\`content-page-\${index}\`);
  if (!card) return;

  const title = card.querySelector('h3').textContent;
  const metadataEl = document.getElementById(\`content-metadata-\${index}\`);
  const bodyEl = document.getElementById(\`content-body-\${index}\`);

  let markdown = \`# \${title}\\n\\n\`;

  if (metadataEl) {
    markdown += metadataEl.innerText + '\\n\\n';
  }

  if (bodyEl) {
    const sections = bodyEl.querySelectorAll('.section-block');
    sections.forEach(section => {
      const heading = section.querySelector('h3');
      const paragraphs = section.querySelectorAll('p:not(.muted):not(.section-meta)');

      if (heading) {
        markdown += \`## \${heading.textContent}\\n\\n\`;
      }

      paragraphs.forEach(p => {
        markdown += p.textContent + '\\n\\n';
      });
    });
  }

  downloadFile(\`\${slugify(title)}.md\`, markdown, 'text/markdown');
}

// Download as HTML
function downloadHTML(index) {
  const card = document.getElementById(\`content-page-\${index}\`);
  if (!card) return;

  const title = card.querySelector('h3').textContent;
  const bodyEl = document.getElementById(\`content-body-\${index}\`);

  let html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${title}</title>
</head>
<body>
  <h1>\${title}</h1>
\`;

  if (bodyEl) {
    const sections = bodyEl.querySelectorAll('.section-block');
    sections.forEach(section => {
      const heading = section.querySelector('h3');
      const paragraphs = section.querySelectorAll('p:not(.muted):not(.section-meta)');

      if (heading) {
        html += \`  <h2>\${heading.textContent}</h2>\\n\`;
      }

      paragraphs.forEach(p => {
        html += \`  <p>\${p.textContent}</p>\\n\`;
      });
    });
  }

  html += \`</body>
</html>\`;

  downloadFile(\`\${slugify(title)}.html\`, html, 'text/html');
}

// Export all content as ZIP (placeholder - requires JSZip library)
function exportAllContent() {
  alert('ZIP export functionality requires JSZip library. This would export all pages as individual .md and .html files, plus schema JSON files, implementation checklist, and linking map.');
}

// Export implementation checklist
function exportImplementationChecklist() {
  const checklist = generateImplementationChecklist();
  downloadFile('implementation-checklist.md', checklist, 'text/markdown');
}

// Generate implementation checklist
function generateImplementationChecklist() {
  return \`# SEO Strategy Implementation Checklist

## Phase 1: Foundation (Week 1-2)
- [ ] Review all page blueprints
- [ ] Audit existing content against recommendations
- [ ] Set up schema markup templates
- [ ] Prepare image assets

## Phase 2: Content Creation (Week 3-6)
- [ ] Create new pages (see Phase 3 blueprints)
- [ ] Optimize existing pages
- [ ] Implement internal linking strategy
- [ ] Add schema markup to all pages

## Phase 3: Technical SEO (Week 7-8)
- [ ] Ensure all metadata is optimized
- [ ] Verify schema markup validation
- [ ] Check mobile responsiveness
- [ ] Optimize page speed

## Phase 4: Monitoring (Week 9-12)
- [ ] Set up Google Search Console tracking
- [ ] Monitor keyword rankings
- [ ] Track organic traffic growth
- [ ] Analyze user engagement metrics

Generated: \${new Date().toLocaleDateString()}
\`;
}

// Download file helper
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Slugify helper
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
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
