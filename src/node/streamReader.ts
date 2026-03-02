import {Readable} from "stream";

/**
 * Sequential reader for a Readable stream with position tracking.
 *
 * Unlike `for await (const chunk of stream)`, breaking out of consumption
 * does NOT destroy the stream — the same reader can be used to continue reading.
 * This is because we call the async iterator's `.next()` directly instead of
 * using `for await`, which calls `.return()` on break/throw.
 *
 * All operations are sequential — the stream is consumed forward-only.
 * File-offset-based methods (like {@link readRanges}) require that requested
 * offsets are always >= the current position.
 */
export class StreamReader {
    private iter: AsyncIterator<Buffer>;
    /** Bytes buffered but not yet consumed. */
    private pending: Buffer = Buffer.alloc(0);
    /** Absolute stream position at the start of `pending`. */
    private pos: number = 0;
    private ended: boolean = false;

    constructor(stream: Readable) {
        this.iter = stream[Symbol.asyncIterator]();
    }

    /** Current absolute position (start of unconsumed data). */
    get position(): number {
        return this.pos;
    }

    /** Pull the next chunk from the underlying iterator into `pending`. Returns false on end-of-stream. */
    private async pull(): Promise<boolean> {
        if (this.ended) return false;
        const { value, done } = await this.iter.next();
        if (done) {
            this.ended = true;
            return false;
        }
        const buf = value as Buffer;
        this.pending = this.pending.length > 0
            ? Buffer.concat([this.pending, buf])
            : buf;
        return true;
    }

    /** Returns the next raw chunk from the stream, or null on end. Flushes any pending buffer first. */
    async next(): Promise<Buffer | null> {
        if (this.pending.length > 0) {
            const buf = this.pending;
            this.pos += buf.length;
            this.pending = Buffer.alloc(0);
            return buf;
        }
        if (this.ended) return null;
        const { value, done } = await this.iter.next();
        if (done) {
            this.ended = true;
            return null;
        }
        const buf = value as Buffer;
        this.pos += buf.length;
        return buf;
    }

    /** Skip `n` bytes from the current position, discarding them. */
    async skip(n: number): Promise<void> {
        while (n > 0) {
            if (this.pending.length > 0) {
                if (this.pending.length <= n) {
                    n -= this.pending.length;
                    this.pos += this.pending.length;
                    this.pending = Buffer.alloc(0);
                } else {
                    this.pos += n;
                    this.pending = this.pending.subarray(n);
                    return;
                }
            }
            if (n === 0) return;
            if (!await this.pull()) return; // stream ended early
        }
    }

    /** Read exactly `n` bytes from the current position. Returns a shorter buffer if the stream ends early. */
    async read(n: number): Promise<Buffer> {
        while (this.pending.length < n) {
            if (!await this.pull()) break;
        }
        const take = Math.min(n, this.pending.length);
        const result = Buffer.from(this.pending.subarray(0, take));
        this.pending = this.pending.subarray(take);
        this.pos += take;
        return result;
    }

    /**
     * Read byte ranges at absolute stream offsets. Targets must be sorted by offset
     * and all offsets must be >= the current position. Gaps between ranges are skipped
     * without buffering.
     *
     * Returns one Buffer per target. If the stream ends before a target is fully read,
     * the returned array will be shorter than the input.
     */
    async readRanges(targets: { offset: number; size: number }[]): Promise<Buffer[]> {
        const results: Buffer[] = [];
        for (const target of targets) {
            const gap = target.offset - this.pos;
            if (gap < 0) {
                throw new Error(`StreamReader.readRanges: target offset ${target.offset} is behind current position ${this.pos}`);
            }
            if (gap > 0) await this.skip(gap);
            const buf = await this.read(target.size);
            if (buf.length < target.size) break; // stream ended
            results.push(buf);
        }
        return results;
    }

    /**
     * Push bytes back to the front of the reader, adjusting the position backwards.
     * The caller must ensure these bytes were originally consumed from this reader
     * (i.e., this is an undo of a previous read).
     */
    unread(buf: Buffer): void {
        if (buf.length === 0) return;
        this.pending = this.pending.length > 0
            ? Buffer.concat([buf, this.pending])
            : buf;
        this.pos -= buf.length;
    }

    /** Consume all remaining bytes, discarding them. */
    async drain(): Promise<void> {
        this.pending = Buffer.alloc(0);
        let done: boolean | undefined = false;
        while (!done) {
            ({ done } = await this.iter.next());
        }
        this.ended = true;
    }
}
