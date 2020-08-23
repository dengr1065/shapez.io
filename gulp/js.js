const path = require("path");

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

function gulptasksJS($, gulp, buildFolder, browserSync) {

    //// DEV

    gulp.task("js.dev.watch", () => {
        return gulp
            .src("../src/js/main.js")
            .pipe(
                $.webpackStream(
                    requireUncached("./webpack.config.js")({
                        watch: true,
                    })
                )
            )
            .pipe(gulp.dest(buildFolder))
            .pipe(browserSync.stream());
    });

    gulp.task("js.dev", () => {
        return gulp
            .src("../src/js/main.js")
            .pipe($.webpackStream(requireUncached("./webpack.config.js")({})))
            .pipe(gulp.dest(buildFolder));
    });

    //// STAGING

    gulp.task("js.staging", () => {
        return gulp
            .src("../src/js/main.js")
            .pipe(
                $.webpackStream(
                    requireUncached("./webpack.production.config.js")({
                        enableAssert: true,
                        environment: "staging",
                        es6: true,
                    })
                )
            )
            .pipe(gulp.dest(buildFolder));
    });

    //// PROD

    gulp.task("js.prod", () => {
        return gulp
            .src("../src/js/main.js")
            .pipe(
                $.webpackStream(
                    requireUncached("./webpack.production.config.js")({
                        enableAssert: false,
                        environment: "prod",
                        es6: true,
                    })
                )
            )
            .pipe(gulp.dest(buildFolder))
            .pipe(browserSync.stream());
    });

    //// STANDALONE

    gulp.task("js.standalone-dev.watch", () => {
        return gulp
            .src("../src/js/main.js")
            .pipe(
                $.webpackStream(
                    requireUncached("./webpack.config.js")({
                        watch: true,
                        standalone: true,
                    })
                )
            )
            .pipe(gulp.dest(buildFolder))
            .pipe(browserSync.stream());
    });

    gulp.task("js.standalone-dev", () => {
        return gulp
            .src("../src/js/main.js")
            .pipe(
                $.webpackStream(
                    requireUncached("./webpack.config.js")({
                        standalone: true,
                    })
                )
            )
            .pipe(gulp.dest(buildFolder));
    });

    gulp.task("js.standalone-beta", () => {
        return gulp
            .src("../src/js/main.js")
            .pipe(
                $.webpackStream(
                    requireUncached("./webpack.production.config.js")({
                        enableAssert: true,
                        environment: "staging",
                        es6: true,
                        standalone: true,
                    })
                )
            )
            .pipe(gulp.dest(buildFolder));
    });

    gulp.task("js.standalone-prod", () => {
        return gulp
            .src("../src/js/main.js")
            .pipe(
                $.webpackStream(
                    requireUncached("./webpack.production.config.js")({
                        enableAssert: false,
                        environment: "prod",
                        es6: true,
                        standalone: true,
                    })
                )
            )
            .pipe(gulp.dest(buildFolder));
    });
}

module.exports = {
    gulptasksJS,
};
