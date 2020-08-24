/**
 * ES6 Bundle Loader
 *
 * Attempts to load the game code, and if that fails tries with the transpiled
 * version. Also handles errors during load.
 */

(function () {
    function makeJsTag(src) {
        var script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        script.charset = "utf-8";
        script.defer = true;
        return script;
    }

    function onJsLoaded() {
        console.log("👀 Core loaded at", Math.floor(performance.now()), "ms");
    }

    const script = makeJsTag(bundleSrc);
    script.addEventListener("load", onJsLoaded);
    document.head.appendChild(script);
})();
