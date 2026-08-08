import assert from "node:assert";
import { gameStage, ascendROIStats, shouldAscendByROI } from "./ascend.ts";
import type { GameSnapshot } from "./types.ts";

function baseSnapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
    return {
        prestige: 0,
        cookies: 0,
        cookiesEarned: 0,
        cookiesReset: 0,
        cookiesPs: 0,
        wrinklerValue: 0,
        chocolateValue: 0,
        heavenlyBonusMultiplier: 1,
        hcExponent: 3,
        buildings: [],
        autoAscendToggle: false,
        autoAscendMode: 0,
        ascendRoiThresholdIndex: 3,
        ascendRoiMinGrowthIndex: 0,
        comboAscendBlock: false,
        cpsBonus: 1,
        minCpSMult: 7,
        hasWizardTower: false,
        hasTemple: false,
        hasDragon: false,
        isAscending: false,
        ...overrides,
    };
}

// --- gameStage ---
assert.strictEqual(gameStage(baseSnapshot()).stage, "early");
assert.strictEqual(gameStage(baseSnapshot({ hasWizardTower: true })).stage, "mid");
assert.strictEqual(gameStage(baseSnapshot({ hasTemple: true })).stage, "mid");
assert.strictEqual(
    gameStage(baseSnapshot({ hasWizardTower: true, hasDragon: true })).stage,
    "late",
    "Dragon hatched tem prioridade sobre sinais de mid-game"
);

// --- ascendROIStats ---
assert.strictEqual(ascendROIStats(baseSnapshot({ prestige: 0 })), null, "prestígio < 1 -> null");

{
    // prestige=10, cookiesEarned escolhido para que resetPrestige = 100.5 exatamente (100.5^3 * 1e12) -
    // deliberadamente não é um cubo perfeito, para que floor(100.5)=100 seja robusto contra epsilon de
    // ponto flutuante (uma entrada cubo perfeito como 1e18 pode cair ligeiramente abaixo do limite e
    // arredondar para 99). newHC = 100 - 10 = 90
    const cookiesEarned = Math.pow(100.5, 3) * 1e12;
    const stats = ascendROIStats(
        baseSnapshot({
            prestige: 10,
            cookiesEarned,
            cookiesPs: 1e10,
            cpsBonus: 1,
            cookies: 1e10,
            ascendRoiThresholdIndex: 3, // <= 8h
        })
    );
    assert.ok(stats, "esperado stats não-nulo com prestige >= 1");
    assert.strictEqual(stats!.newHC, 90);
    assert.ok(stats!.meetsSanityFloor);
    assert.ok(stats!.rebuildCost === 0, "nenhum edifício possuído -> custo de reconstrução zero");
    // bonusPerHC=0.01, newBonus=0.9, cpsDelta = 1e10*0.9 = 9e9
    // paybackSecs = (1e10 + 0) / 9e9 ~= 1.111s
    assert.ok(Math.abs(stats!.paybackSecs - 10 / 9) < 1e-6);
    assert.ok(stats!.wouldAscend);
}

{
    // O custo de reconstrução inclui o custo cumulativo real dos edifícios possuídos, elevando o
    // retorno - esta é exatamente a correção que estava faltando antes desta sessão (o retorno
    // costumava considerar apenas os cookies na tela e ignorava o custo de reconstrução).
    const withBuildings = ascendROIStats(
        baseSnapshot({
            prestige: 10,
            cookiesEarned: 1e18,
            cookiesPs: 1e10,
            cookies: 1e10,
            buildings: [{ basePrice: 15, amount: 100 }],
        })
    );
    const withoutBuildings = ascendROIStats(
        baseSnapshot({
            prestige: 10,
            cookiesEarned: 1e18,
            cookiesPs: 1e10,
            cookies: 1e10,
            buildings: [],
        })
    );
    assert.ok(withBuildings!.rebuildCost > 0);
    assert.ok(
        withBuildings!.paybackSecs > withoutBuildings!.paybackSecs,
        "possuir edifícios deve elevar a estimativa de retorno (custo de reconstrução importa)"
    );
}

// --- shouldAscendByROI: gate real deve ser autoAscendToggle && autoAscendMode===3 ---
// Este é o bug exato corrigido nesta sessão: uma verificação antiga em uma preferência inexistente
// (`autoAscendROI`) fazia o ROI ascend nunca disparar independentemente do que estava selecionado
// em Opções. Confirmado ao vivo no jogo; esta verificação fixa o gate correto no lugar.
{
    const readySnapshot = baseSnapshot({
        prestige: 10,
        cookiesEarned: 1e18,
        cookiesPs: 1e10,
        cookies: 1e10,
        ascendRoiThresholdIndex: 3,
        autoAscendToggle: true,
        autoAscendMode: 3,
    });
    assert.ok(shouldAscendByROI(readySnapshot), "deve ascender quando gate + condições de ROI são satisfeitas");
    assert.ok(
        !shouldAscendByROI({ ...readySnapshot, autoAscendToggle: false }),
        "não deve ascender quando autoAscendToggle está desligado, mesmo que mode seja 3"
    );
    assert.ok(
        !shouldAscendByROI({ ...readySnapshot, autoAscendMode: 2 }),
        "não deve ascender quando um modo de ascensão diferente está selecionado"
    );
}

