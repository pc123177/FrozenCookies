import assert from "node:assert";
import { purchaseEfficiency } from "./efficiency.ts";

// deltaCps zero ou negativo nunca vale a pena comprar.
assert.strictEqual(purchaseEfficiency(1000, 0, 100), Number.POSITIVE_INFINITY);
assert.strictEqual(purchaseEfficiency(1000, -5, 100), Number.POSITIVE_INFINITY);

// Valor calculado manualmente conhecido: weight=1.0, price=1000, currentCps=100, deltaCps=5
// -> 1.0 * (1000/100) + (1000/5) = 10 + 200 = 210
assert.strictEqual(purchaseEfficiency(1000, 5, 100, 1.0), 210);

// Mesmo delta, currentCps maior custa menos penalidade de tempo -> eficiência menor (melhor).
const cheaperContext = purchaseEfficiency(1000, 5, 1000, 1.0);
const pricierContext = purchaseEfficiency(1000, 5, 100, 1.0);
assert.ok(cheaperContext < pricierContext, "higher currentCps should lower efficiency score");

// Nenhum multiplicador de sinergia aplicado independentemente de quão grande deltaCps é em relação
// a currentCps - a mesma razão price/deltaCps deve dar a mesma contribuição de eficiência desse termo.
const highImpact = purchaseEfficiency(1000, 600, 1000, 1.0); // deltaCps = 60% de currentCps
const lowImpact = purchaseEfficiency(1000, 10, 1000, 1.0); // deltaCps = 1% de currentCps
const expectedHigh = 1.0 * (1000 / 1000) + 1000 / 600;
const expectedLow = 1.0 * (1000 / 1000) + 1000 / 10;
assert.ok(Math.abs(highImpact - expectedHigh) < 1e-9, "nenhum boost de sinergia deve ser aplicado (alto impacto)");
assert.ok(Math.abs(lowImpact - expectedLow) < 1e-9, "nenhum boost de sinergia deve ser aplicado (baixo impacto)");

console.log("efficiency.selfcheck: OK");
