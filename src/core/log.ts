
let logImpl: ((msg: unknown) => void) | undefined = undefined;

export function log(msg: unknown) {
    logImpl?.(msg);
}

export function setLogImplementation(f: (msg: unknown) => void) {
    logImpl = f;
}


// --- module init --- //

(() => {
    const cons: any = eval("console");
    if (cons && typeof cons.log === "function") {
        setLogImplementation(msg => cons.log(`${msg}`));
    }
})();
