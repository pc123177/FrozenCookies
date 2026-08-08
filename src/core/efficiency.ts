// Eficiência de compra: menor é melhor. Classifica edifícios/melhorias por quão rapidamente eles
// se pagam mais uma penalidade de custo-tempo (peso, calibrado em 1.15 - veja README).
//
// deltaCps já deve vir de uma simulação completa de Game.CalculateGains() (o delta real de CpS
// incluindo qualquer efeito de sinergia/multiplicador que a compra tem). NÃO adicione um
// multiplicador de sinergia separado por cima daqui - uma versão anterior deste mod fez isso e
// contou o mesmo valor de sinergia duas vezes (corrigido em FrozenCookies v1, veja fc_main.js
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
