import { ascendROIStats, gameStage, shouldAscendByROI } from "../core/ascend";
import { purchaseEfficiency } from "../core/efficiency";
import type { AscendRoiStats, GameStage } from "../core/types";
import { ascendBotTick } from "./ascend-bot";
import { autopilotBotTick } from "./autopilot-bot";
import { heavenlyUpgradeBotTick } from "./heavenly-upgrade-bot";
import { lumpLevelingBotTick } from "./lump-leveling-bot";
import { buildGameSnapshot } from "./snapshot";

// Tudo que legacy/*.js (ainda não migrado) precisa continuar chamando como função global simples,
// sem saber que a implementação foi movida para os módulos tipados em src/core/ + src/game/.
// Este é o ÚNICO arquivo responsável por essa ponte - à medida que cada arquivo legado migra,
// sua entrada aqui é removida e os chamadores passam a importar o módulo core/game diretamente.
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
    // baseDeltaCps/purchaseContext só eram usados pela duplicação antiga de synergyBoost
    // (removida nesta sessão) - mantidos como parâmetros aceitos mas ignorados para que os
    // chamadores legados em buildingStats()/upgradeStats() de fc_main.js não precisem mudar
    // sua assinatura de chamada ainda.
    window.purchaseEfficiency = (price, deltaCps, _baseDeltaCps, currentCps) =>
        purchaseEfficiency(price, deltaCps, currentCps);
    window.ascendBotTick = ascendBotTick;
    window.autopilotBotTick = autopilotBotTick;
    window.heavenlyUpgradeBotTick = heavenlyUpgradeBotTick;
    window.lumpLevelingBotTick = lumpLevelingBotTick;
}
