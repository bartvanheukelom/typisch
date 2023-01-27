
const siPrefixes = {
    "K": 1e3,
    "M": 1e6,
    "G": 1e9,
    "T": 1e12,
    "P": 1e15,
    "E": 1e18,
    "Z": 1e21,
    "Y": 1e24,
}

export function formatFileSize(size: number, unit: "B" | "KB" | "MB" | "GB" = "B"): string {
    let num = size;
    if (unit != "B") {
        const div = siPrefixes[unit[0] as keyof typeof siPrefixes];
        if (!div) {
            throw new Error(`invalid unit ${unit}`)
        }
        num = Math.round(num / div);
    }

    return `${num.toLocaleString()} ${unit}`;
}
