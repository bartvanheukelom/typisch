import { IpcRenderer } from "electron";
export const ipcRenderer: IpcRenderer = window.require("electron").ipcRenderer;
