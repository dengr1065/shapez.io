/* eslint-disable quotes,no-undef */

const { app, BrowserWindow, Menu, MenuItem } = require("electron");
const path = require("path");
const url = require("url");
const childProcess = require("child_process");
const { ipcMain } = require("electron");
const fs = require("fs");
const isDev = process.argv.indexOf("--dev") >= 0;
const isLocal = process.argv.indexOf("--local") >= 0;

const storePath = path.join(app.getPath("appData"), "shapez.io");
const savesDir = path.join(localDataDir, "savegames");
const screenshotsDir = path.join(localDataDir, "screenshots");

const temporaryDir = fs.mkdtempSync("shapezio");

[savesDir, screenshotsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }
});

/** @type {BrowserWindow} */
let win = null;
let menu = null;

function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        backgroundColor: "#222428",
        useContentSize: true,
        minWidth: 800,
        minHeight: 600,
        title: "shapez.io",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
        },
        allowRunningInsecureContent: false
    });

    if (isLocal) {
        win.loadURL("http://localhost:3005");
    } else {
        win.loadURL(
            url.format({
                pathname: path.join(__dirname, "index.html"),
                protocol: "file:",
                slashes: true
            })
        );
    }
    win.webContents.session.clearCache();
    win.webContents.session.clearStorageData();

    win.webContents.on("new-window", (event, pth) => {
        event.preventDefault();
        if (process.platform == "win32") {
            childProcess.execSync("start " + pth);
        } else if (process.platform == "linux") {
            childProcess.execSync("xdg-open " + pth);
        }
    });

    win.on("closed", () => {
        console.log("Window closed");
        win = null;
        app.quit();
    });

    if (isDev) {
        menu = new Menu();

        const mainItem = new MenuItem({
            label: "Toggle Dev Tools",
            click: () => win.toggleDevTools(),
            accelerator: "F12"
        });
        menu.append(mainItem);

        const reloadItem = new MenuItem({
            label: "Restart",
            click: () => win.reload(),
            accelerator: "F5"
        });
        menu.append(reloadItem);

        const fullscreenItem = new MenuItem({
            label: "Fullscreen",
            click: () => win.setFullScreen(!win.isFullScreen()),
            accelerator: "F11"
        });
        menu.append(fullscreenItem);

        Menu.setApplicationMenu(menu);
    } else {
        Menu.setApplicationMenu(null);
    }

    win.once("ready-to-show", () => {
        win.show();
        win.focus();
    });
}

if (!app.requestSingleInstanceLock()) {
    app.exit(0);
} else {
    app.on("second-instance", (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus
        if (win) {
            if (win.isMinimized()) {
                win.restore();
            }
            win.focus();
        }
    });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    console.log("All windows closed");
    app.quit();
});

ipcMain.on("set-fullscreen", (event, flag) => {
    win.setFullScreen(flag);
});

ipcMain.on("exit-app", (event, flag) => {
    win.close();
    app.quit();
});

function performFsJob(job) {
    let fname = path.join(storePath, job.filename);

    switch (job.type) {
        case "read": {
            if (!fs.existsSync(fname)) {
                return {
                    // Special FILE_NOT_FOUND error code
                    error: "file_not_found"
                };
            }

            let contents = "";
            try {
                contents = fs.readFileSync(fname, { encoding: "utf8" });
            } catch (ex) {
                return {
                    error: ex
                };
            }

            return {
                success: true,
                data: contents
            };
        }
        case "write": {
            try {
                const tmpName = path.join(temporaryDir, path.basename(fname));
                fs.writeFileSync(tmpName, job.contents);

                fs.renameSync(tmpName, fname);
            } catch (ex) {
                return {
                    error: ex
                };
            }

            return {
                success: true,
                data: job.contents
            };
        }

        case "delete": {
            try {
                fs.unlinkSync(fname);
            } catch (ex) {
                return {
                    error: ex
                };
            }

            return {
                success: true,
                data: null
            };
        }

        default:
            throw new Error("Unkown fs job: " + job.type);
    }
}

ipcMain.on("fs-job", (event, arg) => {
    const result = performFsJob(arg);
    event.reply("fs-response", { id: arg.id, result });
});

ipcMain.on("fs-sync-job", (event, arg) => {
    const result = performFsJob(arg);
    event.returnValue = result;
});
