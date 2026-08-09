// Superfície tipada mínima dos globais legados que o código de cola em src/game/ lê. Estes são
// definidos por legacy/*.js (ainda JS puro, carregado no mesmo bundle - veja src/main.ts) e
// pelo próprio Cookie Clicker. Somente o que src/game/ realmente utiliza é declarado aqui; os
// arquivos legados continuam usando `any` sem tipagem implicitamente para todo o resto.

interface CCBuilding {
    name: string;
    basePrice: number;
    amount: number;
    level: number;
    unlocked: number;
    minigame: unknown;
    getPrice(): number;
    levelUp(): void;
}

interface CCUpgrade {
    name: string;
    pool: string;
    unlocked: number;
    bought: number;
    parents: (CCUpgrade | -1)[];
    showIf?: () => boolean;
    getPrice(): number;
    buy(): void;
}

interface CCGame {
    prestige: number;
    cookies: number;
    cookiesEarned: number;
    cookiesReset: number;
    cookiesPs: number;
    elderWrath: number;
    OnAscend: number;
    AscendTimer: number;
    heavenlyChips: number;
    dragonLevel: number;
    HCfactor: number;
    lumps: number;
    heavenlyPower: number;
    ObjectsById: CCBuilding[];
    Objects: Record<string, CCBuilding>;
    UpgradesById: Record<number, CCUpgrade>;
    Upgrades: Record<string, CCUpgrade>;
    Has(name: string): boolean;
    Ascend(reincarnate: number): void;
    Reincarnate(fromAscend: number): void;
    ClosePrompt(): void;
    GetHeavenlyMultiplier(): number;
}

declare const Game: CCGame;

interface FrozenCookiesState {
    autoAscendToggle: number;
    autoAscend: number;
    ascendROIThreshold: number;
    ascendROIMinGrowth: number;
    comboAscend: number;
    minCpSMult: number;
    frequency: number;
    autopilot?: number;
    autoBuyHeavenlyUpgrades?: number;
    autoLevelBuildings?: number;
    sugarBakingGuard?: number;
    [key: string]: unknown;
}

declare const FrozenCookies: FrozenCookiesState;

// Helpers puros ainda definidos em legacy/fc_main.js (ainda não migrados).
declare function wrinklerValue(): number;
declare function chocolateValue(): number;
declare function cpsBonus(): number;
declare function logEvent(category: string, message: string): void;
