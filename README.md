# @obinexusltd/obix-driver-network-stream

WebSocket and Server-Sent Events driver for the OBIX SDK, built on the [WHATWG Streams API](https://streams.spec.whatwg.org/). Provides typed wrappers for `ReadableStream`, `WritableStream`, and `TransformStream` with backpressure, pipe chains, and byte stream support.

## Installation

```bash
npm install @obinexusltd/obix-driver-network-stream
```

## Quick Start

```ts
import { createNetworkStreamDriver } from '@obinexusltd/obix-driver-network-stream';

const driver = createNetworkStreamDriver({ wsUrl: 'wss://api.example.com/ws' });

driver.on('message', (msg) => console.log(msg));
driver.on('open', () => console.log('connected'));

await driver.initialize();
await driver.connect('websocket');

await driver.send({ type: 'ping', data: null, timestamp: Date.now() });
await driver.destroy();
```

---

## API Reference

### Driver

#### `createNetworkStreamDriver(config)` / `createWebSocketDriver(config)`

Creates the main driver implementing `NetworkStreamDriverAPI`. Both names are identical — `createNetworkStreamDriver` is the backwards-compatible alias.

```ts
interface NetworkStreamDriverConfig {
  wsUrl?: string;           // WebSocket endpoint
  sseUrl?: string;          // SSE endpoint
  reconnectInterval?: number; // ms, default 1000
  authToken?: string;
  readStrategy?: ObixQueuingStrategy<StreamMessage>;
  writeStrategy?: ObixQueuingStrategy<StreamMessage>;
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `initialize()` | Initialise the driver |
| `connect(protocol)` | Connect via `'websocket'` or `'sse'` |
| `disconnect()` | Close the connection |
| `send(message)` | Send a `StreamMessage` |
| `on(type, handler)` | Subscribe to `open`, `message`, `error`, `close` |
| `off(type, handler)` | Unsubscribe |
| `isConnected()` | Returns `boolean` |
| `getLatency()` | Returns round-trip latency in ms |
| `setReconnectInterval(ms)` | Update reconnect interval |
| `destroy()` | Disconnect and clear all handlers |

The driver also exposes Web Streams endpoints after `connect()`:

```ts
const driver = createWebSocketDriver(config);
await driver.connect('websocket');

const reader = driver.readable?.getReader(); // ReadableStream<StreamMessage>
const writer = driver.writable?.getWriter(); // WritableStream<StreamMessage>
```

---

### ReadableStream Wrappers

```ts
import {
  createMessageReadableStream,
  createArrayReadableStream,
  createIterableReadableStream,
} from '@obinexusltd/obix-driver-network-stream';
```

#### `createMessageReadableStream(source, strategy?)`

Wraps any `MessageSource` (WebSocket, EventSource) into a `ReadableStream<StreamMessage>`.

```ts
const ws = new WebSocket('wss://example.com');
const readable = createMessageReadableStream(ws);
const reader = readable.getReader();
const { value } = await reader.read();
```

#### `createArrayReadableStream(messages, strategy?)`

Streams a static array — useful for testing.

#### `createIterableReadableStream(asyncIterable, strategy?)`

Converts an async generator or iterable into a `ReadableStream<StreamMessage>`.

---

### WritableStream Wrappers

```ts
import {
  createMessageWritableStream,
  createCollectorWritableStream,
  createCallbackWritableStream,
} from '@obinexusltd/obix-driver-network-stream';
```

#### `createMessageWritableStream(sink, strategy?)`

Wraps a `MessageSink` (WebSocket) into a `WritableStream<StreamMessage>`. Chunks are JSON-serialised before sending.

#### `createCollectorWritableStream(strategy?)`

Returns `{ writable, messages }`. All written chunks accumulate in `messages`.

```ts
const { writable, messages } = createCollectorWritableStream();
await readable.pipeTo(writable);
console.log(messages); // StreamMessage[]
```

#### `createCallbackWritableStream(onWrite, onClose?, strategy?)`

Calls `onWrite` per chunk and optionally `onClose` when the stream closes.

---

### TransformStream Utilities

```ts
import {
  createJsonTransformStream,
  createTimestampTransformStream,
  createFilterTransformStream,
  createMapTransformStream,
  createMessageEncoderStream,
} from '@obinexusltd/obix-driver-network-stream';
```

#### `createJsonTransformStream(writableStrategy?, readableStrategy?)`

Parses raw JSON strings into `StreamMessage` objects.

```ts
rawReadable
  .pipeThrough(createJsonTransformStream())
  .pipeTo(writable);
```

#### `createTimestampTransformStream(maxAgeMs?, ...)`

Stamps each chunk with the current time if the timestamp is missing or older than `maxAgeMs`.

#### `createFilterTransformStream(predicate, ...)`

Only passes chunks where `predicate(chunk)` returns `true`.

#### `createMapTransformStream(mapper, ...)`

Transforms each chunk using `mapper`.

#### `createMessageEncoderStream(...)`

Encodes `StreamMessage → Uint8Array` (UTF-8 JSON).

---

### Pipe Chain Helpers

```ts
import {
  pipeMessageStream,
  transformMessageStream,
  transformMessageStreamTo,
  teeMessageStream,
  composeTransforms,
} from '@obinexusltd/obix-driver-network-stream';
```

#### `pipeMessageStream(readable, writable, options?)`

Typed wrapper for `readable.pipeTo(writable)`.

#### `transformMessageStream(readable, transform, options?)`

Typed wrapper for `readable.pipeThrough(transform)`.

#### `teeMessageStream(readable)`

Splits a stream into two branches, each receiving all chunks.

```ts
const [branch1, branch2] = teeMessageStream(readable);
branch1.pipeTo(logger);
branch2.pipeTo(processor);
```

#### `composeTransforms(readable, transforms[])`

Chains multiple `TransformStream` stages in sequence.

```ts
const pipeline = composeTransforms(readable, [
  createFilterTransformStream((m) => m.type === 'telemetry'),
  createTimestampTransformStream(5000),
  createMapTransformStream(normalise),
]);
await pipeline.pipeTo(writable);
```

---

### Backpressure

```ts
import {
  createCountStrategy,
  createByteLengthStrategy,
  resolveStrategy,
} from '@obinexusltd/obix-driver-network-stream';
```

#### `createCountStrategy(highWaterMark?)`

Returns a `CountQueuingStrategy`. Each chunk counts as 1 unit.

#### `createByteLengthStrategy(highWaterMark?)`

Returns a `ByteLengthQueuingStrategy`. Each chunk is sized by `.byteLength`.

#### `resolveStrategy(strategy?)`

Converts an `ObixQueuingStrategy` descriptor into a native `QueuingStrategy`.

```ts
const readable = createArrayReadableStream(messages, {
  highWaterMark: 16,
  size: () => 1,
});
```

---

### Byte Streams

```ts
import {
  createByteReadableStream,
  readExactBytes,
  concatByteStream,
} from '@obinexusltd/obix-driver-network-stream';
```

#### `createByteReadableStream(config)`

Creates a `ReadableStream<Uint8Array>` with `ReadableByteStreamController`. Supports BYOB readers for zero-copy reads.

```ts
const stream = createByteReadableStream({
  chunkSize: 4096,
  highWaterMark: 65536,
  onPull: async (controller) => {
    const chunk = await fetchNextChunk();
    if (chunk) controller.enqueue(chunk);
    else controller.close();
  },
});

// BYOB read
const reader = stream.getReader({ mode: 'byob' });
const buf = new Uint8Array(4096);
const { value } = await reader.read(buf);
```

#### `readExactBytes(stream, length)`

Reads exactly `length` bytes using a BYOB reader.

#### `concatByteStream(stream)`

Drains the entire stream into a single `Uint8Array`.

---

### SSE Driver

```ts
import {
  createSSEReadableStream,
  createNamedSSEStream,
} from '@obinexusltd/obix-driver-network-stream';
```

#### `createSSEReadableStream(config)`

Wraps `EventSource` into a `ReadableStream<StreamMessage>`.

```ts
const events = createSSEReadableStream({ url: '/api/events', highWaterMark: 4 });
for await (const msg of events) {
  console.log(msg);
}
```

#### `createNamedSSEStream(config, eventName)`

Listens for a specific SSE event name (e.g. `event: telemetry`).

---

## Compatibility

All stream primitives target browsers and Node.js environments that implement the WHATWG Streams API:

| Feature | Minimum |
|---------|---------|
| `ReadableStream` | Chrome 43, Firefox 65, Node 18 |
| `WritableStream` | Chrome 59, Firefox 100, Node 18 |
| `TransformStream` | Chrome 67, Firefox 102, Node 18 |
| BYOB readers | Chrome 61, Node 18 |

---

## License

MIT — OBINexus &lt;okpalan@protonmail.com&gt;
