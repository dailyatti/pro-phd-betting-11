/**
 * Odds Parser Utility
 * Logic for extracting odds from raw research text or OCR dumps.
 */

/**
 * Helper: Parse various formats (American, Fractional, Decimal)
 * @param {string} raw 
 * @returns {number|null}
 */
export const parseOdd = (raw) => {
    if (!raw) return null;
    const s = String(raw).replace(/[^0-9.,\/+\-]/g, "").trim();

    // 1. Fractional (e.g. 5/2)
    if (s.includes("/")) {
        const parts = s.split("/");
        if (parts.length === 2) {
            const num = Number(parts[0]);
            const den = Number(parts[1]);
            if (den !== 0) return 1 + (num / den);
        }
    }

    // 2. American (e.g. +150, -110) - usually integer >= 100
    if (s.startsWith("+") || s.startsWith("-") || (Math.abs(Number(s)) >= 100 && !s.includes("."))) {
        const n = Number(s);
        if (Number.isFinite(n)) {
            return n > 0 ? 1 + (n / 100) : 1 + (100 / Math.abs(n));
        }
    }

    // 3. Decimal (e.g. 1.90, 2.5)
    const d = Number(s.replace(",", "."));
    return Number.isFinite(d) ? d : null;
};

/**
 * Extract decimal odds (home, draw, away) from research text for fallback when Vision missed them.
 * @param {Array} evidenceLog
 * @param {string} [team1] - Optional Home Team Name
 * @param {string} [team2] - Optional Away Team Name
 * @returns {Object|null}
 */
export function extractOddsFromResearch(evidenceLog, team1, team2) {
    if (!Array.isArray(evidenceLog) || evidenceLog.length === 0) return null;
    const text = evidenceLog.map((e) => String(e?.answer ?? "")).join(" ");

    // ValRx captures: 5/2 (Fraction), +150 (American), 1.90 (Decimal)
    // MASTER PROMPT FIX: Use flexible regex for integers and decimals
    const valRx = `(?:[0-9]+\\/[0-9]+|[+-]?[0-9]{3,}|\\d+(?:[.,]\\d+)?)`;
    const sepRx = `\\s*[\\/,\\-–—vs]+\\s*`;

    // 1. Try 3-way pattern: H - D - A (e.g. 1.80 / 3.50 / 4.20)
    const tripleRx = new RegExp(`(${valRx})${sepRx}(${valRx})${sepRx}(${valRx})`);
    const triple = text.match(tripleRx);

    // Sanity check helper
    const isValidOdd = (n) => n > 1.01 && n < 500;

    if (triple) {
        const a = parseOdd(triple[1]);
        const b = parseOdd(triple[2]);
        const c = parseOdd(triple[3]);
        if (isValidOdd(a) && isValidOdd(b) && isValidOdd(c)) {
            return { homeOdds: a, drawOdds: b, awayOdds: c };
        }
    }

    // 2. Try 2-way pattern: H - A (e.g. 1.90 - 1.90) for Tennis/NBA
    const doubleRx = new RegExp(`(${valRx})${sepRx}(${valRx})`);
    const doubleMatch = text.match(doubleRx);

    // Helper to escape regex special chars in team names
    const esc = (s) => s ? s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : "ZZZZZZ";

    // 3. Named Extraction (Home: 1.8, Away: 2.1)
    // We add dynamic team names to the regex options
    const t1Rx = team1 ? `${esc(team1)}|` : "";
    const t2Rx = team2 ? `${esc(team2)}|` : "";

    const homePattern = new RegExp(`(?:${t1Rx}home|win1|winner1|1|win|ht1)\\s*[:=–—\\s]+\\s*(${valRx})`, "i");
    const drawPattern = new RegExp(`(?:draw|X|tie|x\\d?)\\s*[:=–—\\s]+\\s*(${valRx})`, "i");
    const awayPattern = new RegExp(`(?:${t2Rx}away|win2|winner2|2|ht2)\\s*[:=–—\\s]+\\s*(${valRx})`, "i");

    const homeM = text.match(homePattern);
    const drawM = text.match(drawPattern);
    const awayM = text.match(awayPattern);

    const homeOdds = parseOdd(homeM?.[1]);
    const drawOdds = parseOdd(drawM?.[1]);
    const awayOdds = parseOdd(awayM?.[1]);

    // Priority: Named > Pattern
    if (isValidOdd(homeOdds) && isValidOdd(awayOdds)) {
        return { homeOdds, drawOdds: isValidOdd(drawOdds) ? drawOdds : 0, awayOdds };
    }

    // Fallback to 2-way pattern
    if (doubleMatch) {
        const a = parseOdd(doubleMatch[1]);
        const b = parseOdd(doubleMatch[2]);
        if (isValidOdd(a) && isValidOdd(b)) {
            return { homeOdds: a, drawOdds: 0, awayOdds: b };
        }
    }

    return null;
}
