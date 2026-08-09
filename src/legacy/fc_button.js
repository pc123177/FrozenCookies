// Este arquivo substitui o botão Info pelo botão Frozen Cookies
// que adiciona um novo menu para o Frozen Cookies

$("#logButton").before(
    $("<div>")
        .attr("id", "fcButton")
        .addClass("button panelButton")
        .html("Frozen<br />Cookies")
        .click(function () {
            Game.ShowMenu("fc_menu");
        })
);

$("#logButton").hide();

$("<style>")
    .prop("type", "text/css")
    .text(
        "#fcEfficiencyTable {width: 100%;}" +
            "#fcButton {top: 0px; right: 0px; padding-top: 12px; font-size: 90%; background-position: -100px 0px;}" +
            ".worst {border-width:1px; border-style:solid; border-color:#330000;}" +
            ".bad {border-width:1px; border-style:solid; border-color:#660033;}" +
            ".average {border-width:1px; border-style:solid; border-color:#663399;}" +
            ".good {border-width:1px; border-style:solid; border-color:#3399FF;}" +
            ".best {border-width:1px; border-style:solid; border-color:#00FFFF;}" +
            ".ui-dialog {z-index:1000000;}"
    )
    .appendTo("head");

function getBuildingTooltip(purchaseRec) {
    var parent = $("<div>").prop("style", "min-width:300px;");
    parent.append(
        $("<div>")
            .addClass("price")
            .prop("style", "float:right;")
            .text(Beautify(purchaseRec.purchase.price))
    );
    parent.append($("<div>").addClass("name").text(purchaseRec.purchase.name));
    parent.append(
        $("<div>")
            .prop("style", "font-size:80%;")
            .text("[possuído: " + purchaseRec.purchase.amount + "]")
    );
    parent.append(
        $("<div>").addClass("description").html(purchaseRec.purchase.desc)
    );
    if (purchaseRec.delta_cps) {
        parent.append(
            $("<div>")
                .addClass("fc_cps")
                .html("Δ CPS: " + Beautify(purchaseRec.delta_cps))
        );
        parent.append(
            $("<div>")
                .addClass("fc_efficiency")
                .text(
                    "Eficiência: " +
                        (
                            Math.floor(purchaseRec.efficiencyScore * 10000) /
                            100
                        ).toString() +
                        "%"
                )
        );
        parent.append(
            $("<div>")
                .addClass("fc_build_time")
                .text(
                    "Tempo de construção: " +
                        timeDisplay(
                            divCps(
                                purchaseRec.cost + delayAmount(),
                                Game.cookiesPs
                            )
                        )
                )
        );
        parent.append(
            $("<div>")
                .addClass("fc_effective_build_time")
                .text(
                    "Tempo de Construção Efetivo Estimado: " +
                        timeDisplay(
                            divCps(
                                purchaseRec.cost + delayAmount(),
                                effectiveCps()
                            )
                        )
                )
        );
    }
    return parent[0].outerHTML;
}

function getUpgradeTooltip(purchaseRec) {
    var parent = $("<div>").prop("style", "min-width:300px;");
    parent.append(
        $("<div>")
            .addClass("price")
            .attr("style", "float:right;")
            .text(Beautify(purchaseRec.purchase.getPrice()))
    );
    parent.append($("<div>").addClass("name").text(purchaseRec.purchase.name));
    parent.append($("<div>").prop("style", "font-size:80%;").text("[Melhoria]"));
    parent.append(
        $("<div>").addClass("description").html(purchaseRec.purchase.desc)
    );
    if (purchaseRec.delta_cps) {
        parent.append(
            $("<div>")
                .addClass("fc_cps")
                .html("Δ CPS: " + Beautify(purchaseRec.delta_cps))
        );
        parent.append(
            $("<div>")
                .addClass("fc_efficiency")
                .text(
                    "Eficiência: " +
                        (
                            Math.floor(purchaseRec.efficiencyScore * 10000) /
                            100
                        ).toString() +
                        "%"
                )
        );
        parent.append(
            $("<div>")
                .addClass("fc_build_time")
                .text(
                    "Tempo de construção: " +
                        timeDisplay(
                            divCps(
                                purchaseRec.cost + delayAmount(),
                                Game.cookiesPs
                            )
                        )
                )
        );
        parent.append(
            $("<div>")
                .addClass("fc_effective_build_time")
                .text(
                    "Tempo de Construção Estimado (CD): " +
                        timeDisplay(
                            divCps(
                                purchaseRec.cost + delayAmount(),
                                effectiveCps()
                            )
                        )
                )
        );
    }
    return parent[0].outerHTML;
}

