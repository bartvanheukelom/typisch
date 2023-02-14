import {Pm} from "./lang";
import {Milliseconds} from "./types";

// TEMP FIX AFTER REMOVING dom LIB
// TODO properly
declare function setTimeout(cb: () => void, delay: number): void;



export type PromiseOrAsync<T> = Pm<T> | (() => Pm<T>);
export type Awaitable<T> = T | Promise<T>;


/**
 * Returns a promise that resolves after the given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve, _) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Schedule the given function to launch in the very very near future, but some time after the calling code is done.
 * `launch` itself will return immediately and not throw a synchronous exception.
 */
export function launch<T>(f: () => Awaitable<T>): void {
    // noinspection JSIgnoredPromiseFromCall
    defer(f);
}

/**
 * Schedule the given function to launch in the very very near future, but some time after the calling code is done.
 * Returns a promise that will eventually resolve or reject with the result of `f`.
 * `defer` itself will not throw a synchronous exception.
 */
export function defer<T>(f: () => Awaitable<T>): Promise<T> {
    return new Promise((rs, rj) => {
        const doIt = () => safeCall(f, rs, rj);
        // TODO use process.nextTick for node. https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate workarounds for browser;
        setTimeout(doIt, 0);
    });
}

/**
 * Call f, ensuring that its eventual result is passed to either resolve or reject.
 * That is, even if f immediately (synchronously) throws an exception, it's passed to reject, not thrown from safeCall.
 * However, exceptions thrown by resolve or reject themselves are not caught!
 */
export function safeCall<T>(f: () => Awaitable<T>, resolve: (res: T) => void, reject: (e: unknown) => void) {
    let r: Awaitable<T>;
    try {
        r = f();
    } catch (e) {
        reject(e);
        return;
    }

    if (r instanceof Promise) {
        r.then(resolve, reject);
    } else {
        resolve(r);
    }
}

export async function withTimeout<T>(time: Milliseconds, f: PromiseOrAsync<T>): Pm<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error("Timed out")), time);
        const pm: Pm<T> = f instanceof Promise ? f : f();
        pm.then(resolve, reject);
    });
}

/**
 * Used to declare and run a block of code that won't have any sneaky awaits in there:
 * ```
 * const cs = getCurrentState();
 * sync(() => {
 *
 *    // imagine a wall of text here
 *
 *    // now you can be sure this is still up-to-date, because no other code has ran, assuming single-threaded operation
 *    if (cs.stuffIsGood) {
 *        doIt();
 *    }
 *
 * });
 * ```
 */
export function sync<T>(f: () => T): T {
    return f();
}

export async function forEachAsync<T>(items: ReadonlyArray<T>, task: (v: T) => Promise<unknown>) {
    await Promise.all(items.map(task));
}
