import { ipcRenderer } from "./electronModule";

export function sendLogsToRenderer() {
    const orgLog = console.log
    console.log = (...data: any[]) => {
        orgLog(...data)
        ipcRenderer.sendSync("console.log", `[RENDER] ${JSON.stringify(data)}`);
    }
}
