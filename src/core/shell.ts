
// TODO check out package shell-escape
export function shellEscape(str: string) {
    return "'" + str
        // newlines
        .replace(/\n/g, "'\n'")
        // quotes
        .replace(/'/g, "'\\''") + "'";
}

export function shellCommand(...cmd: string[]): string {
    return cmd.map(shellEscape).join(" ");
}
