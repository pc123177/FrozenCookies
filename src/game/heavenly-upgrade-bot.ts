import { nextHeavenlyUpgradeToBuy } from "../core/heavenlyUpgrades";

// Para upgrades com pool==="prestige", Game.Upgrade.prototype.buy() NÃO verifica `.unlocked` -
// apenas verifica heavenlyChips>=price && !bought (confirmado pela leitura do main.js ao vivo), e
// define `.unlocked=1` como EFEITO COLATERAL da compra. Portanto, `.unlocked` para um upgrade de
// prestígio é sempre apenas espelho de `.bought` - nunca verdadeiro antes da compra, independente
// do custo ou disponibilidade. O verdadeiro portão de pré-requisito que o jogo usa é
// `canBePurchased`, computado por Game.BuildAscendTree() (chamado apenas quando a tela de
// Ascensão/Legado renderiza) a partir de `.showIf()` e de se cada entrada em `.parents` foi comprada.
// Esta função reimplementa essa verificação exata sem depender da chamada a BuildAscendTree, que é exclusiva da UI.
function canBePurchased(u: CCUpgrade): boolean {
    if (u.bought) return true;
    if (u.showIf && !u.showIf()) return false;
    return u.parents.every((p) => p === -1 || p.bought === 1);
}

// Chips celestiais só são ganhos ao ascender, então este bot faz a maior parte do seu trabalho
// logo após ascendBotTick() reencarnar - mas também verifica periodicamente em seu próprio
// intervalo de bot (veja FCStart() em legacy/fc_main.js) para capturar chips restantes de uma
// ascensão manual ou de ativar esta preferência no meio do jogo com um estoque de HCs existente.
export function heavenlyUpgradeBotTick(): void {
    if (FrozenCookies.autoBuyHeavenlyUpgrades !== 1) return;

    // Uma compra por vez: adquirir um upgrade pode desbloquear outros na árvore de upgrades
    // celestiais, então relê o estado atual de Game.Upgrades após cada compra, em vez de
    // comprar com base num plano calculado antes de qualquer mudança.
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
