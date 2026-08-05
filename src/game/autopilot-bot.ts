import { gameStage } from "../core/ascend";
import { stageSettings } from "../core/autopilot";
import { buildGameSnapshot } from "./snapshot";

let lastAppliedStage: string | null = null;

// Runs every FrozenCookies.frequency tick (same cadence as the rest of the bots, wired in
// src/main.ts). Detects the current stage and applies its settings table directly onto
// FrozenCookies.* - no Game.toReload, no manual preset click. Only re-applies when the
// detected stage actually changes, so it doesn't fight the player's own toggles every tick.
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
