/**
 * Byte Stream — ReadableByteStream Utilities
 *
 * Implements the "readable byte stream" variant from the WHATWG Streams spec.
 * A byte stream's controller is a ReadableByteStreamController which supports
 * BYOB (Bring Your Own Buffer) readers, enabling zero-copy reads into a
 * caller-supplied ArrayBuffer.
 */
import type { ByteStreamConfig } from "./types.js";
/**
 * Creates a ReadableStream<Uint8Array> backed by a ReadableByteStreamController.
 *
 * The stream supports both default readers and BYOB readers:
 *   - Default: `stream.getReader()` — browser allocates buffers
 *   - BYOB:    `stream.getReader({ mode: 'byob' })` — caller provides buffer
 *
 * @example
 * const stream = createByteReadableStream({
 *   chunkSize: 1024,
 *   highWaterMark: 65536,
 *   onPull: async (controller) => {
 *     const bytes = await fetchNextChunk();
 *     controller.enqueue(bytes);
 *     if (done) controller.close();
 *   },
 * });
 */
export declare function createByteReadableStream(config?: ByteStreamConfig): ReadableStream<Uint8Array>;
/**
 * Reads exactly `length` bytes from a byte stream using a BYOB reader,
 * accumulating chunks until the buffer is full.
 *
 * Returns a Uint8Array of exactly `length` bytes, or fewer if the stream
 * closes before the buffer is filled.
 *
 * @example
 * const stream = createByteReadableStream({ ... });
 * const bytes = await readExactBytes(stream, 256);
 */
export declare function readExactBytes(stream: ReadableStream<Uint8Array>, length: number): Promise<Uint8Array>;
/**
 * Drains an entire ReadableStream<Uint8Array> into a single concatenated
 * Uint8Array. Useful for small streams where buffering all output is acceptable.
 *
 * @example
 * const all = await concatByteStream(byteStream);
 */
export declare function concatByteStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array>;
//# sourceMappingURL=byte-stream.d.ts.map