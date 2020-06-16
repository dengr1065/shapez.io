const glob = require("glob");
const { execSync } = require("child_process");
const { readFileSync } = require("fs");
const path = require("path");

module.exports = {
    getRevision: function (useLast = false) {
        const commitHash = execSync(`git rev-parse --short ${useLast ? "HEAD^1" : "HEAD"}`, {
            encoding: "utf-8",
        });
        return commitHash.trim();
    },

    getAllResourceImages() {
        return glob
            .sync("res/**/*.@(png|svg|jpg)", { cwd: ".." })
            .map(f => f.replace(/^res\//gi, ""))
            .filter(f => {
                if (f.indexOf("ui") >= 0) {
                    // We drop all ui images except for the noinline ones
                    return f.indexOf("noinline") >= 0;
                }
                return true;
            });
    },

    getAllAtlasImages() {
        return glob
            .sync("res_built/atlas/*.png", { cwd: ".." })
            .map(s => s.replace("res_built/atlas/", "res/"));
    },

    getAllSounds() {
        return glob
            .sync("res_built/sounds/**/*.mp3", { cwd: ".." })
            .map(s => s.replace("res_built/sounds/", "res/sounds/"));
    },

    getVersion: () => readFileSync(path.join(__dirname, "version"), "utf-8").trim(),

    /**
     * @param {string} url
     * @param {string} commitHash
     */
    cachebust: (url, commitHash) => "/v/" + commitHash + "/" + url,
};
