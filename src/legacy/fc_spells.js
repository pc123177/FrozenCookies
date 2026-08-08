// @name         Cookie Clicker Prever Feitiço
// @version      0.1
// @author       Random Reddit Guy (SamNosliw, 3pLm1zf1rMD_Xkeo6XHl)
// @match        http://orteil.dashnet.org/cookieclicker/
// @source       https://www.reddit.com/r/CookieClicker/comments/6v2lz3/predict_next_hands_of_faith/
(function () {
    if (Game.ObjectsById[7].minigameLoaded) {
        var lookup = setInterval(function () {
            if (typeof Game.ready !== "undefined" && Game.ready) {
                var CastSpell = document.getElementById("grimoireSpell1");
                CastSpell.onmouseover = function () {
                    Game.tooltip.dynamic = 1;
                    Game.tooltip.draw(
                        this,
                        Game.ObjectsById[7].minigame.spellTooltip(1)() +
                            '<div class="line"></div><div class="description">' +
                            "<b>First Spell:</b> " +
                            nextSpell(0) +
                            "<br />" +
                            "<b>Second Spell:</b> " +
                            nextSpell(1) +
                            "<br />" +
                            "<b>Third Spell:</b> " +
                            nextSpell(2) +
                            "<br />" +
                            "<b>Fourth Spell:</b> " +
                            nextSpell(3) +
                            "</div>",
                        "this"
                    );
                    Game.tooltip.wobble();
                };
                clearInterval(lookup);
            }
        }, 1000);
    }
})();

nextSpell = function (i) {
    if (Game.ObjectsById[7].minigameLoaded) {
        season = Game.season;
        var obj = obj || {};
        M = Game.ObjectsById[7].minigame;
        spell = M.spellsById[1];
        var failChance = M.getFailChance(spell);
        if (typeof obj.failChanceSet !== "undefined")
            failChance = obj.failChanceSet;
        if (typeof obj.failChanceAdd !== "undefined")
            failChance += obj.failChanceAdd;
        if (typeof obj.failChanceMult !== "undefined")
            failChance *= obj.failChanceMult;
        if (typeof obj.failChanceMax !== "undefined")
            failChance = Math.max(failChance, obj.failChanceMax);
        Math.seedrandom(Game.seed + "/" + (M.spellsCastTotal + i));
        var choices = [];
        if (!spell.fail || Math.random() < 1 - failChance) {
            Math.random();
            Math.random();
            if (Game.season == "valentines" || Game.season == "easter") {
                Math.random();
            }
            choices.push(
                '<b style="color:#FFDE5F">Frenzy',
                '<b style="color:#FFDE5F">Lucky'
            );
            if (!Game.hasBuff("Dragonflight"))
                choices.push('<b style="color:#00C4FF">Click Frenzy');
            if (Math.random() < 0.1)
                // Ponderação real do jogo (minigameGrimoire.js spellsById[1].win): insere
                // 'cookie storm' DUAS VEZES e 'blab' uma vez - proporção 2/3 vs 1/3, não três
                // resultados distintos com peso igual. Não existe resultado separado "Cookie Chain"
                // para este feitiço.
                choices.push(
                    '<b style="color:#00C4FF">Cookie Storm',
                    '<b style="color:#00C4FF">Cookie Storm',
                    "Blab"
                );
            if (Game.BuildingsOwned >= 10 && Math.random() < 0.25)
                choices.push('<b style="color:#DAA520">Building Special');
            if (Math.random() < 0.15) choices = ["Cookie Storm (Drop)"];
            if (Math.random() < 0.0001)
                choices.push('<b style="color:#5FFFFC">Sugar Lump');
        } else {
            Math.random();
            Math.random();
            if (Game.season == "valentines" || Game.season == "easter") {
                Math.random();
            }
            choices.push(
                '<b style="color:#FF3605">Clot',
                '<b style="color:#FF3605">Ruin Cookies'
            );
            if (Math.random() < 0.1)
                // Jogo real (minigameGrimoire.js spellsById[1].fail): insere 'cursed
                // finger' e 'blood frenzy' - NÃO 'elder frenzy'. "Elder Frenzy" não existe
                // em nenhum lugar do código-fonte do minigame Grimoire; o nome estava errado aqui,
                // tornando toda verificação nextSpellName(0) == "Elder Frenzy" abaixo inacessível —
                // código morto que nunca disparou para o resultado real de efeito adverso.
                choices.push(
                    '<b style="color:#174F01">Cursed Finger',
                    '<b style="color:#4F0007">Blood Frenzy'
                );
            if (Math.random() < 0.003)
                choices.push('<b style="color:#5FFFFC">Sugar Lump');
            if (Math.random() < 0.1) choices = ["Blab"];
        }
        ret = choose(choices);
        Math.seedrandom();
        return "<small>" + ret + "</b></small>";
    }
};

// MELHORIA: Substituída a comparação frágil de string HTML pela extração de texto DOM.
// Anteriormente, nextSpellName() comparava a saída HTML completa de nextSpell() (ex.:
// '<small><b style="color:#FFDE5F">Frenzy</b></small>') com strings HTML fixas no código.
// Qualquer mudança de espaço em branco ou atualização de CSS em nextSpell() quebraria
// silenciosamente toda a detecção de feitiços e desativaria o lançamento automático.
// Agora extraímos o texto simples do HTML e mapeamos para um nome canônico,
// tornando-o resistente a mudanças de HTML/estilo.
nextSpellName = function (i) {
    if (!Game.ObjectsById[7].minigameLoaded) return null;

    var raw = nextSpell(i);
    if (!raw) return null;

    // Extrai o texto simples da string HTML, ignorando todas as tags e estilos
    var div = document.createElement('div');
    div.innerHTML = raw;
    var text = (div.textContent || div.innerText || '').trim();

    // Normaliza para os nomes canônicos usados em todo o código
    var nameMap = {
        'frenzy':              'Frenzy',
        'lucky':               'Lucky',
        'click frenzy':        'Click Frenzy',
        'cookie storm':        'Cookie Storm',
        'cookie storm (drop)': 'Cookie Storm (Drop)',
        'building special':    'Building Special',
        'blab':                'Blab',
        'ruin cookies':        'Ruin Cookies',
        'clot':                'Clot',
        'cursed finger':       'Cursed Finger',
        'blood frenzy':        'Blood Frenzy',
        'sugar lump':          'Sugar Lump',
    };

    return nameMap[text.toLowerCase()] || text;
};

// MELHORIA: Helper para obter com segurança o tempo restante (em segundos) de qualquer buff.
// Anteriormente, o código acessava Game.hasBuff("X").time diretamente em muitos lugares.
// Se o buff não existisse, Game.hasBuff() retornaria falso e .time lançaria
// "Cannot read property 'time' of null/undefined", travando a lógica de lançamento automático.
// Este helper retorna 0 quando o buff está ausente, tornando todas as verificações de tempo de buff seguras.
// Usado por autoCast(), autoFTHOFComboAction() e auto100ConsistencyComboAction().
function buffTime(name) {
    var b = Game.hasBuff(name);
    return b ? b.time / 30 : 0;
}

