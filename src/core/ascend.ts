import type { GameSnapshot, GameStage, AscendRoiStats } from "./types";

// Detects game stage from actual unlock state (building ownership), not HC/cookie
// thresholds - those vary wildly by play speed and don't reflect what's actually
// available. Use amount > 0, not Game.Objects[...].unlocked ("visible in store", not
// owned) and not the minigame-object globals (they only populate after an async script
// fetch that can lag well behind the real purchase - confirmed live: a save with 30+
// Wizard Towers owned still read as EARLY GAME because the minigame script hadn't
// finished loading yet).
export function gameStage(snapshot: GameSnapshot): GameStage {
    if (snapshot.hasChocolateEgg) {
        return {
            stage: "late",
            label: "LATE GAME",
            reason: "Dragon unlocked (Chocolate egg owned)",
        };
    }
    if (snapshot.hasWizardTower || snapshot.hasTemple) {
        return {
            stage: "mid",
            label: "MID GAME",
            reason: "Wizard Tower/Temple unlocked, no Dragon yet",
        };
    }
    return {
        stage: "early",
        label: "EARLY GAME",
        reason: "Wizard Tower/Temple not unlocked yet",
    };
}

const ASCEND_ROI_MIN_HC_VALUES = [5, 10, 25, 50, 100];
const ASCEND_ROI_THRESHOLD_HOURS = [1, 2, 4, 8];

// Cumulative cookie cost to build a building from 0 to `amount` (same formula as the
// game's own cumulative-price curve).
function cumulativeBuildingCost(basePrice: number, amount: number): number {
    const priceIncrease = 1.15;
    return (basePrice * (Math.pow(priceIncrease, amount) - 1)) / (priceIncrease - 1);
}

// Computes the current ROI-ascend numbers with no side effects - same source of truth
// for both the automation decision (shouldAscendByROI) and any UI display.
// Returns null only when there isn't enough prestige yet to ascend at all.
export function ascendROIStats(snapshot: GameSnapshot): AscendRoiStats | null {
    if (snapshot.prestige < 1) return null;

    const cookiesBaked =
        snapshot.cookiesEarned +
        snapshot.cookiesReset +
        snapshot.wrinklerValue +
        snapshot.chocolateValue;
    // Game.HowMuchPrestige: prestige = (cookiesBaked / 1e12) ^ (1/3)
    const resetPrestige = Math.pow(cookiesBaked / 1e12, 1 / 3);
    const newHC = Math.floor(resetPrestige) - snapshot.prestige;

    const minHC = ASCEND_ROI_MIN_HC_VALUES[snapshot.ascendRoiMinHCIndex] ?? 10;

    const bonusPerHC = snapshot.hasPersistentMemory ? 0.02 : 0.01;
    const newBonus = Math.max(0, newHC) * bonusPerHC;

    // baseCps = cookiesPs / cpsBonus (strip buff multipliers to get the base rate ascend
    // bonuses actually apply to).
    const currentCps = snapshot.cpsBonus > 0 ? snapshot.cookiesPs / snapshot.cpsBonus : 0;
    const newCps = currentCps * (1 + newBonus);
    const cpsDelta = newCps - currentCps;

    // Ascending wipes all buildings and upgrades, not just the cookies on screen. The real
    // cost of ascending now is cookies-on-screen (forfeited) PLUS the cookies needed to
    // rebuild back to the current building levels post-reset, computed from owned
    // buildings' actual cumulative price - not a guessed constant.
    const rebuildCost = snapshot.buildings.reduce(
        (sum, b) => sum + cumulativeBuildingCost(b.basePrice, b.amount),
        0
    );
    const paybackSecs =
        cpsDelta > 0 ? (snapshot.cookies + rebuildCost) / cpsDelta : Number.POSITIVE_INFINITY;

    const thresholdHours = ASCEND_ROI_THRESHOLD_HOURS[snapshot.ascendRoiThresholdIndex] ?? 2;
    const thresholdSecs = thresholdHours * 3600;

    const meetsMinHC = newHC >= minHC;
    const meetsPayback = paybackSecs <= thresholdSecs;

    return {
        newHC,
        minHC,
        rebuildCost,
        paybackSecs,
        thresholdHours,
        thresholdSecs,
        meetsMinHC,
        meetsPayback,
        wouldAscend: meetsMinHC && meetsPayback,
    };
}

// Real gate: autoAscendToggle==true && autoAscendMode==3 (ROI mode selected in Options).
// An earlier version of this mod checked a preference key that didn't exist
// (`autoAscendROI`), so ROI ascend silently never fired no matter what was selected -
// fixed this session, confirmed live (verified it actually triggers Game.Ascend).
export function shouldAscendByROI(snapshot: GameSnapshot): boolean {
    if (!(snapshot.autoAscendToggle && snapshot.autoAscendMode === 3)) return false;
    if (snapshot.isAscending) return false;
    if (snapshot.comboAscendBlock && snapshot.cpsBonus >= snapshot.minCpSMult) return false;

    const stats = ascendROIStats(snapshot);
    return !!stats && stats.wouldAscend;
}
