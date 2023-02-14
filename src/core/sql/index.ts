
export function sqlStringLiteral(str: string) {
    return str.split("'").map(p => `'${p}'`).join("")
}
