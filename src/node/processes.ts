import {streamToString} from "./streams";

import {avoid} from "@typisch/core/lang";

import child_process, {ChildProcessByStdio} from "child_process";
import {Readable} from "stream";


/**
 * Runs the given command with the given arguments, printing stdout/stderr to the current process.
 * @param command The command to run
 * @param args The command's arguments
 * @returns A promise which resolves when the command completes successfully, or rejects with the command's exit code
 */
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

/**
 * This function reads the output from a process.
 * @param name The name of the process.
 * @param process The process to read from.
 * @returns The output from the process.
 */
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
