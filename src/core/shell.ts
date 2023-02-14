
// TODO check out package shell-escape
export async function shellEscape(str: string) {
    return "'" + str
        // newlines
        .replace(/\n/g, "'\n'")
        // quotes
        .replace(/'/g, "'\\''") + "'";
}
