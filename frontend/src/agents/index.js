/**
 * Agents Module - Main Entry Point
 * 
 * This file re-exports all agent functionality from modular sub-modules.
 * The original 2000+ line file has been decomposed into focused modules
 * for better maintainability and testability.
 * 
 * @module agents
 */

// ============================================================================
// ORCHESTRATOR
// ============================================================================
export { runPerplexityDirectedLoop } from './orchestrator.js';

// ============================================================================
// COMMON HELPERS
// ============================================================================
export {
  stripFences,
  tryParseJson,
  safeStringify,
  isAbortError,
  retryAsync,
  getTodayUTC
} from './common/helpers.js';

// ============================================================================
// TEAM EXTRACTION
// ============================================================================
export { extractTeams } from './common/teamExtractor.js';

// ============================================================================
// PROMPTS
// ============================================================================
export { getPerplexityPrompt } from './common/prompts/perplexity.js';
export { getInsiderPrompt } from './common/prompts/insider.js';

// ============================================================================
// VISION AGENTS
// ============================================================================
export { runQuickMatchScan } from './vision/quickScan.js';
export { runVisionScraper, runVisionRescue } from './vision/visionScraper.js';

// ============================================================================
// RESEARCH AGENTS
// ============================================================================
export { runFactChecker } from './research/factChecker.js';
export { runInsiderDetective } from './research/insiderDetective.js';

// ============================================================================
// STRATEGY AGENTS
// ============================================================================
export { runStrategist } from './strategy/strategist.js';
