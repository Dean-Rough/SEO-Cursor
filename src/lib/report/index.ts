/**
 * Phase 5: Report Assembly - Main Orchestrator
 *
 * Exports the enhanced report generation system that combines
 * all 4 phases into a beautiful, user-friendly HTML report.
 */

export { generateEnhancedReport } from './enhanced-template';
export { renderPhase1Intelligence, renderPhase2Strategy, renderExecutiveSummary } from './phase-components';
export { renderPhase3Blueprints } from './blueprint-cards';
export { renderPhase4GeneratedContent, generateExportScripts } from './export-tools';
export * from './types';

/**
 * Main export for backward compatibility with existing report-to-html.ts
 * This allows gradual migration from the old system to the new enhanced system.
 */
import { generateEnhancedReport } from './enhanced-template';
import type { SeoReport } from '../types';

/**
 * Generate enhanced HTML report (replaces renderReportHtml)
 */
export function renderEnhancedReport(report: SeoReport): string {
  return generateEnhancedReport(report);
}

/**
 * Default export for convenience
 */
export default {
  generateEnhancedReport,
  renderEnhancedReport,
};
