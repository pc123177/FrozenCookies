import type { GameSnapshot } from "../core/types";

// The ONE place that touches Cookie Clicker's live Game/FrozenCookies globals to build the
// plain-data GameSnapshot pure logic (src/core/) consumes. Keeping this narrow is what makes
// core/ checkable in isolation (src/core/*.selfcheck.ts) without a live Game object.
export function buildGameSnapshot(): GameSnapshot {
    return {
        prestige: Game.prestige,
        cookies: Game.cookies,
        cookiesEarned: Game.cookiesEarned,
        cookiesReset: Game.cookiesReset,
        cookiesPs: Game.cookiesPs,
        wrinklerValue: wrinklerValue(),
        chocolateValue: chocolateValue(),
        hasPersistentMemory: Game.Has("Persistent memory"),
        hcExponent: Game.HCfactor,
        buildings: Game.ObjectsById.map((b) => ({ basePrice: b.basePrice, amount: b.amount })),

        autoAscendToggle: FrozenCookies.autoAscendToggle === 1,
        autoAscendMode: FrozenCookies.autoAscend,
        ascendRoiMinHCIndex: FrozenCookies.ascendROIMinHC,
        ascendRoiThresholdIndex: FrozenCookies.ascendROIThreshold,
        comboAscendBlock: FrozenCookies.comboAscend === 1,
        cpsBonus: cpsBonus(),
        minCpSMult: FrozenCookies.minCpSMult,

        hasWizardTower: Game.Objects["Wizard tower"].amount > 0,
        hasTemple: Game.Objects["Temple"].amount > 0,
        hasDragon: Game.dragonLevel > 0,

        isAscending: !!Game.OnAscend || !!Game.AscendTimer,
    };
}
