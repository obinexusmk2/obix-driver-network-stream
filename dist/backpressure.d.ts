/**
 * Backpressure — Queueing Strategy Utilities
 *
 * Based on the WHATWG Streams spec section "The queueingStrategy".
 * highWaterMark controls when the underlying source is signalled to stop
 * producing chunks. size() computes the "weight" of each chunk.
 */
import type { StreamMessage, ObixQueuingStrategy } from "./types.js";
/**
 * Size function for StreamMessage chunks — counts each message as 1 unit.
 * Use with CountQueuingStrategy or a custom strategy where messages are
 * uniform in cost.
 */
export declare function countSize(_chunk: StreamMessage): number;
/**
 * Size function for raw byte chunks.
 * Compatible with ByteLengthQueuingStrategy semantics.
 */
export declare function byteSize(chunk: Uint8Array | ArrayBuffer): number;
/**
 * Size function for string chunks — returns UTF-16 code unit count.
 * For byte-accurate sizing, encode to Uint8Array first.
 */
export declare function stringSize(chunk: string): number;
/**
 * Returns a CountQueuingStrategy with the given highWaterMark.
 *
 * @example
 * const readable = new ReadableStream(source, createCountStrategy(16));
 */
export declare function createCountStrategy(highWaterMark?: number): QueuingStrategy<StreamMessage>;
/**
 * Returns a ByteLengthQueuingStrategy with the given highWaterMark (bytes).
 * Use when chunks are Uint8Array / ArrayBuffer.
 *
 * @example
 * const readable = new ReadableStream(byteSource, createByteLengthStrategy(65536));
 */
export declare function createByteLengthStrategy(highWaterMark?: number): QueuingStrategy<ArrayBufferView>;
/**
 * Builds a custom QueuingStrategy from an ObixQueuingStrategy descriptor.
 * Falls back to CountQueuingStrategy when no size function is provided.
 */
export declare function resolveStrategy<T = StreamMessage>(strategy?: ObixQueuingStrategy<T>): QueuingStrategy<T>;
//# sourceMappingURL=backpressure.d.ts.map