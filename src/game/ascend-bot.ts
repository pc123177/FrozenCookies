import { ascendROIStats, shouldAscendByROI } from "../core/ascend";
import { buildGameSnapshot } from "./snapshot";

// Invólucro fino com efeitos colaterais em torno da decisão pura em src/core/ascend.ts. Este é o
// ÚNICO lugar em src/game/ que chama Game.Ascend - mesma sequência de disparo que o
// despachante autoCookie() legado usava (Game.ClosePrompt -> Game.Ascend(1) -> após 10s,
// Game.ClosePrompt -> Game.Reincarnate(1), para clicar no prompt de confirmação de ascensão).
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
