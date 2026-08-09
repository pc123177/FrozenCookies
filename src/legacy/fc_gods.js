function swapIn(godId, targetSlot) {
    //código copiado principalmente de minigamePantheon.js, ajustado para evitar referências a "arrastar"
    if (!T.swaps) return;
    T.useSwap(1);
    T.lastSwapT = 0;
    var div = l("templeGod" + godId);
    var prev = T.slot[targetSlot]; //id do Deus atualmente no slot
    if (prev != -1) {
        //quando já tem algo lá
        prev = T.godsById[prev]; //prev vira o objeto do deus
        var prevDiv = l("templeGod" + prev.id);
        if (T.godsById[godId].slot != -1)
            l("templeSlot" + T.godsById[godId].slot).appendChild(prevDiv);
        else {
            var other = l("templeGodPlaceholder" + prev.id);
            other.parentNode.insertBefore(prevDiv, other);
        }
    }
    l("templeSlot" + targetSlot).appendChild(l("templeGod" + godId));
    T.slotGod(T.godsById[godId], targetSlot);

    PlaySound("snd/tick.mp3");
    PlaySound("snd/spirit.mp3");

    var rect = l("templeGod" + godId).getBoundingClientRect();
    Game.SparkleAt(
        (rect.left + rect.right) / 2,
        (rect.top + rect.bottom) / 2 - 24
    );
}

function autoWorship0Action() {
    if (
        !T ||
        T.swaps < 1 ||
        !FrozenCookies.autoWorshipToggle ||
        !FrozenCookies.autoWorship0 ||
        FrozenCookies.autoCyclius ||
        T.slot[0] == FrozenCookies.autoWorship0
    ) {
        return;
    }

    if (T.swaps > 0) swapIn(FrozenCookies.autoWorship0, 0);
}

function autoWorship1Action() {
    if (
        !T ||
        T.swaps < 1 ||
        !FrozenCookies.autoWorshipToggle ||
        !FrozenCookies.autoWorship1 ||
        FrozenCookies.autoCyclius ||
        T.slot[1] == FrozenCookies.autoWorship1
    ) {
        return;
    }

    if (T.slot[0] == FrozenCookies.autoWorship1) {
        FrozenCookies.autoWorship1 = 0;
        logEvent(
            "autoWorship",
            "Não é possível adorar o mesmo deus nos slots Diamond e Ruby!"
        );
        return;
    }

    if (T.swaps > 0) swapIn(FrozenCookies.autoWorship1, 1);
}

function autoWorship2Action() {
    if (
        !T ||
        T.swaps < 1 ||
        !FrozenCookies.autoWorshipToggle ||
        !FrozenCookies.autoWorship2 ||
        FrozenCookies.autoCyclius ||
        T.slot[2] == FrozenCookies.autoWorship2
    ) {
        return;
    }

    if (T.slot[0] == FrozenCookies.autoWorship2) {
        FrozenCookies.autoWorship2 = 0;
        logEvent(
            "autoWorship",
            "Não é possível adorar o mesmo deus nos slots Diamond e Jade!"
        );
        return;
    }
    if (T.slot[1] == FrozenCookies.autoWorship2) {
        FrozenCookies.autoWorship2 = 0;
        logEvent(
            "autoWorship",
            "Não é possível adorar o mesmo deus nos slots Ruby e Jade!"
        );
        return;
    }

    if (T.swaps > 0) swapIn(FrozenCookies.autoWorship2, 2);
}

