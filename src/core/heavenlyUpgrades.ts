export interface HeavenlyUpgradeInfo {
    name: string;
    price: number;
    unlocked: boolean;
    bought: boolean;
}

// Picks ONE heavenly (prestige-pool) upgrade to buy: cheapest unlocked, unbought, affordable
// upgrade. One at a time, not a full plan up front - buying an upgrade can unlock others
// (the heavenly upgrade tree has prerequisites), so the caller re-scans live Game.Upgrades
// state between purchases rather than trusting a plan computed before any buy happened.
// Returns null when nothing affordable is left to buy.
export function nextHeavenlyUpgradeToBuy(
    upgrades: HeavenlyUpgradeInfo[],
    heavenlyChips: number
): string | null {
    const affordable = upgrades.filter(
        (u) => u.unlocked && !u.bought && u.price <= heavenlyChips
    );
    if (affordable.length === 0) return null;
    affordable.sort((a, b) => a.price - b.price);
    return affordable[0].name;
}
