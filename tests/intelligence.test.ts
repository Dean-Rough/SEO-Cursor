/**
 * Test suite for intelligence gathering modules
 *
 * Run with: npm test src/lib/intelligence/intelligence.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  detectPageType,
  extractCTAs,
  extractSchemaTypes,
  analyzeContentDepth,
  categorizePageByUrl,
  analyzePageImages,
} from '@/lib/intelligence';
import type { EnhancedPageAnalysis } from '@/lib/intelligence/types';

describe('Site Crawler - Page Type Detection', () => {
  it('should detect homepage', () => {
    const type = detectPageType('https://example.com/', '<html><head><title>Home</title></head></html>');
    expect(type).toBe('homepage');
  });

  it('should detect contact page by URL', () => {
    const type = detectPageType('https://example.com/contact', '<html></html>');
    expect(type).toBe('contact');
  });

  it('should detect service page by URL', () => {
    const type = detectPageType('https://example.com/services/web-design', '<html></html>');
    expect(type).toBe('service');
  });

  it('should detect blog page by date pattern', () => {
    const type = detectPageType('https://example.com/blog/2024/01/15/post', '<html></html>');
    expect(type).toBe('blog');
  });

  it('should detect about page', () => {
    const type = detectPageType('https://example.com/about-us', '<html></html>');
    expect(type).toBe('about');
  });

  it('should default to other for unclear pages', () => {
    const type = detectPageType('https://example.com/some-random-page', '<html></html>');
    expect(type).toBe('other');
  });
});

describe('Site Crawler - CTA Extraction', () => {
  it('should extract button CTAs', () => {
    const html = '<button>Book Now</button>';
    const ctas = extractCTAs(html);
    expect(ctas).toHaveLength(1);
    expect(ctas[0].text).toBe('Book Now');
    expect(ctas[0].type).toBe('button');
  });

  it('should extract link CTAs with action words', () => {
    const html = '<a href="/contact">Get Started</a>';
    const ctas = extractCTAs(html);
    expect(ctas).toHaveLength(1);
    expect(ctas[0].text).toBe('Get Started');
    expect(ctas[0].type).toBe('link');
    expect(ctas[0].targetUrl).toBe('/contact');
  });

  it('should extract links with button classes as buttons', () => {
    const html = '<a href="/signup" class="btn btn-primary">Sign Up</a>';
    const ctas = extractCTAs(html);
    expect(ctas).toHaveLength(1);
    expect(ctas[0].type).toBe('button');
  });

  it('should ignore links without action words', () => {
    const html = '<a href="/page">Some Link</a>';
    const ctas = extractCTAs(html);
    expect(ctas).toHaveLength(0);
  });

  it('should deduplicate CTAs with same text', () => {
    const html = `
      <button>Book Now</button>
      <a href="/book" class="btn">Book Now</a>
    `;
    const ctas = extractCTAs(html);
    expect(ctas).toHaveLength(1);
  });
});

describe('Site Crawler - Schema Extraction', () => {
  it('should extract schema types from JSON-LD', () => {
    const html = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "LocalBusiness"
        }
      </script>
    `;
    const types = extractSchemaTypes(html);
    expect(types).toContain('LocalBusiness');
  });

  it('should extract multiple schema types', () => {
    const html = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": ["Organization", "LocalBusiness"]
        }
      </script>
    `;
    const types = extractSchemaTypes(html);
    expect(types).toContain('Organization');
    expect(types).toContain('LocalBusiness');
  });

  it('should extract nested schema types', () => {
    const html = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "mainEntity": {
            "@type": "Service"
          }
        }
      </script>
    `;
    const types = extractSchemaTypes(html);
    expect(types).toContain('WebPage');
    expect(types).toContain('Service');
  });

  it('should handle invalid JSON gracefully', () => {
    const html = `
      <script type="application/ld+json">
        { invalid json }
      </script>
    `;
    const types = extractSchemaTypes(html);
    expect(types).toHaveLength(0);
  });
});

describe('Competitor Analysis - Content Depth', () => {
  const mockPages: EnhancedPageAnalysis[] = [
    {
      url: 'https://example.com/page1',
      titleTag: 'Page 1',
      metaDescription: 'Description',
      h1: 'Heading 1',
      wordCount: 500,
      readability: 60,
      keywords: [],
      headings: [],
      status: 'ok',
      pageType: 'service',
      ctas: [],
      schemaTypes: ['Service'],
      h2Count: 3,
      h3Count: 2,
      imageCount: 5,
      hasFAQ: true,
    },
    {
      url: 'https://example.com/page2',
      titleTag: 'Page 2',
      metaDescription: 'Description',
      h1: 'Heading 2',
      wordCount: 800,
      readability: 65,
      keywords: [],
      headings: [],
      status: 'ok',
      pageType: 'service',
      ctas: [],
      schemaTypes: ['Service', 'LocalBusiness'],
      h2Count: 5,
      h3Count: 3,
      imageCount: 7,
      hasFAQ: false,
    },
  ];

  it('should calculate average word count', () => {
    const metrics = analyzeContentDepth(mockPages);
    expect(metrics.averageWordCount).toBe(650); // (500 + 800) / 2
  });

  it('should calculate average heading counts', () => {
    const metrics = analyzeContentDepth(mockPages);
    expect(metrics.averageH2Count).toBe(4); // (3 + 5) / 2
    expect(metrics.averageH3Count).toBe(2.5); // (2 + 3) / 2
  });

  it('should calculate average image count', () => {
    const metrics = analyzeContentDepth(mockPages);
    expect(metrics.averageImageCount).toBe(6); // (5 + 7) / 2
  });

  it('should calculate FAQ presence rate', () => {
    const metrics = analyzeContentDepth(mockPages);
    expect(metrics.faqPresenceRate).toBe(0.5); // 1 out of 2 pages
  });

  it('should identify common schema types', () => {
    const metrics = analyzeContentDepth(mockPages);
    expect(metrics.commonSchemaTypes).toContain('Service'); // Appears on both pages
  });

  it('should handle empty pages array', () => {
    const metrics = analyzeContentDepth([]);
    expect(metrics.averageWordCount).toBe(0);
    expect(metrics.commonSchemaTypes).toHaveLength(0);
  });
});

describe('Competitor Pages - URL Categorization', () => {
  it('should categorize homepage URL', () => {
    const type = categorizePageByUrl('https://example.com/');
    expect(type).toBe('homepage');
  });

  it('should categorize contact URL', () => {
    const type = categorizePageByUrl('https://example.com/contact');
    expect(type).toBe('contact');
  });

  it('should categorize about URL', () => {
    const type = categorizePageByUrl('https://example.com/about-us');
    expect(type).toBe('about');
  });

  it('should categorize service URL', () => {
    const type = categorizePageByUrl('https://example.com/services/consulting');
    expect(type).toBe('service');
  });

  it('should categorize blog URL with date', () => {
    const type = categorizePageByUrl('https://example.com/blog/2024/01/01/post');
    expect(type).toBe('blog');
  });

  it('should categorize blog URL with path', () => {
    const type = categorizePageByUrl('https://example.com/blog/my-article');
    expect(type).toBe('blog');
  });

  it('should default to other for unclear URLs', () => {
    const type = categorizePageByUrl('https://example.com/random-page');
    expect(type).toBe('other');
  });
});

describe('Image Audit - Page Analysis', () => {
  it('should count images without alt text', () => {
    const html = `
      <img src="image1.jpg">
      <img src="image2.jpg" alt="">
      <img src="image3.jpg" alt="Description">
    `;
    const result = analyzePageImages(html, { type: 'business', location: 'city' });
    expect(result.totalImages).toBe(3);
    expect(result.imagesWithAlt).toBe(1); // Only image3 has alt text
  });

  it('should identify descriptive alt text', () => {
    const html = `
      <img src="image1.jpg" alt="Short">
      <img src="image2.jpg" alt="This is a much longer and more descriptive alt text">
    `;
    const result = analyzePageImages(html, { type: 'business', location: 'city' });
    expect(result.imagesWithDescriptiveAlt).toBe(1); // Only image2 has >5 words
  });

  it('should identify keyword-optimized alt text', () => {
    const html = `
      <img src="image1.jpg" alt="Random photo">
      <img src="image2.jpg" alt="Our business team in the city">
    `;
    const result = analyzePageImages(html, { type: 'business', location: 'city' });
    expect(result.imagesWithKeywordAlt).toBeGreaterThan(0); // image2 contains "business" and "city"
  });

  it('should handle pages with no images', () => {
    const html = '<html><body><h1>No images here</h1></body></html>';
    const result = analyzePageImages(html, { type: 'business', location: 'city' });
    expect(result.totalImages).toBe(0);
    expect(result.imagesWithAlt).toBe(0);
  });
});

describe('Integration - Enhanced Page Analysis', () => {
  it('should combine all intelligence data', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Service Page</title>
          <meta name="description" content="Our services">
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Service"
            }
          </script>
        </head>
        <body>
          <h1>Our Services</h1>
          <h2>Service 1</h2>
          <h3>Details</h3>
          <h2>Service 2</h2>
          <img src="img1.jpg" alt="Service photo">
          <img src="img2.jpg" alt="Team photo">
          <button>Get Started</button>
          <h2>Frequently Asked Questions</h2>
        </body>
      </html>
    `;

    const { analyzePageEnhanced } = await import('@/lib/intelligence');
    const result = await analyzePageEnhanced(
      'https://example.com/services',
      html,
      { type: 'consulting', location: 'Edinburgh' }
    );

    expect(result.pageType).toBe('service');
    expect(result.h2Count).toBe(3);
    expect(result.h3Count).toBe(1);
    expect(result.imageCount).toBe(2);
    expect(result.schemaTypes).toContain('Service');
    expect(result.ctas.length).toBeGreaterThan(0);
    expect(result.hasFAQ).toBe(true);
  });
});
