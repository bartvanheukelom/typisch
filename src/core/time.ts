
/**
 * Returns the current date and time in a format that is usable in filenames, e.g. "2021-11-06T11_33_44".
 */
export function tsForFileName(): string {
    return new Date().toISOString().split(":").join("_").substring(0, 19)
}