function colorizeScore(score) {
    var classNames = ["best", "good", "average", "bad", "worst"];
    var result;
    if (score == 1) {
        result = classNames[0];
    } else if (score > 0.9) {
        result = classNames[1];
    } else if (score > 0.1) {
        result = classNames[2];
    } else if (score > 0) {
        result = classNames[3];
    } else {
        result = classNames[4];
    }
    return result;
}

function rebuildStore(recalculate) {
    var store = $("#products"),
        recommendations = recommendationList(recalculate);

    store[0].innerHTML = "";
    Game.ObjectsById.forEach(function (me) {
        var purchaseRec = recommendations.filter(function (a) {
                return a.id == me.id && a.type == "building";
            })[0],
            button = $("<div>")
                .addClass("product")
                .addClass(colorizeScore(purchaseRec.efficiencyScore))
                .mouseenter(function () {
                    Game.tooltip.draw(
                        this,
                        escape(getBuildingTooltip(purchaseRec)),
                        0,
                        0,
                        "left"
                    );
                })
                .mouseleave(function () {
                    Game.tooltip.hide();
                })
                .click(function () {
                    Game.ObjectsById[me.id].buy();
                })
                .prop("id", "product" + me.id)
                .append(
                    $("<div>")
                        .addClass("icon")
                        .prop(
                            "style",
                            "background-image:url(img/" + me.icon + ".png);"
                        )
                );
        content = $("<div>").addClass("content");

        content.append($("<div>").addClass("title").html(me.displayName));
        content.append($("<div>").addClass("price").text(Beautify(me.price)));
        if (me.amount) {
            content.append(
                $("<div>").addClass("title owned").text(Beautify(me.amount))
            );
        }
        button.append(content);
        store.append(button);
    });
    //  Game.Draw();
}

function rebuildUpgrades(recalculate) {
    var store = $("#upgrades"),
        recommendations = recommendationList(recalculate);
    store[0].innerHTML = "";
    Game.UpgradesInStore = Game.UpgradesById.filter(function (a) {
        return !a.bought && a.unlocked;
    }).sort(function (a, b) {
        return a.getPrice() - b.getPrice();
    });
    Game.UpgradesInStore.forEach(function (me) {
        var purchaseRec = recommendations.filter(function (a) {
            return a.id == me.id && a.type == "upgrade";
        })[0];
        if (!purchaseRec) {
            console.log(me.name + " not found in recommendationList()");
        } else {
            store.append(
                $("<div>")
                    .addClass("crate upgrade")
                    .addClass(colorizeScore(purchaseRec.efficiencyScore))
                    .mouseenter(function () {
                        Game.tooltip.draw(
                            this,
                            escape(getUpgradeTooltip(purchaseRec)),
                            0,
                            16,
                            "bottom-right"
                        );
                    })
                    .mouseleave(function () {
                        Game.tooltip.hide();
                    })
                    .click(function () {
                        Game.UpgradesById[me.id].buy();
                    })
                    .prop("id", "upgrade" + me.id)
                    .prop(
                        "style",
                        "background-position:" +
                            (-me.icon[0] * 48 + 6) +
                            "px " +
                            (-me.icon[1] * 48 + 6) +
                            "px;"
                    )
            );
        }
    });
    //  Game.Draw();
}

if (typeof Game.oldUpdateMenu != "function") {
    Game.oldUpdateMenu = Game.UpdateMenu;
}

// Adicionar estilos personalizados
(function () {
    var style = document.createElement("style");
    style.innerHTML = `
        .fc-multichoice-group-vertical {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin: 4px 0;
        }
        .fc-multichoice-btn,
        .option {
            background: #111;
            color: #fff;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 4px 10px;
            margin: 0;
            cursor: pointer;
            font-size: 1em;
            text-align: left;
            transition: background 0.2s, color 0.2s, box-shadow 0.2s;
            opacity: 0.7; /* Padrão: acinzentado */
            filter: grayscale(30%);
        }
        .fc-multichoice-group-vertical .selected,
        .option.selected {
            background: #222;
            color: #fff;
            font-weight: bold;
            opacity: 1;
            filter: none;
            /* Adicionar efeito brilhante */
            box-shadow: 0 0 8px 2px #fff, 0 0 2px 1px #fff inset; /* Manter efeito brilhante, mas cor neutra */
        }
        .fc-multichoice-group-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            margin: 4px 0;
        }
        .fc-multichoice-group-3col {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 4px;
            margin: 4px 0;
        }
        .fc-multichoice-btn:hover,
        .option:hover {
            background: #222;
            color: #fff;
            opacity: 1;
            filter: none;
            box-shadow: 0 0 8px 2px #fff, 0 0 2px 1px #cfc inset;
        }
        .fc-section-heading {
            font-variant: small-caps;
            font-weight: bold;
            letter-spacing: 1px;
            font-size: 1.1em;
            display: block;
            margin-bottom: 2px;
        }
        .fc-hint-label {
            font-size: smaller;
            color: #aaa;
            margin-bottom: 2px;
        }
        .fc-choose-one-label {
            font-size: smaller;
            color: #aaa;
            margin-bottom: 2px;
            margin-top: 10px; /* Adicionar espaço acima para separar da dica */
        }
        .fc-warning {
            font-size: smaller;
            color: #a00;
            margin-bottom: 6px;
        }
    `;
    document.head.appendChild(style);
})();

