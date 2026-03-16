import { describe, it, expect } from "vitest";
import {
  createArrayReadableStream,
  createIterableReadableStream,
} from "../src/readable-stream.js";
import type { StreamMessage } from "../src/types.js";

const msg = (type: string, data: unknown = null): StreamMessage => ({
  type,
  data,
  timestamp: Date.now(),
});

describe("createArrayReadableStream", () => {
  it("streams all messages in order", async () => {
    const messages = [msg("a"), msg("b"), msg("c")];
    const readable = createArrayReadableStream(messages);
    const reader = readable.getReader();
    const results: StreamMessage[] = [];

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      results.push(value);
    }

    expect(results).toHaveLength(3);
    expect(results.map((m) => m.type)).toEqual(["a", "b", "c"]);
  });

  it("closes immediately for empty array", async () => {
    const readable = createArrayReadableStream([]);
    const reader = readable.getReader();
    const { done } = await reader.read();
    expect(done).toBe(true);
  });

  it("applies custom highWaterMark strategy", async () => {
    const messages = [msg("x"), msg("y")];
    const readable = createArrayReadableStream(messages, { highWaterMark: 2 });
    const reader = readable.getReader();
    const chunks: StreamMessage[] = [];
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    expect(chunks).toHaveLength(2);
  });
});

describe("createIterableReadableStream", () => {
  it("streams from an async generator", async () => {
    async function* gen(): AsyncGenerator<StreamMessage> {
      yield msg("gen-1");
      yield msg("gen-2");
    }

    const readable = createIterableReadableStream(gen());
    const reader = readable.getReader();
    const results: string[] = [];

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      results.push(value.type);
    }

    expect(results).toEqual(["gen-1", "gen-2"]);
  });
});
