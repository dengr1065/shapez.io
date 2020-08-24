const buildUtils = require("./buildutils");
const fs = require("fs");
const path = require("path");

function gulptasksHTML($, gulp, buildFolder) {
    const commitHash = buildUtils.getRevision();

    async function buildHtml({ standalone = false, app = false, enableCachebust = true }) {
        function cachebust(url) {
            if (enableCachebust) {
                return buildUtils.cachebust(url, commitHash);
            }
            return url;
        }

        const hasLocalFiles = standalone || app;

        return gulp
            .src("../src/html/" + (standalone ? "index.standalone.html" : "index.html"))
            .pipe(
                $.dom(/** @this {Document} **/ function () {
                    const document = this;

                    // Append css
                    const css = document.createElement("link");
                    css.rel = "stylesheet";
                    css.type = "text/css";
                    css.media = "none";
                    css.setAttribute("onload", "this.media='all'");
                    css.href = cachebust("main.css");
                    document.head.appendChild(css);

                    // Do not need to preload in app or standalone
                    if (!hasLocalFiles) {
                        // Preload essentials
                        const preloads = ["fonts/FiraMono.woff2"];

                        preloads.forEach(src => {
                            const preloadLink = document.createElement("link");
                            preloadLink.rel = "preload";
                            preloadLink.href = cachebust("res/" + src);
                            if (src.endsWith(".woff2")) {
                                preloadLink.setAttribute("crossorigin", "anonymous");
                                preloadLink.setAttribute("as", "font");
                            } else {
                                preloadLink.setAttribute("as", "image");
                            }
                            document.head.appendChild(preloadLink);
                        });
                    }

                    const loadingCss = `
                    @font-face {
                        font-family: "GameFont";
                        font-style: normal;
                        font-weight: normal;
                        font-display: swap;
                        src: url("${cachebust("res/fonts/FiraMono.woff2")}") format("woff2");
                    }

                    :root {
                        font-family: "GameFont";
                        background-color: #222;
                        color: white;
                    }
                    `;

                    const style = document.createElement("style");
                    style.setAttribute("type", "text/css");
                    style.textContent = loadingCss;
                    document.head.appendChild(style);

                    const bundleScript = document.createElement("script");
                    bundleScript.type = "text/javascript";
                    bundleScript.src = "bundle.js";
                    document.head.appendChild(bundleScript);

                    const bodyContent = `<div>Preparing sources...</div>`;

                    document.body.innerHTML = bodyContent;
                })
            )
            .pipe(
                $.htmlmin({
                    caseSensitive: true,
                    collapseBooleanAttributes: true,
                    collapseInlineTagWhitespace: true,
                    collapseWhitespace: true,
                    preserveLineBreaks: true,
                    minifyJS: true,
                    minifyCSS: true,
                    quoteCharacter: '"',
                    useShortDoctype: true,
                })
            )
            .pipe($.htmlBeautify())
            .pipe($.rename("index.html"))
            .pipe(gulp.dest(buildFolder));
    }

    gulp.task("html.dev", () => {
        return buildHtml({
            enableCachebust: false
        });
    });

    gulp.task("html", () => {
        return buildHtml({});
    });

    gulp.task("html.standalone-dev", () => {
        return buildHtml({
            standalone: true,
            enableCachebust: false
        });
    });

    gulp.task("html.standalone", () => {
        return buildHtml({
            standalone: true,
            enableCachebust: false
        });
    });
}

module.exports = {
    gulptasksHTML
};
