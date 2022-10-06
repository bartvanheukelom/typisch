
export function urlencode(obj: Record<string, unknown>): string {
    return Object.entries(obj)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(`${v}`)}`)
        .join("&")
}

export function urldecode(str: string): Record<string, string> {
    const dec: Record<string, string> = {};
    for (const e of str.split("&")) {
        const [k, v] = e.split("=")
        dec[decodeURIComponent(k)] = decodeURIComponent(v)
    }
    return dec
}
