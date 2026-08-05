// Purchase efficiency: lower is better. Ranks buildings/upgrades by how quickly they pay
// for themselves plus a time-cost penalty (weight, calibrated at 1.15 - see README).
//
// deltaCps must already come from a full Game.CalculateGains() simulation (the real CpS
// delta including any synergy/multiplier effect the purchase has). Do NOT add a separate
// synergy multiplier on top of that here - an earlier version of this mod did, and it
// double-counted the same synergy value twice (fixed in FrozenCookies v1, see fc_main.js
// git history: "drop double-counted synergy boost").
export function purchaseEfficiency(
    price: number,
    deltaCps: number,
    currentCps: number,
    weight = 1.15
): number {
    if (deltaCps <= 0) return Number.POSITIVE_INFINITY;
    const costTimeCurrent = currentCps > 0 ? price / currentCps : Number.POSITIVE_INFINITY;
    const costTimeDelta = price / deltaCps;
    return weight * costTimeCurrent + costTimeDelta;
}