// Converte todos os buffs especiais de edifício do jogo em uma única função para verificar se um buff especial de edifício está ativo.
// Usado para lançamento automático de Força do Destino
BuildingSpecialBuff = function () {
    if (
        Game.hasBuff("High-five") ||
        //	Game.hasBuff('Slap to the face') ||
        Game.hasBuff("Congregation") ||
        //	Game.hasBuff('Senility') ||
        Game.hasBuff("Luxuriant harvest") ||
        //	Game.hasBuff('Locusts') ||
        Game.hasBuff("Ore vein") ||
        //	Game.hasBuff('Cave-in') ||
        Game.hasBuff("Oiled-up") ||
        //	Game.hasBuff('Jammed machinery') ||
        Game.hasBuff("Juicy profits") ||
        //	Game.hasBuff('Recession') ||
        Game.hasBuff("Fervent adoration") ||
        //	Game.hasBuff('Crisis of faith') ||
        Game.hasBuff("Manabloom") ||
        //	Game.hasBuff('Magivores') ||
        Game.hasBuff("Delicious lifeforms") ||
        //	Game.hasBuff('Black holes') ||
        Game.hasBuff("Breakthrough") ||
        //	Game.hasBuff('Lab disaster') ||
        Game.hasBuff("Righteous cataclysm") ||
        //	Game.hasBuff('Dimensional calamity') ||
        Game.hasBuff("Golden ages") ||
        //	Game.hasBuff('Time jam') ||
        Game.hasBuff("Extra cycles") ||
        //	Game.hasBuff('Predictable tragedy') ||
        Game.hasBuff("Solar flare") ||
        //	Game.hasBuff('Eclipse') ||
        Game.hasBuff("Winning streak") ||
        //	Game.hasBuff('Dry spell') ||
        Game.hasBuff("Macrocosm") ||
        //	Game.hasBuff('Microcosm') ||
        Game.hasBuff("Refactoring") ||
        //	Game.hasBuff('Antipattern') ||
        Game.hasBuff("Cosmic nursery") ||
        //	Game.hasBuff('Big crunch')) ||
        Game.hasBuff("Brainstorm") ||
        //	Game.hasBuff("Brain freeze") ||
        Game.hasBuff("Deduplication") // ||
        //	Game.hasBuff("Clone strike") ||
    ) {
        return 1;
    } else {
        return 0;
    }
};

// Esta função verifica o tempo restante do buff de edifício dentro da função autoCast()
function BuildingBuffTime() {
    for (var i in Game.buffs) {
        if (Game.buffs[i].type && Game.buffs[i].type.name == "building buff") {
            return Game.buffs[i].time / 30;
        }
    }
    return 0;
}

// Usado em autoCast() para cálculos na sub-rotina inteligente de Força do Destino
function BuffTimeFactor() {
    var DurMod = 1;
    if (Game.Has("Get lucky")) DurMod *= 2;
    if (Game.Has("Lasting fortune")) DurMod *= 1.1;
    if (Game.Has("Lucky digit")) DurMod *= 1.01;
    if (Game.Has("Lucky number")) DurMod *= 1.01;
    if (Game.Has("Green yeast digestives")) DurMod *= 1.01;
    if (Game.Has("Lucky payout")) DurMod *= 1.01;
    DurMod *= 1 + Game.auraMult("Epoch Manipulator") * 0.05;

    if (Game.hasGod) {
        var godLvl = Game.hasGod("decadence");
        if (godLvl == 1) DurMod *= 1.07;
        else if (godLvl == 2) DurMod *= 1.05;
        else if (godLvl == 3) DurMod *= 1.02;
    }

    return DurMod;
}

