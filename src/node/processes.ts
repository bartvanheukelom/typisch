import {streamToString} from "./streams";

import {avoid} from "@typisch/core/lang";

import child_process, {ChildProcessByStdio} from "child_process";
import {Readable} from "stream";



export async function run(command: string, args: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = child_process.spawn(
            command, args,
            {
                stdio: ["ignore", "inherit", "inherit"]
            }
        );
        process.on("close", async (code, signal) => {
            if (code == 0) {
                resolve()
            } else {
                console.log(`'${command}' closed with code ${code} by signal ${signal}`)
                reject(code)
            }
        });
    })
}

export async function readProcessOut(
    name: string,
    process: ChildProcessByStdio<any, Readable, any>,
): Promise<string> {
    const output = streamToString(process.stdout);
    await processSuccess(name, process);
    return await output;
}

export function processSuccess(
    name: string,
    process: ChildProcessByStdio<any, any, any>,
): avoid {

    if (process.exitCode !== null) {
        if (process.exitCode === 0) {
            return;
        } else {
            throw new Error(`Process '${name}' (previously) closed with code ${process.exitCode}`);
        }
    }

    return new Promise<void>((resolve, reject) => {
        process.on("close", (code, signal) => {
            if (code == 0) {
                resolve()
            } else {
                reject(new Error(`Process '${name}' closed with code ${code} by signal ${signal}`));
            }
        });
    });
}