function FCMenu() {
    Game.UpdateMenu = function () {
        if (Game.onMenu !== "fc_menu") {
            return Game.oldUpdateMenu();
        }
        if (!Game.callingMenu) {
            Game.callingMenu = true;
            setTimeout(() => {
                Game.callingMenu = false;
                Game.UpdateMenu();
            }, 1000);
        }
        var currentCookies,
            maxCookies,
            isTarget,
            isMax,
            targetTxt,
            maxTxt,
            currHC,
            resetHC,
            cps,
            baseChosen,
            frenzyChosen,
            clickStr,
            buildTable,
            bankLucky,
            bankLuckyFrenzy,
            bankChain,
            menu = $("#menu")
                .empty()
                .append(
                    $("<div>")
                        .addClass("section")
                        .text(
                            "Frozen Cookies v " +
                                FrozenCookies.branch +
                                "." +
                                FrozenCookies.version
                        )
                )
                // Adicionar botão do painel log/info
                .append(
                    $("<div>")
                        .addClass("listing")
                        .append(
                            $("<button>")
                                .attr("id", "fcOpenLogPanel")
                                .attr(
                                    "title",
                                    "Abrir o painel de informações sobre o Cookie Clicker"
                                )
                                .text("Informações do Cookie Clicker")
                                .click(openGameLogPanel)
                        )
                )
                // Adicionar botão de página de documentação
                .append(
                    $("<div>")
                        .addClass("listing")
                        .append(
                            $("<button>")
                                .attr("id", "fcOpenDocPage")
                                .attr(
                                    "title",
                                    "Abrir a página de documentação do Frozen Cookies"
                                )
                                .text("Leia-me do Frozen Cookies")
                                .click(openDocumentationPage)
                        )
                );

        // --- SEÇÃO DE INFORMAÇÕES DE COMPRA AUTOMÁTICA ---
        (subsection = $("<div>")
            .addClass("subsection")
            .append($("<div>").addClass("title").text("Informações de Compra Automática"))),
            (recommendation = nextPurchase()),
            (chainRecommendation = nextChainedPurchase()),
            (isChained = !(
                recommendation.id == chainRecommendation.id &&
                recommendation.type == chainRecommendation.type
            )),
            (currentFrenzy = cpsBonus() * clickBuffBonus()),
            (bankLevel = bestBank(chainRecommendation.efficiency)),
            (actualCps =
                Game.cookiesPs +
                Game.mouseCps() *
                    FrozenCookies.cookieClickSpeed *
                    FrozenCookies.autoClick),
            (chocolateRecoup =
                (recommendation.type == "upgrade"
                    ? recommendation.cost
                    : recommendation.cost * 0.425) /
                (recommendation.delta_cps * 21));

        function buildListing(label, name) {
            return $("<div>")
                .addClass("listing")
                .append($("<b>").text(label + ":"), " ", name);
        }

        subsection.append(
            buildListing("Próxima Compra", recommendation.purchase.name)
        );
        if (isChained) {
            subsection.append(
                buildListing(
                    "Encadeando para",
                    chainRecommendation.purchase.name
                )
            );
        }
        subsection.append(
            buildListing(
                "Tempo até conclusão",
                timeDisplay(
                    divCps(
                        recommendation.cost + bankLevel.cost - Game.cookies,
                        actualCps
                    )
                )
            )
        );
        if (isChained) {
            subsection.append(
                buildListing(
                    "Tempo até conclusão da cadeia",
                    timeDisplay(
                        divCps(
                            Math.max(
                                0,
                                chainRecommendation.cost +
                                    bankLevel.cost -
                                    Game.cookies
                            ),
                            actualCps
                        )
                    )
                )
            );
        }
        if (Game.HasUnlocked("Chocolate egg") && !Game.Has("Chocolate egg")) {
            subsection.append(
                buildListing(
                    "Tempo para recuperar o Chocolate",
                    timeDisplay(
                        divCps(
                            recommendation.cost + bankLevel.cost - Game.cookies,
                            effectiveCps()
                        ) + chocolateRecoup
                    )
                )
            );
        }
        subsection.append(buildListing("Custo", Beautify(recommendation.cost)));
        subsection.append(
            buildListing("Banco de Cookie Dourado", Beautify(bankLevel.cost))
        );
        subsection.append(
            buildListing("Δ CPS Base", Beautify(recommendation.base_delta_cps))
        );
        subsection.append(
            buildListing("Δ CPS Total", Beautify(recommendation.delta_cps))
        );
        subsection.append(
            buildListing(
                "Eficiência da Compra",
                Beautify(recommendation.efficiency)
            )
        );
        if (isChained) {
            subsection.append(
                buildListing(
                    "Eficiência da Cadeia",
                    Beautify(chainRecommendation.efficiency)
                )
            );
        }
        if (bankLevel.efficiency > 0) {
            subsection.append(
                buildListing(
                    "Eficiência do Cookie Dourado",
                    Beautify(bankLevel.efficiency)
                )
            );
        }
        menu.append(subsection);

        // --- SEÇÃO DE OPÇÕES ---
        if (FrozenCookies.preferenceValues) {
            subsection = $("<div>").addClass("subsection");
            subsection.append(
                $("<div>").addClass("title").text("Controles do Frozen Cookies"),
                // Adicionar aviso abaixo do título
                $("<div>")
                    .addClass("fc-warning")
                    .text(" ⚠️ Todas as opções têm efeito imediato.")
            );
            _.keys(FrozenCookies.preferenceValues).forEach(function (
                preference
            ) {
                var listing,
                    prefVal = FrozenCookies.preferenceValues[preference],
                    hint = prefVal.hint,
                    display = prefVal.display,
                    extras = prefVal.extras,
                    current = FrozenCookies[preference],
                    preferenceButtonId = preference + "Button";
                if (display && display.length > 0 && display.length > current) {
                    listing = $("<div>").addClass("listing");
                    // Mostrar dica como cabeçalho de subseção antes dos botões
                    if (hint) {
                        listing.append(
                            $("<label>")
                                .addClass("fc-hint-label")
                                .text(
                                    hint.replace(
                                        /\$\{(.+)\}/g,
                                        function (s, id) {
                                            return FrozenCookies[id];
                                        }
                                    )
                                )
                        );
                    }
                    if (display.length === 2) {
                        // Renderizar botões de opção ligado/desligado lado a lado
                        var buttonGroup = $("<div>").addClass(
                            "fc-multichoice-group-2col"
                        );
                        display.forEach(function (label, idx) {
                            buttonGroup.append(
                                $("<button>")
                                    .addClass("option fc-multichoice-btn")
                                    .toggleClass("selected", idx === current)
                                    .prop("id", preferenceButtonId + "_" + idx)
                                    .click(function () {
                                        setPreferenceDirect(preference, idx);
                                    })
                                    .text(label)
                            );
                        });
                        listing.append(buttonGroup);
                    } else {
                        // Adicionar rótulo "escolha um" automaticamente
                        listing.append(
                            $("<div>")
                                .addClass("fc-choose-one-label")
                                .text("Escolha um:")
                        );
                        // Determinar classe de coluna com base no número de opções
                        let groupClass = "fc-multichoice-group-vertical";
                        if (display.length > 8) {
                            groupClass = "fc-multichoice-group-3col";
                        } else if (display.length > 4) {
                            groupClass = "fc-multichoice-group-2col";
                        }
                        // Renderizar grupo de botões para seleção direta, empilhados ou em colunas
                        var buttonGroup = $("<div>").addClass(groupClass);
                        display.forEach(function (label, idx) {
                            buttonGroup.append(
                                $("<button>")
                                    .addClass("option fc-multichoice-btn")
                                    .toggleClass("selected", idx === current)
                                    .prop("id", preferenceButtonId + "_" + idx)
                                    .click(function () {
                                        setPreferenceDirect(preference, idx);
                                    })
                                    .text(label)
                            );
                        });
                        listing.append(buttonGroup);
                    }
                    if (extras) {
                        // Se extras for uma função, chamá-la com FrozenCookies; caso contrário, tratar como string
                        var extrasHtml =
                            typeof extras === "function"
                                ? extras(FrozenCookies)
                                : extras.replace(
                                      /\$\{(.+)\}/g,
                                      function (s, id) {
                                          return fcBeautify(FrozenCookies[id]);
                                      }
                                  );
                        listing.append($(extrasHtml));
                    }
                    subsection.append(listing);
                }
                // se não houver opções, ainda exibir a dica como cabeçalho de subseção
                if (!display) {
                    listing = $("<div>").addClass("fc-section-heading");
                    if (hint) {
                        listing.append(
                            $("<br>"),
                            $("<label>").text(
                                hint.replace(/\$\{(.+)\}/g, function (s, id) {
                                    return FrozenCookies[id];
                                })
                            )
                        );
                    }
                    subsection.append(listing);
                }
            });
            menu.append(subsection);
        }

        // --- SEÇÃO DE INFORMAÇÕES DE COOKIE DOURADO ---
        subsection = $("<div>").addClass("subsection");
        subsection.append(
            $("<div>").addClass("title").text("Informações de Cookie Dourado")
        );
        currentCookies = Math.min(Game.cookies, FrozenCookies.targetBank.cost);
        maxCookies = bestBank(Number.POSITIVE_INFINITY).cost;
        isTarget =
            FrozenCookies.targetBank.cost == FrozenCookies.currentBank.cost;
        isMax = currentCookies == maxCookies;
        targetTxt = isTarget ? "" : " (Construindo Banco)";
        maxTxt = isMax ? " (Máx)" : "";
        subsection.append(
            buildListing("Frenesi Atual", Beautify(currentFrenzy))
        );
        subsection.append(
            buildListing(
                "Valor Médio Atual dos Cookies" + targetTxt + maxTxt,
                Beautify(cookieValue(currentCookies))
            )
        );
        if (!isTarget) {
            subsection.append(
                buildListing(
                    "Valor Médio Alvo dos Cookies",
                    Beautify(cookieValue(FrozenCookies.targetBank.cost))
                )
            );
        }
        if (!isMax) {
            subsection.append(
                buildListing(
                    "Valor Médio Máximo dos Cookies",
                    Beautify(cookieValue(maxCookies))
                )
            );
        }
        subsection.append(
            buildListing("Valor Máximo do Cookie da Sorte", Beautify(maxLuckyValue()))
        );
        subsection.append(
            buildListing(
                "Banco de Cookies para Máximo de Sorte",
                Beautify(maxLuckyValue() * 10)
            )
        );
        subsection.append(
            buildListing(
                "Valor Máximo da Cadeia de Cookies",
                Beautify(
                    calculateChainValue(
                        chainBank(),
                        Game.cookiesPs,
                        7 - Game.elderWrath / 3
                    )
                )
            )
        );
        subsection.append(
            buildListing(
                "Banco de Cookies para Máximo de Cadeia",
                Beautify(chainBank())
            )
        );
        subsection.append(
            buildListing(
                "CPS de Cookies Estimado",
                Beautify(gcPs(cookieValue(currentCookies)))
            )
        );
        subsection.append(
            buildListing("Cliques em Cookies Dourados", Beautify(Game.goldenClicks))
        );
        if (FrozenCookies.showMissedCookies == 1) {
            subsection.append(
                buildListing(
                    "Cliques Perdidos em Cookies Dourados",
                    Beautify(Game.missedGoldenClicks)
                )
            );
        }
        subsection.append(
            buildListing(
                "Último Efeito de Cookie Dourado",
                Game.shimmerTypes.golden.last
            )
        );
        menu.append(subsection);

        // --- SEÇÃO DE TEMPOS DE FRENESI ---
        subsection = $("<div>").addClass("subsection");
        subsection.append($("<div>").addClass("title").text("Tempos de Frenesi"));
        $.each(
            Object.keys(FrozenCookies.frenzyTimes)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .reduce((result, rate) => {
                    result[parseInt(rate)] =
                        (result[parseInt(rate)] || 0) +
                        FrozenCookies.frenzyTimes[rate];
                    return result;
                }, {}),
            (rate, time) => {
                subsection.append(
                    buildListing(
                        "Tempo Total Registrado em x" + Beautify(rate),
                        timeDisplay(time / 1000)
                    )
                );
            }
        );
        menu.append(subsection);

        // --- SEÇÃO DE INFORMAÇÕES DE FICHAS CELESTIAIS ---
        subsection = $("<div>").addClass("subsection");
        subsection.append(
            $("<div>").addClass("title").text("Informações de Fichas Celestiais")
        );
        currHC = Game.heavenlyChips;
        resetHC = Game.HowMuchPrestige(
            Game.cookiesReset +
                Game.cookiesEarned +
                wrinklerValue() +
                chocolateValue()
        );

        // Mostrar temporização se faz mais de um minuto desde o último HC ganho
        var showTiming = Date.now() - FrozenCookies.lastHCTime > 1000 * 60;
        subsection.append(buildListing("HC Agora", Beautify(Game.heavenlyChips)));
        subsection.append(buildListing("HC Após Reset", Beautify(resetHC)));
        if (showTiming) {
            subsection.append(
                buildListing("Tempo estimado para próximo HC", nextHC())
            );
        }
        if (currHC < resetHC) {
            if (showTiming) {
                subsection.append(
                    buildListing(
                        "Tempo desde último HC",
                        timeDisplay(
                            (Date.now() - FrozenCookies.lastHCTime) / 1000
                        )
                    )
                );
                if (FrozenCookies.lastHCAmount - 1 >= currHC) {
                    subsection.append(
                        buildListing(
                            "Tempo para obter último HC",
                            timeDisplay(
                                (FrozenCookies.lastHCTime -
                                    FrozenCookies.prevLastHCTime) /
                                    1000
                            )
                        )
                    );
                }
            }
            if (FrozenCookies.maxHCPercent > 0) {
                subsection.append(
                    buildListing(
                        "Ganho Máx. de HC/h",
                        Beautify(FrozenCookies.maxHCPercent)
                    )
                );
            }
            subsection.append(
                buildListing(
                    "Ganho Médio de HC/h",
                    Beautify(
                        (60 * 60 * (FrozenCookies.lastHCAmount - currHC)) /
                            ((FrozenCookies.lastHCTime - Game.startDate) / 1000)
                    )
                )
            );
            if (showTiming && FrozenCookies.lastHCAmount - 1 >= currHC) {
                subsection.append(
                    buildListing(
                        "Ganho Médio Anterior de HC/h",
                        Beautify(
                            (60 *
                                60 *
                                (FrozenCookies.lastHCAmount - 1 - currHC)) /
                                ((FrozenCookies.prevLastHCTime -
                                    Game.startDate) /
                                    1000)
                        )
                    )
                );
            }
        }
        menu.append(subsection);

        // --- SEÇÃO DE INFORMAÇÕES DE ROI DE ASCENSÃO ---
        var roi = ascendROIStats();
        if (roi) {
            subsection = $("<div>").addClass("subsection");
            subsection.append(
                $("<div>").addClass("title").text("Informações de ROI de Ascensão")
            );
            subsection.append(
                buildListing(
                    "Modo ROI de ascensão",
                    FrozenCookies.autoAscendToggle == 1 && FrozenCookies.autoAscend == 3 ? "LIGADO" : "DESLIGADO"
                )
            );
            subsection.append(
                buildListing("Novos HCs se ascender agora", Beautify(Math.max(0, roi.newHC)))
            );
            subsection.append(
                buildListing(
                    "Crescimento mínimo necessário",
                    (roi.minGrowthPercent * 100) + "%" + (roi.meetsGrowth ? " (atingido)" : " (não atingido)")
                )
            );
            subsection.append(
                buildListing("Custo de reconstrução (edifícios atuais)", Beautify(roi.rebuildCost))
            );
            subsection.append(
                buildListing(
                    "Tempo de retorno",
                    roi.paybackSecs == Number.POSITIVE_INFINITY
                        ? "nunca (sem ganho de CpS)"
                        : timeDisplay(roi.paybackSecs)
                )
            );
            subsection.append(
                buildListing("Limiar de retorno", roi.thresholdHours + "h")
            );
            subsection.append(
                buildListing(
                    "Ascenderia agora?",
                    roi.wouldAscend ? "SIM" : "não"
                )
            );
            menu.append(subsection);
        }

        // --- SEÇÃO DE INFORMAÇÕES DE COLHEITA (BANCO) ---
        if (FrozenCookies.setHarvestBankPlant) {
            subsection = $("<div>").addClass("subsection");
            subsection.append(
                $("<div>").addClass("title").text("Informações de Colheita")
            );
            subsection.append(buildListing("CPS Base", Beautify(baseCps())));
            subsection.append(
                buildListing("Planta para colher", FrozenCookies.harvestPlant)
            );
            subsection.append(
                buildListing(
                    "Minutos de CpS",
                    FrozenCookies.harvestMinutes + " min"
                )
            );
            subsection.append(
                buildListing(
                    "Percentual máximo do Banco",
                    FrozenCookies.harvestMaxPercent * 100 + " %"
                )
            );
            subsection.append(
                buildListing(
                    "Único " +
                        FrozenCookies.harvestPlant +
                        (FrozenCookies.setHarvestBankPlant < 6
                            ? " colhendo"
                            : " explodindo") +
                        "",
                    Beautify(
                        (baseCps() *
                            60 *
                            FrozenCookies.harvestMinutes *
                            FrozenCookies.harvestFrenzy *
                            FrozenCookies.harvestBuilding) /
                            Math.pow(10, FrozenCookies.maxSpecials)
                    )
                )
            );
            subsection.append(
                buildListing(
                    "Jardim completo " +
                        (FrozenCookies.setHarvestBankPlant < 6
                            ? " colhendo"
                            : " explodindo") +
                        " (36 parcelas)",
                    Beautify(
                        (36 *
                            baseCps() *
                            60 *
                            FrozenCookies.harvestMinutes *
                            FrozenCookies.harvestFrenzy *
                            FrozenCookies.harvestBuilding) /
                            Math.pow(10, FrozenCookies.maxSpecials)
                    )
                )
            );
            menu.append(subsection);
        }

        // --- SEÇÃO DE OUTRAS INFORMAÇÕES ---
        subsection = $("<div>").addClass("subsection");
        subsection.append(
            $("<div>").addClass("title").html("Outras Informações")
        );
        cps =
            baseCps() +
            baseClickingCps(
                FrozenCookies.cookieClickSpeed * FrozenCookies.autoClick
            );
        baseChosen = Game.hasBuff("Frenzy") ? "" : " (*)";
        frenzyChosen = Game.hasBuff("Frenzy") ? " (*)" : "";
        clickStr = FrozenCookies.autoClick ? " + Autoclique" : "";
        subsection.append(
            buildListing("CPS Base" + clickStr + baseChosen + "", Beautify(cps))
        );
        subsection.append(
            buildListing(
                "CPS de Frenesi" + clickStr + frenzyChosen + "",
                Beautify(cps * 7)
            )
        );
        subsection.append(
            buildListing("CPS Efetivo Estimado", Beautify(effectiveCps()))
        );
        if (Game.HasUnlocked("Chocolate egg") && !Game.Has("Chocolate egg")) {
            subsection.append(
                buildListing("Valor do Ovo de Chocolate", Beautify(chocolateValue()))
            );
            if (!Game.hasAura("Earth Shatterer")) {
                subsection.append(
                    buildListing(
                        "+ Earth Shatterer",
                        Beautify(chocolateValue(null, true))
                    )
                );
            }
        }
        if (liveWrinklers().length > 0) {
            subsection.append(
                buildListing("Valor dos Enrugadores", Beautify(wrinklerValue()))
            );
        }
        subsection.append(buildListing("Semente do Jogo", Game.seed));
        var stage = gameStage();
        subsection.append(
            buildListing("Fase do Jogo", stage.label + " - " + stage.reason)
        );
        menu.append(subsection);
        // --- SEÇÃO DE INFORMAÇÕES INTERNAS ---
        subsection = $("<div>").addClass("subsection");
        subsection.append(
            $("<div>").addClass("title").text("Informações Internas")
        );
        buildTable = $("<table>")
            .prop("id", "fcEfficiencyTable")
            .append(
                $("<tr>").append(
                    $("<th>").text("Edifício"),
                    $("<th>").text("Ef%"),
                    $("<th>").text("Eficiência"),
                    $("<th>").text("Custo"),
                    $("<th>").text("Δ CPS")
                )
            );
        recommendationList().forEach(function (rec) {
            var item = rec.purchase,
                chainStr = item.unlocked === 0 ? " (C)" : "";
            buildTable.append(
                $("<tr>").append(
                    $("<td>").append($("<b>").text(item.name + chainStr)),
                    $("<td>").text(
                        (
                            Math.floor(rec.efficiencyScore * 10000) / 100
                        ).toString() + "%"
                    ),
                    $("<td>").text(Beautify(rec.efficiency)),
                    $("<td>").text(Beautify(rec.cost)),
                    $("<td>").text(Beautify(rec.delta_cps))
                )
            );
        });

        // Divisores de tabela
        var dividers = [
            $("<tr>").append($("<td>").attr("colspan", "5").html("&nbsp;")),
            $("<tr>")
                .css("border-top", "2px dashed #999")
                .append($("<td>").attr("colspan", "5").html("&nbsp;")),
        ];

        var banks = [
            {
                name: "Banco da Sorte",
                cost: luckyBank(),
                efficiency: cookieEfficiency(Game.cookies, luckyBank()),
            },
            {
                name: "Banco de Frenesi da Sorte",
                cost: luckyFrenzyBank(),
                efficiency: cookieEfficiency(Game.cookies, luckyFrenzyBank()),
            },
            {
                name: "Banco de Cadeia",
                cost: chainBank(),
                efficiency: cookieEfficiency(Game.cookies, chainBank()),
            },
        ];

        var elderWrathLevels = [
            {
                name: "Prometendo/Apaziguado",
                level: 0,
            },
            {
                name: "Mente Única/Desperto",
                level: 1,
            },
            {
                name: "Descontente",
                level: 2,
            },
            {
                name: "Fúria Total/Enfurecido",
                level: 3,
            },
        ];
        buildTable.append(dividers);
        banks.forEach(function (bank) {
            var deltaCps = effectiveCps(bank.cost) - effectiveCps();
            buildTable.append(
                $("<tr>").append(
                    $("<td>")
                        .attr("colspan", "2")
                        .append(
                            $("<b>").text(
                                bank.name + (deltaCps === 0 ? " (*)" : "")
                            )
                        ),
                    $("<td>").text(Beautify(bank.efficiency)),
                    $("<td>").text(
                        Beautify(Math.max(0, bank.cost - Game.cookies))
                    ),
                    $("<td>").text(Beautify(deltaCps))
                )
            );
        });

        buildTable.append(dividers);
        elderWrathLevels.forEach(function (wrath) {
            buildTable.append(
                $("<tr>").append(
                    $("<td>")
                        .attr("colspan", "2")
                        .append(
                            $("<b>").text(
                                wrath.name +
                                    (Game.elderWrath === wrath.level
                                        ? " (*)"
                                        : "")
                            )
                        ),
                    $("<td>")
                        .attr("colspan", "2")
                        .attr("title", "Razão entre CPS Efetivo e CPS Base")
                        .text(
                            Beautify(
                                effectiveCps(Game.cookies, wrath.level) /
                                    baseCps()
                            )
                        ),
                    $("<td>").text(
                        Beautify(
                            effectiveCps(Game.cookies, wrath.level) -
                                effectiveCps()
                        )
                    )
                )
            );
        });
        subsection.append($("<div>").addClass("listing").append(buildTable));
        menu.append(subsection);

        if (!Game.HasAchiev("Olden days"))
            subsection.append(
                $(
                    '<div id="oldenDays" style="text-align:right;width:100%;"><div ' +
                        Game.clickStr +
                        "=\"Game.SparkleAt(Game.mouseX,Game.mouseY);PlaySound('snd/tick.mp3');PlaySound('snd/shimmerClick.mp3');Game.Win('Olden days');Game.UpdateMenu();\" class=\"icon\" style=\"display:inline-block;transform:scale(0.5);cursor:pointer;width:48px;height:48px;background-position:" +
                        -12 * 48 +
                        "px " +
                        -3 * 48 +
                        'px;"></div></div>'
                )
            );
    };
}

