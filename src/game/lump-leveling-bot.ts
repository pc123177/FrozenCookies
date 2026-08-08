import { nextBuildingToLevel } from "../core/lumpLeveling";

// Reutiliza a mesma reserva de 101 caroços do Sugar Baking (verificação de autoSugarBakingGuard
// em src/legacy/fc_main.js) para que este bot nunca dispute o mesmo estoque de caroços com o guarda existente.
export function lumpLevelingBotTick(): void {
    if (FrozenCookies.autoLevelBuildings !== 1) return;

    const minLumpsReserve = FrozenCookies.sugarBakingGuard === 1 ? 101 : 0;

    // Um nível por vez: subir de nível muda tanto o próximo custo do próprio edifício quanto
    // qual edifício é o mais barato, então relê o estado atual de Game.ObjectsById após cada subida.
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
