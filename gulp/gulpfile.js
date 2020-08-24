/* eslint-disable */

require("colors");

const gulp = require("gulp");
const browserSync = require("browser-sync").create({});
const path = require("path");
const deleteEmpty = require("delete-empty");
const execSync = require("child_process").execSync;

// Load other plugins dynamically
const $ = require("gulp-load-plugins")({
    scope: ["devDependencies"],
    pattern: "*",
});

// Check environment variables

const envVars = [
    "SHAPEZ_CLI_SERVER_HOST",
    "SHAPEZ_CLI_SFTP_USER",
    "SHAPEZ_CLI_SFTP_PASS",
    "SHAPEZ_CLI_SFTP_ROOT"
];

for (let i = 0; i < envVars.length; ++i) {
    if (!process.env[envVars[i]]) {
        console.warn("Please set", envVars[i]);
        // process.exit(1);
    }
}

const baseDir = path.join(__dirname, "..");
const buildFolder = path.join(baseDir, "build");

const imgres = require("./image-resources");
imgres.gulptasksImageResources($, gulp, buildFolder);

const css = require("./css");
css.gulptasksCSS($, gulp, buildFolder, browserSync);

const sounds = require("./sounds");
sounds.gulptasksSounds($, gulp, buildFolder);

const js = require("./js");
js.gulptasksJS($, gulp, buildFolder, browserSync);

const html = require("./html");
html.gulptasksHTML($, gulp, buildFolder);

const ftp = require("./ftp");
ftp.gulptasksFTP($, gulp, buildFolder);

const docs = require("./docs");
docs.gulptasksDocs($, gulp, buildFolder);

const standalone = require("./standalone");
standalone.gulptasksStandalone($, gulp);

const translations = require("./translations");
translations.gulptasksTranslations($, gulp);

/////////////////////  BUILD TASKS  /////////////////////

// Cleans up everything
gulp.task("utils.cleanBuildFolder", () => {
    return gulp.src(buildFolder, { read: false, allowEmpty: true }).pipe($.clean({ force: true }));
});
gulp.task("utils.cleanBuildTempFolder", () => {
    return gulp
        .src(path.join(__dirname, "..", "src", "js", "built-temp"), { read: false, allowEmpty: true })
        .pipe($.clean({ force: true }));
});

gulp.task("utils.cleanup", gulp.series("utils.cleanBuildFolder", "utils.cleanBuildTempFolder"));

// Requires no uncomitted files
gulp.task("utils.requireCleanWorkingTree", cb => {
    let output = execSync("git status -su", {
        encoding: "utf-8"
    }).trim().replace(/\r/gi, "").split("\n");

    // Filter files which are OK to be untracked
    output = output
        .map(x => x.replace(/[\r\n]+/gi, ""))
        .filter(x => x.indexOf(".local.js") < 0)
        .filter(x => x.length > 0);
    if (output.length > 0) {
        console.error("\n\nYou have unstaged changes, please commit everything first!");
        console.error("Unstaged files:");
        console.error(output.map(x => "'" + x + "'").join("\n"));
        process.exit(1);
    }
    cb();
});

gulp.task("utils.copyAdditionalBuildFiles", cb => {
    const additionalFolder = path.join("additional_build_files");
    const additionalSrcGlobs = [
        path.join(additionalFolder, "**/*.*"),
        path.join(additionalFolder, "**/.*"),
        path.join(additionalFolder, "**/*"),
    ];

    return gulp.src(additionalSrcGlobs).pipe(gulp.dest(buildFolder));
});

// Starts a webserver on the built directory (useful for testing prod build)
gulp.task("main.webserver", () => {
    return gulp.src(buildFolder).pipe(
        $.webserver({
            livereload: {
                enable: true,
            },
            directoryListing: false,
            open: true,
            port: 3005,
        })
    );
});

