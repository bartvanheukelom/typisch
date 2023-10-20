


/**
 * Encodes a string for use in a URL, like encodeURIComponent, but replaces spaces with "+" instead of "%20".
 */
export function encodeFormElement(str: string): string {
    return encodeURIComponent(str).replace(/%20/g, "+");
}

/**
 * Decodes a string encoded with encodeURIComponentPlus.
 * That is, like decodeURIComponent, but with support for "+" as encoding for a space.
 */
export function decodeFormElement(str: string): string {
    return decodeURIComponent(str.replace(/\+/g, "%20"));
}

/**
 * Encodes an object as an application/x-www-form-urlencoded string
 * of the form "key1=value1&key2=value2".
 */
export function encodeFormData(obj: Record<string, unknown>): string {
    return Object.entries(obj)
        .map(([k, v]) => `${encodeFormElement(k)}=${encodeFormElement(`${v}`)}`)
        .join("&");
}

/**
 * Decodes an application/x-www-form-urlencoded string into an object.
 */
export function decodeFormData(str: string): Record<string, string> {
    const dec: Record<string, string> = {};
    for (const e of str.split("&")) {
        const [k, v] = e.split("=");
        dec[decodeFormElement(k)] = decodeFormElement(v);
    }
    return dec;
}



// LEGACY

/**
 * Encodes an object as a URL query string.
 * Named after PHP's urlencode, which is a misnomer because that is
 * actually equivalent to encodeURIComponentPlus.
 * For legacy reasons, this functions encodes spaces as "%20", not "+".
 *
 * @deprecated Use encodeFormData instead.
 */
export function urlencode(obj: Record<string, unknown>): string {
    return Object.entries(obj)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(`${v}`)}`)
        .join("&")
}

/**
 * Decodes a URL query string into an object.
 * Named after PHP's urldecode, which is a misnomer because that is
 * actually equivalent to decodeURIComponentPlus.
 * This function supports decoding "+" to a space, though urldecode
 * does not encode them as such.
 *
 * @deprecated Use decodeFormData instead.
 */
export function urldecode(str: string): Record<string, string> {
    const dec: Record<string, string> = {};
    for (const e of str.split("&")) {
        const [k, v] = e.split("=")
        dec[decodeFormElement(k)] = decodeFormElement(v)
    }
    return dec
}
