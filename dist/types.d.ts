/**
 * Network Stream Driver — Type Definitions
 * Aligned with WHATWG Streams API specification
 */
export type StreamProtocol = "websocket" | "sse";
export type StreamEventType = "open" | "message" | "error" | "close";
export interface StreamMessage {
    type: string;
    data: unknown;
    timestamp: number;
}
export type StreamEventHandler = (event: StreamMessage) => void;
/** A chunk with a known byte length, compatible with ByteLengthQueuingStrategy */
export interface ByteLengthChunk {
    byteLength: number;
}
/** Union of supported chunk types in OBIX streams */
export type StreamChunk = StreamMessage | Uint8Array | string;
/** Mirrors the WHATWG QueuingStrategy<T> shape */
export interface ObixQueuingStrategy<T = StreamChunk> {
    highWaterMark?: number;
    size?: (chunk: T) => number;
}
export interface ByteStreamConfig {
    /** Minimum number of bytes to request per pull, default 1 */
    chunkSize?: number;
    /** High water mark for the byte stream's internal queue */
    highWaterMark?: number;
    /** Called when stream is started */
    onStart?: () => void;
    /** Called when the consumer requests more data */
    onPull?: (controller: ReadableByteStreamController) => void | Promise<void>;
    /** Called when the stream is cancelled */
    onCancel?: (reason?: unknown) => void;
}
export interface NetworkStreamDriverConfig {
    /** WebSocket URL */
    wsUrl?: string;
    /** Server-Sent Events URL */
    sseUrl?: string;
    /** Reconnection interval in milliseconds */
    reconnectInterval?: number;
    /** Authorization token for secure connections */
    authToken?: string;
    /** Inbound queueing strategy (backpressure) */
    readStrategy?: ObixQueuingStrategy<StreamMessage>;
    /** Outbound queueing strategy (backpressure) */
    writeStrategy?: ObixQueuingStrategy<StreamMessage>;
}
export interface NetworkStreamDriverAPI {
    /** Initialize network stream driver */
    initialize(): Promise<void>;
    /** Connect to a stream */
    connect(protocol: StreamProtocol): Promise<void>;
    /** Disconnect from stream */
    disconnect(): Promise<void>;
    /** Send a message */
    send(message: StreamMessage): Promise<void>;
    /** Register event listener */
    on(type: StreamEventType, handler: StreamEventHandler): void;
    /** Remove event listener */
    off(type: StreamEventType, handler: StreamEventHandler): void;
    /** Check connection status */
    isConnected(): boolean;
    /** Get latency in milliseconds */
    getLatency(): number;
    /** Set reconnection strategy */
    setReconnectInterval(ms: number): void;
    /** Destroy the driver */
    destroy(): Promise<void>;
}
export interface SSEDriverConfig {
    url: string;
    authToken?: string;
    /** High water mark for the inbound ReadableStream */
    highWaterMark?: number;
}
//# sourceMappingURL=types.d.ts.map