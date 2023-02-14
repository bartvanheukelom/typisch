import {app, BrowserWindow, ipcMain, nativeTheme, globalShortcut, session} from "electron";
import windowStateKeeper from "electron-window-state";
import { DbSelectRequest } from "./ipc";
import { openDevTools, showMenuBar } from "./settings";
import {db} from "./db";
import {MainRequest} from "../common/ipc";
import {requestHandler} from "./requestHandler";
import {tempMainAction} from "./tempMainAction";
import path from "path";
import {launch} from "@typisch/core/async";
import {ipcRenderer} from "@typisch/electron/electronModule";
import {pimpConsoleLog} from "@typisch/earthapp/main/logging";
import {installReactDevTools, setUpDevTools} from "@typisch/earthapp/main/devTools";
import {handleIpcMainLogs} from "@typisch/electron/utils";

pimpConsoleLog()

const argv = [...process.argv]
console.log(`argv: ${JSON.stringify(argv)}`)
if (argv[0] && argv[0].endsWith("electron")) {
    argv.shift()
    if (argv[0] == ".") argv.shift()
}

if (argv[0] == "tempMainAction") {

    process.on('unhandledRejection', (r: any) => {
        console.error(`Unhandled rejection: ${r?.stack || r}`)
        process.exit(2)
    })

    ;(async () => {
        try {
            await tempMainAction()
            process.exit(0)
        } catch (e) {
            console.error(e)
            process.exit(1)
        }
    })()

} else {
    launch(appMain)
}

async function appMain() {

    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
        app.quit();
    }

    installReactDevTools()
    nativeTheme.themeSource = "dark";

    const createWindow = (): void => {

        launch(async () => {
            try {

                console.log("Begin app window init")

                const winState = windowStateKeeper({
                    defaultWidth: 1600,
                    defaultHeight: 900,
                })

                console.log("Creating BrowserWindow")
                // Create the browser window.
                const mainWindow = new BrowserWindow({

                    width: winState.width,
                    height: winState.height,
                    x: winState.x,
                    y: winState.y,

                    backgroundColor: "#556666",
                    webPreferences: {
                        nodeIntegration: true,
                        // fixes "process not defined"
                        contextIsolation: false,
                    }
                });
                console.log("removeMenu")
                if (!showMenuBar) {
                    mainWindow.removeMenu()
                }

                winState.manage(mainWindow)

                const indexPath = path.join(__dirname, '../../renderer/index.html')
                console.log(`Going to loadFile ${indexPath}`)
                await mainWindow.loadFile(indexPath);
                console.log(`Index loaded`)

                setUpDevTools(mainWindow, openDevTools)

                console.log(`App window init done`)

            } catch (e) {
                console.log(`${e.stack || e}`)
                process.exit(3)
            }

        })

        handleIpcMainLogs()

        ipcMain.handle("app.request", async (event, req: MainRequest, ...args) => {
            console.log(`got request ${req} ${JSON.stringify(args)}`)
            const handler: any = await requestHandler(req)
            const handlerRes = handler(...args);
            const promised = handlerRes instanceof Promise;
            console.log(`handled request, now ${promised ? "awaiting" : "returning"} result`)
            const res = promised ? await handlerRes : handlerRes;
            if (promised) {
                console.log("have result")
            }
            return res
        })

        ipcMain.on("app.syncRequest", (event, req, arg) => {

            console.log(`app.syncRequest(${req})`)  // ${JSON.stringify(arg)}`)

            // TODO general error catching/returning

            if (req == "db.select") {
                arg as DbSelectRequest

                try {
                    const results = db.prepare(arg.query)
                        .all(arg.args || [])
                    event.returnValue = [true, results]
                } catch (e) {
                    console.error(`SQL ERROR: ${e}`)
                    event.returnValue = [false, e]
                }
            } else if (req == "db.update") {
                arg as DbSelectRequest

                try {
                    const results = db.prepare(arg.query)
                        .run(arg.args || [])
                    event.returnValue = [true, results]
                } catch (e) {
                    console.error(`SQL ERROR: ${e}`)
                    event.returnValue = [false, e]
                }
            }

        })

    };

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    if (app.isReady()) createWindow()
    else app.on('ready', createWindow);

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', async () => {
        if (process.platform !== 'darwin') {
            await quit()
        }
        // TODO else how to do cleanup at Cmd + Q?
    });

    app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    async function quit() {
        console.log("quit()")
        console.log("going to app.quit()")
        app.quit();
    }

}
