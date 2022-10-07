import {typischCoreNop} from "@typisch/core";
import {Logger, logger} from "./logging";
import {Pm} from "@typisch/core/lang";
import {Uuid} from "@typisch/core/types";
import {formatFileSize} from "@typisch/core/math";

import * as path from "path";
import {randomBytes, randomUUID} from "crypto";
import {promisify} from "util";
import * as http from "http";
import * as fs from "fs";
import {performance} from "perf_hooks";



typischCoreNop();

/**
 * Does nothing, can be used as an early detector for import / module resolution issues.
 */
export function typischNodeNop() {}




export function isMain(module: NodeModule): boolean {
    return require.main === module;
}

export function main(module: NodeModule, func: () => any) {
    if (isMain(module)) {

        if (process.platform == "win32") {
            console.log(`WARN: running on win32 is unsupported and for development only`);
        }
        checkNodeFromDependencies();

        process.nextTick(async () => {
            try {
                await func();
            } catch (e) {
                console.log(`main: uncaught error ${(e as any)?.stack || e}`);
                process.exit(1);
            }
        });
    }
}

export function moduleLogger(module: NodeModule): Logger {
    const name =
        module == require.main
            ? path.basename(module.filename)
            : path.relative(require.main!!.filename, module.filename);
    return logger(name);
}

const log = moduleLogger(module);

const pRandomBytes = promisify(randomBytes);

export async function randomHex(bytes: number): Pm<string> {
    return (await pRandomBytes(bytes)).toString('hex');
}

export function randomHexSync(bytes: number): string {
    return randomBytes(bytes).toString('hex');
}

export function randomUuid() {
    return randomUUID() as Uuid;
}

export const httpListen = (server: http.Server, port: number) => new Promise<void>((resolve) => {
    server.listen(port, resolve);
});

export function checkNodeFromDependencies() {
    const nodeMods = path.join(process.cwd(), "node_modules");
    const nodeBin = process.execPath;
    if (!nodeBin.startsWith(nodeMods)) {
        if (process.platform == "win32" && !fs.existsSync(path.join(nodeMods, "node", "bin", "node.cmd"))) {
            // when running from Windows, but the node_modules were installed on WSL, we have to use the global node
            if (!process.version.startsWith("v17.")) {
                throw new Error(`NodeJS version ${process.version} from '${nodeBin}' not supported, 17 required`);
            }
        } else {
            throw new Error(`NodeJS runtime '${nodeBin}' does not appear to be from '${nodeMods}', so most likely has the wrong version`);
        }
    }
}

export function runGc(type: "scavenge" | "markSweep" = "markSweep") {
    if ("gc" in global) {
        if (type == "markSweep") {
            const start = performance.now();
            const before = process.memoryUsage().heapUsed;
            log(`runGc: heapUsed before=${formatFileSize(before)}`);
            // false = full GC
            (gc as any)(false);
            const after = process.memoryUsage().heapUsed;
            log(`runGc: time=${Math.round(performance.now() - start)} ms, heapUsed after=${formatFileSize(after)}, collected=${formatFileSize(before - after)}`);
        } else {
            (gc as any)(true);
        }
    } else {
        log(`runGc: not available, run node with --expose_gc flag`);
    }
}
