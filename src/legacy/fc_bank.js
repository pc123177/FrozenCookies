function autoBankAction() {
    if (!B || hasClickBuff()) return;

    //Atualiza o nível do banco
    let currentOffice = B.offices[B.officeLevel];
    if (
        currentOffice.cost &&
        Game.Objects["Cursor"].amount >= currentOffice.cost[0] &&
        Game.Objects["Cursor"].level >= currentOffice.cost[1]
    ) {
        var countBankCursor = currentOffice.cost[0];
        l("bankOfficeUpgrade").click();
        safeBuy(Game.Objects["Cursor"], countBankCursor);
        FrozenCookies.autobuyCount += 1;
        logEvent(
            "AutoBank",
            "Nível do banco atualizado por " + countBankCursor + " cursores"
        );
        Game.recalculateGains = 1;
        Game.upgradesToRebuild = 1;
    }
}

function autoBrokerAction() {
    if (!B) return; // Sai se não tiver mercado de ações

    //Contratar corretores
    var delay = delayAmount(); //GC ou colheita do banco
    var recommendation = nextPurchase();
    if (
        recommendation.type == "building" && // Não contratar ao economizar para upgrade
        B.brokers < B.getMaxBrokers() &&
        Game.cookies >= delay + B.getBrokerPrice()
    ) {
        l("bankBrokersBuy").click();
        logEvent(
            "AutoBroker",
            "Contratou um corretor por " + Beautify(B.getBrokerPrice()) + " cookies"
        );
        Game.recalculateGains = 1;
        Game.upgradesToRebuild = 1;
    }
}

function autoLoanBuy() {
    if (!B || B.officeLevel < 2) return;

    if (
        hasClickBuff() &&
        !Game.hasBuff("Cursed finger") &&
        cpsBonus() >= FrozenCookies.minLoanMult &&
        clickBuffTimeRemaining() >= 5
    ) {
        if (B.officeLevel >= 2) B.takeLoan(1);
        if (B.officeLevel >= 4) B.takeLoan(2);
        if (B.officeLevel >= 5 && FrozenCookies.autoLoan == 2) B.takeLoan(3);
    }
}
