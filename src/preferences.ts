// Port tipado de legacy/fc_preferences.js - copiado verbatim (não digitado manualmente,
// para evitar erros de transcrição nas ~50 entradas de configuração) e tipado na parte
// superior. O conteúdo é dado, não lógica; o valor de "tipado" aqui é detectar entradas
// malformadas (faltando `default`, formato errado de `display`) em tempo de build em vez
// de em tempo de renderização do menu em um jogo ao vivo.
export interface PreferenceEntry {
    hint: string;
    display?: string[];
    default?: number;
    extras?: string;
}

export type PreferenceValues = Record<string, PreferenceEntry>;

export const preferenceValues: PreferenceValues = {
    // opções de clique
    clickingOptions: { hint: "Auto clique:" },
    autoClick: {
        hint: "Clicar automaticamente no cookie grande e definir velocidade.",
        display: ["Autoclick DESLIGADO", "Autoclick LIGADO"],
        default: 0,
        extras: '<a class="option" id="cookieClickSpeed" onclick="updateSpeed(\'cookieClickSpeed\');">${cookieClickSpeed} cliques/seg</a>',
    },
    autoFrenzy: {
        hint: "Clicar automaticamente durante frenzies de clique.",
        display: ["Autofrenzy DESLIGADO", "Autofrenzy LIGADO"],
        default: 0,
        extras: '<a class="option" id="frenzyClickSpeed" onclick="updateSpeed(\'frenzyClickSpeed\');">${frenzyClickSpeed} cliques/seg</a>',
    },
    autoGC: {
        hint: "Clicar automaticamente em cookies dourados/irados.",
        display: ["Autoclick GC DESLIGADO", "Autoclick GC LIGADO"],
        default: 0,
    },
    autoReindeer: {
        hint: "Clicar automaticamente em renas.",
        display: ["Autoclick Rena DESLIGADO", "Autoclick Rena LIGADO"],
        default: 0,
    },
    autoFortune: {
        hint: "Clicar automaticamente em fortunas no ticker de notícias.",
        display: ["Auto Fortuna DESLIGADO", "Auto Fortuna LIGADO"],
        default: 0,
    },

    // opções de compra automática
    buyingOptions: { hint: "Compra automática:" },
    autoBuy: {
        hint: "Comprar automaticamente o edifício/upgrade mais eficiente.",
        display: ["Compra Auto DESLIGADA", "Compra Auto LIGADA"],
        default: 0,
    },
    otherUpgrades: {
        hint: "Comprar upgrades que não aumentam o CpS diretamente.",
        display: ["Outros Upgrades DESLIGADO", "Outros Upgrades LIGADO"],
        default: 1,
    },
    autoBlacklistOff: {
        hint: "Desativar lista negra quando a meta for atingida.",
        display: ["Auto Lista Negra DESLIGADA", "Auto Lista Negra LIGADA"],
        default: 0,
    },
    blacklist: {
        hint: "Lista negra: Restringir compras para conquistas ou desafios.",
        display: [
            "Lista Negra DESLIGADA",
            "Modo Lista Negra SPEEDRUN",
            "Modo Lista Negra HARDCORE",
            "Modo Lista Negra GRANDMAPOCALYPSE",
            "Modo Lista Negra SEM EDIFÍCIOS",
        ],
        default: 0,
    },
    mineLimit: {
        hint: "Limitar minas para combos com Godzamok.",
        display: ["Limite de Minas DESLIGADO", "Limite de Minas LIGADO"],
        default: 0,
        extras: '<a class="option" id="mineMax" onclick="updateMineMax(\'mineMax\');">${mineMax} Minas</a>',
    },
    factoryLimit: {
        hint: "Limitar fábricas para combos com Godzamok.",
        display: ["Limite de Fábricas DESLIGADO", "Limite de Fábricas LIGADO"],
        default: 0,
        extras: '<a class="option" id="factoryMax" onclick="updateFactoryMax(\'factoryMax\');">${factoryMax} Fábricas</a>',
    },
    pastemode: {
        hint: "Comprar a opção menos eficiente (⚠️ não recomendado).",
        display: ["Modo Pasta DESLIGADO", "Modo Pasta LIGADO"],
        default: 0,
    },

    // outras opções de automação
    autoOtherOptions: { hint: "Outra automação:" },
    autoBulk: {
        hint: "Definir compra em massa após ascensão.",
        display: ["Compra em Massa Auto DESLIGADA", "Compra em Massa Auto x10", "Compra em Massa Auto x100"],
        default: 0,
    },
    autoBuyAll: {
        hint: "Comprar automaticamente todos os upgrades até ganhar um chip.",
        display: ["Comprar Todos Upgrades Auto DESLIGADO", "Comprar Todos Upgrades Auto LIGADO"],
        default: 0,
    },
    autoAscendToggle: {
        hint: "Ascender automaticamente (⚠️ pula tela de upgrades).",
        display: ["Ascensão Auto DESLIGADA", "Ascensão Auto LIGADA"],
        default: 0,
    },
    // SMART ASCEND: adicionado modo 3 (baseado em ROI) à lista de exibição.
    // Os modos originais (quantidade fixa, prestígio dobrado) são mantidos sem alterações.
    // O modo 3 calcula o tempo de retorno: a ascensão é acionada apenas quando o CpS extra
    // de novos HCs recuperaria os cookies na tela dentro do limite configurado
    // (veja ascendROIThreshold e ascendROIMinGrowth abaixo).
    autoAscend: {
        hint: "Escolher método de ascensão automática.",
        display: [
            "Ascensão Auto DESLIGADA",
            "Ascensão Auto em QUANTIDADE DEFINIDA",
            "Ascensão Auto quando prestígio for DOBRADO",
            "Ascensão Auto por ROI (inteligente ✓)",
        ],
        default: 0,
        extras: '<a class="option" id="chipsToAscend" onclick="updateAscendAmount(\'HCAscendAmount\');">${HCAscendAmount} fichas celestiais</a>',
    },
    // SMART ASCEND: limite de retorno para modo ROI.
    // Com que rapidez os novos HCs devem recuperar os cookies na tela?
    // Menor = ascender com menos frequência, mas apenas quando claramente vale a pena.
    // Maior = ascender mais agressivamente mesmo para ganhos marginais.
    ascendROIThreshold: {
        hint: "Modo ROI: ascender apenas quando o tempo de retorno estiver abaixo deste valor. Menor = mais seletivo.",
        display: [
            "Retorno ROI ≤ 1 hora",
            "Retorno ROI ≤ 2 horas",
            "Retorno ROI ≤ 4 horas",
            "Retorno ROI ≤ 8 horas",
        ],
        default: 1,
    },
    // SMART ASCEND: piso de crescimento relativo. Substitui um antigo dropdown "min N novos HCs"
    // que permanecia fixo independentemente de quão longe na run você estava (5 HC significava
    // muito no prestígio 10, não significava nada no prestígio 1000). Uma % do prestígio atual
    // escala com o progresso.
    ascendROIMinGrowth: {
        hint: "Modo ROI: crescimento mínimo em % de HC em relação ao total atual antes de ascender.",
        display: [
            "Sem crescimento mínimo",
            "+2% de crescimento",
            "+5% de crescimento",
            "+10% de crescimento",
            "+20% de crescimento",
            "+35% de crescimento",
        ],
        default: 0,
    },
    comboAscend: {
        hint: "Bloquear ascensão automática quando houver X Frenzy ou mais.",
        display: ["Ascender durante combo DESLIGADO", "Ascender durante combo LIGADO"],
        default: 0,
        extras: '<a class="option" id="minCpSMult" onclick="updateCpSMultMin(\'minCpSMult\');">x${minCpSMult} Frenzy mínimo</a>',
    },
    autoWrinkler: {
        hint: "Estourar enrugadores automaticamente.",
        display: [
            "Estourar Enrugadores Auto DESLIGADO",
            "Estourar Enrugadores Auto EFICIENTEMENTE",
            "Estourar Enrugadores Auto INSTANTANEAMENTE",
        ],
        default: 0,
    },
    shinyPop: {
        hint: "Proteger enrugadores brilhantes (⚠️ desativa o Juramento dos Anciãos).",
        display: ["Salvar Enrugadores Brilhantes DESLIGADO", "Salvar Enrugadores Brilhantes LIGADO"],
        default: 0,
    },
    autoSL: {
        hint: "Colher torrões de açúcar automaticamente (opcionalmente com Rigidel).",
        display: [
            "Colheita Auto SL DESLIGADA",
            "Colheita Auto SL LIGADA",
            "Colheita Auto SL LIGADA + AUTO RIGIDEL",
        ],
        default: 0,
    },
    dragonsCurve: {
        hint: "Ativar Dragon's Curve (e Reality Bending) para colheita de torrões.",
        display: [
            "Auto-Dragon's Curve DESLIGADO",
            "Auto-Dragon's Curve LIGADO",
            "Auto-Dragon's Curve LIGADO + REALITY BENDING",
        ],
        default: 0,
    },
    sugarBakingGuard: {
        hint: "Não gastar torrões abaixo de 101 (manter bônus de Sugar Baking).",
        display: ["Guarda Sugar Baking DESLIGADO", "Guarda Sugar Baking LIGADO"],
        default: 0,
    },
    autoLevelBuildings: {
        hint: "Gastar torrões de açúcar automaticamente para nivelar edifícios possuídos (mais barato primeiro).",
        display: ["Nivelamento Auto de Edifícios DESLIGADO", "Nivelamento Auto de Edifícios LIGADO"],
        default: 1,
    },
    autoGS: {
        hint: "Alternar Golden Switch automaticamente para buffs de clique.",
        display: ["Auto-Golden Switch DESLIGADO", "Auto-Golden Switch LIGADO"],
        default: 0,
    },
    autoGodzamok: {
        hint: "Vender minas/fábricas automaticamente para Godzamok durante buffs de clique.",
        display: ["Auto-Godzamok DESLIGADO", "Auto-Godzamok LIGADO"],
        default: 0,
    },
    autoBank: {
        hint: "Atualizar escritório do banco automaticamente.",
        display: ["Auto-Banco DESLIGADO", "Auto-Banco LIGADO"],
        default: 0,
    },
    autoBroker: {
        hint: "Contratar corretores de ações automaticamente.",
        display: ["Auto-Corretor DESLIGADO", "Auto-Corretor LIGADO"],
        default: 0,
    },
    autoLoan: {
        hint: "Fazer empréstimos automaticamente durante frenzies de clique.",
        display: ["Auto-Empréstimos DESLIGADO", "Fazer empréstimos 1 e 2", "Fazer todos os 3 empréstimos"],
        default: 0,
        extras: '<a class="option" id="minLoanMult" onclick="updateLoanMultMin(\'minLoanMult\');">x${minLoanMult} Frenzy mínimo</a>',
    },

    // opções do Panteão
    worshipOptions: { hint: "Panteão:" },
    autoWorshipToggle: {
        hint: "Encaixar deuses selecionados automaticamente (não pode selecionar o mesmo deus duas vezes).",
        display: ["Auto Panteão DESLIGADO", "Auto Panteão LIGADO"],
        default: 0,
    },
    autoWorship0: {
        hint: "Encaixar deus automaticamente no slot DIAMANTE.",
        display: ["Nenhum deus","Vomitrax","Godzamok","Cyclius","Selebrak","Dotjeiess","Muridal","Jeremy","Mokalsium","Skruuia","Rigidel"],
        default: 0,
    },
    autoWorship1: {
        hint: "Encaixar deus automaticamente no slot RUBI.",
        display: ["Nenhum deus","Vomitrax","Godzamok","Cyclius","Selebrak","Dotjeiess","Muridal","Jeremy","Mokalsium","Skruuia","Rigidel"],
        default: 0,
    },
    autoWorship2: {
        hint: "Encaixar deus automaticamente no slot JADE.",
        display: ["Nenhum deus","Vomitrax","Godzamok","Cyclius","Selebrak","Dotjeiess","Muridal","Jeremy","Mokalsium","Skruuia","Rigidel"],
        default: 0,
    },
    autoCyclius: {
        hint: "Trocar Cyclius automaticamente para CpS máximo (defina os deuses acima, não use Cyclius).",
        display: [
            "Auto-Cyclius DESLIGADO",
            "Auto-Cyclius em RUBI e JADE",
            "Auto-Cyclius em todos os slots",
        ],
        default: 0,
    },

    // opções de Feitiços
    spellOptions: { hint: "Grimório:" },
    towerLimit: {
        hint: "Parar de comprar Torres de Feiticeiro no mana máximo definido.",
        display: ["Limite de Torres de Feiticeiro DESLIGADO", "Limite de Torres de Feiticeiro LIGADO"],
        default: 0,
        extras: '<a class="option" id="manaMax" onclick="updateManaMax(\'manaMax\');">${manaMax} Mana máximo</a>',
    },
    autoCasting: {
        hint: "Lançar feitiço selecionado automaticamente quando o mana estiver cheio.",
        display: [
            "Auto Lançar DESLIGADO",
            "Auto Lançar CONJURE BAKED GOODS",
            "Auto Lançar FORCE THE HAND OF FATE (simples)",
            "Auto Lançar FORCE THE HAND OF FATE (inteligente)",
            "Auto Lançar FTHOF (somente Especiais de Clique e Edifícios)",
            "Auto Lançar SPONTANEOUS EDIFICE",
            "Auto Lançar HAGGLER'S CHARM",
        ],
        default: 0,
        extras: '<a class="option" id="minCpSMult" onclick="updateCpSMultMin(\'minCpSMult\');">x${minCpSMult} Frenzy mínimo</a>',
    },
    spellNotes: { hint: "Apenas um combo pode estar ativo por vez. Veja o readme." },
    autoFTHOFCombo: {
        hint: "Lançar combos FTHOF duplos automaticamente (precisa de mana suficiente).",
        display: ["Lançamento Duplo FTHOF DESLIGADO", "Lançamento Duplo FTHOF LIGADO"],
        default: 0,
    },
    auto100ConsistencyCombo: {
        hint: "⚠️ EXPERIMENTAL: Lançar 100% Consistency Combo automaticamente.",
        display: [
            "Auto Lançar 100% Consistency Combo DESLIGADO",
            "Auto Lançar 100% Consistency Combo LIGADO",
        ],
        default: 0,
    },
    autoSugarFrenzy: {
        hint: "Comprar Sugar Frenzy automaticamente durante o primeiro combo de X Frenzy.",
        display: [
            "Auto Sugar Frenzy DESLIGADO",
            "ASF para 100% Consistency Combo",
            "ASF também para Combo de Lançamento Duplo",
        ],
        default: 0,
        extras: '<a class="option" id="minASFMult" onclick="updateASFMultMin(\'minASFMult\');">x${minASFMult} Frenzy mínimo</a>',
    },
    autoSweet: {
        hint: "⚠️ EXPERIMENTAL: Ascender até o feitiço 'Sweet' aparecer. Sem desligamento manual.",
        display: ["Auto Sweet DESLIGADO", "Auto Sweet LIGADO"],
        default: 0,
    },

    // opções do Dragão
    dragonOptions: { hint: "Dragão:" },
    autoDragon: {
        hint: "Atualizar dragão automaticamente.",
        display: ["Atualização do Dragão DESLIGADA", "Atualização do Dragão LIGADA"],
        default: 0,
    },
    petDragon: {
        hint: "Acariciar dragão automaticamente para drops.",
        display: ["Acariciar Dragão DESLIGADO", "Acariciar Dragão LIGADO"],
        default: 0,
    },
    autoDragonToggle: {
        hint: "Definir auras do dragão automaticamente.",
        display: ["Auras do Dragão DESLIGADAS", "Auras do Dragão LIGADAS"],
        default: 0,
    },
    dragonNotes: { hint: "Defina as auras desejadas. Não pode definir a mesma aura duas vezes." },
    autoDragonAura0: {
        hint: "Definir automaticamente a PRIMEIRA aura do dragão.",
        display: [
            "Sem Aura","Breath of Milk","Dragon Cursor","Elder Battalion","Reaper of Fields",
            "Earth Shatterer","Master of the Armory","Fierce Hoarder","Dragon God","Arcane Aura",
            "Dragonflight","Ancestral Metamorphosis","Unholy Dominion","Epoch Manipulator",
            "Mind Over Matter","Radiant Appetite","Dragon's Fortune","Dragon's Curve",
            "Reality Bending","Dragon Orbs","Supreme Intellect","Dragon Guts",
        ],
        default: 0,
    },
    autoDragonAura1: {
        hint: "Definir automaticamente a SEGUNDA aura do dragão.",
        display: [
            "Sem Aura","Breath of Milk","Dragon Cursor","Elder Battalion","Reaper of Fields",
            "Earth Shatterer","Master of the Armory","Fierce Hoarder","Dragon God","Arcane Aura",
            "Dragonflight","Ancestral Metamorphosis","Unholy Dominion","Epoch Manipulator",
            "Mind Over Matter","Radiant Appetite","Dragon's Fortune","Dragon's Curve",
            "Reality Bending","Dragon Orbs","Supreme Intellect","Dragon Guts",
        ],
        default: 0,
    },
    autoDragonOrbs: {
        hint: "Vender Yous automaticamente para GC se a aura Dragon Orbs estiver ativa e Godzamok não.",
        display: ["Auto-Dragon Orbs DESLIGADO", "Auto-Dragon Orbs LIGADO"],
        default: 0,
    },
    orbLimit: {
        hint: "Limitar Yous para combos com Dragon Orbs.",
        display: ["Limite de Yous DESLIGADO", "Limite de Yous LIGADO"],
        default: 0,
        extras: '<a class="option" id="orbMax" onclick="updateOrbMax(\'orbMax\');">${orbMax} Yous</a>',
    },

    // opções de Temporada
    seasonOptions: { hint: "Temporada:" },
    defaultSeasonToggle: {
        hint: "Mudar automaticamente para a temporada selecionada se não houver upgrades necessários.",
        display: ["Compra Auto de Temporadas DESLIGADA", "Compra Auto de Temporadas LIGADA"],
        default: 0,
    },
    defaultSeason: {
        hint: "Selecionar temporada padrão.",
        display: [
            "Temporada Padrão DESLIGADA",
            "Temporada Padrão DIA DE NEGÓCIOS",
            "Temporada Padrão NATAL",
            "Temporada Padrão PÁSCOA",
            "Temporada Padrão HALLOWEEN",
            "Temporada Padrão DIA DOS NAMORADOS",
        ],
        default: 0,
    },
    freeSeason: {
        hint: "Permanecer na temporada base gratuita se não houver upgrades necessários.",
        display: [
            "Temporada Gratuita DESLIGADA",
            "Temporada Gratuita para NATAL e DIA DE NEGÓCIOS",
            "Temporada Gratuita para TODAS",
        ],
        default: 1,
    },
    autoEaster: {
        hint: "Mudar para Easter durante Cookie Storm se ovos estiverem faltando.",
        display: ["Troca para Easter Auto DESLIGADA", "Troca para Easter Auto LIGADA"],
        default: 0,
    },
    autoHalloween: {
        hint: "Mudar para Halloween se houver enrugadores presentes e cookies faltando.",
        display: ["Troca para Halloween Auto DESLIGADA", "Troca para Halloween Auto LIGADA"],
        default: 0,
    },

    // opções do Banco
    bankOptions: { hint: "Banco: (atrasa a compra automática até o banco estar cheio)" },
    holdManBank: {
        hint: "Banco mínimo manual (minutos de CpS base)",
        display: ["Banco Manual DESLIGADO", "Banco Manual LIGADO"],
        default: 0,
        extras: '<a class="option" id="manBankMins" onclick="updateManBank(\'manBankMins\');">${manBankMins} Minutos</a>',
    },
    holdSEBank: {
        hint: "Manter banco para Spontaneous Edifice.",
        display: ["Banco SE DESLIGADO", "Banco SE LIGADO"],
        default: 0,
    },
    setHarvestBankPlant: {
        hint: "Manter banco para colher a planta selecionada.",
        display: [
            "Banco de Colheita DESLIGADO","Banco de Colheita BAKEBERRY","Banco de Colheita CHOCOROOT",
            "Banco de Colheita CHOCOROOT BRANCO","Banco de Colheita QUEENBEET",
            "Banco de Colheita DUKETATER","Banco de Colheita CRUMBSPORE","Banco de Colheita DOUGHSHROOM",
        ],
        default: 0,
    },
    setHarvestBankType: {
        hint: "Aumentar banco para colheita de planta durante buffs de CpS.",
        display: [
            "Colheita durante NENHUM MULTIPLICADOR de CpS",
            "Colheita durante FRENZY",
            "Colheita durante ESPECIAL DE EDIFÍCIOS",
            "Colheita durante FRENZY + ESPECIAL DE EDIFÍCIOS",
        ],
        default: 0,
        extras: '<a class="option" id="maxSpecials" onclick="updateMaxSpecials(\'maxSpecials\');">${maxSpecials} especiais de edifícios</a>',
    },

    // Outras opções
    otherOptions: { hint: "Outro:" },
    FCshortcuts: {
        hint: "Ativar atalhos de teclado (veja o readme).",
        display: ["Atalhos DESLIGADOS", "Atalhos LIGADOS"],
        default: 1,
    },
    simulatedGCPercent: {
        hint: "Assumir % de GCs clicados para eficiência (100% recomendado).",
        display: ["GC clicado 0%", "GC clicado 100%"],
        default: 1,
    },

    // opções de Exibição
    displayOptions: { hint: "Exibição:" },
    showMissedCookies: {
        hint: "Mostrar cookies dourados perdidos no painel de informações.",
        display: ["Mostrar GCs Perdidos DESLIGADO", "Mostrar GCs Perdidos LIGADO"],
        default: 0,
    },
    numberDisplay: {
        hint: "Alterar estilo de formatação de números.",
        display: [
            "Exibição de Números BRUTO",
            "Exibição de Números COMPLETO (milhão, bilhão)",
            "Exibição de Números SIGLAS (M, B)",
            "Exibição de Números PREFIXOS SI (M, G, T)",
            "Exibição de Números CIENTÍFICO (6.3e12)",
        ],
        default: 1,
    },
    fancyui: {
        hint: "Estilo da caixa de informações (texto, roda ou ambos).",
        display: ["Caixa de Info DESLIGADA","Caixa de Info SOMENTE TEXTO","Caixa de Info SOMENTE RODA","Caixa de Info RODA & TEXTO"],
        default: 0,
    },
    logging: {
        hint: "Registrar ações no console.",
        display: ["Log DESLIGADO", "Log LIGADO"],
        default: 1,
    },
    purchaseLog: {
        hint: "Registrar todas as compras automáticas.",
        display: ["Log de Compras DESLIGADO", "Log de Compras LIGADO"],
        default: 0,
    },

    slowOptions: { hint: "Atenção: Estas opções podem diminuir a velocidade do jogo." },
    fpsModifier: {
        hint: "Definir taxa de quadros do jogo (padrão 30).",
        display: [
            "Taxa de Quadros 15 fps","Taxa de Quadros 24 fps","Taxa de Quadros 30 fps","Taxa de Quadros 48 fps",
            "Taxa de Quadros 60 fps","Taxa de Quadros 72 fps","Taxa de Quadros 88 fps","Taxa de Quadros 100 fps",
            "Taxa de Quadros 120 fps","Taxa de Quadros 144 fps","Taxa de Quadros 200 fps","Taxa de Quadros 240 fps",
            "Taxa de Quadros 300 fps","Taxa de Quadros 5 fps","Taxa de Quadros 10 fps",
        ],
        default: 2,
    },
    trackStats: {
        hint: "Rastrear CpS/HC para gráficos (pode diminuir a velocidade do jogo).",
        display: [
            "Rastreamento DESLIGADO","Rastreamento A CADA 60s","Rastreamento A CADA 30m","Rastreamento A CADA 1h",
            "Rastreamento A CADA 24h","Rastreamento EM UPGRADES","Rastreamento TEMPORIZAÇÃO INTELIGENTE",
        ],
        default: 0,
        extras: '<a class="option" id="viewStats" onclick="viewStatGraphs();">Ver Gráficos de Estatísticas</a>',
    },
    recommendedSettings: {
        hint: "Aplicar todas as opções recomendadas (⚠️ recarrega o jogo instantaneamente).",
        display: ["Recomendado DESLIGADO", "Recomendado LIGADO"],
        default: 0,
    },
    // v2: substitui os 3 toggles manuais presetEarlyGame/presetMidGame/presetLateGame - o
    // piloto automático detecta a fase por conta própria (src/core/ascend.ts gameStage()) e
    // aplica a tabela de configurações correspondente (src/core/autopilot.ts) continuamente,
    // sem necessidade de recarga.
    autopilot: {
        hint: "O bot detecta a fase do jogo e se configura automaticamente (sem predefinições manuais).",
        display: ["Piloto Automático DESLIGADO", "Piloto Automático LIGADO"],
        default: 0,
    },
    // v2: após cada ascensão, gastar fichas celestiais em upgrades de prestígio desbloqueados
    // (mais baratos primeiro) automaticamente - veja src/core/heavenlyUpgrades.ts.
    autoBuyHeavenlyUpgrades: {
        hint: "Comprar automaticamente upgrades celestiais desbloqueados com HC após ascender.",
        display: ["Comprar Auto Upgrades Celestiais DESLIGADO", "Comprar Auto Upgrades Celestiais LIGADO"],
        default: 1,
    },
};

export function installPreferences(): void {
    FrozenCookies.preferenceValues = preferenceValues;
}
