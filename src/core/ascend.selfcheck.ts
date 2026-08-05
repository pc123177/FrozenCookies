import assert from "node:assert";
import { gameStage, ascendROIStats, shouldAscendByROI } from "./ascend.ts";
import type { GameSnapshot } from "./types.ts";

function baseSnapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
    return {
        prestige: 0,
        cookies: 0,
        cookiesEarned: 0,
        cookiesReset: 0,
        cookiesPs: 0,
        wrinklerValue: 0,
        chocolateValue: 0,
        hasPersistentMemory: false,
        hcExponent: 3,
        buildings: [],
        autoAscendToggle: false,
        autoAscendMode: 0,
        ascendRoiMinHCIndex: 0,
        ascendRoiThresholdIndex: 3,
        comboAscendBlock: false,
        cpsBonus: 1,
        minCpSMult: 7,
        hasWizardTower: false,
        hasTemple: false,
        hasDragon: false,
        isAscending: false,
        ...overrides,
    };
}

// --- gameStage ---
assert.strictEqual(gameStage(baseSnapshot()).stage, "early");
assert.strictEqual(gameStage(baseSnapshot({ hasWizardTower: true })).stage, "mid");
assert.strictEqual(gameStage(baseSnapshot({ hasTemple: true })).stage, "mid");
assert.strictEqual(
    gameStage(baseSnapshot({ hasWizardTower: true, hasDragon: true })).stage,
    "late",
    "Dragon hatched takes priority over mid-game signals"
);

// --- ascendROIStats ---
assert.strictEqual(ascendROIStats(baseSnapshot({ prestige: 0 })), null, "prestige < 1 -> null");

{
    // prestige=10, cookiesEarned chosen so resetPrestige = 100.5 exactly (100.5^3 * 1e12) -
    // deliberately not a perfect cube, so floor(100.5)=100 is robust against float epsilon
    // (a perfect-cube input like 1e18 can land a hair under the boundary and floor to 99).
    // newHC = 100 - 10 = 90
    const cookiesEarned = Math.pow(100.5, 3) * 1e12;
    const stats = ascendROIStats(
        baseSnapshot({
            prestige: 10,
            cookiesEarned,
            cookiesPs: 1e10,
            cpsBonus: 1,
            cookies: 1e10,
            ascendRoiMinHCIndex: 0, // min 5
            ascendRoiThresholdIndex: 3, // <= 8h
        })
    );
    assert.ok(stats, "expected non-null stats with prestige >= 1");
    assert.strictEqual(stats!.newHC, 90);
    assert.strictEqual(stats!.minHC, 5);
    assert.ok(stats!.meetsMinHC);
    assert.ok(stats!.rebuildCost === 0, "no buildings owned -> zero rebuild cost");
    // bonusPerHC=0.01, newBonus=0.9, cpsDelta = 1e10*0.9 = 9e9
    // paybackSecs = (1e10 + 0) / 9e9 ~= 1.111s
    assert.ok(Math.abs(stats!.paybackSecs - 10 / 9) < 1e-6);
    assert.ok(stats!.wouldAscend);
}

{
    // Rebuild cost pulls in owned buildings' full cumulative cost, driving payback up -
    // this is exactly the fix that was missing before this session (payback used to only
    // look at cookies-on-screen and ignored the cost of rebuilding).
    const withBuildings = ascendROIStats(
        baseSnapshot({
            prestige: 10,
            cookiesEarned: 1e18,
            cookiesPs: 1e10,
            cookies: 1e10,
            buildings: [{ basePrice: 15, amount: 100 }],
        })
    );
    const withoutBuildings = ascendROIStats(
        baseSnapshot({
            prestige: 10,
            cookiesEarned: 1e18,
            cookiesPs: 1e10,
            cookies: 1e10,
            buildings: [],
        })
    );
    assert.ok(withBuildings!.rebuildCost > 0);
    assert.ok(
        withBuildings!.paybackSecs > withoutBuildings!.paybackSecs,
        "owning buildings must raise the payback estimate (rebuild cost matters)"
    );
}

// --- shouldAscendByROI: real gate must be autoAscendToggle && autoAscendMode===3 ---
// This is the exact bug fixed this session: an old check on a non-existent preference
// (`autoAscendROI`) meant ROI ascend never fired regardless of what was selected in
// Options. Confirmed live in-game; this check locks the correct gate in place.
{
    const readySnapshot = baseSnapshot({
        prestige: 10,
        cookiesEarned: 1e18,
        cookiesPs: 1e10,
        cookies: 1e10,
        ascendRoiThresholdIndex: 3,
        autoAscendToggle: true,
        autoAscendMode: 3,
    });
    assert.ok(shouldAscendByROI(readySnapshot), "should ascend when gate + ROI conditions are met");
    assert.ok(
        !shouldAscendByROI({ ...readySnapshot, autoAscendToggle: false }),
        "must not ascend when autoAscendToggle is off, even if mode is 3"
    );
    assert.ok(
        !shouldAscendByROI({ ...readySnapshot, autoAscendMode: 2 }),
        "must not ascend when a different ascend mode is selected"
    );
}

console.log("ascend.selfcheck: OK");
