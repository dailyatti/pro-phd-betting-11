/**
 * Tennis Model
 * Markov Chain based on Service Hold Probabilities.
 */

// P(Win Game | Server)
// O'Malley Formula for Game Win (Server)
const calcGameWin = (pHold) => {
    const p = pHold;
    const q = 1 - p;
    const p4 = p * p * p * p;
    const pDeuce = 20 * (p * p * p) * (q * q * q);
    const pWinDeuce = (p * p) / (p * p + q * q);
    // P(Win<Deuce) = p^4(1 + 4q + 10q^2)
    const pNoDeuce = p4 * (1 + 4 * q + 10 * q * q);
    return pNoDeuce + pDeuce * pWinDeuce;
};

// P(Win Set) - Markov Chain
// 6 games to win, generally tiebreak at 6-6
const calcSetWin = (pServ1, pServ2) => {
    // 1. Calculate Game Win probabilities
    const pG1 = calcGameWin(pServ1); // P1 wins service game
    const pG2 = calcGameWin(pServ2); // P2 wins service game (Start with P2 serving => P2 holds)

    // Actually we need:
    // P(P1 wins game on serve) = pG1
    // P(P1 wins game on return) = 1 - pG2

    // We can use a simplified 6-game set approximation or full recursion.
    // Given "PhD Level", we should use a proper set formula or at least a 
    // Monte Carlo if the formula is too complex for this snippet.
    // However, O'Malley provides a closed form or we can simulate 1000 sets in ms.
    // For JS efficiency in a browser, a simulation is robust and easy to read.
    // OR: Use the "Newton-Raphson" or matrix method? No, overkill.
    // Let's use a 5-point simplified iterator for the set.

    // PROPER METHOD: P_set approx.
    // But since the user complained about "Heuristic Fallacy", we MUST NOT use a heuristic.
    // Let's implement the Set Logic properly.

    let pSet1 = 0;

    // Analytical solution is huge. Let's precise simulation (10,000 runs) or small matrix? 
    // Actually, considering performance, the "Barnett" formulas are standard in tennis quant.
    // But let's write a clean recursive function with memoization for "First to 6, ahead by 2, TB at 6-6".

    const memo = new Map();
    const solveSet = (s1, s2) => {
        if (s1 === 6 && s2 <= 4) return 1;
        if (s2 === 6 && s1 <= 4) return 0;
        if (s1 === 7) return 1;
        if (s2 === 7) return 0;
        if (s1 === 6 && s2 === 6) {
            // Tiebreak: First to 7, ahead by 2.
            // Tiebreak is a mini-game.
            // pTB = P(P1 wins TB).
            // TB serves rotate. 
            // Approx TB win prob: pTB ~ pG1 if pG1~pG2? No.
            // Let's assume TB win prob is roughly weighted by service points.
            // Simplified TB: P1 wins if (p1_serve_pts + p1_return_pts) > ...
            // Let's use a standard TB estimator: pTB = pSet heuristic? NO manually calc.
            // Let's treat TB as a single game with p = 0.5 + (pServ1 - pServ2). Crude.
            // Let's recurse TB?
            return solveTB(0, 0, true);
        }

        const k = `${s1},${s2}`;
        if (memo.has(k)) return memo.get(k);

        // Who serves?
        // Game 1: P1, Game 2: P2...
        // Sum of games = s1+s2.
        // If (s1+s2) is even, P1 serves (0, 2, 4...) -> 1, 3, 5
        // Wait, standard is P1 serves game 0 (0-0). P2 serves game 1 (1-0).
        const p1Serving = (s1 + s2) % 2 === 0;

        const pWinGame = p1Serving ? pG1 : (1 - pG2);

        const prob = pWinGame * solveSet(s1 + 1, s2) + (1 - pWinGame) * solveSet(s1, s2 + 1);
        memo.set(k, prob);
        return prob;
    };

    // Tiebreak solver (First to 7, win by 2)
    const memoTB = new Map();
    const solveTB = (t1, t2, p1ServeNext) => {
        if ((t1 >= 7 && t1 >= t2 + 2)) return 1;
        if ((t2 >= 7 && t2 >= t1 + 2)) return 0;
        // Cap recursion to prevent stack overflow in infinite deuce (rare in TB but possible)
        if (t1 > 20 || t2 > 20) return t1 > t2 ? 1 : 0;

        const k = `${t1},${t2},${p1ServeNext}`;
        if (memoTB.has(k)) return memoTB.get(k);

        // TB Serve logic:
        // Pt 1: P1
        // Pt 2,3: P2
        // Pt 4,5: P1 ...
        // Sequence: A, BB, AA, BB...
        // 0 (0-0): A serves.
        // 1 (1-0): B serves.
        // 2 (1-1): B serves.
        // 3 (2-1): A serves.
        // Logic: if ((t1+t2) % 4 === 0 || (t1+t2) % 4 === 3) -> A serves? NO.
        // 0: A
        // 1: B
        // 2: B
        // 3: A
        // 4: A
        // 5: B

        const sum = t1 + t2;
        const mod4 = sum % 4;
        const p1IsServer = (mod4 === 0 || mod4 === 3);

        // pPointWin
        // if P1 server: pServ1
        // if P2 server: 1 - pServ2
        const pPointWin = p1IsServer ? pServ1 : (1 - pServ2);

        const prob = pPointWin * solveTB(t1 + 1, t2) + (1 - pPointWin) * solveTB(t1, t2 + 1);
        memoTB.set(k, prob);
        return prob;
    };

    return solveSet(0, 0);
};

/**
 * Calculates match probabilities (PhD Markov Chain Version).
 * @param {object} params
 * @param {number} params.p1Stats.serve_hold - % (e.g. 0.75)
 * @param {number} params.p2Stats.serve_hold - % (e.g. 0.72)
 */
export const calcTennisProbs = ({ p1Stats, p2Stats }) => {
    const p1 = p1Stats.serve_hold || 0.65;
    const p2 = p2Stats.serve_hold || 0.65;

    // 1. Calculate Set Win Probability (Recursive Markov)
    const pSet = calcSetWin(p1, p2);

    // 2. Match Win (Best of 3)
    // P(Win) = P(WW) + P(WLW) + P(LWW)
    // P(WW) = pSet * pSet
    // P(WLW) = pSet * (1-pSet) * pSet
    // P(LWW) = (1-pSet) * pSet * pSet
    const pWW = pSet * pSet;
    const pWLW = pSet * (1 - pSet) * pSet;
    const pLWW = (1 - pSet) * pSet * pSet;

    const pMatch = pWW + pWLW + pLWW;

    return {
        p1_win: pMatch,
        p2_win: 1 - pMatch,
        set_prob: pSet
    };
};
