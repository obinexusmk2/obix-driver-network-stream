/**
 * Transform Stream — OBIX Message Processors
 *
 * TransformStream consists of a paired writable side (input) and readable
 * side (output). Data written to the writable is transformed and enqueued
 * onto the readable. Both writableStrategy and readableStrategy can be
 * configured independently per the WHATWG spec.
 */

import type { StreamMessage, ObixQueuingStrategy } from "./types.js";
import { resolveStrategy } from "./backpressure.js";

// ── JSON Transform ────────────────────────────────────────────────────────────

/**
 * Parses raw string chunks into StreamMessage objects.
 * Use when receiving JSON-serialised messages over SSE or raw WebSocket.
 *
 * @example
 * const transform = createJsonTransformStream();
 * rawReadable.pipeThrough(transform).pipeTo(writable);
 */
export function createJsonTransformStream(
  writableStrategy?: ObixQueuingStrategy<string>,
  readableStrategy?: ObixQueuingStrategy<StreamMessage>
): TransformStream<string, StreamMessage> {
  return new TransformStream<string, StreamMessage>(
    {
      transform(chunk, controller) {
        try {
          const parsed = JSON.parse(chunk) as Partial<StreamMessage>;
          controller.enqueue({
            type: parsed.type ?? "message",
            data: parsed.data ?? parsed,
            timestamp: parsed.timestamp ?? Date.now(),
          });
        } catch {
          controller.error(new Error(`[network-stream] JSON parse failed: ${chunk}`));
        }
      },
    },
    resolveStrategy(writableStrategy),
    resolveStrategy(readableStrategy)
  );
}

// ── Timestamp Inject Transform ────────────────────────────────────────────────

/**
 * Stamps each StreamMessage with the current time if timestamp is missing
 * or stale (older than maxAgeMs).
 *
 * @example
 * const transform = createTimestampTransformStream();
 * readable.pipeThrough(transform).pipeTo(writable);
 */
export function createTimestampTransformStream(
  maxAgeMs = 0,
  writableStrategy?: ObixQueuingStrategy<StreamMessage>,
  readableStrategy?: ObixQueuingStrategy<StreamMessage>
): TransformStream<StreamMessage, StreamMessage> {
  return new TransformStream<StreamMessage, StreamMessage>(
    {
      transform(chunk, controller) {
        const now = Date.now();
        const isStale = maxAgeMs > 0 && now - chunk.timestamp > maxAgeMs;
        controller.enqueue(
          isStale || !chunk.timestamp ? { ...chunk, timestamp: now } : chunk
        );
      },
    },
    resolveStrategy(writableStrategy),
    resolveStrategy(readableStrategy)
  );
}

// ── Filter Transform ──────────────────────────────────────────────────────────

/**
 * Filters a StreamMessage stream, only passing chunks that satisfy predicate.
 *
 * @example
 * const onlyPing = createFilterTransformStream((msg) => msg.type === 'ping');
 */
export function createFilterTransformStream(
  predicate: (chunk: StreamMessage) => boolean,
  writableStrategy?: ObixQueuingStrategy<StreamMessage>,
  readableStrategy?: ObixQueuingStrategy<StreamMessage>
): TransformStream<StreamMessage, StreamMessage> {
  return new TransformStream<StreamMessage, StreamMessage>(
    {
      transform(chunk, controller) {
        if (predicate(chunk)) {
          controller.enqueue(chunk);
        }
      },
    },
    resolveStrategy(writableStrategy),
    resolveStrategy(readableStrategy)
  );
}

// ── Map Transform ─────────────────────────────────────────────────────────────

/**
 * Maps each StreamMessage chunk to a new StreamMessage using a mapper function.
 *
 * @example
 * const upper = createMapTransformStream((msg) => ({ ...msg, type: msg.type.toUpperCase() }));
 */
export function createMapTransformStream(
  mapper: (chunk: StreamMessage) => StreamMessage,
  writableStrategy?: ObixQueuingStrategy<StreamMessage>,
  readableStrategy?: ObixQueuingStrategy<StreamMessage>
): TransformStream<StreamMessage, StreamMessage> {
  return new TransformStream<StreamMessage, StreamMessage>(
    {
      transform(chunk, controller) {
        controller.enqueue(mapper(chunk));
      },
    },
    resolveStrategy(writableStrategy),
    resolveStrategy(readableStrategy)
  );
}

// ── TextEncoder Transform ─────────────────────────────────────────────────────

/**
 * Encodes StreamMessage chunks to Uint8Array (UTF-8) for byte-level transport.
 * Mirrors the TextEncoderStream built-in but operates on StreamMessage input.
 */
export function createMessageEncoderStream(
  writableStrategy?: ObixQueuingStrategy<StreamMessage>,
  readableStrategy?: ObixQueuingStrategy<Uint8Array>
): TransformStream<StreamMessage, Uint8Array> {
  const encoder = new TextEncoder();
  return new TransformStream<StreamMessage, Uint8Array>(
    {
      transform(chunk, controller) {
        controller.enqueue(encoder.encode(JSON.stringify(chunk)));
      },
    },
    resolveStrategy(writableStrategy),
    resolveStrategy(readableStrategy)
  );
}
