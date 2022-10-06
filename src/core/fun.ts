import {foobar} from "./async";

export function run<T>(f: () => T): T {
    foobar();
    return f()
}

/**
 * Function that accepts any args and does... nothing.
 * The functional equivalent of writing to `/dev/null`.
 * It's like a void, but that has a specific meaning in JS.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
export function abyss(...args: unknown[]): void {}