function serve({ standalone }) {
    browserSync.init({
        server: buildFolder,
        port: 3005,
        ghostMode: {
            clicks: false,
            scroll: false,
            location: false,
            forms: false,
        },
        logLevel: "info",
        logPrefix: "BS",
        online: false,
        xip: false,
        notify: false,
        reloadDebounce: 100,
        reloadOnRestart: true,
        watchEvents: ["add", "change"],
    });

    // Watch .scss files, those trigger a css rebuild
    gulp.watch(["../src/**/*.scss"], gulp.series("css.dev"));

    // Watch .html files, those trigger a html rebuild
    gulp.watch("../src/**/*.html", gulp.series(standalone ? "html.standalone-dev" : "html.dev"));

    // Watch sound files
    // gulp.watch(["../res_raw/sounds/**/*.mp3", "../res_raw/sounds/**/*.wav"], gulp.series("sounds.dev"));

    // Watch translations
    gulp.watch("../translations/**/*.yaml", gulp.series("translations.convertToJson"));

    gulp.watch(
        ["../res_raw/sounds/sfx/*.mp3", "../res_raw/sounds/sfx/*.wav"],
        gulp.series("sounds.sfx", "sounds.copy")
    );
    gulp.watch(
        ["../res_raw/sounds/music/*.mp3", "../res_raw/sounds/music/*.wav"],
        gulp.series("sounds.music", "sounds.copy")
    );

    // Watch resource files and copy them on change
    gulp.watch(imgres.rawImageResourcesGlobs, gulp.series("imgres.buildAtlas"));
    gulp.watch(imgres.nonImageResourcesGlobs, gulp.series("imgres.copyNonImageResources"));
    gulp.watch(imgres.imageResourcesGlobs, gulp.series("imgres.copyImageResources"));

    // Watch .atlas files and recompile the atlas on change
    gulp.watch("../res_built/atlas/*.atlas", gulp.series("imgres.atlasToJson"))
    gulp.watch("../res_built/atlas/*.json", gulp.series("imgres.atlas"));

    // Watch the build folder and reload when anything changed
    const extensions = ["html", "js", "png", "gif", "jpg", "svg", "mp3", "ico", "woff2", "json"];
    gulp.watch(extensions.map(ext => path.join(buildFolder, "**", "*." + ext))).on("change", function (path) {
        return gulp.src(path).pipe(browserSync.reload({ stream: true }));
    });

    gulp.watch("../src/js/built-temp/*.json").on("change", function (path) {
        return gulp.src(path).pipe(browserSync.reload({ stream: true }));
    });

    // Start the webpack watching server (Will never return)
    if (standalone) {
        gulp.series("js.standalone-dev.watch")(() => true);
    } else {
        gulp.series("js.dev.watch")(() => true);
    }
}

/////////////////////  RUNNABLE TASKS  /////////////////////

// Pre and postbuild
gulp.task("step.baseResources", gulp.series("imgres.allOptimized"));
gulp.task("step.deleteEmpty", cb => {
    deleteEmpty.sync(buildFolder);
    cb();
});

gulp.task("step.postbuild", gulp.series("imgres.cleanupUnusedCssInlineImages", "step.deleteEmpty"));

// Builds everything (dev)
gulp.task(
    "build.dev",
    gulp.series(
        "utils.cleanup",
        "utils.copyAdditionalBuildFiles",
        "imgres.buildAtlas",
        "imgres.atlasToJson",
        "imgres.atlas",
        "sounds.dev",
        "imgres.copyImageResources",
        "imgres.copyNonImageResources",
        "translations.fullBuild",
        "css.dev",
        "html.dev"
    )
);

// Builds everything (standalone -dev)
gulp.task(
    "build.standalone.dev",
    gulp.series(
        "utils.cleanup",
        "imgres.atlas",
        "sounds.dev",
        "imgres.copyImageResources",
        "imgres.copyNonImageResources",
        "translations.fullBuild",
        "js.standalone-dev",
        "css.dev",
        "html.standalone-dev"
    )
);

// Builds everything
gulp.task("step.code", gulp.series("sounds.fullbuild", "translations.fullBuild", "js"));
gulp.task(
    "step.mainbuild",
    gulp.parallel("utils.copyAdditionalBuildFiles", "step.baseResources", "step.code")
);
gulp.task("step.all", gulp.series("step.mainbuild", "css", "html"));
gulp.task("build", gulp.series("utils.cleanup", "step.all", "step.postbuild"));

// Builds everything (standalone-prod)
gulp.task(
    "step.standalone.code",
    gulp.series("sounds.fullbuildHQ", "translations.fullBuild", "js.standalone")
);
gulp.task("step.standalone.mainbuild", gulp.parallel("step.baseResources", "step.standalone.code"));
gulp.task(
    "step.standalone.all",
    gulp.series("step.standalone.mainbuild", "css.standalone", "html.standalone")
);
gulp.task(
    "build.standalone",
    gulp.series("utils.cleanup", "step.standalone.all", "step.postbuild")
);

// Deploying!
gulp.task("main.deploy", gulp.series("utils.requireCleanWorkingTree", "build", "ftp.upload"));
gulp.task("main.standalone", gulp.series("build.standalone", "standalone.package"));

// Live-development
gulp.task(
    "main.serveDev",
    gulp.series("build.dev", () => serve({ standalone: false }))
);
gulp.task(
    "main.serveStandalone",
    gulp.series("build.standalone.dev", () => serve({ standalone: true }))
);

gulp.task("default", gulp.series("main.serveDev"));
