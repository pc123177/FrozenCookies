// Contrato de dados simples entre a cola do jogo (src/game/) e a lógica de decisão pura (src/core/).
// Nada em core/ toca `Game`/`FrozenCookies`/DOM diretamente - apenas esta forma.

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
    // Game.heavenlyPower * Game.GetHeavenlyMultiplier() - o fator bônus real de CpS por HC
    // (Game.CalculateGains: mult += prestige*0.01*heavenlyPower*GetHeavenlyMultiplier()).
    // GetHeavenlyMultiplier() começa em 0 e só cresce ao possuir "Heavenly chip secret"
    // (+0.05), "Heavenly cookie stand" (+0.20), "Heavenly bakery" (+0.25), "Heavenly
    // confectionery" (+0.25), "Heavenly key" (+0.25), aura Dragon God e melhorias Lucky
    // digit/number/payout (a Creation god também pode reduzi-lo). Lido ao vivo em vez de
    // reimplementado, para nunca divergir da fórmula real.
    heavenlyBonusMultiplier: number;
    hcExponent: number; // Game.HCfactor - o expoente ao vivo em prestige = (cookies/1e12)^(1/hcExponent)
    buildings: Building[];

    autoAscendToggle: boolean;
    autoAscendMode: number; // 0=desligado, 1=HC fixo, 2=prestígio duplica, 3=ROI
    ascendRoiThresholdIndex: number; // índice de preferência: 0=1h, 1=2h, 2=4h, 3=8h
    ascendRoiMinGrowthIndex: number; // índice de preferência: 0=desligado, 1=2%, 2=5%, 3=10%, 4=20%, 5=35%
    comboAscendBlock: boolean;
    cpsBonus: number;
    minCpSMult: number;

    hasWizardTower: boolean;
    hasTemple: boolean;
    hasDragon: boolean; // Game.dragonLevel > 0 (ovo chocado) - NÃO a melhoria celestial
    // "Chocolate egg", uma compra de bônus de CpS não relacionada que por acaso compartilha a palavra "egg".

    isAscending: boolean; // Game.OnAscend || Game.AscendTimer (ascensão em andamento)
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
