

/**
 * Convert a string to an SQL string literal.
 * Escapes single quotes and wraps the whole thing in single quotes.
 * Other characters are not escaped, including \n, which is actually a valid character in SQL string literals.
 *
 * `Yoshi's Story` -> `'Yoshi''s Story'`
 * `hello⎆world` -> `'hello⎆world'`
 */
export function sqlStringLiteral(str: string) {
    return str.split("'").map(p => `'${p}'`).join("")
}
