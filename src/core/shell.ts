
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

const shellSafeRegex = /^[a-zA-Z0-9_.-]+$/;

/**
 * Quote and escape a string for use in a shell command,
 * except if it only contains alphanumeric characters, dashes, underscores, and dots.
 * The empty string is quoted.
 */
export function shellEscapeMaybe(str: string) {
    return shellSafeRegex.test(str) ? str : shellEscape(str);
}

// TODO shellEscapeMaybe is a bad name, but this one... is worse
export function shellCommandMaybe(...cmd: string[]): string {
    return cmd.map(shellEscapeMaybe).join(" ");
}

// winShellEscape: uses double quotes instead of single quotes (TODO what about percents and stuff)

export function winShellEscape(str: string) {
    return '"' + str
        // newlines
        .replace(/\n/g, '"\n"')
        // quotes
        .replace(/"/g, '""') + '"';
}

export function winShellEscapeMaybe(str: string) {
    return shellSafeRegex.test(str) ? str : winShellEscape(str);
}

export function winShellCommandMaybe(...cmd: string[]): string {
    return cmd.map(winShellEscapeMaybe).join(" ");
}
