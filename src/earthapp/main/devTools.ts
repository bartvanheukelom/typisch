import {launch} from "@typisch/core/async";
import {errString} from "@typisch/core/utils";

import {app, globalShortcut, session, BrowserWindow} from "electron";
import path from "path";



export function installReactDevTools() {
    launch(async () => {
        await app.whenReady()
        try {
            console.log("App ready, going to install React dev tools")
            // await installExtension(REACT_DEVELOPER_TOOLS, {
            //     // @ts-ignore
            //     loadExtensionOptions: {
            //         allowFileAccess: true, // https://github.com/electron/electron/issues/23662 TODO not sure if needed
            //     },
            // })
            session.defaultSession.getAllExtensions().forEach(e =>
                console.log(`Have extension $e`));
            await session.defaultSession.loadExtension(
                path.join(__dirname, "../../rdt/extract"),
                {
                    allowFileAccess: true,
                }
            )
            console.log("React dev tools installed")
        } catch (e: any) {
            console.error(`Error installing extension(s): ${e.stack || e}`)
        }
    })
}

export function setUpDevTools(
    mainWindow: BrowserWindow,
    openAsap = false
) {
    // TODO local shortcut, make F12
    // TODO or remove, Ctrl+Shif+I exists
    globalShortcut.register("Ctrl+F12", () => {
        const mwf = mainWindow.isFocused();
        const dto = mainWindow.webContents.isDevToolsOpened();
        const dtf = mainWindow.webContents.isDevToolsFocused();

        console.log(`F12; mwf=${mwf}, dto=${dto}, dtf=${dtf}`)

        if (mwf) {
            if (dto) {
                mainWindow.webContents.devToolsWebContents?.focus()
            } else {
                mainWindow.webContents.openDevTools()
            }
        } else if (dtf) {
            mainWindow.webContents.closeDevTools()
        }
    })
    if (openAsap) {
        console.log(`openDevTools requested`)
        // https://github.com/SimulatedGREG/electron-vue/issues/389#issuecomment-464706838
        mainWindow.webContents.on('did-frame-finish-load', () => {
            console.log(`frame finished loading, going to openDevTools`)
            try {
                mainWindow.webContents.openDevTools();
            } catch (e) {
                console.log(errString(e));
            }
        });
    }
}