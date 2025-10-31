/**
 * Schema Markup Generator
 *
 * Generates ready-to-paste JSON-LD schema markup for different page types.
 * Includes all recommended properties, not just required ones.
 */

import { SchemaMarkup, BusinessInfo, FAQItem } from './types';

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(businessInfo: BusinessInfo): SchemaMarkup {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: businessInfo.name,
    url: businessInfo.website || '',
  };

  if (businessInfo.description) {
    schema.description = businessInfo.description;
  }

  if (businessInfo.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: businessInfo.address,
    };
  }

  if (businessInfo.phone) {
    schema.telephone = businessInfo.phone;
  }

  if (businessInfo.email) {
    schema.email = businessInfo.email;
  }

  // Add potential actions
  schema.potentialAction = {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${businessInfo.website || ''}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  };

  return {
    type: 'Organization',
    jsonLd: JSON.stringify(schema, null, 2),
  };
}

/**
 * Generate LocalBusiness schema
 */
export function generateLocalBusinessSchema(businessInfo: BusinessInfo): SchemaMarkup {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessInfo.name,
    url: businessInfo.website || '',
  };

  if (businessInfo.description) {
    schema.description = businessInfo.description;
  }

  if (businessInfo.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: businessInfo.address,
    };
  }

  if (businessInfo.phone) {
    schema.telephone = businessInfo.phone;
  }

  if (businessInfo.serviceArea) {
    schema.areaServed = {
      '@type': 'GeoCircle',
      name: businessInfo.serviceArea,
    };
  }

  // Add opening hours (placeholder - should be customized)
  schema.openingHoursSpecification = [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  ];

  // Add price range (placeholder)
  schema.priceRange = '$$';

  return {
    type: 'LocalBusiness',
    jsonLd: JSON.stringify(schema, null, 2),
  };
}

/**
 * Generate Service schema
 */
export function generateServiceSchema(
  businessInfo: BusinessInfo,
  serviceName: string,
  serviceDescription: string,
  serviceKeywords: string[]
): SchemaMarkup {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: serviceDescription,
    provider: {
      '@type': 'Organization',
      name: businessInfo.name,
      url: businessInfo.website || '',
    },
  };

  if (businessInfo.serviceArea) {
    schema.areaServed = {
      '@type': 'GeoCircle',
      name: businessInfo.serviceArea,
    };
  }

  // Add service type from keywords
  if (serviceKeywords.length > 0) {
    schema.serviceType = serviceKeywords.slice(0, 5);
  }

  return {
    type: 'Service',
    jsonLd: JSON.stringify(schema, null, 2),
  };
}

/**
 * Generate Article schema (for blog posts)
 */
export function generateArticleSchema(
  businessInfo: BusinessInfo,
  articleTitle: string,
  articleDescription: string,
  keywords: string[]
): SchemaMarkup {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleTitle,
    description: articleDescription,
    author: {
      '@type': 'Organization',
      name: businessInfo.name,
      url: businessInfo.website || '',
    },
    publisher: {
      '@type': 'Organization',
      name: businessInfo.name,
      url: businessInfo.website || '',
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
  };

  if (keywords.length > 0) {
    schema.keywords = keywords.join(', ');
  }

  return {
    type: 'Article',
    jsonLd: JSON.stringify(schema, null, 2),
  };
}

/**
 * Generate AboutPage schema
 */
export function generateAboutPageSchema(businessInfo: BusinessInfo): SchemaMarkup {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${businessInfo.name}`,
    description: businessInfo.description || `Learn more about ${businessInfo.name}`,
    mainEntity: {
      '@type': 'Organization',
      name: businessInfo.name,
      url: businessInfo.website || '',
    },
  };

  return {
    type: 'AboutPage',
    jsonLd: JSON.stringify(schema, null, 2),
  };
}

/**
 * Generate ContactPage schema
 */
export function generateContactPageSchema(businessInfo: BusinessInfo): SchemaMarkup {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${businessInfo.name}`,
    description: `Get in touch with ${businessInfo.name}`,
  };

  return {
    type: 'ContactPage',
    jsonLd: JSON.stringify(schema, null, 2),
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs: FAQItem[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `[Answer covering: ${faq.answerGuidance}]`,
      },
    })),
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
): SchemaMarkup {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  return {
    type: 'BreadcrumbList',
    jsonLd: JSON.stringify(schema, null, 2),
  };
}

/**
 * Main function: Generate schema for a page based on page type and data
 */
export function generateSchemaForPage(
  pageType: 'homepage' | 'service' | 'blog' | 'about' | 'contact' | 'other',
  pageData: {
    title: string;
    description: string;
    keywords: string[];
    url?: string;
  },
  businessInfo: BusinessInfo
): SchemaMarkup[] {
  const schemas: SchemaMarkup[] = [];

  switch (pageType) {
    case 'homepage':
      // Homepage gets Organization + LocalBusiness
      schemas.push(generateOrganizationSchema(businessInfo));
      schemas.push(generateLocalBusinessSchema(businessInfo));
      break;

    case 'service':
      // Service page gets Service schema + Organization
      schemas.push(
        generateServiceSchema(
          businessInfo,
          pageData.title,
          pageData.description,
          pageData.keywords
        )
      );
      schemas.push(generateOrganizationSchema(businessInfo));
      break;

    case 'blog':
      // Blog post gets Article schema
      schemas.push(
        generateArticleSchema(
          businessInfo,
          pageData.title,
          pageData.description,
          pageData.keywords
        )
      );
      break;

    case 'about':
      // About page gets AboutPage + Organization
      schemas.push(generateAboutPageSchema(businessInfo));
      schemas.push(generateOrganizationSchema(businessInfo));
      break;

    case 'contact':
      // Contact page gets ContactPage + Organization
      schemas.push(generateContactPageSchema(businessInfo));
      schemas.push(generateOrganizationSchema(businessInfo));
      break;

    default:
      // Generic page gets basic Organization schema
      schemas.push(generateOrganizationSchema(businessInfo));
      break;
  }

  return schemas;
}

/**
 * Helper: Format schema markup as HTML script tag
 */
export function formatSchemaAsHTML(schema: SchemaMarkup): string {
  return `<script type="application/ld+json">
${schema.jsonLd}
</script>`;
}

/**
 * Helper: Combine multiple schemas into one script tag
 */
export function combineSchemas(schemas: SchemaMarkup[]): string {
  if (schemas.length === 0) return '';
  if (schemas.length === 1) return formatSchemaAsHTML(schemas[0]);

  // Combine into graph structure
  const graphSchema = {
    '@context': 'https://schema.org',
    '@graph': schemas.map((s) => JSON.parse(s.jsonLd)),
  };

  return `<script type="application/ld+json">
${JSON.stringify(graphSchema, null, 2)}
</script>`;
}
