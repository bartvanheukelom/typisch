
// types and functions that are used so often, they deserve their own very short names

import {Awaitable} from "./async";

export type Pm<V> = Promise<V>;
export const Pm = Promise;

export type avoid = Awaitable<void>;

/**
 * Stringify the given value to indented JSON, for debug/log display, so it's one-way.
 */
export function pp(v: any) {
    return JSON.stringify(v, (key: string, value: any) => {
        if (typeof value == "bigint") {
            return value.toString() + "n";
        } else {
            return value;
        }
    }, 4);
}
