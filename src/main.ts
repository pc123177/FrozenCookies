import { installLegacyGlobals } from "./game/legacy-bridge";
import { installPreferences } from "./preferences";

// Entry point for the dist/frozen_cookies.js bundle - replaces the old frozen_cookies.js
// loader. Web-only (Game.LoadMod): Steam/bookmarklet/userscript distribution is out of scope.
//
// Load order matters:
// 1. Build the FrozenCookies base object + typed preferences/legacy-bridge globals (this
//    file, synchronous) - core/ and game/ are ready before anything calls into them.
// 2. jQuery, then the CDN libs legacy/fc_button.js + fc_infobox.js still depend on
//    (jQuery UI, underscore, jcanvas, jqPlot).
// 3. legacy/*.js, unbundled and loaded as plain global-scope scripts (same as before) so
//    their top-level function declarations stay on window, not trapped in the bundle's IIFE.
// 4. registerMod, same as always.

// Game.LoadMod() injects a plain <script src="..."> with no id - document.currentScript is
// the reliable way to find our own URL, since it resolves to whichever <script> tag is
// synchronously executing right now (this bundle isn't deferred/async/module, so it applies
// regardless of how the tag got here: Game.LoadMod, a manual injection, anything).
const currentScript = document.currentScript as HTMLScriptElement | null;
const scriptElement =
    currentScript ??
    document.getElementById("frozenCookieScript") ??
    document.getElementById("modscript_frozen_cookies");
const baseUrl =
    scriptElement !== null
        ? (scriptElement.getAttribute("src") ?? "").replace(/\/frozen_cookies\.js(\?.*)?$/, "")
        : "https://pc123177.github.io/FrozenCookies/dist";

// dist/frozen_cookies.js and src/legacy/*.js are siblings at the repo root (both committed,
// both served as-is by GitHub Pages) - baseUrl is the dist/ dir, so legacy scripts live one
// level up from it.
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
    version: "2.052.8", // Keep in sync with README.md
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
    repoRootUrl + "/src/legacy/cc_upgrade_prerequisites.js", // upgrade prerequisites, used in fc_main.js
    repoRootUrl + "/src/legacy/fc_main.js", // main logic
    repoRootUrl + "/src/legacy/fc_gods.js", // gods minigame and dragon options
    repoRootUrl + "/src/legacy/fc_spells.js", // spells minigame and autocasting
    repoRootUrl + "/src/legacy/fc_bank.js", // bank minigame
    repoRootUrl + "/src/legacy/fc_button.js", // button to open the Frozen Cookies menu
    repoRootUrl + "/src/legacy/fc_infobox.js", // infobox
];

declare const $: {
    getScript(url: string, done: () => void): { fail(handler: () => void): void };
    (selector: string): { attr(props: Record<string, string>): { appendTo(target: unknown): void } };
};
declare function registerMod(name: string): void;

// A transient CDN failure (e.g. a 502 from cdnjs) must not permanently wedge the load
// chain - the old fire-and-forget $.getScript with no .fail() handler left the mod stuck
// forever on one bad request. One retry after a short delay for the transient case, then
// skip to the next script rather than block loading everything after it.
function loadScript(id: number, isRetry: boolean = false): void {
    if (id >= legacyScriptList.length) {
        registerMod("frozen_cookies"); // when the mod is registered, the save data is passed in the load function
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
