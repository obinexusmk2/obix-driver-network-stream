/**
 * Readable Stream — OBIX Wrappers
 *
 * Wraps event-based sources (WebSocket, EventSource, arrays) into
 * WHATWG ReadableStream<StreamMessage> instances with configurable
 * backpressure via queueing strategies.
 */

import type { StreamMessage, ObixQueuingStrategy } from "./types.js";
import { resolveStrategy } from "./backpressure.js";

// ── Source Adapters ───────────────────────────────────────────────────────────

/**
 * A minimal event-source interface that createMessageReadableStream accepts.
 * WebSocket and EventSource both satisfy this shape.
 */
export interface MessageSource {
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose?: (() => void) | null;
  close?(): void;
}

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
export function createMessageReadableStream(
  source: MessageSource,
  strategy?: ObixQueuingStrategy<StreamMessage>
): ReadableStream<StreamMessage> {
  return new ReadableStream<StreamMessage>(
    {
      start(controller) {
        source.onmessage = (event) => {
          const msg: StreamMessage = {
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
    },
    resolveStrategy(strategy)
  );
}

// ── Array / Iterator Source ───────────────────────────────────────────────────

/**
 * Creates a ReadableStream from a static array of StreamMessage values.
 * Useful for testing and replaying recorded message sequences.
 *
 * @example
 * const readable = createArrayReadableStream([msg1, msg2, msg3]);
 */
export function createArrayReadableStream(
  messages: StreamMessage[],
  strategy?: ObixQueuingStrategy<StreamMessage>
): ReadableStream<StreamMessage> {
  let index = 0;
  return new ReadableStream<StreamMessage>(
    {
      pull(controller) {
        if (index < messages.length) {
          controller.enqueue(messages[index++]);
        } else {
          controller.close();
        }
      },
    },
    resolveStrategy(strategy)
  );
}

// ── Async Iterator Source ─────────────────────────────────────────────────────

/**
 * Wraps an async iterable into a ReadableStream<StreamMessage>.
 *
 * @example
 * async function* gen() { yield { type: 'ping', data: null, timestamp: Date.now() }; }
 * const readable = createIterableReadableStream(gen());
 */
export function createIterableReadableStream(
  iterable: AsyncIterable<StreamMessage>,
  strategy?: ObixQueuingStrategy<StreamMessage>
): ReadableStream<StreamMessage> {
  const iterator = iterable[Symbol.asyncIterator]();
  return new ReadableStream<StreamMessage>(
    {
      async pull(controller) {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
      async cancel(reason) {
        await iterator.return?.(reason);
      },
    },
    resolveStrategy(strategy)
  );
}
