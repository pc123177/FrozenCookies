// Minimal typed surface for the legacy globals src/game/ glue code reads from. These are
// defined by legacy/*.js (still plain JS, loaded into the same bundle - see src/main.ts) and
// by Cookie Clicker itself. Only what src/game/ actually touches is declared here; the
// legacy files keep using the untyped `any` implicitly for everything else.

interface CCBuilding {
    basePrice: number;
    amount: number;
    unlocked: number;
    minigame: unknown;
    getPrice(): number;
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
    ObjectsById: CCBuilding[];
    Objects: Record<string, CCBuilding>;
    UpgradesById: Record<number, CCUpgrade>;
    Upgrades: Record<string, CCUpgrade>;
    Has(name: string): boolean;
    Ascend(reincarnate: number): void;
    Reincarnate(fromAscend: number): void;
    ClosePrompt(): void;
}

declare const Game: CCGame;

interface FrozenCookiesState {
    autoAscendToggle: number;
    autoAscend: number;
    ascendROIMinHC: number;
    ascendROIThreshold: number;
    comboAscend: number;
    minCpSMult: number;
    frequency: number;
    autopilot?: number;
    autoBuyHeavenlyUpgrades?: number;
    [key: string]: unknown;
}

declare const FrozenCookies: FrozenCookiesState;

// Pure helpers still defined in legacy/fc_main.js (not yet migrated).
declare function wrinklerValue(): number;
declare function chocolateValue(): number;
declare function cpsBonus(): number;
declare function logEvent(category: string, message: string): void;
