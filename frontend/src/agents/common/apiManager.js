/**
 * PhD-Level API Manager
 * 
 * Centralized API capability management and model selection.
 * Ensures any combination of APIs can work together gracefully.
 * 
 * @module agents/common/apiManager
 */

// ============================================================================
// MODEL ROLE DEFINITIONS
// ============================================================================

/**
 * Task Types that require AI models
 */
export const TaskType = Object.freeze({
    VISION: 'VISION',           // Image/OCR analysis
    RESEARCH: 'RESEARCH',       // Web search, fact finding
    REASONING: 'REASONING',     // Planning, auditing, complex logic
    SYNTHESIS: 'SYNTHESIS',     // Summarizing, final output generation
});

/**
 * Model Priority Matrix - defines which model is best for each task
 * Order matters: first available model in the list is used
 */
const MODEL_PRIORITY = Object.freeze({
    [TaskType.VISION]: ['openai', 'gemini'],
    [TaskType.RESEARCH]: ['perplexity', 'gemini', 'openai'],
    [TaskType.REASONING]: ['openai'],
    [TaskType.SYNTHESIS]: ['openai'],
});

// ============================================================================
// API MANAGER CLASS
// ============================================================================

/**
 * Manages API availability and selects optimal model for each task
 */
export class APIManager {
    /**
     * @param {Object} config - API configuration
     * @param {Object} config.openai - {apiKey, model, enabled}
     * @param {Object} config.gemini - {apiKey, model, enabled}
     * @param {Object} config.perplexity - {apiKey, model}
     * @param {Object} config.gemini - {apiKey, model, enabled}
     */
    constructor(config) {
        this.config = config || {};
        this._logPrefix = '[APIManager]';
    }

    // ========================================================================
    // PRIVATE: Key Validation
    // ========================================================================

    _hasValidKey(key) {
        return key && String(key).trim().length >= 10;
    }

    // ========================================================================
    // PUBLIC: API Availability Checks
    // ========================================================================

    hasOpenAI() {
        const cfg = this.config.openai || {};
        // OpenAI is available if key exists (no explicit 'enabled' flag needed, presence = enabled)
        return this._hasValidKey(cfg.apiKey);
    }

    hasPerplexity() {
        const cfg = this.config.perplexity || {};
        return this._hasValidKey(cfg.apiKey);
    }

    hasGemini() {
        const cfg = this.config.gemini || {};
        return cfg.enabled === true && this._hasValidKey(cfg.apiKey);
    }

    // ========================================================================
    // PUBLIC: Capability Checks (Task-level)
    // ========================================================================

    canDoVision() {
        return this.hasOpenAI() || this.hasGemini();
    }

    canDoResearch() {
        return this.hasPerplexity() || this.hasGemini() || this.hasOpenAI();
    }

    canDoReasoning() {
        return this.hasOpenAI();
    }

    canDoSynthesis() {
        return this.hasOpenAI();
    }

    // ========================================================================
    // PUBLIC: Best Model Selection
    // ========================================================================

    /**
     * Get the best available model for a task type
     * @param {TaskType} taskType - The type of task
     * @returns {{provider: string, apiKey: string, model: string} | null}
     */
    getBestModelFor(taskType) {
        const priorities = MODEL_PRIORITY[taskType];
        if (!priorities) {
            console.warn(`${this._logPrefix} Unknown task type: ${taskType}`);
            return null;
        }

        for (const provider of priorities) {
            const available = this._checkProvider(provider);
            if (available) {
                console.log(`${this._logPrefix} Using ${provider.toUpperCase()} for ${taskType}`);
                return available;
            }
        }

        console.error(`${this._logPrefix} No API available for ${taskType}`);
        return null;
    }

    /**
     * Check if a provider is available and return its config
     * @private
     */
    _checkProvider(provider) {
        switch (provider) {
            case 'openai':
                if (this.hasOpenAI()) {
                    const cfg = this.config.openai;
                    let targetModel = cfg.model || 'gpt-5.2-2025-12-11';
                    return { provider: 'openai', apiKey: cfg.apiKey, model: targetModel };
                }
                break;
            case 'perplexity':
                if (this.hasPerplexity()) {
                    const cfg = this.config.perplexity;
                    return { provider: 'perplexity', apiKey: cfg.apiKey, model: cfg.model || 'sonar-pro' };
                }
                break;
            case 'gemini':
                if (this.hasGemini()) {
                    const cfg = this.config.gemini;
                    return { provider: 'gemini', apiKey: cfg.apiKey, model: cfg.model || 'gemini-2.0-flash' };
                }
                break;
        }
        return null;
    }

    // ========================================================================
    // PUBLIC: Convenience Methods
    // ========================================================================

    getBestForVision() { return this.getBestModelFor(TaskType.VISION); }
    getBestForResearch() { return this.getBestModelFor(TaskType.RESEARCH); }
    getBestForReasoning() { return this.getBestModelFor(TaskType.REASONING); }
    getBestForSynthesis() { return this.getBestModelFor(TaskType.SYNTHESIS); }

    // ========================================================================
    // PUBLIC: Status Report
    // ========================================================================

    /**
     * Get a summary of available APIs and capabilities
     * @returns {Object} Status report
     */
    getStatus() {
        return {
            apis: {
                openai: this.hasOpenAI(),
                perplexity: this.hasPerplexity(),
                gemini: this.hasGemini(),
            },
            capabilities: {
                vision: this.canDoVision(),
                research: this.canDoResearch(),
                reasoning: this.canDoReasoning(),
                synthesis: this.canDoSynthesis(),
            },
        };
    }

    /**
     * Log current status to console
     */
    logStatus() {
        const status = this.getStatus();
        console.log(`${this._logPrefix} API Status:`, status.apis);
        console.log(`${this._logPrefix} Capabilities:`, status.capabilities);
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an APIManager from the standard orchestrator params
 * @param {Object} openaiParams - {apiKey, orchestratorModel, finalModel}
 * @param {Object} perplexityParams - {apiKey, model}
 * @param {Object} geminiParams - {apiKey, model, enabled}
 * @returns {APIManager}
 */
export function createAPIManager(openaiParams, perplexityParams, geminiParams) {
    return new APIManager({
        openai: {
            apiKey: openaiParams?.apiKey,
            model: openaiParams?.orchestratorModel || openaiParams?.finalModel || openaiParams?.model,
        },
        perplexity: {
            apiKey: perplexityParams?.apiKey,
            model: perplexityParams?.model,
        },
        gemini: {
            apiKey: geminiParams?.apiKey,
            model: geminiParams?.model,
            enabled: geminiParams?.enabled ?? false,
        },
    });
}
