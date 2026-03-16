/**
 * Backpressure — Queueing Strategy Utilities
 *
 * Based on the WHATWG Streams spec section "The queueingStrategy".
 * highWaterMark controls when the underlying source is signalled to stop
 * producing chunks. size() computes the "weight" of each chunk.
 */
// ── Size Functions ────────────────────────────────────────────────────────────
/**
 * Size function for StreamMessage chunks — counts each message as 1 unit.
 * Use with CountQueuingStrategy or a custom strategy where messages are
 * uniform in cost.
 */
export function countSize(_chunk) {
    return 1;
}
/**
 * Size function for raw byte chunks.
 * Compatible with ByteLengthQueuingStrategy semantics.
 */
export function byteSize(chunk) {
    if (chunk instanceof ArrayBuffer) {
        return chunk.byteLength;
    }
    return chunk.byteLength;
}
/**
 * Size function for string chunks — returns UTF-16 code unit count.
 * For byte-accurate sizing, encode to Uint8Array first.
 */
export function stringSize(chunk) {
    return chunk.length;
}
// ── Strategy Factories ────────────────────────────────────────────────────────
/**
 * Returns a CountQueuingStrategy with the given highWaterMark.
 *
 * @example
 * const readable = new ReadableStream(source, createCountStrategy(16));
 */
export function createCountStrategy(highWaterMark = 1) {
    return new CountQueuingStrategy({ highWaterMark });
}
/**
 * Returns a ByteLengthQueuingStrategy with the given highWaterMark (bytes).
 * Use when chunks are Uint8Array / ArrayBuffer.
 *
 * @example
 * const readable = new ReadableStream(byteSource, createByteLengthStrategy(65536));
 */
export function createByteLengthStrategy(highWaterMark = 65536) {
    return new ByteLengthQueuingStrategy({ highWaterMark });
}
/**
 * Builds a custom QueuingStrategy from an ObixQueuingStrategy descriptor.
 * Falls back to CountQueuingStrategy when no size function is provided.
 */
export function resolveStrategy(strategy) {
    const hwm = strategy?.highWaterMark ?? 1;
    const size = strategy?.size;
    if (size) {
        return { highWaterMark: hwm, size };
    }
    return new CountQueuingStrategy({ highWaterMark: hwm });
}
//# sourceMappingURL=backpressure.js.map