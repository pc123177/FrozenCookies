import type { GameStageId } from "./types";

// Subset of FrozenCookies.* settings the autopilot controls. Field names match the legacy
// preference keys 1:1 (fc_preferences.js) so game/autopilot-bot.ts can apply this object
// directly onto window.FrozenCookies without a translation layer.
export interface StageSettings {
    autoClick: number; cookieClickSpeed: number;
    autoFrenzy: number; frenzyClickSpeed: number;
    autoGC: number; autoReindeer: number; autoFortune: number;
    autoBuy: number; otherUpgrades: number;
    autoBlacklistOff: number; blacklist: number;
    mineLimit: number; mineMax?: number;
    factoryLimit: number; factoryMax?: number;
    pastemode: number;
    autoAscendToggle: number; autoAscend: number;
    ascendROIMinHC: number; ascendROIThreshold: number;
    comboAscend: number; HCAscendAmount: number;
    autoBulk: number; autoBuyAll: number;
    autoWrinkler: number; shinyPop: number;
    autoSL: number; dragonsCurve: number;
    sugarBakingGuard: number; autoGS: number; autoGodzamok: number;
    autoBank: number; autoBroker: number; autoLoan: number; minLoanMult?: number;
    autoWorshipToggle: number; autoWorship0: number; autoWorship1: number; autoWorship2: number;
    autoCyclius: number;
    towerLimit: number; manaMax?: number; autoCasting: number; minCpSMult: number;
    autoFTHOFCombo: number; auto100ConsistencyCombo: number;
    autoSugarFrenzy: number; minASFMult?: number; autoSweet: number;
    autoDragon: number; petDragon: number; autoDragonToggle: number;
    autoDragonAura0?: number; autoDragonAura1?: number;
    autoDragonOrbs: number; orbLimit: number; orbMax?: number;
    defaultSeasonToggle: number; defaultSeason: number;
    freeSeason: number; autoEaster: number; autoHalloween: number;
    holdManBank: number; holdSEBank: number; setHarvestBankPlant: number;
    FCshortcuts: number; simulatedGCPercent: number;
    showMissedCookies: number; numberDisplay: number; fancyui: number;
    logging: number; purchaseLog: number; fpsModifier: number; trackStats: number;
}

const SHARED_BASE: StageSettings = {
    autoClick: 1, cookieClickSpeed: 250,
    autoFrenzy: 1, frenzyClickSpeed: 1000,
    autoGC: 1, autoReindeer: 1, autoFortune: 1,
    autoBuy: 1, otherUpgrades: 1,
    autoBlacklistOff: 0, blacklist: 0,
    mineLimit: 0, factoryLimit: 0, pastemode: 0,
    autoAscendToggle: 1, autoAscend: 3,
    ascendROIMinHC: 1, ascendROIThreshold: 1,
    comboAscend: 0, HCAscendAmount: 0,
    autoBulk: 2, autoBuyAll: 1,
    autoWrinkler: 1, shinyPop: 0,
    autoSL: 0, dragonsCurve: 0,
    sugarBakingGuard: 0, autoGS: 0, autoGodzamok: 0,
    autoBank: 0, autoBroker: 0, autoLoan: 0,
    autoWorshipToggle: 0, autoWorship0: 0, autoWorship1: 0, autoWorship2: 0,
    autoCyclius: 0,
    towerLimit: 0, autoCasting: 0, minCpSMult: 7,
    autoFTHOFCombo: 0, auto100ConsistencyCombo: 0,
    autoSugarFrenzy: 0, autoSweet: 0,
    autoDragon: 0, petDragon: 0, autoDragonToggle: 0,
    autoDragonOrbs: 0, orbLimit: 0,
    defaultSeasonToggle: 1, defaultSeason: 1,
    freeSeason: 1, autoEaster: 1, autoHalloween: 1,
    holdManBank: 0, holdSEBank: 0, setHarvestBankPlant: 0,
    FCshortcuts: 1, simulatedGCPercent: 1,
    showMissedCookies: 0, numberDisplay: 1, fancyui: 1,
    logging: 1, purchaseLog: 0, fpsModifier: 2, trackStats: 0,
};

// Stage-tuned settings tables, direct port of fc_main.js's preset*GameAction() functions
// (this session, pre-autopilot) - same values, now a lookup table instead of 3
// near-duplicate functions. Differences from the shared base only.
export const STAGE_SETTINGS: Record<GameStageId, StageSettings> = {
    early: {
        ...SHARED_BASE,
        cookieClickSpeed: 150,
        ascendROIMinHC: 0, ascendROIThreshold: 0, // cheap/fast early ascends compound fastest
    },
    mid: {
        ...SHARED_BASE,
        ascendROIMinHC: 1, ascendROIThreshold: 1,
        autoSL: 2, sugarBakingGuard: 1, autoGS: 1, autoGodzamok: 1,
        autoBank: 1, autoBroker: 1, autoLoan: 1, minLoanMult: 777,
        autoWorshipToggle: 1, autoWorship0: 2, autoWorship1: 8,
        towerLimit: 1, manaMax: 37, autoCasting: 3,
        minASFMult: 7777,
        // FTHOF combo double-casts Force the Hand of Fate via a Wizard Tower sell/rebuy - real
        // optimization the autopilot never turned on for any stage. Safe to enable here: it
        // self-disables once Wizard tower.level > 10 (fc_spells.js autoFTHOFComboAction) and
        // yields to auto100ConsistencyCombo automatically once that's active (same file).
        autoFTHOFCombo: 1,
    },
    late: {
        ...SHARED_BASE,
        mineLimit: 1, mineMax: 500, factoryLimit: 1, factoryMax: 500,
        ascendROIMinHC: 2, ascendROIThreshold: 3, // rebuildCost fix already weighs the real cost
        autoSL: 2, dragonsCurve: 2,
        sugarBakingGuard: 1, autoGS: 1, autoGodzamok: 1,
        autoBank: 1, autoBroker: 1, autoLoan: 1, minLoanMult: 777,
        autoWorshipToggle: 1, autoWorship0: 2, autoWorship1: 8, autoCyclius: 1,
        towerLimit: 1, manaMax: 100, autoCasting: 0,
        auto100ConsistencyCombo: 1, autoSugarFrenzy: 1, minASFMult: 7,
        autoDragon: 1, petDragon: 1, autoDragonToggle: 1,
        autoDragonAura0: 15, autoDragonAura1: 16,
        orbMax: 200,
        // autoSweet stays 0 (SHARED_BASE) in every stage - README's explicit experimental-
        // feature warning, never auto-enabled by the autopilot.
    },
};

export function stageSettings(stage: GameStageId): StageSettings {
    return STAGE_SETTINGS[stage];
}
