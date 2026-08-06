import { nextBuildingToLevel } from "../core/lumpLeveling";

// Reuses the same 101-lump reserve as Sugar Baking (src/legacy/fc_main.js autoSugarBakingGuard
// checks) so this bot never fights the existing guard over the same lump stash.
export function lumpLevelingBotTick(): void {
    if (FrozenCookies.autoLevelBuildings !== 1) return;

    const minLumpsReserve = FrozenCookies.sugarBakingGuard === 1 ? 101 : 0;

    // One level at a time: leveling up changes both the building's own next cost and which
    // building is cheapest, so re-scan live Game.ObjectsById state after each level-up.
    for (;;) {
        const buildings = Object.values(Game.ObjectsById).map((b) => ({
            name: b.name,
            amount: b.amount,
            level: b.level,
        }));
        const next = nextBuildingToLevel(buildings, Game.lumps, minLumpsReserve);
        if (!next) break;
        Game.Objects[next].levelUp();
    }
}
