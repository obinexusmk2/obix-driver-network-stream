/**
 * Pipe Chain — Typed Wrappers for pipeTo / pipeThrough / tee
 *
 * Provides convenience helpers that preserve StreamMessage types across
 * pipe operations. Each helper maps directly to a WHATWG Streams primitive:
 *   pipeMessageStream   → ReadableStream.pipeTo()
 *   transformMessageStream → ReadableStream.pipeThrough()
 *   teeMessageStream    → ReadableStream.tee()
 */
import type { StreamMessage } from "./types.js";
/**
 * Pipes a ReadableStream<StreamMessage> into a WritableStream<StreamMessage>.
 * Returns a Promise that resolves when the pipe completes (writable closed)
 * or rejects on the first error.
 *
 * Backpressure propagates automatically: the readable pauses when the
 * writable's internal queue exceeds its highWaterMark.
 *
 * @example
 * await pipeMessageStream(readable, writable, { preventClose: true });
 */
export declare function pipeMessageStream(readable: ReadableStream<StreamMessage>, writable: WritableStream<StreamMessage>, options?: StreamPipeOptions): Promise<void>;
/**
 * Pipes a ReadableStream<StreamMessage> through a TransformStream and returns
 * the transformed ReadableStream<StreamMessage>.
 *
 * @example
 * const filtered = transformMessageStream(readable, createFilterTransformStream(pred));
 * await filtered.pipeTo(writable);
 */
export declare function transformMessageStream(readable: ReadableStream<StreamMessage>, transform: TransformStream<StreamMessage, StreamMessage>, options?: StreamPipeOptions): ReadableStream<StreamMessage>;
/**
 * Pipes a ReadableStream<StreamMessage> through a TransformStream that
 * produces a different output type T (e.g. Uint8Array).
 *
 * @example
 * const bytes = transformMessageStreamTo(readable, createMessageEncoderStream());
 */
export declare function transformMessageStreamTo<T>(readable: ReadableStream<StreamMessage>, transform: TransformStream<StreamMessage, T>, options?: StreamPipeOptions): ReadableStream<T>;
/**
 * Splits a ReadableStream<StreamMessage> into two independent streams that
 * each receive every chunk. The original stream is locked after teeing.
 *
 * Note: tee() buffers chunks internally until both branches have consumed
 * them, so use with care on high-volume streams.
 *
 * @example
 * const [branch1, branch2] = teeMessageStream(readable);
 * branch1.pipeTo(writable1);
 * branch2.pipeTo(writable2);
 */
export declare function teeMessageStream(readable: ReadableStream<StreamMessage>): [ReadableStream<StreamMessage>, ReadableStream<StreamMessage>];
/**
 * Chains multiple TransformStream<StreamMessage, StreamMessage> stages into
 * a single pipeline, returning the final readable end.
 *
 * @example
 * const out = composeTransforms(readable, [timestampTransform, filterTransform]);
 */
export declare function composeTransforms(readable: ReadableStream<StreamMessage>, transforms: TransformStream<StreamMessage, StreamMessage>[]): ReadableStream<StreamMessage>;
//# sourceMappingURL=pipe-chain.d.ts.map