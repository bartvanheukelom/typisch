import { ipcRenderer, ipcMain } from "./electronModule";

export function handleIpcMainLogs() {
    ipcMain.on("console.log", (event, ...msg) => {
        console.log(...msg)
        event.returnValue = null
    })
}

export function sendLogsToRenderer() {
    const orgLog = console.log
    console.log = (...data: any[]) => {
        orgLog(...data)
        ipcRenderer.sendSync("console.log", `[RENDER]`, ...data);
    }
}