function autoCycliusAction() {
    if (!T || T.swaps < 1 || !FrozenCookies.autoCyclius) return;

    // Desativar Auto-Panteão se habilitado
    if (FrozenCookies.autoWorshipToggle === 1) {
        FrozenCookies.autoWorshipToggle = 0;
        logEvent("autoCyclius", "Desativando Auto-Panteão");
    }

    // Mudar para o modo especial de dois slots se Supreme Intellect for detectado
    // O terceiro slot não é usado por Cyclius neste modo
    // autoCyclius == 1 é o modo de dois slots
    // autoCyclius == 2 é o modo de três slots
    if (FrozenCookies.autoCyclius === 2 && Game.hasAura("Supreme Intellect")) {
        FrozenCookies.autoCyclius = 1;
        logEvent(
            "autoCyclius",
            "Supreme Intellect detectado! Trocando Cyclius para o modo de dois slots"
        );
    }

    // Constantes de tempo (em minutos)
    // Veja https://cookieclicker.fandom.com/wiki/Pantheon#Cyclius,_Spirit_of_Ages
    // SI ignora o slot Diamond pois não faz diferença
    const times = {
        Ruby1: 1 * 60 + 12, //1:12 UTC: Ruby
        Jade1: 4 * 60, // 4:00 UTC: Jade
        SIJade: 6 * 60, // 6:00 UTC: SI Ruby-como-Diamond
        SIRuby: 7 * 60 + 30, // 7:30 UTC: SI Jade-como-Ruby
        Diamond2: 9 * 60 + 19, // 9:19 UTC: Diamond
        Jade2: 10 * 60 + 20, // 10:20 UTC: Jade
        Diamond3: 12 * 60, // 12:00 UTC: Diamond
        Ruby2: 13 * 60 + 12, // 13:12 UTC: Ruby
        Diamond4: 18 * 60, // 18:00 UTC: Diamond
        CycNone1: 19 * 60 + 30, // 19:30 UTC: Sem Cyclius
        Diamond5: 21 * 60, // 21:00 UTC: Diamond
        CycNone2: 22 * 60 + 30, // 22:30 UTC: Sem Cyclius
    };

    // Obter o tempo UTC atual em minutos
    const now = new Date();
    const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes();

    // Auxiliar para trocar deuses se necessário
    function swapIfNeeded(godId, slot, label) {
        if (
            godId !== 11 &&
            godId !== 3 &&
            T.slot[slot] !== godId &&
            T.swaps > 0
        ) {
            swapIn(godId, slot);
            logEvent("autoCyclius", `deus desejado definido para ${label}`);
        }
    }

    // Auxiliar para remover Cyclius se presente
    function removeCyclius() {
        if (Game.hasGod("ages")) {
            Game.forceUnslotGod("ages");
            logEvent("autoCyclius", "Removendo Cyclius");
        }
    }

    // Lógica principal para o modo de dois slots - nunca usa o slot Diamond
    if (FrozenCookies.autoCyclius === 1 && !Game.hasAura("Supreme Intellect")) {
        if (T.slot[1] !== 3 && currentTime < times.Jade1) {
            // 1:12 UTC até 4:00 UTC, RUBY
            swapIn(3, 1);
            logEvent("autoCyclius", "Colocando Cyclius em RUBY");
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (
            T.slot[2] !== 3 &&
            currentTime >= times.Jade1 &&
            currentTime < times.Diamond3
        ) {
            // 4:00 UTC até 12:00 UTC, JADE
            swapIn(3, 2);
            logEvent("autoCyclius", "Colocando Cyclius em JADE");
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
        } else if (
            // 12:00 UTC até 19:30 UTC, RUBY
            T.slot[1] !== 3 &&
            currentTime >= times.Diamond3 &&
            currentTime < times.Diamond4
        ) {
            swapIn(3, 1);
            logEvent("autoCyclius", "Colocando Cyclius em RUBY");
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (currentTime >= times.Diamond4) {
            // 19:30 UTC até 1:12 UTC, sem Cyclius
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
            swapIfNeeded(FrozenCookies.autoWorship2, 2, "JADE");
            removeCyclius();
        }
    }

    // Lógica principal para o modo de três slots)
    if (FrozenCookies.autoCyclius === 2 && !Game.hasAura("Supreme Intellect")) {
        if (T.slot[0] !== 3 && currentTime < times.Ruby1) {
            // 1:12 UTC até 4:00 UTC, DIAMOND
            swapIn(3, 0);
            logEvent("autoCyclius", "Colocando Cyclius em DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship0, 1, "RUBY");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (
            // 4:00 UTC até 9:19 UTC, RUBY
            T.slot[1] !== 3 &&
            currentTime >= times.Ruby1 &&
            currentTime < times.Jade1
        ) {
            swapIn(3, 1);
            logEvent("autoCyclius", "Colocando Cyclius em RUBY");
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (
            // 9:19 UTC até 10:20 UTC, JADE
            T.slot[2] !== 3 &&
            currentTime >= times.Jade1 &&
            currentTime < times.Diamond2
        ) {
            swapIn(3, 2);
            logEvent("autoCyclius", "Colocando Cyclius em JADE");
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
        } else if (
            // 10:20 UTC até 12:00 UTC, DIAMOND
            T.slot[0] !== 3 &&
            currentTime >= times.Diamond2 &&
            currentTime < times.Jade2
        ) {
            swapIn(3, 0);
            logEvent("autoCyclius", "Colocando Cyclius em DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship0, 1, "RUBY");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (
            // 12:00 UTC até 13:12 UTC, JADE
            T.slot[2] !== 3 &&
            currentTime >= times.Jade2 &&
            currentTime < times.Diamond3
        ) {
            swapIn(3, 2);
            logEvent("autoCyclius", "Colocando Cyclius em JADE");
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
        } else if (
            //  13:12 UTC até 18:00 UTC, DIAMOND
            T.slot[0] !== 3 &&
            currentTime >= times.Diamond3 &&
            currentTime < times.Ruby2
        ) {
            swapIn(3, 0);
            logEvent("autoCyclius", "Colocando Cyclius em DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship0, 1, "RUBY");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (
            // 13:12 UTC até 18:00 UTC, RUBY
            T.slot[1] !== 3 &&
            currentTime >= times.Ruby2 &&
            currentTime < times.Diamond4
        ) {
            swapIn(3, 1);
            logEvent("autoCyclius", "Colocando Cyclius em RUBY");
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (
            // 18:00 UTC até 19:30 UTC, DIAMOND
            T.slot[0] !== 3 &&
            currentTime >= times.Diamond4 &&
            currentTime < times.CycNone1
        ) {
            swapIn(3, 0);
            logEvent("autoCyclius", "Colocando Cyclius em DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship0, 1, "RUBY");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (
            // 19:30 UTC até 21:00 UTC, sem Cyclius
            currentTime >= times.CycNone1 &&
            currentTime < times.Diamond5
        ) {
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
            swapIfNeeded(FrozenCookies.autoWorship2, 2, "JADE");
            removeCyclius();
        } else if (
            // 21:00 UTC até 22:30 UTC, DIAMOND
            T.slot[0] !== 3 &&
            currentTime >= times.Diamond5 &&
            currentTime < times.CycNone2
        ) {
            swapIn(3, 0);
            logEvent("autoCyclius", "Colocando Cyclius em DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship0, 1, "RUBY");
            swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
        } else if (currentTime >= times.CycNone2) {
            // // 22:30 UTC até 1:12 UTC, sem Cyclius
            swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
            swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
            swapIfNeeded(FrozenCookies.autoWorship2, 2, "JADE");
            removeCyclius();
        }
    }

    // Supreme Intellect: Ruby age como Diamond, Jade como Ruby
    if (Game.hasAura("Supreme Intellect")) {
        if (FrozenCookies.autoCyclius === 1) {
            if (T.slot[1] !== 3 && currentTime < times.Ruby1) {
                // 1:12 UTC até 4:00 UTC, RUBY
                swapIn(3, 1);
                logEvent("autoCyclius", "Colocando Cyclius em RUBY (SI)");
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
            } else if (
                // 4:00 UTC até 6:00 UTC, JADE
                T.slot[2] !== 3 &&
                currentTime >= times.Ruby1 &&
                currentTime < times.SIJade
            ) {
                swapIn(3, 2);
                logEvent("autoCyclius", "Colocando Cyclius em JADE (SI)");
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
            } else if (
                // 6:00 UTC até 7:30 UTC, RUBY
                T.slot[1] !== 3 &&
                currentTime >= times.SIJade &&
                currentTime < times.SIRuby
            ) {
                swapIn(3, 1);
                logEvent("autoCyclius", "Colocando Cyclius em RUBY (SI)");
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
            } else if (
                // 7:30 UTC até 12:00 UTC, sem Cyclius
                currentTime >= times.SIRuby &&
                currentTime < times.Diamond2
            ) {
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND (SI)");
                swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
                swapIfNeeded(FrozenCookies.autoWorship2, 2, "JADE");
                removeCyclius();
            } else if (
                // 12:00 UTC até 13:12 UTC, RUBY
                T.slot[1] !== 3 &&
                currentTime >= times.Diamond2 &&
                currentTime < times.Jade2
            ) {
                swapIn(3, 1);
                logEvent("autoCyclius", "Colocando Cyclius em RUBY (SI)");
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
            } else if (
                // 13:12 UTC até 18:00 UTC, sem Cyclius
                currentTime >= times.Jade2 &&
                currentTime < times.Diamond3
            ) {
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
                swapIfNeeded(FrozenCookies.autoWorship2, 2, "JADE");
                removeCyclius();
            } else if (
                // 18:00 UTC até 19:30 UTC, RUBY
                T.slot[1] !== 3 &&
                currentTime >= times.Diamond3 &&
                currentTime < times.Ruby2
            ) {
                swapIn(3, 1);
                logEvent("autoCyclius", "Colocando Cyclius em RUBY (SI)");
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
            } else if (
                // 13:12 UTC até 18:00 UTC, JADE
                T.slot[2] !== 3 &&
                currentTime >= times.Ruby2 &&
                currentTime < times.Diamond4
            ) {
                swapIn(3, 2);
                logEvent("autoCyclius", "Colocando Cyclius em JADE (SI)");
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
            } else if (
                // 18:00 UTC até 19:30 UTC, RUBY
                T.slot[1] !== 3 &&
                currentTime >= times.Diamond4 &&
                currentTime < times.CycNone1
            ) {
                swapIn(3, 1);
                logEvent("autoCyclius", "Colocando Cyclius em RUBY (SI)");
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
            } else if (
                // 19:30 UTC até 21:00 UTC, sem Cyclius
                currentTime >= times.CycNone1 &&
                currentTime < times.Diamond5
            ) {
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
                swapIfNeeded(FrozenCookies.autoWorship2, 2, "JADE");
                removeCyclius();
            } else if (
                // 21:00 UTC até 22:30 UTC, RUBY
                T.slot[1] !== 3 &&
                currentTime >= times.Diamond5 &&
                currentTime < times.CycNone2
            ) {
                swapIn(3, 1);
                logEvent("autoCyclius", "Colocando Cyclius em RUBY (SI)");
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 2, "JADE");
            } else if (currentTime >= times.CycNone2) {
                // // 22:30 UTC até 1:12 UTC, sem Cyclius
                swapIfNeeded(FrozenCookies.autoWorship0, 0, "DIAMOND");
                swapIfNeeded(FrozenCookies.autoWorship1, 1, "RUBY");
                swapIfNeeded(FrozenCookies.autoWorship2, 2, "JADE");
                removeCyclius();
            }
        }
    }
}

function lumpIn(mins) {
    //Para depuração, define minutos até a próxima gota de açúcar *amadurecer*
    Game.lumpT = Date.now() - Game.lumpRipeAge + 60000 * mins;
}

function rigiSell() {
    //Vende edifícios suficientes do mais barato para ativar o efeito de Rigidel
    if (Game.BuildingsOwned % 10) {
        var cheapest;
        Game.ObjectsById.forEach(function (b) {
            if (!cheapest || b.price < cheapest.price) {
                cheapest = b;
            }
        });
        cheapest.sell(Game.BuildingsOwned % 10);
    }
    return;
}

function autoRigidel() {
    if (!T) return; // Sair se o Panteão não existir

    const started = Game.lumpT;
    const timeToRipe =
        (Math.ceil(Game.lumpRipeAge) - (Date.now() - started)) / 60000; // Minutos até a gota de açúcar amadurecer
    const orderLvl = Game.hasGod("order") ? Game.hasGod("order") : 0;
    let prevGod = -1;
    let tryHarvest = false;

    // Prosseguir apenas se houver trocas disponíveis
    if (T.swaps < 1 && orderLvl === 0) return;

    // Determinar se Rigidel está em um slot e agir de acordo
    if (orderLvl === 0) {
        // Rigidel não está em um slot
        if (T.swaps < (T.slot[0] === -1 ? 1 : 2)) return; // Trocas insuficientes para prosseguir
        if (timeToRipe < 60) {
            prevGod = T.slot[0]; // Armazenar o deus atual no slot diamond
            swapIn(10, 0); // Colocar Rigidel no slot diamond
            tryHarvest = true;
        }
    } else if (orderLvl === 1) {
        // Rigidel está no slot diamond
        if (timeToRipe < 55) tryHarvest = true;
    } else if (orderLvl === 2) {
        // Rigidel está no slot ruby
        if (timeToRipe < 35) tryHarvest = true;
    } else if (orderLvl === 3) {
        // Rigidel está no slot jade
        if (timeToRipe < 15) tryHarvest = true;
    }

    if (tryHarvest) {
        rigiSell();
        Game.computeLumpTimes();
        // Usar uma variável para verificação de maturidade por clareza
        const lumpIsRipe = Date.now() - started >= Math.ceil(Game.lumpRipeAge);
        if (lumpIsRipe) {
            if (Game.dragonLevel >= 21 && FrozenCookies.dragonsCurve) {
                autoDragonsCurve();
            } else {
                Game.clickLump();
            }
            logEvent("autoRigidel", "Gota de açúcar colhida cedo");
        } else {
            logEvent(
                "autoRigidel",
                "Colheita antecipada de gota de açúcar verde suprimida"
            );
        }
    }

    // Restaurar o deus anterior se Rigidel foi colocado
    if (prevGod !== -1) swapIn(prevGod, 0);
}

function autoDragonsCurve() {
    //Trocar auras do dragão para tentar obter gotas de açúcar incomuns
    if (Game.dragonLevel < 21 || FrozenCookies.dragonsCurve < 1) return;

    if (FrozenCookies.autoDragonToggle == 1) {
        autoDragonsCurve.autodragonyes = 1;
        FrozenCookies.autoDragonToggle = 0;
    } else {
        autoDragonsCurve.autodragonyes = 0;
    }

    if (
        Game.dragonLevel > 26 &&
        !Game.hasAura("Dragon's Curve")
    ) {
	    if (Game.dragonAura == 18) {
	        Game.SetDragonAura(17, 1);
	        Game.ConfirmPrompt();
	    } else {
            Game.SetDragonAura(17, 0);
            Game.ConfirmPrompt();
	    }
        logEvent(
            "autoDragonsCurve",
            "Auras do dragão trocadas para manipular nova Gota de Açúcar"
        );
    } else if (!Game.hasAura("Dragon's Curve")) {
        Game.specialTab = "dragon";
        Game.SetDragonAura(17, 0);
        Game.ConfirmPrompt();
        logEvent(
            "autoDragonsCurve",
            "Auras do dragão trocadas para manipular nova Gota de Açúcar"
        );
    }

    if (
        FrozenCookies.dragonsCurve == 2 &&
        Game.dragonLevel > 26 &&
        !Game.hasAura("Reality Bending")
    ) {
        if (Game.dragonAura == 17) {
	        Game.SetDragonAura(18, 1);
	        Game.ConfirmPrompt();
	    } else {
	        Game.SetDragonAura(18, 0);
	        Game.ConfirmPrompt();
	    }
    }

    Game.clickLump();

    if (autoDragonsCurve.autodragonyes == 1) {
        FrozenCookies.autoDragonToggle = 1;
        autoDragonsCurve.autodragonyes = 0;
    }
    return;
}

function autoDragonAction() {
    // FIX: sem esse check, o preference toggle autoDragon não tinha efeito nenhum sobre o
    // comportamento em tempo real - o único gate real era o setInterval condicional em
    // FCStart() (fc_main.js), decidido UMA VEZ no boot. Autopiloto mudando
    // FrozenCookies.autoDragon depois não recriava o interval, então o dragão nunca chocava
    // pra quem carregou uma vez com autoDragon=0 salvo (relato real de usuário). Agora o
    // interval é sempre criado (fc_main.js) e esta função se autoprotege aqui.
    if (
        !FrozenCookies.autoDragon ||
        !Game.HasUnlocked("A crumbly egg") ||
        Game.dragonLevel > 26 ||
        hasClickBuff()
    ) {
        return;
    }

    if (Game.HasUnlocked("A crumbly egg") && !Game.Has("A crumbly egg")) {
        Game.Upgrades["A crumbly egg"].buy();
        logEvent("autoDragon", "Comprou um ovo");
    }

    if (
        Game.dragonLevel < Game.dragonLevels.length - 1 &&
        Game.dragonLevels[Game.dragonLevel].cost()
    ) {
        Game.specialTab = "dragon";
        Game.UpgradeDragon();
        if (Game.dragonLevel + 1 >= Game.dragonLevels.length)
            Game.ToggleSpecialMenu();
        logEvent(
            "autoDragon",
            "Dragão melhorado para o nível " + Game.dragonLevel
        );
    }
}

function petDragonAction() {
    // FIX: mesma razão do check em autoDragonAction - sem isso, o toggle petDragon não tinha
    // efeito em tempo real, só o setInterval condicional decidido uma vez no boot.
    if (
        !FrozenCookies.petDragon ||
        !Game.Has("A crumbly egg") ||
        Game.dragonLevel < 4 ||
        !Game.Has("Pet the dragon") ||
        hasClickBuff()
    ) {
        return;
    }

    //Calcular o drop atual de pet e se já temos
    Math.seedrandom(Game.seed + "/dragonTime");
    let drops = [
        "Dragon scale",
        "Dragon claw",
        "Dragon fang",
        "Dragon teddy bear",
    ];
    drops = shuffle(drops);
    Math.seedrandom();
    let currentDrop =
        drops[Math.floor((new Date().getMinutes() / 60) * drops.length)];

    //Acariciar o dragão
    if (!Game.Has(currentDrop) && !Game.HasUnlocked(currentDrop)) {
        Game.specialTab = "dragon";
        Game.ToggleSpecialMenu(1);
        Game.ClickSpecialPic();
        Game.ToggleSpecialMenu(0);
        //logEvent("autoDragon", "Quem é um bom dragão? Você é!");
    }
}

function autoDragonAura0Action() {
    if (
        !Game.Has("A crumbly egg") ||
        Game.dragonLevel < 5 ||
        !FrozenCookies.autoDragonAura0 ||
        !FrozenCookies.autoDragonToggle ||
        Game.dragonAura == FrozenCookies.autoDragonAura0 ||
        Game.dragonAura2 == FrozenCookies.autoDragonAura0
    ) {
        return;
    }

    if (FrozenCookies.autoDragonAura0 == FrozenCookies.autoDragonAura1) {
        FrozenCookies.autoDragonAura1 = 0;
        logEvent("autoDragon", "Não é possível definir ambas as auras para a mesma!");
        return;
    }

    if (
        Game.dragonLevel > 26 &&
        Game.dragonAura == FrozenCookies.autoDragonAura1 &&
        Game.dragonAura2 != FrozenCookies.autoDragonAura0
    ) {
        Game.specialTab = "dragon";
        Game.SetDragonAura(FrozenCookies.autoDragonAura0, 1);
        Game.ConfirmPrompt();
        logEvent("autoDragon", "Primeira aura do dragão definida");
        return;
    } else if (Game.dragonLevel >= FrozenCookies.autoDragonAura0 + 4) {
        Game.specialTab = "dragon";
        Game.SetDragonAura(FrozenCookies.autoDragonAura0, 0);
        Game.ConfirmPrompt();
        Game.ToggleSpecialMenu();
        logEvent("autoDragon", "Primeira aura do dragão definida");
        return;
    }
}

function autoDragonAura1Action() {
    if (
        !Game.Has("A crumbly egg") ||
        Game.dragonLevel < 27 ||
        !FrozenCookies.autoDragonAura0 ||
        !FrozenCookies.autoDragonAura1 ||
        !FrozenCookies.autoDragonToggle ||
        Game.dragonAura == FrozenCookies.autoDragonAura1 ||
        Game.dragonAura2 == FrozenCookies.autoDragonAura1
    ) {
        return;
    }

    if (
        Game.dragonAura2 == FrozenCookies.autoDragonAura0 &&
        Game.dragonAura != FrozenCookies.autoDragonAura1
    ) {
        Game.specialTab = "dragon";
        Game.SetDragonAura(FrozenCookies.autoDragonAura1, 0);
        Game.ConfirmPrompt();
        logEvent("autoDragon", "Segunda aura do dragão definida");
        return;
    } else if (
        Game.dragonAura == FrozenCookies.autoDragonAura0 &&
        Game.dragonAura2 != FrozenCookies.autoDragonAura1
    ) {
        Game.specialTab = "dragon";
        Game.SetDragonAura(FrozenCookies.autoDragonAura1, 1);
        Game.ConfirmPrompt();
        Game.ToggleSpecialMenu();
        logEvent("autoDragon", "Segunda aura do dragão definida");
        return;
    }
}

function autoDragonOrbsAction() {
    if (!T) return;
    if (
        FrozenCookies.autoDragonOrbs == 1 &&
        (!Game.hasAura("Dragon Orbs") ||
            Game.hasGod("ruin") ||
            Game.Objects["You"].amount < 1)
    ) {
        FrozenCookies.autoDragonOrbs = 0;
        logEvent("autoDragonOrbs", "Atualmente não é possível usar Dragon Orbs");
    }

    var buffsN = 0;
    for (var ii in Game.buffs) {
        buffsN++;
    }
    // FIX: faltava a verificação FrozenCookies.autoDragonOrbs==1 - o bloco acima apenas define
    // essa flag como 0 quando o recurso se torna impossível, mas nunca bloqueava esta ação de
    // venda em si, então continuava vendendo Yous a cada tick mesmo após ser "desativado" (ou
    // se o usuário nunca o habilitou mas tem Dragon Orbs equipado).
    if (FrozenCookies.autoDragonOrbs == 1 && !goldenCookieLife() && Game.hasAura("Dragon Orbs") && !buffsN) {
        Game.Objects["You"].sell(1);
        logEvent(
            "autoDragonOrbs",
            "Vendeu 1 You por " +
                (Beautify(
                    Game.Objects["You"].price *
                        Game.Objects["You"].getSellMultiplier()
                ) +
                    " cookies e um desejo")
        );
    }
}
