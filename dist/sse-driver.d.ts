/**
 * SSE Driver — Server-Sent Events via ReadableStream
 *
 * Wraps the browser's EventSource API into a ReadableStream<StreamMessage>.
 * SSE is inherently one-directional (server → client), so only a readable
 * stream is produced. For bidirectional communication use websocket-driver.ts.
 */
import type { StreamMessage, SSEDriverConfig } from "./types.js";
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
export declare function createSSEReadableStream(config: SSEDriverConfig): ReadableStream<StreamMessage>;
/**
 * Extends SSE reading to handle named event types (e.g. `event: telemetry`).
 * Returns a ReadableStream that listens for a specific SSE event name.
 *
 * @example
 * const telemetry = createNamedSSEStream({ url: '/events' }, 'telemetry');
 */
export declare function createNamedSSEStream(config: SSEDriverConfig, eventName: string): ReadableStream<StreamMessage>;
//# sourceMappingURL=sse-driver.d.ts.map