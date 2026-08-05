import { nextHeavenlyUpgradeToBuy } from "../core/heavenlyUpgrades";

// Heavenly chips are only earned by ascending, so this naturally does most of its work
// right after ascendBotTick() reincarnates - but it also polls on its own bot interval
// (see FCStart() in legacy/fc_main.js) to pick up chips left over from a manual ascend or
// from toggling this preference on mid-game with an existing HC stash.
export function heavenlyUpgradeBotTick(): void {
    if (FrozenCookies.autoBuyHeavenlyUpgrades !== 1) return;

    // One buy at a time: purchasing an upgrade can unlock others in the heavenly upgrade
    // tree, so re-scan live Game.Upgrades state after each purchase rather than buying off
    // a plan computed before anything changed.
    for (;;) {
        const candidates = Object.values(Game.UpgradesById)
            .filter((u) => u.pool === "prestige")
            .map((u) => ({
                name: u.name,
                price: u.getPrice(),
                unlocked: u.unlocked === 1,
                bought: u.bought === 1,
            }));
        const next = nextHeavenlyUpgradeToBuy(candidates, Game.heavenlyChips);
        if (!next) break;
        Game.Upgrades[next].buy();
    }
}
