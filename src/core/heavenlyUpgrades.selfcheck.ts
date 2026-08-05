import assert from "node:assert";
import { nextHeavenlyUpgradeToBuy } from "./heavenlyUpgrades.ts";

const upgrades = [
    { name: "Locked cheap", price: 10, unlocked: false, bought: false },
    { name: "Already bought", price: 5, unlocked: true, bought: true },
    { name: "Too expensive", price: 1000, unlocked: true, bought: false },
    { name: "Affordable expensive", price: 50, unlocked: true, bought: false },
    { name: "Affordable cheap", price: 20, unlocked: true, bought: false },
];

assert.strictEqual(
    nextHeavenlyUpgradeToBuy(upgrades, 100),
    "Affordable cheap",
    "picks the cheapest unlocked, unbought, affordable upgrade"
);

assert.strictEqual(
    nextHeavenlyUpgradeToBuy(upgrades, 0),
    null,
    "nothing affordable with 0 heavenly chips"
);

assert.strictEqual(
    nextHeavenlyUpgradeToBuy([], 1000),
    null,
    "no upgrades at all -> null"
);

console.log("heavenlyUpgrades.selfcheck: OK");
