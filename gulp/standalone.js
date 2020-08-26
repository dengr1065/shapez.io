const packager = require("electron-packager");
const path = require("path");
const { getVersion } = require("./buildutils");
const fs = require("fs");
const fse = require("fs-extra");

function gulptasksStandalone($, gulp) {
    const electronBaseDir = path.join(__dirname, "..", "electron");

    const tempDestDir = path.join(__dirname, "..", "tmp_standalone_files");
    const tempDestBuildDir = path.join(tempDestDir, "built");

    gulp.task("standalone.prepare.cleanup", () => {
        return gulp.src(tempDestDir, { read: false, allowEmpty: true }).pipe($.clean({ force: true }));
    });

    gulp.task("standalone.prepare.copyPrefab", () => {
        // const requiredFiles = $.glob.sync("../electron/");
        const requiredFiles = [
            path.join(electronBaseDir, "lib", "**", "*.node"),
            path.join(electronBaseDir, "node_modules", "**", "*.*"),
            path.join(electronBaseDir, "node_modules", "**", ".*"),
            path.join(electronBaseDir, "favicon*"),

            // fails on platforms which support symlinks
            // https://github.com/gulpjs/gulp/issues/1427
            // path.join(electronBaseDir, "node_modules", "**", "*"),
        ];
        return gulp.src(requiredFiles, { base: electronBaseDir }).pipe(gulp.dest(tempDestBuildDir));
    });

    gulp.task("standalone.prepare.writePackageJson", cb => {
        fs.writeFileSync(
            path.join(tempDestBuildDir, "package.json"),
            JSON.stringify(
                {
                    devDependencies: {
                        electron: "6.1.12",
                    },
                },
                null,
                4
            )
        );
        cb();
    });

    gulp.task("standalone.prepare.minifyCode", () => {
        return gulp.src(path.join(electronBaseDir, "*.js")).pipe(gulp.dest(tempDestBuildDir));
    });

    gulp.task("standalone.prepare.copyGamefiles", () => {
        return gulp.src("../build/**/*.*", { base: "../build" }).pipe(gulp.dest(tempDestBuildDir));
    });

    gulp.task(
        "standalone.prepare",
        gulp.series(
            "standalone.prepare.cleanup",
            "standalone.prepare.copyPrefab",
            "standalone.prepare.writePackageJson",
            "standalone.prepare.minifyCode",
            "standalone.prepare.copyGamefiles"
        )
    );

    /**
     *
     * @param {'win32'|'linux'|'darwin'} platform
     * @param {'x64'|'ia32'} arch
     * @param {function():void} cb
     */
    function packageStandalone(platform, arch, cb) {
        packager({
            dir: tempDestBuildDir,
            appCopyright: "Danyjil Hryhorjev",
            appVersion: getVersion(),
            buildVersion: "1.0.0",
            arch,
            platform,
            asar: true,
            executableName: "fluidshapez",
            icon: path.join(electronBaseDir, "icon"),
            name: "fluidshapez",
            out: tempDestDir,
            overwrite: true,
            appBundleId: "io.fluidshapez.standalone",
            appCategoryType: "public.app-category.games",
        }).then(
            appPaths => {
                console.log("Packages created:", appPaths);
                appPaths.forEach(appPath => {
                    if (!fs.existsSync(appPath)) {
                        console.error("Bad app path gotten:", appPath);
                        return;
                    }

                    fs.writeFileSync(
                        path.join(appPath, "LICENSE"),
                        fs.readFileSync(path.join(__dirname, "..", "LICENSE"))
                    );

                    if (platform === "linux") {
                        fs.writeFileSync(
                            path.join(appPath, "play.sh"),
                            '#!/usr/bin/env bash\n./fluidshapez --no-sandbox "$@"\n'
                        );
                        fs.chmodSync(path.join(appPath, "play.sh"), 0o775);
                    }

                    if (platform === "darwin") {
                        // Clear up framework folders
                        fs.writeFileSync(
                            path.join(appPath, "play.sh"),
                            '#!/usr/bin/env bash\n./fluidshapez.app/Contents/MacOS/fluidshapez --no-sandbox "$@"\n'
                        );
                        fs.chmodSync(path.join(appPath, "play.sh"), 0o775);
                        fs.chmodSync(
                            path.join(appPath, "fluidshapez.app", "Contents", "MacOS", "fluidshapez"),
                            0o775
                        );

                        const finalPath = path.join(appPath, "fluidshapez.app");

                        const frameworksDir = path.join(finalPath, "Contents", "Frameworks");
                        const frameworkFolders = fs
                            .readdirSync(frameworksDir)
                            .filter(fname => fname.endsWith(".framework"));

                        for (let i = 0; i < frameworkFolders.length; ++i) {
                            const folderName = frameworkFolders[i];
                            const frameworkFolder = path.join(frameworksDir, folderName);
                            console.log(" -> ", frameworkFolder);

                            const filesToDelete = fs
                                .readdirSync(frameworkFolder)
                                .filter(fname => fname.toLowerCase() !== "versions");
                            filesToDelete.forEach(fname => {
                                console.log("    -> Deleting", fname);
                                fs.unlinkSync(path.join(frameworkFolder, fname));
                            });

                            const frameworkSourceDir = path.join(frameworkFolder, "Versions", "A");
                            fse.copySync(frameworkSourceDir, frameworkFolder);
                        }
                    }
                });

                cb();
            },
            err => {
                console.error("Packaging error:", err);
                cb();
            }
        );
    }

    gulp.task("standalone.package.win64", cb => packageStandalone("win32", "x64", cb));
    gulp.task("standalone.package.win32", cb => packageStandalone("win32", "ia32", cb));
    gulp.task("standalone.package.linux64", cb => packageStandalone("linux", "x64", cb));
    gulp.task("standalone.package.linux32", cb => packageStandalone("linux", "ia32", cb));
    gulp.task("standalone.package.darwin64", cb => packageStandalone("darwin", "x64", cb));

    gulp.task(
        "standalone.package",
        gulp.series(
            "standalone.prepare",
            gulp.parallel(
                "standalone.package.win64",
                "standalone.package.linux64",
                "standalone.package.darwin64"
            )
        )
    );
}

module.exports = { gulptasksStandalone };
