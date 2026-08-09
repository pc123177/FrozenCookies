"use strict";
(() => {
  // src/core/ascend.ts
  function gameStage(snapshot) {
    if (snapshot.hasDragon) {
      return {
        stage: "late",
        label: "LATE GAME",
        reason: "Dragon hatched (dragonLevel > 0)"
      };
    }
    if (snapshot.hasWizardTower || snapshot.hasTemple) {
      return {
        stage: "mid",
        label: "MID GAME",
        reason: "Wizard Tower/Temple unlocked, no Dragon yet"
      };
    }
    return {
      stage: "early",
      label: "EARLY GAME",
      reason: "Wizard Tower/Temple not unlocked yet"
    };
  }
  var ASCEND_ROI_THRESHOLD_HOURS = [1, 2, 4, 8];
  var ASCEND_ROI_MIN_GROWTH_PERCENT = [0, 0.02, 0.05, 0.1, 0.2, 0.35];
  function cumulativeBuildingCost(basePrice, amount) {
    const priceIncrease = 1.15;
    return basePrice * (Math.pow(priceIncrease, amount) - 1) / (priceIncrease - 1);
  }
  function ascendROIStats(snapshot) {
    if (snapshot.prestige < 1) return null;
    const cookiesBaked = snapshot.cookiesEarned + snapshot.cookiesReset + snapshot.wrinklerValue + snapshot.chocolateValue;
    const resetPrestige = Math.pow(cookiesBaked / 1e12, 1 / snapshot.hcExponent);
    const newHC = Math.floor(resetPrestige) - snapshot.prestige;
    const minGrowthPercent = ASCEND_ROI_MIN_GROWTH_PERCENT[snapshot.ascendRoiMinGrowthIndex] ?? 0;
    const meetsGrowth = newHC / snapshot.prestige >= minGrowthPercent;
    const bonusPerHC = 0.01 * snapshot.heavenlyBonusMultiplier;
    const newBonus = Math.max(0, newHC) * bonusPerHC;
    const currentCps = snapshot.cpsBonus > 0 ? snapshot.cookiesPs / snapshot.cpsBonus : 0;
    const newCps = currentCps * (1 + newBonus);
    const cpsDelta = newCps - currentCps;
    const rebuildCost = snapshot.buildings.reduce(
      (sum, b) => sum + cumulativeBuildingCost(b.basePrice, b.amount),
      0
    );
    const paybackSecs = cpsDelta > 0 ? (snapshot.cookies + rebuildCost) / cpsDelta : Number.POSITIVE_INFINITY;
    const thresholdHours = ASCEND_ROI_THRESHOLD_HOURS[snapshot.ascendRoiThresholdIndex] ?? 2;
    const thresholdSecs = thresholdHours * 3600;
    const meetsSanityFloor = newHC >= 1;
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
      wouldAscend: meetsSanityFloor && meetsGrowth && meetsPayback
    };
  }
  function shouldAscendByROI(snapshot) {
    if (!(snapshot.autoAscendToggle && snapshot.autoAscendMode === 3)) return false;
    if (snapshot.isAscending) return false;
    if (snapshot.comboAscendBlock && snapshot.cpsBonus >= snapshot.minCpSMult) return false;
    if (snapshot.hasHowToBakeYourDragon && !snapshot.hasCrumblyEgg && snapshot.cookiesEarned < 1e6) {
      return false;
    }
    const stats = ascendROIStats(snapshot);
    return !!stats && stats.wouldAscend;
  }

  // src/core/efficiency.ts
  function purchaseEfficiency(price, deltaCps, currentCps, weight = 1.15) {
    if (deltaCps <= 0) return Number.POSITIVE_INFINITY;
    const costTimeCurrent = currentCps > 0 ? price / currentCps : Number.POSITIVE_INFINITY;
    const costTimeDelta = price / deltaCps;
    return weight * costTimeCurrent + costTimeDelta;
  }

  // src/game/snapshot.ts
  function buildGameSnapshot() {
    return {
      prestige: Game.prestige,
      cookies: Game.cookies,
      cookiesEarned: Game.cookiesEarned,
      cookiesReset: Game.cookiesReset,
      cookiesPs: Game.cookiesPs,
      wrinklerValue: wrinklerValue(),
      chocolateValue: chocolateValue(),
      heavenlyBonusMultiplier: Game.heavenlyPower * Game.GetHeavenlyMultiplier(),
      hcExponent: Game.HCfactor,
      buildings: Game.ObjectsById.map((b) => ({ basePrice: b.basePrice, amount: b.amount })),
      autoAscendToggle: FrozenCookies.autoAscendToggle === 1,
      autoAscendMode: FrozenCookies.autoAscend,
      ascendRoiThresholdIndex: FrozenCookies.ascendROIThreshold,
      ascendRoiMinGrowthIndex: FrozenCookies.ascendROIMinGrowth,
      comboAscendBlock: FrozenCookies.comboAscend === 1,
      cpsBonus: cpsBonus(),
      minCpSMult: FrozenCookies.minCpSMult,
      hasWizardTower: Game.Objects["Wizard tower"].amount > 0,
      hasTemple: Game.Objects["Temple"].amount > 0,
      hasDragon: Game.dragonLevel > 0,
      hasHowToBakeYourDragon: Game.Has("How to bake your dragon"),
      hasCrumblyEgg: Game.Has("A crumbly egg"),
      isAscending: !!Game.OnAscend || !!Game.AscendTimer
    };
  }

  // src/game/ascend-bot.ts
  function ascendBotTick() {
    const snapshot = buildGameSnapshot();
    if (!shouldAscendByROI(snapshot)) return;
    const stats = ascendROIStats(snapshot);
    if (stats) {
      logEvent(
        "autoAscend",
        "ROI ascend triggered: " + stats.newHC + " new HCs, payback " + Math.round(stats.paybackSecs / 60) + "min (threshold " + stats.thresholdHours + "h)"
      );
    }
    Game.ClosePrompt();
    Game.Ascend(1);
    setTimeout(() => {
      Game.ClosePrompt();
      Game.Reincarnate(1);
    }, 1e4);
  }

  // src/core/autopilot.ts
  var SHARED_BASE = {
    autoClick: 1,
    cookieClickSpeed: 250,
    autoFrenzy: 1,
    frenzyClickSpeed: 1e3,
    autoGC: 1,
    autoReindeer: 1,
    autoFortune: 1,
    autoBuy: 1,
    otherUpgrades: 1,
    autoBlacklistOff: 0,
    blacklist: 0,
    mineLimit: 0,
    factoryLimit: 0,
    pastemode: 0,
    autoAscendToggle: 1,
    autoAscend: 3,
    ascendROIThreshold: 1,
    comboAscend: 0,
    HCAscendAmount: 0,
    autoBulk: 2,
    autoBuyAll: 1,
    autoWrinkler: 1,
    shinyPop: 0,
    autoSL: 0,
    dragonsCurve: 0,
    sugarBakingGuard: 0,
    autoGS: 0,
    autoGodzamok: 0,
    autoBank: 0,
    autoBroker: 0,
    autoLoan: 0,
    autoWorshipToggle: 0,
    autoWorship0: 0,
    autoWorship1: 0,
    autoWorship2: 0,
    autoCyclius: 0,
    towerLimit: 0,
    autoCasting: 0,
    minCpSMult: 7,
    autoFTHOFCombo: 0,
    auto100ConsistencyCombo: 0,
    autoSugarFrenzy: 0,
    autoSweet: 0,
    autoDragon: 0,
    petDragon: 0,
    autoDragonToggle: 0,
    autoDragonOrbs: 0,
    orbLimit: 0,
    defaultSeasonToggle: 1,
    defaultSeason: 1,
    freeSeason: 1,
    autoEaster: 1,
    autoHalloween: 1,
    holdManBank: 0,
    holdSEBank: 0,
    setHarvestBankPlant: 0,
    FCshortcuts: 1,
    simulatedGCPercent: 1,
    showMissedCookies: 0,
    numberDisplay: 1,
    fancyui: 1,
    logging: 1,
    purchaseLog: 0,
    fpsModifier: 2,
    trackStats: 0
  };
  var STAGE_SETTINGS = {
    early: {
      ...SHARED_BASE,
      cookieClickSpeed: 150,
      ascendROIThreshold: 0,
      // ascensões baratas/rápidas cedo compõem mais rápido
      ascendROIMinGrowth: 1
      // +2% - prestígio é pequeno cedo, então qualquer ganho real de HC passa
      // facilmente; apenas suficiente para pular uma ascensão de valor zero que por acaso tinha retorno rápido.
    },
    mid: {
      ...SHARED_BASE,
      ascendROIThreshold: 1,
      ascendROIMinGrowth: 2,
      // +5%
      autoSL: 2,
      sugarBakingGuard: 1,
      autoGS: 1,
      autoGodzamok: 1,
      autoBank: 1,
      autoBroker: 1,
      autoLoan: 1,
      minLoanMult: 777,
      autoWorshipToggle: 1,
      autoWorship0: 2,
      autoWorship1: 8,
      towerLimit: 1,
      manaMax: 37,
      autoCasting: 3,
      minASFMult: 7777,
      // O combo FTHOF lança Force the Hand of Fate duas vezes via venda/recompra de Torres de Mago -
      // otimização real que o autopiloto nunca ativou para nenhum estágio. Seguro de ativar aqui: ele
      // se desativa quando Wizard tower.level > 10 (fc_spells.js autoFTHOFComboAction) e cede para
      // auto100ConsistencyCombo automaticamente quando este fica ativo (mesmo arquivo).
      autoFTHOFCombo: 1
    },
    late: {
      ...SHARED_BASE,
      mineLimit: 1,
      mineMax: 500,
      factoryLimit: 1,
      factoryMax: 500,
      ascendROIThreshold: 3,
      // a correção de rebuildCost já pondera o custo real
      ascendROIMinGrowth: 3,
      // +10%
      autoSL: 2,
      dragonsCurve: 2,
      sugarBakingGuard: 1,
      autoGS: 1,
      autoGodzamok: 1,
      autoBank: 1,
      autoBroker: 1,
      autoLoan: 1,
      minLoanMult: 777,
      autoWorshipToggle: 1,
      autoWorship0: 2,
      autoWorship1: 8,
      autoCyclius: 1,
      towerLimit: 1,
      manaMax: 100,
      autoCasting: 0,
      auto100ConsistencyCombo: 1,
      autoSugarFrenzy: 1,
      minASFMult: 7,
      autoDragon: 1,
      petDragon: 1,
      autoDragonToggle: 1,
      autoDragonAura0: 15,
      autoDragonAura1: 16,
      orbMax: 200
      // autoSweet permanece 0 (SHARED_BASE) em todo estágio - aviso de funcionalidade experimental
      // do README, nunca habilitado automaticamente pelo autopiloto.
    }
  };
  function stageSettings(stage) {
    return STAGE_SETTINGS[stage];
  }

  // src/game/autopilot-bot.ts
  var lastAppliedStage = null;
  function autopilotBotTick() {
    if (FrozenCookies.autopilot !== 1) return;
    const stage = gameStage(buildGameSnapshot());
    if (stage.stage === lastAppliedStage) return;
    const settings = stageSettings(stage.stage);
    const settingsRecord = settings;
    Object.keys(settingsRecord).forEach((key) => {
      FrozenCookies[key] = settingsRecord[key];
    });
    lastAppliedStage = stage.stage;
    logEvent("autopilot", "Stage detected: " + stage.label + " (" + stage.reason + ") - settings applied");
  }

  // src/core/heavenlyUpgrades.ts
  function nextHeavenlyUpgradeToBuy(upgrades, heavenlyChips) {
    const affordable = upgrades.filter(
      (u) => u.unlocked && !u.bought && u.price <= heavenlyChips
    );
    if (affordable.length === 0) return null;
    affordable.sort((a, b) => a.price - b.price);
    return affordable[0].name;
  }

  // src/game/heavenly-upgrade-bot.ts
  function canBePurchased(u) {
    if (u.bought) return true;
    if (u.showIf && !u.showIf()) return false;
    return u.parents.every((p) => p === -1 || p.bought === 1);
  }
  function heavenlyUpgradeBotTick() {
    if (FrozenCookies.autoBuyHeavenlyUpgrades !== 1) return;
    for (; ; ) {
      const candidates = Object.values(Game.UpgradesById).filter((u) => u.pool === "prestige").map((u) => ({
        name: u.name,
        price: u.getPrice(),
        unlocked: canBePurchased(u),
        bought: u.bought === 1
      }));
      const next = nextHeavenlyUpgradeToBuy(candidates, Game.heavenlyChips);
      if (!next) break;
      Game.Upgrades[next].buy();
    }
  }

  // src/core/lumpLeveling.ts
  function nextBuildingToLevel(buildings, lumps, minLumpsReserve) {
    const available = lumps - minLumpsReserve;
    const candidates = buildings.filter((b) => b.amount > 0 && b.level + 1 <= available).sort((a, b) => a.level - b.level);
    return candidates.length > 0 ? candidates[0].name : null;
  }

  // src/game/lump-leveling-bot.ts
  function lumpLevelingBotTick() {
    if (FrozenCookies.autoLevelBuildings !== 1) return;
    const minLumpsReserve = FrozenCookies.sugarBakingGuard === 1 ? 101 : 0;
    for (; ; ) {
      const buildings = Object.values(Game.ObjectsById).map((b) => ({
        name: b.name,
        amount: b.amount,
        level: b.level
      }));
      const next = nextBuildingToLevel(buildings, Game.lumps, minLumpsReserve);
      if (!next) break;
      Game.Objects[next].levelUp();
    }
  }

  // src/game/legacy-bridge.ts
  function installLegacyGlobals() {
    window.ascendROIStats = () => ascendROIStats(buildGameSnapshot());
    window.gameStage = () => gameStage(buildGameSnapshot());
    window.shouldAscendByROI = () => shouldAscendByROI(buildGameSnapshot());
    window.purchaseEfficiency = (price, deltaCps, _baseDeltaCps, currentCps) => purchaseEfficiency(price, deltaCps, currentCps);
    window.ascendBotTick = ascendBotTick;
    window.autopilotBotTick = autopilotBotTick;
    window.heavenlyUpgradeBotTick = heavenlyUpgradeBotTick;
    window.lumpLevelingBotTick = lumpLevelingBotTick;
  }

  // src/preferences.ts
  var preferenceValues = {
    // opções de clique
    clickingOptions: { hint: "Auto clique:" },
    autoClick: {
      hint: "Clicar automaticamente no cookie grande e definir velocidade.",
      display: ["Autoclick DESLIGADO", "Autoclick LIGADO"],
      default: 0,
      extras: `<a class="option" id="cookieClickSpeed" onclick="updateSpeed('cookieClickSpeed');">\${cookieClickSpeed} cliques/seg</a>`
    },
    autoFrenzy: {
      hint: "Clicar automaticamente durante frenzies de clique.",
      display: ["Autofrenzy DESLIGADO", "Autofrenzy LIGADO"],
      default: 0,
      extras: `<a class="option" id="frenzyClickSpeed" onclick="updateSpeed('frenzyClickSpeed');">\${frenzyClickSpeed} cliques/seg</a>`
    },
    autoGC: {
      hint: "Clicar automaticamente em cookies dourados/irados.",
      display: ["Autoclick GC DESLIGADO", "Autoclick GC LIGADO"],
      default: 0
    },
    autoReindeer: {
      hint: "Clicar automaticamente em renas.",
      display: ["Autoclick Rena DESLIGADO", "Autoclick Rena LIGADO"],
      default: 0
    },
    autoFortune: {
      hint: "Clicar automaticamente em fortunas no ticker de not\xEDcias.",
      display: ["Auto Fortuna DESLIGADO", "Auto Fortuna LIGADO"],
      default: 0
    },
    // opções de compra automática
    buyingOptions: { hint: "Compra autom\xE1tica:" },
    autoBuy: {
      hint: "Comprar automaticamente o edif\xEDcio/upgrade mais eficiente.",
      display: ["Compra Auto DESLIGADA", "Compra Auto LIGADA"],
      default: 0
    },
    otherUpgrades: {
      hint: "Comprar upgrades que n\xE3o aumentam o CpS diretamente.",
      display: ["Outros Upgrades DESLIGADO", "Outros Upgrades LIGADO"],
      default: 1
    },
    autoBlacklistOff: {
      hint: "Desativar lista negra quando a meta for atingida.",
      display: ["Auto Lista Negra DESLIGADA", "Auto Lista Negra LIGADA"],
      default: 0
    },
    blacklist: {
      hint: "Lista negra: Restringir compras para conquistas ou desafios.",
      display: [
        "Lista Negra DESLIGADA",
        "Modo Lista Negra SPEEDRUN",
        "Modo Lista Negra HARDCORE",
        "Modo Lista Negra GRANDMAPOCALYPSE",
        "Modo Lista Negra SEM EDIF\xCDCIOS"
      ],
      default: 0
    },
    mineLimit: {
      hint: "Limitar minas para combos com Godzamok.",
      display: ["Limite de Minas DESLIGADO", "Limite de Minas LIGADO"],
      default: 0,
      extras: `<a class="option" id="mineMax" onclick="updateMineMax('mineMax');">\${mineMax} Minas</a>`
    },
    factoryLimit: {
      hint: "Limitar f\xE1bricas para combos com Godzamok.",
      display: ["Limite de F\xE1bricas DESLIGADO", "Limite de F\xE1bricas LIGADO"],
      default: 0,
      extras: `<a class="option" id="factoryMax" onclick="updateFactoryMax('factoryMax');">\${factoryMax} F\xE1bricas</a>`
    },
    pastemode: {
      hint: "Comprar a op\xE7\xE3o menos eficiente (\u26A0\uFE0F n\xE3o recomendado).",
      display: ["Modo Pasta DESLIGADO", "Modo Pasta LIGADO"],
      default: 0
    },
    // outras opções de automação
    autoOtherOptions: { hint: "Outra automa\xE7\xE3o:" },
    autoBulk: {
      hint: "Definir compra em massa ap\xF3s ascens\xE3o.",
      display: ["Compra em Massa Auto DESLIGADA", "Compra em Massa Auto x10", "Compra em Massa Auto x100"],
      default: 0
    },
    autoBuyAll: {
      hint: "Comprar automaticamente todos os upgrades at\xE9 ganhar um chip.",
      display: ["Comprar Todos Upgrades Auto DESLIGADO", "Comprar Todos Upgrades Auto LIGADO"],
      default: 0
    },
    autoAscendToggle: {
      hint: "Ascender automaticamente (\u26A0\uFE0F pula tela de upgrades).",
      display: ["Ascens\xE3o Auto DESLIGADA", "Ascens\xE3o Auto LIGADA"],
      default: 0
    },
    // SMART ASCEND: adicionado modo 3 (baseado em ROI) à lista de exibição.
    // Os modos originais (quantidade fixa, prestígio dobrado) são mantidos sem alterações.
    // O modo 3 calcula o tempo de retorno: a ascensão é acionada apenas quando o CpS extra
    // de novos HCs recuperaria os cookies na tela dentro do limite configurado
    // (veja ascendROIThreshold e ascendROIMinGrowth abaixo).
    autoAscend: {
      hint: "Escolher m\xE9todo de ascens\xE3o autom\xE1tica.",
      display: [
        "Ascens\xE3o Auto DESLIGADA",
        "Ascens\xE3o Auto em QUANTIDADE DEFINIDA",
        "Ascens\xE3o Auto quando prest\xEDgio for DOBRADO",
        "Ascens\xE3o Auto por ROI (inteligente \u2713)"
      ],
      default: 0,
      extras: `<a class="option" id="chipsToAscend" onclick="updateAscendAmount('HCAscendAmount');">\${HCAscendAmount} fichas celestiais</a>`
    },
    // SMART ASCEND: limite de retorno para modo ROI.
    // Com que rapidez os novos HCs devem recuperar os cookies na tela?
    // Menor = ascender com menos frequência, mas apenas quando claramente vale a pena.
    // Maior = ascender mais agressivamente mesmo para ganhos marginais.
    ascendROIThreshold: {
      hint: "Modo ROI: ascender apenas quando o tempo de retorno estiver abaixo deste valor. Menor = mais seletivo.",
      display: [
        "Retorno ROI \u2264 1 hora",
        "Retorno ROI \u2264 2 horas",
        "Retorno ROI \u2264 4 horas",
        "Retorno ROI \u2264 8 horas"
      ],
      default: 1
    },
    // SMART ASCEND: piso de crescimento relativo. Substitui um antigo dropdown "min N novos HCs"
    // que permanecia fixo independentemente de quão longe na run você estava (5 HC significava
    // muito no prestígio 10, não significava nada no prestígio 1000). Uma % do prestígio atual
    // escala com o progresso.
    ascendROIMinGrowth: {
      hint: "Modo ROI: crescimento m\xEDnimo em % de HC em rela\xE7\xE3o ao total atual antes de ascender.",
      display: [
        "Sem crescimento m\xEDnimo",
        "+2% de crescimento",
        "+5% de crescimento",
        "+10% de crescimento",
        "+20% de crescimento",
        "+35% de crescimento"
      ],
      default: 0
    },
    comboAscend: {
      hint: "Bloquear ascens\xE3o autom\xE1tica quando houver X Frenzy ou mais.",
      display: ["Ascender durante combo DESLIGADO", "Ascender durante combo LIGADO"],
      default: 0,
      extras: `<a class="option" id="minCpSMult" onclick="updateCpSMultMin('minCpSMult');">x\${minCpSMult} Frenzy m\xEDnimo</a>`
    },
    autoWrinkler: {
      hint: "Estourar enrugadores automaticamente.",
      display: [
        "Estourar Enrugadores Auto DESLIGADO",
        "Estourar Enrugadores Auto EFICIENTEMENTE",
        "Estourar Enrugadores Auto INSTANTANEAMENTE"
      ],
      default: 0
    },
    shinyPop: {
      hint: "Proteger enrugadores brilhantes (\u26A0\uFE0F desativa o Juramento dos Anci\xE3os).",
      display: ["Salvar Enrugadores Brilhantes DESLIGADO", "Salvar Enrugadores Brilhantes LIGADO"],
      default: 0
    },
    autoSL: {
      hint: "Colher torr\xF5es de a\xE7\xFAcar automaticamente (opcionalmente com Rigidel).",
      display: [
        "Colheita Auto SL DESLIGADA",
        "Colheita Auto SL LIGADA",
        "Colheita Auto SL LIGADA + AUTO RIGIDEL"
      ],
      default: 0
    },
    dragonsCurve: {
      hint: "Ativar Dragon's Curve (e Reality Bending) para colheita de torr\xF5es.",
      display: [
        "Auto-Dragon's Curve DESLIGADO",
        "Auto-Dragon's Curve LIGADO",
        "Auto-Dragon's Curve LIGADO + REALITY BENDING"
      ],
      default: 0
    },
    sugarBakingGuard: {
      hint: "N\xE3o gastar torr\xF5es abaixo de 101 (manter b\xF4nus de Sugar Baking).",
      display: ["Guarda Sugar Baking DESLIGADO", "Guarda Sugar Baking LIGADO"],
      default: 0
    },
    autoLevelBuildings: {
      hint: "Gastar torr\xF5es de a\xE7\xFAcar automaticamente para nivelar edif\xEDcios possu\xEDdos (mais barato primeiro).",
      display: ["Nivelamento Auto de Edif\xEDcios DESLIGADO", "Nivelamento Auto de Edif\xEDcios LIGADO"],
      default: 1
    },
    autoGS: {
      hint: "Alternar Golden Switch automaticamente para buffs de clique.",
      display: ["Auto-Golden Switch DESLIGADO", "Auto-Golden Switch LIGADO"],
      default: 0
    },
    autoGodzamok: {
      hint: "Vender minas/f\xE1bricas automaticamente para Godzamok durante buffs de clique.",
      display: ["Auto-Godzamok DESLIGADO", "Auto-Godzamok LIGADO"],
      default: 0
    },
    autoBank: {
      hint: "Atualizar escrit\xF3rio do banco automaticamente.",
      display: ["Auto-Banco DESLIGADO", "Auto-Banco LIGADO"],
      default: 0
    },
    autoBroker: {
      hint: "Contratar corretores de a\xE7\xF5es automaticamente.",
      display: ["Auto-Corretor DESLIGADO", "Auto-Corretor LIGADO"],
      default: 0
    },
    autoLoan: {
      hint: "Fazer empr\xE9stimos automaticamente durante frenzies de clique.",
      display: ["Auto-Empr\xE9stimos DESLIGADO", "Fazer empr\xE9stimos 1 e 2", "Fazer todos os 3 empr\xE9stimos"],
      default: 0,
      extras: `<a class="option" id="minLoanMult" onclick="updateLoanMultMin('minLoanMult');">x\${minLoanMult} Frenzy m\xEDnimo</a>`
    },
    // opções do Panteão
    worshipOptions: { hint: "Pante\xE3o:" },
    autoWorshipToggle: {
      hint: "Encaixar deuses selecionados automaticamente (n\xE3o pode selecionar o mesmo deus duas vezes).",
      display: ["Auto Pante\xE3o DESLIGADO", "Auto Pante\xE3o LIGADO"],
      default: 0
    },
    autoWorship0: {
      hint: "Encaixar deus automaticamente no slot DIAMANTE.",
      display: ["Nenhum deus", "Vomitrax", "Godzamok", "Cyclius", "Selebrak", "Dotjeiess", "Muridal", "Jeremy", "Mokalsium", "Skruuia", "Rigidel"],
      default: 0
    },
    autoWorship1: {
      hint: "Encaixar deus automaticamente no slot RUBI.",
      display: ["Nenhum deus", "Vomitrax", "Godzamok", "Cyclius", "Selebrak", "Dotjeiess", "Muridal", "Jeremy", "Mokalsium", "Skruuia", "Rigidel"],
      default: 0
    },
    autoWorship2: {
      hint: "Encaixar deus automaticamente no slot JADE.",
      display: ["Nenhum deus", "Vomitrax", "Godzamok", "Cyclius", "Selebrak", "Dotjeiess", "Muridal", "Jeremy", "Mokalsium", "Skruuia", "Rigidel"],
      default: 0
    },
    autoCyclius: {
      hint: "Trocar Cyclius automaticamente para CpS m\xE1ximo (defina os deuses acima, n\xE3o use Cyclius).",
      display: [
        "Auto-Cyclius DESLIGADO",
        "Auto-Cyclius em RUBI e JADE",
        "Auto-Cyclius em todos os slots"
      ],
      default: 0
    },
    // opções de Feitiços
    spellOptions: { hint: "Grim\xF3rio:" },
    towerLimit: {
      hint: "Parar de comprar Torres de Feiticeiro no mana m\xE1ximo definido.",
      display: ["Limite de Torres de Feiticeiro DESLIGADO", "Limite de Torres de Feiticeiro LIGADO"],
      default: 0,
      extras: `<a class="option" id="manaMax" onclick="updateManaMax('manaMax');">\${manaMax} Mana m\xE1ximo</a>`
    },
    autoCasting: {
      hint: "Lan\xE7ar feiti\xE7o selecionado automaticamente quando o mana estiver cheio.",
      display: [
        "Auto Lan\xE7ar DESLIGADO",
        "Auto Lan\xE7ar CONJURE BAKED GOODS",
        "Auto Lan\xE7ar FORCE THE HAND OF FATE (simples)",
        "Auto Lan\xE7ar FORCE THE HAND OF FATE (inteligente)",
        "Auto Lan\xE7ar FTHOF (somente Especiais de Clique e Edif\xEDcios)",
        "Auto Lan\xE7ar SPONTANEOUS EDIFICE",
        "Auto Lan\xE7ar HAGGLER'S CHARM"
      ],
      default: 0,
      extras: `<a class="option" id="minCpSMult" onclick="updateCpSMultMin('minCpSMult');">x\${minCpSMult} Frenzy m\xEDnimo</a>`
    },
    spellNotes: { hint: "Apenas um combo pode estar ativo por vez. Veja o readme." },
    autoFTHOFCombo: {
      hint: "Lan\xE7ar combos FTHOF duplos automaticamente (precisa de mana suficiente).",
      display: ["Lan\xE7amento Duplo FTHOF DESLIGADO", "Lan\xE7amento Duplo FTHOF LIGADO"],
      default: 0
    },
    auto100ConsistencyCombo: {
      hint: "\u26A0\uFE0F EXPERIMENTAL: Lan\xE7ar 100% Consistency Combo automaticamente.",
      display: [
        "Auto Lan\xE7ar 100% Consistency Combo DESLIGADO",
        "Auto Lan\xE7ar 100% Consistency Combo LIGADO"
      ],
      default: 0
    },
    autoSugarFrenzy: {
      hint: "Comprar Sugar Frenzy automaticamente durante o primeiro combo de X Frenzy.",
      display: [
        "Auto Sugar Frenzy DESLIGADO",
        "ASF para 100% Consistency Combo",
        "ASF tamb\xE9m para Combo de Lan\xE7amento Duplo"
      ],
      default: 0,
      extras: `<a class="option" id="minASFMult" onclick="updateASFMultMin('minASFMult');">x\${minASFMult} Frenzy m\xEDnimo</a>`
    },
    autoSweet: {
      hint: "\u26A0\uFE0F EXPERIMENTAL: Ascender at\xE9 o feiti\xE7o 'Sweet' aparecer. Sem desligamento manual.",
      display: ["Auto Sweet DESLIGADO", "Auto Sweet LIGADO"],
      default: 0
    },
    // opções do Dragão
    dragonOptions: { hint: "Drag\xE3o:" },
    autoDragon: {
      hint: "Atualizar drag\xE3o automaticamente.",
      display: ["Atualiza\xE7\xE3o do Drag\xE3o DESLIGADA", "Atualiza\xE7\xE3o do Drag\xE3o LIGADA"],
      default: 0
    },
    petDragon: {
      hint: "Acariciar drag\xE3o automaticamente para drops.",
      display: ["Acariciar Drag\xE3o DESLIGADO", "Acariciar Drag\xE3o LIGADO"],
      default: 0
    },
    autoDragonToggle: {
      hint: "Definir auras do drag\xE3o automaticamente.",
      display: ["Auras do Drag\xE3o DESLIGADAS", "Auras do Drag\xE3o LIGADAS"],
      default: 0
    },
    dragonNotes: { hint: "Defina as auras desejadas. N\xE3o pode definir a mesma aura duas vezes." },
    autoDragonAura0: {
      hint: "Definir automaticamente a PRIMEIRA aura do drag\xE3o.",
      display: [
        "Sem Aura",
        "Breath of Milk",
        "Dragon Cursor",
        "Elder Battalion",
        "Reaper of Fields",
        "Earth Shatterer",
        "Master of the Armory",
        "Fierce Hoarder",
        "Dragon God",
        "Arcane Aura",
        "Dragonflight",
        "Ancestral Metamorphosis",
        "Unholy Dominion",
        "Epoch Manipulator",
        "Mind Over Matter",
        "Radiant Appetite",
        "Dragon's Fortune",
        "Dragon's Curve",
        "Reality Bending",
        "Dragon Orbs",
        "Supreme Intellect",
        "Dragon Guts"
      ],
      default: 0
    },
    autoDragonAura1: {
      hint: "Definir automaticamente a SEGUNDA aura do drag\xE3o.",
      display: [
        "Sem Aura",
        "Breath of Milk",
        "Dragon Cursor",
        "Elder Battalion",
        "Reaper of Fields",
        "Earth Shatterer",
        "Master of the Armory",
        "Fierce Hoarder",
        "Dragon God",
        "Arcane Aura",
        "Dragonflight",
        "Ancestral Metamorphosis",
        "Unholy Dominion",
        "Epoch Manipulator",
        "Mind Over Matter",
        "Radiant Appetite",
        "Dragon's Fortune",
        "Dragon's Curve",
        "Reality Bending",
        "Dragon Orbs",
        "Supreme Intellect",
        "Dragon Guts"
      ],
      default: 0
    },
    autoDragonOrbs: {
      hint: "Vender Yous automaticamente para GC se a aura Dragon Orbs estiver ativa e Godzamok n\xE3o.",
      display: ["Auto-Dragon Orbs DESLIGADO", "Auto-Dragon Orbs LIGADO"],
      default: 0
    },
    orbLimit: {
      hint: "Limitar Yous para combos com Dragon Orbs.",
      display: ["Limite de Yous DESLIGADO", "Limite de Yous LIGADO"],
      default: 0,
      extras: `<a class="option" id="orbMax" onclick="updateOrbMax('orbMax');">\${orbMax} Yous</a>`
    },
    // opções de Temporada
    seasonOptions: { hint: "Temporada:" },
    defaultSeasonToggle: {
      hint: "Mudar automaticamente para a temporada selecionada se n\xE3o houver upgrades necess\xE1rios.",
      display: ["Compra Auto de Temporadas DESLIGADA", "Compra Auto de Temporadas LIGADA"],
      default: 0
    },
    defaultSeason: {
      hint: "Selecionar temporada padr\xE3o.",
      display: [
        "Temporada Padr\xE3o DESLIGADA",
        "Temporada Padr\xE3o DIA DE NEG\xD3CIOS",
        "Temporada Padr\xE3o NATAL",
        "Temporada Padr\xE3o P\xC1SCOA",
        "Temporada Padr\xE3o HALLOWEEN",
        "Temporada Padr\xE3o DIA DOS NAMORADOS"
      ],
      default: 0
    },
    freeSeason: {
      hint: "Permanecer na temporada base gratuita se n\xE3o houver upgrades necess\xE1rios.",
      display: [
        "Temporada Gratuita DESLIGADA",
        "Temporada Gratuita para NATAL e DIA DE NEG\xD3CIOS",
        "Temporada Gratuita para TODAS"
      ],
      default: 1
    },
    autoEaster: {
      hint: "Mudar para Easter durante Cookie Storm se ovos estiverem faltando.",
      display: ["Troca para Easter Auto DESLIGADA", "Troca para Easter Auto LIGADA"],
      default: 0
    },
    autoHalloween: {
      hint: "Mudar para Halloween se houver enrugadores presentes e cookies faltando.",
      display: ["Troca para Halloween Auto DESLIGADA", "Troca para Halloween Auto LIGADA"],
      default: 0
    },
    // opções do Banco
    bankOptions: { hint: "Banco: (atrasa a compra autom\xE1tica at\xE9 o banco estar cheio)" },
    holdManBank: {
      hint: "Banco m\xEDnimo manual (minutos de CpS base)",
      display: ["Banco Manual DESLIGADO", "Banco Manual LIGADO"],
      default: 0,
      extras: `<a class="option" id="manBankMins" onclick="updateManBank('manBankMins');">\${manBankMins} Minutos</a>`
    },
    holdSEBank: {
      hint: "Manter banco para Spontaneous Edifice.",
      display: ["Banco SE DESLIGADO", "Banco SE LIGADO"],
      default: 0
    },
    setHarvestBankPlant: {
      hint: "Manter banco para colher a planta selecionada.",
      display: [
        "Banco de Colheita DESLIGADO",
        "Banco de Colheita BAKEBERRY",
        "Banco de Colheita CHOCOROOT",
        "Banco de Colheita CHOCOROOT BRANCO",
        "Banco de Colheita QUEENBEET",
        "Banco de Colheita DUKETATER",
        "Banco de Colheita CRUMBSPORE",
        "Banco de Colheita DOUGHSHROOM"
      ],
      default: 0
    },
    setHarvestBankType: {
      hint: "Aumentar banco para colheita de planta durante buffs de CpS.",
      display: [
        "Colheita durante NENHUM MULTIPLICADOR de CpS",
        "Colheita durante FRENZY",
        "Colheita durante ESPECIAL DE EDIF\xCDCIOS",
        "Colheita durante FRENZY + ESPECIAL DE EDIF\xCDCIOS"
      ],
      default: 0,
      extras: `<a class="option" id="maxSpecials" onclick="updateMaxSpecials('maxSpecials');">\${maxSpecials} especiais de edif\xEDcios</a>`
    },
    // Outras opções
    otherOptions: { hint: "Outro:" },
    FCshortcuts: {
      hint: "Ativar atalhos de teclado (veja o readme).",
      display: ["Atalhos DESLIGADOS", "Atalhos LIGADOS"],
      default: 1
    },
    simulatedGCPercent: {
      hint: "Assumir % de GCs clicados para efici\xEAncia (100% recomendado).",
      display: ["GC clicado 0%", "GC clicado 100%"],
      default: 1
    },
    // opções de Exibição
    displayOptions: { hint: "Exibi\xE7\xE3o:" },
    showMissedCookies: {
      hint: "Mostrar cookies dourados perdidos no painel de informa\xE7\xF5es.",
      display: ["Mostrar GCs Perdidos DESLIGADO", "Mostrar GCs Perdidos LIGADO"],
      default: 0
    },
    numberDisplay: {
      hint: "Alterar estilo de formata\xE7\xE3o de n\xFAmeros.",
      display: [
        "Exibi\xE7\xE3o de N\xFAmeros BRUTO",
        "Exibi\xE7\xE3o de N\xFAmeros COMPLETO (milh\xE3o, bilh\xE3o)",
        "Exibi\xE7\xE3o de N\xFAmeros SIGLAS (M, B)",
        "Exibi\xE7\xE3o de N\xFAmeros PREFIXOS SI (M, G, T)",
        "Exibi\xE7\xE3o de N\xFAmeros CIENT\xCDFICO (6.3e12)"
      ],
      default: 1
    },
    fancyui: {
      hint: "Estilo da caixa de informa\xE7\xF5es (texto, roda ou ambos).",
      display: ["Caixa de Info DESLIGADA", "Caixa de Info SOMENTE TEXTO", "Caixa de Info SOMENTE RODA", "Caixa de Info RODA & TEXTO"],
      default: 0
    },
    logging: {
      hint: "Registrar a\xE7\xF5es no console.",
      display: ["Log DESLIGADO", "Log LIGADO"],
      default: 1
    },
    purchaseLog: {
      hint: "Registrar todas as compras autom\xE1ticas.",
      display: ["Log de Compras DESLIGADO", "Log de Compras LIGADO"],
      default: 0
    },
    slowOptions: { hint: "Aten\xE7\xE3o: Estas op\xE7\xF5es podem diminuir a velocidade do jogo." },
    fpsModifier: {
      hint: "Definir taxa de quadros do jogo (padr\xE3o 30).",
      display: [
        "Taxa de Quadros 15 fps",
        "Taxa de Quadros 24 fps",
        "Taxa de Quadros 30 fps",
        "Taxa de Quadros 48 fps",
        "Taxa de Quadros 60 fps",
        "Taxa de Quadros 72 fps",
        "Taxa de Quadros 88 fps",
        "Taxa de Quadros 100 fps",
        "Taxa de Quadros 120 fps",
        "Taxa de Quadros 144 fps",
        "Taxa de Quadros 200 fps",
        "Taxa de Quadros 240 fps",
        "Taxa de Quadros 300 fps",
        "Taxa de Quadros 5 fps",
        "Taxa de Quadros 10 fps"
      ],
      default: 2
    },
    trackStats: {
      hint: "Rastrear CpS/HC para gr\xE1ficos (pode diminuir a velocidade do jogo).",
      display: [
        "Rastreamento DESLIGADO",
        "Rastreamento A CADA 60s",
        "Rastreamento A CADA 30m",
        "Rastreamento A CADA 1h",
        "Rastreamento A CADA 24h",
        "Rastreamento EM UPGRADES",
        "Rastreamento TEMPORIZA\xC7\xC3O INTELIGENTE"
      ],
      default: 0,
      extras: '<a class="option" id="viewStats" onclick="viewStatGraphs();">Ver Gr\xE1ficos de Estat\xEDsticas</a>'
    },
    recommendedSettings: {
      hint: "Aplicar todas as op\xE7\xF5es recomendadas (\u26A0\uFE0F recarrega o jogo instantaneamente).",
      display: ["Recomendado DESLIGADO", "Recomendado LIGADO"],
      default: 0
    },
    // v2: substitui os 3 toggles manuais presetEarlyGame/presetMidGame/presetLateGame - o
    // piloto automático detecta a fase por conta própria (src/core/ascend.ts gameStage()) e
    // aplica a tabela de configurações correspondente (src/core/autopilot.ts) continuamente,
    // sem necessidade de recarga.
    autopilot: {
      hint: "O bot detecta a fase do jogo e se configura automaticamente (sem predefini\xE7\xF5es manuais).",
      display: ["Piloto Autom\xE1tico DESLIGADO", "Piloto Autom\xE1tico LIGADO"],
      default: 0
    },
    // v2: após cada ascensão, gastar fichas celestiais em upgrades de prestígio desbloqueados
    // (mais baratos primeiro) automaticamente - veja src/core/heavenlyUpgrades.ts.
    autoBuyHeavenlyUpgrades: {
      hint: "Comprar automaticamente upgrades celestiais desbloqueados com HC ap\xF3s ascender.",
      display: ["Comprar Auto Upgrades Celestiais DESLIGADO", "Comprar Auto Upgrades Celestiais LIGADO"],
      default: 1
    }
  };
  function installPreferences() {
    FrozenCookies.preferenceValues = preferenceValues;
  }

  // src/main.ts
  var currentScript = document.currentScript;
  var scriptElement = currentScript ?? document.getElementById("frozenCookieScript") ?? document.getElementById("modscript_frozen_cookies");
  var baseUrl = scriptElement !== null ? (scriptElement.getAttribute("src") ?? "").replace(/\/frozen_cookies\.js(\?.*)?$/, "") : "https://pc123177.github.io/FrozenCookies/dist";
  var repoRootUrl = baseUrl.replace(/\/dist$/, "");
  var windowWithFc = window;
  windowWithFc.FrozenCookies = {
    baseUrl,
    branch: "erb-",
    version: "2.052.8"
    // Manter em sincronia com README.md
  };
  installPreferences();
  installLegacyGlobals();
  var legacyScriptList = [
    "https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js",
    "https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css",
    "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jcanvas/20.1.1/min/jcanvas.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/jquery.jqplot.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/jquery.jqplot.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/plugins/jqplot.canvasTextRenderer.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/plugins/jqplot.canvasAxisLabelRenderer.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/plugins/jqplot.canvasAxisTickRenderer.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/plugins/jqplot.trendline.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/plugins/jqplot.highlighter.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/plugins/jqplot.logAxisRenderer.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.9/plugins/jqplot.cursor.min.js",
    repoRootUrl + "/src/legacy/cc_upgrade_prerequisites.js",
    // pré-requisitos de upgrades, usado em fc_main.js
    repoRootUrl + "/src/legacy/fc_main.js",
    // lógica principal
    repoRootUrl + "/src/legacy/fc_gods.js",
    // minigame dos deuses e opções do dragão
    repoRootUrl + "/src/legacy/fc_spells.js",
    // minigame de feitiços e lançamento automático
    repoRootUrl + "/src/legacy/fc_bank.js",
    // minigame do banco
    repoRootUrl + "/src/legacy/fc_button.js",
    // botão para abrir o menu do Frozen Cookies
    repoRootUrl + "/src/legacy/fc_infobox.js"
    // caixa de informações
  ];
  function loadScript(id, isRetry = false) {
    if (id >= legacyScriptList.length) {
      registerMod("frozen_cookies");
      return;
    }
    const url = legacyScriptList[id];
    if (/\.js$/.exec(url)) {
      $.getScript(url, () => loadScript(id + 1)).fail(() => {
        if (isRetry) {
          console.log("FrozenCookies: failed to load " + url + " after retry, skipping.");
          loadScript(id + 1);
          return;
        }
        console.log("FrozenCookies: failed to load " + url + ", retrying in 2s...");
        setTimeout(() => loadScript(id, true), 2e3);
      });
    } else if (/\.css$/.exec(url)) {
      $("<link>").attr({ rel: "stylesheet", type: "text/css", href: url }).appendTo($("head"));
      loadScript(id + 1);
    } else {
      console.log("Error loading script: " + url);
      loadScript(id + 1);
    }
  }
  function fcInit() {
    const jquery = document.createElement("script");
    jquery.setAttribute("type", "text/javascript");
    jquery.setAttribute("src", "https://code.jquery.com/jquery-3.6.0.min.js");
    jquery.setAttribute("integrity", "sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=");
    jquery.setAttribute("crossorigin", "anonymous");
    jquery.onload = () => loadScript(0);
    document.head.appendChild(jquery);
  }
  var lastCompatibleVersion = 2.058;
  var liveGame = Game;
  if (typeof Game !== "undefined" && liveGame.version > lastCompatibleVersion) {
    console.log("WARNING: The Cookie Clicker version is newer than this version of Frozen Cookies.");
    console.log(
      "This version of Frozen Cookies has only been tested through Cookie Clicker version " + lastCompatibleVersion
    );
    console.log(
      "There may be incompatibilities, undesirable effects, bugs, shifts in reality, immoral behavior, and who knows what else."
    );
  }
  var fc = windowWithFc.FrozenCookies;
  fc.loadInterval = setInterval(() => {
    if (typeof Game !== "undefined" && liveGame.ready) {
      clearInterval(fc.loadInterval);
      fc.loadInterval = 0;
      fcInit();
    }
  }, 1e3);
})();
