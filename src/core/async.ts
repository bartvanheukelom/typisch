import {Pm} from "./lang";
import {Milliseconds} from "./types";
import {log} from "./log";
import {missingCase} from "./safety";

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
    const ps = recordPromiseStart();
    return new Promise((rs, rj) => {
        const doIt = () => {
            try {
                safeCall(f, rs, e => {
                    ps.addToError(e);
                    rj(e);
                });
            } catch (e) {
                log(`WARN safeCall threw synchronous exception: ${e}`);
                ps.addToError(e);
                rj(e);
            }
        };
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
        log(`QQQ safeCall f() threw ${e}`);
        reject(e);
        return;
    }

    if (r instanceof Promise) {
        r.then(resolve, e => {
            log(`QQQ safeCall Promise rejected with ${e}`);
            reject(e);
        });
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

/**
 * Container for a new Promise that can be resolved or rejected from outside.
 * Can be resolved only once.
 */
export class Deferred<T> {

    private readonly _promise: Promise<T>;
    private _resolve!: (value: T) => void;
    private _reject!: (reason?: any) => void;

    private _resolution: ["resolved", T] | ["rejected", any] | undefined = undefined;


    constructor() {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    get result(): Promise<T> {
        return this._promise;
    }

    get isResolved(): boolean {
        return this._resolution !== undefined;
    }

    /**
     * If this Deferred has been resolved successfully, returns the value.
     * Otherwise (i.e. if unresolved or rejected), throws an error.
     */
    get value(): T {
        const res = this._resolution;
        if (res === undefined) {
            throw new Error("Trying to access value of unresolved Deferred");
        } else if (res[0] === "resolved") {
            return res[1];
        } else if (res[0] === "rejected") {
            throw new Error("Trying to access value of rejected Deferred");
        } else {
            missingCase(res as never, c => c[0]);
        }
    }


    /**
     * If this Deferred has been rejected, returns the error.
     * Otherwise (i.e. if unresolved or resolved successfully), throws an error.
     */
    get error(): any {
        const res = this._resolution;
        if (res === undefined) {
            throw new Error("Trying to access error of unresolved Deferred");
        } else if (res[0] === "resolved") {
            throw new Error("Trying to access error of success-resolved Deferred");
        } else if (res[0] === "rejected") {
            return res[1];
        } else {
            missingCase(res as never, c => c[0]);
        }
    }


    // --- MUTATORS --- //

    resolve(value: T): void {
        if (this._resolution !== undefined) {
            throw new Error("Trying to resolve already resolved promise");
        }
        this._resolution = ["resolved", value];
        this._resolve(value);
    }

    reject(reason?: any): void {
        if (this._resolution !== undefined) {
            throw new Error("Trying to reject already resolved promise");
        }
        this._resolution = ["rejected", reason];
        this._reject(reason);
    }

}


// returns a function that call the given loader function when first called, and returns the result of that call on that and subsequent calls.
// the loader is not executed in parallel, but only once. any calls made while the loader is
// already running will return the same promise as the first call.
// if the loader function throws an exception, that promise will be rejected,
// but a subsequent call will retry the loader function.
export function lazy<T>(loader: () => Promise<T>): () => Promise<T> {
    let promise: Promise<T> | undefined = undefined;
    return () => {
        if (promise === undefined) {
            promise = (async () => {
                try {
                    return await loader();
                } catch (e) {
                    promise = undefined;
                    throw e;
                }
            })();
        }
        return promise;
    };
}



export const promiseStartStack = Symbol("promiseStartStack");

export function recordPromiseStart() {
    const stack = new Error().stack;
    return {
        addToError: (e: unknown) => {
            if (e instanceof Error) {
                (e as any)[promiseStartStack] = stack;
            }
        },
    }
}

export function getPromiseStartStack(e: unknown): string | undefined {
    return (e instanceof Error) ? (e as any)[promiseStartStack] : undefined;
}
