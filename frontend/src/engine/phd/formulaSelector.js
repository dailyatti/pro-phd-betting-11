/**
 * Formula Selector Module (PhD Architect Agent)
 *
 * Goals:
 * - Dynamic formula selection from Registry
 * - Agentic parameter mapping (Research -> Formula Inputs)
 * - Detailed reasoning for parameter choices
 * - Strict JSON schema validation
 */

import { FORMULA_CATALOG, listCatalog } from './formulaRegistry.js';
import { normalizeSport } from './utils/normalizeSport.js';

// ============================================================
// HELPERS
// ============================================================

// const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

const safeNumber = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
        const n = Number(v.replace(/[^0-9.-]/g, ''));
        if (Number.isFinite(n)) return n;
    }
    return null;
};

// ============================================================
// PROMPT: THE ARCHITECT
// ============================================================

export const PROMPT_FORMULA_SELECTOR = `
ACT AS: Senior PhD Quantitative Architect.

YOU ARE REVIEWING THE "BLACKBOARD" (Research + Match Context).
YOUR MISSION: Select the most appropriate mathematical formulas from the "CATALOG" and map the raw research data into specific formula parameters.

### THE BLACKBOARD (DATA)
[MATCH_CONTEXT]:
{MATCH_CONTEXT}

[RESEARCH_DATA]:
{RESEARCH_DATA}

### THE CATALOG (TOOLS)
{FORMULA_MENU}

### YOUR OBJECTIVE:
1. **Selection**: Pick one or more formulas that match the sport and available data.
2. **Parameter Mapping**: For each selected formula, extract or DERIVE the required parameters from the Blackboard. 
3. **Reasoning**: You MUST explain WHY you chose specific values (e.g., "I used 1.45 xG because the 3-match average is 1.6 but the key striker is injured").
4. **Deduction**: If a value is missing, infer it from context if possible, or mark it as missing.

### OUTPUT JSON SCHEMA:
{
  "sport": "FOOTBALL",
  "selectedFormulas": [
    {
      "formulaId": "FOOTBALL_POISSON",
      "reasoning": "Standard match winner calculation adjusted for recent defensive form and injury report.",
      "parameters": {
        "homeXG": 1.45,
        "awayXG": 1.10,
        "rho": -0.03
      }
    }
  ],
  "parameter_derivation": [
    {
      "parameter": "homeXG",
      "source": "Perplexity Findings #2",
      "logic": "Calculated 1.45 by averaging season xG (1.6) and last 3 matches (1.3), then adjusted -0.1 for missing forward."
    }
  ],
  "missingData": [],
  "confidence": 0.85
}

CRITICAL: Output ONLY JSON. Do not invent formulas not in the catalog.
`;

// ============================================================
// MAIN SELECTOR
// ============================================================

export async function selectFormulas({ matchContext, researchData, callGPT, signal }) {
    const sport = normalizeSport(matchContext?.sport);
    const catalogForSport = listCatalog(sport);

    // Build Menu for Prompt
    const menuStr = catalogForSport.map(f => {
        return `- ID: ${f.id}\n  NAME: ${f.name}\n  DESC: ${f.description}\n  INPUTS: ${JSON.stringify(f.inputs)}`;
    }).join('\n\n');

    // Research data flattening
    const researchStr = Array.isArray(researchData)
        ? researchData.map((r, i) => `[Finding #${i + 1}] Query: ${r.query}\nAnswer: ${r.answer}`).join('\n\n')
        : '(None)';

    const prompt = PROMPT_FORMULA_SELECTOR
        .replace('{MATCH_CONTEXT}', JSON.stringify(matchContext || {}, null, 2))
        .replace('{RESEARCH_DATA}', researchStr)
        .replace('{FORMULA_MENU}', menuStr);

    try {
        const response = await callGPT({
            system: "You are a PhD Sports Quantitative Architect. You decide which math tools to use and how to map data to them.",
            user: prompt,
            jsonMode: true,
            signal
        });

        const selection = typeof response === 'string' ? JSON.parse(response) : response;

        // Basic normalization & validation
        if (!selection.selectedFormulas || !Array.isArray(selection.selectedFormulas)) {
            selection.selectedFormulas = [];
        }

        // Ensure parameters are numeric where expected
        selection.selectedFormulas.forEach(sf => {
            if (sf.parameters && typeof sf.parameters === 'object') {
                for (const key in sf.parameters) {
                    const n = safeNumber(sf.parameters[key]);
                    if (n !== null) sf.parameters[key] = n;
                }
            }
        });

        return selection;
    } catch (e) {
        console.error('[FormulaSelector] Architect Agent failed:', e);
        // Fallback to sport-specific formula if AI fails
        const sportFormulaMap = {
            'FOOTBALL': 'FOOTBALL_POISSON',
            'SOCCER': 'FOOTBALL_POISSON',
            'BASKETBALL': 'BASKETBALL_POSSESSION',
            'NBA': 'BASKETBALL_POSSESSION',
            'TENNIS': 'TENNIS_HDD',
            'HOCKEY': 'HOCKEY_POISSON_GSAX',
            'NHL': 'HOCKEY_POISSON_GSAX',
            'BASEBALL': 'BASEBALL_NEGBIN_PYTH',
            'MLB': 'BASEBALL_NEGBIN_PYTH',
            'NFL': 'NFL_COMPOUND_DRIVE',
            'NCAAF': 'NFL_COMPOUND_DRIVE',
        };
        const formulaId = sportFormulaMap[sport] || 'FOOTBALL_POISSON';
        return {
            sport,
            selectedFormulas: [{
                formulaId,
                parameters: {} // Let the engine use its defaults
            }],
            confidence: 0.1,
            error: e.message
        };
    }
}

export default { selectFormulas, FORMULA_CATALOG, PROMPT_FORMULA_SELECTOR };