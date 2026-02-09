/**
 * AgentCard Theme Configuration
 * 
 * Premium theme maps for dual mode (light/dark) styling.
 * Also provides helper functions to map Agent IDs to colors and icons.
 * 
 * @module components/AgentCard/theme
 */

import { Target, Search, Lock, Layers, Zap, Brain, Activity, Shield } from 'lucide-react';

/**
 * Color variants for AgentCard theming
 */
export const colorVariants = {
    cyan: {
        // Dark Mode
        primary: "text-cyan",
        secondary: "bg-cyan",
        border: "border-cyan/30",
        bg: "from-cyan/10 to-blue-600/5",
        text: "text-cyan",
        glow: "bg-cyan/20",
        // Light Mode (Premium Cream)
        lightPrimary: "text-primary",
        lightSecondary: "bg-cyan",
        lightBorder: "border-subtle",
        lightBg: "bg-panel",
        lightText: "text-secondary",
    },
    purple: {
        primary: "text-purple-500",
        secondary: "bg-purple-500",
        border: "border-purple-500/30",
        bg: "from-purple-500/10 to-fuchsia-600/5",
        text: "text-purple-100",
        glow: "bg-purple-500/20",
        // Light (Premium Cream)
        lightPrimary: "text-primary",
        lightSecondary: "bg-purple-500",
        lightBorder: "border-subtle",
        lightBg: "bg-panel",
        lightText: "text-secondary",
    },
    blue: {
        primary: "text-blue-500",
        secondary: "bg-blue-500",
        border: "border-blue-500/30",
        bg: "from-blue-500/10 to-indigo-600/5",
        text: "text-blue-100",
        glow: "bg-blue-500/20",
        // Light (Premium Cream)
        lightPrimary: "text-primary",
        lightSecondary: "bg-blue-500",
        lightBorder: "border-subtle",
        lightBg: "bg-panel",
        lightText: "text-secondary",
    },
    amber: {
        primary: "text-amber-500",
        secondary: "bg-amber-500",
        border: "border-amber-500/30",
        bg: "from-amber-500/10 to-orange-600/5",
        text: "text-amber-100",
        glow: "bg-amber-500/20",
        // Light (Premium Cream)
        lightPrimary: "text-primary",
        lightSecondary: "bg-amber-500",
        lightBorder: "border-subtle",
        lightBg: "bg-panel",
        lightText: "text-secondary",
    },
    emerald: {
        primary: "text-emerald-500",
        secondary: "bg-emerald-500",
        border: "border-emerald-500/30",
        bg: "from-emerald-500/10 to-teal-600/5",
        text: "text-emerald-100",
        glow: "bg-emerald-500/20",
        // Light (Premium Cream)
        lightPrimary: "text-primary",
        lightSecondary: "bg-emerald-500",
        lightBorder: "border-subtle",
        lightBg: "bg-panel",
        lightText: "text-secondary",
    },
};

/**
 * Returns the color palette for a specific agent ID
 * @param {string} agentId 
 * @param {boolean} darkMode 
 */
export const getColorVariant = (agentId, darkMode) => {
    // Normalize ID
    const id = (agentId || '').toLowerCase();

    const map = {
        'vision': 'cyan',
        'facts': 'blue',
        'fact-checking': 'blue', // legacy support
        'intel': 'purple',
        'insider': 'purple', // legacy support
        'strategy': 'emerald',
    };

    const colorKey = map[id] || 'cyan';
    const v = colorVariants[colorKey];

    if (darkMode) {
        return {
            primary: v.primary,
            secondary: v.secondary,
            border: v.border,
            bg: v.bg,
            text: v.text,
            glow: v.glow
        };
    } else {
        return {
            primary: v.lightPrimary,
            secondary: v.lightSecondary,
            border: v.lightBorder,
            bg: v.lightBg, // Now mostly white
            text: v.lightText,
            glow: "bg-transparent" // No glow in light mode
        };
    }
};

/**
 * Returns the icon component for a specific agent ID
 * @param {string} agentId 
 */
export const getAgentIcon = (agentId) => {
    const id = (agentId || '').toLowerCase();
    switch (id) {
        case 'vision': return Target;
        case 'facts': return Search;
        case 'fact-checking': return Search;
        case 'intel': return Lock;
        case 'insider': return Lock;
        case 'strategy': return Layers;
        default: return Zap;
    }
};
