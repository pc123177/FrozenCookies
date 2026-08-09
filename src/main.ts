import { installLegacyGlobals } from "./game/legacy-bridge";
import { installPreferences } from "./preferences";

// Ponto de entrada do bundle dist/frozen_cookies.js - substitui o antigo carregador frozen_cookies.js.
// Somente para web (Game.LoadMod): distribuição via Steam/bookmarklet/userscript está fora do escopo.
//
// A ordem de carregamento importa:
// 1. Construir o objeto base FrozenCookies + globais tipados de preferences/legacy-bridge (este
//    arquivo, síncrono) - core/ e game/ ficam prontos antes de qualquer chamada a eles.
// 2. jQuery, depois as libs CDN das quais legacy/fc_button.js + fc_infobox.js ainda dependem
//    (jQuery UI, underscore, jcanvas, jqPlot).
// 3. legacy/*.js, sem bundle e carregados como scripts no escopo global (igual antes) para que
//    suas declarações de funções de nível superior fiquem em window, não presas na IIFE do bundle.
// 4. registerMod, igual a sempre.

// Game.LoadMod() injeta um <script src="..."> simples sem id - document.currentScript é
// a forma confiável de encontrar nossa própria URL, pois resolve para a tag <script> que está
// executando de forma síncrona agora (este bundle não é deferred/async/module, então se aplica
// independentemente de como a tag chegou aqui: Game.LoadMod, uma injeção manual, qualquer coisa).
const currentScript = document.currentScript as HTMLScriptElement | null;
const scriptElement =
    currentScript ??
    document.getElementById("frozenCookieScript") ??
    document.getElementById("modscript_frozen_cookies");
const baseUrl =
    scriptElement !== null
        ? (scriptElement.getAttribute("src") ?? "").replace(/\/frozen_cookies\.js(\?.*)?$/, "")
        : "https://pc123177.github.io/FrozenCookies/dist";

// dist/frozen_cookies.js e src/legacy/*.js são irmãos na raiz do repositório (ambos commitados,
// ambos servidos como estão pelo GitHub Pages) - baseUrl é o diretório dist/, portanto os scripts
// legados ficam um nível acima dele.
const repoRootUrl = baseUrl.replace(/\/dist$/, "");

interface FrozenCookiesBase {
    baseUrl: string;
    branch: string;
    version: string;
    loadInterval?: ReturnType<typeof setInterval> | 0;
    [key: string]: unknown;
}

const windowWithFc = window as unknown as { FrozenCookies: FrozenCookiesBase };
windowWithFc.FrozenCookies = {
    baseUrl,
    branch: "erb-",
    version: "2.052.8", // Manter em sincronia com README.md
};

installPreferences();
installLegacyGlobals();

const legacyScriptList = [
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
    repoRootUrl + "/src/legacy/cc_upgrade_prerequisites.js", // pré-requisitos de upgrades, usado em fc_main.js
    repoRootUrl + "/src/legacy/fc_main.js", // lógica principal
    repoRootUrl + "/src/legacy/fc_gods.js", // minigame dos deuses e opções do dragão
    repoRootUrl + "/src/legacy/fc_spells.js", // minigame de feitiços e lançamento automático
    repoRootUrl + "/src/legacy/fc_bank.js", // minigame do banco
    repoRootUrl + "/src/legacy/fc_button.js", // botão para abrir o menu do Frozen Cookies
    repoRootUrl + "/src/legacy/fc_infobox.js", // caixa de informações
];

declare const $: {
    getScript(url: string, done: () => void): { fail(handler: () => void): void };
    (selector: string): { attr(props: Record<string, string>): { appendTo(target: unknown): void } };
};
declare function registerMod(name: string): void;

// Uma falha transitória de CDN (ex.: um 502 do cdnjs) não deve travar permanentemente a cadeia
// de carregamento - o antigo $.getScript sem tratador .fail() deixava o mod preso para sempre em
// uma requisição ruim. Uma nova tentativa após um breve atraso para o caso transitório, depois
// pula para o próximo script em vez de bloquear tudo que vem depois.
function loadScript(id: number, isRetry: boolean = false): void {
    if (id >= legacyScriptList.length) {
        registerMod("frozen_cookies"); // quando o mod é registrado, os dados salvos são passados na função de carregamento
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
            setTimeout(() => loadScript(id, true), 2000);
        });
    } else if (/\.css$/.exec(url)) {
        $("<link>")
            .attr({ rel: "stylesheet", type: "text/css", href: url })
            .appendTo($("head"));
        loadScript(id + 1);
    } else {
        console.log("Error loading script: " + url);
        loadScript(id + 1);
    }
}

function fcInit(): void {
    const jquery = document.createElement("script");
    jquery.setAttribute("type", "text/javascript");
    jquery.setAttribute("src", "https://code.jquery.com/jquery-3.6.0.min.js");
    jquery.setAttribute("integrity", "sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=");
    jquery.setAttribute("crossorigin", "anonymous");
    jquery.onload = () => loadScript(0);
    document.head.appendChild(jquery);
}

const lastCompatibleVersion = 2.058;
const liveGame = Game as unknown as { version?: number; ready?: boolean };
if (typeof Game !== "undefined" && liveGame.version! > lastCompatibleVersion) {
    console.log("WARNING: The Cookie Clicker version is newer than this version of Frozen Cookies.");
    console.log(
        "This version of Frozen Cookies has only been tested through Cookie Clicker version " +
            lastCompatibleVersion
    );
    console.log(
        "There may be incompatibilities, undesirable effects, bugs, shifts in reality, immoral behavior, and who knows what else."
    );
}

const fc = windowWithFc.FrozenCookies;
fc.loadInterval = setInterval(() => {
    if (typeof Game !== "undefined" && liveGame.ready) {
        clearInterval(fc.loadInterval as ReturnType<typeof setInterval>);
        fc.loadInterval = 0;
        fcInit();
    }
}, 1000);
