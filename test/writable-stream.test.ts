import { describe, it, expect, vi } from "vitest";
import {
  createCollectorWritableStream,
  createCallbackWritableStream,
} from "../src/writable-stream.js";
import type { StreamMessage } from "../src/types.js";

const msg = (type: string): StreamMessage => ({
  type,
  data: null,
  timestamp: Date.now(),
});

describe("createCollectorWritableStream", () => {
  it("collects all written messages", async () => {
    const { writable, messages } = createCollectorWritableStream();
    const writer = writable.getWriter();

    await writer.write(msg("a"));
    await writer.write(msg("b"));
    await writer.close();

    expect(messages).toHaveLength(2);
    expect(messages[0].type).toBe("a");
    expect(messages[1].type).toBe("b");
  });

  it("starts empty", () => {
    const { messages } = createCollectorWritableStream();
    expect(messages).toHaveLength(0);
  });
});

describe("createCallbackWritableStream", () => {
  it("calls onWrite for each chunk", async () => {
    const received: string[] = [];
    const writable = createCallbackWritableStream((chunk) => {
      received.push(chunk.type);
    });
    const writer = writable.getWriter();
    await writer.write(msg("ping"));
    await writer.write(msg("pong"));
    await writer.close();

    expect(received).toEqual(["ping", "pong"]);
  });

  it("calls onClose when closed", async () => {
    const onClose = vi.fn();
    const writable = createCallbackWritableStream(vi.fn(), onClose);
    const writer = writable.getWriter();
    await writer.close();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
