import {formatFileSize} from "@typisch/core/utils";

import {Duplex, Readable, Transform} from "stream";



/**
 * Reads the entire stream and returns it as a Buffer. Requires enough memory to, for a short time, store the entire contents of the stream twice.
 */
export async function readIntoBuf(stream: Readable): Promise<Buffer> {
    const fRead: Buffer[] = []
    for await (const chunk of stream) {
        fRead.push(chunk as Buffer)
    }
    return Buffer.concat(fRead)
}

/**
 * Reads the entire stream using {@link readIntoBuf}, then decodes it using UTF-8.
 */
export async function streamToString(stream: Readable): Promise<string> {
    const buffer = await readIntoBuf(stream);
    return buffer.toString("utf-8");
}


/**
 * A container for a {@link Duplex} that counts the number of chunks and bytes passing through it, without actually transforming anything.
 * Only supports {@link Buffer} chunks.
 */
export interface CountingPipe {
    chunks: number;
    bytes: number;
    pipe: Duplex;
}

/**
 * @see CountingPipe
 */
export function countingPipe(): CountingPipe {

    const obj: any = {
        chunks: 0,
        bytes: 0,
    };

    obj.pipe = new Transform({
        transform(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null, data?: any) => void) {
            if (!(chunk instanceof Buffer)) {
                throw new Error(`countingPipe only supports Buffer chunks, got ${chunk.constructor}`)
            }
            obj.chunks++;
            obj.bytes += chunk.length;
            callback(null, chunk)
        },
        final(callback: (error?: (Error | null)) => void) {
            callback(null);
        },
    });

    return obj;

}


export interface MultiplyStream {
    output(): Readable;
    afterEndCheck(expectBytes?: number): void;
}

/**
 * Safely duplicate the given input stream into any number of output streams.
 */
export function multiplyStream(input: Readable): MultiplyStream {

    const cInput = countingPipe();
    input.pipe(cInput.pipe);

    const outputs: CountingPipe[] = [];

    return {

        output(): Readable {
            // TODO throw error if called when the input has already started flowing
            const co = countingPipe();
            outputs.push(co);
            cInput.pipe.pipe(co.pipe);
            return co.pipe;
        },

        afterEndCheck(expectBytes = -1) {
            // TODO check all done/ended/whatever
            const read = cInput.bytes;
            if (expectBytes != -1 && read != expectBytes) {
                throw new Error(`MultiplyStream: Read ${formatFileSize(read)} but expected ${formatFileSize(expectBytes)}`);
            }
            for (const co of outputs) {
                if (co.bytes != read) {
                    throw new Error(`MultiplyStream: Read ${formatFileSize(read)} but one of the outputs transfered ${formatFileSize(co.bytes)}`);
                }
            }
        },

    }

}