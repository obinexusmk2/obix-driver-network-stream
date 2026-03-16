import { describe, it, expect } from "vitest";
import {
  pipeMessageStream,
  transformMessageStream,
  teeMessageStream,
  composeTransforms,
} from "../src/pipe-chain.js";
import { createArrayReadableStream } from "../src/readable-stream.js";
import { createCollectorWritableStream } from "../src/writable-stream.js";
import { createFilterTransformStream, createMapTransformStream } from "../src/transform-stream.js";
import type { StreamMessage } from "../src/types.js";

const msg = (type: string): StreamMessage => ({ type, data: null, timestamp: Date.now() });

async function collect(readable: ReadableStream<StreamMessage>): Promise<StreamMessage[]> {
  const { writable, messages } = createCollectorWritableStream();
  await readable.pipeTo(writable);
  return messages;
}

describe("pipeMessageStream", () => {
  it("pipes all chunks from readable to writable", async () => {
    const readable = createArrayReadableStream([msg("a"), msg("b")]);
    const { writable, messages } = createCollectorWritableStream();
    await pipeMessageStream(readable, writable);
    expect(messages.map((m) => m.type)).toEqual(["a", "b"]);
  });
});

describe("transformMessageStream", () => {
  it("applies transform and returns new readable", async () => {
    const readable = createArrayReadableStream([msg("ping"), msg("pong")]);
    const only = transformMessageStream(
      readable,
      createFilterTransformStream((m) => m.type === "ping")
    );
    const results = await collect(only);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("ping");
  });
});

describe("teeMessageStream", () => {
  it("delivers all chunks to both branches", async () => {
    const readable = createArrayReadableStream([msg("x"), msg("y"), msg("z")]);
    const [b1, b2] = teeMessageStream(readable);

    const [r1, r2] = await Promise.all([collect(b1), collect(b2)]);

    expect(r1.map((m) => m.type)).toEqual(["x", "y", "z"]);
    expect(r2.map((m) => m.type)).toEqual(["x", "y", "z"]);
  });
});

describe("composeTransforms", () => {
  it("chains multiple transforms in sequence", async () => {
    const readable = createArrayReadableStream([msg("hello"), msg("ping"), msg("world")]);
    const composed = composeTransforms(readable, [
      createFilterTransformStream((m) => m.type !== "ping"),
      createMapTransformStream((m) => ({ ...m, type: m.type.toUpperCase() })),
    ]);
    const results = await collect(composed);
    expect(results.map((m) => m.type)).toEqual(["HELLO", "WORLD"]);
  });
});
