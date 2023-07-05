import {streamToString} from "./streams";

import {avoid} from "@typisch/core/lang";
import {check} from "@typisch/core/safety";

import child_process, {ChildProcess, ChildProcessByStdio} from "child_process";
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
 * This function fully reads the output (on stdout) from a process,
 * _and_ waits for the process to complete successfully.
 * Does not read stderr, so make sure it's ignored, inherited, or won't produce more output than the buffer can hold.
 *
 * @param name The name for the process to use in error messages.
 * @param process The process to read from.
 * @returns Promise which resolves to the full output from the process, or rejects with a `ProcessError`.
 */
export async function readProcessOut(
    name: string,
    process: ChildProcessByStdio<any, Readable, any>,
): Promise<string> {
    const output = streamToString(process.stdout);
    await processSuccess(name, process);
    return await output;
}

/**
 * This function waits for a process to complete successfully.
 * Returns a promise which resolves when the process completes successfully, or rejects with a `ProcessError`.
 */
export function processSuccess(
    name: string,
    process: ChildProcessByStdio<any, any, any>,
): Promise<void> {

    if (process.exitCode !== null) {
        if (process.exitCode === 0) {
            return Promise.resolve();
        } else {
            return Promise.reject(
                new ProcessError(
                    `Process '${name}' (previously) closed with code ${process.exitCode} by signal ${process.signalCode}`,
                    process.exitCode,
                    process.signalCode,
                )
            );
        }
    }

    return new Promise<void>((resolve, reject) => {
        process.on("close", (code, signal) => {
            if (code == 0) {
                resolve()
            } else {
                reject(new ProcessError(`Process '${name}' closed with code ${code} by signal ${signal}`, code, signal));
            }
        });
    });
}

class ProcessError extends Error {
    constructor(message: string, public code: number | null, public signal: NodeJS.Signals | null) {
        super(message);
    }
}


class Process {

    constructor(
        private readonly builderState: BuilderState,
        readonly process: ChildProcess,
    ) {
    }

    get name(): string {
        return this.builderState.name ?? this.builderState.command;
    }

    success(): Promise<void> {
        return processSuccess(this.name, this.process);
    }
}



interface BuilderState {
    command: string;
    args: string[];
    name?: string;
    options: child_process.SpawnOptions;
}


export class ProcessBuilder {

    constructor(private readonly state: BuilderState) {
    }

    static command(...command: string[]): ProcessBuilder {
        check(command.length > 0, "command must not be empty");
        return new ProcessBuilder({ command: command[0], args: command.slice(1), options: {} });
    }

    name(name: string): ProcessBuilder {
        return new ProcessBuilder({...this.state, name});
    }

    stdio(stdio: child_process.StdioOptions): ProcessBuilder {
        return new ProcessBuilder({...this.state, options: {...this.state.options, stdio}});
    }

    spawn(): Process {
        const spawnedProcess = child_process.spawn(
            this.state.command,
            this.state.args,
            this.state.options,
        );
        return new Process(this.state, spawnedProcess);
    }
}
