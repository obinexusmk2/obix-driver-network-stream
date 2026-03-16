/**
 * WebSocket Driver
 *
 * Refactored from the original monolithic index.ts.
 * The driver now exposes the connection's inbound data as a
 * ReadableStream<StreamMessage> and the outbound path as a
 * WritableStream<StreamMessage>, while preserving the original
 * NetworkStreamDriverAPI interface for backwards compatibility.
 */
import type { StreamMessage, NetworkStreamDriverConfig, NetworkStreamDriverAPI } from "./types.js";
/**
 * Creates a NetworkStreamDriverAPI backed by WebSocket with full Web Streams
 * integration. The original connect/send/disconnect API is preserved for
 * backwards compatibility; additionally the driver exposes:
 *   - `readable`  — ReadableStream<StreamMessage> of inbound messages
 *   - `writable`  — WritableStream<StreamMessage> for outbound messages
 *
 * @example
 * const driver = createWebSocketDriver({ wsUrl: 'wss://example.com' });
 * await driver.connect('websocket');
 * driver.on('message', (msg) => console.log(msg));
 */
export declare function createWebSocketDriver(config: NetworkStreamDriverConfig): NetworkStreamDriverAPI & {
    readonly readable: ReadableStream<StreamMessage> | null;
    readonly writable: WritableStream<StreamMessage> | null;
};
/**
 * Alias preserving the original factory name for backwards compatibility.
 * Existing consumers of `createNetworkStreamDriver` continue to work unchanged.
 */
export declare const createNetworkStreamDriver: typeof createWebSocketDriver;
//# sourceMappingURL=websocket-driver.d.ts.map