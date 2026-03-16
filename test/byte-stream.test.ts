import { describe, it, expect } from "vitest";
import {
  createByteReadableStream,
  concatByteStream,
} from "../src/byte-stream.js";

describe("createByteReadableStream", () => {
  it("closes immediately when no onPull is provided", async () => {
    const stream = createByteReadableStream({});
    const result = await concatByteStream(stream);
    expect(result.byteLength).toBe(0);
  });

  it("enqueues chunks via onPull callback", async () => {
    let pulled = false;
    const stream = createByteReadableStream({
      chunkSize: 4,
      onPull(controller) {
        if (!pulled) {
          pulled = true;
          controller.enqueue(new Uint8Array([1, 2, 3, 4]));
        }
        controller.close();
      },
    });

    const result = await concatByteStream(stream);
    expect(result.byteLength).toBe(4);
    expect(Array.from(result)).toEqual([1, 2, 3, 4]);
  });

  it("calls onStart when stream begins", async () => {
    let started = false;
    const stream = createByteReadableStream({
      onStart() {
        started = true;
      },
    });
    await concatByteStream(stream);
    expect(started).toBe(true);
  });
});

describe("concatByteStream", () => {
  it("concatenates multiple chunks into a single Uint8Array", async () => {
    const chunks = [
      new Uint8Array([0, 1]),
      new Uint8Array([2, 3]),
      new Uint8Array([4, 5]),
    ];
    let i = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (i < chunks.length) {
          controller.enqueue(chunks[i++]);
        } else {
          controller.close();
        }
      },
    });

    const result = await concatByteStream(stream);
    expect(Array.from(result)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
