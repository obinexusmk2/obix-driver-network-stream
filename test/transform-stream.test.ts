import { describe, it, expect } from "vitest";
import {
  createJsonTransformStream,
  createTimestampTransformStream,
  createFilterTransformStream,
  createMapTransformStream,
} from "../src/transform-stream.js";
import { createArrayReadableStream } from "../src/readable-stream.js";
import { createCollectorWritableStream } from "../src/writable-stream.js";
import type { StreamMessage } from "../src/types.js";

const msg = (type: string, data: unknown = null, timestamp = Date.now()): StreamMessage => ({
  type,
  data,
  timestamp,
});

async function drain(readable: ReadableStream<StreamMessage>): Promise<StreamMessage[]> {
  const { writable, messages } = createCollectorWritableStream();
  await readable.pipeTo(writable);
  return messages;
}

describe("createJsonTransformStream", () => {
  it("parses JSON strings into StreamMessages", async () => {
    const raw = ['{"type":"ping","data":1,"timestamp":0}'];
    const source = new ReadableStream<string>({
      start(controller) {
        raw.forEach((s) => controller.enqueue(s));
        controller.close();
      },
    });

    const transform = createJsonTransformStream();
    const readable = source.pipeThrough(transform);
    const { writable, messages } = createCollectorWritableStream();
    await readable.pipeTo(writable);

    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe("ping");
    expect(messages[0].data).toBe(1);
  });
});

describe("createTimestampTransformStream", () => {
  it("preserves existing timestamps by default", async () => {
    const ts = 12345;
    const readable = createArrayReadableStream([msg("x", null, ts)]);
    const transformed = readable.pipeThrough(createTimestampTransformStream());
    const results = await drain(transformed);
    expect(results[0].timestamp).toBe(ts);
  });

  it("replaces stale timestamps when maxAgeMs is set", async () => {
    const staleTs = Date.now() - 10_000;
    const readable = createArrayReadableStream([msg("x", null, staleTs)]);
    const transformed = readable.pipeThrough(createTimestampTransformStream(1_000));
    const results = await drain(transformed);
    expect(results[0].timestamp).toBeGreaterThan(staleTs);
  });
});

describe("createFilterTransformStream", () => {
  it("passes only matching messages", async () => {
    const messages = [msg("ping"), msg("pong"), msg("ping")];
    const readable = createArrayReadableStream(messages);
    const filtered = readable.pipeThrough(
      createFilterTransformStream((m) => m.type === "ping")
    );
    const results = await drain(filtered);
    expect(results).toHaveLength(2);
    expect(results.every((m) => m.type === "ping")).toBe(true);
  });

  it("produces empty stream when no messages match", async () => {
    const readable = createArrayReadableStream([msg("a"), msg("b")]);
    const filtered = readable.pipeThrough(
      createFilterTransformStream(() => false)
    );
    const results = await drain(filtered);
    expect(results).toHaveLength(0);
  });
});

describe("createMapTransformStream", () => {
  it("transforms each chunk", async () => {
    const readable = createArrayReadableStream([msg("hello")]);
    const mapped = readable.pipeThrough(
      createMapTransformStream((m) => ({ ...m, type: m.type.toUpperCase() }))
    );
    const results = await drain(mapped);
    expect(results[0].type).toBe("HELLO");
  });
});
