import assert from "node:assert";
import { nextBuildingToLevel } from "./lumpLeveling.ts";

// nenhum edifício possuído
assert.strictEqual(nextBuildingToLevel([], 100, 0), null, "nenhum edifício -> null");

// açúcares insuficientes para qualquer um
assert.strictEqual(
    nextBuildingToLevel([{ name: "Farm", amount: 5, level: 3 }], 2, 0),
    null,
    "custo (level+1=4) > açúcares (2) -> null"
);

// edifício não possuído ignorado mesmo se barato
assert.strictEqual(
    nextBuildingToLevel(
        [
            { name: "Farm", amount: 0, level: 0 },
            { name: "Mine", amount: 3, level: 5 },
        ],
        100,
        0
    ),
    "Mine",
    "edifício com amount=0 ignorado"
);

// edifício possuído mais barato (menor nível) vence
assert.strictEqual(
    nextBuildingToLevel(
        [
            { name: "Farm", amount: 3, level: 7 },
            { name: "Mine", amount: 3, level: 2 },
            { name: "Bank", amount: 3, level: 9 },
        ],
        100,
        0
    ),
    "Mine",
    "menor nível escolhido primeiro"
);

// reserva do sugarBakingGuard respeitada
assert.strictEqual(
    nextBuildingToLevel([{ name: "Farm", amount: 3, level: 5 }], 105, 101),
    null,
    "reserva deixa apenas 4 disponíveis, custo é 6 -> null"
);
assert.strictEqual(
    nextBuildingToLevel([{ name: "Farm", amount: 3, level: 4 }], 106, 101),
    "Farm",
    "reserva deixa 5 disponíveis, custo é 5 -> Farm"
);

console.log("lumpLeveling.selfcheck.ts: all assertions passed");
