
import {AsyncFunction} from "async"; // dependency, not this module

// TEMP FIX AFTER REMOVING dom LIB
// TODO properly
declare function setTimeout(cb: () => void, delay: number): void;



export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function launch(f: AsyncFunction<void>): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    void f()
}

export function foobar() {
    return 1;
}