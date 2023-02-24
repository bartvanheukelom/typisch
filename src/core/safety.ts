
/**
 * Exhaustive switching tool:
 *
 * <pre>
 *     declare const bowlean: true | false;
 *     switch (bowlean) {
 *         case true: ...; break;
 *         case false: ...; break;
 *         // bowlean is now never
 *         default: missingCase(bowlean); // throws if bowlean is something else at runtime.
 *     }
 *
 *     declare const superbowlean: true | false | "FileNotFound";
 *     switch (superbowlean) {
 *         case true: ...; break;
 *         case false: ...; break;
 *         // compile error because you forgot to handle "FileNotFound",
 *         // so superbowlean is not of type never but of "FileNotFound".
 *         default: missingCase(superbowlean);
 *     }
 * </pre>
 *
 * By default the case value is used in the error message. You can override this by passing
 * a function that extracts the display value from the case value.
 * The case is passed as `any` because TS doesn't know that it's not actually a `never`.
 * This can be useful in a situation like:
 *
 * <pre>
 *     declare const animal: { kind: "cat", ... } | { kind: "dog", ... };
 *     switch (animal.kind) {
 *         case "cat": ...; break;
 *         case "dog": ...; break;
 *         default:
 *             // missingCase(animal.kind); - compile error because animal is supposedly `never`, which has no property `kind`
 *             // missingCase((animal as any).kind as never); - works, but then you lose the compile-time exhaustiveness check
 *             missingCase(animal, a => a.kind);
 *     }
 * </pre>
 *
 * @param cas The case value that was not handled.
 * @param name A function that returns a string representation of the case value.
 */
export function missingCase(cas: never, name?: (cas: any) => any): never {
    throw new Error(`switch is missing case ${name ? name(cas) : cas} (and TS didn't catch it)`);
}

/**
 * Checks if a condition is true, and throws an error if it's not.
 * @param condition The condition to check
 * @param errorMessage The error message to throw if the condition is false. This can be either a string or a function that returns a string.
 */
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
