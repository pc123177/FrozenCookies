import { ascendROIStats, shouldAscendByROI } from "../core/ascend";
import { buildGameSnapshot } from "./snapshot";

// Thin side-effecting wrapper around the pure decision in src/core/ascend.ts. This is the
// ONLY place in src/game/ that calls Game.Ascend - same trigger sequence the legacy
// autoCookie() dispatcher used (Game.ClosePrompt -> Game.Ascend(1) -> after 10s,
// Game.ClosePrompt -> Game.Reincarnate(1), to click through the ascend confirmation prompt).
export function ascendBotTick(): void {
    const snapshot = buildGameSnapshot();
    if (!shouldAscendByROI(snapshot)) return;

    const stats = ascendROIStats(snapshot);
    if (stats) {
        logEvent(
            "autoAscend",
            "ROI ascend triggered: " +
                stats.newHC +
                " new HCs, payback " +
                Math.round(stats.paybackSecs / 60) +
                "min (threshold " +
                stats.thresholdHours +
                "h)"
        );
    }
    Game.ClosePrompt();
    Game.Ascend(1);
    setTimeout(() => {
        Game.ClosePrompt();
        Game.Reincarnate(1);
    }, 10000);
}
