import type { GameSnapshot, GameStage, AscendRoiStats } from "./types";

// Detecta o estágio de jogo pelo estado real de desbloqueio (posse de construções), não por
// limiares de HC/cookies - esses variam muito por velocidade de jogo e não refletem o que
// realmente está disponível. Use amount > 0, não Game.Objects[...].unlocked ("visível na loja",
// não possuído) e não as globais de objeto de minigame (elas só são populadas após uma busca
// assíncrona de script que pode atrasar muito em relação à compra real - confirmado ao vivo:
// um save com 30+ Torres de Mago possuídas ainda lia EARLY GAME porque o script do minigame
// ainda não havia terminado de carregar).
export function gameStage(snapshot: GameSnapshot): GameStage {
    if (snapshot.hasDragon) {
        return {
            stage: "late",
            label: "LATE GAME",
            reason: "Dragon hatched (dragonLevel > 0)",
        };
    }
    if (snapshot.hasWizardTower || snapshot.hasTemple) {
        return {
            stage: "mid",
            label: "MID GAME",
            reason: "Wizard Tower/Temple unlocked, no Dragon yet",
        };
    }
    return {
        stage: "early",
        label: "EARLY GAME",
        reason: "Wizard Tower/Temple not unlocked yet",
    };
}

const ASCEND_ROI_THRESHOLD_HOURS = [1, 2, 4, 8];
// newHC como porcentagem do prestígio atual - escala naturalmente com o progresso (a mesma % de uma
// base maior exige mais HC absoluto), substituindo um piso plano/fixo de contagem de HC anterior
// que ficava estático independentemente de quão avançado era o turno.
const ASCEND_ROI_MIN_GROWTH_PERCENT = [0, 0.02, 0.05, 0.1, 0.2, 0.35];

// Custo cumulativo de cookies para construir um edifício de 0 a `amount` (mesma fórmula da
// curva de preço cumulativo do próprio jogo).
function cumulativeBuildingCost(basePrice: number, amount: number): number {
    const priceIncrease = 1.15;
    return (basePrice * (Math.pow(priceIncrease, amount) - 1)) / (priceIncrease - 1);
}

