// Standalone test for parseAllOdds logic
// Run with: node tests/unit_parse_logic.js

const assert = require('assert');

// Copying the function from HowItWorksPage.jsx for isolated testing
function safeNumber(x) {
    const n = typeof x === "number" ? x : parseFloat(String(x));
    return Number.isFinite(n) ? n : NaN;
}

function parseAllOdds(inputRaw) {
    const raw = String(inputRaw ?? "").trim();
    const s = raw.replace(/\s/g, "");

    if (!s) {
        return { ok: false, decimal: NaN, format: "Invalid", error: "Odds is required." };
    }

    // A) Fractional (contains "/")
    if (s.includes("/")) {
        const parts = s.split("/");
        if (parts.length !== 2) {
            return { ok: false, decimal: NaN, format: "Invalid", error: "Invalid fractional odds format (use a/b)." };
        }
        const num = safeNumber(parts[0]);
        const den = safeNumber(parts[1]);
        if (!Number.isFinite(num) || !Number.isFinite(den) || num <= 0 || den <= 0) {
            return { ok: false, decimal: NaN, format: "Invalid", error: "Fractional odds must be positive: a/b." };
        }
        const dec = 1 + num / den;
        if (!(Number.isFinite(dec) && dec > 1.0)) {
            return { ok: false, decimal: NaN, format: "Invalid", error: "Fractional odds produced invalid decimal odds." };
        }
        return { ok: true, decimal: dec, format: "Fractional" };
    }

    // B) American (+150, -110)
    if (s.startsWith("+") || s.startsWith("-")) {
        const A = safeNumber(s);
        if (!Number.isFinite(A) || A === 0) {
            return { ok: false, decimal: NaN, format: "Invalid", error: "Invalid American odds (use +150 or -110)." };
        }
        const dec = A > 0 ? 1 + A / 100 : 1 + 100 / Math.abs(A);
        if (!(Number.isFinite(dec) && dec > 1.0)) {
            return { ok: false, decimal: NaN, format: "Invalid", error: "American odds produced invalid decimal odds." };
        }
        return { ok: true, decimal: dec, format: "American" };
    }

    // C) Decimal (accept comma)
    const normalized = s.replace(",", ".");
    const dec = safeNumber(normalized);
    if (!(Number.isFinite(dec) && dec > 1.0)) {
        return { ok: false, decimal: NaN, format: "Invalid", error: "Decimal odds must be > 1.00." };
    }
    return { ok: true, decimal: dec, format: "Decimal" };
}

// Tests
console.log('Running parseAllOdds tests...');

function test(name, input, expectedDecimal, expectedFormat) {
    const result = parseAllOdds(input);
    try {
        if (!result.ok) throw new Error(`Parsing failed for ${input}: ${result.error}`);
        const decimalMain = result.decimal;
        // Float comparison
        if (Math.abs(decimalMain - expectedDecimal) > 0.0001) {
            throw new Error(`Expected ${expectedDecimal}, got ${decimalMain}`);
        }
        if (result.format !== expectedFormat) {
            throw new Error(`Expected format ${expectedFormat}, got ${result.format}`);
        }
        console.log(`PASS: ${name}`);
    } catch (e) {
        console.error(`FAIL: ${name} - ${e.message}`);
        process.exitCode = 1;
    }
}

test('Decimal dot', '2.50', 2.50, 'Decimal');
test('Decimal comma', '2,50', 2.50, 'Decimal');
test('American +100', '+100', 2.00, 'American');
test('American -110', '-110', 1.90909, 'American');
test('Fractional 5/2', '5/2', 3.50, 'Fractional');
test('Fractional 1/1', '1/1', 2.00, 'Fractional');

// Edge cases
const invalid = parseAllOdds('invalid');
if (!invalid.ok && invalid.format === 'Invalid') console.log('PASS: Invalid Input');
else { console.error('FAIL: Invalid Input check'); process.exitCode = 1; }

const empty = parseAllOdds('');
if (!empty.ok && empty.error.includes('required')) console.log('PASS: Empty Input');
else { console.error('FAIL: Empty Input check'); process.exitCode = 1; }

console.log('Done.');