function autoCast() {
    if (!M) return;
    if (FrozenCookies.autoCasting == 0) return;

    if (
        FrozenCookies.autoFTHOFCombo == 1 ||
        FrozenCookies.auto100ConsistencyCombo == 1 ||
        FrozenCookies.autoSweet == 1
    ) {
        FrozenCookies.autoCasting = 0;
    }

    if (
        (FrozenCookies.towerLimit && M.magic >= M.magicM) ||
        (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)
    ) {
        // Torrão grátis!
        if (
            M.magicM >=
                Math.floor(
                    M.spellsById[1].costMin +
                        M.spellsById[1].costPercent * M.magicM
                ) &&
            nextSpellName(0) == "Sugar Lump"
        ) {
            M.castSpell(M.spellsById[1]);
            logEvent(
                "autoCasting",
                "Lançou Força do Destino para um torrão grátis"
            );
            return;
        }

        // Podemos encurtar um buff negativo com um efeito adverso?
        if (
            M.magicM >=
                Math.floor(
                    M.spellsById[2].costMin +
                        M.spellsById[2].costPercent * M.magicM
                ) &&
            ((cpsBonus() < 7 &&
                (Game.hasBuff("Loan 1 (interest)") ||
                    Game.hasBuff("Loan 2 (interest)") ||
                    Game.hasBuff("Loan 3 (interest)"))) ||
                cpsBonus() < 1) &&
            (nextSpellName(0) == "Clot" || nextSpellName(0) == "Ruin Cookies")
        ) {
            M.castSpell(M.spellsById[2]);
            logEvent("autoCasting", "Lançou Estender o Tempo para encurtar debuff");
            return;
        }

        // Vai causar efeito adverso?
        if (
            M.magicM >=
                Math.floor(
                    M.spellsById[4].costMin +
                        M.spellsById[4].costPercent * M.magicM
                ) &&
            cpsBonus() >= FrozenCookies.minCpSMult &&
            (nextSpellName(0) == "Clot" || nextSpellName(0) == "Ruin Cookies")
        ) {
            M.castSpell(M.spellsById[4]);
            logEvent("autoCasting", "Lançou Amuleto do Regateador para evitar efeito adverso");
            return;
        }

        switch (FrozenCookies.autoCasting) {
            case 1:
                if (
                    M.magicM <
                    Math.floor(
                        M.spellsById[0].costMin +
                            M.spellsById[0].costPercent * M.magicM
                    )
                ) {
                    return;
                }
                M.castSpell(M.spellsById[0]);
                logEvent("autoCasting", "Lançou Conjurar Assados");
                return;

            case 2:
                if (
                    M.magicM <
                    Math.floor(
                        M.spellsById[1].costMin +
                            M.spellsById[1].costPercent * M.magicM
                    )
                ) {
                    return;
                }

                if (cpsBonus() >= FrozenCookies.minCpSMult) {
                    M.castSpell(M.spellsById[1]);
                    logEvent("autoCasting", "Lançou Força do Destino");
                }
                return;

            case 3:
                if (
                    M.magicM <
                    Math.floor(
                        M.spellsById[1].costMin +
                            M.spellsById[1].costPercent * M.magicM
                    )
                ) {
                    return;
                }

                if (
                    !Game.hasBuff("Dragonflight") &&
                    (nextSpellName(0) == "Blab" ||
                        nextSpellName(0) == "Cookie Storm (Drop)")
                ) {
                    M.castSpell(M.spellsById[4]);
                    logEvent(
                        "autoCasting",
                        "Lançou Amuleto do Regateador em vez de Força do Destino"
                    );
                    return;
                }

                if (cpsBonus() >= FrozenCookies.minCpSMult) {
                    if (
                        !Game.hasBuff("Dragonflight") &&
                        nextSpellName(0) == "Lucky"
                    ) {
                        M.castSpell(M.spellsById[1]);
                        logEvent("autoCasting", "Lançou Força do Destino");
                    }

                    if (
                        nextSpellName(0) == "Cookie Storm" ||
                        nextSpellName(0) == "Frenzy" ||
                        nextSpellName(0) == "Building Special"
                    ) {
                        M.castSpell(M.spellsById[1]);
                        logEvent("autoCasting", "Lançou Força do Destino");
                        return;
                    }

                    // MELHORIA: Todos os acessos a .time substituídos pelo helper buffTime()
                    // para evitar travamentos quando um buff não está ativo.
                    if (
                        nextSpellName(0) == "Click Frenzy" &&
                        (((Game.hasAura("Reaper of Fields") ||
                            Game.hasAura("Reality Bending")) &&
                            Game.hasBuff("Dragon Harvest") &&
                            Game.hasBuff("Frenzy") &&
                            buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 &&
                            buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1) ||
                            (!Game.hasAura("Reaper of Fields") &&
                                (Game.hasBuff("Dragon Harvest") ||
                                    Game.hasBuff("Frenzy")) &&
                                (buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 ||
                                    buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1))) &&
                        BuildingSpecialBuff() == 1 &&
                        BuildingBuffTime() >= Math.ceil(13 * BuffTimeFactor())
                    ) {
                        M.castSpell(M.spellsById[1]);
                        logEvent("autoCasting", "Lançou Força do Destino");
                        return;
                    }

                    if (nextSpellName(0) == "Blood Frenzy") {
                        if (Game.Upgrades["Elder Pact"].bought == 1) {
                            if (
                                (Game.hasBuff("Click frenzy") ||
                                    Game.hasBuff("Dragonflight")) &&
                                (buffTime("Click frenzy") >= Math.ceil(6 * BuffTimeFactor()) - 1 ||
                                    buffTime("Dragonflight") >= Math.ceil(6 * BuffTimeFactor()) - 1)
                            ) {
                                M.castSpell(M.spellsById[1]);
                                logEvent(
                                    "autoCasting",
                                    "Lançou Força do Destino"
                                );
                            }
                        } else if (Game.Upgrades["Elder Pact"].bought == 0) {
                            if (
                                (((Game.hasAura("Reaper of Fields") ||
                                    Game.hasAura("Reality Bending")) &&
                                    Game.hasBuff("Dragon Harvest") &&
                                    Game.hasBuff("Frenzy") &&
                                    buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 &&
                                    buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1) ||
                                    (!Game.hasAura("Reaper of Fields") &&
                                        (Game.hasBuff("Dragon Harvest") ||
                                            Game.hasBuff("Frenzy")) &&
                                        (buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 ||
                                            buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1))) &&
                                (Game.hasBuff("Click frenzy") ||
                                    Game.hasBuff("Dragonflight")) &&
                                (buffTime("Click frenzy") >= Math.ceil(6 * BuffTimeFactor()) - 1 ||
                                    buffTime("Dragonflight") >= Math.ceil(6 * BuffTimeFactor()) - 1)
                            ) {
                                M.castSpell(M.spellsById[1]);
                                logEvent(
                                    "autoCasting",
                                    "Lançou Força do Destino"
                                );
                            }
                        }
                        return;
                    }

                    if (
                        nextSpellName(0) == "Cursed Finger" &&
                        (Game.hasBuff("Click frenzy") ||
                            Game.hasBuff("Dragonflight")) &&
                        (buffTime("Click frenzy") >= Math.ceil(10 * BuffTimeFactor()) - 1 ||
                            buffTime("Dragonflight") >= Math.ceil(6 * BuffTimeFactor()) - 1)
                    ) {
                        M.castSpell(M.spellsById[1]);
                        logEvent("autoCasting", "Lançou Força do Destino");
                        return;
                    }
                }
                return;

            case 4:
                if (
                    M.magicM <
                    Math.floor(
                        M.spellsById[1].costMin +
                            M.spellsById[1].costPercent * M.magicM
                    )
                ) {
                    return;
                }

                if (
                    !Game.hasBuff("Dragonflight") &&
                    (nextSpellName(0) == "Blab" ||
                        nextSpellName(0) == "Cookie Storm (Drop)" ||
                        nextSpellName(0) == "Cookie Storm" ||
                        nextSpellName(0) == "Frenzy" ||
                        nextSpellName(0) == "Lucky")
                ) {
                    M.castSpell(M.spellsById[4]);
                    logEvent(
                        "autoCasting",
                        "Lançou Amuleto do Regateador em vez de Força do Destino"
                    );
                }

                if (cpsBonus() >= FrozenCookies.minCpSMult) {
                    if (nextSpellName(0) == "Building Special") {
                        M.castSpell(M.spellsById[1]);
                        logEvent("autoCasting", "Lançou Força do Destino");
                        return;
                    }

                    // MELHORIA: Todos os acessos a .time substituídos pelo helper buffTime() helper
                    if (
                        nextSpellName(0) == "Click Frenzy" &&
                        (((Game.hasAura("Reaper of Fields") ||
                            Game.hasAura("Reality Bending")) &&
                            Game.hasBuff("Dragon Harvest") &&
                            Game.hasBuff("Frenzy") &&
                            buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 &&
                            buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1) ||
                            (!Game.hasAura("Reaper of Fields") &&
                                (Game.hasBuff("Dragon Harvest") ||
                                    Game.hasBuff("Frenzy")) &&
                                (buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 ||
                                    buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1))) &&
                        BuildingSpecialBuff() == 1 &&
                        BuildingBuffTime() >= Math.ceil(13 * BuffTimeFactor())
                    ) {
                        M.castSpell(M.spellsById[1]);
                        logEvent("autoCasting", "Lançou Força do Destino");
                        return;
                    }

                    if (nextSpellName(0) == "Blood Frenzy") {
                        if (Game.Upgrades["Elder Pact"].bought == 1) {
                            if (
                                (Game.hasBuff("Click frenzy") ||
                                    Game.hasBuff("Dragonflight")) &&
                                (buffTime("Click frenzy") >= Math.ceil(6 * BuffTimeFactor()) - 1 ||
                                    buffTime("Dragonflight") >= Math.ceil(6 * BuffTimeFactor()) - 1)
                            ) {
                                M.castSpell(M.spellsById[1]);
                                logEvent(
                                    "autoCasting",
                                    "Lançou Força do Destino"
                                );
                            }
                        } else if (Game.Upgrades["Elder Pact"].bought == 0) {
                            if (
                                (((Game.hasAura("Reaper of Fields") ||
                                    Game.hasAura("Reality Bending")) &&
                                    Game.hasBuff("Dragon Harvest") &&
                                    Game.hasBuff("Frenzy") &&
                                    buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 &&
                                    buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1) ||
                                    (!Game.hasAura("Reaper of Fields") &&
                                        (Game.hasBuff("Dragon Harvest") ||
                                            Game.hasBuff("Frenzy")) &&
                                        (buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 ||
                                            buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1))) &&
                                (Game.hasBuff("Click frenzy") ||
                                    Game.hasBuff("Dragonflight")) &&
                                (buffTime("Click frenzy") >= Math.ceil(6 * BuffTimeFactor()) - 1 ||
                                    buffTime("Dragonflight") >= Math.ceil(6 * BuffTimeFactor()) - 1)
                            ) {
                                M.castSpell(M.spellsById[1]);
                                logEvent(
                                    "autoCasting",
                                    "Lançou Força do Destino"
                                );
                            }
                        }
                        return;
                    }

                    if (
                        nextSpellName(0) == "Cursed Finger" &&
                        (Game.hasBuff("Click frenzy") ||
                            Game.hasBuff("Dragonflight")) &&
                        (buffTime("Click frenzy") >= Math.ceil(10 * BuffTimeFactor()) - 1 ||
                            buffTime("Dragonflight") >= Math.ceil(6 * BuffTimeFactor()) - 1)
                    ) {
                        M.castSpell(M.spellsById[1]);
                        logEvent("autoCasting", "Lançou Força do Destino");
                        return;
                    }
                }
                return;

            case 5:
                if (
                    Game.Objects["You"].amount == 0 ||
                    M.magicM <
                        Math.floor(
                            M.spellsById[3].costMin +
                                M.spellsById[3].costPercent * M.magicM
                        )
                ) {
                    return;
                }

                while (
                    Game.Objects["You"].amount >= 400 ||
                    Game.cookies < Game.Objects["You"].price / 2
                ) {
                    Game.Objects["You"].sell(1);
                    logEvent(
                        "Store",
                        "Vendeu 1 You por " +
                            (Beautify(
                                Game.Objects["You"].price *
                                    Game.Objects["You"].getSellMultiplier()
                            ) +
                                " biscoitos")
                    );
                }
                M.castSpell(M.spellsById[3]);
                logEvent("autoCasting", "Lançou Edifício Espontâneo");
                return;

            case 6:
                if (
                    M.magicM <
                    Math.floor(
                        M.spellsById[4].costMin +
                            M.spellsById[4].costPercent * M.magicM
                    )
                ) {
                    return;
                }
                M.castSpell(M.spellsById[4]);
                logEvent("autoCasting", "Lançou Amuleto do Regateador");
                return;
        }
    }
}

