import assert from "node:assert";
import { nextBuildingToLevel } from "./lumpLeveling.ts";

// no buildings owned
assert.strictEqual(nextBuildingToLevel([], 100, 0), null, "no buildings -> null");

// not enough lumps for anyone
assert.strictEqual(
    nextBuildingToLevel([{ name: "Farm", amount: 5, level: 3 }], 2, 0),
    null,
    "cost (level+1=4) > lumps (2) -> null"
);

// unowned building ignored even if cheap
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
    "amount=0 building skipped"
);

// cheapest (lowest level) owned building wins
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
    "lowest level chosen first"
);

// sugarBakingGuard reserve respected
assert.strictEqual(
    nextBuildingToLevel([{ name: "Farm", amount: 3, level: 5 }], 105, 101),
    null,
    "reserve leaves only 4 available, cost is 6 -> null"
);
assert.strictEqual(
    nextBuildingToLevel([{ name: "Farm", amount: 3, level: 4 }], 106, 101),
    "Farm",
    "reserve leaves 5 available, cost is 5 -> Farm"
);

console.log("lumpLeveling.selfcheck.ts: all assertions passed");
