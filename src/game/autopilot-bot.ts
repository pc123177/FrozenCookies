import { gameStage } from "../core/ascend";
import { stageSettings } from "../core/autopilot";
import { buildGameSnapshot } from "./snapshot";

let lastAppliedStage: string | null = null;

// Executa a cada tick de FrozenCookies.frequency (mesmo cadência dos demais bots, conectado em
// src/main.ts). Detecta o estágio atual e aplica sua tabela de configurações diretamente em
// FrozenCookies.* - sem Game.toReload, sem clique manual de predefinição. Reaplicado apenas quando o
// estágio detectado realmente muda, evitando conflito com os toggles manuais do jogador a cada tick.
export function autopilotBotTick(): void {
    if (FrozenCookies.autopilot !== 1) return;

    const stage = gameStage(buildGameSnapshot());
    if (stage.stage === lastAppliedStage) return;

    const settings = stageSettings(stage.stage);
    const settingsRecord = settings as unknown as Record<string, unknown>;
    Object.keys(settingsRecord).forEach((key) => {
        (FrozenCookies as Record<string, unknown>)[key] = settingsRecord[key];
    });
    lastAppliedStage = stage.stage;
    logEvent("autopilot", "Stage detected: " + stage.label + " (" + stage.reason + ") - settings applied");
}