function autoFTHOFComboAction() {
    if (!M) return;
    if (FrozenCookies.autoFTHOFCombo == 0) return;

    if (Game.Objects["Wizard tower"].level > 10) {
        FrozenCookies.autoFTHOFCombo = 0;
        logEvent(
            "autoFTHOFCombo",
            "Combo desativado, nível da torre de feiticeiros alto demais"
        );
        return;
    }

    if (
        FrozenCookies.auto100ConsistencyCombo == 1 ||
        FrozenCookies.autoSweet == 1
    ) {
        FrozenCookies.autoFTHOFCombo = 0;
    }

    if (typeof autoFTHOFComboAction.state == "undefined")
        autoFTHOFComboAction.state = 0;
    if (typeof autoFTHOFComboAction.count == "undefined")
        autoFTHOFComboAction.count = 0;

    if (
        autoFTHOFComboAction.state > 3 ||
        (autoFTHOFComboAction.state > 2 &&
            ((FrozenCookies.towerLimit && M.magic >= M.magicM) ||
                (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)) &&
            !Game.hasBuff("Click frenzy") &&
            nextSpellName(0) != "Click Frenzy" &&
            nextSpellName(1) != "Click Frenzy")
    ) {
        if (autoFTHOFComboAction.autobuyyes == 1) {
            FrozenCookies.autoBuy = 1;
            autoFTHOFComboAction.autobuyyes = 0;
        }
        autoFTHOFComboAction.state = 0;
        logEvent("autoFTHOFCombo", "Falha suave, o combo de feitiços foi perdido");
    }

    if (
        !autoFTHOFComboAction.state &&
        ((nextSpellName(0) == "Click Frenzy" &&
            nextSpellName(1) == "Building Special") ||
            (nextSpellName(1) == "Click Frenzy" &&
                nextSpellName(0) == "Building Special") ||
            (nextSpellName(0) == "Click Frenzy" &&
                nextSpellName(1) == "Blood Frenzy") ||
            (nextSpellName(1) == "Click Frenzy" &&
                nextSpellName(0) == "Blood Frenzy"))
    ) {
        autoFTHOFComboAction.state = 1;
    }
    if (
        !autoFTHOFComboAction.state &&
        nextSpellName(0) == "Building Special" &&
        nextSpellName(1) == "Building Special"
    ) {
        autoFTHOFComboAction.state = 2;
    }

    if (
        !autoFTHOFComboAction.state &&
        ((FrozenCookies.towerLimit && M.magic >= M.magicM) ||
            (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1))
    ) {
        if (nextSpellName(0) == "Sugar Lump") {
            M.castSpell(M.spellsById[1]);
            logEvent("autoFTHOFCombo", "Lançou Força do Destino");
        } else if (
            cpsBonus() < 1 &&
            (nextSpellName(0) == "Clot" || nextSpellName(0) == "Ruin Cookies")
        ) {
            M.castSpell(M.spellsById[2]);
            logEvent("autoFTHOFCombo", "Lançou Estender o Tempo em vez de FTHOF");
        } else {
            M.castSpell(M.spellsById[4]);
            logEvent("autoFTHOFCombo", "Lançou Amuleto do Regateador em vez de FTHOF");
        }
    }

    var SugarLevel = Game.Objects["Wizard tower"].level;

    // MELHORIA: Todos os acessos a .time na máquina de estados do combo substituídos por buffTime()
    switch (autoFTHOFComboAction.state) {
        case 0:
            return;
        case 1:
            if (
                nextSpellName(0) != "Click Frenzy" &&
                nextSpellName(1) != "Click Frenzy"
            ) {
                autoFTHOFComboAction.state = 0;
                return;
            }
            if (
                ((FrozenCookies.towerLimit && M.magic >= M.magicM) ||
                    (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)) &&
                cpsBonus() >= FrozenCookies.minCpSMult &&
                (((Game.hasAura("Reaper of Fields") ||
                    Game.hasAura("Reality Bending")) &&
                    Game.hasBuff("Dragon Harvest") &&
                    Game.hasBuff("Frenzy") &&
                    buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 &&
                    buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1) ||
                    (!Game.hasAura("Reaper of Fields") &&
                        (Game.hasBuff("Dragon Harvest") ||
                            Game.hasBuff("Frenzy")) &&
                        (buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 ||
                            buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1))) &&
                BuildingSpecialBuff() == 1 &&
                BuildingBuffTime() >= Math.ceil(13 * BuffTimeFactor())
            ) {
                switch (SugarLevel) {
                    case 0: return;
                    case 1: if (M.magic >= 81) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 21; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 2: if (M.magic >= 81) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 14; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 3: if (M.magic >= 81) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 8; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 4: if (M.magic >= 81) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 3; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 5: if (M.magic >= 83) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 6: if (M.magic >= 88) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 7: if (M.magic >= 91) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 8: if (M.magic >= 93) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 9: if (M.magic >= 96) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 10: if (M.magic >= 98) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                }
            }
            return;
        case 2:
            if (
                nextSpellName(0) != "Building Special" &&
                nextSpellName(1) != "Building Special"
            ) {
                autoFTHOFComboAction.state = 0;
                return;
            }
            if (
                ((FrozenCookies.towerLimit && M.magic >= M.magicM) ||
                    (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)) &&
                cpsBonus() >= FrozenCookies.minCpSMult &&
                (((Game.hasAura("Reaper of Fields") ||
                    Game.hasAura("Reality Bending")) &&
                    Game.hasBuff("Dragon Harvest") &&
                    Game.hasBuff("Frenzy") &&
                    buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 &&
                    buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1) ||
                    (!Game.hasAura("Reaper of Fields") &&
                        (Game.hasBuff("Dragon Harvest") ||
                            Game.hasBuff("Frenzy")) &&
                        (buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 ||
                            buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1))) &&
                (Game.hasBuff("Click frenzy") ||
                    Game.hasBuff("Dragonflight")) &&
                (buffTime("Click frenzy") >= Math.ceil(10 * BuffTimeFactor()) - 1 ||
                    buffTime("Dragonflight") >= Math.ceil(6 * BuffTimeFactor()) - 1)
            ) {
                switch (SugarLevel) {
                    case 0: return;
                    case 1: if (M.magic >= 81) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 21; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 2: if (M.magic >= 81) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 14; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 3: if (M.magic >= 81) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 8; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 4: if (M.magic >= 81) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 3; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 5: if (M.magic >= 83) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 6: if (M.magic >= 88) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 7: if (M.magic >= 91) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 8: if (M.magic >= 93) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 9: if (M.magic >= 96) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                    case 10: if (M.magic >= 98) { autoFTHOFComboAction.count = Game.Objects["Wizard tower"].amount - 1; M.castSpell(M.spellsById[1]); logEvent("autoFTHOFCombo", "Lançou o primeiro Força do Destino"); autoFTHOFComboAction.state = 3; } return;
                }
            }
            return;
        case 3:
            if (FrozenCookies.autoBuy == 1) {
                autoFTHOFComboAction.autobuyyes = 1;
                FrozenCookies.autoBuy = 0;
            } else {
                autoFTHOFComboAction.autobuyyes = 0;
            }
            if (Game.buyMode == -1) Game.buyMode = 1;
            Game.Objects["Wizard tower"].sell(autoFTHOFComboAction.count);
            M.computeMagicM();
            M.castSpell(M.spellsById[1]);
            logEvent("autoFTHOFCombo", "Lançou Força do Destino duas vezes");
            if (
                FrozenCookies.towerLimit &&
                FrozenCookies.manaMax <= 100 &&
                autoFTHOFComboAction.count <= 497
            ) {
                safeBuy(Game.Objects["Wizard tower"], autoFTHOFComboAction.count);
            } else if (
                FrozenCookies.towerLimit &&
                FrozenCookies.manaMax <= 100 &&
                SugarLevel == 10
            ) {
                safeBuy(Game.Objects["Wizard tower"], 486);
            } else {
                safeBuy(Game.Objects["Wizard tower"], autoFTHOFComboAction.count);
            }
            FrozenCookies.autobuyCount += 1;
            if (autoFTHOFComboAction.autobuyyes == 1) {
                FrozenCookies.autoBuy = 1;
                autoFTHOFComboAction.autobuyyes = 0;
            }
            autoFTHOFComboAction.count = 0;
            autoFTHOFComboAction.state = 0;
            return;
    }
    return;
}

