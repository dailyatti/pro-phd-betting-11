/**
 * AgentCard Module Index
 * 
 * Main entry point for the AgentCard component and its submodules.
 * 
 * @module components/AgentCard
 */

// Main component (still uses original file for backward compatibility)
export { default as AgentCard } from '../AgentCard.jsx';

// Theme
export { colorVariants, getThemeStyles } from './theme.js';

// Shared UI components
export {
    LoadingSkeleton,
    ActivityIndicator,
    Badge,
    OddsBox,
    StatBar,
    FormVisual,
    safeText,
    fmtOdds,
    isPlainObject
} from './shared';

// Content sections (modular)
export { VisionContent, FactCheckerContent } from './content';
