"use strict";
(() => {
  // src/core/ascend.ts
  function gameStage(snapshot) {
    if (snapshot.hasChocolateEgg) {
      return {
        stage: "late",
        label: "LATE GAME",
        reason: "Dragon unlocked (Chocolate egg owned)"
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
  var ASCEND_ROI_MIN_HC_VALUES = [5, 10, 25, 50, 100];
  var ASCEND_ROI_THRESHOLD_HOURS = [1, 2, 4, 8];
  function cumulativeBuildingCost(basePrice, amount) {
    const priceIncrease = 1.15;
    return basePrice * (Math.pow(priceIncrease, amount) - 1) / (priceIncrease - 1);
  }
  function ascendROIStats(snapshot) {
    if (snapshot.prestige < 1) return null;
    const cookiesBaked = snapshot.cookiesEarned + snapshot.cookiesReset + snapshot.wrinklerValue + snapshot.chocolateValue;
    const resetPrestige = Math.pow(cookiesBaked / 1e12, 1 / 3);
    const newHC = Math.floor(resetPrestige) - snapshot.prestige;
    const minHC = ASCEND_ROI_MIN_HC_VALUES[snapshot.ascendRoiMinHCIndex] ?? 10;
    const bonusPerHC = snapshot.hasPersistentMemory ? 0.02 : 0.01;
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
    const meetsMinHC = newHC >= minHC;
    const meetsPayback = paybackSecs <= thresholdSecs;
    return {
      newHC,
      minHC,
      rebuildCost,
      paybackSecs,
      thresholdHours,
      thresholdSecs,
      meetsMinHC,
      meetsPayback,
      wouldAscend: meetsMinHC && meetsPayback
    };
  }
  function shouldAscendByROI(snapshot) {
    if (!(snapshot.autoAscendToggle && snapshot.autoAscendMode === 3)) return false;
    if (snapshot.isAscending) return false;
    if (snapshot.comboAscendBlock && snapshot.cpsBonus >= snapshot.minCpSMult) return false;
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
      hasPersistentMemory: Game.Has("Persistent memory"),
      buildings: Game.ObjectsById.map((b) => ({ basePrice: b.basePrice, amount: b.amount })),
      autoAscendToggle: FrozenCookies.autoAscendToggle === 1,
      autoAscendMode: FrozenCookies.autoAscend,
      ascendRoiMinHCIndex: FrozenCookies.ascendROIMinHC,
      ascendRoiThresholdIndex: FrozenCookies.ascendROIThreshold,
      comboAscendBlock: FrozenCookies.comboAscend === 1,
      cpsBonus: cpsBonus(),
      minCpSMult: FrozenCookies.minCpSMult,
      hasWizardTower: Game.Objects["Wizard tower"].amount > 0,
      hasTemple: Game.Objects["Temple"].amount > 0,
      hasChocolateEgg: Game.Has("Chocolate egg"),
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
    ascendROIMinHC: 1,
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
      ascendROIMinHC: 0,
      ascendROIThreshold: 0
      // cheap/fast early ascends compound fastest
    },
    mid: {
      ...SHARED_BASE,
      ascendROIMinHC: 1,
      ascendROIThreshold: 1,
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
      minASFMult: 7777
    },
    late: {
      ...SHARED_BASE,
      mineLimit: 1,
      mineMax: 500,
      factoryLimit: 1,
      factoryMax: 500,
      ascendROIMinHC: 2,
      ascendROIThreshold: 3,
      // rebuildCost fix already weighs the real cost
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
      // autoSweet stays 0 (SHARED_BASE) in every stage - README's explicit experimental-
      // feature warning, never auto-enabled by the autopilot.
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
  function heavenlyUpgradeBotTick() {
    if (FrozenCookies.autoBuyHeavenlyUpgrades !== 1) return;
    for (; ; ) {
      const candidates = Object.values(Game.UpgradesById).filter((u) => u.pool === "prestige").map((u) => ({
        name: u.name,
        price: u.getPrice(),
        unlocked: u.unlocked === 1,
        bought: u.bought === 1
      }));
      const next = nextHeavenlyUpgradeToBuy(candidates, Game.heavenlyChips);
      if (!next) break;
      Game.Upgrades[next].buy();
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
  }

  // src/preferences.ts
  var preferenceValues = {
    // clicking options
    clickingOptions: { hint: "Auto clicking:" },
    autoClick: {
      hint: "Auto-click big cookie and set speed.",
      display: ["Autoclick OFF", "Autoclick ON"],
      default: 0,
      extras: `<a class="option" id="cookieClickSpeed" onclick="updateSpeed('cookieClickSpeed');">\${cookieClickSpeed} clicks/sec</a>`
    },
    autoFrenzy: {
      hint: "Auto-click for click frenzies.",
      display: ["Autofrenzy OFF", "Autofrenzy ON"],
      default: 0,
      extras: `<a class="option" id="frenzyClickSpeed" onclick="updateSpeed('frenzyClickSpeed');">\${frenzyClickSpeed} clicks/sec</a>`
    },
    autoGC: {
      hint: "Auto-click golden/wrath cookies.",
      display: ["Autoclick GC OFF", "Autoclick GC ON"],
      default: 0
    },
    autoReindeer: {
      hint: "Auto-click reindeer.",
      display: ["Autoclick Reindeer OFF", "Autoclick Reindeer ON"],
      default: 0
    },
    autoFortune: {
      hint: "Auto-click fortunes in news ticker.",
      display: ["Auto Fortune OFF", "Auto Fortune ON"],
      default: 0
    },
    // autobuy options
    buyingOptions: { hint: "Auto-buying:" },
    autoBuy: {
      hint: "Auto-buy most efficient building/upgrade.",
      display: ["AutoBuy OFF", "AutoBuy ON"],
      default: 0
    },
    otherUpgrades: {
      hint: "Buy upgrades that don't boost CpS directly.",
      display: ["Other Upgrades OFF", "Other Upgrades ON"],
      default: 1
    },
    autoBlacklistOff: {
      hint: "Turn off blacklist when goal is met.",
      display: ["Auto Blacklist OFF", "Auto Blacklist ON"],
      default: 0
    },
    blacklist: {
      hint: "Blacklist: Restrict purchases for achievements or challenges.",
      display: [
        "Blacklist OFF",
        "Blacklist Mode SPEEDRUN",
        "Blacklist Mode HARDCORE",
        "Blacklist Mode GRANDMAPOCALYPSE",
        "Blacklist Mode NO BUILDINGS"
      ],
      default: 0
    },
    mineLimit: {
      hint: "Limit mines for Godzamok combos.",
      display: ["Mine Limit OFF", "Mine Limit ON"],
      default: 0,
      extras: `<a class="option" id="mineMax" onclick="updateMineMax('mineMax');">\${mineMax} Mines</a>`
    },
    factoryLimit: {
      hint: "Limit factories for Godzamok combos.",
      display: ["Factory Limit OFF", "Factory Limit ON"],
      default: 0,
      extras: `<a class="option" id="factoryMax" onclick="updateFactoryMax('factoryMax');">\${factoryMax} Factories</a>`
    },
    pastemode: {
      hint: "Buy least efficient option (\u26A0\uFE0F not recommended).",
      display: ["Pastemode OFF", "Pastemode ON"],
      default: 0
    },
    // other auto options
    autoOtherOptions: { hint: "Other automation:" },
    autoBulk: {
      hint: "Set bulk buy after ascension.",
      display: ["Auto Bulkbuy OFF", "Auto Bulkbuy x10", "Auto Bulkbuy x100"],
      default: 0
    },
    autoBuyAll: {
      hint: "Auto-buy all upgrades until a chip is earned.",
      display: ["Auto Buy All Upgrades OFF", "Auto Buy All Upgrades ON"],
      default: 0
    },
    autoAscendToggle: {
      hint: "Auto-ascend (\u26A0\uFE0F skips upgrade screen).",
      display: ["Auto Ascend OFF", "Auto Ascend ON"],
      default: 0
    },
    // SMART ASCEND: added mode 3 (ROI-based) to the display list.
    // The original modes (fixed amount, prestige doubles) are kept unchanged.
    // Mode 3 calculates payback time: ascending is triggered only when the extra
    // CpS from new HCs would recover the cookies-on-screen within the configured
    // threshold (see ascendROIThreshold and ascendROIMinHC below).
    autoAscend: {
      hint: "Choose auto-ascend method.",
      display: [
        "Auto-ascend OFF",
        "Auto-ascend at SET amount",
        "Auto-ascend when prestige is DOUBLED",
        "Auto-ascend by ROI (smart \u2713)"
      ],
      default: 0,
      extras: `<a class="option" id="chipsToAscend" onclick="updateAscendAmount('HCAscendAmount');">\${HCAscendAmount} heavenly chips</a>`
    },
    // SMART ASCEND: payback threshold for ROI mode.
    // How quickly must the new HCs pay back the cookies on screen?
    // Shorter = ascend less often but only when clearly worth it.
    // Longer = ascend more aggressively even for marginal gains.
    ascendROIThreshold: {
      hint: "ROI mode: ascend only when payback time is under this. Shorter = more selective.",
      display: [
        "ROI payback \u2264 1 hour",
        "ROI payback \u2264 2 hours",
        "ROI payback \u2264 4 hours",
        "ROI payback \u2264 8 hours"
      ],
      default: 1
    },
    // SMART ASCEND: minimum new HC gate.
    // Prevents ROI mode from triggering on trivially small gains.
    // Even if payback is fast, don't ascend for fewer than N new HCs.
    ascendROIMinHC: {
      hint: "ROI mode: minimum new HCs required before ascending.",
      display: [
        "Min 5 new HCs",
        "Min 10 new HCs",
        "Min 25 new HCs",
        "Min 50 new HCs",
        "Min 100 new HCs"
      ],
      default: 1
    },
    comboAscend: {
      hint: "Block auto-ascend when you have X Frenzy or higher.",
      display: ["Ascend during combo OFF", "Ascend during combo ON"],
      default: 0,
      extras: `<a class="option" id="minCpSMult" onclick="updateCpSMultMin('minCpSMult');">x\${minCpSMult} minimum Frenzy</a>`
    },
    autoWrinkler: {
      hint: "Auto-pop wrinklers.",
      display: [
        "Autopop Wrinklers OFF",
        "Autopop Wrinklers EFFICIENTLY",
        "Autopop Wrinklers INSTANTLY"
      ],
      default: 0
    },
    shinyPop: {
      hint: "Protect shiny wrinklers (\u26A0\uFE0F disables Elder Pledge).",
      display: ["Save Shiny Wrinklers OFF", "Save Shiny Wrinklers ON"],
      default: 0
    },
    autoSL: {
      hint: "Auto-harvest sugar lumps (optionally with Rigidel).",
      display: [
        "Autoharvest SL OFF",
        "Autoharvest SL ON",
        "Autoharvest SL ON + AUTO RIGIDEL"
      ],
      default: 0
    },
    dragonsCurve: {
      hint: "Swap in Dragon's Curve (and Reality Bending) for lump harvest.",
      display: [
        "Auto-Dragon's Curve OFF",
        "Auto-Dragon's Curve ON",
        "Auto-Dragon's Curve ON + REALITY BENDING"
      ],
      default: 0
    },
    sugarBakingGuard: {
      hint: "Don't spend lumps below 101 (keep Sugar Baking bonus).",
      display: ["Sugar Baking Guard OFF", "Sugar Baking Guard ON"],
      default: 0
    },
    autoGS: {
      hint: "Auto-toggle Golden Switch for click buffs.",
      display: ["Auto-Golden Switch OFF", "Auto-Golden Switch ON"],
      default: 0
    },
    autoGodzamok: {
      hint: "Auto-sell mines/factories for Godzamok during click buffs.",
      display: ["Auto-Godzamok OFF", "Auto-Godzamok ON"],
      default: 0
    },
    autoBank: {
      hint: "Auto-upgrade bank office.",
      display: ["Auto-Banking OFF", "Auto-Banking ON"],
      default: 0
    },
    autoBroker: {
      hint: "Auto-hire stock brokers.",
      display: ["Auto-Broker OFF", "Auto-Broker ON"],
      default: 0
    },
    autoLoan: {
      hint: "Auto-take loans during click frenzies.",
      display: ["Auto-Loans OFF", "Take loans 1 and 2", "Take all 3 loans"],
      default: 0,
      extras: `<a class="option" id="minLoanMult" onclick="updateLoanMultMin('minLoanMult');">x\${minLoanMult} minimum Frenzy</a>`
    },
    // Pantheon options
    worshipOptions: { hint: "Pantheon:" },
    autoWorshipToggle: {
      hint: "Auto-slot selected gods (can't select same god twice).",
      display: ["Auto Pantheon OFF", "Auto Pantheon ON"],
      default: 0
    },
    autoWorship0: {
      hint: "Auto-slot god in DIAMOND slot.",
      display: ["No god", "Vomitrax", "Godzamok", "Cyclius", "Selebrak", "Dotjeiess", "Muridal", "Jeremy", "Mokalsium", "Skruuia", "Rigidel"],
      default: 0
    },
    autoWorship1: {
      hint: "Auto-slot god in RUBY slot.",
      display: ["No god", "Vomitrax", "Godzamok", "Cyclius", "Selebrak", "Dotjeiess", "Muridal", "Jeremy", "Mokalsium", "Skruuia", "Rigidel"],
      default: 0
    },
    autoWorship2: {
      hint: "Auto-slot god in JADE slot.",
      display: ["No god", "Vomitrax", "Godzamok", "Cyclius", "Selebrak", "Dotjeiess", "Muridal", "Jeremy", "Mokalsium", "Skruuia", "Rigidel"],
      default: 0
    },
    autoCyclius: {
      hint: "Auto-swap Cyclius for max CpS (set gods above, do not use Cyclius).",
      display: [
        "Auto-Cyclius OFF",
        "Auto-Cyclius in RUBY and JADE",
        "Auto-Cyclius in all slots"
      ],
      default: 0
    },
    // Spell options
    spellOptions: { hint: "Grimoire:" },
    towerLimit: {
      hint: "Stop buying Wizard Towers at set max mana.",
      display: ["Wizard Tower Cap OFF", "Wizard Tower Cap ON"],
      default: 0,
      extras: `<a class="option" id="manaMax" onclick="updateManaMax('manaMax');">\${manaMax} max Mana</a>`
    },
    autoCasting: {
      hint: "Auto-cast selected spell when mana is full.",
      display: [
        "Auto Cast OFF",
        "Auto Cast CONJURE BAKED GOODS",
        "Auto Cast FORCE THE HAND OF FATE (simple)",
        "Auto Cast FORCE THE HAND OF FATE (smart)",
        "Auto Cast FTHOF (Click and Building Specials only)",
        "Auto Cast SPONTANEOUS EDIFICE",
        "Auto Cast HAGGLER'S CHARM"
      ],
      default: 0,
      extras: `<a class="option" id="minCpSMult" onclick="updateCpSMultMin('minCpSMult');">x\${minCpSMult} minimum Frenzy</a>`
    },
    spellNotes: { hint: "Only one combo can be active at a time. See readme." },
    autoFTHOFCombo: {
      hint: "Auto double-cast FTHOF combos (needs enough mana).",
      display: ["Double Cast FTHOF OFF", "Double Cast FTHOF ON"],
      default: 0
    },
    auto100ConsistencyCombo: {
      hint: "\u26A0\uFE0F EXPERIMENTAL: Auto-cast 100% Consistency Combo.",
      display: [
        "Auto Cast 100% Consistency Combo OFF",
        "Auto Cast 100% Consistency Combo ON"
      ],
      default: 0
    },
    autoSugarFrenzy: {
      hint: "Auto-buy Sugar Frenzy during first combo of X Frenzy.",
      display: [
        "Auto Sugar Frenzy OFF",
        "ASF for 100% Consistency Combo",
        "ASF also for Double Cast Combo"
      ],
      default: 0,
      extras: `<a class="option" id="minASFMult" onclick="updateASFMultMin('minASFMult');">x\${minASFMult} minimum Frenzy</a>`
    },
    autoSweet: {
      hint: "\u26A0\uFE0F EXPERIMENTAL: Ascend until 'Sweet' spell appears. No manual shutdown.",
      display: ["Auto Sweet OFF", "Auto Sweet ON"],
      default: 0
    },
    // Dragon options
    dragonOptions: { hint: "Dragon:" },
    autoDragon: {
      hint: "Auto-upgrade dragon.",
      display: ["Dragon Upgrading OFF", "Dragon Upgrading ON"],
      default: 0
    },
    petDragon: {
      hint: "Auto-pet dragon for drops.",
      display: ["Dragon Petting OFF", "Dragon Petting ON"],
      default: 0
    },
    autoDragonToggle: {
      hint: "Auto-set dragon auras.",
      display: ["Dragon Auras OFF", "Dragon Auras ON"],
      default: 0
    },
    dragonNotes: { hint: "Set desired auras. Can't set same aura twice." },
    autoDragonAura0: {
      hint: "Auto-set FIRST dragon aura.",
      display: [
        "No Aura",
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
      hint: "Auto-set SECOND dragon aura.",
      display: [
        "No Aura",
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
      hint: "Auto-sell Yous for GC if Dragon Orbs aura is set and Godzamok is not.",
      display: ["Auto-Dragon Orbs OFF", "Auto-Dragon Orbs ON"],
      default: 0
    },
    orbLimit: {
      hint: "Limit Yous for Dragon Orbs combos.",
      display: ["You Limit OFF", "You Limit ON"],
      default: 0,
      extras: `<a class="option" id="orbMax" onclick="updateOrbMax('orbMax');">\${orbMax} Yous</a>`
    },
    // Season options
    seasonOptions: { hint: "Season:" },
    defaultSeasonToggle: {
      hint: "Auto-switch to selected season if no upgrades needed.",
      display: ["Autobuy Seasons OFF", "Autobuy Seasons ON"],
      default: 0
    },
    defaultSeason: {
      hint: "Select default season.",
      display: [
        "Default Season OFF",
        "Default Season BUSINESS DAY",
        "Default Season CHRISTMAS",
        "Default Season EASTER",
        "Default Season HALLOWEEN",
        "Default Season VALENTINE'S DAY"
      ],
      default: 0
    },
    freeSeason: {
      hint: "Stay in free base season if no upgrades needed.",
      display: [
        "Free Season OFF",
        "Free Season for CHRISTMAS and BUSINESS DAY",
        "Free Season for ALL"
      ],
      default: 1
    },
    autoEaster: {
      hint: "Switch to Easter during Cookie Storm if eggs missing.",
      display: ["Auto-Easter Switch OFF", "Auto-Easter Switch ON"],
      default: 0
    },
    autoHalloween: {
      hint: "Switch to Halloween if wrinklers present and cookies missing.",
      display: ["Auto-Halloween Switch OFF", "Auto-Halloween Switch ON"],
      default: 0
    },
    // Bank options
    bankOptions: { hint: "Bank: (delays autobuy until bank is full)" },
    holdManBank: {
      hint: "Manual minimum bank (minutes of base CpS)",
      display: ["Manual Bank OFF", "Manual Bank ON"],
      default: 0,
      extras: `<a class="option" id="manBankMins" onclick="updateManBank('manBankMins');">\${manBankMins} Minutes</a>`
    },
    holdSEBank: {
      hint: "Keep bank for Spontaneous Edifice.",
      display: ["SE Bank OFF", "SE Bank ON"],
      default: 0
    },
    setHarvestBankPlant: {
      hint: "Keep bank for harvesting selected plant.",
      display: [
        "Harvesting Bank OFF",
        "Harvesting Bank BAKEBERRY",
        "Harvesting Bank CHOCOROOT",
        "Harvesting Bank WHITE CHOCOROOT",
        "Harvesting Bank QUEENBEET",
        "Harvesting Bank DUKETATER",
        "Harvesting Bank CRUMBSPORE",
        "Harvesting Bank DOUGHSHROOM"
      ],
      default: 0
    },
    setHarvestBankType: {
      hint: "Increase bank for plant harvest during CpS buffs.",
      display: [
        "Harvesting during NO CpS MULTIPLIER",
        "Harvesting during FRENZY",
        "Harvesting during BUILDING SPECIAL",
        "Harvesting during FRENZY + BUILDING SPECIAL"
      ],
      default: 0,
      extras: `<a class="option" id="maxSpecials" onclick="updateMaxSpecials('maxSpecials');">\${maxSpecials} Building specials</a>`
    },
    // Other options
    otherOptions: { hint: "Other:" },
    FCshortcuts: {
      hint: "Enable keyboard shortcuts (see readme).",
      display: ["Shortcuts OFF", "Shortcuts ON"],
      default: 1
    },
    simulatedGCPercent: {
      hint: "Assume % of GCs clicked for efficiency (100% recommended).",
      display: ["GC clicked 0%", "GC clicked 100%"],
      default: 1
    },
    // Display options
    displayOptions: { hint: "Display:" },
    showMissedCookies: {
      hint: "Show missed golden cookies in info panel.",
      display: ["Show Missed GCs OFF", "Show Missed GCs ON"],
      default: 0
    },
    numberDisplay: {
      hint: "Change number formatting style.",
      display: [
        "Number Display RAW",
        "Number Display FULL (million, billion)",
        "Number Display INITIALS (M, B)",
        "Number Display SI PREFIXES (M, G, T)",
        "Number Display SCIENTIFIC (6.3e12)"
      ],
      default: 1
    },
    fancyui: {
      hint: "Infobox style (text, wheel, or both).",
      display: ["Infobox OFF", "Infobox TEXT ONLY", "Infobox WHEEL ONLY", "Infobox WHEEL & TEXT"],
      default: 0
    },
    logging: {
      hint: "Log actions to console.",
      display: ["Logging OFF", "Logging ON"],
      default: 1
    },
    purchaseLog: {
      hint: "Log all auto-purchases.",
      display: ["Purchase Log OFF", "Purchase Log ON"],
      default: 0
    },
    slowOptions: { hint: "Warning: These options may slow the game." },
    fpsModifier: {
      hint: "Set game frame rate (default 30).",
      display: [
        "Frame Rate 15 fps",
        "Frame Rate 24 fps",
        "Frame Rate 30 fps",
        "Frame Rate 48 fps",
        "Frame Rate 60 fps",
        "Frame Rate 72 fps",
        "Frame Rate 88 fps",
        "Frame Rate 100 fps",
        "Frame Rate 120 fps",
        "Frame Rate 144 fps",
        "Frame Rate 200 fps",
        "Frame Rate 240 fps",
        "Frame Rate 300 fps",
        "Frame Rate 5 fps",
        "Frame Rate 10 fps"
      ],
      default: 2
    },
    trackStats: {
      hint: "Track CpS/HC for graphs (may slow game).",
      display: [
        "Tracking OFF",
        "Tracking EVERY 60s",
        "Tracking EVERY 30m",
        "Tracking EVERY 1h",
        "Tracking EVERY 24h",
        "Tracking ON UPGRADES",
        "Tracking SMART TIMING"
      ],
      default: 0,
      extras: '<a class="option" id="viewStats" onclick="viewStatGraphs();">View Stat Graphs</a>'
    },
    recommendedSettings: {
      hint: "Set all recommended options (\u26A0\uFE0F reloads game instantly).",
      display: ["Recommended OFF", "Recommended ON"],
      default: 0
    },
    // v2: replaces the 3 manual presetEarlyGame/presetMidGame/presetLateGame toggles - the
    // autopilot detects the stage itself (src/core/ascend.ts gameStage()) and applies the
    // matching settings table (src/core/autopilot.ts) continuously, no reload needed.
    autopilot: {
      hint: "Bot detects game stage and configures itself automatically (no manual presets).",
      display: ["Autopilot OFF", "Autopilot ON"],
      default: 0
    },
    // v2: after every ascend, spend heavenly chips on unlocked prestige upgrades
    // (cheapest-first) automatically - see src/core/heavenlyUpgrades.ts.
    autoBuyHeavenlyUpgrades: {
      hint: "Automatically buy unlocked heavenly upgrades with HC after ascending.",
      display: ["Auto-buy Heavenly Upgrades OFF", "Auto-buy Heavenly Upgrades ON"],
      default: 1
    }
  };
  function installPreferences() {
    FrozenCookies.preferenceValues = preferenceValues;
  }

  // src/main.ts
  var scriptElement = document.getElementById("frozenCookieScript") ?? document.getElementById("modscript_frozen_cookies");
  var baseUrl = scriptElement !== null ? (scriptElement.getAttribute("src") ?? "").replace(/\/frozen_cookies\.js(\?.*)?$/, "") : "https://pc123177.github.io/FrozenCookies/dist";
  var repoRootUrl = baseUrl.replace(/\/dist$/, "");
  var windowWithFc = window;
  windowWithFc.FrozenCookies = {
    baseUrl,
    branch: "erb-",
    version: "2.052.8"
    // Keep in sync with README.md
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
    // upgrade prerequisites, used in fc_main.js
    repoRootUrl + "/src/legacy/fc_main.js",
    // main logic
    repoRootUrl + "/src/legacy/fc_gods.js",
    // gods minigame and dragon options
    repoRootUrl + "/src/legacy/fc_spells.js",
    // spells minigame and autocasting
    repoRootUrl + "/src/legacy/fc_bank.js",
    // bank minigame
    repoRootUrl + "/src/legacy/fc_button.js",
    // button to open the Frozen Cookies menu
    repoRootUrl + "/src/legacy/fc_infobox.js"
    // infobox
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
  var lastCompatibleVersion = 2.052;
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
