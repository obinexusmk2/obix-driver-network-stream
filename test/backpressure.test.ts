import { describe, it, expect } from "vitest";
import {
  countSize,
  byteSize,
  stringSize,
  createCountStrategy,
  createByteLengthStrategy,
  resolveStrategy,
} from "../src/backpressure.js";
import type { StreamMessage } from "../src/types.js";

const msg: StreamMessage = { type: "test", data: null, timestamp: 0 };

describe("size functions", () => {
  it("countSize returns 1 for any message", () => {
    expect(countSize(msg)).toBe(1);
  });

  it("byteSize returns byteLength for Uint8Array", () => {
    const arr = new Uint8Array(16);
    expect(byteSize(arr)).toBe(16);
  });

  it("byteSize returns byteLength for ArrayBuffer", () => {
    const buf = new ArrayBuffer(32);
    expect(byteSize(buf)).toBe(32);
  });

  it("stringSize returns character count", () => {
    expect(stringSize("hello")).toBe(5);
    expect(stringSize("")).toBe(0);
  });
});

describe("strategy factories", () => {
  it("createCountStrategy produces a CountQueuingStrategy", () => {
    const s = createCountStrategy(4);
    expect(s).toBeInstanceOf(CountQueuingStrategy);
    expect((s as CountQueuingStrategy).highWaterMark).toBe(4);
  });

  it("createByteLengthStrategy produces a ByteLengthQueuingStrategy", () => {
    const s = createByteLengthStrategy(1024);
    expect(s).toBeInstanceOf(ByteLengthQueuingStrategy);
    expect((s as ByteLengthQueuingStrategy).highWaterMark).toBe(1024);
  });

  it("resolveStrategy uses CountQueuingStrategy by default", () => {
    const s = resolveStrategy();
    expect(s).toBeInstanceOf(CountQueuingStrategy);
  });

  it("resolveStrategy uses custom size function", () => {
    const s = resolveStrategy({ highWaterMark: 8, size: () => 2 });
    expect(s.highWaterMark).toBe(8);
    expect(typeof s.size).toBe("function");
  });
});
