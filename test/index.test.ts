import { describe, expect, it } from "vitest";
import { createNetworkStreamDriver } from "../src/index";

describe("network-stream", () => {
  it("supports fallback connect/send/disconnect lifecycle", async () => {
    const driver = createNetworkStreamDriver({});
    const received: string[] = [];
    driver.on("open", () => received.push("open"));
    driver.on("message", () => received.push("message"));
    driver.on("close", () => received.push("close"));

    await driver.initialize();
    await driver.connect("websocket");
    expect(driver.isConnected()).toBe(true);
    await driver.send({ type: "ping", data: 1, timestamp: Date.now() });
    await driver.disconnect();

    expect(received).toContain("open");
    expect(received).toContain("message");
    expect(received).toContain("close");
  });

  it("fails send when disconnected", async () => {
    const driver = createNetworkStreamDriver({});
    await expect(driver.send({ type: "x", data: null, timestamp: Date.now() })).rejects.toThrow();
  });
});
