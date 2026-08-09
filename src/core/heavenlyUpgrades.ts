export interface HeavenlyUpgradeInfo {
    name: string;
    price: number;
    unlocked: boolean;
    bought: boolean;
}

// Escolhe UMA melhoria celestial (do pool de prestígio) para comprar: a melhoria desbloqueada,
// não comprada e mais barata que seja acessível. Uma por vez, não um plano completo antecipadamente -
// comprar uma melhoria pode desbloquear outras (a árvore de melhorias celestiais tem pré-requisitos),
// então o chamador re-escaneia o estado ao vivo de Game.Upgrades entre compras em vez de confiar
// em um plano calculado antes de qualquer compra acontecer.
// Retorna null quando não há nada acessível restante para comprar.
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
