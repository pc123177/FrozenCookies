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
    "escolhe a melhoria desbloqueada, não comprada e mais barata que seja acessível"
);

assert.strictEqual(
    nextHeavenlyUpgradeToBuy(upgrades, 0),
    null,
    "nada acessível com 0 chips celestiais"
);

assert.strictEqual(
    nextHeavenlyUpgradeToBuy([], 1000),
    null,
    "nenhuma melhoria existente -> null"
);

console.log("heavenlyUpgrades.selfcheck: OK");
