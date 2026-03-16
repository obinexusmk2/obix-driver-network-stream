/**
 * @obinexusltd/obix-driver-network-stream
 *
 * WebSocket / SSE driver with full WHATWG Web Streams API integration.
 * All public APIs are re-exported from focused sub-modules.
 */

// Types
export type {
  StreamProtocol,
  StreamEventType,
  StreamMessage,
  StreamEventHandler,
  ByteLengthChunk,
  StreamChunk,
  ObixQueuingStrategy,
  ByteStreamConfig,
  NetworkStreamDriverConfig,
  NetworkStreamDriverAPI,
  SSEDriverConfig,
} from "./types.js";

// Backpressure / Queueing strategies
export {
  countSize,
  byteSize,
  stringSize,
  createCountStrategy,
  createByteLengthStrategy,
  resolveStrategy,
} from "./backpressure.js";

// ReadableStream wrappers
export type { MessageSource } from "./readable-stream.js";
export {
  createMessageReadableStream,
  createArrayReadableStream,
  createIterableReadableStream,
} from "./readable-stream.js";

// WritableStream wrappers
export type { MessageSink } from "./writable-stream.js";
export {
  createMessageWritableStream,
  createCollectorWritableStream,
  createCallbackWritableStream,
} from "./writable-stream.js";

// TransformStream utilities
export {
  createJsonTransformStream,
  createTimestampTransformStream,
  createFilterTransformStream,
  createMapTransformStream,
  createMessageEncoderStream,
} from "./transform-stream.js";

// Pipe chain helpers
export {
  pipeMessageStream,
  transformMessageStream,
  transformMessageStreamTo,
  teeMessageStream,
  composeTransforms,
} from "./pipe-chain.js";

// Byte stream utilities
export {
  createByteReadableStream,
  readExactBytes,
  concatByteStream,
} from "./byte-stream.js";

// WebSocket driver (includes backwards-compat alias createNetworkStreamDriver)
export {
  createWebSocketDriver,
  createNetworkStreamDriver,
} from "./websocket-driver.js";

// SSE driver
export {
  createSSEReadableStream,
  createNamedSSEStream,
} from "./sse-driver.js";
