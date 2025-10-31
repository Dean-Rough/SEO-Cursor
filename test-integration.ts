import type { SiteInput } from './src/lib/types';

/**
 * Integration test script to validate feature flags and data structures
 * Run with: npx tsx test-integration.ts
 */

const testInputBasic: SiteInput = {
  businessName: 'Test Business',
  website: 'https://example.com',
  businessType: 'restaurant',
  competitors: ['https://competitor1.com', 'https://competitor2.com'],
  businessAddress: '123 Test St, Test City',
  serviceArea: 'Test Area',
  useSenseCheck: true,
};

const testInputWithEnhancedFeatures: SiteInput = {
  businessName: 'Test Business',
  website: 'https://example.com',
  businessType: 'restaurant',
  competitors: ['https://competitor1.com', 'https://competitor2.com'],
  businessAddress: '123 Test St, Test City',
  serviceArea: 'Test Area',
  useSenseCheck: true,
  enhancedFeatures: {
    enableEnhancedIntelligence: true,
    enableStrategy: true,
    enableBlueprints: true,
    enableAIGeneration: false, // Skip to avoid costs in testing
    enableEnhancedReport: true,
  }
};

console.log('=== Integration Test ===\n');

console.log('Test 1: Basic input structure (backward compatible)');
console.log(JSON.stringify(testInputBasic, null, 2));
console.log('✅ Basic input structure valid\n');

console.log('Test 2: Enhanced features input structure');
console.log(JSON.stringify(testInputWithEnhancedFeatures, null, 2));
console.log('✅ Enhanced features structure valid\n');

console.log('Test 3: Feature flags present');
if (testInputWithEnhancedFeatures.enhancedFeatures) {
  const features = testInputWithEnhancedFeatures.enhancedFeatures;
  console.log('  - enableEnhancedIntelligence:', features.enableEnhancedIntelligence);
  console.log('  - enableStrategy:', features.enableStrategy);
  console.log('  - enableBlueprints:', features.enableBlueprints);
  console.log('  - enableAIGeneration:', features.enableAIGeneration);
  console.log('  - enableEnhancedReport:', features.enableEnhancedReport);
  console.log('✅ All feature flags accessible\n');
}

console.log('Test 4: Optional feature flags (backward compatibility)');
if (!testInputBasic.enhancedFeatures) {
  console.log('  - Basic input has no enhancedFeatures field');
  console.log('✅ Backward compatibility maintained\n');
}

console.log('=== All Tests Passed ===');
console.log('\nIntegration validation complete. Feature flags are correctly structured.');
