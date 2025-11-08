# smart-logging

Zero-setup console interception for Node.js. Install it, import it once at startup, and every `console.log`, `console.error`, etc. automatically routes through [Pino](https://github.com/pinojs/pino) with pretty output, timestamps, and file/line metadata. No manual logger wiring required.

Optional tag helpers (`addTag`, `clearTags`) let you stamp logs with request IDs or any metadata you need.

## Install

```bash
npm install smart-logging
# or
yarn add smart-logging
# or
pnpm add smart-logging
```

## Usage

### ESM

```javascript
import 'smart-logging';
// Optional helpers
import { addTag, clearTags } from 'smart-logging';

addTag({ requestId: 'req-123' });
console.log('This will include the requestId, timestamp, and file info');
clearTags();
```

### CommonJS

```javascript
require('smart-logging');
const { addTag, clearTags } = require('smart-logging');

addTag({ userId: 'user-42' });
console.error(new Error('Oops!'));
clearTags();
```

That single import is all you need—every built-in console method is monkey-patched once so your app logs are structured and pretty everywhere.

## Features

- Automatic console interception (`log`, `info`, `warn`, `error`, `debug`)
- Pretty printed output (via `pino-pretty`) with timestamps and file:line
- Async context support using `AsyncLocalStorage`
- `addTag(metadata)` to attach request IDs, user IDs, feature flags, etc.
- `clearTags()` to reset metadata when a request ends
- Works with both ESM `import` and CommonJS `require`

## Tags / Metadata

Use `addTag` to merge metadata into the current async context. Values must be strings, numbers, booleans, or `null`; anything else throws.

```javascript
addTag({ requestId: 'req-9000', plan: 'enterprise' });
console.info('Handling billing webhook');

addTag({ featureFlag: 'beta-mode' }); // merges into existing tags
console.warn('Customer enabled beta mode');

clearTags(); // resets the context for the next request
```

Tags are appended to each log line as `key: value`, making it easy to grep or pipe into log aggregators.

## Error Handling

Unhandled errors retain their stack trace and are sent through Pino with context attached. The package also registers listeners for:

- `uncaughtException`
- `unhandledRejection`
- `SIGINT` (Ctrl+C)
- `process exit`

## Contributing

PRs and issues are welcome! If you’d like to extend the logger or add integrations, open a discussion first so we can align on direction.

## License

[ISC](./LICENSE)
