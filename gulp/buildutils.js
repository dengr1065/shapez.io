const glob = require("glob");
const execSync = require("child_process").execSync;

const { version } = require("../package.json");

module.exports = {
    getRevision: function (useLast = false) {
        return execSync(`git rev-parse --short ${useLast ? "HEAD^1" : "HEAD"}`, {
            encoding: "ascii"
        }).trim();
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

    getVersion() {
        return version;
    },

    /**
     * @param {string} url
     * @param {string} commitHash
     */
    cachebust(url, commitHash) {
        return "/v/" + commitHash + "/" + url;
    },
};
