export interface LevelableBuilding {
    name: string;
    amount: number;
    level: number;
}

// O custo de Game.Objects[x].levelUp() é level+1 açúcares (confirmado ao vivo: Game.spendLump(me.level+1,
// ...)), sem limite superior - nível 10 apenas aciona uma conquista única. Escolher o mais barato
// primeiro (edifício possuído com menor nível) faz a escolha de menos açúcares por nível ganho a
// cada tick.
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
