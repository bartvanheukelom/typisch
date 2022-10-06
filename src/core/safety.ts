
/**
 * Exhaustive switching tool:
 *
 * <pre>
 *     declare const bolean: true | false;
 *     switch (bolean) {
 *         case true: ...; break;
 *         case false: ...; break;
 *         // bolean is now never
 *         default: missingCase(bolean); // throws if bolean is something else at runtime.
 *     }
 *
 *     declare const superbolean: true | false | "FileNotFound";
 *     switch (superbolean) {
 *         case true: ...; break;
 *         case false: ...; break;
 *         // compile error because you forgot to handle "FileNotFound",
 *         // so superbolean is not a never.
 *         default: missingCase(superbolean);
 *     }
 * </pre>
 */
export function missingCase(name: never): never {
    throw new Error(`switch is missing case ${name} (and TS didn't catch it)`);
}

export function check(
    condition: unknown,
    errorMessage: (() => string) | string = "Check failed"
): asserts condition {
    if (!condition) {
        throw new Error(typeof errorMessage == 'string' ? errorMessage : errorMessage())
    }
}

/**
 * Throws an Error with the given message, but unlike throw,
 * can be used as an expression:
 *
 * <code>
 *     return array.find(x => ...) || error("not found")
 * </code>
 *
 * @param message
 */
export function error(message: string): never {
    throw new Error(message)
}
