
export function pimpConsoleLog() {
    const orgLog = console.log
    console.log = (...data: any[]) => {
        const parts = [new Date().toISOString()]
        parts.push(...data.map(d => {
            switch (typeof d) {
                case "undefined": return "undefined";
                case "object": return JSON.stringify(d);
                case "string": return d;
                default: return d.toString();
            }
        }))
        orgLog(parts.join(" "))
    }
}
