
export function floorDiv(num: number, div: number) {
    return Math.floor(num / div)
}
/**
 * @return ceil(num / div)
 */
export function ceilDiv(num: number, div: number) {
    return Math.ceil(num / div)
}
export function floorTo(num: number, div: number) {
    const rem = num % div;
    return num - rem
}
/**
 * @return num ceiled to the nearest multiple of div
 */
export function ceilTo(num: number, div: number): number {
    const rem = num % div;
    return rem == 0 ? num : (num + div - rem)
}
/**
 * @return num rounded to the nearest multiple of div
 */
export function roundTo(num: number, div: number): number {
    return div * Math.round(num / div);
}

export function formatFileSize(size: number) {
    return size.toLocaleString() + " B"
}
