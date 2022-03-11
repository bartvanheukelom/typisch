
export function pimpConsoleLog(): void {
    const orgLog = console.log
    console.log = (...data: unknown[]) => {
        let msg: string;
        try {
            const parts = [new Date().toISOString()];
            parts.push(...data.map(d => {
                try {
                    switch (typeof d) {
                        case "undefined": return "undefined";
                        case "object": return JSON.stringify(d);
                        case "string": return d;
                        default: return `${d}`;
                    }
                } catch (e) {
                    return `[ERROR in toString: ${e}]`;
                }
            }));
            msg = parts.join(" ");
        } catch (e) {
            msg = `pimpConsoleLog error: ${e}`;
        }
        try {
            orgLog(msg);
        } catch (e) {
            process.stderr.write(`Error in console.log: ${e}`, 'utf-8');
            process.stderr.write(`Message: ${msg}`, 'utf-8');
        }
    }
}