function auto100ConsistencyComboAction() {
    if (!M) return;
    if (!G) return;
    if (FrozenCookies.auto100ConsistencyCombo == 0) return;

    if (Game.Objects["Wizard tower"].level != 10) {
        FrozenCookies.auto100ConsistencyCombo = 0;
        logEvent("auto100ConsistencyCombo", "Combo desativado, impossível");
        return;
    }

    if (FrozenCookies.autoSweet == 1) FrozenCookies.auto100ConsistencyCombo = 0;

    if (Game.dragonLevel < 27) return;

    if (typeof auto100ConsistencyComboAction.state == "undefined")
        auto100ConsistencyComboAction.state = 0;
    if (typeof auto100ConsistencyComboAction.countFarm == "undefined")
        auto100ConsistencyComboAction.countFarm = 0;
    if (typeof auto100ConsistencyComboAction.countMine == "undefined")
        auto100ConsistencyComboAction.countMine = 0;
    if (typeof auto100ConsistencyComboAction.countFactory == "undefined")
        auto100ConsistencyComboAction.countFactory = 0;
    if (typeof auto100ConsistencyComboAction.countBank == "undefined")
        auto100ConsistencyComboAction.countBank = 0;
    if (typeof auto100ConsistencyComboAction.countTemple == "undefined")
        auto100ConsistencyComboAction.countTemple = 0;
    if (typeof auto100ConsistencyComboAction.countWizard == "undefined")
        auto100ConsistencyComboAction.countWizard = 0;
    if (typeof auto100ConsistencyComboAction.countShipment == "undefined")
        auto100ConsistencyComboAction.countShipment = 0;
    if (typeof auto100ConsistencyComboAction.countAlchemy == "undefined")
        auto100ConsistencyComboAction.countAlchemy = 0;
    if (typeof auto100ConsistencyComboAction.countTimeMach == "undefined")
        auto100ConsistencyComboAction.countTimeMach = 0;
    if (typeof auto100ConsistencyComboAction.countAntiMatter == "undefined")
        auto100ConsistencyComboAction.countAntiMatter = 0;

    if (
        auto100ConsistencyComboAction.state > 20 ||
        (((auto100ConsistencyComboAction.state < 2 &&
            (auto100ConsistencyComboAction.autobuyyes == 1 ||
                auto100ConsistencyComboAction.autogcyes == 1 ||
                auto100ConsistencyComboAction.autogsyes == 1 ||
                auto100ConsistencyComboAction.autogodyes == 1 ||
                auto100ConsistencyComboAction.autodragonyes == 1 ||
                auto100ConsistencyComboAction.autoworshipyes == 1)) ||
            (auto100ConsistencyComboAction.state > 1 &&
                !BuildingSpecialBuff() &&
                !hasClickBuff())) &&
            ((FrozenCookies.towerLimit && M.magic >= M.magicM) ||
                (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)))
    ) {
        if (auto100ConsistencyComboAction.autobuyyes == 1) { FrozenCookies.autoBuy = 1; auto100ConsistencyComboAction.autobuyyes = 0; }
        if (auto100ConsistencyComboAction.autogcyes == 1) { FrozenCookies.autoGC = 1; auto100ConsistencyComboAction.autogcyes = 0; }
        if (auto100ConsistencyComboAction.autogsyes == 1) { FrozenCookies.autoGS = 1; auto100ConsistencyComboAction.autogsyes = 0; }
        if (auto100ConsistencyComboAction.autogodyes == 1) { FrozenCookies.autoGodzamok = 1; auto100ConsistencyComboAction.autogodyes = 0; }
        if (auto100ConsistencyComboAction.autodragonyes == 1) { FrozenCookies.autoDragonToggle = 1; auto100ConsistencyComboAction.autodragonyes = 0; }
        if (auto100ConsistencyComboAction.autoworshipyes == 1) { FrozenCookies.autoWorshipToggle = 1; auto100ConsistencyComboAction.autoworshipyes = 0; }
        auto100ConsistencyComboAction.state = 0;
        logEvent("auto100ConsistencyCombo", "Tentando recuperar de falha suave");
    }

    if (
        !auto100ConsistencyComboAction.state &&
        M.magicM >= 98 &&
        ((nextSpellName(0) == "Click Frenzy" && nextSpellName(1) == "Building Special") ||
            (nextSpellName(1) == "Click Frenzy" && nextSpellName(0) == "Building Special") ||
            (nextSpellName(0) == "Click Frenzy" && nextSpellName(1) == "Blood Frenzy") ||
            (nextSpellName(1) == "Click Frenzy" && nextSpellName(0) == "Blood Frenzy"))
    ) {
        auto100ConsistencyComboAction.state = 1;
    }

    auto100ConsistencyComboAction.countFarm = Game.Objects["Farm"].amount - 1;
    auto100ConsistencyComboAction.countMine = Game.Objects["Mine"].amount;
    auto100ConsistencyComboAction.countFactory = Game.Objects["Factory"].amount;
    auto100ConsistencyComboAction.countBank = Game.Objects["Bank"].amount - 1;
    auto100ConsistencyComboAction.countTemple = Game.Objects["Temple"].amount - 1;
    auto100ConsistencyComboAction.countWizard = Game.Objects["Wizard tower"].amount - 1;
    auto100ConsistencyComboAction.countShipment = Game.Objects["Shipment"].amount;
    auto100ConsistencyComboAction.countAlchemy = Game.Objects["Alchemy lab"].amount;
    auto100ConsistencyComboAction.countTimeMach = Game.Objects["Time machine"].amount;
    auto100ConsistencyComboAction.countAntiMatter = Game.Objects["Antimatter condenser"].amount;

    if (
        !auto100ConsistencyComboAction.state &&
        ((FrozenCookies.towerLimit && M.magic >= M.magicM) ||
            (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1))
    ) {
        if (nextSpellName(0) == "Sugar Lump") {
            M.castSpell(M.spellsById[1]);
            logEvent("auto100ConsistencyCombo", "Lançou Força do Destino");
        } else if (
            cpsBonus() < 1 &&
            (nextSpellName(0) == "Clot" || nextSpellName(0) == "Ruin Cookies")
        ) {
            M.castSpell(M.spellsById[2]);
            logEvent("auto100ConsistencyCombo", "Lançou Estender o Tempo em vez de FTHOF");
        } else {
            M.castSpell(M.spellsById[4]);
            logEvent("auto100ConsistencyCombo", "Lançou Amuleto do Regateador em vez de FTHOF");
        }
    }

    // MELHORIA: Todos os acessos a .time na máquina de estados do combo substituídos por buffTime()
    switch (auto100ConsistencyComboAction.state) {
        case 0: return;

        case 1:
            if (
                ((FrozenCookies.towerLimit && M.magic >= M.magicM) ||
                    (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)) &&
                cpsBonus() >= FrozenCookies.minCpSMult &&
                (((Game.hasAura("Reaper of Fields") || Game.hasAura("Reality Bending")) &&
                    Game.hasBuff("Dragon Harvest") && Game.hasBuff("Frenzy") &&
                    buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 &&
                    buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1) ||
                    (!Game.hasAura("Reaper of Fields") &&
                        (Game.hasBuff("Dragon Harvest") || Game.hasBuff("Frenzy")) &&
                        (buffTime("Dragon Harvest") >= Math.ceil(13 * BuffTimeFactor()) - 1 ||
                            buffTime("Frenzy") >= Math.ceil(13 * BuffTimeFactor()) - 1))) &&
                BuildingSpecialBuff() == 1 &&
                BuildingBuffTime() >= Math.ceil(13 * BuffTimeFactor())
            ) {
                if (FrozenCookies.autoBuy == 1) { auto100ConsistencyComboAction.autobuyyes = 1; FrozenCookies.autoBuy = 0; } else { auto100ConsistencyComboAction.autobuyyes = 0; }
                if (FrozenCookies.autoDragonToggle == 1) { auto100ConsistencyComboAction.autodragonyes = 1; FrozenCookies.autoDragonToggle = 0; } else { auto100ConsistencyComboAction.autodragonyes = 0; }
                if (FrozenCookies.autoWorshipToggle == 1) { auto100ConsistencyComboAction.autoworshipyes = 1; FrozenCookies.autoWorshipToggle = 0; } else { auto100ConsistencyComboAction.autoworshipyes = 0; }
                logEvent("auto100ConsistencyCombo", "Iniciando combo");
                auto100ConsistencyComboAction.state = 2;
            }
            return;

        case 2:
            if (FrozenCookies.autoGC > 0) { auto100ConsistencyComboAction.autogcyes = 1; FrozenCookies.autoGC = 0; } else { auto100ConsistencyComboAction.autogcyes = 0; }
            if (FrozenCookies.autoGS > 0) { auto100ConsistencyComboAction.autogsyes = 1; FrozenCookies.autoGS = 0; } else { auto100ConsistencyComboAction.autogsyes = 0; }
            auto100ConsistencyComboAction.state = 3;
            return;

        case 3:
            if (G.plantsById[14].unlocked == 0) {
                var whisk = false;
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < 6; j++) {
                        if (G.plot[i][j][0] - 1 === 14) { whisk = true; }
                    }
                }
                if (whisk) {
                    auto100ConsistencyComboAction.state = 4;
                } else {
                    G.harvestAll();
                    for (var y = 0; y <= 5; y++) {
                        for (var x = 0; x <= 5; x++) {
                            if (G.canPlant(G.plantsById[14])) {
                                G.seedSelected = G.plants["whiskerbloom"].id;
                                G.clickTile(x, y);
                            }
                        }
                    }
                    auto100ConsistencyComboAction.state = 4;
                }
            } else {
                auto100ConsistencyComboAction.state = 4;
            }
            return;

        case 4:
            // CORREÇÃO: era `!Game.dragonAura2 == 15` - `!` tem precedência maior que `==`, então isso
            // comparava um booleano com 15 e era sempre falso, tornando o ramo de evitar conflito
            // código morto (apenas o fallback else-if executava). Mesmo bug no próximo par.
            if (Game.dragonAura == 16 && Game.dragonAura2 != 15) { Game.specialTab = "dragon"; Game.SetDragonAura(15, 1); Game.ConfirmPrompt(); }
            else if (!Game.hasAura("Radiant Appetite")) { Game.specialTab = "dragon"; Game.SetDragonAura(15, 0); Game.ConfirmPrompt(); }
            if (Game.dragonAura2 == 15 && Game.dragonAura != 16) { Game.specialTab = "dragon"; Game.SetDragonAura(16, 0); Game.ConfirmPrompt(); }
            else if (!Game.hasAura("Dragon's Fortune")) { Game.specialTab = "dragon"; Game.SetDragonAura(16, 1); Game.ConfirmPrompt(); }
            auto100ConsistencyComboAction.state = 5;
            return;

        case 5:
            if (Game.Upgrades["Golden switch [off]"].unlocked && !Game.Upgrades["Golden switch [off]"].bought) {
                Game.Upgrades["Golden switch [off]"].buy();
            }
            auto100ConsistencyComboAction.state = 6;
            return;

        case 6:
            if ((FrozenCookies.towerLimit && M.magic >= M.magicM) || (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)) {
                M.castSpell(M.spellsById[1]);
                logEvent("auto100ConsistencyCombo", "Lançou FTHOF 1");
                auto100ConsistencyComboAction.state = 7;
            }
            return;

        case 7:
            Game.Objects["Wizard tower"].sell(auto100ConsistencyComboAction.countWizard);
            M.computeMagicM();
            if (M.magic >= 30) {
                M.castSpell(M.spellsById[1]);
                logEvent("auto100ConsistencyCombo", "Lançou FTHOF 2");
                Game.Objects["Wizard tower"].buy(auto100ConsistencyComboAction.countWizard);
                FrozenCookies.autobuyCount += 1;
                auto100ConsistencyComboAction.state = 8;
            }
            return;

        case 8:
            M.lumpRefill.click();
            Game.ConfirmPrompt();
            auto100ConsistencyComboAction.state = 9;
            return;

        case 9:
            if ((FrozenCookies.towerLimit && M.magic >= M.magicM) || (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)) {
                M.castSpell(M.spellsById[1]);
                logEvent("auto100ConsistencyCombo", "Lançou FTHOF 3");
                auto100ConsistencyComboAction.state = 10;
            }
            return;

        case 10:
            Game.Objects["Wizard tower"].sell(auto100ConsistencyComboAction.countWizard);
            M.computeMagicM();
            if (M.magic >= 30) {
                M.castSpell(M.spellsById[1]);
                logEvent("auto100ConsistencyCombo", "Lançou FTHOF 4");
                Game.Objects["Wizard tower"].buy(auto100ConsistencyComboAction.countWizard);
                FrozenCookies.autobuyCount += 1;
                auto100ConsistencyComboAction.state = 11;
            }
            return;

        case 11:
            if (FrozenCookies.autoGodzamok > 0) { auto100ConsistencyComboAction.autogodyes = 1; FrozenCookies.autoGodzamok = 0; } else { auto100ConsistencyComboAction.autogodyes = 0; }
            auto100ConsistencyComboAction.state = 12;
            return;

        case 12:
            while (Game.shimmers.length) Game.shimmers[0].pop();
            auto100ConsistencyComboAction.state = 13;
            return;

        case 13:
            if (!Game.hasGod("ruin") && T.swaps >= 1) swapIn(2, 0);
            Game.Objects["Farm"].sell(auto100ConsistencyComboAction.countFarm);
            Game.Objects["Mine"].sell(auto100ConsistencyComboAction.countMine);
            Game.Objects["Factory"].sell(auto100ConsistencyComboAction.countFactory);
            Game.Objects["Bank"].sell(auto100ConsistencyComboAction.countBank);
            Game.Objects["Temple"].sell(auto100ConsistencyComboAction.countTemple);
            Game.Objects["Shipment"].sell(auto100ConsistencyComboAction.countShipment);
            Game.Objects["Alchemy lab"].sell(auto100ConsistencyComboAction.countAlchemy);
            Game.Objects["Time machine"].sell(auto100ConsistencyComboAction.countTimeMach);
            auto100ConsistencyComboAction.state = 14;
            return;

        case 14:
            if (!Game.hasGod("mother") && T.swaps >= 1) { swapIn(8, 1); }
            auto100ConsistencyComboAction.state = 15;
            return;

        case 15:
            safeBuy(Game.Objects["Farm"], auto100ConsistencyComboAction.countFarm);
            safeBuy(Game.Objects["Mine"], auto100ConsistencyComboAction.countMine);
            safeBuy(Game.Objects["Factory"], auto100ConsistencyComboAction.countFactory);
            safeBuy(Game.Objects["Bank"], auto100ConsistencyComboAction.countBank);
            safeBuy(Game.Objects["Temple"], auto100ConsistencyComboAction.countTemple);
            safeBuy(Game.Objects["Shipment"], auto100ConsistencyComboAction.countShipment);
            safeBuy(Game.Objects["Alchemy lab"], auto100ConsistencyComboAction.countAlchemy);
            safeBuy(Game.Objects["Time machine"], auto100ConsistencyComboAction.countTimeMach);
            FrozenCookies.autobuyCount += 1;
            auto100ConsistencyComboAction.state = 16;
            return;

        case 16:
            for (var i in Game.shimmers) {
                if (Game.shimmers[i].type == "golden" && Game.shimmer.wrath != 1) {
                    Game.shimmers[i].pop();
                }
            }
            auto100ConsistencyComboAction.state = 17;
            return;

        case 17:
            if (!Game.hasBuff("Devastation") && !Game.hasBuff("Cursed finger") && hasClickBuff()) {
                if (Game.Objects["Farm"].amount >= 10) {
                    Game.Objects["Farm"].sell(auto100ConsistencyComboAction.countFarm);
                    Game.Objects["Mine"].sell(auto100ConsistencyComboAction.countMine);
                    Game.Objects["Factory"].sell(auto100ConsistencyComboAction.countFactory);
                    Game.Objects["Bank"].sell(auto100ConsistencyComboAction.countBank);
                    Game.Objects["Temple"].sell(auto100ConsistencyComboAction.countTemple);
                    Game.Objects["Shipment"].sell(auto100ConsistencyComboAction.countShipment);
                    Game.Objects["Alchemy lab"].sell(auto100ConsistencyComboAction.countAlchemy);
                    Game.Objects["Time machine"].sell(auto100ConsistencyComboAction.countTimeMach);
                }
                if (Game.Objects["Farm"].amount < 10) {
                    safeBuy(Game.Objects["Farm"], auto100ConsistencyComboAction.countFarm - Game.Objects["Farm"].amount);
                    safeBuy(Game.Objects["Mine"], auto100ConsistencyComboAction.countMine - Game.Objects["Mine"].amount);
                    safeBuy(Game.Objects["Factory"], auto100ConsistencyComboAction.countFactory - Game.Objects["Factory"].amount);
                    safeBuy(Game.Objects["Bank"], auto100ConsistencyComboAction.countBank - Game.Objects["Bank"].amount);
                    safeBuy(Game.Objects["Temple"], auto100ConsistencyComboAction.countTemple - Game.Objects["Temple"].amount);
                    safeBuy(Game.Objects["Shipment"], auto100ConsistencyComboAction.countShipment - Game.Objects["Shipment"].amount);
                    safeBuy(Game.Objects["Alchemy lab"], auto100ConsistencyComboAction.countAlchemy - Game.Objects["Alchemy lab"].amount);
                    safeBuy(Game.Objects["Time machine"], auto100ConsistencyComboAction.countTimeMach - Game.Objects["Time machine"].amount);
                    FrozenCookies.autobuyCount += 1;
                }
            }
            if (Game.hasBuff("Devastation") && hasClickBuff()) {
                if (Game.Objects["Farm"].amount < auto100ConsistencyComboAction.countFarm) safeBuy(Game.Objects["Farm"], auto100ConsistencyComboAction.countFarm - Game.Objects["Farm"].amount);
                if (Game.Objects["Mine"].amount < auto100ConsistencyComboAction.countMine) safeBuy(Game.Objects["Mine"], auto100ConsistencyComboAction.countMine - Game.Objects["Mine"].amount);
                if (Game.Objects["Factory"].amount < auto100ConsistencyComboAction.countFactory) safeBuy(Game.Objects["Factory"], auto100ConsistencyComboAction.countFactory - Game.Objects["Factory"].amount);
                if (Game.Objects["Bank"].amount < auto100ConsistencyComboAction.countBank) safeBuy(Game.Objects["Bank"], auto100ConsistencyComboAction.countBank - Game.Objects["Bank"].amount);
                if (Game.Objects["Temple"].amount < auto100ConsistencyComboAction.countTemple) safeBuy(Game.Objects["Temple"], auto100ConsistencyComboAction.countTemple - Game.Objects["Temple"].amount);
                if (Game.Objects["Shipment"].amount < auto100ConsistencyComboAction.countShipment) safeBuy(Game.Objects["Shipment"], auto100ConsistencyComboAction.countShipment - Game.Objects["Shipment"].amount);
                if (Game.Objects["Alchemy lab"].amount < auto100ConsistencyComboAction.countAlchemy) safeBuy(Game.Objects["Alchemy lab"], auto100ConsistencyComboAction.countAlchemy - Game.Objects["Alchemy lab"].amount);
                if (Game.Objects["Time machine"].amount < auto100ConsistencyComboAction.countTimeMach) safeBuy(Game.Objects["Time machine"], auto100ConsistencyComboAction.countTimeMach - Game.Objects["Time machine"].amount);
                FrozenCookies.autobuyCount += 1;
            }
            if (!hasClickBuff()) auto100ConsistencyComboAction.state = 18;
            return;

        case 18:
            if (!Game.hasBuff("Click frenzy") && !goldenCookieLife()) {
                if (Game.Upgrades["Golden switch [on]"].unlocked && !Game.Upgrades["Golden switch [on]"].bought) {
                    Game.recalculateGains = 1;
                    Game.Upgrades["Golden switch [on]"].buy();
                }
                if (auto100ConsistencyComboAction.autogcyes == 1) { FrozenCookies.autoGC = 1; auto100ConsistencyComboAction.autogcyes = 0; }
                if (auto100ConsistencyComboAction.autogsyes == 1) { FrozenCookies.autoGS = 1; auto100ConsistencyComboAction.autogsyes = 0; }
                auto100ConsistencyComboAction.state = 19;
            }
            return;

        case 19:
            if (Game.Objects["Farm"].amount < auto100ConsistencyComboAction.countFarm) safeBuy(Game.Objects["Farm"], auto100ConsistencyComboAction.countFarm - Game.Objects["Farm"].amount);
            if (Game.Objects["Mine"].amount < auto100ConsistencyComboAction.countMine) safeBuy(Game.Objects["Mine"], auto100ConsistencyComboAction.countMine - Game.Objects["Mine"].amount);
            if (Game.Objects["Factory"].amount < auto100ConsistencyComboAction.countFactory) safeBuy(Game.Objects["Factory"], auto100ConsistencyComboAction.countFactory - Game.Objects["Factory"].amount);
            if (Game.Objects["Bank"].amount < auto100ConsistencyComboAction.countBank) safeBuy(Game.Objects["Bank"], auto100ConsistencyComboAction.countBank - Game.Objects["Bank"].amount);
            if (Game.Objects["Temple"].amount < auto100ConsistencyComboAction.countTemple) safeBuy(Game.Objects["Temple"], auto100ConsistencyComboAction.countTemple - Game.Objects["Temple"].amount);
            if (Game.Objects["Shipment"].amount < auto100ConsistencyComboAction.countShipment) safeBuy(Game.Objects["Shipment"], auto100ConsistencyComboAction.countShipment - Game.Objects["Shipment"].amount);
            if (Game.Objects["Alchemy lab"].amount < auto100ConsistencyComboAction.countAlchemy) safeBuy(Game.Objects["Alchemy lab"], auto100ConsistencyComboAction.countAlchemy - Game.Objects["Alchemy lab"].amount);
            if (Game.Objects["Time machine"].amount < auto100ConsistencyComboAction.countTimeMach) safeBuy(Game.Objects["Time machine"], auto100ConsistencyComboAction.countTimeMach - Game.Objects["Time machine"].amount);
            if (Game.Objects["Antimatter condenser"].amount < auto100ConsistencyComboAction.countAntiMatter) safeBuy(Game.Objects["Antimatter condenser"], auto100ConsistencyComboAction.countAntiMatter - Game.Objects["Antimatter condenser"].amount);
            FrozenCookies.autobuyCount += 1;
            auto100ConsistencyComboAction.state = 20;
            return;

        case 20:
            if (auto100ConsistencyComboAction.autobuyyes == 1) { FrozenCookies.autoBuy = 1; auto100ConsistencyComboAction.autobuyyes = 0; }
            if (auto100ConsistencyComboAction.autogodyes == 1) { FrozenCookies.autoGodzamok = 1; auto100ConsistencyComboAction.autogodyes = 0; }
            if (auto100ConsistencyComboAction.autodragonyes == 1) { FrozenCookies.autoDragonToggle = 1; auto100ConsistencyComboAction.autodragonyes = 0; }
            if (auto100ConsistencyComboAction.autoworshipyes == 1) { FrozenCookies.autoWorshipToggle = 1; auto100ConsistencyComboAction.autoworshipyes = 0; }
            logEvent("auto100ConsistencyCombo", "Combo concluído");
            auto100ConsistencyComboAction.state = 0;
            return;
    }
    return;
}

