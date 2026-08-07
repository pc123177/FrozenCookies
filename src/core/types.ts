// Plain-data contract between game glue (src/game/) and pure decision logic (src/core/).
// Nothing in core/ ever touches `Game`/`FrozenCookies`/DOM directly - only this shape.

export interface Building {
    basePrice: number;
    amount: number;
}

export interface GameSnapshot {
    prestige: number;
    cookies: number;
    cookiesEarned: number;
    cookiesReset: number;
    cookiesPs: number;
    wrinklerValue: number;
    chocolateValue: number;
    // Game.heavenlyPower * Game.GetHeavenlyMultiplier() - the real per-HC CpS bonus factor
    // (Game.CalculateGains: mult += prestige*0.01*heavenlyPower*GetHeavenlyMultiplier()).
    // GetHeavenlyMultiplier() starts at 0 and only grows by owning "Heavenly chip secret"
    // (+0.05), "Heavenly cookie stand" (+0.20), "Heavenly bakery" (+0.25), "Heavenly
    // confectionery" (+0.25), "Heavenly key" (+0.25), Dragon God aura, and Lucky
    // digit/number/payout upgrades (the Creation god can also shrink it). Read live rather
    // than reimplemented, so it can never drift from the real formula.
    heavenlyBonusMultiplier: number;
    hcExponent: number; // Game.HCfactor - the live exponent in prestige = (cookies/1e12)^(1/hcExponent)
    buildings: Building[];

    autoAscendToggle: boolean;
    autoAscendMode: number; // 0=off, 1=fixed HC, 2=prestige doubles, 3=ROI
    ascendRoiThresholdIndex: number; // preference index: 0=1h, 1=2h, 2=4h, 3=8h
    ascendRoiMinGrowthIndex: number; // preference index: 0=off, 1=2%, 2=5%, 3=10%, 4=20%, 5=35%
    comboAscendBlock: boolean;
    cpsBonus: number;
    minCpSMult: number;

    hasWizardTower: boolean;
    hasTemple: boolean;
    hasDragon: boolean; // Game.dragonLevel > 0 (egg hatched) - NOT the "Chocolate egg"
    // heavenly upgrade, an unrelated CpS-bonus purchase that happens to share the word "egg".

    isAscending: boolean; // Game.OnAscend || Game.AscendTimer
}

export type GameStageId = "early" | "mid" | "late";

export interface GameStage {
    stage: GameStageId;
    label: string;
    reason: string;
}

export interface AscendRoiStats {
    newHC: number;
    minGrowthPercent: number;
    rebuildCost: number;
    paybackSecs: number;
    thresholdHours: number;
    thresholdSecs: number;
    meetsSanityFloor: boolean;
    meetsGrowth: boolean;
    meetsPayback: boolean;
    wouldAscend: boolean;
}
