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
    hasPersistentMemory: boolean;
    buildings: Building[];

    autoAscendToggle: boolean;
    autoAscendMode: number; // 0=off, 1=fixed HC, 2=prestige doubles, 3=ROI
    ascendRoiMinHCIndex: number; // preference index: 0=5, 1=10, 2=25, 3=50, 4=100
    ascendRoiThresholdIndex: number; // preference index: 0=1h, 1=2h, 2=4h, 3=8h
    comboAscendBlock: boolean;
    cpsBonus: number;
    minCpSMult: number;

    hasWizardTower: boolean;
    hasTemple: boolean;
    hasChocolateEgg: boolean;

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
    minHC: number;
    rebuildCost: number;
    paybackSecs: number;
    thresholdHours: number;
    thresholdSecs: number;
    meetsMinHC: boolean;
    meetsPayback: boolean;
    wouldAscend: boolean;
}
