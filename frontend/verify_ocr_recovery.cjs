
const parseOdd = (raw) => {
    if (!raw) return null;
    const s = String(raw).replace(/[^0-9.,\/+\-]/g, "").trim();
    if (s.includes("/")) {
        const parts = s.split("/");
        if (parts.length === 2) {
            const num = Number(parts[0]);
            const den = Number(parts[1]);
            if (den !== 0) return 1 + (num / den);
        }
    }
    if (s.startsWith("+") || s.startsWith("-") || (Math.abs(Number(s)) >= 100 && !s.includes("."))) {
        const n = Number(s);
        if (Number.isFinite(n)) {
            return n > 0 ? 1 + (n / 100) : 1 + (100 / Math.abs(n));
        }
    }
    const d = Number(s.replace(",", "."));
    return Number.isFinite(d) ? d : null;
};

function extractOddsFromResearch(evidenceLog) {
    if (!Array.isArray(evidenceLog) || evidenceLog.length === 0) return null;
    const text = evidenceLog.map((e) => String(e?.answer ?? "")).join(" ");

    const valRx = `(?:[0-9]+\\/[0-9]+|[+-]?[0-9]{3,}|[0-9]+(?:[.,][0-9]+)?)`;
    const sepRx = `\\s*[\\/,\\-–—vs]+\\s*`;

    // Try 3-way pattern: H - D - A
    const tripleRx = new RegExp(`(${valRx})${sepRx}(${valRx})${sepRx}(${valRx})`);
    const triple = text.match(tripleRx);
    if (triple) {
        const a = parseOdd(triple[1]);
        const b = parseOdd(triple[2]);
        const c = parseOdd(triple[3]);
        if (a > 1 && a < 100 && b > 1 && b < 100 && c > 1 && c < 100) {
            return { homeOdds: a, drawOdds: b, awayOdds: c };
        }
    }

    // Named Extraction
    const homeM = text.match(new RegExp(`(?:home|win1|winner1|1|win|ht1)\\s*[:=–—\\s]+\\s*(${valRx})`, "i"));
    const drawM = text.match(new RegExp(`(?:draw|X|tie|x\\d?)\\s*[:=–—\\s]+\\s*(${valRx})`, "i"));
    const awayM = text.match(new RegExp(`(?:away|win2|winner2|2|ht2)\\s*[:=–—\\s]+\\s*(${valRx})`, "i"));

    const homeOdds = parseOdd(homeM?.[1]);
    const drawOdds = parseOdd(drawM?.[1]);
    const awayOdds = parseOdd(awayM?.[1]);

    if (homeOdds && awayOdds) {
        return { homeOdds, drawOdds: drawOdds || 0, awayOdds };
    }
    return null;
}

// TEST CASE: Raw OCR dump with odds
const mockLog = [
    {
        round: "VISION_OCR",
        answer: "[RAW_OCR_DUMP]: FTC vs Ujpest Money Line Home: 1.85 Draw: 4.65 Away: 3.90 Over 2.5: 1.75"
    }
];

const recovered = extractOddsFromResearch(mockLog);
console.log("Recovered from OCR:", JSON.stringify(recovered, null, 2));

if (recovered && recovered.homeOdds === 1.85 && recovered.drawOdds === 4.65) {
    console.log("SUCCESS: Recovered all 3-way odds from OCR dump.");
} else {
    console.error("FAILURE: Recovery failed.");
    process.exit(1);
}
