import assert from "node:assert";
import { purchaseEfficiency } from "./efficiency.ts";

// Zero or negative deltaCps is never worth buying.
assert.strictEqual(purchaseEfficiency(1000, 0, 100), Number.POSITIVE_INFINITY);
assert.strictEqual(purchaseEfficiency(1000, -5, 100), Number.POSITIVE_INFINITY);

// Known hand-computed value: weight=1.0, price=1000, currentCps=100, deltaCps=5
// -> 1.0 * (1000/100) + (1000/5) = 10 + 200 = 210
assert.strictEqual(purchaseEfficiency(1000, 5, 100, 1.0), 210);

// Same delta, higher currentCps costs less time-penalty -> lower (better) efficiency.
const cheaperContext = purchaseEfficiency(1000, 5, 1000, 1.0);
const pricierContext = purchaseEfficiency(1000, 5, 100, 1.0);
assert.ok(cheaperContext < pricierContext, "higher currentCps should lower efficiency score");

// No synergy multiplier applied regardless of how large deltaCps is relative to currentCps -
// same price/deltaCps ratio must give the same efficiency contribution from that term.
const highImpact = purchaseEfficiency(1000, 600, 1000, 1.0); // deltaCps = 60% of currentCps
const lowImpact = purchaseEfficiency(1000, 10, 1000, 1.0); // deltaCps = 1% of currentCps
const expectedHigh = 1.0 * (1000 / 1000) + 1000 / 600;
const expectedLow = 1.0 * (1000 / 1000) + 1000 / 10;
assert.ok(Math.abs(highImpact - expectedHigh) < 1e-9, "no synergy boost should be applied (high impact)");
assert.ok(Math.abs(lowImpact - expectedLow) < 1e-9, "no synergy boost should be applied (low impact)");

console.log("efficiency.selfcheck: OK");
