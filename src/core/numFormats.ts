import {declareIs} from "./utils";

export const siPrefixes = {
    "k": 1e3,
    "M": 1e6,
    "G": 1e9,
    "T": 1e12,
    "P": 1e15,
    "E": 1e18,
    "Z": 1e21,
    "Y": 1e24,
}
export type SIPrefix = keyof typeof siPrefixes;

export const iecPrefixes = {
    "Ki": 1024,
    "Mi": 1024 ** 2,
    "Gi": 1024 ** 3,
    "Ti": 1024 ** 4,
    "Pi": 1024 ** 5,
    "Ei": 1024 ** 6,
    "Zi": 1024 ** 7,
    "Yi": 1024 ** 8,
}
export type IECPrefix = keyof typeof iecPrefixes;

export function formatFileSize(
    size: number,
    unit: `${">" | "<" | ""}${SIPrefix | IECPrefix | "*" | "*i" | ""}B` = "B",
): string {
    let num = size;
    
    let unitt: string = unit;
    declareIs<never>(unit);

    let round = Math.round;
    if (unitt[0] == ">") {
        round = Math.floor;
        unitt = unitt.slice(1);
    } else if (unitt[0] == "<") {
        round = Math.ceil;
        unitt = unitt.slice(1);
    }

    if (unitt != "B") {

        let prefix = unitt.slice(0, -1);
        if (prefix[0] == "*") {
            let prefixes = [["", 1] as const, ...Object.entries(prefix == "*" ? siPrefixes : iecPrefixes)];
            // pick the prefix where the rounded number has 2 through 4 digits
            let i = prefixes.findIndex(([_, div]) => {
                let n = round(num / div);
                return n >= 10 && n <= 9999;
            });
            prefix = prefixes[i == -1 ? (num < 10 ? 0 : prefixes.length - 1) : i][0];
        }

        const div = prefix == "" ? 1 : siPrefixes[prefix as SIPrefix] ?? iecPrefixes[prefix as IECPrefix];
        if (!div) {
            throw new Error(`no div found for prefix '${prefix}'`);
        }
        unitt = prefix + "B";
        num = num / div;
    }

    // use ' as thousands separator
    const numStr = round(num).toLocaleString().replace(/[,.]/g, "'"); // TODO yuk

    return `${numStr} ${unitt}`;
}
