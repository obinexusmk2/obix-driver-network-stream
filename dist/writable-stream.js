/**
 * Writable Stream — OBIX Wrappers
 *
 * Wraps send functions into WHATWG WritableStream<StreamMessage> sinks.
 * The WritableStream's backpressure signal (desiredSize) propagates back
 * through pipe chains to throttle producers automatically.
 */
import { resolveStrategy } from "./backpressure.js";
/**
 * Wraps a MessageSink (e.g. WebSocket) into a WritableStream<StreamMessage>.
 *
 * Each message is JSON-serialised before being handed to sink.send().
 * The `start` callback waits for the sink to be ready (readyState === 1
 * for WebSocket open state) before resolving — preventing writes before
 * the connection is established.
 *
 * @example
 * const ws = new WebSocket('wss://example.com');
 * const writable = createMessageWritableStream(ws);
 * const writer = writable.getWriter();
 * await writer.write({ type: 'ping', data: null, timestamp: Date.now() });
 * await writer.close();
 */
export function createMessageWritableStream(sink, strategy) {
    return new WritableStream({
        write(chunk) {
            sink.send(JSON.stringify(chunk));
        },
        close() {
            // No-op: caller manages connection lifecycle.
        },
        abort(reason) {
            console.error("[network-stream] WritableStream aborted:", reason);
        },
    }, resolveStrategy(strategy));
}
// ── Collector Sink ────────────────────────────────────────────────────────────
/**
 * Creates a WritableStream that collects all written chunks into an array.
 * Useful for testing and buffering message sequences.
 *
 * @example
 * const { writable, messages } = createCollectorWritableStream();
 * await readable.pipeTo(writable);
 * console.log(messages); // all StreamMessages
 */
export function createCollectorWritableStream(strategy) {
    const messages = [];
    const writable = new WritableStream({
        write(chunk) {
            messages.push(chunk);
        },
    }, resolveStrategy(strategy));
    return { writable, messages };
}
// ── Callback Sink ─────────────────────────────────────────────────────────────
/**
 * Creates a WritableStream that calls a handler for each chunk.
 *
 * @example
 * const writable = createCallbackWritableStream((msg) => console.log(msg));
 */
export function createCallbackWritableStream(onWrite, onClose, strategy) {
    return new WritableStream({
        write: onWrite,
        close: onClose,
    }, resolveStrategy(strategy));
}
//# sourceMappingURL=writable-stream.js.map