function autoSweetAction() {
    if (!FrozenCookies.autoSweet) return;

    if (FrozenCookies.autoBuy == 1) {
        autoSweetAction.autobuyyes = 1;
        FrozenCookies.autoBuy = 0;
    } else {
        autoSweetAction.autobuyyes = 0;
    }

    if (typeof Game.ready !== "undefined" && Game.ready) {
        if (typeof autoSweetAction.state == "undefined")
            autoSweetAction.state = 0;

        if (!autoSweetAction.state) {
            if (
                nextSpellName(0) == "Sugar Lump" || nextSpellName(1) == "Sugar Lump" ||
                nextSpellName(2) == "Sugar Lump" || nextSpellName(3) == "Sugar Lump" ||
                nextSpellName(4) == "Sugar Lump" || nextSpellName(5) == "Sugar Lump" ||
                nextSpellName(6) == "Sugar Lump" || nextSpellName(7) == "Sugar Lump" ||
                nextSpellName(8) == "Sugar Lump" || nextSpellName(9) == "Sugar Lump"
            ) {
                autoSweetAction.state = 1;
            }
        }

        if (!autoSweetAction.state && !Game.OnAscend && !Game.AscendTimer) {
            logEvent("autoSweet", 'Nenhum "Sweet" detectado, ascendendo');
            Game.Reincarnate(1);
        }

        switch (autoSweetAction.state) {
            case 0: return;
            case 1:
                if (FrozenCookies.towerLimit) {
                    autoSweetAction.manaPrev = FrozenCookies.manaMax;
                    FrozenCookies.manaMax = 37;
                }
                if (
                    (FrozenCookies.towerLimit && M.magic >= M.magicM) ||
                    (!FrozenCookies.towerLimit && M.magic >= M.magicM - 1)
                ) {
                    if (nextSpellName(0) != "Sugar Lump") {
                        M.castSpell(M.spellsById[4]);
                        logEvent("autoSweet", "Lançou Amuleto do Regateador enquanto aguarda 'Sweet'");
                    }
                    if (nextSpellName(0) == "Sugar Lump") {
                        M.castSpell(M.spellsById[1]);
                        autoSweetAction.state = 0;
                        logEvent("autoSweet", "Torrão de Açúcar obtido! Desativando Auto Sweet");
                        if (autoSweetAction.manaPrev != -1)
                            FrozenCookies.manaMax = autoSweetAction.manaPrev;
                        if (autoSweetAction.autobuyyes == 1) {
                            FrozenCookies.autoBuy = 1;
                            autoSweetAction.autobuyyes = 0;
                        }
                        FrozenCookies.autoSweet = 0;
                    }
                }
                return;
        }
        return;
    }
}

