import {Readable} from "stream";

export async function readIntoBuf(stream: Readable): Promise<Buffer> {
    const fRead: Buffer[] = []
    for await (const chunk of stream) {
        fRead.push(chunk as Buffer)
    }
    return Buffer.concat(fRead)
}

export async function streamToString(stream: Readable): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks);
    return buffer.toString("utf-8")
}
