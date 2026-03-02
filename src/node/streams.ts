import {formatFileSize} from "@typisch/core/utils";

import {Duplex, PassThrough, Readable, Transform} from "stream";



/**
 * Reads the entire stream and returns it as a Buffer. Requires enough memory to, for a short time, store the entire contents of the stream twice.
 */
export async function readIntoBuf(
    stream: Readable,
    options: {
        knownSize?: number;
    } = {}
): Promise<Buffer> {
    const fRead: Buffer[] = [];
    let size = 0;
    for await (const chunk of stream) {
        fRead.push(chunk as Buffer);
        size += chunk.length;
        if (options.knownSize && size > options.knownSize) {
            throw new Error(`readIntoBuf: Read >= ${formatFileSize(size)} but expected exactly ${formatFileSize(options.knownSize)}`);
        }
    }
    return Buffer.concat(fRead);
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
    /** Create `n` outputs at once. */
    outputs(n: number): Readable[];
    /** Mark an output as abandoned so afterEndCheck skips it. Destroys the stream. */
    abandon(output: Readable): void;
    afterEndCheck(expectBytes?: number): void;
}

interface OutputEntry {
    stream: PassThrough;
    bytes: number;
    abandoned: boolean;
    /** Resolved when abandon() is called, to unblock any pending drain wait. */
    onAbandon: () => void;
    abandonPromise: Promise<void>;
}

function makeOutputEntry(stream: PassThrough): OutputEntry {
    let onAbandon!: () => void;
    const abandonPromise = new Promise<void>(resolve => { onAbandon = resolve; });
    return { stream, bytes: 0, abandoned: false, onAbandon, abandonPromise };
}

/**
 * Safely duplicate the given input stream into any number of output streams.
 *
 * Backpressure-aware: the source is read at the speed of the slowest consumer.
 * Each chunk is written to all outputs; if any output's internal buffer is full
 * (write() returns false), the pump waits for it to drain before reading the
 * next chunk. This prevents unbounded buffering when consumers run at different
 * speeds.
 *
 * All outputs must be created (via {@link output}) before the first consumer
 * starts reading, since the pump begins lazily on the first downstream read.
 */
export function multiplyStream(input: Readable): MultiplyStream {

    const outputs: OutputEntry[] = [];
    let inputBytes = 0;
    let pumpStarted = false;
    let pumpDone = false;

    /** Wait for an output to drain, or resolve immediately if it gets abandoned. */
    function waitForDrain(out: OutputEntry): Promise<void> {
        return Promise.race([
            new Promise<void>(resolve => { out.stream.once("drain", resolve); }),
            out.abandonPromise,
        ]);
    }

    async function pump() {
        const iter: AsyncIterator<Buffer> = input[Symbol.asyncIterator]();
        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { value, done } = await iter.next();
                if (done) break;
                const chunk = value as Buffer;
                inputBytes += chunk.length;

                // Write chunk to every live output, respecting backpressure
                const drainWaits: Promise<void>[] = [];
                for (const out of outputs) {
                    if (out.abandoned) continue;
                    const ok = out.stream.write(chunk);
                    out.bytes += chunk.length;
                    if (!ok) {
                        drainWaits.push(waitForDrain(out));
                    }
                }
                // Wait for ALL full outputs to drain before reading next chunk
                if (drainWaits.length > 0) {
                    await Promise.all(drainWaits);
                }
            }
        } finally {
            // Signal end to all live outputs
            for (const out of outputs) {
                if (!out.abandoned) out.stream.end();
            }
            pumpDone = true;
        }
    }

    function ensurePump() {
        if (pumpStarted) return;
        pumpStarted = true;
        pump().catch(err => {
            for (const out of outputs) {
                if (!out.abandoned) out.stream.destroy(err);
            }
        });
    }

    return {

        output(): Readable {
            if (pumpStarted) throw new Error("multiplyStream: cannot add outputs after consumption has started");
            const stream = new PassThrough();
            const entry = makeOutputEntry(stream);
            outputs.push(entry);

            // Start the pump lazily when the first consumer tries to read
            const origRead = stream._read.bind(stream);
            stream._read = function(size: number) {
                ensurePump();
                stream._read = origRead;
                return origRead(size);
            };

            return stream;
        },

        outputs(n: number): Readable[] {
            return Array.from({ length: n }, () => this.output());
        },

        abandon(output: Readable): void {
            const entry = outputs.find(o => o.stream === output);
            if (entry && !entry.abandoned) {
                entry.abandoned = true;
                entry.onAbandon(); // unblock any pending drain wait
                entry.stream.destroy();
            }
        },

        afterEndCheck(expectBytes = -1) {
            if (!pumpDone) {
                throw new Error("MultiplyStream: afterEndCheck called before pump finished");
            }
            if (expectBytes != -1 && inputBytes != expectBytes) {
                throw new Error(`MultiplyStream: Read ${formatFileSize(inputBytes)} but expected ${formatFileSize(expectBytes)}`);
            }
            for (const out of outputs) {
                if (out.abandoned) continue;
                if (out.bytes != inputBytes) {
                    throw new Error(`MultiplyStream: Read ${formatFileSize(inputBytes)} but one of the outputs transfered ${formatFileSize(out.bytes)}`);
                }
            }
        },

    }

}
