const path = require("path");
const fs = require("fs");

const buildUtils = require("./buildutils");

function gulptasksFTP($, gulp, buildFolder) {
    const commitHash = buildUtils.getRevision();

    const additionalFolder = path.join(__dirname, "additional_build_files");

    const additionalFiles = [
        path.join(additionalFolder, "*"),
        path.join(additionalFolder, "*.*"),
        path.join(additionalFolder, ".*"),
    ];

    const credentials = {
        host: process.env.SHAPEZ_CLI_SERVER_HOST,
        user: process.env.SHAPEZ_CLI_SFTP_USER,
        pass: process.env.SHAPEZ_CLI_SFTP_PASS
    };

    // Write the "commit.txt" file
    gulp.task("ftp.writeVersion", cb => {
        fs.writeFileSync(
            path.join(buildFolder, "version.json"),
            JSON.stringify(
                {
                    commit: buildUtils.getRevision(),
                    appVersion: buildUtils.getVersion(),
                    buildTime: new Date().getTime(),
                },
                null,
                4
            )
        );
        cb();
    });

    const gameSrcGlobs = [
        path.join(buildFolder, "**/*.*"),
        path.join(buildFolder, "**/.*"),
        path.join(buildFolder, "**/*"),
        path.join(buildFolder, "!**/index.html"),
    ];

    gulp.task(`ftp.upload.game`, () => {
        return gulp
            .src(gameSrcGlobs, { base: buildFolder })
            .pipe(
                $.rename(pth => {
                    pth.dirname = path.join("v", commitHash, pth.dirname);
                })
            )
            .pipe($.sftp(credentials));
    });

    gulp.task(`ftp.upload.indexHtml`, () => {
        return gulp
            .src([path.join(buildFolder, "index.html"), path.join(buildFolder, "version.json")], {
                base: buildFolder
            })
            .pipe($.sftp(credentials));
    });

    gulp.task(`ftp.upload.additionalFiles`, () => {
        return gulp
            .src(additionalFiles, { base: additionalFolder })
            .pipe($.sftp(credentials));
    });

    gulp.task(
        "ftp.upload",
        gulp.series(
            "ftp.writeVersion",
            "ftp.upload.game",
            "ftp.upload.indexHtml",
            "ftp.upload.additionalFiles"
        )
    );
}

module.exports = {
    gulptasksFTP
};
