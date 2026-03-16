/**
 * SSE Driver — Server-Sent Events via ReadableStream
 *
 * Wraps the browser's EventSource API into a ReadableStream<StreamMessage>.
 * SSE is inherently one-directional (server → client), so only a readable
 * stream is produced. For bidirectional communication use websocket-driver.ts.
 */
// ── SSE ReadableStream ────────────────────────────────────────────────────────
/**
 * Creates a ReadableStream<StreamMessage> backed by an EventSource connection.
 *
 * The stream closes when the EventSource fires an error that cannot be
 * recovered (e.g. HTTP 4xx). The EventSource is closed on stream cancellation.
 *
 * @example
 * const stream = createSSEReadableStream({ url: 'https://api.example.com/events' });
 * const reader = stream.getReader();
 * while (true) {
 *   const { value, done } = await reader.read();
 *   if (done) break;
 *   console.log(value);
 * }
 */
export function createSSEReadableStream(config) {
    const { url, highWaterMark = 1 } = config;
    return new ReadableStream({
        start(controller) {
            const source = new EventSource(url);
            source.onmessage = (event) => {
                let data = event.data;
                try {
                    data = JSON.parse(event.data);
                }
                catch {
                    // Keep raw string data if not JSON
                }
                controller.enqueue({
                    type: event.type || "message",
                    data,
                    timestamp: Date.now(),
                });
            };
            source.onerror = () => {
                if (source.readyState === EventSource.CLOSED) {
                    controller.close();
                }
                else {
                    controller.error(new Error("[network-stream] SSE connection error"));
                }
                source.close();
            };
            // Store for cancel()
            controller._source = source;
        },
        cancel(controller) {
            const src = controller._source;
            src?.close();
        },
    }, { highWaterMark });
}
// ── Named Event Support ───────────────────────────────────────────────────────
/**
 * Extends SSE reading to handle named event types (e.g. `event: telemetry`).
 * Returns a ReadableStream that listens for a specific SSE event name.
 *
 * @example
 * const telemetry = createNamedSSEStream({ url: '/events' }, 'telemetry');
 */
export function createNamedSSEStream(config, eventName) {
    const { url, highWaterMark = 1 } = config;
    return new ReadableStream({
        start(controller) {
            const source = new EventSource(url);
            const handler = (event) => {
                let data = event.data;
                try {
                    data = JSON.parse(event.data);
                }
                catch {
                    // Keep raw string
                }
                controller.enqueue({
                    type: eventName,
                    data,
                    timestamp: Date.now(),
                });
            };
            source.addEventListener(eventName, handler);
            source.onerror = () => {
                source.removeEventListener(eventName, handler);
                if (source.readyState === EventSource.CLOSED) {
                    controller.close();
                }
                else {
                    controller.error(new Error(`[network-stream] SSE error on event "${eventName}"`));
                }
                source.close();
            };
            controller._source = source;
            controller._handler = handler;
        },
        cancel(controller) {
            const src = controller._source;
            src?.close();
        },
    }, { highWaterMark });
}
//# sourceMappingURL=sse-driver.js.map