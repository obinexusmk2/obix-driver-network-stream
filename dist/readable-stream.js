/**
 * Readable Stream — OBIX Wrappers
 *
 * Wraps event-based sources (WebSocket, EventSource, arrays) into
 * WHATWG ReadableStream<StreamMessage> instances with configurable
 * backpressure via queueing strategies.
 */
import { resolveStrategy } from "./backpressure.js";
/**
 * Wraps a MessageSource into a ReadableStream<StreamMessage>.
 *
 * Backpressure: when the stream's internal queue exceeds highWaterMark,
 * the underlying source is signalled (via the controller's desiredSize) to
 * pause production. The source must honour this signal itself — browsers
 * do not automatically pause WebSocket or EventSource delivery.
 *
 * @example
 * const ws = new WebSocket('wss://example.com');
 * const readable = createMessageReadableStream(ws);
 * const reader = readable.getReader();
 * const { value } = await reader.read();
 */
export function createMessageReadableStream(source, strategy) {
    return new ReadableStream({
        start(controller) {
            source.onmessage = (event) => {
                const msg = {
                    type: "message",
                    data: event.data,
                    timestamp: Date.now(),
                };
                controller.enqueue(msg);
            };
            source.onerror = () => {
                controller.error(new Error("Stream source error"));
            };
            if ("onclose" in source) {
                source.onclose = () => {
                    controller.close();
                };
            }
        },
        cancel() {
            source.close?.();
        },
    }, resolveStrategy(strategy));
}
// ── Array / Iterator Source ───────────────────────────────────────────────────
/**
 * Creates a ReadableStream from a static array of StreamMessage values.
 * Useful for testing and replaying recorded message sequences.
 *
 * @example
 * const readable = createArrayReadableStream([msg1, msg2, msg3]);
 */
export function createArrayReadableStream(messages, strategy) {
    let index = 0;
    return new ReadableStream({
        pull(controller) {
            if (index < messages.length) {
                controller.enqueue(messages[index++]);
            }
            else {
                controller.close();
            }
        },
    }, resolveStrategy(strategy));
}
// ── Async Iterator Source ─────────────────────────────────────────────────────
/**
 * Wraps an async iterable into a ReadableStream<StreamMessage>.
 *
 * @example
 * async function* gen() { yield { type: 'ping', data: null, timestamp: Date.now() }; }
 * const readable = createIterableReadableStream(gen());
 */
export function createIterableReadableStream(iterable, strategy) {
    const iterator = iterable[Symbol.asyncIterator]();
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) {
                controller.close();
            }
            else {
                controller.enqueue(value);
            }
        },
        async cancel(reason) {
            await iterator.return?.(reason);
        },
    }, resolveStrategy(strategy));
}
//# sourceMappingURL=readable-stream.js.map