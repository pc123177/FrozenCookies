// Global Variables
var lastCompatibleVersion = 2.052;

if (Game.version > lastCompatibleVersion) {
    console.log("WARNING: Cookie Clicker version is newer than FrozenCookies test version.");
}

// Force base URL to your repo
var baseUrl = "https://raw.githubusercontent.com/pc123177/FrozenCookies/main/";

var FrozenCookies = {
    baseUrl: baseUrl,
    branch: "main",
    version: "2.052.8"
};

// Load external libraries and FC scripts in order
var script_list = [
    "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
    "https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.13.6/underscore-min.js",
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

    baseUrl + "fc_preferences.js",
    baseUrl + "cc_upgrade_prerequisites.js",
    baseUrl + "fc_main.js",
    baseUrl + "fc_gods.js",
    baseUrl + "fc_spells.js",
    baseUrl + "fc_bank.js",
    baseUrl + "fc_button.js",
    baseUrl + "fc_infobox.js"
];

// Wait for game to load
FrozenCookies.loadInterval = setInterval(function () {
    if (Game && Game.ready) {
        clearInterval(FrozenCookies.loadInterval);
        FrozenCookies.loadInterval = 0;
        loadScript(0);
    }
}, 1000);

function loadScript(id) {

    if (id >= script_list.length) {
        Game.registerMod("frozen_cookies", {});
        console.log("FrozenCookies loaded");
        return;
    }

    var url = script_list[id];

    if (url.endsWith(".js")) {

        var script = document.createElement("script");
        script.src = url;

        script.onload = function () {
            loadScript(id + 1);
        };

        document.head.appendChild(script);

    } else if (url.endsWith(".css")) {

        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;

        document.head.appendChild(link);

        loadScript(id + 1);
    }
}