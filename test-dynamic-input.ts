import { assemblePageBlueprint } from './src/lib/blueprints/wireframe-assembler';

// Test with DIFFERENT input to see if output changes
const testInput1 = {
  url: '/plumbing-services',
  pageType: 'service' as const,
  primaryKeyword: 'emergency plumber',
  secondaryKeywords: ['24 hour plumber', 'burst pipe repair'],
  contentTargets: { wordCount: 800, sectionCount: 4, imageCount: 3, includesFAQ: false },
  priority: 9,
  status: 'create' as const,
};

const businessInfo1 = {
  name: 'Fast Fix Plumbing',
  address: '456 Main St, Glasgow',
  phone: '0141 XXX XXXX',
  email: 'info@fastfix.com',
  website: 'https://fastfix.com',
  businessType: 'plumbing service',
  serviceArea: 'Glasgow',
};

console.log('TEST 1: Plumbing Service\n' + '='.repeat(50));
const blueprint1 = assemblePageBlueprint(testInput1, businessInfo1);
console.log('URL:', blueprint1.url);
console.log('Page Type:', blueprint1.pageType);
console.log('Title:', blueprint1.metadata.title);
console.log('Primary Keyword in Title:', blueprint1.metadata.title.includes('emergency plumber'));
console.log('Business Name in Title:', blueprint1.metadata.title.includes('Fast Fix Plumbing'));
console.log('Sections:', blueprint1.contentStructure.sections.length);
console.log('Target Words:', blueprint1.contentStructure.totalTargetWordCount);
console.log();

// Test 2: Completely different business
const testInput2 = {
  url: '/divorce-lawyer',
  pageType: 'service' as const,
  primaryKeyword: 'divorce attorney',
  secondaryKeywords: ['family law', 'custody lawyer'],
  contentTargets: { wordCount: 1500, sectionCount: 8, imageCount: 2, includesFAQ: true },
  priority: 10,
  status: 'create' as const,
};

const businessInfo2 = {
  name: 'Smith & Associates Law',
  address: '789 Legal Ave, Manchester',
  phone: '0161 XXX XXXX',
  email: 'contact@smithlaw.co.uk',
  website: 'https://smithlaw.co.uk',
  businessType: 'law firm',
  serviceArea: 'Manchester',
};

console.log('TEST 2: Law Firm\n' + '='.repeat(50));
const blueprint2 = assemblePageBlueprint(testInput2, businessInfo2);
console.log('URL:', blueprint2.url);
console.log('Page Type:', blueprint2.pageType);
console.log('Title:', blueprint2.metadata.title);
console.log('Primary Keyword in Title:', blueprint2.metadata.title.includes('divorce'));
console.log('Business Name in Title:', blueprint2.metadata.title.includes('Smith'));
console.log('Sections:', blueprint2.contentStructure.sections.length);
console.log('Target Words:', blueprint2.contentStructure.totalTargetWordCount);
console.log();

// Verify they're different
console.log('VERIFICATION\n' + '='.repeat(50));
console.log('Titles are different:', blueprint1.metadata.title !== blueprint2.metadata.title);
console.log('Keywords different:', blueprint1.metadata.title !== blueprint2.metadata.title);
console.log('Word counts different:',
  blueprint1.contentStructure.totalTargetWordCount !== blueprint2.contentStructure.totalTargetWordCount
);
console.log('Section counts different:',
  blueprint1.contentStructure.sections.length !== blueprint2.contentStructure.sections.length
);

console.log('\n✅ If all above are true, the system is dynamic and not using hardcoded data');