// Percorre os valores de preferência para uma determinada opção.
// CORREÇÃO: os botões do menu são renderizados um por valor com id `<pref>Button_<idx>`
// (veja o grupo de botões de múltipla escolha acima), não um único `<pref>Button` cujo
// texto era trocado - o seletor antigo nunca correspondia, então nunca disparava.
function cyclePreference(preferenceName) {
    var preference = FrozenCookies.preferenceValues[preferenceName];
    if (preference) {
        var display = preference.display;
        var current = FrozenCookies[preferenceName];
        if (display && display.length > 0) {
            var newValue = (current + 1) % display.length;
            $("#" + preferenceName + "Button_" + current).removeClass("selected");
            $("#" + preferenceName + "Button_" + newValue).addClass("selected");
            FrozenCookies[preferenceName] = newValue;
            FrozenCookies.recalculateCaches = true;
            Game.RefreshStore();
            Game.RebuildUpgrades();
            FCStart();
        }
    }
}

// Nova função para opções de múltipla escolha
function setPreferenceDirect(preferenceName, value) {
    var preference = FrozenCookies.preferenceValues[preferenceName];
    if (preference) {
        FrozenCookies[preferenceName] = value;
        FrozenCookies.recalculateCaches = true;
        Game.RefreshStore();
        Game.RebuildUpgrades();
        FCStart();
    }
}

// Abre o painel de log/info integrado do Cookie Clicker.
function openGameLogPanel() {
    Game.ShowMenu("log");
}

// Abre a página de documentação online do Frozen Cookies.
// Nota: Navegadores modernos restringem window.open a abrir apenas novas abas ou janelas conforme as configurações do usuário.
// Não existe uma forma confiável e compatível com todos os navegadores de forçar uma nova instância do navegador via JavaScript devido a restrições de segurança.
// O código a seguir abrirá uma nova janela (que pode ser uma aba, dependendo das configurações do navegador).
function openDocumentationPage() {
    window.open(
        "https://github.com/erbkaiser/FrozenCookies?tab=readme-ov-file#frozencookies",
        "_blank",
        "noopener,noreferrer,width=800,height=600"
    );
}
