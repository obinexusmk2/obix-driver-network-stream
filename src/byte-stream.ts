/**
 * Byte Stream — ReadableByteStream Utilities
 *
 * Implements the "readable byte stream" variant from the WHATWG Streams spec.
 * A byte stream's controller is a ReadableByteStreamController which supports
 * BYOB (Bring Your Own Buffer) readers, enabling zero-copy reads into a
 * caller-supplied ArrayBuffer.
 */

import type { ByteStreamConfig } from "./types.js";

// ── Byte Readable Stream ──────────────────────────────────────────────────────

/**
 * Creates a ReadableStream<Uint8Array> backed by a ReadableByteStreamController.
 *
 * The stream supports both default readers and BYOB readers:
 *   - Default: `stream.getReader()` — browser allocates buffers
 *   - BYOB:    `stream.getReader({ mode: 'byob' })` — caller provides buffer
 *
 * @example
 * const stream = createByteReadableStream({
 *   chunkSize: 1024,
 *   highWaterMark: 65536,
 *   onPull: async (controller) => {
 *     const bytes = await fetchNextChunk();
 *     controller.enqueue(bytes);
 *     if (done) controller.close();
 *   },
 * });
 */
export function createByteReadableStream(
  config: ByteStreamConfig = {}
): ReadableStream<Uint8Array> {
  const { chunkSize = 1, highWaterMark = 0, onStart, onPull, onCancel } = config;

  return new ReadableStream<Uint8Array>(
    {
      type: "bytes",
      autoAllocateChunkSize: chunkSize,

      start(_controller) {
        onStart?.();
      },

      async pull(controller) {
        if (onPull) {
          await onPull(controller as ReadableByteStreamController);
        } else {
          // Default: close immediately if no pull handler provided.
          controller.close();
        }
      },

      cancel(reason) {
        onCancel?.(reason);
      },
    },
    { highWaterMark }
  );
}

// ── BYOB Reader Helper ────────────────────────────────────────────────────────

/**
 * Reads exactly `length` bytes from a byte stream using a BYOB reader,
 * accumulating chunks until the buffer is full.
 *
 * Returns a Uint8Array of exactly `length` bytes, or fewer if the stream
 * closes before the buffer is filled.
 *
 * @example
 * const stream = createByteReadableStream({ ... });
 * const bytes = await readExactBytes(stream, 256);
 */
export async function readExactBytes(
  stream: ReadableStream<Uint8Array>,
  length: number
): Promise<Uint8Array> {
  const reader = stream.getReader({ mode: "byob" });
  const buffer = new ArrayBuffer(length);
  let offset = 0;

  try {
    while (offset < length) {
      const view = new Uint8Array(buffer, offset, length - offset);
      const { value, done } = await reader.read(view);
      if (done) break;
      offset += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  return new Uint8Array(buffer, 0, offset);
}

// ── Uint8Array Concat Helper ──────────────────────────────────────────────────

/**
 * Drains an entire ReadableStream<Uint8Array> into a single concatenated
 * Uint8Array. Useful for small streams where buffering all output is acceptable.
 *
 * @example
 * const all = await concatByteStream(byteStream);
 */
export async function concatByteStream(
  stream: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
