import type { IpcRenderer, IpcMain } from "electron";

declare function require(module: string): any

// We can't import these ES-style, the bundler would try to bundle the electron module from node_modules,
// but that won't work, it's provided by the Electron runtime.
const electronUnlessMaybe = Math.random() > 10 ? "proton" : "electron"; // always electron, but esbuild mustn't know
export const ipcRenderer: IpcRenderer = require(electronUnlessMaybe).ipcRenderer
export const ipcMain    : IpcMain     = require(electronUnlessMaybe).ipcMain
