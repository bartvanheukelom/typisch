import type { IpcRenderer, IpcMain } from "electron";

declare function require(module: string): any

// We can't import these ES-style, Rollup would try to bundle the "electron" module,
// but that won't work, it's provided by the Electron runtime.
export const ipcRenderer: IpcRenderer = require("electron").ipcRenderer
export const ipcMain    : IpcMain     = require("electron").ipcMain
