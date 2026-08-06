import { ascendROIStats, gameStage, shouldAscendByROI } from "../core/ascend";
import { purchaseEfficiency } from "../core/efficiency";
import type { AscendRoiStats, GameStage } from "../core/types";
import { ascendBotTick } from "./ascend-bot";
import { autopilotBotTick } from "./autopilot-bot";
import { heavenlyUpgradeBotTick } from "./heavenly-upgrade-bot";
import { lumpLevelingBotTick } from "./lump-leveling-bot";
import { buildGameSnapshot } from "./snapshot";

// Everything legacy/*.js (not yet migrated) needs to keep calling as a plain global
// function, unaware the implementation moved into typed src/core/ + src/game/ modules. This
// is the ONE file responsible for that bridge - as each legacy file migrates, its entry here
// goes away and callers switch to importing the core/game module directly.
declare global {
    interface Window {
        ascendROIStats: () => AscendRoiStats | null;
        gameStage: () => GameStage;
        shouldAscendByROI: () => boolean;
        purchaseEfficiency: (
            price: number,
            deltaCps: number,
            baseDeltaCps: number,
            currentCps: number,
            purchaseContext?: unknown
        ) => number;
        ascendBotTick: () => void;
        autopilotBotTick: () => void;
        heavenlyUpgradeBotTick: () => void;
        lumpLevelingBotTick: () => void;
    }
}

export function installLegacyGlobals(): void {
    window.ascendROIStats = () => ascendROIStats(buildGameSnapshot());
    window.gameStage = () => gameStage(buildGameSnapshot());
    window.shouldAscendByROI = () => shouldAscendByROI(buildGameSnapshot());
    // baseDeltaCps/purchaseContext were only ever used by the old synergyBoost double-count
    // (removed this session) - kept as accepted-but-ignored params so legacy call sites in
    // fc_main.js's buildingStats()/upgradeStats() don't need to change their call shape yet.
    window.purchaseEfficiency = (price, deltaCps, _baseDeltaCps, currentCps) =>
        purchaseEfficiency(price, deltaCps, currentCps);
    window.ascendBotTick = ascendBotTick;
    window.autopilotBotTick = autopilotBotTick;
    window.heavenlyUpgradeBotTick = heavenlyUpgradeBotTick;
    window.lumpLevelingBotTick = lumpLevelingBotTick;
}