function autoSugarFrenzyAction() {
    if (
        FrozenCookies.autoSugarFrenzy == 1 &&
        ((!FrozenCookies.sugarBakingGuard && Game.lumps > 0) || Game.lumps > 100) &&
        cpsBonus() >= FrozenCookies.minASFMult &&
        Game.UpgradesById["450"].unlocked == 1 &&
        Game.UpgradesById["452"].bought == 0 &&
        auto100ConsistencyComboAction.state == 5 &&
        ((!Game.hasBuff("Loan 1 (interest)") && !Game.hasBuff("Loan 2 (interest)") && !Game.hasBuff("Loan 3 (interest)")) || !FrozenCookies.minLoanMult)
    ) {
        Game.UpgradesById["452"].buy();
        Game.ConfirmPrompt();
        logEvent("autoSugarFrenzy", "Iniciou uma Frenesi de Açúcar nesta ascensão");
    }

    if (
        FrozenCookies.autoSugarFrenzy == 2 &&
        ((!FrozenCookies.sugarBakingGuard && Game.lumps > 0) || Game.lumps > 100) &&
        cpsBonus() >= FrozenCookies.minASFMult &&
        Game.UpgradesById["450"].unlocked == 1 &&
        Game.UpgradesById["452"].bought == 0 &&
        (autoFTHOFComboAction.state == 3 || auto100ConsistencyComboAction.state == 5) &&
        ((!Game.hasBuff("Loan 1 (interest)") && !Game.hasBuff("Loan 2 (interest)") && !Game.hasBuff("Loan 3 (interest)")) || !FrozenCookies.minLoanMult)
    ) {
        Game.UpgradesById["452"].buy();
        Game.ConfirmPrompt();
        logEvent("autoSugarFrenzy", "Iniciou uma Frenesi de Açúcar nesta ascensão");
    }
}