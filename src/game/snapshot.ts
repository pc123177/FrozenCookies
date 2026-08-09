import type { GameSnapshot } from "../core/types";

// O ÚNICO lugar que acessa os globais ao vivo Game/FrozenCookies do Cookie Clicker para construir o
// GameSnapshot de dados simples que a lógica pura (src/core/) consome. Manter isso restrito é o que
// permite verificar core/ de forma isolada (src/core/*.selfcheck.ts) sem um objeto Game ao vivo.
export function buildGameSnapshot(): GameSnapshot {
    return {
        prestige: Game.prestige,
        cookies: Game.cookies,
        cookiesEarned: Game.cookiesEarned,
        cookiesReset: Game.cookiesReset,
        cookiesPs: Game.cookiesPs,
        wrinklerValue: wrinklerValue(),
        chocolateValue: chocolateValue(),
        heavenlyBonusMultiplier: Game.heavenlyPower * Game.GetHeavenlyMultiplier(),
        hcExponent: Game.HCfactor,
        buildings: Game.ObjectsById.map((b) => ({ basePrice: b.basePrice, amount: b.amount })),

        autoAscendToggle: FrozenCookies.autoAscendToggle === 1,
        autoAscendMode: FrozenCookies.autoAscend,
        ascendRoiThresholdIndex: FrozenCookies.ascendROIThreshold,
        ascendRoiMinGrowthIndex: FrozenCookies.ascendROIMinGrowth,
        comboAscendBlock: FrozenCookies.comboAscend === 1,
        cpsBonus: cpsBonus(),
        minCpSMult: FrozenCookies.minCpSMult,

        hasWizardTower: Game.Objects["Wizard tower"].amount > 0,
        hasTemple: Game.Objects["Temple"].amount > 0,
        hasDragon: Game.dragonLevel > 0,
        hasHowToBakeYourDragon: Game.Has("How to bake your dragon"),
        hasCrumblyEgg: Game.Has("A crumbly egg"),

        isAscending: !!Game.OnAscend || !!Game.AscendTimer,
    };
}
