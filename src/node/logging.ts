
export type Logger = (message: unknown) => void;

export function logger(name: string): Logger {
    return (message: unknown) => {
        console.log(`${new Date().toISOString()} ${name} - ${message}`)
    }
}

export function classLogger(clazz: Function, instance?: unknown): Logger {
    return logger(clazz.name + (instance !== undefined ? `[${instance}]` : ""));
}