// Calcula os números de ascensão por ROI sem efeitos colaterais - mesma fonte da verdade
// tanto para a decisão de automação (shouldAscendByROI) quanto para qualquer exibição na UI.
// Retorna null somente quando não há prestígio suficiente para ascender.
export function ascendROIStats(snapshot: GameSnapshot): AscendRoiStats | null {
    if (snapshot.prestige < 1) return null;

    const cookiesBaked =
        snapshot.cookiesEarned +
        snapshot.cookiesReset +
        snapshot.wrinklerValue +
        snapshot.chocolateValue;
    // Game.HowMuchPrestige: prestige = (cookiesBaked / 1e12) ^ (1/Game.HCfactor). Lê o
    // expoente ao vivo do snapshot em vez de fixar 1/3 - Game.HCfactor é a constante exata
    // que o próprio jogo usa, e Orteil reequilibrou a matemática de prestígio entre versões
    // antes, então não se deve assumir que o valor atual é permanente.
    const resetPrestige = Math.pow(cookiesBaked / 1e12, 1 / snapshot.hcExponent);
    const newHC = Math.floor(resetPrestige) - snapshot.prestige;

    const minGrowthPercent = ASCEND_ROI_MIN_GROWTH_PERCENT[snapshot.ascendRoiMinGrowthIndex] ?? 0;
    // snapshot.prestige >= 1 sempre se mantém aqui (o guard prestige < 1 acima já retornou
    // null), então esta divisão é sempre bem definida.
    const meetsGrowth = newHC / snapshot.prestige >= minGrowthPercent;

    // CORREÇÃO: era `snapshot.hasPersistentMemory ? 0.02 : 0.01` - "Persistent memory" é uma
    // melhoria de velocidade de pesquisa (10x pesquisa), completamente sem relação com CpS. O
    // bônus real por HC é 0.01 * Game.heavenlyPower * Game.GetHeavenlyMultiplier() (confirmado
    // ao vivo em Game.CalculateGains) - GetHeavenlyMultiplier() começa em 0 sem nenhuma das 5
    // melhorias "Heavenly X" compradas, significando que HC cedo dava ganho real de CpS próximo
    // de zero independentemente do que este mod assumia, distorcendo muito todos os cálculos de
    // ROI/retorno antes desta correção.
    const bonusPerHC = 0.01 * snapshot.heavenlyBonusMultiplier;
    const newBonus = Math.max(0, newHC) * bonusPerHC;

    // baseCps = cookiesPs / cpsBonus (remove multiplicadores de buff para obter a taxa base à
    // qual os bônus de ascensão realmente se aplicam).
    const currentCps = snapshot.cpsBonus > 0 ? snapshot.cookiesPs / snapshot.cpsBonus : 0;
    const newCps = currentCps * (1 + newBonus);
    const cpsDelta = newCps - currentCps;

    // Ascender apaga todos os edifícios e melhorias, não apenas os cookies na tela. O custo
    // real de ascender agora é cookies-na-tela (perdidos) MAIS os cookies necessários para
    // reconstruir aos níveis atuais de edifícios pós-reset, calculado a partir do preço
    // cumulativo real dos edifícios possuídos - não uma constante estimada.
    const rebuildCost = snapshot.buildings.reduce(
        (sum, b) => sum + cumulativeBuildingCost(b.basePrice, b.amount),
        0
    );
    const paybackSecs =
        cpsDelta > 0 ? (snapshot.cookies + rebuildCost) / cpsDelta : Number.POSITIVE_INFINITY;

    const thresholdHours = ASCEND_ROI_THRESHOLD_HOURS[snapshot.ascendRoiThresholdIndex] ?? 2;
    const thresholdSecs = thresholdHours * 3600;

    // Piso de sanidade apenas, não configurável pelo usuário: nunca ascender por um ganho de
    // HC zero (ou negativo, não deveria acontecer mas seja seguro). O verdadeiro gate "vale a
    // pena" é meetsGrowth (escala com o progresso) + meetsPayback.
    const meetsSanityFloor = newHC >= 1;
    // Quando nenhuma melhoria "Heavenly X" é possuída, heavenlyBonusMultiplier é exatamente 0,
    // então cpsDelta é comprovadamente 0 não importa quanto newHC cresça - "retorno" não tem
    // sentido nesse estado e bloquearia toda ascensão futura para sempre (uma trava real: antes
    // da correção do bônus por HC, bonusPerHC era uma constante errada mas não-zero que deixava
    // o progresso continuar mesmo assim; a correção do valor certo, sozinha, introduziu esse
    // deadlock). Ignora o piso de retorno até a primeira melhoria celestial ser comprada -
    // crescimento + piso de sanidade decidem sozinhos, o que já é suficiente pra sair do estado
    // (o HC ganho é gasto pelo heavenlyUpgradeBotTick em src/game/heavenly-upgrade-bot.ts assim
    // que houver fichas, restaurando heavenlyBonusMultiplier > 0 pras próximas ascensões).
    const meetsPayback = snapshot.heavenlyBonusMultiplier === 0 || paybackSecs <= thresholdSecs;

    return {
        newHC,
        minGrowthPercent,
        rebuildCost,
        paybackSecs,
        thresholdHours,
        thresholdSecs,
        meetsSanityFloor,
        meetsGrowth,
        meetsPayback,
        wouldAscend: meetsSanityFloor && meetsGrowth && meetsPayback,
    };
}

// Gate real: autoAscendToggle==true && autoAscendMode==3 (modo ROI selecionado em Opções).
// Uma versão anterior deste mod verificava uma chave de preferência inexistente
// (`autoAscendROI`), então o ROI ascend silenciosamente nunca disparava independentemente
// do que estava selecionado - corrigido nesta sessão, confirmado ao vivo (verificado que
// realmente aciona Game.Ascend).
export function shouldAscendByROI(snapshot: GameSnapshot): boolean {
    if (!(snapshot.autoAscendToggle && snapshot.autoAscendMode === 3)) return false;
    if (snapshot.isAscending) return false;
    if (snapshot.comboAscendBlock && snapshot.cpsBonus >= snapshot.minCpSMult) return false;

    const stats = ascendROIStats(snapshot);
    return !!stats && stats.wouldAscend;
}
