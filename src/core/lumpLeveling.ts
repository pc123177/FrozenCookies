export interface LevelableBuilding {
    name: string;
    amount: number;
    level: number;
}

// Game.Objects[x].levelUp() cost is level+1 lumps (confirmed live: Game.spendLump(me.level+1,
// ...)), no upper cap - level 10 just triggers a one-time achievement. Cheapest-first (lowest
// level owned building) makes the fewest-lumps-per-level-gained choice every tick.
export function nextBuildingToLevel(
    buildings: LevelableBuilding[],
    lumps: number,
    minLumpsReserve: number
): string | null {
    const available = lumps - minLumpsReserve;
    const candidates = buildings
        .filter((b) => b.amount > 0 && b.level + 1 <= available)
        .sort((a, b) => a.level - b.level);
    return candidates.length > 0 ? candidates[0].name : null;
}