// --- ascendROIStats: piso de crescimento relativo (ascendRoiMinGrowthIndex) ---
// O piso escala com o progresso em vez de ser uma contagem fixa de HC: a mesma % de uma base maior
// de prestígio exige mais HC absoluto. Índice 3 = +10% (array é [0, 2%, 5%, 10%, 20%, 35%]).
{
    // prestige=1000, newHC=20 (crescimento de 2%) - abaixo do piso de 10%. Retorno rapidamente
    // satisfeito, isolando o gate de crescimento como o bloqueador.
    const smallGrowth = ascendROIStats(
        baseSnapshot({
            prestige: 1000,
            cookiesEarned: Math.pow(1020.5, 3) * 1e12,
            cookiesPs: 1e10,
            cookies: 1e10,
            cpsBonus: 1,
            ascendRoiThresholdIndex: 3, // <= 8h - trivialmente satisfeito, retorno é em segundos
            ascendRoiMinGrowthIndex: 3, // +10%
        })
    );
    assert.strictEqual(smallGrowth!.newHC, 20);
    assert.ok(smallGrowth!.meetsSanityFloor);
    assert.ok(smallGrowth!.meetsPayback, "retorno sozinho é satisfeito");
    assert.ok(!smallGrowth!.meetsGrowth, "crescimento de 2% está abaixo do piso de 10%");
    assert.ok(!smallGrowth!.wouldAscend, "gate de crescimento deve bloquear a ascensão mesmo quando os outros dois passam");
}

{
    // Mesma base de prestígio, newHC=150 (crescimento de 15%) - passa o piso de 10%.
    const bigGrowth = ascendROIStats(
        baseSnapshot({
            prestige: 1000,
            cookiesEarned: Math.pow(1150.5, 3) * 1e12,
            cookiesPs: 1e10,
            cookies: 1e10,
            cpsBonus: 1,
            ascendRoiThresholdIndex: 3,
            ascendRoiMinGrowthIndex: 3,
        })
    );
    assert.strictEqual(bigGrowth!.newHC, 150);
    assert.ok(bigGrowth!.meetsGrowth, "crescimento de 15% passa o piso de 10%");
    assert.ok(bigGrowth!.wouldAscend);
}

{
    // Mesmo cenário de pequeno crescimento acima, mas o piso está DESLIGADO (índice 0) - apenas
    // retorno + piso de sanidade fazem o gate da ascensão.
    const growthOff = ascendROIStats(
        baseSnapshot({
            prestige: 1000,
            cookiesEarned: Math.pow(1020.5, 3) * 1e12,
            cookiesPs: 1e10,
            cookies: 1e10,
            cpsBonus: 1,
            ascendRoiThresholdIndex: 3,
            ascendRoiMinGrowthIndex: 0,
        })
    );
    assert.ok(growthOff!.meetsGrowth, "gate de crescimento desligado -> sempre satisfeito");
    assert.ok(growthOff!.wouldAscend, "retorno + piso de sanidade sozinhos permitem a ascensão");
}

{
    // Prestígio pequeno (2), newHC=1 -> crescimento de 50%, passa trivialmente qualquer % de piso. O
    // piso de sanidade (newHC>=1) é a única coisa que bloquearia uma ascensão cedo pequena agora - não
    // há um "mínimo de N HC" plano separado para impô-la.
    const smallPrestige = ascendROIStats(
        baseSnapshot({
            prestige: 2,
            cookiesEarned: Math.pow(3.5, 3) * 1e12,
            cookiesPs: 1e10,
            cookies: 1e10,
            cpsBonus: 1,
            ascendRoiThresholdIndex: 3,
            ascendRoiMinGrowthIndex: 4, // +20%, ainda trivialmente passado pelo crescimento de 50%
        })
    );
    assert.strictEqual(smallPrestige!.newHC, 1);
    assert.ok(smallPrestige!.meetsSanityFloor);
    assert.ok(smallPrestige!.meetsGrowth, "1 HC em uma base de 2 é 50% de crescimento");
    assert.ok(smallPrestige!.wouldAscend);
}

// --- ascendROIStats: heavenlyBonusMultiplier impulsiona o ganho real de CpS por HC ---
// O bug que isto corrige: bonusPerHC costumava ser um 0.01/0.02 fixo baseado em "Persistent memory"
// (uma melhoria de velocidade de pesquisa sem qualquer relação com CpS). O jogo real só concede o
// bônus de 1%-por-HC quando as melhorias "Heavenly X" são compradas (Game.GetHeavenlyMultiplier()
// começa em 0) - sem nenhuma delas possuída, novo HC não dá ganho real de CpS, então ROI ascend
// nunca deve disparar.
{
    const noHeavenlyUpgrades = ascendROIStats(
        baseSnapshot({
            prestige: 10,
            cookiesEarned: 1e18,
            cookiesPs: 1e10,
            cookies: 1e10,
            heavenlyBonusMultiplier: 0,
            ascendRoiThresholdIndex: 3,
        })
    );
    assert.strictEqual(noHeavenlyUpgrades!.paybackSecs, Number.POSITIVE_INFINITY,
        "multiplicador celestial zero -> cpsDelta zero -> retorno nunca se recupera");
    assert.ok(!noHeavenlyUpgrades!.wouldAscend, "não deve ascender quando HC não dá ganho real de CpS");
}

console.log("ascend.selfcheck: OK");
