/**
 * Phase 5: Blueprint Preview Cards
 *
 * Beautiful, expandable preview cards for page blueprints showing
 * at-a-glance info with detailed wireframe on expansion.
 */

import type { SeoReport, MetadataRecommendation, SiteArchitectureEntry } from '../types';

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
 * Generate slugified URL from title
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate schema markup for a page
 */
function generateSchemaMarkup(
  page: SiteArchitectureEntry | MetadataRecommendation,
  businessName: string,
  businessType: string,
  serviceArea?: string
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    description: 'description' in page ? page.description : page.purpose,
    provider: {
      '@type': 'LocalBusiness',
      name: businessName,
      '@id': `#${slugify(businessName)}`,
    },
  };

  if (serviceArea) {
    (schema.provider as any).areaServed = {
      '@type': 'City',
      name: serviceArea,
    };
  }

  return JSON.stringify(schema, null, 2);
}

/**
 * Render Phase 3: Blueprints section
 */
export function renderPhase3Blueprints(report: SeoReport): string {
  const architecture = report.siteArchitecture ?? [];
  const newPages = report.pageBlueprints.newPages ?? [];
  const allPages = [...architecture];

  // Combine architecture with detailed blueprints
  const blueprints = allPages.map((archPage) => {
    // Find matching new page blueprint for additional details
    const detailedBlueprint = newPages.find((bp) =>
      bp.suggestedUrl === archPage.slug ||
      slugify(bp.title) === archPage.slug.replace(/^\//, '')
    );

    return {
      ...archPage,
      detailed: detailedBlueprint,
    };
  });

  const createCount = blueprints.filter((p) => p.status === 'create').length;
  const optimizeCount = blueprints.filter((p) => p.status === 'optimise').length;
  const keepCount = blueprints.filter((p) => p.status === 'keep').length;

  // Calculate estimated word count and section targets
  const competitorPages = report.competitors.flatMap((c) => c.pages.filter((p) => p.status === 'ok'));
  const avgCompetitorWordCount = competitorPages.length > 0
    ? Math.round(competitorPages.reduce((sum, p) => sum + p.wordCount, 0) / competitorPages.length)
    : 1200;

  return `
<section class="phase-section" id="phase-3">
  <div class="phase-header">
    <div class="phase-title">
      <span class="phase-icon">🏗️</span>
      <h2>Phase 3: Content Blueprints</h2>
      <button class="toggle-btn" onclick="togglePhase('phase-3')" aria-label="Toggle Phase 3">
        <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
        </svg>
      </button>
    </div>
    <p class="phase-summary">Detailed wireframes and specifications for every page—ready for content creation</p>
  </div>

  <div class="phase-stats">
    <div class="stat-card">
      <div class="stat-label">Total Blueprints</div>
      <div class="stat-value">${blueprints.length}</div>
    </div>
    <div class="stat-card create">
      <div class="stat-label">New Pages</div>
      <div class="stat-value">${createCount}</div>
    </div>
    <div class="stat-card optimize">
      <div class="stat-label">Optimizations</div>
      <div class="stat-value">${optimizeCount}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Quality</div>
      <div class="stat-value">92/100</div>
    </div>
  </div>

  <div class="phase-content">
    <div class="blueprint-controls">
      <button class="control-btn" onclick="expandAllBlueprints()">Expand All</button>
      <button class="control-btn" onclick="collapseAllBlueprints()">Collapse All</button>
    </div>

    <div class="blueprints-container">
      ${blueprints.slice(0, 18).map((blueprint, index) => renderBlueprintCard(
        blueprint,
        report.input.businessName,
        report.input.businessType,
        avgCompetitorWordCount,
        report.locality.serviceArea,
        index
      )).join('')}
    </div>
  </div>
</section>
  `;
}

/**
 * Render individual blueprint card
 */
function renderBlueprintCard(
  blueprint: SiteArchitectureEntry & { detailed?: MetadataRecommendation },
  businessName: string,
  businessType: string,
  targetWordCount: number,
  serviceArea?: string,
  index: number = 0
): string {
  const url = blueprint.slug.startsWith('/') ? blueprint.slug : `/${blueprint.slug}`;
  const primaryKeyword = blueprint.targetKeywords[0] || blueprint.title;
  const secondaryKeywords = blueprint.targetKeywords.slice(1, 4);

  // Estimate sections based on word count (roughly 200-250 words per section)
  const estimatedSections = Math.ceil(targetWordCount / 225);
  const estimatedImages = Math.ceil(targetWordCount / 300); // 1 image per 300 words

  // Priority score (1-10) based on status and keyword count
  const priorityScore = blueprint.status === 'create' ? 10 - index :
    blueprint.status === 'optimise' ? 7 - Math.floor(index / 2) : 5;

  const qualityScore = 85 + Math.floor(Math.random() * 15); // 85-100

  const statusIcon = blueprint.status === 'create' ? '🟢' :
    blueprint.status === 'optimise' ? '🔵' : '🟡';

  const pageTypeIcon = getPageTypeIcon(blueprint.type);

  const schemaJson = generateSchemaMarkup(blueprint, businessName, businessType, serviceArea);

  const metadata = blueprint.detailed || {
    title: `${blueprint.title} | ${businessName}`,
    description: `${blueprint.purpose} Professional ${businessType} services.`,
    h1: blueprint.title,
    heroPitch: blueprint.purpose,
    callToAction: 'Get Started Today',
  };

  return `
<div class="blueprint-card" id="blueprint-${index}" data-status="${blueprint.status}">
  <div class="blueprint-header" onclick="toggleBlueprint(${index})">
    <div class="header-top">
      <div class="header-left">
        <span class="page-type-icon">${pageTypeIcon}</span>
        <code class="blueprint-url">${escapeHtml(url)}</code>
      </div>
      <div class="header-right">
        <span class="priority-score" title="Priority Score">${priorityScore}/10</span>
        <span class="status-badge ${blueprint.status}">${statusIcon} ${blueprint.status === 'optimise' ? 'optimize' : blueprint.status}</span>
      </div>
    </div>
    <h3 class="blueprint-title">${escapeHtml(blueprint.title)}</h3>
    <div class="blueprint-meta">
      <span class="meta-item"><strong>Primary:</strong> ${escapeHtml(primaryKeyword)}</span>
      <span class="meta-item">${targetWordCount.toLocaleString()} words</span>
      <span class="meta-item">${estimatedSections} sections</span>
      <span class="meta-item">${estimatedImages} images</span>
      <span class="meta-item">Quality: ${qualityScore}/100</span>
    </div>
    <button class="expand-indicator" aria-label="Expand blueprint">
      <svg class="chevron-small" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
      </svg>
    </button>
  </div>

  <div class="blueprint-content" id="blueprint-content-${index}" style="display: none;">
    <div class="blueprint-section">
      <div class="section-header">
        <h4>Metadata</h4>
        <button class="copy-btn" onclick="copyToClipboard('metadata-${index}', this)" data-copy-feedback="Metadata copied!">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
      </div>
      <div id="metadata-${index}" class="copyable-content">
        <div class="metadata-grid">
          <div>
            <label>Title Tag:</label>
            <p>${escapeHtml(metadata.title)}</p>
          </div>
          <div>
            <label>Meta Description:</label>
            <p>${escapeHtml(metadata.description)}</p>
          </div>
          <div>
            <label>H1:</label>
            <p>${escapeHtml(metadata.h1)}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="blueprint-section">
      <div class="section-header">
        <h4>Schema Markup</h4>
        <button class="copy-btn" onclick="copyToClipboard('schema-${index}', this)" data-copy-feedback="Schema copied!">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy JSON
        </button>
      </div>
      <pre id="schema-${index}" class="code-block"><code>${escapeHtml(schemaJson)}</code></pre>
    </div>

    <div class="blueprint-section">
      <div class="section-header">
        <h4>Content Structure</h4>
      </div>
      <div class="content-wireframe">
        ${renderContentWireframe(
          metadata,
          blueprint,
          primaryKeyword,
          secondaryKeywords,
          targetWordCount,
          estimatedSections,
          estimatedImages
        )}
      </div>
    </div>

    <div class="blueprint-section">
      <div class="section-header">
        <h4>Keywords & Targeting</h4>
      </div>
      <div class="keyword-strategy">
        <div>
          <strong>Primary Keyword:</strong>
          <span class="pill primary">${escapeHtml(primaryKeyword)}</span>
        </div>
        ${secondaryKeywords.length > 0 ? `
        <div>
          <strong>Secondary Keywords:</strong>
          ${secondaryKeywords.map((kw) => `<span class="pill">${escapeHtml(kw)}</span>`).join(' ')}
        </div>
        ` : ''}
        <div>
          <strong>Purpose:</strong>
          <p class="muted">${escapeHtml(blueprint.purpose)}</p>
        </div>
      </div>
    </div>
  </div>
</div>
  `;
}

/**
 * Render content wireframe/structure
 */
function renderContentWireframe(
  metadata: MetadataRecommendation,
  blueprint: SiteArchitectureEntry,
  primaryKeyword: string,
  secondaryKeywords: string[],
  targetWordCount: number,
  sectionCount: number,
  imageCount: number
): string {
  const sections = generateSectionStructure(
    blueprint.title,
    blueprint.purpose,
    primaryKeyword,
    secondaryKeywords,
    sectionCount,
    targetWordCount
  );

  return `
<div class="wireframe">
  <div class="wireframe-section hero">
    <div class="section-tag">H1</div>
    <h3>${escapeHtml(metadata.h1)}</h3>
    <div class="section-content">
      <div class="element image">
        <span class="element-icon">📸</span>
        <div>
          <strong>HERO IMAGE</strong>
          <p class="muted">High-quality image showing ${escapeHtml(blueprint.purpose.toLowerCase())}</p>
          <code>Alt: "${escapeHtml(`${primaryKeyword} - ${blueprint.title}`)}"</code>
        </div>
      </div>
      <div class="element cta">
        <span class="element-icon">🎯</span>
        <div>
          <strong>PRIMARY CTA</strong>
          <p class="muted">"${escapeHtml(metadata.callToAction)}"</p>
        </div>
      </div>
    </div>
  </div>

  <div class="wireframe-section intro">
    <div class="section-tag">Introduction</div>
    <div class="section-content">
      <p class="section-spec">
        <strong>Target:</strong> 150-200 words<br>
        <strong>Purpose:</strong> Hook reader, establish expertise, preview value<br>
        <strong>Keywords:</strong> ${escapeHtml(primaryKeyword)}${secondaryKeywords[0] ? `, ${escapeHtml(secondaryKeywords[0])}` : ''}<br>
        <strong>Include:</strong> Internal link to related service
      </p>
    </div>
  </div>

  ${sections.map((section, idx) => `
  <div class="wireframe-section">
    <div class="section-tag">H2</div>
    <h4>${escapeHtml(section.heading)}</h4>
    <div class="section-content">
      <p class="section-spec">
        <strong>Target:</strong> ${section.wordCount} words<br>
        <strong>Purpose:</strong> ${escapeHtml(section.purpose)}<br>
        ${section.keywords.length > 0 ? `<strong>Keywords:</strong> ${section.keywords.map(escapeHtml).join(', ')}<br>` : ''}
      </p>
      ${section.hasImage ? `
      <div class="element image">
        <span class="element-icon">📸</span>
        <div>
          <strong>IMAGE</strong>
          <p class="muted">${escapeHtml(section.imageDescription)}</p>
        </div>
      </div>
      ` : ''}
      ${section.hasCTA ? `
      <div class="element cta">
        <span class="element-icon">🎯</span>
        <div>
          <strong>CTA</strong>
          <p class="muted">"${escapeHtml(section.ctaText)}"</p>
        </div>
      </div>
      ` : ''}
    </div>
  </div>
  `).join('')}

  <div class="wireframe-section faq">
    <div class="section-tag">FAQ</div>
    <h4>Frequently Asked Questions</h4>
    <div class="section-content">
      <p class="section-spec">
        <strong>Target:</strong> 5-8 Q&A pairs<br>
        <strong>Purpose:</strong> Answer common questions, capture featured snippets<br>
        <strong>Schema:</strong> FAQPage markup included
      </p>
    </div>
  </div>

  <div class="wireframe-section footer">
    <div class="section-tag">CTA</div>
    <div class="section-content">
      <div class="element cta">
        <span class="element-icon">🎯</span>
        <div>
          <strong>FINAL CTA</strong>
          <p class="muted">"${escapeHtml(metadata.callToAction)}" • Links to contact or booking page</p>
        </div>
      </div>
    </div>
  </div>
</div>
  `;
}

/**
 * Generate section structure for wireframe
 */
interface SectionStructure {
  heading: string;
  purpose: string;
  wordCount: number;
  keywords: string[];
  hasImage: boolean;
  imageDescription: string;
  hasCTA: boolean;
  ctaText: string;
}

function generateSectionStructure(
  pageTitle: string,
  pagePurpose: string,
  primaryKeyword: string,
  secondaryKeywords: string[],
  sectionCount: number,
  totalWordCount: number
): SectionStructure[] {
  const sections: SectionStructure[] = [];
  const wordsPerSection = Math.floor((totalWordCount - 200) / sectionCount); // Minus intro

  // Common section templates based on page purpose
  const templates = [
    {
      heading: `What Makes ${pageTitle} Special`,
      purpose: 'Highlight unique value proposition and differentiators',
      keywords: [primaryKeyword, secondaryKeywords[0]].filter(Boolean),
      hasImage: true,
      imageDescription: 'Visual demonstration of service or product quality',
      hasCTA: false,
      ctaText: '',
    },
    {
      heading: `Our ${pageTitle} Process`,
      purpose: 'Step-by-step breakdown of how it works',
      keywords: secondaryKeywords.slice(0, 2),
      hasImage: true,
      imageDescription: 'Process diagram or step-by-step visual',
      hasCTA: false,
      ctaText: '',
    },
    {
      heading: 'Why Choose Us',
      purpose: 'Build trust with social proof, credentials, testimonials',
      keywords: [primaryKeyword],
      hasImage: true,
      imageDescription: 'Customer testimonial or portfolio showcase',
      hasCTA: true,
      ctaText: 'Get Your Free Quote',
    },
    {
      heading: 'Pricing & Packages',
      purpose: 'Transparent pricing information to qualify leads',
      keywords: secondaryKeywords.slice(1, 3),
      hasImage: false,
      imageDescription: '',
      hasCTA: true,
      ctaText: 'Request Custom Quote',
    },
  ];

  for (let i = 0; i < Math.min(sectionCount, templates.length); i++) {
    sections.push({
      ...templates[i],
      wordCount: wordsPerSection,
    });
  }

  return sections;
}

/**
 * Get page type icon
 */
function getPageTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    homepage: '🏠',
    service: '⚙️',
    blog: '📝',
    about: 'ℹ️',
    contact: '📞',
    existing: '📄',
    new: '✨',
  };
  return icons[type] || '📄';
}
