/**
 * WebSocket Driver
 *
 * Refactored from the original monolithic index.ts.
 * The driver now exposes the connection's inbound data as a
 * ReadableStream<StreamMessage> and the outbound path as a
 * WritableStream<StreamMessage>, while preserving the original
 * NetworkStreamDriverAPI interface for backwards compatibility.
 */
// ── Internal Helpers ──────────────────────────────────────────────────────────
function now() {
    return Date.now();
}
function makeHandlers() {
    return new Map([
        ["open", new Set()],
        ["message", new Set()],
        ["error", new Set()],
        ["close", new Set()],
    ]);
}
// ── Factory ───────────────────────────────────────────────────────────────────
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
export function createWebSocketDriver(config) {
    let initialized = false;
    let connected = false;
    let reconnectIntervalMs = config.reconnectInterval ?? 1_000;
    let ws = null;
    let latency = -1;
    const handlers = makeHandlers();
    // Stream endpoints — populated on connect()
    let readableStream = null;
    let writableStream = null;
    const emit = (type, event) => {
        for (const handler of handlers.get(type) ?? []) {
            handler(event);
        }
    };
    const buildStreams = (socket) => {
        // Inbound: ReadableStream wrapping socket.onmessage
        readableStream = new ReadableStream({
            start(controller) {
                socket.onmessage = (event) => {
                    controller.enqueue({
                        type: "message",
                        data: event.data,
                        timestamp: now(),
                    });
                    emit("message", { type: "message", data: event.data, timestamp: now() });
                };
                socket.onerror = () => {
                    controller.error(new Error("WebSocket error"));
                    emit("error", { type: "error", data: null, timestamp: now() });
                };
                socket.onclose = () => {
                    connected = false;
                    controller.close();
                    emit("close", { type: "close", data: null, timestamp: now() });
                };
            },
            cancel() {
                socket.close();
            },
        });
        // Outbound: WritableStream wrapping socket.send
        writableStream = new WritableStream({
            write(chunk) {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify(chunk));
                }
            },
            close() {
                socket.close();
            },
        });
    };
    return {
        get readable() {
            return readableStream;
        },
        get writable() {
            return writableStream;
        },
        async initialize() {
            initialized = true;
        },
        async connect(protocol) {
            if (!initialized) {
                await this.initialize();
            }
            if (connected)
                return;
            if (protocol === "sse") {
                connected = true;
                emit("open", { type: "open", data: { protocol }, timestamp: now() });
                return;
            }
            // Fallback: no WebSocket global or no URL configured
            if (typeof globalThis.WebSocket !== "function" || !config.wsUrl) {
                connected = true;
                emit("open", {
                    type: "open",
                    data: { protocol: "websocket", fallback: true },
                    timestamp: now(),
                });
                return;
            }
            const startedAt = now();
            await new Promise((resolve, reject) => {
                ws = new WebSocket(config.wsUrl);
                if (config.authToken) {
                    // Auth via first message after open (header injection not possible in browser WS)
                }
                ws.onopen = () => {
                    connected = true;
                    latency = Math.max(0, now() - startedAt);
                    buildStreams(ws);
                    emit("open", { type: "open", data: { protocol }, timestamp: now() });
                    resolve();
                };
                ws.onerror = () => {
                    emit("error", { type: "error", data: null, timestamp: now() });
                    reject(new Error("WebSocket connection failed"));
                };
            });
        },
        async disconnect() {
            if (!connected && !ws)
                return;
            if (ws) {
                ws.close();
                ws = null;
            }
            connected = false;
            readableStream = null;
            writableStream = null;
            emit("close", { type: "close", data: null, timestamp: now() });
        },
        async send(message) {
            if (!connected) {
                throw new Error("Stream is not connected");
            }
            if (!ws) {
                // Fallback mode: emit locally
                emit("message", message);
                return;
            }
            ws.send(JSON.stringify(message));
        },
        on(type, handler) {
            handlers.get(type)?.add(handler);
        },
        off(type, handler) {
            handlers.get(type)?.delete(handler);
        },
        isConnected() {
            return connected;
        },
        getLatency() {
            return latency;
        },
        setReconnectInterval(ms) {
            reconnectIntervalMs = Math.max(0, ms);
            void reconnectIntervalMs;
        },
        async destroy() {
            await this.disconnect();
            initialized = false;
            handlers.forEach((s) => s.clear());
            reconnectIntervalMs = 0;
        },
    };
}
/**
 * Alias preserving the original factory name for backwards compatibility.
 * Existing consumers of `createNetworkStreamDriver` continue to work unchanged.
 */
export const createNetworkStreamDriver = createWebSocketDriver;
//# sourceMappingURL=websocket-driver.js.map