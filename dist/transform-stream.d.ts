/**
 * Transform Stream — OBIX Message Processors
 *
 * TransformStream consists of a paired writable side (input) and readable
 * side (output). Data written to the writable is transformed and enqueued
 * onto the readable. Both writableStrategy and readableStrategy can be
 * configured independently per the WHATWG spec.
 */
import type { StreamMessage, ObixQueuingStrategy } from "./types.js";
/**
 * Parses raw string chunks into StreamMessage objects.
 * Use when receiving JSON-serialised messages over SSE or raw WebSocket.
 *
 * @example
 * const transform = createJsonTransformStream();
 * rawReadable.pipeThrough(transform).pipeTo(writable);
 */
export declare function createJsonTransformStream(writableStrategy?: ObixQueuingStrategy<string>, readableStrategy?: ObixQueuingStrategy<StreamMessage>): TransformStream<string, StreamMessage>;
/**
 * Stamps each StreamMessage with the current time if timestamp is missing
 * or stale (older than maxAgeMs).
 *
 * @example
 * const transform = createTimestampTransformStream();
 * readable.pipeThrough(transform).pipeTo(writable);
 */
export declare function createTimestampTransformStream(maxAgeMs?: number, writableStrategy?: ObixQueuingStrategy<StreamMessage>, readableStrategy?: ObixQueuingStrategy<StreamMessage>): TransformStream<StreamMessage, StreamMessage>;
/**
 * Filters a StreamMessage stream, only passing chunks that satisfy predicate.
 *
 * @example
 * const onlyPing = createFilterTransformStream((msg) => msg.type === 'ping');
 */
export declare function createFilterTransformStream(predicate: (chunk: StreamMessage) => boolean, writableStrategy?: ObixQueuingStrategy<StreamMessage>, readableStrategy?: ObixQueuingStrategy<StreamMessage>): TransformStream<StreamMessage, StreamMessage>;
/**
 * Maps each StreamMessage chunk to a new StreamMessage using a mapper function.
 *
 * @example
 * const upper = createMapTransformStream((msg) => ({ ...msg, type: msg.type.toUpperCase() }));
 */
export declare function createMapTransformStream(mapper: (chunk: StreamMessage) => StreamMessage, writableStrategy?: ObixQueuingStrategy<StreamMessage>, readableStrategy?: ObixQueuingStrategy<StreamMessage>): TransformStream<StreamMessage, StreamMessage>;
/**
 * Encodes StreamMessage chunks to Uint8Array (UTF-8) for byte-level transport.
 * Mirrors the TextEncoderStream built-in but operates on StreamMessage input.
 */
export declare function createMessageEncoderStream(writableStrategy?: ObixQueuingStrategy<StreamMessage>, readableStrategy?: ObixQueuingStrategy<Uint8Array>): TransformStream<StreamMessage, Uint8Array>;
//# sourceMappingURL=transform-stream.d.ts.map