import { nextHeavenlyUpgradeToBuy } from "../core/heavenlyUpgrades";

// For pool==="prestige" upgrades, Game.Upgrade.prototype.buy() does NOT check `.unlocked` -
// it only checks heavenlyChips>=price && !bought (confirmed by reading main.js live), and
// sets `.unlocked=1` as a SIDE EFFECT of buying. So `.unlocked` for a prestige upgrade is
// always just a mirror of `.bought` - never true beforehand, no matter how affordable or
// available the upgrade is. The real prerequisite gate the game itself uses is
// `canBePurchased`, computed by Game.BuildAscendTree() (only called when the Ascend/Legacy
// screen renders) from `.showIf()` and whether every entry in `.parents` is bought. This
// reimplements that exact check without depending on the UI-only BuildAscendTree call.
function canBePurchased(u: CCUpgrade): boolean {
    if (u.bought) return true;
    if (u.showIf && !u.showIf()) return false;
    return u.parents.every((p) => p === -1 || p.bought === 1);
}

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
                unlocked: canBePurchased(u),
                bought: u.bought === 1,
            }));
        const next = nextHeavenlyUpgradeToBuy(candidates, Game.heavenlyChips);
        if (!next) break;
        Game.Upgrades[next].buy();
    }
}
