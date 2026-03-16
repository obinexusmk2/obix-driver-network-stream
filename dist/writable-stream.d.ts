/**
 * Writable Stream — OBIX Wrappers
 *
 * Wraps send functions into WHATWG WritableStream<StreamMessage> sinks.
 * The WritableStream's backpressure signal (desiredSize) propagates back
 * through pipe chains to throttle producers automatically.
 */
import type { StreamMessage, ObixQueuingStrategy } from "./types.js";
/**
 * A minimal send-capable interface accepted by createMessageWritableStream.
 */
export interface MessageSink {
    send(data: string): void;
    readyState?: number;
}
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
export declare function createMessageWritableStream(sink: MessageSink, strategy?: ObixQueuingStrategy<StreamMessage>): WritableStream<StreamMessage>;
/**
 * Creates a WritableStream that collects all written chunks into an array.
 * Useful for testing and buffering message sequences.
 *
 * @example
 * const { writable, messages } = createCollectorWritableStream();
 * await readable.pipeTo(writable);
 * console.log(messages); // all StreamMessages
 */
export declare function createCollectorWritableStream(strategy?: ObixQueuingStrategy<StreamMessage>): {
    writable: WritableStream<StreamMessage>;
    messages: StreamMessage[];
};
/**
 * Creates a WritableStream that calls a handler for each chunk.
 *
 * @example
 * const writable = createCallbackWritableStream((msg) => console.log(msg));
 */
export declare function createCallbackWritableStream(onWrite: (chunk: StreamMessage) => void | Promise<void>, onClose?: () => void, strategy?: ObixQueuingStrategy<StreamMessage>): WritableStream<StreamMessage>;
//# sourceMappingURL=writable-stream.d.ts.map