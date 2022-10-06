
export async function aiToArray<T>(iter: AsyncIterable<T>): Promise<T[]> {
    const out: T[] = []
    for await (const x of iter) {
        out.push(x)
    }
    return out
}
